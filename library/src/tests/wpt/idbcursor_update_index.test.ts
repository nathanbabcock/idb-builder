/**
 * IDBCursor.update() - index Tests
 *
 * Ported from WPT idbcursor_update_index.any.js
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbcursor_update_index.any.js
 */

import './wpt-setup'
import { expect, test } from 'vitest'
import { openDB } from '../../lib/idb-adapter'
import { createMigrations } from '../../lib/migration-builder'
import { schema } from '../../lib/schema'

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbcursor_update_index.any.js#L23-L64
 */
test('Modify a record in the object store via index cursor', async () => {
  const migrations = createMigrations().version(1, v =>
    v
      .createObjectStore({
        name: 'test',
        schema: schema<{ pKey: string; iKey: string }>(),
        primaryKey: 'pKey',
      })
      .createIndex('index', {
        storeName: 'test',
        keyPath: 'iKey',
      })
  )

  const records = [
    { pKey: 'primaryKey_0', iKey: 'indexKey_0' },
    { pKey: 'primaryKey_1', iKey: 'indexKey_1' },
  ]

  const db = await openDB('test-db', migrations)

  for (const record of records) {
    await db.add('test', record)
  }

  // Update the first record via index cursor
  const tx1 = db.transaction('test', 'readwrite')
  const store1 = tx1.objectStore('test')
  const index1 = store1.index('index')

  const cursor = await index1.openCursor()
  expect(cursor).not.toBeNull()

  const updatedValue = {
    ...cursor!.value,
    iKey: cursor!.value.iKey + '_updated',
  }
  await cursor!.update(updatedValue)

  await tx1.done

  // Verify the update
  const tx2 = db.transaction('test', 'readonly')
  const store2 = tx2.objectStore('test')

  const verifyCursor = await store2.openCursor()
  expect(verifyCursor).not.toBeNull()
  expect(verifyCursor!.value.iKey).toBe('indexKey_0_updated')

  await tx2.done
  db.close()
})

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbcursor_update_index.any.js#L66-L91
 */
test('Attempt to modify a record in a read-only transaction via index', async () => {
  const migrations = createMigrations().version(1, v =>
    v
      .createObjectStore({
        name: 'test',
        schema: schema<{ pKey: string; iKey: string }>(),
        primaryKey: 'pKey',
      })
      .createIndex('index', {
        storeName: 'test',
        keyPath: 'iKey',
      })
  )

  const records = [
    { pKey: 'primaryKey_0', iKey: 'indexKey_0' },
    { pKey: 'primaryKey_1', iKey: 'indexKey_1' },
  ]

  const db = await openDB('test-db', migrations)

  for (const record of records) {
    await db.add('test', record)
  }

  const tx = db.transaction('test', 'readonly')
  const store = tx.objectStore('test')
  const index = store.index('index')

  const cursor = await index.openCursor()
  expect(cursor).not.toBeNull()

  expect(() => {
    // @ts-expect-error Testing runtime error when calling delete on readonly cursor
    cursor!.update(cursor!.value)
  }).toThrow(expect.objectContaining({ name: 'ReadOnlyError' }))

  db.close()
})

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbcursor_update_index.any.js#L266-L320
 */
test('Modify records during cursor iteration and verify updated records', async () => {
  const migrations = createMigrations().version(1, v =>
    v
      .createObjectStore({
        name: 'test',
        schema: schema<{ pKey: string; iKey: number }>(),
        primaryKey: 'pKey',
      })
      .createIndex('index', {
        storeName: 'test',
        keyPath: 'iKey',
      })
  )

  const records = [
    { pKey: 'primaryKey_1', iKey: 1 },
    { pKey: 'primaryKey_2', iKey: 2 },
    { pKey: 'primaryKey_3', iKey: 3 },
  ]

  const db = await openDB('test-db', migrations)

  for (const record of records) {
    await db.add('test', record)
  }

  // Iterate and increment iKey values until they exceed the bound
  const tx1 = db.transaction('test', 'readwrite')
  const store1 = tx1.objectStore('test')
  const index1 = store1.index('index')

  let cursor = await index1.openCursor(IDBKeyRange.upperBound(9))
  while (cursor) {
    const record = { ...cursor.value, iKey: cursor.value.iKey + 1 }
    await cursor.update(record)
    cursor = await cursor.continue()
  }

  await tx1.done

  // Verify the updates
  const results = await db.getAll('test')
  // Each record's iKey should have been incremented until it reached or exceeded 10
  expect(results.map(r => r.iKey)).toEqual([10, 10, 10])

  db.close()
})

/**
 * Test updating via key cursor (should fail)
 */
test('Update multiple records via index cursor', async () => {
  const migrations = createMigrations().version(1, v =>
    v
      .createObjectStore({
        name: 'test',
        schema: schema<{ pKey: string; iKey: string; value: number }>(),
        primaryKey: 'pKey',
      })
      .createIndex('index', {
        storeName: 'test',
        keyPath: 'iKey',
      })
  )

  const db = await openDB('test-db', migrations)

  for (let i = 0; i < 5; i++) {
    await db.add('test', { pKey: `pkey_${i}`, iKey: `ikey_${i}`, value: i })
  }

  // Double all values via index cursor
  const tx1 = db.transaction('test', 'readwrite')
  const store1 = tx1.objectStore('test')
  const index1 = store1.index('index')

  let cursor = await index1.openCursor()
  while (cursor) {
    const updatedValue = { ...cursor.value, value: cursor.value.value * 2 }
    await cursor.update(updatedValue)
    cursor = await cursor.continue()
  }

  await tx1.done

  // Verify the updates
  const results = await db.getAll('test')
  expect(results.map(r => r.value)).toEqual([0, 2, 4, 6, 8])

  db.close()
})

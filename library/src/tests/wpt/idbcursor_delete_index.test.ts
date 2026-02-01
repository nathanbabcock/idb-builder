/**
 * IDBCursor.delete() - index Tests
 *
 * Ported from WPT idbcursor_delete_index.any.js
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbcursor_delete_index.any.js
 */

import './wpt-setup'
import { expect, test } from 'vitest'
import { openDB } from '../../lib/idb-adapter'
import { createMigrations } from '../../lib/migration-builder'
import { schema } from '../../lib/schema'

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbcursor_delete_index.any.js#L25-L75
 */
test('Remove a record from the object store via index cursor', async () => {
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

  // Delete the first record via index cursor
  const tx1 = db.transaction('test', 'readwrite')
  const store1 = tx1.objectStore('test')
  const index1 = store1.index('index')

  const cursor = await index1.openCursor()
  expect(cursor).not.toBeNull()

  await cursor!.delete()

  await tx1.done

  // Verify the deletion
  const tx2 = db.transaction('test', 'readonly')
  const store2 = tx2.objectStore('test')

  const remaining: Array<{ pKey: string; iKey: string }> = []
  let verifyCursor = await store2.openCursor()
  while (verifyCursor) {
    remaining.push(verifyCursor.value)
    verifyCursor = await verifyCursor.continue()
  }

  await tx2.done

  expect(remaining.length).toBe(1)
  expect(remaining[0].pKey).toBe('primaryKey_1')
  expect(remaining[0].iKey).toBe('indexKey_1')

  db.close()
})

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbcursor_delete_index.any.js#L77-L101
 */
test('Attempt to remove a record in a read-only transaction via index', async () => {
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
    cursor!.delete()
  }).toThrow(expect.objectContaining({ name: 'ReadOnlyError' }))

  db.close()
})

/**
 * Test deleting multiple records via index cursor
 */
test('Delete multiple records via index cursor', async () => {
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

  // Delete all even-valued records via index cursor
  const tx1 = db.transaction('test', 'readwrite')
  const store1 = tx1.objectStore('test')
  const index1 = store1.index('index')

  let cursor = await index1.openCursor()
  while (cursor) {
    if (cursor.value.value % 2 === 0) {
      await cursor.delete()
    }
    cursor = await cursor.continue()
  }

  await tx1.done

  // Verify the deletions
  const results = await db.getAll('test')
  expect(results.map(r => r.value)).toEqual([1, 3])

  db.close()
})

/**
 * Test deleting while iterating index in reverse
 */
test('Delete via index cursor in reverse direction', async () => {
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

  const db = await openDB('test-db', migrations)

  for (let i = 0; i < 5; i++) {
    await db.add('test', { pKey: `pkey_${i}`, iKey: `ikey_${i}` })
  }

  // Delete the last record (ikey_4) via reverse cursor
  const tx = db.transaction('test', 'readwrite')
  const store = tx.objectStore('test')
  const index = store.index('index')

  const cursor = await index.openCursor(null, 'prev')
  expect(cursor).not.toBeNull()
  expect(cursor!.value.iKey).toBe('ikey_4')

  await cursor!.delete()

  await tx.done

  // Verify the deletion
  const remaining = await db.getAll('test')
  expect(remaining.length).toBe(4)
  expect(remaining.map(r => r.iKey)).toEqual([
    'ikey_0',
    'ikey_1',
    'ikey_2',
    'ikey_3',
  ])

  db.close()
})

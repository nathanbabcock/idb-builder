/**
 * IDBCursor.update() - object store Tests
 *
 * Ported from WPT idbcursor_update_objectstore.any.js
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbcursor_update_objectstore.any.js
 */

import './wpt-setup'
import { expect, test } from 'vitest'
import { openDB } from '../../lib/idb-adapter'
import { createMigrations } from '../../lib/migration-builder'
import { schema } from '../../lib/schema'

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbcursor_update_objectstore.any.js#L23-L57
 */
test('Modify a record in the object store', async () => {
  const migrations = createMigrations().version(1, v =>
    v.createObjectStore({
      name: 'test',
      schema: schema<{ pKey: string; data?: string }>(),
      primaryKey: 'pKey',
    })
  )

  const records = [{ pKey: 'primaryKey_0' }, { pKey: 'primaryKey_1' }]

  const db = await openDB('test-db', migrations)

  for (const record of records) {
    await db.add('test', record)
  }

  // Update the first record via cursor
  const tx1 = db.transaction('test', 'readwrite')
  const store1 = tx1.objectStore('test')

  const cursor = await store1.openCursor()
  expect(cursor).not.toBeNull()

  const updatedValue = { ...cursor!.value, data: 'New information!' }
  await cursor!.update(updatedValue)

  await tx1.done

  // Verify the update
  const tx2 = db.transaction('test', 'readonly')
  const store2 = tx2.objectStore('test')

  const verifyCursor = await store2.openCursor()
  expect(verifyCursor).not.toBeNull()
  expect(verifyCursor!.value.data).toBe('New information!')

  await tx2.done
  db.close()
})

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbcursor_update_objectstore.any.js#L59-L82
 */
test('Attempt to modify a record in a read-only transaction', async () => {
  const migrations = createMigrations().version(1, v =>
    v.createObjectStore({
      name: 'test',
      schema: schema<{ pKey: string; iKey: string }>(),
      primaryKey: 'pKey',
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

  const cursor = await store.openCursor()
  expect(cursor).not.toBeNull()

  expect(() => {
    // @ts-expect-error Testing runtime error when calling delete on readonly cursor
    cursor!.update(cursor!.value)
  }).toThrow(expect.objectContaining({ name: 'ReadOnlyError' }))

  db.close()
})

/**
 * Test updating multiple records via cursor
 */
test('Update multiple records via cursor', async () => {
  const migrations = createMigrations().version(1, v =>
    v.createObjectStore({
      name: 'test',
      schema: schema<{ pKey: string; value: number }>(),
      primaryKey: 'pKey',
    })
  )

  const db = await openDB('test-db', migrations)

  for (let i = 0; i < 5; i++) {
    await db.add('test', { pKey: `key_${i}`, value: i })
  }

  // Double all values via cursor
  const tx1 = db.transaction('test', 'readwrite')
  const store1 = tx1.objectStore('test')

  let cursor = await store1.openCursor()
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

/**
 * Test updating record with new field
 */
test('Update record by adding a new field', async () => {
  const migrations = createMigrations().version(1, v =>
    v.createObjectStore({
      name: 'test',
      schema: schema<{ pKey: string; original: string; added?: string }>(),
      primaryKey: 'pKey',
    })
  )

  const db = await openDB('test-db', migrations)

  await db.add('test', { pKey: 'key1', original: 'data' })

  const tx = db.transaction('test', 'readwrite')
  const store = tx.objectStore('test')

  const cursor = await store.openCursor()
  expect(cursor).not.toBeNull()

  const updated = { ...cursor!.value, added: 'new field' }
  await cursor!.update(updated)

  await tx.done

  const result = await db.get('test', 'key1')
  expect(result?.original).toBe('data')
  expect(result?.added).toBe('new field')

  db.close()
})

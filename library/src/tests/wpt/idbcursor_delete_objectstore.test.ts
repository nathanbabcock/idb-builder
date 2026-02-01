/**
 * IDBCursor.delete() - object store Tests
 *
 * Ported from WPT idbcursor_delete_objectstore.any.js
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbcursor_delete_objectstore.any.js
 */

import './wpt-setup'
import { expect, test } from 'vitest'
import { openDB } from '../../lib/idb-adapter'
import { createMigrations } from '../../lib/migration-builder'
import { schema } from '../../lib/schema'

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbcursor_delete_objectstore.any.js#L23-L67
 */
test('Remove a record from the object store', async () => {
  const migrations = createMigrations().version(1, v =>
    v.createObjectStore({
      name: 'test',
      schema: schema<{ pKey: string }>(),
      primaryKey: 'pKey',
    })
  )

  const records = [{ pKey: 'primaryKey_0' }, { pKey: 'primaryKey_1' }]

  const db = await openDB('test-db', migrations)

  for (const record of records) {
    await db.add('test', record)
  }

  // Delete the first record via cursor
  const tx1 = db.transaction('test', 'readwrite')
  const store1 = tx1.objectStore('test')

  const cursor = await store1.openCursor()
  expect(cursor).not.toBeNull()

  await cursor!.delete()

  await tx1.done

  // Verify the deletion
  const tx2 = db.transaction('test', 'readonly')
  const store2 = tx2.objectStore('test')

  const remaining: string[] = []
  let verifyCursor = await store2.openCursor()
  while (verifyCursor) {
    remaining.push(verifyCursor.value.pKey)
    verifyCursor = await verifyCursor.continue()
  }

  await tx2.done

  expect(remaining.length).toBe(1)
  expect(remaining[0]).toBe('primaryKey_1')

  db.close()
})

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbcursor_delete_objectstore.any.js#L69-L93
 */
test('Attempt to remove a record in a read-only transaction', async () => {
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
    cursor!.delete()
  }).toThrow(expect.objectContaining({ name: 'ReadOnlyError' }))

  db.close()
})

/**
 * Test deleting multiple records via cursor
 */
test('Delete multiple records via cursor', async () => {
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

  // Delete all even-valued records via cursor
  const tx1 = db.transaction('test', 'readwrite')
  const store1 = tx1.objectStore('test')

  let cursor = await store1.openCursor()
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
 * Test deleting while iterating forwards
 */
test('Delete current record and continue iteration', async () => {
  const migrations = createMigrations().version(1, v =>
    v.createObjectStore({
      name: 'test',
      schema: schema<{ pKey: string }>(),
      primaryKey: 'pKey',
    })
  )

  const db = await openDB('test-db', migrations)

  for (let i = 0; i < 5; i++) {
    await db.add('test', { pKey: `key_${i}` })
  }

  // Delete the first record while iterating
  const tx = db.transaction('test', 'readwrite')
  const store = tx.objectStore('test')

  const visited: string[] = []
  let cursor = await store.openCursor()
  while (cursor) {
    visited.push(cursor.value.pKey)
    if (cursor.value.pKey === 'key_0') {
      await cursor.delete()
    }
    cursor = await cursor.continue()
  }

  await tx.done

  // Should have visited all 5 records
  expect(visited).toEqual(['key_0', 'key_1', 'key_2', 'key_3', 'key_4'])

  // But only 4 remain
  const remaining = await db.getAll('test')
  expect(remaining.length).toBe(4)
  expect(remaining.map(r => r.pKey)).toEqual(['key_1', 'key_2', 'key_3', 'key_4'])

  db.close()
})

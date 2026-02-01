/**
 * IDBObjectStore.delete() Tests
 *
 * Ported from WPT idbobjectstore_delete.any.js
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbobjectstore_delete.any.js
 */

import './wpt-setup'
import { expect, test } from 'vitest'
import { openDB } from '../../lib/idb-adapter'
import { createMigrations } from '../../lib/migration-builder'
import { schema } from '../../lib/schema'

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbobjectstore_delete.any.js#L8-L42
 */
test('delete() removes record (inline keys)', async () => {
  const record = { key: 1, property: 'data' }

  const migrations = createMigrations().version(1, v =>
    v.createObjectStore({
      name: 'test',
      schema: schema<{ key: number; property: string }>(),
      primaryKey: 'key',
    })
  )

  const db = await openDB('test-db', migrations)
  await db.add('test', record)

  // Delete the record
  await db.delete('test', record.key)

  // Verify record is removed
  const result = await db.get('test', record.key)
  expect(result).toBe(undefined)

  db.close()
})

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbobjectstore_delete.any.js#L44-L57
 */
test("delete() key doesn't match any records", async () => {
  const migrations = createMigrations().version(1, v =>
    v.createObjectStore({
      name: 'test',
      schema: schema<{ property: string }>(),
    })
  )

  const db = await openDB('test-db', migrations)

  // Delete a non-existent key - should succeed without error
  await db.delete('test', 1)

  db.close()
})

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbobjectstore_delete.any.js#L59-L94
 */
test("Object store's key path is an object attribute", async () => {
  const record = { test: { obj: { key: 1 } }, property: 'data' }

  const migrations = createMigrations().version(1, v =>
    v.createObjectStore({
      name: 'test',
      schema: schema<{ test: { obj: { key: number } }; property: string }>(),
      primaryKey: 'test.obj.key',
    })
  )

  const db = await openDB('test-db', migrations)
  await db.add('test', record)

  // Delete the record
  await db.delete('test', record.test.obj.key)

  // Verify record is removed
  const result = await db.get('test', record.test.obj.key)
  expect(result).toBe(undefined)

  db.close()
})

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbobjectstore_delete.any.js#L96-L131
 */
test('delete() removes record (out-of-line keys)', async () => {
  const key = 1
  const record = { property: 'data' }

  const migrations = createMigrations().version(1, v =>
    v.createObjectStore({
      name: 'test',
      schema: schema<{ property: string }>(),
    })
  )

  const db = await openDB('test-db', migrations)
  await db.add('test', record, key)

  // Delete the record
  await db.delete('test', key)

  // Verify record is removed
  const result = await db.get('test', key)
  expect(result).toBe(undefined)

  db.close()
})

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbobjectstore_delete.any.js#L133-L156
 */
test('delete() removes all of the records in the range', async () => {
  const migrations = createMigrations().version(1, v =>
    v.createObjectStore({
      name: 'store',
      schema: schema<string>(),
    })
  )

  const db = await openDB('test-db', migrations)

  // Add 10 records
  for (let i = 0; i < 10; i++) {
    await db.add('store', `data${i}`, i)
  }

  // Delete records with keys 3-6
  await db.delete('store', IDBKeyRange.bound(3, 6))

  // Verify count is now 6 (10 - 4 deleted)
  const count = await db.count('store')
  expect(count).toBe(6)

  db.close()
})

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbobjectstore_delete.any.js#L158-L182
 */
test('If the transaction this IDBObjectStore belongs to has its mode set to readonly, throw ReadOnlyError', async () => {
  const migrations = createMigrations().version(1, v =>
    v.createObjectStore({
      name: 'store',
      schema: schema<{ pKey: string }>(),
      primaryKey: 'pKey',
    })
  )

  const db = await openDB('test-db', migrations)

  // Add some records first
  await db.add('store', { pKey: 'primaryKey_0' })
  await db.add('store', { pKey: 'primaryKey_1' })

  const tx = db.transaction('store', 'readonly')
  const store = tx.objectStore('store')

  expect(() => {
    // @ts-expect-error - readonly transaction doesn't allow delete
    store.delete('primaryKey_0')
  }).toThrow(expect.objectContaining({ name: 'ReadOnlyError' }))

  db.close()
})

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbobjectstore_delete.any.js#L184-L199
 */
test.skip('If the object store has been deleted, the implementation must throw a DOMException of type InvalidStateError', () => {
  // Wrapper doesn't allow accessing deleted object stores
})

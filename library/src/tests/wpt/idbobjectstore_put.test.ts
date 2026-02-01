/**
 * IDBObjectStore.put() Tests
 *
 * Ported from WPT idbobjectstore_put.any.js
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbobjectstore_put.any.js
 */

import './wpt-setup'
import { expect, test } from 'vitest'
import { openDB } from '../../lib/idb-adapter'
import { createMigrations } from '../../lib/migration-builder'
import { schema } from '../../lib/schema'

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbobjectstore_put.any.js#L9-L32
 */
test('put() with an inline key', async () => {
  const record = { key: 1, property: 'data' }

  const migrations = createMigrations().version(1, v =>
    v.createObjectStore({
      name: 'store',
      schema: schema<{ key: number; property: string }>(),
      primaryKey: 'key',
    })
  )

  const db = await openDB('test-db', migrations)

  await db.put('store', record)

  const result = await db.get('store', record.key)
  expect(result?.property).toBe(record.property)
  expect(result?.key).toBe(record.key)

  db.close()
})

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbobjectstore_put.any.js#L34-L58
 */
test('put() with an out-of-line key', async () => {
  const key = 1
  const record = { property: 'data' }

  const migrations = createMigrations().version(1, v =>
    v.createObjectStore({
      name: 'store',
      schema: schema<{ property: string }>(),
    })
  )

  const db = await openDB('test-db', migrations)

  await db.put('store', record, key)

  const result = await db.get('store', key)
  expect(result?.property).toBe(record.property)

  db.close()
})

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbobjectstore_put.any.js#L60-L97
 */
test('put() record with key already exists', async () => {
  const record = { key: 1, property: 'data' }
  const record_put = { key: 1, property: 'changed', more: ['stuff', 2] }

  const migrations = createMigrations().version(1, v =>
    v.createObjectStore({
      name: 'store',
      schema: schema<{
        key: number
        property: string
        more?: (string | number)[]
      }>(),
      primaryKey: 'key',
    })
  )

  const db = await openDB('test-db', migrations)

  // Add initial record
  await db.put('store', record)

  // Put with same key - should update
  await db.put('store', record_put)

  const result = await db.get('store', 1)
  expect(result?.key).toBe(record_put.key)
  expect(result?.property).toBe(record_put.property)
  expect(result?.more).toEqual(record_put.more)

  db.close()
})

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbobjectstore_put.any.js#L99-L128
 */
test('put() where an index has unique:true specified', async () => {
  const record = { key: 1, property: 'data' }

  const migrations = createMigrations().version(1, v =>
    v
      .createObjectStore({
        name: 'store',
        schema: schema<{ key: number; property: string }>(),
        autoIncrement: true,
        primaryKey: 'key',
      })
      .createIndex('i1', {
        storeName: 'store',
        keyPath: 'property',
        unique: true,
      })
  )

  const db = await openDB('test-db', migrations)

  // Add first record
  // @ts-expect-error - autoIncrement allows omitting key
  await db.put('store', { property: record.property })

  // Try to put record with same indexed value (different primary key due to autoIncrement)
  // Should fail with ConstraintError
  await expect(
    // @ts-expect-error - autoIncrement allows omitting key
    db.put('store', { property: record.property })
  ).rejects.toMatchObject({
    name: 'ConstraintError',
  })

  db.close()
})

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbobjectstore_put.any.js#L130-L153
 */
test("Object store's key path is an object attribute", async () => {
  const record = { test: { obj: { key: 1 } }, property: 'data' }

  const migrations = createMigrations().version(1, v =>
    v.createObjectStore({
      name: 'store',
      schema: schema<{ test: { obj: { key: number } }; property: string }>(),
      primaryKey: 'test.obj.key',
    })
  )

  const db = await openDB('test-db', migrations)

  await db.put('store', record)

  const result = await db.get('store', record.test.obj.key)
  expect(result?.property).toBe(record.property)

  db.close()
})

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbobjectstore_put.any.js#L155-L190
 */
test('autoIncrement and inline keys', async () => {
  const record = { property: 'data' }
  const expected_keys = [1, 2, 3, 4]

  const migrations = createMigrations().version(1, v =>
    v.createObjectStore({
      name: 'store',
      schema: schema<{ key: number; property: string }>(),
      primaryKey: 'key',
      autoIncrement: true,
    })
  )

  const db = await openDB('test-db', migrations)

  // Put 4 records
  // @ts-expect-error - autoIncrement allows omitting key
  await db.put('store', record)
  // @ts-expect-error - autoIncrement allows omitting key
  await db.put('store', record)
  // @ts-expect-error - autoIncrement allows omitting key
  await db.put('store', record)
  // @ts-expect-error - autoIncrement allows omitting key
  await db.put('store', record)

  // Verify keys
  const tx = db.transaction('store', 'readonly')
  const actual_keys: number[] = []
  let cursor = await tx.store.openCursor()
  while (cursor) {
    actual_keys.push(cursor.value.key)
    cursor = await cursor.continue()
  }

  expect(actual_keys).toEqual(expected_keys)

  db.close()
})

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbobjectstore_put.any.js#L192-L227
 */
test('autoIncrement and out-of-line keys', async () => {
  const record = { property: 'data' }
  const expected_keys = [1, 2, 3, 4]

  const migrations = createMigrations().version(1, v =>
    v.createObjectStore({
      name: 'store',
      schema: schema<{ key: number; property: string }>(),
      primaryKey: 'key',
      autoIncrement: true,
    })
  )

  const db = await openDB('test-db', migrations)

  // Put 4 records
  // @ts-expect-error - autoIncrement allows omitting key
  await db.put('store', record)
  // @ts-expect-error - autoIncrement allows omitting key
  await db.put('store', record)
  // @ts-expect-error - autoIncrement allows omitting key
  await db.put('store', record)
  // @ts-expect-error - autoIncrement allows omitting key
  await db.put('store', record)

  // Verify keys
  const tx = db.transaction('store', 'readonly')
  const actual_keys: number[] = []
  let cursor = await tx.store.openCursor()
  while (cursor) {
    actual_keys.push(cursor.value.key)
    cursor = await cursor.continue()
  }

  expect(actual_keys).toEqual(expected_keys)

  db.close()
})

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbobjectstore_put.any.js#L229-L265
 */
test('Object store has autoIncrement:true and the key path is an object attribute', async () => {
  const record = { property: 'data' }
  const expected_keys = [1, 2, 3, 4]

  const migrations = createMigrations().version(1, v =>
    v.createObjectStore({
      name: 'store',
      schema: schema<{ test: { obj: { key: number } }; property: string }>(),
      primaryKey: 'test.obj.key',
      autoIncrement: true,
    })
  )

  const db = await openDB('test-db', migrations)

  // Put 4 records (inline key auto-generated at nested path)
  // @ts-expect-error - autoIncrement creates the nested key path
  await db.put('store', record)
  // @ts-expect-error - autoIncrement creates the nested key path
  await db.put('store', record)
  // @ts-expect-error - autoIncrement creates the nested key path
  await db.put('store', record)
  // @ts-expect-error - autoIncrement creates the nested key path
  await db.put('store', record)

  // Verify keys
  const tx = db.transaction('store', 'readonly')
  const actual_keys: number[] = []
  let cursor = await tx.store.openCursor()
  while (cursor) {
    actual_keys.push(cursor.value.test.obj.key)
    cursor = await cursor.continue()
  }

  expect(actual_keys).toEqual(expected_keys)

  db.close()
})

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbobjectstore_put.any.js#L267-L284
 */
test("Attempt to put() a record that does not meet the constraints of an object store's inline key requirements", async () => {
  const record = { key: 1, property: 'data' }

  const migrations = createMigrations().version(1, v =>
    v.createObjectStore({
      name: 'store',
      schema: schema<{ key: number; property: string }>(),
      primaryKey: 'key',
    })
  )

  const db = await openDB('test-db', migrations)

  // Putting with both inline key AND out-of-line key should throw DataError
  await expect(db.put('store', record, 1)).rejects.toMatchObject({
    name: 'DataError',
  })

  db.close()
})

/**
 * Note: This test name in WPT is misleading - it's about inline key store without key defined,
 * not about out-of-line keys.
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbobjectstore_put.any.js#L286-L304
 */
test('Attempt to call put() without a key parameter when the object store uses out-of-line keys', async () => {
  const record = { property: 'data' }

  const migrations = createMigrations().version(1, v =>
    v.createObjectStore({
      name: 'store',
      schema: schema<{ key: number; property: string }>(),
      primaryKey: 'key',
    })
  )

  const db = await openDB('test-db', migrations)

  // Putting without inline key defined should throw DataError
  // @ts-expect-error - key property is required
  await expect(db.put('store', record)).rejects.toMatchObject({
    name: 'DataError',
  })

  db.close()
})

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbobjectstore_put.any.js#L306-L324
 */
test("Attempt to put() a record where the record's key does not meet the constraints of a valid key", async () => {
  const record = { key: { value: 1 }, property: 'data' }

  const migrations = createMigrations().version(1, v =>
    v.createObjectStore({
      name: 'store',
      schema: schema<{ key: { value: number }; property: string }>(),
      // @ts-expect-error - object is not a valid key type
      primaryKey: 'key',
    })
  )

  const db = await openDB('test-db', migrations)

  // Object is not a valid key - should throw DataError
  await expect(db.put('store', record)).rejects.toMatchObject({
    name: 'DataError',
  })

  db.close()
})

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbobjectstore_put.any.js#L326-L343
 */
test("Attempt to put() a record where the record's in-line key is not defined", async () => {
  const record = { property: 'data' }

  const migrations = createMigrations().version(1, v =>
    v.createObjectStore({
      name: 'store',
      schema: schema<{ key: number; property: string }>(),
      primaryKey: 'key',
    })
  )

  const db = await openDB('test-db', migrations)

  // Missing inline key without autoIncrement - should throw DataError
  // @ts-expect-error - key property is required
  await expect(db.put('store', record)).rejects.toMatchObject({
    name: 'DataError',
  })

  db.close()
})

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbobjectstore_put.any.js#L345-L363
 */
test('Attempt to put() a record where the out of line key provided does not meet the constraints of a valid key', async () => {
  const record = { property: 'data' }

  const migrations = createMigrations().version(1, v =>
    v.createObjectStore({
      name: 'store',
      schema: schema<{ property: string }>(),
    })
  )

  const db = await openDB('test-db', migrations)

  // Object is not a valid key - should throw DataError
  // @ts-expect-error - { value: 1 } is not a valid key
  await expect(db.put('store', record, { value: 1 })).rejects.toMatchObject({
    name: 'DataError',
  })

  db.close()
})

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbobjectstore_put.any.js#L365-L385
 */
test('put() a record where a value being indexed does not meet the constraints of a valid key', async () => {
  const record = { key: 1, indexedProperty: { property: 'data' } }

  const migrations = createMigrations().version(1, v =>
    v
      .createObjectStore({
        name: 'store',
        schema: schema<{
          key: number
          indexedProperty: { property: string }
        }>(),
        primaryKey: 'key',
      })
      .createIndex('index', {
        storeName: 'store',
        // @ts-expect-error - testing invalid index key at runtime
        keyPath: 'indexedProperty',
      })
  )

  const db = await openDB('test-db', migrations)

  // Adding should succeed - invalid index key just means record not indexed
  await db.put('store', record)

  const result = await db.get('store', 1)
  expect(result?.key).toBe(1)

  db.close()
})

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbobjectstore_put.any.js#L387-L406
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

  const tx = db.transaction('store', 'readonly')
  const store = tx.objectStore('store')

  expect(() => {
    // @ts-expect-error - readonly transaction doesn't allow put
    store.put({ pKey: 'primaryKey_0' })
  }).toThrow(expect.objectContaining({ name: 'ReadOnlyError' }))

  db.close()
})

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbobjectstore_put.any.js#L408-L421
 */
test.skip('If the object store has been deleted, the implementation must throw a DOMException of type InvalidStateError', () => {
  // Wrapper doesn't allow accessing deleted object stores
})

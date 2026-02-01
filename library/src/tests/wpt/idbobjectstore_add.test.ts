/**
 * IDBObjectStore.add() Tests
 *
 * Ported from WPT idbobjectstore_add.any.js
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbobjectstore_add.any.js
 */

import './wpt-setup'
import { expect, test } from 'vitest'
import { openDB } from '../../lib/idb-adapter'
import { createMigrations } from '../../lib/migration-builder'
import { schema } from '../../lib/schema'

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbobjectstore_add.any.js#L9-L32
 */
test('add() with an inline key', async () => {
  const record = { key: 1, property: 'data' }

  const migrations = createMigrations().version(1, v =>
    v.createObjectStore({
      name: 'store',
      schema: schema<{ key: number; property: string }>(),
      primaryKey: 'key',
    })
  )

  const db = await openDB('test-db', migrations)

  const tx = db.transaction('store', 'readwrite')
  await tx.store.add(record)
  await tx.done

  const result = await db.get('store', record.key)
  expect(result?.property).toBe(record.property)
  expect(result?.key).toBe(record.key)

  db.close()
})

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbobjectstore_add.any.js#L34-L58
 */
test('add() with an out-of-line key', async () => {
  const key = 1
  const record = { property: 'data' }

  const migrations = createMigrations().version(1, v =>
    v.createObjectStore({
      name: 'store',
      schema: schema<{ property: string }>(),
    })
  )

  const db = await openDB('test-db', migrations)

  const tx = db.transaction('store', 'readwrite')
  await tx.store.add(record, key)
  await tx.done

  const result = await db.get('store', key)
  expect(result?.property).toBe(record.property)

  db.close()
})

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbobjectstore_add.any.js#L60-L86
 */
test('add() record with same key already exists', async () => {
  const record = { key: 1, property: 'data' }

  const migrations = createMigrations().version(1, v =>
    v.createObjectStore({
      name: 'store',
      schema: schema<{ key: number; property: string }>(),
      primaryKey: 'key',
    })
  )

  const db = await openDB('test-db', migrations)

  // Add first record
  await db.add('store', record)

  // Try to add duplicate - should fail with ConstraintError
  await expect(db.add('store', record)).rejects.toMatchObject({
    name: 'ConstraintError',
  })

  db.close()
})

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbobjectstore_add.any.js#L88-L115
 */
test('add() where an index has unique:true specified', async () => {
  const record = { property: 'data' }

  const migrations = createMigrations().version(1, v =>
    v
      .createObjectStore({
        name: 'store',
        schema: schema<{ property: string }>(),
        autoIncrement: true,
      })
      .createIndex('i1', {
        storeName: 'store',
        keyPath: 'property',
        unique: true,
      })
  )

  const db = await openDB('test-db', migrations)

  // Add first record
  await db.add('store', record)

  // Try to add duplicate indexed value - should fail with ConstraintError
  await expect(db.add('store', record)).rejects.toMatchObject({
    name: 'ConstraintError',
  })

  db.close()
})

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbobjectstore_add.any.js#L117-L140
 */
test("add() object store's key path is an object attribute", async () => {
  const record = { test: { obj: { key: 1 } }, property: 'data' }

  const migrations = createMigrations().version(1, v =>
    v.createObjectStore({
      name: 'store',
      schema: schema<{ test: { obj: { key: number } }; property: string }>(),
      primaryKey: 'test.obj.key',
    })
  )

  const db = await openDB('test-db', migrations)

  await db.add('store', record)

  const result = await db.get('store', record.test.obj.key)
  expect(result?.property).toBe(record.property)

  db.close()
})

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbobjectstore_add.any.js#L142-L177
 */
test('add() autoIncrement and inline keys', async () => {
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

  // Add 4 records
  // @ts-expect-error - autoIncrement allows omitting key
  await db.add('store', record)
  // @ts-expect-error - autoIncrement allows omitting key
  await db.add('store', record)
  // @ts-expect-error - autoIncrement allows omitting key
  await db.add('store', record)
  // @ts-expect-error - autoIncrement allows omitting key
  await db.add('store', record)

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
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbobjectstore_add.any.js#L179-L213
 */
test('add() autoIncrement and out-of-line keys', async () => {
  const record = { property: 'data' }
  const expected_keys = [1, 2, 3, 4]

  const migrations = createMigrations().version(1, v =>
    v.createObjectStore({
      name: 'store',
      schema: schema<{ property: string }>(),
      autoIncrement: true,
    })
  )

  const db = await openDB('test-db', migrations)

  // Add 4 records (out-of-line keys auto-generated)
  await db.add('store', record)
  await db.add('store', record)
  await db.add('store', record)
  await db.add('store', record)

  // Verify keys
  const tx = db.transaction('store', 'readonly')
  const actual_keys: IDBValidKey[] = []
  let cursor = await tx.store.openCursor()
  while (cursor) {
    actual_keys.push(cursor.key)
    cursor = await cursor.continue()
  }

  expect(actual_keys).toEqual(expected_keys)

  db.close()
})

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbobjectstore_add.any.js#L215-L251
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

  // Add 4 records (inline key auto-generated at nested path)
  // @ts-expect-error - autoIncrement creates the nested key path
  await db.add('store', record)
  // @ts-expect-error - autoIncrement creates the nested key path
  await db.add('store', record)
  // @ts-expect-error - autoIncrement creates the nested key path
  await db.add('store', record)
  // @ts-expect-error - autoIncrement creates the nested key path
  await db.add('store', record)

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
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbobjectstore_add.any.js#L253-L270
 */
test("Attempt to 'add()' a record that does not meet the constraints of an object store's inline key requirements", async () => {
  const record = { key: 1, property: 'data' }

  const migrations = createMigrations().version(1, v =>
    v.createObjectStore({
      name: 'store',
      schema: schema<{ key: number; property: string }>(),
      primaryKey: 'key',
    })
  )

  const db = await openDB('test-db', migrations)

  // Adding with both inline key AND out-of-line key should throw DataError
  await expect(db.add('store', record, 1)).rejects.toMatchObject({
    name: 'DataError',
  })

  db.close()
})

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbobjectstore_add.any.js#L272-L289
 */
test("Attempt to call 'add()' without a key parameter when the object store uses out-of-line keys", async () => {
  const record = { property: 'data' }

  const migrations = createMigrations().version(1, v =>
    v.createObjectStore({
      name: 'store',
      schema: schema<{ property: string }>(),
    })
  )

  const db = await openDB('test-db', migrations)

  // Out-of-line key store without autoIncrement requires explicit key
  await expect(db.add('store', record)).rejects.toMatchObject({
    name: 'DataError',
  })

  db.close()
})

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbobjectstore_add.any.js#L291-L309
 */
test("Attempt to 'add()' a record where the record's key does not meet the constraints of a valid key", async () => {
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
  await expect(db.add('store', record)).rejects.toMatchObject({
    name: 'DataError',
  })

  db.close()
})

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbobjectstore_add.any.js#L311-L329
 */
test("Attempt to 'add()' a record where the record's in-line key is not defined", async () => {
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
  await expect(db.add('store', record)).rejects.toMatchObject({
    name: 'DataError',
  })

  db.close()
})

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbobjectstore_add.any.js#L331-L349
 */
test("Attempt to 'add()' a record where the out of line key provided does not meet the constraints of a valid key", async () => {
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
  await expect(db.add('store', record, { value: 1 })).rejects.toMatchObject({
    name: 'DataError',
  })

  db.close()
})

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbobjectstore_add.any.js#L351-L371
 */
test('add() a record where a value being indexed does not meet the constraints of a valid key', async () => {
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
  await db.add('store', record)

  const result = await db.get('store', 1)
  expect(result?.key).toBe(1)

  db.close()
})

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbobjectstore_add.any.js#L373-L393
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
    // @ts-expect-error - readonly transaction doesn't allow add
    store.add({ pKey: 'primaryKey_0' })
  }).toThrow(expect.objectContaining({ name: 'ReadOnlyError' }))

  db.close()
})

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbobjectstore_add.any.js#L395-L407
 */
test.skip('If the object store has been deleted, the implementation must throw a DOMException of type InvalidStateError', () => {
  // Wrapper doesn't allow accessing deleted object stores
})

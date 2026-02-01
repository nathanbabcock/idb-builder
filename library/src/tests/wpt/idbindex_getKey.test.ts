/**
 * IDBIndex.getKey() Tests
 *
 * Ported from WPT idbindex_getKey.any.js
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbindex_getKey.any.js
 */

import './wpt-setup'
import { expect, test } from 'vitest'
import { openDB } from '../../lib/idb-adapter'
import { createMigrations } from '../../lib/migration-builder'
import { schema } from '../../lib/schema'

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbindex_getKey.any.js#L9-L35
 */
test("getKey() returns the record's primary key", async () => {
  const migrations = createMigrations().version(1, v =>
    v
      .createObjectStore({
        name: 'store',
        schema: schema<{ key: number; indexedProperty: string }>(),
        primaryKey: 'key',
      })
      .createIndex('index', {
        storeName: 'store',
        keyPath: 'indexedProperty',
      })
  )

  const db = await openDB('test-db', migrations)
  const record = { key: 1, indexedProperty: 'data' }
  await db.add('store', record)

  const tx = db.transaction('store', 'readonly')
  const store = tx.objectStore('store')
  const index = store.index('index')

  const result = await index.getKey('data')
  expect(result).toBe(record.key)

  await tx.done
  db.close()
})

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbindex_getKey.any.js#L37-L66
 */
test("getKey() returns the record's primary key where the index contains duplicate values", async () => {
  const migrations = createMigrations().version(1, v =>
    v
      .createObjectStore({
        name: 'store',
        schema: schema<{ key: number; indexedProperty: string }>(),
        primaryKey: 'key',
      })
      .createIndex('index', {
        storeName: 'store',
        keyPath: 'indexedProperty',
      })
  )

  const db = await openDB('test-db', migrations)
  const records = [
    { key: 1, indexedProperty: 'data' },
    { key: 2, indexedProperty: 'data' },
    { key: 3, indexedProperty: 'data' },
  ]
  for (const record of records) {
    await db.add('store', record)
  }

  const tx = db.transaction('store', 'readonly')
  const store = tx.objectStore('store')
  const index = store.index('index')

  const result = await index.getKey('data')
  // Should return the first record's key (lowest primary key)
  expect(result).toBe(1)

  await tx.done
  db.close()
})

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbindex_getKey.any.js#L68-L83
 */
test("getKey() attempt to retrieve the primary key of a record that doesn't exist", async () => {
  const migrations = createMigrations().version(1, v =>
    v
      .createObjectStore({
        name: 'store',
        schema: schema<{ key: number; indexedProperty: string | number }>(),
        primaryKey: 'key',
      })
      .createIndex('index', {
        storeName: 'store',
        keyPath: 'indexedProperty',
      })
  )

  const db = await openDB('test-db', migrations)

  const tx = db.transaction('store', 'readonly')
  const store = tx.objectStore('store')
  const index = store.index('index')

  const result = await index.getKey(1)
  expect(result).toBe(undefined)

  await tx.done
  db.close()
})

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbindex_getKey.any.js#L85-L112
 */
test('getKey() returns the key of the first record within the range', async () => {
  const migrations = createMigrations().version(1, v =>
    v
      .createObjectStore({
        name: 'store',
        schema: schema<{ key: number; indexedProperty: string }>(),
        primaryKey: 'key',
      })
      .createIndex('index', {
        storeName: 'store',
        keyPath: 'indexedProperty',
      })
  )

  const db = await openDB('test-db', migrations)

  for (let i = 0; i < 10; i++) {
    await db.add('store', { key: i, indexedProperty: `data${i}` })
  }

  const tx = db.transaction('store', 'readonly')
  const store = tx.objectStore('store')
  const index = store.index('index')

  const result = await index.getKey(IDBKeyRange.bound('data4', 'data7'))
  expect(result).toBe(4)

  await tx.done
  db.close()
})

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbindex_getKey.any.js#L114-L129
 */
test('getKey() throws DataError when using invalid key', async () => {
  const migrations = createMigrations().version(1, v =>
    v
      .createObjectStore({
        name: 'store',
        schema: schema<{ key: number; indexedProperty: string }>(),
        primaryKey: 'key',
      })
      .createIndex('index', {
        storeName: 'store',
        keyPath: 'indexedProperty',
      })
  )

  const db = await openDB('test-db', migrations)

  const tx = db.transaction('store', 'readonly')
  const store = tx.objectStore('store')
  const index = store.index('index')

  // @ts-expect-error invalid key is caught at compile time
  expect(() => void index.getKey(NaN)).toThrow(
    expect.objectContaining({ name: 'DataError' })
  )

  db.close()
})

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbindex_getKey.any.js#L150-L172
 */
test('getKey() throws TransactionInactiveError on aborted transaction', async () => {
  const migrations = createMigrations().version(1, v =>
    v
      .createObjectStore({
        name: 'store',
        schema: schema<{ key: number; indexedProperty: string }>(),
        primaryKey: 'key',
      })
      .createIndex('index', {
        storeName: 'store',
        keyPath: 'indexedProperty',
      })
  )

  const db = await openDB('test-db', migrations)
  await db.add('store', { key: 1, indexedProperty: 'data' })

  const tx = db.transaction('store', 'readonly')
  const store = tx.objectStore('store')
  const index = store.index('index')

  tx.abort()

  expect(() => {
    void index.getKey('data')
  }).toThrow(expect.objectContaining({ name: 'TransactionInactiveError' }))

  await tx.done.catch(() => {})
  db.close()
})

/**
 * Convenience method test - getKeyFromIndex on db directly
 */
test('getKeyFromIndex() convenience method', async () => {
  const migrations = createMigrations().version(1, v =>
    v
      .createObjectStore({
        name: 'store',
        schema: schema<{ key: number; indexedProperty: string }>(),
        primaryKey: 'key',
      })
      .createIndex('index', {
        storeName: 'store',
        keyPath: 'indexedProperty',
      })
  )

  const db = await openDB('test-db', migrations)
  const record = { key: 1, indexedProperty: 'data' }
  await db.add('store', record)

  const result = await db.getKeyFromIndex('store', 'index', 'data')
  expect(result).toBe(record.key)

  db.close()
})

/**
 * IDBIndex.get() Tests
 *
 * Ported from WPT idbindex_get.any.js
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbindex_get.any.js
 */

import './wpt-setup'
import { expect, test } from 'vitest'
import { openDB } from '../../lib/idb-adapter'
import { createMigrations } from '../../lib/migration-builder'
import { schema } from '../../lib/schema'

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbindex_get.any.js#L9-L34
 */
test('get() returns the record', async () => {
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

  const result = await index.get(record.indexedProperty)
  expect(result?.key).toBe(record.key)

  await tx.done
  db.close()
})

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbindex_get.any.js#L36-L65
 */
test('get() returns the record where the index contains duplicate values', async () => {
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

  const result = await index.get('data')
  // Should return the first record (lowest primary key)
  expect(result?.key).toBe(1)

  await tx.done
  db.close()
})

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbindex_get.any.js#L67-L82
 */
test('get() attempts to retrieve a record that does not exist', async () => {
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

  const result = await index.get(1)
  expect(result).toBe(undefined)

  await tx.done
  db.close()
})

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbindex_get.any.js#L84-L111
 */
test('get() returns the record with the first key in the range', async () => {
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

  const result = await index.get(IDBKeyRange.bound('data4', 'data7'))
  expect(result?.key).toBe(4)
  expect(result?.indexedProperty).toBe('data4')

  await tx.done
  db.close()
})

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbindex_get.any.js#L113-L128
 */
test('get() throws DataError when using invalid key', async () => {
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
  expect(() => void index.get(NaN)).toThrow(
    expect.objectContaining({ name: 'DataError' })
  )

  db.close()
})

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbindex_get.any.js#L149-L171
 */
test('get() throws TransactionInactiveError on aborted transaction', async () => {
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
    void index.get('data')
  }).toThrow(expect.objectContaining({ name: 'TransactionInactiveError' }))

  await tx.done.catch(() => {})
  db.close()
})

/**
 * Convenience method test - get via index on db directly
 */
test('getFromIndex() convenience method', async () => {
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

  const result = await db.getFromIndex('store', 'index', 'data')
  expect(result?.key).toBe(record.key)

  db.close()
})

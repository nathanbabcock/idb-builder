/**
 * IDBIndex.count() Tests
 *
 * Ported from WPT idbindex_count.any.js
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbindex_count.any.js
 */

import './wpt-setup'
import { expect, test } from 'vitest'
import { openDB } from '../../lib/idb-adapter'
import { createMigrations } from '../../lib/migration-builder'
import { schema } from '../../lib/schema'

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbindex_count.any.js#L10-L34
 */
test('count() returns the number of records in the index', async () => {
  const migrations = createMigrations().version(1, v =>
    v
      .createObjectStore({
        name: 'store',
        schema: schema<{ id: number; indexedProperty: string }>(),
        primaryKey: 'id',
        autoIncrement: true,
      })
      .createIndex('index', {
        storeName: 'store',
        keyPath: 'indexedProperty',
      })
  )

  const db = await openDB('test-db', migrations)

  for (let i = 0; i < 10; i++) {
    await db.add('store', {
      indexedProperty: `data${i}`,
    } as { id: number; indexedProperty: string })
  }

  const tx = db.transaction('store', 'readonly')
  const store = tx.objectStore('store')
  const index = store.index('index')

  const count = await index.count()
  expect(count).toBe(10)

  await tx.done
  db.close()
})

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbindex_count.any.js#L36-L61
 */
test('count() returns the number of records that have keys within the range', async () => {
  const migrations = createMigrations().version(1, v =>
    v
      .createObjectStore({
        name: 'store',
        schema: schema<{ id: number; indexedProperty: string }>(),
        primaryKey: 'id',
        autoIncrement: true,
      })
      .createIndex('index', {
        storeName: 'store',
        keyPath: 'indexedProperty',
      })
  )

  const db = await openDB('test-db', migrations)

  for (let i = 0; i < 10; i++) {
    await db.add('store', {
      indexedProperty: `data${i}`,
    } as { id: number; indexedProperty: string })
  }

  const tx = db.transaction('store', 'readonly')
  const store = tx.objectStore('store')
  const index = store.index('index')

  const count = await index.count(IDBKeyRange.bound('data0', 'data4'))
  expect(count).toBe(5)

  await tx.done
  db.close()
})

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbindex_count.any.js#L63-L81
 */
test('count() returns the number of records that have keys with the key', async () => {
  const migrations = createMigrations().version(1, v =>
    v
      .createObjectStore({
        name: 'store',
        schema: schema<{ id: number; idx: string }>(),
        primaryKey: 'id',
        autoIncrement: true,
      })
      .createIndex('myindex', {
        storeName: 'store',
        keyPath: 'idx',
      })
  )

  const db = await openDB('test-db', migrations)

  // Add 10 records with alternating index values
  for (let i = 0; i < 10; i++) {
    await db.add('store', {
      idx: `data_${i % 2}`,
    } as { id: number; idx: string })
  }

  const tx = db.transaction('store', 'readonly')
  const store = tx.objectStore('store')
  const index = store.index('myindex')

  const count = await index.count('data_0')
  expect(count).toBe(5)

  await tx.done
  db.close()
})

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbindex_count.any.js#L83-L108
 */
test('count() throws DataError when using invalid key', async () => {
  const migrations = createMigrations().version(1, v =>
    v
      .createObjectStore({
        name: 'store',
        schema: schema<{ id: number; indexedProperty: string }>(),
        primaryKey: 'id',
        autoIncrement: true,
      })
      .createIndex('index', {
        storeName: 'store',
        keyPath: 'indexedProperty',
      })
  )

  const db = await openDB('test-db', migrations)

  for (let i = 0; i < 10; i++) {
    await db.add('store', {
      indexedProperty: `data${i}`,
    } as { id: number; indexedProperty: string })
  }

  const tx = db.transaction('store', 'readonly')
  const store = tx.objectStore('store')
  const index = store.index('index')

  // @ts-expect-error invalid key is caught at compile time
  expect(() => void index.count(NaN)).toThrow(
    expect.objectContaining({ name: 'DataError' })
  )

  db.close()
})

/**
 * Convenience method test - countFromIndex on db directly
 */
test('countFromIndex() convenience method', async () => {
  const migrations = createMigrations().version(1, v =>
    v
      .createObjectStore({
        name: 'store',
        schema: schema<{ id: number; indexedProperty: string }>(),
        primaryKey: 'id',
        autoIncrement: true,
      })
      .createIndex('index', {
        storeName: 'store',
        keyPath: 'indexedProperty',
      })
  )

  const db = await openDB('test-db', migrations)

  for (let i = 0; i < 10; i++) {
    await db.add('store', {
      indexedProperty: `data${i}`,
    } as { id: number; indexedProperty: string })
  }

  const count = await db.countFromIndex('store', 'index')
  expect(count).toBe(10)

  db.close()
})

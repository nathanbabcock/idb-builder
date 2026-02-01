/**
 * IDBIndex.openKeyCursor() Tests
 *
 * Ported from WPT idbindex_openKeyCursor.any.js
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbindex_openKeyCursor.any.js
 */

import './wpt-setup'
import { expect, test } from 'vitest'
import { openDB } from '../../lib/idb-adapter'
import { createMigrations } from '../../lib/migration-builder'
import { schema } from '../../lib/schema'

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbindex_openKeyCursor.any.js#L44-L65
 */
test('If the transaction has been aborted, throw TransactionInactiveError', async () => {
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
    void index.openKeyCursor()
  }).toThrow(expect.objectContaining({ name: 'TransactionInactiveError' }))

  await tx.done.catch(() => {})
  db.close()
})

/**
 * Basic key cursor iteration test
 */
test('Forward iteration through index with key cursor', async () => {
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

  const primaryKeys: number[] = []
  const indexKeys: string[] = []

  let cursor = await index.openKeyCursor()
  while (cursor) {
    primaryKeys.push(cursor.primaryKey as number)
    indexKeys.push(cursor.key as string)
    cursor = await cursor.continue()
  }

  await tx.done

  expect(primaryKeys.length).toBe(10)
  // Index is sorted by indexedProperty (data0, data1, ..., data9)
  expect(indexKeys[0]).toBe('data0')
  expect(indexKeys[9]).toBe('data9')

  db.close()
})

/**
 * Reverse key cursor iteration test
 */
test('Reverse iteration through index with key cursor', async () => {
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

  const indexKeys: string[] = []

  let cursor = await index.openKeyCursor(null, 'prev')
  while (cursor) {
    indexKeys.push(cursor.key as string)
    cursor = await cursor.continue()
  }

  await tx.done

  expect(indexKeys.length).toBe(10)
  expect(indexKeys[0]).toBe('data9')
  expect(indexKeys[9]).toBe('data0')

  db.close()
})

/**
 * Key range test with key cursor
 */
test('Iteration with key range using key cursor', async () => {
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

  const indexKeys: string[] = []

  let cursor = await index.openKeyCursor(IDBKeyRange.bound('data3', 'data6'))
  while (cursor) {
    indexKeys.push(cursor.key as string)
    cursor = await cursor.continue()
  }

  await tx.done

  expect(indexKeys).toEqual(['data3', 'data4', 'data5', 'data6'])

  db.close()
})

/**
 * Key cursor does not provide values (only keys)
 */
test('Key cursor provides keys but not full values', async () => {
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

  for (let i = 0; i < 5; i++) {
    await db.add('store', { key: i, indexedProperty: `data${i}` })
  }

  const tx = db.transaction('store', 'readonly')
  const store = tx.objectStore('store')
  const index = store.index('index')

  let cursor = await index.openKeyCursor()
  expect(cursor).not.toBeNull()
  if (cursor) {
    // Key cursor provides key and primaryKey
    expect(cursor.key).toBe('data0')
    expect(cursor.primaryKey).toBe(0)
  }

  await tx.done
  db.close()
})

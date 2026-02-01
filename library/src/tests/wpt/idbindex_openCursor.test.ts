/**
 * IDBIndex.openCursor() Tests
 *
 * Ported from WPT idbindex_openCursor.any.js
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbindex_openCursor.any.js
 */

import './wpt-setup'
import { expect, test } from 'vitest'
import { openDB } from '../../lib/idb-adapter'
import { createMigrations } from '../../lib/migration-builder'
import { schema } from '../../lib/schema'

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbindex_openCursor.any.js#L25-L47
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
    index.openCursor()
  }).toThrow(expect.objectContaining({ name: 'TransactionInactiveError' }))

  await tx.done.catch(() => {})
  db.close()
})

/**
 * Basic cursor iteration test
 */
test('Forward iteration through index', async () => {
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

  const keys: number[] = []
  const indexKeys: string[] = []

  let cursor = await index.openCursor()
  while (cursor) {
    keys.push(cursor.primaryKey as number)
    indexKeys.push(cursor.key as string)
    cursor = await cursor.continue()
  }

  await tx.done

  expect(keys.length).toBe(10)
  // Index is sorted by indexedProperty (data0, data1, ..., data9)
  expect(indexKeys[0]).toBe('data0')
  expect(indexKeys[9]).toBe('data9')

  db.close()
})

/**
 * Reverse iteration test
 */
test('Reverse iteration through index', async () => {
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

  let cursor = await index.openCursor(null, 'prev')
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
 * Key range test
 */
test('Iteration with key range', async () => {
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

  let cursor = await index.openCursor(IDBKeyRange.bound('data3', 'data6'))
  while (cursor) {
    indexKeys.push(cursor.key as string)
    cursor = await cursor.continue()
  }

  await tx.done

  expect(indexKeys).toEqual(['data3', 'data4', 'data5', 'data6'])

  db.close()
})

/**
 * Cursor with values test
 */
test('Cursor provides values', async () => {
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

  const values: { key: number; indexedProperty: string }[] = []

  let cursor = await index.openCursor()
  while (cursor) {
    values.push(cursor.value)
    cursor = await cursor.continue()
  }

  await tx.done

  expect(values.length).toBe(5)
  expect(values[0]).toEqual({ key: 0, indexedProperty: 'data0' })
  expect(values[4]).toEqual({ key: 4, indexedProperty: 'data4' })

  db.close()
})

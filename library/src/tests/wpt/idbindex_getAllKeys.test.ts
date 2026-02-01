/**
 * IDBIndex.getAllKeys() Tests
 *
 * Ported from WPT idbindex_getAllKeys.any.js
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbindex_getAllKeys.any.js
 */

import './wpt-setup'
import { expect, test } from 'vitest'
import { openDB } from '../../lib/idb-adapter'
import { createMigrations } from '../../lib/migration-builder'
import { schema } from '../../lib/schema'

const alphabet = 'abcdefghijklmnopqrstuvwxyz'.split('')

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbindex_getAllKeys.any.js#L11-L12
 */
test('Single item get', async () => {
  const migrations = createMigrations().version(1, v =>
    v
      .createObjectStore({
        name: 'store',
        schema: schema<{ ch: string; upper: string }>(),
      })
      .createIndex('test_idx', {
        storeName: 'store',
        keyPath: 'upper',
      })
  )

  const db = await openDB('test-db', migrations)

  for (const letter of alphabet) {
    await db.add('store', { ch: letter, upper: letter.toUpperCase() }, letter)
  }

  const tx = db.transaction('store', 'readonly')
  const store = tx.objectStore('store')
  const index = store.index('test_idx')

  const result = await index.getAllKeys('C')
  expect(result).toEqual(['c']) // primary key

  await tx.done
  db.close()
})

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbindex_getAllKeys.any.js#L14-L15
 */
test('Empty object store', async () => {
  const migrations = createMigrations().version(1, v =>
    v
      .createObjectStore({
        name: 'store',
        schema: schema<{ ch: string; upper: string }>(),
      })
      .createIndex('test_idx', {
        storeName: 'store',
        keyPath: 'upper',
      })
  )

  const db = await openDB('test-db', migrations)

  const tx = db.transaction('store', 'readonly')
  const store = tx.objectStore('store')
  const index = store.index('test_idx')

  const result = await index.getAllKeys()
  expect(result).toEqual([])

  await tx.done
  db.close()
})

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbindex_getAllKeys.any.js#L17-L18
 */
test('Get all keys', async () => {
  const migrations = createMigrations().version(1, v =>
    v
      .createObjectStore({
        name: 'store',
        schema: schema<{ ch: string; upper: string }>(),
      })
      .createIndex('test_idx', {
        storeName: 'store',
        keyPath: 'upper',
      })
  )

  const db = await openDB('test-db', migrations)

  for (const letter of alphabet) {
    await db.add('store', { ch: letter, upper: letter.toUpperCase() }, letter)
  }

  const tx = db.transaction('store', 'readonly')
  const store = tx.objectStore('store')
  const index = store.index('test_idx')

  const result = await index.getAllKeys()
  expect(result.length).toBe(26)
  // Keys are ordered by index key (A-Z), result is primary keys (a-z)
  expect(result[0]).toBe('a')
  expect(result[25]).toBe('z')

  await tx.done
  db.close()
})

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbindex_getAllKeys.any.js#L24-L25
 */
test('maxCount=10', async () => {
  const migrations = createMigrations().version(1, v =>
    v
      .createObjectStore({
        name: 'store',
        schema: schema<{ ch: string; upper: string }>(),
      })
      .createIndex('test_idx', {
        storeName: 'store',
        keyPath: 'upper',
      })
  )

  const db = await openDB('test-db', migrations)

  for (const letter of alphabet) {
    await db.add('store', { ch: letter, upper: letter.toUpperCase() }, letter)
  }

  const tx = db.transaction('store', 'readonly')
  const store = tx.objectStore('store')
  const index = store.index('test_idx')

  const result = await index.getAllKeys(undefined, 10)
  expect(result.length).toBe(10)
  expect(result[0]).toBe('a')
  expect(result[9]).toBe('j')

  await tx.done
  db.close()
})

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbindex_getAllKeys.any.js#L27-L29
 */
test('Get bound range', async () => {
  const migrations = createMigrations().version(1, v =>
    v
      .createObjectStore({
        name: 'store',
        schema: schema<{ ch: string; upper: string }>(),
      })
      .createIndex('test_idx', {
        storeName: 'store',
        keyPath: 'upper',
      })
  )

  const db = await openDB('test-db', migrations)

  for (const letter of alphabet) {
    await db.add('store', { ch: letter, upper: letter.toUpperCase() }, letter)
  }

  const tx = db.transaction('store', 'readonly')
  const store = tx.objectStore('store')
  const index = store.index('test_idx')

  const result = await index.getAllKeys(IDBKeyRange.bound('G', 'M'))
  expect(result).toEqual(['g', 'h', 'i', 'j', 'k', 'l', 'm'])

  await tx.done
  db.close()
})

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbindex_getAllKeys.any.js#L31-L34
 */
test('Get bound range with maxCount', async () => {
  const migrations = createMigrations().version(1, v =>
    v
      .createObjectStore({
        name: 'store',
        schema: schema<{ ch: string; upper: string }>(),
      })
      .createIndex('test_idx', {
        storeName: 'store',
        keyPath: 'upper',
      })
  )

  const db = await openDB('test-db', migrations)

  for (const letter of alphabet) {
    await db.add('store', { ch: letter, upper: letter.toUpperCase() }, letter)
  }

  const tx = db.transaction('store', 'readonly')
  const store = tx.objectStore('store')
  const index = store.index('test_idx')

  const result = await index.getAllKeys(IDBKeyRange.bound('G', 'M'), 3)
  expect(result).toEqual(['g', 'h', 'i'])

  await tx.done
  db.close()
})

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbindex_getAllKeys.any.js#L36-L42
 */
test('Get upper excluded', async () => {
  const migrations = createMigrations().version(1, v =>
    v
      .createObjectStore({
        name: 'store',
        schema: schema<{ ch: string; upper: string }>(),
      })
      .createIndex('test_idx', {
        storeName: 'store',
        keyPath: 'upper',
      })
  )

  const db = await openDB('test-db', migrations)

  for (const letter of alphabet) {
    await db.add('store', { ch: letter, upper: letter.toUpperCase() }, letter)
  }

  const tx = db.transaction('store', 'readonly')
  const store = tx.objectStore('store')
  const index = store.index('test_idx')

  const result = await index.getAllKeys(
    IDBKeyRange.bound('G', 'K', false, true)
  )
  expect(result).toEqual(['g', 'h', 'i', 'j'])

  await tx.done
  db.close()
})

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbindex_getAllKeys.any.js#L44-L50
 */
test('Get lower excluded', async () => {
  const migrations = createMigrations().version(1, v =>
    v
      .createObjectStore({
        name: 'store',
        schema: schema<{ ch: string; upper: string }>(),
      })
      .createIndex('test_idx', {
        storeName: 'store',
        keyPath: 'upper',
      })
  )

  const db = await openDB('test-db', migrations)

  for (const letter of alphabet) {
    await db.add('store', { ch: letter, upper: letter.toUpperCase() }, letter)
  }

  const tx = db.transaction('store', 'readonly')
  const store = tx.objectStore('store')
  const index = store.index('test_idx')

  const result = await index.getAllKeys(
    IDBKeyRange.bound('G', 'K', true, false)
  )
  expect(result).toEqual(['h', 'i', 'j', 'k'])

  await tx.done
  db.close()
})

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbindex_getAllKeys.any.js#L57-L59
 */
test('Non existent key', async () => {
  const migrations = createMigrations().version(1, v =>
    v
      .createObjectStore({
        name: 'store',
        schema: schema<{ ch: string; upper: string }>(),
      })
      .createIndex('test_idx', {
        storeName: 'store',
        keyPath: 'upper',
      })
  )

  const db = await openDB('test-db', migrations)

  for (const letter of alphabet) {
    await db.add('store', { ch: letter, upper: letter.toUpperCase() }, letter)
  }

  const tx = db.transaction('store', 'readonly')
  const store = tx.objectStore('store')
  const index = store.index('test_idx')

  const result = await index.getAllKeys("Doesn't exist")
  expect(result).toEqual([])

  await tx.done
  db.close()
})

/**
 * Convenience method test
 */
test('getAllKeysFromIndex() convenience method', async () => {
  const migrations = createMigrations().version(1, v =>
    v
      .createObjectStore({
        name: 'store',
        schema: schema<{ ch: string; upper: string }>(),
      })
      .createIndex('test_idx', {
        storeName: 'store',
        keyPath: 'upper',
      })
  )

  const db = await openDB('test-db', migrations)

  for (const letter of alphabet) {
    await db.add('store', { ch: letter, upper: letter.toUpperCase() }, letter)
  }

  const result = await db.getAllKeysFromIndex('store', 'test_idx')
  expect(result.length).toBe(26)
  expect(result[0]).toBe('a')

  db.close()
})

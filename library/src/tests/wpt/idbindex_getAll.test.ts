/**
 * IDBIndex.getAll() Tests
 *
 * Ported from WPT idbindex_getAll.any.js
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbindex_getAll.any.js
 */

import './wpt-setup'
import { expect, test } from 'vitest'
import { openDB } from '../../lib/idb-adapter'
import { createMigrations } from '../../lib/migration-builder'
import { schema } from '../../lib/schema'

const alphabet = 'abcdefghijklmnopqrstuvwxyz'.split('')
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbindex_getAll.any.js#L11-L12
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

  // Add records with out-of-line keys
  for (const letter of alphabet) {
    await db.add('store', { ch: letter, upper: letter.toUpperCase() }, letter)
  }

  const tx = db.transaction('store', 'readonly')
  const store = tx.objectStore('store')
  const index = store.index('test_idx')

  const result = await index.getAll('C')
  expect(result.length).toBe(1)
  expect(result[0].ch).toBe('c')
  expect(result[0].upper).toBe('C')

  await tx.done
  db.close()
})

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbindex_getAll.any.js#L14-L15
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

  const result = await index.getAll()
  expect(result).toEqual([])

  await tx.done
  db.close()
})

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbindex_getAll.any.js#L17-L18
 */
test('Get all', async () => {
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

  // Add records with out-of-line keys
  for (const letter of alphabet) {
    await db.add('store', { ch: letter, upper: letter.toUpperCase() }, letter)
  }

  const tx = db.transaction('store', 'readonly')
  const store = tx.objectStore('store')
  const index = store.index('test_idx')

  const result = await index.getAll()
  expect(result.length).toBe(26)
  // Results should be ordered by index key (uppercase letters A-Z)
  expect(result[0].upper).toBe('A')
  expect(result[25].upper).toBe('Z')

  await tx.done
  db.close()
})

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbindex_getAll.any.js#L28-L29
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

  // Add records with out-of-line keys
  for (const letter of alphabet) {
    await db.add('store', { ch: letter, upper: letter.toUpperCase() }, letter)
  }

  const tx = db.transaction('store', 'readonly')
  const store = tx.objectStore('store')
  const index = store.index('test_idx')

  const result = await index.getAll(undefined, 10)
  expect(result.length).toBe(10)
  expect(result[0].upper).toBe('A')
  expect(result[9].upper).toBe('J')

  await tx.done
  db.close()
})

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbindex_getAll.any.js#L31-L33
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

  // Add records with out-of-line keys
  for (const letter of alphabet) {
    await db.add('store', { ch: letter, upper: letter.toUpperCase() }, letter)
  }

  const tx = db.transaction('store', 'readonly')
  const store = tx.objectStore('store')
  const index = store.index('test_idx')

  const result = await index.getAll(IDBKeyRange.bound('G', 'M'))
  expect(result.length).toBe(7) // G, H, I, J, K, L, M
  expect(result[0].upper).toBe('G')
  expect(result[6].upper).toBe('M')

  await tx.done
  db.close()
})

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbindex_getAll.any.js#L35-L38
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

  // Add records with out-of-line keys
  for (const letter of alphabet) {
    await db.add('store', { ch: letter, upper: letter.toUpperCase() }, letter)
  }

  const tx = db.transaction('store', 'readonly')
  const store = tx.objectStore('store')
  const index = store.index('test_idx')

  const result = await index.getAll(IDBKeyRange.bound('G', 'M'), 3)
  expect(result.length).toBe(3)
  expect(result[0].upper).toBe('G')
  expect(result[2].upper).toBe('I')

  await tx.done
  db.close()
})

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbindex_getAll.any.js#L40-L45
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

  // Add records with out-of-line keys
  for (const letter of alphabet) {
    await db.add('store', { ch: letter, upper: letter.toUpperCase() }, letter)
  }

  const tx = db.transaction('store', 'readonly')
  const store = tx.objectStore('store')
  const index = store.index('test_idx')

  // bound('G', 'K', false, true) => G, H, I, J (K excluded)
  const result = await index.getAll(IDBKeyRange.bound('G', 'K', false, true))
  expect(result.length).toBe(4)
  expect(result[0].upper).toBe('G')
  expect(result[3].upper).toBe('J')

  await tx.done
  db.close()
})

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbindex_getAll.any.js#L47-L52
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

  // Add records with out-of-line keys
  for (const letter of alphabet) {
    await db.add('store', { ch: letter, upper: letter.toUpperCase() }, letter)
  }

  const tx = db.transaction('store', 'readonly')
  const store = tx.objectStore('store')
  const index = store.index('test_idx')

  // bound('G', 'K', true, false) => H, I, J, K (G excluded)
  const result = await index.getAll(IDBKeyRange.bound('G', 'K', true, false))
  expect(result.length).toBe(4)
  expect(result[0].upper).toBe('H')
  expect(result[3].upper).toBe('K')

  await tx.done
  db.close()
})

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbindex_getAll.any.js#L59-L61
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

  // Add records with out-of-line keys
  for (const letter of alphabet) {
    await db.add('store', { ch: letter, upper: letter.toUpperCase() }, letter)
  }

  const tx = db.transaction('store', 'readonly')
  const store = tx.objectStore('store')
  const index = store.index('test_idx')

  const result = await index.getAll("Doesn't exist")
  expect(result).toEqual([])

  await tx.done
  db.close()
})

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbindex_getAll.any.js#L63-L64
 */
test('maxCount=0', async () => {
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

  // Add records with out-of-line keys
  for (const letter of alphabet) {
    await db.add('store', { ch: letter, upper: letter.toUpperCase() }, letter)
  }

  const tx = db.transaction('store', 'readonly')
  const store = tx.objectStore('store')
  const index = store.index('test_idx')

  // count of 0 should return all values
  const result = await index.getAll(undefined, 0)
  expect(result.length).toBe(26)

  await tx.done
  db.close()
})

/**
 * Convenience method test - getAllFromIndex on db directly
 */
test('getAllFromIndex() convenience method', async () => {
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

  // Add records with out-of-line keys
  for (const letter of alphabet) {
    await db.add('store', { ch: letter, upper: letter.toUpperCase() }, letter)
  }

  const result = await db.getAllFromIndex('store', 'test_idx')
  expect(result.length).toBe(26)
  expect(result[0].upper).toBe('A')

  db.close()
})

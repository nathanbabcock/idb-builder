/**
 * IDBObjectStore.getAllKeys() Tests
 *
 * Ported from WPT idbobjectstore_getAllKeys.any.js
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbobjectstore_getAllKeys.any.js
 */

import './wpt-setup'
import { expect, test } from 'vitest'
import { openDB } from '../../lib/idb-adapter'
import { createMigrations } from '../../lib/migration-builder'
import { schema } from '../../lib/schema'

const alphabet = 'abcdefghijklmnopqrstuvwxyz'.split('')

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbobjectstore_getAllKeys.any.js#L11-L12
 */
test('Single item get', async () => {
  const migrations = createMigrations().version(1, v =>
    v.createObjectStore({
      name: 'store',
      schema: schema<string>(),
    })
  )

  const db = await openDB('test-db', migrations)

  // Add records with out-of-line keys
  for (const letter of alphabet) {
    await db.add('store', `value-${letter}`, letter)
  }

  const result = await db.getAllKeys('store', 'c')
  expect(result).toEqual(['c'])

  db.close()
})

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbobjectstore_getAllKeys.any.js#L14-L16
 */
test('Single item get (generated key)', async () => {
  const migrations = createMigrations().version(1, v =>
    v.createObjectStore({
      name: 'store',
      schema: schema<{ id: number; ch: string }>(),
      primaryKey: 'id',
      autoIncrement: true,
    })
  )

  const db = await openDB('test-db', migrations)

  // Add records with auto-generated keys
  for (const letter of alphabet) {
    await db.add('store', { ch: letter } as { id: number; ch: string })
  }

  const result = await db.getAllKeys('store', 3)
  expect(result).toEqual([3])

  db.close()
})

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbobjectstore_getAllKeys.any.js#L18-L20
 */
test('getAllKeys on empty object store', async () => {
  const migrations = createMigrations().version(1, v =>
    v.createObjectStore({
      name: 'store',
      schema: schema<string>(),
    })
  )

  const db = await openDB('test-db', migrations)

  const result = await db.getAllKeys('store')
  expect(result).toEqual([])

  db.close()
})

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbobjectstore_getAllKeys.any.js#L22-L23
 */
test('Get all keys', async () => {
  const migrations = createMigrations().version(1, v =>
    v.createObjectStore({
      name: 'store',
      schema: schema<string>(),
    })
  )

  const db = await openDB('test-db', migrations)

  // Add records with out-of-line keys
  for (const letter of alphabet) {
    await db.add('store', `value-${letter}`, letter)
  }

  const result = await db.getAllKeys('store')
  expect(result.length).toBe(26)
  expect(result[0]).toBe('a')
  expect(result[25]).toBe('z')

  db.close()
})

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbobjectstore_getAllKeys.any.js#L25-L26
 */
test('Test maxCount', async () => {
  const migrations = createMigrations().version(1, v =>
    v.createObjectStore({
      name: 'store',
      schema: schema<string>(),
    })
  )

  const db = await openDB('test-db', migrations)

  // Add records with out-of-line keys
  for (const letter of alphabet) {
    await db.add('store', `value-${letter}`, letter)
  }

  const result = await db.getAllKeys('store', undefined, 10)
  expect(result.length).toBe(10)
  expect(result).toEqual(['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j'])

  db.close()
})

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbobjectstore_getAllKeys.any.js#L28-L30
 */
test('Get bound range', async () => {
  const migrations = createMigrations().version(1, v =>
    v.createObjectStore({
      name: 'store',
      schema: schema<string>(),
    })
  )

  const db = await openDB('test-db', migrations)

  // Add records with out-of-line keys
  for (const letter of alphabet) {
    await db.add('store', `value-${letter}`, letter)
  }

  const result = await db.getAllKeys('store', IDBKeyRange.bound('g', 'm'))
  expect(result).toEqual(['g', 'h', 'i', 'j', 'k', 'l', 'm'])

  db.close()
})

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbobjectstore_getAllKeys.any.js#L32-L35
 */
test('Get bound range with maxCount', async () => {
  const migrations = createMigrations().version(1, v =>
    v.createObjectStore({
      name: 'store',
      schema: schema<string>(),
    })
  )

  const db = await openDB('test-db', migrations)

  // Add records with out-of-line keys
  for (const letter of alphabet) {
    await db.add('store', `value-${letter}`, letter)
  }

  const result = await db.getAllKeys('store', IDBKeyRange.bound('g', 'm'), 3)
  expect(result).toEqual(['g', 'h', 'i'])

  db.close()
})

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbobjectstore_getAllKeys.any.js#L37-L42
 */
test('Get upper excluded', async () => {
  const migrations = createMigrations().version(1, v =>
    v.createObjectStore({
      name: 'store',
      schema: schema<string>(),
    })
  )

  const db = await openDB('test-db', migrations)

  // Add records with out-of-line keys
  for (const letter of alphabet) {
    await db.add('store', `value-${letter}`, letter)
  }

  // bound('g', 'k', false, true) => g, h, i, j (k excluded)
  const result = await db.getAllKeys(
    'store',
    IDBKeyRange.bound('g', 'k', false, true)
  )
  expect(result).toEqual(['g', 'h', 'i', 'j'])

  db.close()
})

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbobjectstore_getAllKeys.any.js#L44-L49
 */
test('Get lower excluded', async () => {
  const migrations = createMigrations().version(1, v =>
    v.createObjectStore({
      name: 'store',
      schema: schema<string>(),
    })
  )

  const db = await openDB('test-db', migrations)

  // Add records with out-of-line keys
  for (const letter of alphabet) {
    await db.add('store', `value-${letter}`, letter)
  }

  // bound('g', 'k', true, false) => h, i, j, k (g excluded)
  const result = await db.getAllKeys(
    'store',
    IDBKeyRange.bound('g', 'k', true, false)
  )
  expect(result).toEqual(['h', 'i', 'j', 'k'])

  db.close()
})

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbobjectstore_getAllKeys.any.js#L51-L54
 */
test('Get bound range (generated) with maxCount', async () => {
  const migrations = createMigrations().version(1, v =>
    v.createObjectStore({
      name: 'store',
      schema: schema<{ id: number; ch: string }>(),
      primaryKey: 'id',
      autoIncrement: true,
    })
  )

  const db = await openDB('test-db', migrations)

  // Add records with auto-generated keys
  for (const letter of alphabet) {
    await db.add('store', { ch: letter } as { id: number; ch: string })
  }

  const result = await db.getAllKeys('store', IDBKeyRange.bound(4, 15), 3)
  expect(result).toEqual([4, 5, 6])

  db.close()
})

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbobjectstore_getAllKeys.any.js#L56-L58
 */
test('Non existent key', async () => {
  const migrations = createMigrations().version(1, v =>
    v.createObjectStore({
      name: 'store',
      schema: schema<string>(),
    })
  )

  const db = await openDB('test-db', migrations)

  // Add records with out-of-line keys
  for (const letter of alphabet) {
    await db.add('store', `value-${letter}`, letter)
  }

  const result = await db.getAllKeys('store', "Doesn't exist")
  expect(result).toEqual([])

  db.close()
})

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbobjectstore_getAllKeys.any.js#L60-L62
 */
test('zero maxCount', async () => {
  const migrations = createMigrations().version(1, v =>
    v.createObjectStore({
      name: 'store',
      schema: schema<string>(),
    })
  )

  const db = await openDB('test-db', migrations)

  // Add records with out-of-line keys
  for (const letter of alphabet) {
    await db.add('store', `value-${letter}`, letter)
  }

  // count of 0 should return all keys (not zero keys)
  const result = await db.getAllKeys('store', undefined, 0)
  expect(result.length).toBe(26)

  db.close()
})

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbobjectstore_getAllKeys.any.js#L64-L66
 */
test('Max value count', async () => {
  const migrations = createMigrations().version(1, v =>
    v.createObjectStore({
      name: 'store',
      schema: schema<string>(),
    })
  )

  const db = await openDB('test-db', migrations)

  // Add records with out-of-line keys
  for (const letter of alphabet) {
    await db.add('store', `value-${letter}`, letter)
  }

  const result = await db.getAllKeys('store', undefined, 4294967295)
  expect(result.length).toBe(26)

  db.close()
})

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbobjectstore_getAllKeys.any.js#L68-L71
 */
test('Query with empty range where first key < upperBound', async () => {
  const migrations = createMigrations().version(1, v =>
    v.createObjectStore({
      name: 'store',
      schema: schema<string>(),
    })
  )

  const db = await openDB('test-db', migrations)

  // Add records with out-of-line keys (a-z)
  for (const letter of alphabet) {
    await db.add('store', `value-${letter}`, letter)
  }

  // upperBound('0') - no keys less than '0' since all are letters
  const result = await db.getAllKeys('store', IDBKeyRange.upperBound('0'))
  expect(result).toEqual([])

  db.close()
})

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbobjectstore_getAllKeys.any.js#L73-L76
 */
test('Query with empty range where lowerBound < last key', async () => {
  const migrations = createMigrations().version(1, v =>
    v.createObjectStore({
      name: 'store',
      schema: schema<string>(),
    })
  )

  const db = await openDB('test-db', migrations)

  // Add records with out-of-line keys (a-z)
  for (const letter of alphabet) {
    await db.add('store', `value-${letter}`, letter)
  }

  // lowerBound('zz') - no keys greater than 'zz' since all are single letters
  const result = await db.getAllKeys('store', IDBKeyRange.lowerBound('zz'))
  expect(result).toEqual([])

  db.close()
})

/**
 * Transaction-based test
 */
test('Get all keys via transaction', async () => {
  const migrations = createMigrations().version(1, v =>
    v.createObjectStore({
      name: 'store',
      schema: schema<string>(),
    })
  )

  const db = await openDB('test-db', migrations)

  // Add records with out-of-line keys
  for (const letter of alphabet) {
    await db.add('store', `value-${letter}`, letter)
  }

  const tx = db.transaction('store', 'readonly')
  const store = tx.objectStore('store')

  const result = await store.getAllKeys()
  expect(result.length).toBe(26)
  expect(result[0]).toBe('a')
  expect(result[25]).toBe('z')

  await tx.done

  db.close()
})

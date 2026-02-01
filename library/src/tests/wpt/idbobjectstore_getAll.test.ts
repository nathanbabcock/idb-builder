/**
 * IDBObjectStore.getAll() Tests
 *
 * Ported from WPT idbobjectstore_getAll.any.js
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbobjectstore_getAll.any.js
 */

import './wpt-setup'
import { expect, test } from 'vitest'
import { openDB } from '../../lib/idb-adapter'
import { createMigrations } from '../../lib/migration-builder'
import { schema } from '../../lib/schema'

const alphabet = 'abcdefghijklmnopqrstuvwxyz'.split('')

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbobjectstore_getAll.any.js#L11-L12
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

  const result = await db.getAll('store', 'c')
  expect(result).toEqual(['value-c'])

  db.close()
})

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbobjectstore_getAll.any.js#L14-L16
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

  const result = await db.getAll('store', 3)
  expect(result.length).toBe(1)
  expect(result[0].ch).toBe('c')

  db.close()
})

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbobjectstore_getAll.any.js#L18-L20
 */
test('getAll on empty object store', async () => {
  const migrations = createMigrations().version(1, v =>
    v.createObjectStore({
      name: 'store',
      schema: schema<string>(),
    })
  )

  const db = await openDB('test-db', migrations)

  const result = await db.getAll('store')
  expect(result).toEqual([])

  db.close()
})

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbobjectstore_getAll.any.js#L22-L23
 */
test('Get all values', async () => {
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

  const result = await db.getAll('store')
  expect(result.length).toBe(26)
  expect(result[0]).toBe('value-a')
  expect(result[25]).toBe('value-z')

  db.close()
})

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbobjectstore_getAll.any.js#L29-L30
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

  const result = await db.getAll('store', undefined, 10)
  expect(result.length).toBe(10)
  expect(result[0]).toBe('value-a')
  expect(result[9]).toBe('value-j')

  db.close()
})

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbobjectstore_getAll.any.js#L32-L34
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

  const result = await db.getAll('store', IDBKeyRange.bound('g', 'm'))
  expect(result.length).toBe(7) // g, h, i, j, k, l, m
  expect(result[0]).toBe('value-g')
  expect(result[6]).toBe('value-m')

  db.close()
})

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbobjectstore_getAll.any.js#L36-L39
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

  const result = await db.getAll('store', IDBKeyRange.bound('g', 'm'), 3)
  expect(result.length).toBe(3)
  expect(result[0]).toBe('value-g')
  expect(result[2]).toBe('value-i')

  db.close()
})

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbobjectstore_getAll.any.js#L41-L47
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
  const result = await db.getAll(
    'store',
    IDBKeyRange.bound('g', 'k', false, true)
  )
  expect(result.length).toBe(4)
  expect(result[0]).toBe('value-g')
  expect(result[3]).toBe('value-j')

  db.close()
})

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbobjectstore_getAll.any.js#L49-L55
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
  const result = await db.getAll(
    'store',
    IDBKeyRange.bound('g', 'k', true, false)
  )
  expect(result.length).toBe(4)
  expect(result[0]).toBe('value-h')
  expect(result[3]).toBe('value-k')

  db.close()
})

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbobjectstore_getAll.any.js#L57-L60
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

  const result = await db.getAll('store', IDBKeyRange.bound(4, 15), 3)
  expect(result.length).toBe(3)
  expect(result[0].ch).toBe('d')
  expect(result[2].ch).toBe('f')

  db.close()
})

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbobjectstore_getAll.any.js#L62-L64
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

  const result = await db.getAll('store', "Doesn't exist")
  expect(result).toEqual([])

  db.close()
})

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbobjectstore_getAll.any.js#L66-L67
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

  // count of 0 should return all values (not zero values)
  const result = await db.getAll('store', undefined, 0)
  expect(result.length).toBe(26)

  db.close()
})

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbobjectstore_getAll.any.js#L69-L71
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

  const result = await db.getAll('store', undefined, 4294967295)
  expect(result.length).toBe(26)

  db.close()
})

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbobjectstore_getAll.any.js#L73-L76
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
  const result = await db.getAll('store', IDBKeyRange.upperBound('0'))
  expect(result).toEqual([])

  db.close()
})

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbobjectstore_getAll.any.js#L78-L81
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
  const result = await db.getAll('store', IDBKeyRange.lowerBound('zz'))
  expect(result).toEqual([])

  db.close()
})

/**
 * Transaction-based test
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbobjectstore_getAll.any.js#L83-L102
 */
test('Get all values via transaction', async () => {
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

  const result = await store.getAll()
  expect(result.length).toBe(26)
  expect(result[0]).toBe('value-a')
  expect(result[25]).toBe('value-z')

  await tx.done

  db.close()
})

/**
 * IDBObjectStore.getKey() Tests
 *
 * Ported from WPT idbobjectstore_getKey.any.js
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbobjectstore_getKey.any.js
 */

import './wpt-setup'
import { expect, test } from 'vitest'
import { openDB } from '../../lib/idb-adapter'
import { createMigrations } from '../../lib/migration-builder'
import { schema } from '../../lib/schema'

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbobjectstore_getKey.any.js#L30-L37
 */
test('IDBObjectStore.getKey() - invalid parameters', async () => {
  const migrations = createMigrations().version(1, v =>
    v.createObjectStore({
      name: 'basic',
      schema: schema<string>(),
    })
  )

  const db = await openDB('test-db', migrations)

  // Populate the store
  for (let i = 1; i <= 10; i++) {
    await db.add('basic', `value: ${i}`, i)
  }

  const tx = db.transaction('basic', 'readonly')
  const store = tx.objectStore('basic')

  // null is not a valid key
  expect(() => {
    // @ts-expect-error - null is not a valid key
    store.getKey(null)
  }).toThrow(expect.objectContaining({ name: 'DataError' }))

  // object is not a valid key
  expect(() => {
    // @ts-expect-error - object is not a valid key
    store.getKey({})
  }).toThrow(expect.objectContaining({ name: 'DataError' }))

  db.close()
})

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbobjectstore_getKey.any.js#L45-L54
 */
test('IDBObjectStore.getKey() - basic - key', async () => {
  const migrations = createMigrations().version(1, v =>
    v.createObjectStore({
      name: 'basic',
      schema: schema<string>(),
    })
  )

  const db = await openDB('test-db', migrations)

  // Populate the store
  for (let i = 1; i <= 10; i++) {
    await db.add('basic', `value: ${i}`, i)
  }

  const result = await db.getKey('basic', 5)
  expect(result).toBe(5)

  db.close()
})

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbobjectstore_getKey.any.js#L56-L65
 */
test('IDBObjectStore.getKey() - basic - range', async () => {
  const migrations = createMigrations().version(1, v =>
    v.createObjectStore({
      name: 'basic',
      schema: schema<string>(),
    })
  )

  const db = await openDB('test-db', migrations)

  // Populate the store
  for (let i = 1; i <= 10; i++) {
    await db.add('basic', `value: ${i}`, i)
  }

  const result = await db.getKey('basic', IDBKeyRange.lowerBound(4.5))
  expect(result).toBe(5)

  db.close()
})

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbobjectstore_getKey.any.js#L67-L76
 */
test('IDBObjectStore.getKey() - basic - key - no match', async () => {
  const migrations = createMigrations().version(1, v =>
    v.createObjectStore({
      name: 'basic',
      schema: schema<string>(),
    })
  )

  const db = await openDB('test-db', migrations)

  // Populate the store
  for (let i = 1; i <= 10; i++) {
    await db.add('basic', `value: ${i}`, i)
  }

  const result = await db.getKey('basic', 11)
  expect(result).toBe(undefined)

  db.close()
})

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbobjectstore_getKey.any.js#L78-L88
 */
test('IDBObjectStore.getKey() - basic - range - no match', async () => {
  const migrations = createMigrations().version(1, v =>
    v.createObjectStore({
      name: 'basic',
      schema: schema<string>(),
    })
  )

  const db = await openDB('test-db', migrations)

  // Populate the store
  for (let i = 1; i <= 10; i++) {
    await db.add('basic', `value: ${i}`, i)
  }

  const result = await db.getKey('basic', IDBKeyRange.lowerBound(11))
  expect(result).toBe(undefined)

  db.close()
})

/**
 * Test with key path store
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbobjectstore_getKey.any.js#L45-L54
 */
test('IDBObjectStore.getKey() - key path - key', async () => {
  const migrations = createMigrations().version(1, v =>
    v.createObjectStore({
      name: 'keypath',
      schema: schema<{ id: number }>(),
      primaryKey: 'id',
    })
  )

  const db = await openDB('test-db', migrations)

  // Populate the store
  for (let i = 1; i <= 10; i++) {
    await db.add('keypath', { id: i })
  }

  const result = await db.getKey('keypath', 5)
  expect(result).toBe(5)

  db.close()
})

/**
 * Test with key generator store
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbobjectstore_getKey.any.js#L45-L54
 */
test('IDBObjectStore.getKey() - key generator - key', async () => {
  const migrations = createMigrations().version(1, v =>
    v.createObjectStore({
      name: 'generator',
      schema: schema<string>(),
      autoIncrement: true,
    })
  )

  const db = await openDB('test-db', migrations)

  // Populate the store
  for (let i = 1; i <= 10; i++) {
    await db.add('generator', `value: ${i}`)
  }

  const result = await db.getKey('generator', 5)
  expect(result).toBe(5)

  db.close()
})

/**
 * Test with key generator and key path store
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbobjectstore_getKey.any.js#L45-L54
 */
test('IDBObjectStore.getKey() - key generator and key path - key', async () => {
  const migrations = createMigrations().version(1, v =>
    v.createObjectStore({
      name: 'combo',
      schema: schema<{ id: number }>(),
      primaryKey: 'id',
      autoIncrement: true,
    })
  )

  const db = await openDB('test-db', migrations)

  // Populate the store
  for (let i = 1; i <= 10; i++) {
    await db.add('combo', {} as { id: number })
  }

  const result = await db.getKey('combo', 5)
  expect(result).toBe(5)

  db.close()
})

/**
 * Transaction-based test
 */
test('IDBObjectStore.getKey() via transaction', async () => {
  const migrations = createMigrations().version(1, v =>
    v.createObjectStore({
      name: 'basic',
      schema: schema<string>(),
    })
  )

  const db = await openDB('test-db', migrations)

  // Populate the store
  for (let i = 1; i <= 10; i++) {
    await db.add('basic', `value: ${i}`, i)
  }

  const tx = db.transaction('basic', 'readonly')
  const store = tx.objectStore('basic')

  const result = await store.getKey(5)
  expect(result).toBe(5)

  await tx.done

  db.close()
})

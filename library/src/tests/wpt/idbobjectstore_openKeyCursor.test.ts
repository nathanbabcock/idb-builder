/**
 * IDBObjectStore.openKeyCursor() Tests
 *
 * Ported from WPT idbobjectstore_openKeyCursor.any.js
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbobjectstore_openKeyCursor.any.js
 */

import './wpt-setup'
import { expect, test } from 'vitest'
import { openDB } from '../../lib/idb-adapter'
import { createMigrations } from '../../lib/migration-builder'
import { schema } from '../../lib/schema'

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbobjectstore_openKeyCursor.any.js#L23-L43
 */
test('IDBObjectStore.openKeyCursor() - forward iteration', async () => {
  const migrations = createMigrations().version(1, v =>
    v.createObjectStore({
      name: 'store',
      schema: schema<string>(),
    })
  )

  const db = await openDB('test-db', migrations)

  // Add 10 records
  for (let i = 0; i < 10; i++) {
    await db.add('store', `value: ${i}`, i)
  }

  const tx = db.transaction('store', 'readonly')
  const store = tx.objectStore('store')

  const expected = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
  const actual: number[] = []

  let cursor = await store.openKeyCursor()

  while (cursor) {
    expect(cursor.direction).toBe('next')
    expect(cursor.key).toBe(cursor.primaryKey)
    actual.push(cursor.key as number)
    cursor = await cursor.continue()
  }

  await tx.done

  expect(actual).toEqual(expected)

  db.close()
})

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbobjectstore_openKeyCursor.any.js#L45-L65
 */
test('IDBObjectStore.openKeyCursor() - reverse iteration', async () => {
  const migrations = createMigrations().version(1, v =>
    v.createObjectStore({
      name: 'store',
      schema: schema<string>(),
    })
  )

  const db = await openDB('test-db', migrations)

  // Add 10 records
  for (let i = 0; i < 10; i++) {
    await db.add('store', `value: ${i}`, i)
  }

  const tx = db.transaction('store', 'readonly')
  const store = tx.objectStore('store')

  const expected = [9, 8, 7, 6, 5, 4, 3, 2, 1, 0]
  const actual: number[] = []

  let cursor = await store.openKeyCursor(null, 'prev')

  while (cursor) {
    expect(cursor.direction).toBe('prev')
    expect(cursor.key).toBe(cursor.primaryKey)
    actual.push(cursor.key as number)
    cursor = await cursor.continue()
  }

  await tx.done

  expect(actual).toEqual(expected)

  db.close()
})

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbobjectstore_openKeyCursor.any.js#L67-L87
 */
test('IDBObjectStore.openKeyCursor() - forward iteration with range', async () => {
  const migrations = createMigrations().version(1, v =>
    v.createObjectStore({
      name: 'store',
      schema: schema<string>(),
    })
  )

  const db = await openDB('test-db', migrations)

  // Add 10 records
  for (let i = 0; i < 10; i++) {
    await db.add('store', `value: ${i}`, i)
  }

  const tx = db.transaction('store', 'readonly')
  const store = tx.objectStore('store')

  const expected = [4, 5, 6]
  const actual: number[] = []

  let cursor = await store.openKeyCursor(IDBKeyRange.bound(4, 6))

  while (cursor) {
    expect(cursor.direction).toBe('next')
    expect(cursor.key).toBe(cursor.primaryKey)
    actual.push(cursor.key as number)
    cursor = await cursor.continue()
  }

  await tx.done

  expect(actual).toEqual(expected)

  db.close()
})

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbobjectstore_openKeyCursor.any.js#L89-L109
 */
test('IDBObjectStore.openKeyCursor() - reverse iteration with range', async () => {
  const migrations = createMigrations().version(1, v =>
    v.createObjectStore({
      name: 'store',
      schema: schema<string>(),
    })
  )

  const db = await openDB('test-db', migrations)

  // Add 10 records
  for (let i = 0; i < 10; i++) {
    await db.add('store', `value: ${i}`, i)
  }

  const tx = db.transaction('store', 'readonly')
  const store = tx.objectStore('store')

  const expected = [6, 5, 4]
  const actual: number[] = []

  let cursor = await store.openKeyCursor(IDBKeyRange.bound(4, 6), 'prev')

  while (cursor) {
    expect(cursor.direction).toBe('prev')
    expect(cursor.key).toBe(cursor.primaryKey)
    actual.push(cursor.key as number)
    cursor = await cursor.continue()
  }

  await tx.done

  expect(actual).toEqual(expected)

  db.close()
})

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbobjectstore_openKeyCursor.any.js#L111-L134
 */
test('IDBObjectStore.openKeyCursor() - invalid inputs', async () => {
  const migrations = createMigrations().version(1, v =>
    v.createObjectStore({
      name: 'store',
      schema: schema<string>(),
    })
  )

  const db = await openDB('test-db', migrations)

  // Add 10 records
  for (let i = 0; i < 10; i++) {
    await db.add('store', `value: ${i}`, i)
  }

  const tx = db.transaction('store', 'readonly')
  const store = tx.objectStore('store')

  // NaN is not a valid key
  expect(() => {
    store.openKeyCursor(NaN)
  }).toThrow(expect.objectContaining({ name: 'DataError' }))

  // Date(NaN) is not a valid key
  expect(() => {
    store.openKeyCursor(new Date(NaN))
  }).toThrow(expect.objectContaining({ name: 'DataError' }))

  // Object is not a valid key
  expect(() => {
    // @ts-expect-error - object is not a valid key
    store.openKeyCursor({})
  }).toThrow(expect.objectContaining({ name: 'DataError' }))

  db.close()
})

/**
 * IDBObjectStore.openCursor() Tests
 *
 * Ported from WPT idbobjectstore_openCursor.any.js
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbobjectstore_openCursor.any.js
 */

import './wpt-setup'
import { expect, test } from 'vitest'
import { openDB } from '../../lib/idb-adapter'
import { createMigrations } from '../../lib/migration-builder'
import { schema } from '../../lib/schema'

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbobjectstore_openCursor.any.js#L7-L35
 */
test('iterate through 100 objects', async () => {
  const migrations = createMigrations().version(1, v =>
    v.createObjectStore({
      name: 'store',
      schema: schema<string>(),
    })
  )

  const db = await openDB('test-db', migrations)

  // Add 100 records
  for (let i = 0; i < 100; i++) {
    await db.add('store', `record_${i}`, i)
  }

  const tx = db.transaction('store', 'readonly')
  const store = tx.objectStore('store')

  let count = 0
  let cursor = await store.openCursor()

  while (cursor) {
    count++
    cursor = await cursor.continue()
  }

  await tx.done

  expect(count).toBe(100)

  db.close()
})

/**
 * Test forward iteration with cursor values
 */
test('forward iteration with values', async () => {
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
  const values: string[] = []

  let cursor = await store.openCursor()

  while (cursor) {
    actual.push(cursor.key as number)
    values.push(cursor.value)
    cursor = await cursor.continue()
  }

  await tx.done

  expect(actual).toEqual(expected)
  expect(values[0]).toBe('value: 0')
  expect(values[9]).toBe('value: 9')

  db.close()
})

/**
 * Test reverse iteration
 */
test('reverse iteration', async () => {
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

  let cursor = await store.openCursor(null, 'prev')

  while (cursor) {
    actual.push(cursor.key as number)
    cursor = await cursor.continue()
  }

  await tx.done

  expect(actual).toEqual(expected)

  db.close()
})

/**
 * Test with key range
 */
test('forward iteration with range', async () => {
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

  let cursor = await store.openCursor(IDBKeyRange.bound(4, 6))

  while (cursor) {
    actual.push(cursor.key as number)
    cursor = await cursor.continue()
  }

  await tx.done

  expect(actual).toEqual(expected)

  db.close()
})

/**
 * Test reverse iteration with range
 */
test('reverse iteration with range', async () => {
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

  let cursor = await store.openCursor(IDBKeyRange.bound(4, 6), 'prev')

  while (cursor) {
    actual.push(cursor.key as number)
    cursor = await cursor.continue()
  }

  await tx.done

  expect(actual).toEqual(expected)

  db.close()
})

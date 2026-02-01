/**
 * IDBObjectStore.get() Tests
 *
 * Ported from WPT idbobjectstore_get.any.js
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbobjectstore_get.any.js
 */

import './wpt-setup'
import { expect, test } from 'vitest'
import { openDB } from '../../lib/idb-adapter'
import { createMigrations } from '../../lib/migration-builder'
import { schema } from '../../lib/schema'

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbobjectstore_get.any.js#L30-L33
 */
test('Key is a number', async () => {
  const record = { key: 3.14159265, property: 'data' }

  const migrations = createMigrations().version(1, v =>
    v.createObjectStore({
      name: 'store',
      schema: schema<{ key: number; property: string }>(),
      primaryKey: 'key',
    })
  )

  const db = await openDB('test-db', migrations)
  await db.add('store', record)

  const result = await db.get('store', record.key)
  expect(result?.key).toBe(record.key)
  expect(result?.property).toBe(record.property)

  db.close()
})

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbobjectstore_get.any.js#L35-L38
 */
test('Key is a string', async () => {
  const record = { key: "this is a key that's a string", property: 'data' }

  const migrations = createMigrations().version(1, v =>
    v.createObjectStore({
      name: 'store',
      schema: schema<{ key: string; property: string }>(),
      primaryKey: 'key',
    })
  )

  const db = await openDB('test-db', migrations)
  await db.add('store', record)

  const result = await db.get('store', record.key)
  expect(result?.key).toBe(record.key)
  expect(result?.property).toBe(record.property)

  db.close()
})

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbobjectstore_get.any.js#L40-L43
 */
test('Key is a date', async () => {
  const record = { key: new Date(), property: 'data' }

  const migrations = createMigrations().version(1, v =>
    v.createObjectStore({
      name: 'store',
      schema: schema<{ key: Date; property: string }>(),
      primaryKey: 'key',
    })
  )

  const db = await openDB('test-db', migrations)
  await db.add('store', record)

  const result = await db.get('store', record.key)
  expect(result?.key.valueOf()).toBe(record.key.valueOf())
  expect(result?.property).toBe(record.property)

  db.close()
})

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbobjectstore_get.any.js#L45-L57
 */
test("Attempts to retrieve a record that doesn't exist", async () => {
  const migrations = createMigrations().version(1, v =>
    v.createObjectStore({
      name: 'store',
      schema: schema<{ key: number; property: string }>(),
      primaryKey: 'key',
    })
  )

  const db = await openDB('test-db', migrations)

  const result = await db.get('store', 1)
  expect(result).toBe(undefined)

  db.close()
})

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbobjectstore_get.any.js#L59-L82
 */
test('Returns the record with the first key in the range', async () => {
  const migrations = createMigrations().version(1, v =>
    v.createObjectStore({
      name: 'store',
      schema: schema<string>(),
    })
  )

  const db = await openDB('test-db', migrations)

  // Add records with out-of-line keys
  for (let i = 0; i < 10; i++) {
    await db.add('store', `data${i}`, i)
  }

  // Get with key range
  const result = await db.get('store', IDBKeyRange.bound(3, 6))
  expect(result).toBe('data3')

  db.close()
})

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbobjectstore_get.any.js#L84-L107
 */
test('When a transaction is aborted, throw TransactionInactiveError', async () => {
  const migrations = createMigrations().version(1, v =>
    v.createObjectStore({
      name: 'store',
      schema: schema<{ key: number; property: string }>(),
      primaryKey: 'key',
    })
  )

  const db = await openDB('test-db', migrations)

  const tx = db.transaction('store', 'readonly')
  const store = tx.objectStore('store')

  // Abort the transaction immediately
  tx.abort()

  // Accessing the store after abort must throw TransactionInactiveError
  expect(() => {
    void store.get(1)
  }).toThrow(expect.objectContaining({ name: 'TransactionInactiveError' }))

  // Catch the abort rejection
  await tx.done.catch(() => {})

  db.close()
})

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbobjectstore_get.any.js#L109-L128
 */
test('When an invalid key is used, throw DataError', async () => {
  const migrations = createMigrations().version(1, v =>
    v.createObjectStore({
      name: 'store',
      schema: schema<{ key: number; property: string }>(),
      primaryKey: 'key',
    })
  )

  const db = await openDB('test-db', migrations)

  const tx = db.transaction('store', 'readonly')
  const store = tx.objectStore('store')

  // Attempt to use an invalid key (null)
  expect(() => {
    // @ts-expect-error - null is not a valid key
    void store.get(null)
  }).toThrow(expect.objectContaining({ name: 'DataError' }))

  db.close()
})

/**
 * IDBObjectStore.clear() Tests
 *
 * Ported from WPT idbobjectstore_clear.any.js
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbobjectstore_clear.any.js
 */

import './wpt-setup'
import { expect, test } from 'vitest'
import { openDB } from '../../lib/idb-adapter'
import { createMigrations } from '../../lib/migration-builder'
import { schema } from '../../lib/schema'

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbobjectstore_clear.any.js#L7-L36
 */
test('Verify clear removes all records', async () => {
  const migrations = createMigrations().version(1, v =>
    v.createObjectStore({
      name: 'store',
      schema: schema<unknown>(),
      autoIncrement: true,
    })
  )

  const db = await openDB('test-db', migrations)

  // Add various records
  await db.add('store', { property: 'data' })
  await db.add('store', { something_different: 'Yup, totally different' })
  await db.add('store', 1234)
  await db.add('store', [1, 2, 1234])

  // Clear all records
  await db.clear('store')

  // Verify no records remain
  const tx = db.transaction('store', 'readonly')
  const cursor = await tx.store.openCursor()
  expect(cursor).toBe(null)

  db.close()
})

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbobjectstore_clear.any.js#L38-L69
 */
test('Clear removes all records from an index', async () => {
  const migrations = createMigrations().version(1, v =>
    v
      .createObjectStore({
        name: 'store',
        schema: schema<
          | { indexedProperty: string | number | number[] }
          | { indexedProperty: string; something_different: string }
          | number
        >(),
        autoIncrement: true,
      })
      .createIndex('index', {
        storeName: 'store',
        // @ts-expect-error - keyPath not valid for all union variants
        keyPath: 'indexedProperty',
      })
  )

  const db = await openDB('test-db', migrations)

  // Add records with indexed property
  await db.add('store', { indexedProperty: 'data' })
  await db.add('store', {
    indexedProperty: 'yo, man',
    something_different: 'Yup, totally different',
  })
  await db.add('store', { indexedProperty: 1234 })
  await db.add('store', { indexedProperty: [1, 2, 1234] })
  await db.add('store', 1234)

  // Clear all records
  await db.clear('store')

  // Verify index is also empty
  const tx = db.transaction('store', 'readonly')
  const index = tx.store.index('index')
  const cursor = await index.openCursor()
  expect(cursor).toBe(null)

  db.close()
})

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbobjectstore_clear.any.js#L71-L93
 */
test('If the transaction this IDBObjectStore belongs to has its mode set to readonly, throw ReadOnlyError', async () => {
  const migrations = createMigrations().version(1, v =>
    v.createObjectStore({
      name: 'store',
      schema: schema<{ pKey: string }>(),
      primaryKey: 'pKey',
    })
  )

  const db = await openDB('test-db', migrations)

  // Add some records first
  await db.add('store', { pKey: 'primaryKey_0' })
  await db.add('store', { pKey: 'primaryKey_1' })

  const tx = db.transaction('store', 'readonly')
  const store = tx.objectStore('store')

  expect(() => {
    // @ts-expect-error - readonly transaction doesn't allow clear
    store.clear()
  }).toThrow(expect.objectContaining({ name: 'ReadOnlyError' }))

  db.close()
})

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbobjectstore_clear.any.js#L95-L108
 */
test.skip('If the object store has been deleted, the implementation must throw a DOMException of type InvalidStateError', () => {
  // Wrapper doesn't allow accessing deleted object stores
})

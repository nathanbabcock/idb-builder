/**
 * IDBObjectStore.count() Tests
 *
 * Ported from WPT idbobjectstore_count.any.js
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbobjectstore_count.any.js
 */

import './wpt-setup'
import { expect, test } from 'vitest'
import { openDB } from '../../lib/idb-adapter'
import { createMigrations } from '../../lib/migration-builder'
import { schema } from '../../lib/schema'

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbobjectstore_count.any.js#L7-L31
 */
test('Returns the number of records in the object store', async () => {
  const migrations = createMigrations().version(1, v =>
    v.createObjectStore({
      name: 'store',
      schema: schema<{ data: string }>(),
    })
  )

  const db = await openDB('test-db', migrations)

  // Add 10 records
  for (let i = 0; i < 10; i++) {
    await db.add('store', { data: `data${i}` }, i)
  }

  const count = await db.count('store')
  expect(count).toBe(10)

  db.close()
})

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbobjectstore_count.any.js#L33-L57
 */
test('Returns the number of records that have keys within the range', async () => {
  const migrations = createMigrations().version(1, v =>
    v.createObjectStore({
      name: 'store',
      schema: schema<{ data: string }>(),
    })
  )

  const db = await openDB('test-db', migrations)

  // Add 10 records with keys 0-9
  for (let i = 0; i < 10; i++) {
    await db.add('store', { data: `data${i}` }, i)
  }

  // Count records with keys 5-20 (should be 5: 5,6,7,8,9)
  const count = await db.count('store', IDBKeyRange.bound(5, 20))
  expect(count).toBe(5)

  db.close()
})

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbobjectstore_count.any.js#L59-L80
 */
test('Returns the number of records that have keys with the key', async () => {
  const migrations = createMigrations().version(1, v =>
    v.createObjectStore({
      name: 'store',
      schema: schema<{ k: string }>(),
      primaryKey: 'k',
    })
  )

  const db = await openDB('test-db', migrations)

  // Add 5 records
  for (let i = 0; i < 5; i++) {
    await db.add('store', { k: `key_${i}` })
  }

  // Count exact key match
  const countKey2 = await db.count('store', 'key_2')
  expect(countKey2).toBe(1)

  // Count non-matching key
  const countKeyUnderscore = await db.count('store', 'key_')
  expect(countKeyUnderscore).toBe(0)

  db.close()
})

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbobjectstore_count.any.js#L82-L95
 */
test.skip('If the object store has been deleted, the implementation must throw a DOMException of type InvalidStateError', () => {
  // Wrapper doesn't allow accessing deleted object stores
})

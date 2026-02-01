/**
 * IDBDatabase.deleteObjectStore() Tests
 *
 * Ported from WPT idbdatabase_deleteObjectStore.any.js
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbdatabase_deleteObjectStore.any.js
 */

import './wpt-setup'
import { expect, test } from 'vitest'
import { openDB } from '../../lib/idb-adapter'
import { createMigrations } from '../../lib/migration-builder'
import { schema } from '../../lib/schema'

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbdatabase_deleteObjectStore.any.js#L9-L48
 *
 * Tests that:
 * 1. Deleted object store's name is removed from database's list
 * 2. (SKIPPED) Operations on deleted store throw InvalidStateError - can't test with wrapper
 */
test("Deleted object store's name should be removed from database's list", async () => {
  const migrations = createMigrations()
    .version(1, v =>
      v
        .createObjectStore({
          name: 'store',
          schema: schema<{ a: string }>(),
          autoIncrement: true,
        })
        .createIndex('idx', {
          storeName: 'store',
          keyPath: 'a',
        })
    )
    .version(2, v => v.deleteObjectStore('store'))

  const db = await openDB('test-db', migrations)

  expect(db.objectStoreNames.length).toBe(0)
  expect((db.objectStoreNames as DOMStringList).contains('store')).toBe(false)

  db.close()
})

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbdatabase_deleteObjectStore.any.js#L50-L58
 *
 * Note: Wrapper prevents this at compile time. Using @ts-expect-error to test runtime.
 */
test('Attempting to remove an object store that does not exist should throw a NotFoundError', async () => {
  const migrations = createMigrations().version(1, v =>
    v
      .createObjectStore({
        name: 'exists',
        schema: schema<{ value: string }>(),
      })
      // @ts-expect-error testing runtime error for non-existent store
      .deleteObjectStore('whatever')
  )

  await expect(openDB('test-db', migrations)).rejects.toMatchObject({
    name: 'NotFoundError',
  })
})

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbdatabase_deleteObjectStore.any.js#L60-L89
 *
 * Tests that a store can be deleted and recreated with the same name but different schema.
 * The new store should not have the old store's indexes or keyPath.
 */
test('Delete and recreate object store with same name but different schema', async () => {
  const migrations = createMigrations()
    .version(1, v =>
      v
        .createObjectStore({
          name: 'resurrected',
          schema: schema<{ k: number; i: string }>(),
          primaryKey: 'k',
          autoIncrement: true,
        })
        .createIndex('idx', {
          storeName: 'resurrected',
          keyPath: 'i',
        })
    )
    .version(2, v => v.deleteObjectStore('resurrected'))
    .version(3, v =>
      v.createObjectStore({
        name: 'resurrected',
        schema: schema<string>(),
        autoIncrement: true,
      })
    )

  const db = await openDB('test-db', migrations)

  // Verify the new store exists
  expect(db.objectStoreNames.contains('resurrected')).toBe(true)

  // Verify the new store has different properties (no keyPath, no index)
  const tx = db.transaction('resurrected', 'readonly')
  const store = tx.objectStore('resurrected')

  expect(store.keyPath).toBe(null)
  // Cast to DOMStringList to check for index that doesn't exist in schema
  expect((store.indexNames as DOMStringList).contains('idx')).toBe(false)

  await tx.done
  db.close()
})

/**
 * Additional test: Verify data is deleted with object store
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbdatabase_deleteObjectStore.any.js#L60-L89
 */
test('Recreated store starts with fresh auto-increment counter', async () => {
  // First, create and populate a store (out-of-line auto-increment)
  const migrations1 = createMigrations().version(1, v =>
    v.createObjectStore({
      name: 'store',
      schema: schema<{ value: string }>(),
      autoIncrement: true,
    })
  )

  const db1 = await openDB('test-db-fresh', migrations1)
  // Add items to advance auto-increment counter
  await db1.add('store', { value: 'first' })
  await db1.add('store', { value: 'second' })
  const key3 = await db1.add('store', { value: 'third' })
  expect(key3).toBe(3)
  db1.close()

  // Now delete and recreate
  const migrations2 = createMigrations()
    .version(1, v =>
      v.createObjectStore({
        name: 'store',
        schema: schema<{ value: string }>(),
        autoIncrement: true,
      })
    )
    .version(2, v => v.deleteObjectStore('store'))
    .version(3, v =>
      v.createObjectStore({
        name: 'store',
        schema: schema<{ value: string }>(),
        autoIncrement: true,
      })
    )

  const db2 = await openDB('test-db-fresh', migrations2)

  // Auto-increment should restart from 1
  const newKey = await db2.add('store', { value: 'new first' })
  expect(newKey).toBe(1)

  db2.close()
})

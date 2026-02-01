/**
 * IDBObjectStore.deleteIndex() Tests
 *
 * Ported from WPT idbobjectstore_deleteIndex.any.js
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbobjectstore_deleteIndex.any.js
 */

import './wpt-setup'
import { expect, test } from 'vitest'
import { openDB } from '../../lib/idb-adapter'
import { createMigrations } from '../../lib/migration-builder'
import { schema } from '../../lib/schema'

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbobjectstore_deleteIndex.any.js#L8-L41
 */
test('IDBObjectStore.deleteIndex() removes the index', async () => {
  // Version 1: Create store with index
  const migrationsV1 = createMigrations().version(1, v =>
    v
      .createObjectStore({
        name: 'test',
        schema: schema<{ indexedProperty: string }>(),
      })
      .createIndex('index', {
        storeName: 'test',
        keyPath: 'indexedProperty',
      })
  )

  const db1 = await openDB('test-db', migrationsV1)
  db1.close()

  // Version 2: Delete the index
  const migrationsV2 = createMigrations()
    .version(1, v =>
      v
        .createObjectStore({
          name: 'test',
          schema: schema<{ indexedProperty: string }>(),
        })
        .createIndex('index', {
          storeName: 'test',
          keyPath: 'indexedProperty',
        })
    )
    .version(2, v => v.deleteIndex('index', { storeName: 'test' }))

  const db2 = await openDB('test-db', migrationsV2)

  const tx = db2.transaction('test', 'readonly')
  const store = tx.objectStore('test')

  // Accessing deleted index should throw NotFoundError
  expect(() => {
    // @ts-expect-error - index was deleted in version 2
    store.index('index')
  }).toThrow(expect.objectContaining({ name: 'NotFoundError' }))

  db2.close()
})

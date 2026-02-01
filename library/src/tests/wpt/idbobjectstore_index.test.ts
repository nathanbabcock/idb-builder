/**
 * IDBObjectStore.index() - returns an index Tests
 *
 * Ported from WPT idbobjectstore_index.any.js
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbobjectstore_index.any.js
 */

import './wpt-setup'
import { expect, test } from 'vitest'
import { openDB } from '../../lib/idb-adapter'
import { createMigrations } from '../../lib/migration-builder'
import { schema } from '../../lib/schema'

interface TestRecord {
  indexedProperty: string
}

test('IDBObjectStore.index() returns an IDBIndex', async () => {
  const migrations = createMigrations().version(1, v =>
    v
      .createObjectStore({
        name: 'store',
        schema: schema<TestRecord>(),
      })
      .createIndex('index', {
        storeName: 'store',
        keyPath: 'indexedProperty',
      })
  )

  const db = await openDB('test-db', migrations)

  try {
    const tx = db.transaction('store', 'readonly')
    const store = tx.objectStore('store')
    const index = store.index('index')

    expect(index).toBeInstanceOf(IDBIndex)

    await tx.done
  } finally {
    db.close()
  }
})

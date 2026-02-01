/**
 * IDBObjectStore.indexNames Property Tests
 *
 * Ported from WPT idbindex_indexNames.any.js
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbindex_indexNames.any.js
 */

import './wpt-setup'
import { expect, test } from 'vitest'
import { openDB } from '../../lib/idb-adapter'
import { createMigrations } from '../../lib/migration-builder'
import { schema } from '../../lib/schema'

interface TestRecord {
  key: string
  data: string
}

test('Verify IDBObjectStore.indexNames property', async () => {
  const migrations = createMigrations().version(1, v =>
    v
      .createObjectStore({
        name: 'test',
        schema: schema<TestRecord>(),
        primaryKey: 'key',
      })
      .createIndex('index', {
        storeName: 'test',
        keyPath: 'data',
      })
  )

  const db = await openDB('test-db', migrations)

  try {
    const txn = db.transaction('test', 'readonly')
    const store = txn.objectStore('test')

    expect(store.indexNames[0]).toBe('index')
    expect(store.indexNames.length).toBe(1)

    await txn.done
  } finally {
    db.close()
  }
})

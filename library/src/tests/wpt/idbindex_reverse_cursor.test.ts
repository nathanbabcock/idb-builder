/**
 * Reverse Cursor Validity Tests
 *
 * Ported from WPT idbindex_reverse_cursor.any.js
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbindex_reverse_cursor.any.js
 */

import './wpt-setup'
import { expect, test } from 'vitest'
import { openDB } from '../../lib/idb-adapter'
import { createMigrations } from '../../lib/migration-builder'
import { schema } from '../../lib/schema'

interface TestRecord {
  key: string
  indexedOn: number
}

test('Reverse cursor sees update from separate transactions', async () => {
  const migrations = createMigrations().version(1, v =>
    v
      .createObjectStore({
        name: 'objectStore',
        schema: schema<TestRecord>(),
        primaryKey: 'key',
      })
      .createIndex('index', {
        storeName: 'objectStore',
        keyPath: 'indexedOn',
      })
  )

  const db = await openDB('test-db', migrations)

  try {
    // Transaction 1: Add first item with indexedOn = 3
    await db.add('objectStore', { key: 'firstItem', indexedOn: 3 })

    // Transaction 2: Update first item to indexedOn = -1 (outside range)
    await db.put('objectStore', { key: 'firstItem', indexedOn: -1 })

    // Transaction 3: Add second item with indexedOn = 2
    await db.add('objectStore', { key: 'secondItem', indexedOn: 2 })

    // Transaction 4: Read with reverse cursor
    const txn = db.transaction('objectStore', 'readonly')
    const index = txn.objectStore('objectStore').index('index')

    const results: TestRecord[] = []
    let cursor = await index.openCursor(IDBKeyRange.bound(0, 10), 'prev')

    while (cursor) {
      results.push(cursor.value)
      cursor = await cursor.continue()
    }

    expect(results.length).toBe(1)
    expect(results[0].key).toBe('secondItem')

    await txn.done
  } finally {
    db.close()
  }
})

test('Reverse cursor sees in-transaction update', async () => {
  const migrations = createMigrations().version(1, v =>
    v
      .createObjectStore({
        name: 'objectStore',
        schema: schema<TestRecord>(),
        primaryKey: 'key',
      })
      .createIndex('index', {
        storeName: 'objectStore',
        keyPath: 'indexedOn',
      })
  )

  const db = await openDB('test-db', migrations)

  try {
    // Single transaction with multiple operations
    const txn = db.transaction('objectStore', 'readwrite')
    const store = txn.objectStore('objectStore')

    await store.add({ key: '1', indexedOn: 2 })
    await store.put({ key: '1', indexedOn: -1 }) // Update to be outside range
    await store.add({ key: '2', indexedOn: 1 })

    await txn.done

    // Read with reverse cursor
    const txn2 = db.transaction('objectStore', 'readonly')
    const index = txn2.objectStore('objectStore').index('index')

    const results: TestRecord[] = []
    let cursor = await index.openCursor(IDBKeyRange.bound(0, 10), 'prev')

    while (cursor) {
      results.push(cursor.value)
      cursor = await cursor.continue()
    }

    expect(results.length).toBe(1)
    expect(results[0].key).toBe('2')

    await txn2.done
  } finally {
    db.close()
  }
})

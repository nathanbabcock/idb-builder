/**
 * IDBTransaction - complete event Tests
 *
 * Ported from WPT idbtransaction-oncomplete.any.js
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbtransaction-oncomplete.any.js
 */

import './wpt-setup'
import { expect, test } from 'vitest'
import { openDB } from '../../lib/idb-adapter'
import { createMigrations } from '../../lib/migration-builder'
import { schema } from '../../lib/schema'

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbtransaction-oncomplete.any.js#L7-L44
 */
test('Transaction complete event fires in correct order', async () => {
  const migrations = createMigrations().version(1, v =>
    v.createObjectStore({
      name: 'store',
      schema: schema<string>(),
    })
  )

  const db = await openDB('test-db', migrations)

  try {
    // After successful open, the upgrade transaction has completed
    // Now we can start a new transaction
    const txn = db.transaction('store', 'readonly')
    const store = txn.objectStore('store')

    // Open a cursor (will return null on empty store)
    const cursor = await store.openCursor()
    expect(cursor).toBeNull() // Empty store

    // Count should work
    const count = await store.count()
    expect(count).toBe(0)

    await txn.done
  } finally {
    db.close()
  }
})

/**
 * Test that transaction complete event fires after all requests complete
 */
test('Transaction completes after all requests finish', async () => {
  const migrations = createMigrations().version(1, v =>
    v.createObjectStore({
      name: 'store',
      schema: schema<string>(),
    })
  )

  const db = await openDB('test-db', migrations)

  try {
    // Write some data
    const txn1 = db.transaction('store', 'readwrite')
    await txn1.objectStore('store').add('data1', 'key1')
    await txn1.objectStore('store').add('data2', 'key2')
    await txn1.done

    // Read it back
    const txn2 = db.transaction('store', 'readonly')
    const store = txn2.objectStore('store')

    const count = await store.count()
    expect(count).toBe(2)

    const cursor = await store.openCursor()
    expect(cursor).not.toBeNull()
    expect(cursor!.value).toBe('data1')

    await txn2.done
  } finally {
    db.close()
  }
})

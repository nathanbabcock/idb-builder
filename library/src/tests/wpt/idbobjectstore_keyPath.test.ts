/**
 * IndexedDB: IDBObjectStore keyPath attribute - same object Tests
 *
 * Ported from WPT idbobjectstore_keyPath.any.js
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbobjectstore_keyPath.any.js
 */

import './wpt-setup'
import { expect, test } from 'vitest'
import { openDB } from '../../lib/idb-adapter'
import { createMigrations } from '../../lib/migration-builder'
import { schema } from '../../lib/schema'

interface TestRecord {
  a: number
  b: number
}

test("IDBObjectStore's keyPath attribute returns the same object", async () => {
  const migrations = createMigrations().version(1, v =>
    v.createObjectStore({
      name: 'store',
      schema: schema<TestRecord>(),
      primaryKey: ['a', 'b'],
    })
  )

  const db = await openDB('test-db', migrations)

  try {
    const tx = db.transaction('store', 'readonly')
    const store = tx.objectStore('store')

    expect(typeof store.keyPath).toBe('object')
    expect(Array.isArray(store.keyPath)).toBe(true)

    // Same object instance is returned each time keyPath is inspected
    expect(store.keyPath).toBe(store.keyPath)

    // Different instances are returned from different store instances
    const tx2 = db.transaction('store', 'readonly')
    const store2 = tx2.objectStore('store')

    expect(store.keyPath).not.toBe(store2.keyPath)

    await tx.done
    await tx2.done
  } finally {
    db.close()
  }
})

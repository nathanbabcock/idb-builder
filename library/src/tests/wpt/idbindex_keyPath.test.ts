/**
 * IndexedDB: IDBIndex keyPath attribute Tests
 *
 * Ported from WPT idbindex_keyPath.any.js
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbindex_keyPath.any.js
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

interface SingleKeyRecord {
  a: number
  b: number
  c: number
}

test("IDBIndex's keyPath attribute returns the same object", async () => {
  const migrations = createMigrations().version(1, v =>
    v
      .createObjectStore({
        name: 'store',
        schema: schema<TestRecord>(),
        primaryKey: ['a', 'b'],
      })
      .createIndex('index', {
        storeName: 'store',
        keyPath: ['a', 'b'],
      })
  )

  const db = await openDB('test-db', migrations)

  try {
    const tx = db.transaction('store', 'readonly')
    const store = tx.objectStore('store')
    const index = store.index('index')

    expect(typeof index.keyPath).toBe('object')
    expect(Array.isArray(index.keyPath)).toBe(true)

    // Same object instance is returned each time keyPath is inspected
    expect(index.keyPath).toBe(index.keyPath)

    // Different instances are returned from different index instances
    const tx2 = db.transaction('store', 'readonly')
    const store2 = tx2.objectStore('store')
    const index2 = store2.index('index')

    expect(index.keyPath).not.toBe(index2.keyPath)

    await tx.done
    await tx2.done
  } finally {
    db.close()
  }
})

test("IDBIndex's keyPath array with a single value", async () => {
  const migrations = createMigrations().version(1, v =>
    v
      .createObjectStore({
        name: 'store',
        schema: schema<SingleKeyRecord>(),
        autoIncrement: true,
      })
      .createIndex('index', {
        storeName: 'store',
        keyPath: ['a'],
      })
  )

  const db = await openDB('test-db', migrations)

  try {
    // Add test data
    await db.add('store', { a: 1, b: 2, c: 3 })

    const tx = db.transaction('store', 'readonly')
    const store = tx.objectStore('store')
    const index = store.index('index')

    const cursor = await index.openCursor()
    expect(cursor).not.toBeNull()

    const expectedKeyValue = [1]
    expect(cursor!.key).toEqual(expectedKeyValue)

    await tx.done
  } finally {
    db.close()
  }
})

test("IDBIndex's keyPath array with multiple values", async () => {
  const migrations = createMigrations().version(1, v =>
    v
      .createObjectStore({
        name: 'store',
        schema: schema<SingleKeyRecord>(),
        autoIncrement: true,
      })
      .createIndex('index', {
        storeName: 'store',
        keyPath: ['a', 'b'],
      })
  )

  const db = await openDB('test-db', migrations)

  try {
    // Add test data
    await db.add('store', { a: 1, b: 2, c: 3 })

    const tx = db.transaction('store', 'readonly')
    const store = tx.objectStore('store')
    const index = store.index('index')

    const cursor = await index.openCursor()
    expect(cursor).not.toBeNull()

    const expectedKeyValue = [1, 2]
    expect(cursor!.key).toEqual(expectedKeyValue)

    await tx.done
  } finally {
    db.close()
  }
})

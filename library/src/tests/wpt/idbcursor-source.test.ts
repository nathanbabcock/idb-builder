/**
 * IDBCursor.source Tests
 *
 * Ported from WPT idbcursor-source.any.js
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbcursor-source.any.js
 */

import './wpt-setup'
import { expect, test } from 'vitest'
import { openDB } from '../../lib/idb-adapter'
import { createMigrations } from '../../lib/migration-builder'
import { schema } from '../../lib/schema'

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbcursor-source.any.js#L48-L54
 */
test('IDBCursor.source - IDBObjectStore', async () => {
  const migrations = createMigrations().version(1, v =>
    v
      .createObjectStore({
        name: 'my_objectstore',
        schema: schema<string>(),
      })
      .createIndex('my_index', {
        storeName: 'my_objectstore',
        keyPath: '',
      })
  )

  const db = await openDB('test-db', migrations)

  try {
    // Add data
    const txn1 = db.transaction('my_objectstore', 'readwrite')
    await txn1.objectStore('my_objectstore').add('data', 1)
    await txn1.objectStore('my_objectstore').add('data2', 2)
    await txn1.done

    // Read via object store cursor
    const txn2 = db.transaction('my_objectstore', 'readonly')
    const store = txn2.objectStore('my_objectstore')
    let cursor = await store.openCursor()

    let count = 0
    while (cursor) {
      expect(cursor.source).toBe(store)
      expect(cursor.source.name).toBe('my_objectstore')
      cursor = await cursor.continue()
      count++
    }

    expect(count).toBe(2)
    await txn2.done
  } finally {
    db.close()
  }
})

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbcursor-source.any.js#L56-L63
 */
test('IDBCursor.source - IDBIndex', async () => {
  const migrations = createMigrations().version(1, v =>
    v
      .createObjectStore({
        name: 'my_objectstore',
        schema: schema<string>(),
      })
      .createIndex('my_index', {
        storeName: 'my_objectstore',
        keyPath: '',
      })
  )

  const db = await openDB('test-db', migrations)

  try {
    // Add data
    const txn1 = db.transaction('my_objectstore', 'readwrite')
    await txn1.objectStore('my_objectstore').add('data', 1)
    await txn1.objectStore('my_objectstore').add('data2', 2)
    await txn1.done

    // Read via index cursor
    const txn2 = db.transaction('my_objectstore', 'readonly')
    const index = txn2.objectStore('my_objectstore').index('my_index')
    let cursor = await index.openCursor()

    let count = 0
    while (cursor) {
      expect(cursor.source).toBe(index)
      expect(cursor.source.name).toBe('my_index')
      cursor = await cursor.continue()
      count++
    }

    expect(count).toBe(2)
    await txn2.done
  } finally {
    db.close()
  }
})

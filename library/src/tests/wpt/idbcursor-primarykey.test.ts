/**
 * IDBCursor.primaryKey Tests
 *
 * Ported from WPT idbcursor-primarykey.any.js
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbcursor-primarykey.any.js
 */

import './wpt-setup'
import { expect, test } from 'vitest'
import { openDB } from '../../lib/idb-adapter'
import { createMigrations } from '../../lib/migration-builder'
import { schema } from '../../lib/schema'

/**
 * Helper to test cursor.primaryKey with different key types
 */
async function cursorPrimaryKeyTest(key: IDBValidKey, description: string) {
  const migrations = createMigrations().version(1, v =>
    v
      .createObjectStore({
        name: 'test',
        schema: schema<string>(),
      })
      .createIndex('index', {
        storeName: 'test',
        keyPath: '',
      })
  )

  const db = await openDB('test-db', migrations)

  try {
    // Add data
    const txn1 = db.transaction('test', 'readwrite')
    await txn1.objectStore('test').add('data', key)
    await txn1.done

    // Read via index cursor
    const txn2 = db.transaction('test', 'readonly')
    const index = txn2.objectStore('test').index('index')
    const cursor = await index.openCursor()

    expect(cursor).not.toBeNull()
    expect(cursor!.value).toBe('data')
    expect(cursor!.key).toBe('data') // Index key is the value (empty string keyPath = value)

    // Compare primaryKey
    if (Array.isArray(key)) {
      expect(cursor!.primaryKey).toEqual(key)
    } else {
      expect(cursor!.primaryKey).toEqual(key)
    }

    await txn2.done
  } finally {
    db.close()
  }
}

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbcursor-primarykey.any.js#L49
 */
test('cursor.primaryKey with number key', async () => {
  await cursorPrimaryKeyTest(1, 'number key')
})

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbcursor-primarykey.any.js#L50
 */
test('cursor.primaryKey with string key', async () => {
  await cursorPrimaryKeyTest('key', 'string key')
})

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbcursor-primarykey.any.js#L51
 */
test('cursor.primaryKey with array key', async () => {
  await cursorPrimaryKeyTest(['my', 'key'], 'array key')
})

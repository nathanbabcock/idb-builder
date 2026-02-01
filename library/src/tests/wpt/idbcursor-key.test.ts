/**
 * IDBCursor.key Tests
 *
 * Ported from WPT idbcursor-key.any.js
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbcursor-key.any.js
 */

import './wpt-setup'
import { expect, test } from 'vitest'
import { openDB } from '../../lib/idb-adapter'
import { createMigrations } from '../../lib/migration-builder'
import { schema } from '../../lib/schema'

/**
 * Helper to test cursor.key with different key types
 */
async function cursorKeyTest(key: IDBValidKey, description: string) {
  const migrations = createMigrations().version(1, v =>
    v.createObjectStore({
      name: 'test',
      schema: schema<string>(),
    })
  )

  const db = await openDB('test-db', migrations)

  try {
    // Add data
    const txn1 = db.transaction('test', 'readwrite')
    await txn1.objectStore('test').add('data', key)
    await txn1.done

    // Read via cursor
    const txn2 = db.transaction('test', 'readonly')
    const store = txn2.objectStore('test')
    const cursor = await store.openCursor()

    expect(cursor).not.toBeNull()
    expect(cursor!.value).toBe('data')

    // Compare keys - need to handle array case specially
    if (Array.isArray(key)) {
      expect(cursor!.key).toEqual(key)
    } else {
      expect(cursor!.key).toEqual(key)
    }

    await txn2.done
  } finally {
    db.close()
  }
}

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbcursor-key.any.js#L41
 */
test('cursor.key with number key', async () => {
  await cursorKeyTest(1, 'number key')
})

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbcursor-key.any.js#L42
 */
test('cursor.key with string key', async () => {
  await cursorKeyTest('key', 'string key')
})

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbcursor-key.any.js#L43
 */
test('cursor.key with array key', async () => {
  await cursorKeyTest(['my', 'key'], 'array key')
})

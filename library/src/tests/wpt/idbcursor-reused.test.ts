/**
 * IDBCursor is Reused Tests
 *
 * Ported from WPT idbcursor-reused.any.js
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbcursor-reused.any.js
 */

import './wpt-setup'
import { expect, test } from 'vitest'
import { openDB } from '../../lib/idb-adapter'
import { createMigrations } from '../../lib/migration-builder'
import { schema } from '../../lib/schema'

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbcursor-reused.any.js#L9-L68
 */
test('IDBCursor is reused across continue() and advance() calls', async () => {
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
    await txn1.objectStore('test').add('data', 'k')
    await txn1.objectStore('test').add('data2', 'k2')
    await txn1.done

    // Test cursor reuse
    const txn2 = db.transaction('test', 'readonly')
    const store = txn2.objectStore('test')

    // Get first cursor position
    let cursor = await store.openCursor()
    expect(cursor).not.toBeNull()
    expect(cursor!.value).toBe('data')

    // Store reference to first cursor
    const firstCursor = cursor

    // Continue to next
    cursor = await cursor!.continue()
    expect(cursor).not.toBeNull()
    expect(cursor!.value).toBe('data2')

    // Verify it's the same cursor object
    expect(cursor).toBe(firstCursor)

    // Advance past the end
    cursor = await cursor!.advance(1)
    expect(cursor).toBeNull()

    await txn2.done
  } finally {
    db.close()
  }
})

/**
 * Additional test: cursor maintains identity through iteration
 */
test('Cursor maintains identity through full iteration', async () => {
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
    await txn1.objectStore('test').add('data1', 'k1')
    await txn1.objectStore('test').add('data2', 'k2')
    await txn1.objectStore('test').add('data3', 'k3')
    await txn1.done

    // Iterate with cursor
    const txn2 = db.transaction('test', 'readonly')
    const store = txn2.objectStore('test')

    let cursor = await store.openCursor()
    const firstCursor = cursor
    const values: string[] = []

    while (cursor) {
      values.push(cursor.value)

      // Each iteration returns the same cursor object
      if (cursor !== firstCursor) {
        expect(cursor).toBe(firstCursor)
      }

      cursor = await cursor.continue()
    }

    expect(values).toEqual(['data1', 'data2', 'data3'])
    await txn2.done
  } finally {
    db.close()
  }
})

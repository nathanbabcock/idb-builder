/**
 * Cursor Overloads Tests
 *
 * Ported from WPT cursor-overloads.any.js
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/cursor-overloads.any.js
 */

import './wpt-setup'
import { expect, test } from 'vitest'
import { openDB } from '../../lib/idb-adapter'
import { createMigrations } from '../../lib/migration-builder'
import { schema } from '../../lib/schema'

/**
 * Helper to verify cursor direction, mimicking WPT's checkCursorDirection
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/cursor-overloads.any.js#L81-L87
 */
async function checkCursorDirection(
  cursorPromise: Promise<{ direction: IDBCursorDirection } | null>,
  direction: IDBCursorDirection
) {
  const cursor = await cursorPromise
  expect(cursor).not.toBeNull()
  expect(cursor!.direction).toBe(direction)
}

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/cursor-overloads.any.js#L7-L87
 */
test('Validate the overloads of IDBObjectStore.openCursor(), IDBIndex.openCursor() and IDBIndex.openKeyCursor()', async () => {
  const migrations = createMigrations().version(1, v =>
    v
      .createObjectStore({
        name: 'store',
        schema: schema<{ value: number }>(),
      })
      .createIndex('index', {
        storeName: 'store',
        keyPath: 'value',
      })
  )

  const db = await openDB('test-db', migrations)

  try {
    // Add a record
    await db.add('store', { value: 0 }, 0)

    const tx = db.transaction('store', 'readonly')
    const store = tx.objectStore('store')
    const index = store.index('index')

    // Test store.openCursor() overloads
    await checkCursorDirection(store.openCursor(), 'next')
    await checkCursorDirection(store.openCursor(0), 'next')
    await checkCursorDirection(store.openCursor(0, 'next'), 'next')
    await checkCursorDirection(store.openCursor(0, 'nextunique'), 'nextunique')
    await checkCursorDirection(store.openCursor(0, 'prev'), 'prev')
    await checkCursorDirection(store.openCursor(0, 'prevunique'), 'prevunique')

    // Test with IDBKeyRange
    await checkCursorDirection(store.openCursor(IDBKeyRange.only(0)), 'next')
    await checkCursorDirection(
      store.openCursor(IDBKeyRange.only(0), 'next'),
      'next'
    )
    await checkCursorDirection(
      store.openCursor(IDBKeyRange.only(0), 'nextunique'),
      'nextunique'
    )
    await checkCursorDirection(
      store.openCursor(IDBKeyRange.only(0), 'prev'),
      'prev'
    )
    await checkCursorDirection(
      store.openCursor(IDBKeyRange.only(0), 'prevunique'),
      'prevunique'
    )

    // Test index.openCursor() overloads
    await checkCursorDirection(index.openCursor(), 'next')
    await checkCursorDirection(index.openCursor(0), 'next')
    await checkCursorDirection(index.openCursor(0, 'next'), 'next')
    await checkCursorDirection(index.openCursor(0, 'nextunique'), 'nextunique')
    await checkCursorDirection(index.openCursor(0, 'prev'), 'prev')
    await checkCursorDirection(index.openCursor(0, 'prevunique'), 'prevunique')

    // Test with IDBKeyRange on index
    await checkCursorDirection(index.openCursor(IDBKeyRange.only(0)), 'next')
    await checkCursorDirection(
      index.openCursor(IDBKeyRange.only(0), 'next'),
      'next'
    )
    await checkCursorDirection(
      index.openCursor(IDBKeyRange.only(0), 'nextunique'),
      'nextunique'
    )
    await checkCursorDirection(
      index.openCursor(IDBKeyRange.only(0), 'prev'),
      'prev'
    )
    await checkCursorDirection(
      index.openCursor(IDBKeyRange.only(0), 'prevunique'),
      'prevunique'
    )

    // Test index.openKeyCursor() overloads
    await checkCursorDirection(index.openKeyCursor(), 'next')
    await checkCursorDirection(index.openKeyCursor(0), 'next')
    await checkCursorDirection(index.openKeyCursor(0, 'next'), 'next')
    await checkCursorDirection(
      index.openKeyCursor(0, 'nextunique'),
      'nextunique'
    )
    await checkCursorDirection(index.openKeyCursor(0, 'prev'), 'prev')
    await checkCursorDirection(
      index.openKeyCursor(0, 'prevunique'),
      'prevunique'
    )

    // Test with IDBKeyRange on index keyCursor
    await checkCursorDirection(index.openKeyCursor(IDBKeyRange.only(0)), 'next')
    await checkCursorDirection(
      index.openKeyCursor(IDBKeyRange.only(0), 'next'),
      'next'
    )
    await checkCursorDirection(
      index.openKeyCursor(IDBKeyRange.only(0), 'nextunique'),
      'nextunique'
    )
    await checkCursorDirection(
      index.openKeyCursor(IDBKeyRange.only(0), 'prev'),
      'prev'
    )
    await checkCursorDirection(
      index.openKeyCursor(IDBKeyRange.only(0), 'prevunique'),
      'prevunique'
    )

    await tx.done
  } finally {
    db.close()
  }
})

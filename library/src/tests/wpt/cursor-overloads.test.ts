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
    let cursor = await store.openCursor()
    expect(cursor).not.toBeNull()
    expect(cursor!.direction).toBe('next')

    cursor = await store.openCursor(0)
    expect(cursor).not.toBeNull()
    expect(cursor!.direction).toBe('next')

    cursor = await store.openCursor(0, 'next')
    expect(cursor).not.toBeNull()
    expect(cursor!.direction).toBe('next')

    cursor = await store.openCursor(0, 'nextunique')
    expect(cursor).not.toBeNull()
    expect(cursor!.direction).toBe('nextunique')

    cursor = await store.openCursor(0, 'prev')
    expect(cursor).not.toBeNull()
    expect(cursor!.direction).toBe('prev')

    cursor = await store.openCursor(0, 'prevunique')
    expect(cursor).not.toBeNull()
    expect(cursor!.direction).toBe('prevunique')

    // Test with IDBKeyRange
    cursor = await store.openCursor(IDBKeyRange.only(0))
    expect(cursor).not.toBeNull()
    expect(cursor!.direction).toBe('next')

    cursor = await store.openCursor(IDBKeyRange.only(0), 'next')
    expect(cursor).not.toBeNull()
    expect(cursor!.direction).toBe('next')

    cursor = await store.openCursor(IDBKeyRange.only(0), 'nextunique')
    expect(cursor).not.toBeNull()
    expect(cursor!.direction).toBe('nextunique')

    cursor = await store.openCursor(IDBKeyRange.only(0), 'prev')
    expect(cursor).not.toBeNull()
    expect(cursor!.direction).toBe('prev')

    cursor = await store.openCursor(IDBKeyRange.only(0), 'prevunique')
    expect(cursor).not.toBeNull()
    expect(cursor!.direction).toBe('prevunique')

    // Test index.openCursor() overloads
    let indexCursor = await index.openCursor()
    expect(indexCursor).not.toBeNull()
    expect(indexCursor!.direction).toBe('next')

    indexCursor = await index.openCursor(0)
    expect(indexCursor).not.toBeNull()
    expect(indexCursor!.direction).toBe('next')

    indexCursor = await index.openCursor(0, 'next')
    expect(indexCursor).not.toBeNull()
    expect(indexCursor!.direction).toBe('next')

    indexCursor = await index.openCursor(0, 'nextunique')
    expect(indexCursor).not.toBeNull()
    expect(indexCursor!.direction).toBe('nextunique')

    indexCursor = await index.openCursor(0, 'prev')
    expect(indexCursor).not.toBeNull()
    expect(indexCursor!.direction).toBe('prev')

    indexCursor = await index.openCursor(0, 'prevunique')
    expect(indexCursor).not.toBeNull()
    expect(indexCursor!.direction).toBe('prevunique')

    // Test with IDBKeyRange on index
    indexCursor = await index.openCursor(IDBKeyRange.only(0))
    expect(indexCursor).not.toBeNull()
    expect(indexCursor!.direction).toBe('next')

    indexCursor = await index.openCursor(IDBKeyRange.only(0), 'next')
    expect(indexCursor).not.toBeNull()
    expect(indexCursor!.direction).toBe('next')

    indexCursor = await index.openCursor(IDBKeyRange.only(0), 'nextunique')
    expect(indexCursor).not.toBeNull()
    expect(indexCursor!.direction).toBe('nextunique')

    indexCursor = await index.openCursor(IDBKeyRange.only(0), 'prev')
    expect(indexCursor).not.toBeNull()
    expect(indexCursor!.direction).toBe('prev')

    indexCursor = await index.openCursor(IDBKeyRange.only(0), 'prevunique')
    expect(indexCursor).not.toBeNull()
    expect(indexCursor!.direction).toBe('prevunique')

    // Test index.openKeyCursor() overloads
    let keyCursor = await index.openKeyCursor()
    expect(keyCursor).not.toBeNull()
    expect(keyCursor!.direction).toBe('next')

    keyCursor = await index.openKeyCursor(0)
    expect(keyCursor).not.toBeNull()
    expect(keyCursor!.direction).toBe('next')

    keyCursor = await index.openKeyCursor(0, 'next')
    expect(keyCursor).not.toBeNull()
    expect(keyCursor!.direction).toBe('next')

    keyCursor = await index.openKeyCursor(0, 'nextunique')
    expect(keyCursor).not.toBeNull()
    expect(keyCursor!.direction).toBe('nextunique')

    keyCursor = await index.openKeyCursor(0, 'prev')
    expect(keyCursor).not.toBeNull()
    expect(keyCursor!.direction).toBe('prev')

    keyCursor = await index.openKeyCursor(0, 'prevunique')
    expect(keyCursor).not.toBeNull()
    expect(keyCursor!.direction).toBe('prevunique')

    // Test with IDBKeyRange on index keyCursor
    keyCursor = await index.openKeyCursor(IDBKeyRange.only(0))
    expect(keyCursor).not.toBeNull()
    expect(keyCursor!.direction).toBe('next')

    keyCursor = await index.openKeyCursor(IDBKeyRange.only(0), 'next')
    expect(keyCursor).not.toBeNull()
    expect(keyCursor!.direction).toBe('next')

    keyCursor = await index.openKeyCursor(IDBKeyRange.only(0), 'nextunique')
    expect(keyCursor).not.toBeNull()
    expect(keyCursor!.direction).toBe('nextunique')

    keyCursor = await index.openKeyCursor(IDBKeyRange.only(0), 'prev')
    expect(keyCursor).not.toBeNull()
    expect(keyCursor!.direction).toBe('prev')

    keyCursor = await index.openKeyCursor(IDBKeyRange.only(0), 'prevunique')
    expect(keyCursor).not.toBeNull()
    expect(keyCursor!.direction).toBe('prevunique')

    await tx.done
  } finally {
    db.close()
  }
})

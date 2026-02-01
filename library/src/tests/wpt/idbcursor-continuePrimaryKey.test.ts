/**
 * IDBCursor.continuePrimaryKey() Tests
 *
 * Ported from WPT idbcursor-continuePrimaryKey.any.js
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbcursor-continuePrimaryKey.any.js
 */

import './wpt-setup'
import { expect, test } from 'vitest'
import { openDB } from '../../lib/idb-adapter'
import { createMigrations } from '../../lib/migration-builder'
import { schema } from '../../lib/schema'

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbcursor-continuePrimaryKey.any.js#L9-L50
 */
test('continuePrimaryKey - multiEntry index cursor iteration order', async () => {
  const migrations = createMigrations().version(1, v =>
    v
      .createObjectStore({
        name: 'store',
        schema: schema<{ indexKey: string[] }>(),
      })
      .createIndex('index', {
        storeName: 'store',
        keyPath: 'indexKey',
        multiEntry: true,
      })
  )

  const db = await openDB('test-db', migrations)

  try {
    // Add records with multiEntry array keys
    await db.add('store', { indexKey: ['a', 'b'] }, 1)
    await db.add('store', { indexKey: ['a', 'b'] }, 2)
    await db.add('store', { indexKey: ['a', 'b'] }, 3)
    await db.add('store', { indexKey: ['b'] }, 4)

    const expectedIndexEntries = [
      { key: 'a', primaryKey: 1 },
      { key: 'a', primaryKey: 2 },
      { key: 'a', primaryKey: 3 },
      { key: 'b', primaryKey: 1 },
      { key: 'b', primaryKey: 2 },
      { key: 'b', primaryKey: 3 },
      { key: 'b', primaryKey: 4 },
    ]

    const tx = db.transaction('store', 'readonly')
    const store = tx.objectStore('store')
    const index = store.index('index')

    const actualEntries: Array<{ key: string; primaryKey: number }> = []
    let cursor = await index.openCursor()
    while (cursor) {
      actualEntries.push({
        key: cursor.key as string,
        primaryKey: cursor.primaryKey as number,
      })
      cursor = await cursor.continue()
    }

    await tx.done

    expect(actualEntries).toEqual(expectedIndexEntries)
  } finally {
    db.close()
  }
})

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbcursor-continuePrimaryKey.any.js#L80-L103
 *
 * Skipped: Wrapper does not expose continuePrimaryKey method
 */
test.skip('continuePrimaryKey - skip to specific key and primaryKey', async () => {
  const migrations = createMigrations().version(1, v =>
    v
      .createObjectStore({
        name: 'store',
        schema: schema<{ indexKey: string[] }>(),
      })
      .createIndex('index', {
        storeName: 'store',
        keyPath: 'indexKey',
        multiEntry: true,
      })
  )

  const db = await openDB('test-db', migrations)

  try {
    await db.add('store', { indexKey: ['a', 'b'] }, 1)
    await db.add('store', { indexKey: ['a', 'b'] }, 2)
    await db.add('store', { indexKey: ['a', 'b'] }, 3)
    await db.add('store', { indexKey: ['b'] }, 4)

    // Test continuePrimaryKey('a', 3) - should land on {key: 'a', primaryKey: 3}
    const tx1 = db.transaction('store', 'readonly')
    const index1 = tx1.objectStore('store').index('index')

    let cursor1 = await index1.openCursor()
    expect(cursor1).not.toBeNull()
    expect(cursor1!.key).toBe('a')
    expect(cursor1!.primaryKey).toBe(1)

    cursor1 = await cursor1!.continuePrimaryKey('a', 3)
    expect(cursor1).not.toBeNull()
    expect(cursor1!.key).toBe('a')
    expect(cursor1!.primaryKey).toBe(3)

    await tx1.done

    // Test continuePrimaryKey('b', 4) - should land on {key: 'b', primaryKey: 4}
    const tx2 = db.transaction('store', 'readonly')
    const index2 = tx2.objectStore('store').index('index')

    let cursor2 = await index2.openCursor()
    cursor2 = await cursor2!.continuePrimaryKey('b', 4)
    expect(cursor2).not.toBeNull()
    expect(cursor2!.key).toBe('b')
    expect(cursor2!.primaryKey).toBe(4)

    await tx2.done

    // Test continuePrimaryKey('b', 5) - should return null (no match)
    const tx3 = db.transaction('store', 'readonly')
    const index3 = tx3.objectStore('store').index('index')

    let cursor3 = await index3.openCursor()
    cursor3 = await cursor3!.continuePrimaryKey('b', 5)
    expect(cursor3).toBeNull()

    await tx3.done
  } finally {
    db.close()
  }
})

/**
 * Test continuePrimaryKey with key that doesn't exist
 *
 * Skipped: Wrapper does not expose continuePrimaryKey method
 */
test.skip('continuePrimaryKey - skip to non-existent key returns null', async () => {
  const migrations = createMigrations().version(1, v =>
    v
      .createObjectStore({
        name: 'store',
        schema: schema<{ indexKey: string }>(),
      })
      .createIndex('index', {
        storeName: 'store',
        keyPath: 'indexKey',
      })
  )

  const db = await openDB('test-db', migrations)

  try {
    await db.add('store', { indexKey: 'a' }, 1)
    await db.add('store', { indexKey: 'b' }, 2)

    const tx = db.transaction('store', 'readonly')
    const index = tx.objectStore('store').index('index')

    let cursor = await index.openCursor()
    expect(cursor).not.toBeNull()

    // Skip to 'c' which doesn't exist
    cursor = await cursor!.continuePrimaryKey('c', 1)
    expect(cursor).toBeNull()

    await tx.done
  } finally {
    db.close()
  }
})

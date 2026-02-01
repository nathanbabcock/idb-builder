/**
 * IndexedDB: scoping for database / object store / index names, and index keys
 *
 * Ported from WPT name-scopes.any.js
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/name-scopes.any.js
 *
 * Note: Simplified version using wrapper API.
 */

import './wpt-setup'
import { expect, test } from 'vitest'
import { openDB } from '../../lib/idb-adapter'
import { createMigrations } from '../../lib/migration-builder'
import { schema } from '../../lib/schema'

interface TestRecord {
  pKey: number
  xKey: string
  yKey: string
  path: string
}

test('Non-unique index keys', async () => {
  const dbName = 'name-scopes-nonunique'

  const migrations = createMigrations().version(1, v =>
    v
      .createObjectStore({
        name: 'store',
        schema: schema<TestRecord>(),
        primaryKey: 'pKey',
        autoIncrement: true,
      })
      .createIndex('idx_x', {
        storeName: 'store',
        keyPath: 'xKey',
        unique: false,
      })
      .createIndex('idx_y', {
        storeName: 'store',
        keyPath: 'yKey',
        unique: false,
      })
  )

  const db = await openDB(dbName, migrations)

  try {
    // Add records with non-unique keys
    await db.add('store', {
      xKey: 'x',
      yKey: 'x',
      path: 'record-1',
    } as TestRecord)
    await db.add('store', {
      xKey: 'x',
      yKey: 'y',
      path: 'record-2',
    } as TestRecord)
    await db.add('store', {
      xKey: 'y',
      yKey: 'x',
      path: 'record-3',
    } as TestRecord)
    await db.add('store', {
      xKey: 'y',
      yKey: 'y',
      path: 'record-4',
    } as TestRecord)

    // Read all via idx_x index
    const tx = db.transaction('store', 'readonly')
    const store = tx.objectStore('store')
    const idxX = store.index('idx_x')

    const resultsX: TestRecord[] = []
    let cursorX = await idxX.openCursor()
    while (cursorX) {
      resultsX.push(cursorX.value)
      cursorX = await cursorX.continue()
    }

    expect(resultsX.length).toBe(4)

    // Records should be sorted by xKey
    expect(resultsX[0].xKey).toBe('x')
    expect(resultsX[1].xKey).toBe('x')
    expect(resultsX[2].xKey).toBe('y')
    expect(resultsX[3].xKey).toBe('y')

    await tx.done
  } finally {
    db.close()
  }
})

test('Unique index keys', async () => {
  const dbName = 'name-scopes-unique'

  const migrations = createMigrations().version(1, v =>
    v
      .createObjectStore({
        name: 'store',
        schema: schema<TestRecord>(),
        primaryKey: 'pKey',
        autoIncrement: true,
      })
      .createIndex('idx_x', {
        storeName: 'store',
        keyPath: 'xKey',
        unique: true,
      })
      .createIndex('idx_y', {
        storeName: 'store',
        keyPath: 'yKey',
        unique: true,
      })
  )

  const db = await openDB(dbName, migrations)

  try {
    // Add records with unique keys
    await db.add('store', {
      xKey: 'xx',
      yKey: 'xx',
      path: 'record-1',
    } as TestRecord)
    await db.add('store', {
      xKey: 'xy',
      yKey: 'yx',
      path: 'record-2',
    } as TestRecord)
    await db.add('store', {
      xKey: 'yx',
      yKey: 'xy',
      path: 'record-3',
    } as TestRecord)
    await db.add('store', {
      xKey: 'yy',
      yKey: 'yy',
      path: 'record-4',
    } as TestRecord)

    // Read all via idx_x index
    const tx = db.transaction('store', 'readonly')
    const store = tx.objectStore('store')
    const idxX = store.index('idx_x')

    const resultsX: TestRecord[] = []
    let cursorX = await idxX.openCursor()
    while (cursorX) {
      resultsX.push(cursorX.value)
      cursorX = await cursorX.continue()
    }

    expect(resultsX.length).toBe(4)

    // Records should be sorted by xKey
    expect(resultsX[0].xKey).toBe('xx')
    expect(resultsX[1].xKey).toBe('xy')
    expect(resultsX[2].xKey).toBe('yx')
    expect(resultsX[3].xKey).toBe('yy')

    await tx.done
  } finally {
    db.close()
  }
})

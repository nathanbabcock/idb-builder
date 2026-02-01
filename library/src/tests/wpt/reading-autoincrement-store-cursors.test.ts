/**
 * Reading autoincrement store cursors Tests
 *
 * Ported from WPT reading-autoincrement-store-cursors.any.js
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/reading-autoincrement-store-cursors.any.js
 */

import './wpt-setup'
import { expect, test } from 'vitest'
import { openDB } from '../../lib/idb-adapter'
import { createMigrations } from '../../lib/migration-builder'
import { schema } from '../../lib/schema'

interface TestRecord {
  id: number
  name: string
}

interface CursorResult {
  key: IDBValidKey
  primaryKey: IDBValidKey
  value?: TestRecord
}

function nameForId(id: number): string {
  return `Object ${id}`
}

function createMigration() {
  return createMigrations().version(1, v =>
    v
      .createObjectStore({
        name: 'store',
        schema: schema<TestRecord>(),
        primaryKey: 'id',
        autoIncrement: true,
      })
      .createIndex('by_name', {
        storeName: 'store',
        keyPath: 'name',
        unique: true,
      })
      .createIndex('by_id', {
        storeName: 'store',
        keyPath: 'id',
        unique: true,
      })
  )
}

test('IDBObjectStore.openCursor() iterates over an autoincrement store', async () => {
  const migrations = createMigration()
  const db = await openDB('test-autoincrement-cursors-open', migrations)

  try {
    // Cover writing from the initial transaction
    for (let i = 1; i <= 32; i++) {
      if (i % 2 === 0) {
        await db.add('store', { name: nameForId(i), id: i })
      } else {
        await db.add('store', { name: nameForId(i) } as TestRecord)
      }
    }

    const tx = db.transaction('store', 'readonly')
    const store = tx.objectStore('store')

    const results: CursorResult[] = []
    let cursor = await store.openCursor()

    while (cursor) {
      results.push({
        key: cursor.key,
        primaryKey: cursor.primaryKey,
        value: cursor.value,
      })
      cursor = await cursor.continue()
    }

    expect(results.length).toBe(32)
    for (let i = 1; i <= 32; i++) {
      expect(results[i - 1].key).toBe(i)
      expect(results[i - 1].primaryKey).toBe(i)
      expect(results[i - 1].value!.id).toBe(i)
      expect(results[i - 1].value!.name).toBe(nameForId(i))
    }

    await tx.done
  } finally {
    db.close()
  }
})

test('IDBObjectStore.openKeyCursor() iterates over an autoincrement store', async () => {
  const migrations = createMigration()
  const db = await openDB('test-autoincrement-cursors-key', migrations)

  try {
    // Cover writing from the initial transaction
    for (let i = 1; i <= 32; i++) {
      if (i % 2 === 0) {
        await db.add('store', { name: nameForId(i), id: i })
      } else {
        await db.add('store', { name: nameForId(i) } as TestRecord)
      }
    }

    const tx = db.transaction('store', 'readonly')
    const store = tx.objectStore('store')

    const results: CursorResult[] = []
    let cursor = await store.openKeyCursor()

    while (cursor) {
      results.push({
        key: cursor.key,
        primaryKey: cursor.primaryKey,
      })
      cursor = await cursor.continue()
    }

    expect(results.length).toBe(32)
    for (let i = 1; i <= 32; i++) {
      expect(results[i - 1].key).toBe(i)
      expect(results[i - 1].primaryKey).toBe(i)
    }

    await tx.done
  } finally {
    db.close()
  }
})

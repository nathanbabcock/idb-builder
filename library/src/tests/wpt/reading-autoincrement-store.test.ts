/**
 * Reading autoincrement store Tests
 *
 * Ported from WPT reading-autoincrement-store.any.js
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/reading-autoincrement-store.any.js
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

test('IDBObjectStore.getAll() for an autoincrement store', async () => {
  const migrations = createMigration()
  const db = await openDB('test-autoincrement-store-getall', migrations)

  try {
    // Cover writing from the initial transaction
    for (let i = 1; i <= 32; i++) {
      if (i % 2 === 0) {
        await db.add('store', { name: nameForId(i), id: i })
      } else {
        await db.add('store', { name: nameForId(i) } as TestRecord)
      }
    }

    const result = await db.getAll('store')

    expect(result.length).toBe(32)
    for (let i = 1; i <= 32; i++) {
      expect(result[i - 1].id).toBe(i)
      expect(result[i - 1].name).toBe(nameForId(i))
    }
  } finally {
    db.close()
  }
})

test('IDBObjectStore.getAllKeys() for an autoincrement store', async () => {
  const migrations = createMigration()
  const db = await openDB('test-autoincrement-store-getallkeys', migrations)

  try {
    // Cover writing from the initial transaction
    for (let i = 1; i <= 32; i++) {
      if (i % 2 === 0) {
        await db.add('store', { name: nameForId(i), id: i })
      } else {
        await db.add('store', { name: nameForId(i) } as TestRecord)
      }
    }

    const result = await db.getAllKeys('store')

    expect(result.length).toBe(32)
    for (let i = 1; i <= 32; i++) {
      expect(result[i - 1]).toBe(i)
    }
  } finally {
    db.close()
  }
})

test('IDBObjectStore.get() for an autoincrement store', async () => {
  const migrations = createMigration()
  const db = await openDB('test-autoincrement-store-get', migrations)

  try {
    // Cover writing from the initial transaction
    for (let i = 1; i <= 32; i++) {
      if (i % 2 === 0) {
        await db.add('store', { name: nameForId(i), id: i })
      } else {
        await db.add('store', { name: nameForId(i) } as TestRecord)
      }
    }

    for (let i = 1; i <= 32; i++) {
      const result = await db.get('store', i)
      expect(result).not.toBeUndefined()
      expect(result!.id).toBe(i)
      expect(result!.name).toBe(nameForId(i))
    }
  } finally {
    db.close()
  }
})

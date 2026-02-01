/**
 * Reading Auto-increment Store Tests
 *
 * Ported from WPT reading-autoincrement-store.any.js
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/reading-autoincrement-store.any.js
 */

import './wpt-setup'
import { expect, test } from 'vitest'
import { openDB } from '../../lib/idb-adapter'
import { createMigrations } from '../../lib/migration-builder'
import { schema } from '../../lib/schema'

function nameForId(id: number): string {
  return `name${id}`
}

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/reading-autoincrement-store.any.js#L6-L20
 */
test('IDBObjectStore.getAll() for an autoincrement store', async () => {
  const migrations = createMigrations().version(1, v =>
    v.createObjectStore({
      name: 'store',
      schema: schema<{ id: number; name: string }>(),
      primaryKey: 'id',
      autoIncrement: true,
    })
  )

  const db = await openDB('test-db', migrations)

  try {
    // Add 32 records
    for (let i = 1; i <= 32; i++) {
      await db.add('store', { name: nameForId(i) } as {
        id: number
        name: string
      })
    }

    const results = await db.getAll('store')
    expect(results.length).toBe(32)

    for (let i = 1; i <= 32; i++) {
      expect(results[i - 1].id).toBe(i)
      expect(results[i - 1].name).toBe(nameForId(i))
    }
  } finally {
    db.close()
  }
})

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/reading-autoincrement-store.any.js#L22-L34
 */
test('IDBObjectStore.getAllKeys() for an autoincrement store', async () => {
  const migrations = createMigrations().version(1, v =>
    v.createObjectStore({
      name: 'store',
      schema: schema<{ id: number; name: string }>(),
      primaryKey: 'id',
      autoIncrement: true,
    })
  )

  const db = await openDB('test-db', migrations)

  try {
    // Add 32 records
    for (let i = 1; i <= 32; i++) {
      await db.add('store', { name: nameForId(i) } as {
        id: number
        name: string
      })
    }

    const keys = await db.getAllKeys('store')
    expect(keys.length).toBe(32)

    for (let i = 1; i <= 32; i++) {
      expect(keys[i - 1]).toBe(i)
    }
  } finally {
    db.close()
  }
})

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/reading-autoincrement-store.any.js#L36-L50
 */
test('IDBObjectStore.get() for an autoincrement store', async () => {
  const migrations = createMigrations().version(1, v =>
    v.createObjectStore({
      name: 'store',
      schema: schema<{ id: number; name: string }>(),
      primaryKey: 'id',
      autoIncrement: true,
    })
  )

  const db = await openDB('test-db', migrations)

  try {
    // Add 32 records
    for (let i = 1; i <= 32; i++) {
      await db.add('store', { name: nameForId(i) } as {
        id: number
        name: string
      })
    }

    // Get each record individually
    for (let i = 1; i <= 32; i++) {
      const result = await db.get('store', i)
      expect(result).toBeDefined()
      expect(result!.id).toBe(i)
      expect(result!.name).toBe(nameForId(i))
    }
  } finally {
    db.close()
  }
})

/**
 * Test cursor iteration on autoincrement store
 */
test('Cursor iteration on autoincrement store', async () => {
  const migrations = createMigrations().version(1, v =>
    v.createObjectStore({
      name: 'store',
      schema: schema<{ id: number; name: string }>(),
      primaryKey: 'id',
      autoIncrement: true,
    })
  )

  const db = await openDB('test-db', migrations)

  try {
    // Add 10 records
    for (let i = 1; i <= 10; i++) {
      await db.add('store', { name: nameForId(i) } as {
        id: number
        name: string
      })
    }

    const tx = db.transaction('store', 'readonly')
    const store = tx.objectStore('store')

    const records: Array<{ id: number; name: string }> = []
    let cursor = await store.openCursor()
    while (cursor) {
      records.push(cursor.value)
      cursor = await cursor.continue()
    }

    await tx.done

    expect(records.length).toBe(10)
    for (let i = 1; i <= 10; i++) {
      expect(records[i - 1].id).toBe(i)
      expect(records[i - 1].name).toBe(nameForId(i))
    }
  } finally {
    db.close()
  }
})

/**
 * Test key cursor on autoincrement store
 */
test('Key cursor on autoincrement store', async () => {
  const migrations = createMigrations().version(1, v =>
    v.createObjectStore({
      name: 'store',
      schema: schema<{ id: number; name: string }>(),
      primaryKey: 'id',
      autoIncrement: true,
    })
  )

  const db = await openDB('test-db', migrations)

  try {
    // Add 10 records
    for (let i = 1; i <= 10; i++) {
      await db.add('store', { name: nameForId(i) } as {
        id: number
        name: string
      })
    }

    const tx = db.transaction('store', 'readonly')
    const store = tx.objectStore('store')

    const keys: number[] = []
    let cursor = await store.openKeyCursor()
    while (cursor) {
      keys.push(cursor.key as number)
      cursor = await cursor.continue()
    }

    await tx.done

    expect(keys.length).toBe(10)
    for (let i = 1; i <= 10; i++) {
      expect(keys[i - 1]).toBe(i)
    }
  } finally {
    db.close()
  }
})

/**
 * Test getAll with count limit on autoincrement store
 */
test('IDBObjectStore.getAll() with count limit', async () => {
  const migrations = createMigrations().version(1, v =>
    v.createObjectStore({
      name: 'store',
      schema: schema<{ id: number; name: string }>(),
      primaryKey: 'id',
      autoIncrement: true,
    })
  )

  const db = await openDB('test-db', migrations)

  try {
    for (let i = 1; i <= 20; i++) {
      await db.add('store', { name: nameForId(i) } as {
        id: number
        name: string
      })
    }

    const results = await db.getAll('store', undefined, 5)
    expect(results.length).toBe(5)

    for (let i = 1; i <= 5; i++) {
      expect(results[i - 1].id).toBe(i)
    }
  } finally {
    db.close()
  }
})

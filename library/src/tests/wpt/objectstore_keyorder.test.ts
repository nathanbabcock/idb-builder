/**
 * IDBObjectStore Key Sort Order Tests
 *
 * Ported from WPT objectstore_keyorder.any.js
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/objectstore_keyorder.any.js
 */

import './wpt-setup'
import { expect, test } from 'vitest'
import { openDB } from '../../lib/idb-adapter'
import { createMigrations } from '../../lib/migration-builder'
import { schema } from '../../lib/schema'

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/objectstore_keyorder.any.js#L7-L39
 */
test("Verify key sort order in an object store is 'number < Date < DOMString'", async () => {
  const d = new Date()
  const records = [{ key: d }, { key: 'test' }, { key: 1 }, { key: 2.55 }]
  const expectedKeyOrder = [1, 2.55, d.valueOf(), 'test']

  const migrations = createMigrations().version(1, v =>
    v.createObjectStore({
      name: 'store',
      schema: schema<{ key: number | Date | string }>(),
      primaryKey: 'key',
    })
  )

  const db = await openDB('test-db', migrations)

  try {
    // Add records in non-sorted order
    for (const record of records) {
      await db.add('store', record)
    }

    // Read back via cursor (should be sorted)
    const tx = db.transaction('store', 'readonly')
    const store = tx.objectStore('store')

    const actualKeys: Array<number | string> = []
    let cursor = await store.openCursor()
    while (cursor) {
      const key = cursor.key
      if (key instanceof Date) {
        actualKeys.push(key.valueOf())
      } else {
        actualKeys.push(key as number | string)
      }
      cursor = await cursor.continue()
    }

    await tx.done

    expect(actualKeys).toEqual(expectedKeyOrder)
  } finally {
    db.close()
  }
})

/**
 * Additional tests for key order in object store
 */
test('Object store key order with numbers', async () => {
  const migrations = createMigrations().version(1, v =>
    v.createObjectStore({
      name: 'store',
      schema: schema<{ id: number }>(),
      primaryKey: 'id',
    })
  )

  const db = await openDB('test-db', migrations)

  try {
    // Add in random order
    await db.add('store', { id: 5 })
    await db.add('store', { id: 1 })
    await db.add('store', { id: 3 })
    await db.add('store', { id: -1 })
    await db.add('store', { id: 10 })

    const keys = await db.getAllKeys('store')
    expect(keys).toEqual([-1, 1, 3, 5, 10])
  } finally {
    db.close()
  }
})

test('Object store key order with strings', async () => {
  const migrations = createMigrations().version(1, v =>
    v.createObjectStore({
      name: 'store',
      schema: schema<{ name: string }>(),
      primaryKey: 'name',
    })
  )

  const db = await openDB('test-db', migrations)

  try {
    // Add in random order
    await db.add('store', { name: 'zebra' })
    await db.add('store', { name: 'apple' })
    await db.add('store', { name: 'banana' })
    await db.add('store', { name: 'Apple' }) // Capital A comes before lowercase

    const keys = await db.getAllKeys('store')
    expect(keys).toEqual(['Apple', 'apple', 'banana', 'zebra'])
  } finally {
    db.close()
  }
})

test('Object store key order with array keys', async () => {
  const migrations = createMigrations().version(1, v =>
    v.createObjectStore({
      name: 'store',
      schema: schema<string>(),
    })
  )

  const db = await openDB('test-db', migrations)

  try {
    // Add array keys in random order
    await db.add('store', 'v1', [1, 2])
    await db.add('store', 'v2', [1])
    await db.add('store', 'v3', [])
    await db.add('store', 'v4', [1, 1])
    await db.add('store', 'v5', [2])

    const tx = db.transaction('store', 'readonly')
    const store = tx.objectStore('store')

    const keys: IDBValidKey[] = []
    let cursor = await store.openCursor()
    while (cursor) {
      keys.push(cursor.key)
      cursor = await cursor.continue()
    }

    await tx.done

    // Arrays are sorted: [] < [1] < [1, 1] < [1, 2] < [2]
    expect(keys.length).toBe(5)
    expect(indexedDB.cmp(keys[0], [])).toBe(0)
    expect(indexedDB.cmp(keys[1], [1])).toBe(0)
    expect(indexedDB.cmp(keys[2], [1, 1])).toBe(0)
    expect(indexedDB.cmp(keys[3], [1, 2])).toBe(0)
    expect(indexedDB.cmp(keys[4], [2])).toBe(0)
  } finally {
    db.close()
  }
})

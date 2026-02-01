/**
 * IDBIndex Key Sort Order Tests
 *
 * Ported from WPT index_sort_order.any.js
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/index_sort_order.any.js
 */

import './wpt-setup'
import { expect, test } from 'vitest'
import { openDB } from '../../lib/idb-adapter'
import { createMigrations } from '../../lib/migration-builder'
import { schema } from '../../lib/schema'

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/index_sort_order.any.js#L7-L43
 */
test("Verify IDBIndex key sort order is 'number < Date < DOMString'", async () => {
  const d = new Date()
  const records = [{ foo: d }, { foo: 'test' }, { foo: 1 }, { foo: 2.55 }]
  const expectedKeyOrder = [1, 2.55, d.valueOf(), 'test']

  const migrations = createMigrations().version(1, v =>
    v
      .createObjectStore({
        name: 'store',
        schema: schema<{ foo: number | string | Date }>(),
        autoIncrement: true,
      })
      .createIndex('index', {
        storeName: 'store',
        keyPath: 'foo',
      })
  )

  const db = await openDB('test-db', migrations)

  try {
    // Add records in non-sorted order
    for (const record of records) {
      await db.add('store', record)
    }

    // Read back via index cursor (should be sorted)
    const tx = db.transaction('store', 'readonly')
    const store = tx.objectStore('store')
    const index = store.index('index')

    const actualKeys: Array<number | string> = []
    let cursor = await index.openCursor()
    while (cursor) {
      // Convert Date to valueOf for comparison
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
 * Additional test: Mixed numeric types
 */
test('Index sort order with mixed numeric types', async () => {
  const migrations = createMigrations().version(1, v =>
    v
      .createObjectStore({
        name: 'store',
        schema: schema<{ value: number }>(),
        autoIncrement: true,
      })
      .createIndex('index', {
        storeName: 'store',
        keyPath: 'value',
      })
  )

  const db = await openDB('test-db', migrations)

  try {
    await db.add('store', { value: 5 })
    await db.add('store', { value: -Infinity })
    await db.add('store', { value: Infinity })
    await db.add('store', { value: 0 })
    await db.add('store', { value: -1.5 })

    const tx = db.transaction('store', 'readonly')
    const store = tx.objectStore('store')
    const index = store.index('index')

    const keys: number[] = []
    let cursor = await index.openCursor()
    while (cursor) {
      keys.push(cursor.key as number)
      cursor = await cursor.continue()
    }

    await tx.done

    expect(keys).toEqual([-Infinity, -1.5, 0, 5, Infinity])
  } finally {
    db.close()
  }
})

/**
 * Additional test: String sort order
 */
test('Index sort order with strings (lexicographic)', async () => {
  const migrations = createMigrations().version(1, v =>
    v
      .createObjectStore({
        name: 'store',
        schema: schema<{ name: string }>(),
        autoIncrement: true,
      })
      .createIndex('index', {
        storeName: 'store',
        keyPath: 'name',
      })
  )

  const db = await openDB('test-db', migrations)

  try {
    await db.add('store', { name: 'zebra' })
    await db.add('store', { name: 'apple' })
    await db.add('store', { name: 'Apple' }) // Uppercase comes before lowercase
    await db.add('store', { name: '' }) // Empty string is smallest
    await db.add('store', { name: 'banana' })

    const tx = db.transaction('store', 'readonly')
    const store = tx.objectStore('store')
    const index = store.index('index')

    const keys: string[] = []
    let cursor = await index.openCursor()
    while (cursor) {
      keys.push(cursor.key as string)
      cursor = await cursor.continue()
    }

    await tx.done

    expect(keys).toEqual(['', 'Apple', 'apple', 'banana', 'zebra'])
  } finally {
    db.close()
  }
})

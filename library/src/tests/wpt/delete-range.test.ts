/**
 * Delete Range Tests
 *
 * Ported from WPT delete-range.any.js
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/delete-range.any.js
 */

import './wpt-setup'
import { expect, test } from 'vitest'
import { openDB } from '../../lib/idb-adapter'
import { createMigrations } from '../../lib/migration-builder'
import { schema } from '../../lib/schema'

const entries = [
  {
    lower: 3,
    upper: 8,
    lowerOpen: false,
    upperOpen: false,
    expected: [1, 2, 9, 10],
  },
  {
    lower: 3,
    upper: 8,
    lowerOpen: true,
    upperOpen: false,
    expected: [1, 2, 3, 9, 10],
  },
  {
    lower: 3,
    upper: 8,
    lowerOpen: false,
    upperOpen: true,
    expected: [1, 2, 8, 9, 10],
  },
  {
    lower: 3,
    upper: 8,
    lowerOpen: true,
    upperOpen: true,
    expected: [1, 2, 3, 8, 9, 10],
  },
]

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/delete-range.any.js#L13-L44
 */
for (const entry of entries) {
  const desc = `bound(${entry.lower}, ${entry.upper}, ${entry.lowerOpen}, ${entry.upperOpen})`
  test(`Delete range with ${desc}`, async () => {
    const migrations = createMigrations().version(1, v =>
      v.createObjectStore({
        name: 'store',
        schema: schema<number>(),
      })
    )

    const db = await openDB('test-db', migrations)

    // Add records 1-10
    for (let i = 1; i <= 10; i++) {
      await db.add('store', i, i)
    }

    // Delete using key range
    const tx = db.transaction('store', 'readwrite')
    const store = tx.objectStore('store')

    await store.delete(
      IDBKeyRange.bound(
        entry.lower,
        entry.upper,
        entry.lowerOpen,
        entry.upperOpen
      )
    )

    await tx.done

    // Verify remaining keys
    const tx2 = db.transaction('store', 'readonly')
    const store2 = tx2.objectStore('store')

    const keys: number[] = []
    let cursor = await store2.openCursor()
    while (cursor) {
      keys.push(cursor.key as number)
      cursor = await cursor.continue()
    }

    await tx2.done

    expect(keys).toEqual(entry.expected)

    db.close()
  })
}

/**
 * Additional test: Delete with lowerBound
 */
test('Delete range with lowerBound', async () => {
  const migrations = createMigrations().version(1, v =>
    v.createObjectStore({
      name: 'store',
      schema: schema<number>(),
    })
  )

  const db = await openDB('test-db', migrations)

  for (let i = 1; i <= 10; i++) {
    await db.add('store', i, i)
  }

  const tx = db.transaction('store', 'readwrite')
  const store = tx.objectStore('store')

  await store.delete(IDBKeyRange.lowerBound(6))

  await tx.done

  const keys = await db.getAllKeys('store')
  expect(keys).toEqual([1, 2, 3, 4, 5])

  db.close()
})

/**
 * Additional test: Delete with upperBound
 */
test('Delete range with upperBound', async () => {
  const migrations = createMigrations().version(1, v =>
    v.createObjectStore({
      name: 'store',
      schema: schema<number>(),
    })
  )

  const db = await openDB('test-db', migrations)

  for (let i = 1; i <= 10; i++) {
    await db.add('store', i, i)
  }

  const tx = db.transaction('store', 'readwrite')
  const store = tx.objectStore('store')

  await store.delete(IDBKeyRange.upperBound(5))

  await tx.done

  const keys = await db.getAllKeys('store')
  expect(keys).toEqual([6, 7, 8, 9, 10])

  db.close()
})

/**
 * Additional test: Delete with only key
 */
test('Delete range with only key (not a range)', async () => {
  const migrations = createMigrations().version(1, v =>
    v.createObjectStore({
      name: 'store',
      schema: schema<number>(),
    })
  )

  const db = await openDB('test-db', migrations)

  for (let i = 1; i <= 10; i++) {
    await db.add('store', i, i)
  }

  const tx = db.transaction('store', 'readwrite')
  const store = tx.objectStore('store')

  await store.delete(IDBKeyRange.only(5))

  await tx.done

  const keys = await db.getAllKeys('store')
  expect(keys).toEqual([1, 2, 3, 4, 6, 7, 8, 9, 10])

  db.close()
})

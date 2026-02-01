/**
 * IDBCursor Iterating Tests
 *
 * Ported from WPT idbcursor_iterating.any.js
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbcursor_iterating.any.js
 */

import './wpt-setup'
import { expect, test } from 'vitest'
import { openDB } from '../../lib/idb-adapter'
import { createMigrations } from '../../lib/migration-builder'
import { schema } from '../../lib/schema'

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbcursor_iterating.any.js#L7-L107
 *
 * This is a comprehensive test that iterates through a cursor while
 * modifying the store (deleting, adding, updating records).
 */
test('Iterate and Delete elements', async () => {
  const migrations = createMigrations().version(1, v =>
    v.createObjectStore({
      name: 'test',
      schema: schema<{ key: number; val: string }>(),
      primaryKey: 'key',
    })
  )

  const db = await openDB('test-db', migrations)

  try {
    // Add 500 records first
    for (let i = 0; i < 500; i++) {
      await db.add('test', { key: i, val: 'val_' + i })
    }

    // Add record 500
    await db.add('test', { key: 500, val: 'val_500' })

    // Add records 501-999
    for (let i = 999; i > 500; i--) {
      await db.add('test', { key: i, val: 'val_' + i })
    }

    // Now iterate and modify
    let count = 0
    const tx = db.transaction('test', 'readwrite')
    const store = tx.objectStore('test')

    let cursor = await store.openCursor()
    while (cursor) {
      const key = cursor.key as number

      switch (key) {
        case 10:
          expect(count).toBe(key)
          await store.delete(11)
          break

        case 12:
        case 499:
        case 500:
        case 501:
          expect(count).toBe(key - 1)
          break

        // Delete the next key
        case 510:
          await store.delete(511)
          break

        // Delete randomly
        case 512:
          await store.delete(611)
          await store.delete(499)
          await store.delete(500)
          break

        // Delete and add a new key
        case 520:
          await store.delete(521)
          await store.add({ key: 521, val: 'new' })
          break

        case 521:
          expect(cursor.value.val).toBe('new')
          break

        // Update a record
        case 530:
          expect(cursor.value.val).toBe('val_530')
          await cursor.update({ key: 530, val: 'val_531' })
          const result = await store.get(530)
          expect(result?.val).toBe('val_531')
          break

        // These should never be reached
        case 11:
        case 511:
        case 611:
          throw new Error(`${key} should be deleted and never run`)
      }

      cursor = await cursor.continue()
      count++
    }

    // We should have iterated 997 times (1000 - 3 deleted before being reached)
    expect(count).toBe(997)

    // Final count should be 995 (1000 - 5 deleted total)
    const finalCount = await store.count()
    expect(finalCount).toBe(995)

    await tx.done
  } finally {
    db.close()
  }
})

/**
 * Additional test: Basic cursor iteration with modifications
 */
test('Cursor iteration with delete and continue', async () => {
  const migrations = createMigrations().version(1, v =>
    v.createObjectStore({
      name: 'store',
      schema: schema<{ id: number; value: string }>(),
      primaryKey: 'id',
    })
  )

  const db = await openDB('test-db', migrations)

  try {
    // Add 10 records
    for (let i = 0; i < 10; i++) {
      await db.add('store', { id: i, value: 'value_' + i })
    }

    const tx = db.transaction('store', 'readwrite')
    const store = tx.objectStore('store')

    const visited: number[] = []
    let cursor = await store.openCursor()

    while (cursor) {
      visited.push(cursor.key as number)

      // Delete even numbers as we go
      if ((cursor.key as number) % 2 === 0) {
        await cursor.delete()
      }

      cursor = await cursor.continue()
    }

    await tx.done

    // Should have visited all 10
    expect(visited).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9])

    // Should only have odd numbers remaining
    const remaining = await db.getAllKeys('store')
    expect(remaining).toEqual([1, 3, 5, 7, 9])
  } finally {
    db.close()
  }
})

/**
 * Test cursor iteration with update
 */
test('Cursor iteration with update and continue', async () => {
  const migrations = createMigrations().version(1, v =>
    v.createObjectStore({
      name: 'store',
      schema: schema<{ id: number; value: number }>(),
      primaryKey: 'id',
    })
  )

  const db = await openDB('test-db', migrations)

  try {
    // Add 5 records
    for (let i = 0; i < 5; i++) {
      await db.add('store', { id: i, value: i })
    }

    const tx = db.transaction('store', 'readwrite')
    const store = tx.objectStore('store')

    let cursor = await store.openCursor()

    while (cursor) {
      // Double each value
      await cursor.update({ id: cursor.key as number, value: cursor.value.value * 2 })
      cursor = await cursor.continue()
    }

    await tx.done

    // Verify updates
    const results = await db.getAll('store')
    expect(results.map(r => r.value)).toEqual([0, 2, 4, 6, 8])
  } finally {
    db.close()
  }
})

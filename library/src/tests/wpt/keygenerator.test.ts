/**
 * Key Generator Tests
 *
 * Ported from WPT keygenerator.any.js
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/keygenerator.any.js
 */

import './wpt-setup'
import { expect, test } from 'vitest'
import { openDB } from '../../lib/idb-adapter'
import { createMigrations } from '../../lib/migration-builder'
import { schema } from '../../lib/schema'

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/keygenerator.any.js#L40-L41
 */
test('Keygenerator starts at one, and increments by one', async () => {
  const migrations = createMigrations().version(1, v =>
    v.createObjectStore({
      name: 'store',
      schema: schema<{ id: number }>(),
      primaryKey: 'id',
      autoIncrement: true,
    })
  )

  const db = await openDB('test-db', migrations)

  // Add 4 records without specifying ids
  for (let i = 0; i < 4; i++) {
    await db.add('store', {} as { id: number })
  }

  const tx = db.transaction('store', 'readonly')
  const store = tx.objectStore('store')

  const keys: number[] = []
  let cursor = await store.openCursor()
  while (cursor) {
    keys.push(cursor.key as number)
    cursor = await cursor.continue()
  }

  await tx.done

  expect(keys).toEqual([1, 2, 3, 4])

  db.close()
})

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/keygenerator.any.js#L43-L44
 */
test('Keygenerator increments by one from last set key', async () => {
  const migrations = createMigrations().version(1, v =>
    v.createObjectStore({
      name: 'store',
      schema: schema<{ id: number }>(),
      primaryKey: 'id',
      autoIncrement: true,
    })
  )

  const db = await openDB('test-db', migrations)

  // Add record with explicit id 2
  await db.add('store', { id: 2 })
  // Add record with auto-generated id (should be 3)
  await db.add('store', {} as { id: number })
  // Add record with explicit id 5
  await db.add('store', { id: 5 })
  // Add record with auto-generated id (should be 6)
  await db.add('store', {} as { id: number })
  // Add record with explicit id 6.66
  await db.add('store', { id: 6.66 })
  // Add record with explicit id 7
  await db.add('store', { id: 7 })

  const tx = db.transaction('store', 'readonly')
  const store = tx.objectStore('store')

  const keys: number[] = []
  let cursor = await store.openCursor()
  while (cursor) {
    keys.push(cursor.key as number)
    cursor = await cursor.continue()
  }

  await tx.done

  expect(keys).toEqual([2, 3, 5, 6, 6.66, 7])

  db.close()
})

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/keygenerator.any.js#L236-L256
 */
test('Key is injected into value - single segment path', async () => {
  const migrations = createMigrations().version(1, v =>
    v.createObjectStore({
      name: 'store',
      schema: schema<{ id: number; name: string }>(),
      primaryKey: 'id',
      autoIncrement: true,
    })
  )

  const db = await openDB('test-db', migrations)

  const tx = db.transaction('store', 'readwrite')
  const store = tx.objectStore('store')

  const key = await store.add({ name: 'n' } as { id: number; name: string })
  expect(key).toBe(1)

  const value = await store.get(key)
  expect(value).toBeDefined()
  expect(value?.name).toBe('n')
  expect(value?.id).toBe(1)

  await tx.done
  db.close()
})

/**
 * Test auto-increment with explicit key larger than current generator
 */
test('Auto-increment updates generator when explicit key is larger', async () => {
  const migrations = createMigrations().version(1, v =>
    v.createObjectStore({
      name: 'store',
      schema: schema<{ id: number; value: string }>(),
      primaryKey: 'id',
      autoIncrement: true,
    })
  )

  const db = await openDB('test-db', migrations)

  const tx = db.transaction('store', 'readwrite')
  const store = tx.objectStore('store')

  // Add with auto key (should be 1)
  const key1 = await store.add({ value: 'a' } as { id: number; value: string })
  expect(key1).toBe(1)

  // Add with auto key (should be 2)
  const key2 = await store.add({ value: 'b' } as { id: number; value: string })
  expect(key2).toBe(2)

  // Add with explicit key 1000
  const key3 = await store.add({ id: 1000, value: 'c' })
  expect(key3).toBe(1000)

  // Add with auto key (should be 1001 now)
  const key4 = await store.add({ value: 'd' } as { id: number; value: string })
  expect(key4).toBe(1001)

  await tx.done
  db.close()
})

/**
 * Test duplicate key rejection with auto-increment
 */
test('ConstraintError when using same id as already generated', async () => {
  const migrations = createMigrations().version(1, v =>
    v.createObjectStore({
      name: 'store',
      schema: schema<{ id: number; value?: string }>(),
      primaryKey: 'id',
      autoIncrement: true,
    })
  )

  const db = await openDB('test-db', migrations)

  // Add with explicit id 1
  await db.add('store', { id: 1 })

  // Add with auto key (would be 2)
  await db.add('store', { value: 'auto' } as { id: number; value: string })

  // Try to add with explicit id 2 (should fail - duplicate)
  await expect(db.add('store', { id: 2 })).rejects.toThrow()

  db.close()
})

/**
 * Test auto-increment doesn't update when explicit key is smaller
 */
test("Auto-increment doesn't update when new key is smaller", async () => {
  const migrations = createMigrations().version(1, v =>
    v.createObjectStore({
      name: 'store',
      schema: schema<{ id: number }>(),
      primaryKey: 'id',
      autoIncrement: true,
    })
  )

  const db = await openDB('test-db', migrations)

  try {
    // Add with explicit id 10
    await db.add('store', { id: 10 })

    // Add with auto key (should be 11)
    const key1 = await db.add('store', {} as { id: number })
    expect(key1).toBe(11)

    // Add with explicit id 5 (smaller than current)
    await db.add('store', { id: 5 })

    // Add with auto key (should still be 12, not 6)
    const key2 = await db.add('store', {} as { id: number })
    expect(key2).toBe(12)
  } finally {
    db.close()
  }
})

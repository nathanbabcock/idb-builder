/**
 * IDBCursor.direction Tests
 *
 * Ported from WPT idbcursor-direction.any.js
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbcursor-direction.any.js
 */

import './wpt-setup'
import { expect, test } from 'vitest'
import { openDB } from '../../lib/idb-adapter'
import { createMigrations } from '../../lib/migration-builder'
import { schema } from '../../lib/schema'

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbcursor-direction.any.js#L66
 */
test("IDBCursor.direction - 'next' (default)", async () => {
  const migrations = createMigrations().version(1, v =>
    v.createObjectStore({
      name: 'test',
      schema: schema<string>(),
    })
  )

  const db = await openDB('test-db', migrations)
  await db.add('test', 'data', 'key')

  const tx = db.transaction('test', 'readonly')
  const store = tx.objectStore('test')

  // Open cursor without direction (defaults to 'next')
  const cursor = await store.openCursor()
  expect(cursor).not.toBeNull()
  expect(cursor!.direction).toBe('next')

  await tx.done
  db.close()
})

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbcursor-direction.any.js#L67
 */
test("IDBCursor.direction - 'next' (explicit)", async () => {
  const migrations = createMigrations().version(1, v =>
    v.createObjectStore({
      name: 'test',
      schema: schema<string>(),
    })
  )

  const db = await openDB('test-db', migrations)
  await db.add('test', 'data', 'key')

  const tx = db.transaction('test', 'readonly')
  const store = tx.objectStore('test')

  const cursor = await store.openCursor(null, 'next')
  expect(cursor).not.toBeNull()
  expect(cursor!.direction).toBe('next')

  await tx.done
  db.close()
})

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbcursor-direction.any.js#L68
 */
test("IDBCursor.direction - 'prev'", async () => {
  const migrations = createMigrations().version(1, v =>
    v.createObjectStore({
      name: 'test',
      schema: schema<string>(),
    })
  )

  const db = await openDB('test-db', migrations)
  await db.add('test', 'data', 'key')

  const tx = db.transaction('test', 'readonly')
  const store = tx.objectStore('test')

  const cursor = await store.openCursor(null, 'prev')
  expect(cursor).not.toBeNull()
  expect(cursor!.direction).toBe('prev')

  await tx.done
  db.close()
})

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbcursor-direction.any.js#L69
 */
test("IDBCursor.direction - 'nextunique'", async () => {
  const migrations = createMigrations().version(1, v =>
    v
      .createObjectStore({
        name: 'test',
        schema: schema<{ id: number; value: string }>(),
        primaryKey: 'id',
      })
      .createIndex('value_index', {
        storeName: 'test',
        keyPath: 'value',
      })
  )

  const db = await openDB('test-db', migrations)
  await db.add('test', { id: 1, value: 'a' })
  await db.add('test', { id: 2, value: 'a' })
  await db.add('test', { id: 3, value: 'b' })

  const tx = db.transaction('test', 'readonly')
  const store = tx.objectStore('test')
  const index = store.index('value_index')

  const cursor = await index.openCursor(null, 'nextunique')
  expect(cursor).not.toBeNull()
  expect(cursor!.direction).toBe('nextunique')

  // First unique value should be 'a' with first primary key
  expect(cursor!.key).toBe('a')

  await tx.done
  db.close()
})

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbcursor-direction.any.js#L70
 */
test("IDBCursor.direction - 'prevunique'", async () => {
  const migrations = createMigrations().version(1, v =>
    v
      .createObjectStore({
        name: 'test',
        schema: schema<{ id: number; value: string }>(),
        primaryKey: 'id',
      })
      .createIndex('value_index', {
        storeName: 'test',
        keyPath: 'value',
      })
  )

  const db = await openDB('test-db', migrations)
  await db.add('test', { id: 1, value: 'a' })
  await db.add('test', { id: 2, value: 'a' })
  await db.add('test', { id: 3, value: 'b' })

  const tx = db.transaction('test', 'readonly')
  const store = tx.objectStore('test')
  const index = store.index('value_index')

  const cursor = await index.openCursor(null, 'prevunique')
  expect(cursor).not.toBeNull()
  expect(cursor!.direction).toBe('prevunique')

  // First unique value in reverse should be 'b'
  expect(cursor!.key).toBe('b')

  await tx.done
  db.close()
})

/**
 * Test that 'nextunique' skips duplicate keys
 */
test("'nextunique' skips duplicate index keys", async () => {
  const migrations = createMigrations().version(1, v =>
    v
      .createObjectStore({
        name: 'test',
        schema: schema<{ id: number; category: string }>(),
        primaryKey: 'id',
      })
      .createIndex('category_index', {
        storeName: 'test',
        keyPath: 'category',
      })
  )

  const db = await openDB('test-db', migrations)
  await db.add('test', { id: 1, category: 'fruit' })
  await db.add('test', { id: 2, category: 'fruit' })
  await db.add('test', { id: 3, category: 'vegetable' })
  await db.add('test', { id: 4, category: 'vegetable' })
  await db.add('test', { id: 5, category: 'meat' })

  const tx = db.transaction('test', 'readonly')
  const store = tx.objectStore('test')
  const index = store.index('category_index')

  const uniqueKeys: string[] = []
  let cursor = await index.openCursor(null, 'nextunique')
  while (cursor) {
    uniqueKeys.push(cursor.key as string)
    cursor = await cursor.continue()
  }

  await tx.done

  // Should only have 3 unique categories
  expect(uniqueKeys).toEqual(['fruit', 'meat', 'vegetable'])

  db.close()
})

/**
 * Test that 'prevunique' iterates unique keys in reverse
 */
test("'prevunique' iterates unique keys in reverse", async () => {
  const migrations = createMigrations().version(1, v =>
    v
      .createObjectStore({
        name: 'test',
        schema: schema<{ id: number; category: string }>(),
        primaryKey: 'id',
      })
      .createIndex('category_index', {
        storeName: 'test',
        keyPath: 'category',
      })
  )

  const db = await openDB('test-db', migrations)
  await db.add('test', { id: 1, category: 'fruit' })
  await db.add('test', { id: 2, category: 'fruit' })
  await db.add('test', { id: 3, category: 'vegetable' })
  await db.add('test', { id: 4, category: 'vegetable' })
  await db.add('test', { id: 5, category: 'meat' })

  const tx = db.transaction('test', 'readonly')
  const store = tx.objectStore('test')
  const index = store.index('category_index')

  const uniqueKeys: string[] = []
  let cursor = await index.openCursor(null, 'prevunique')
  while (cursor) {
    uniqueKeys.push(cursor.key as string)
    cursor = await cursor.continue()
  }

  await tx.done

  // Should have 3 unique categories in reverse order
  expect(uniqueKeys).toEqual(['vegetable', 'meat', 'fruit'])

  db.close()
})

/**
 * Keypath Tests
 *
 * Ported from WPT keypath.any.js
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/keypath.any.js
 */

import './wpt-setup'
import { expect, test } from 'vitest'
import { openDB } from '../../lib/idb-adapter'
import { createMigrations } from '../../lib/migration-builder'
import { schema } from '../../lib/schema'

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/keypath.any.js#L44
 */
test('keypath my.key', async () => {
  const migrations = createMigrations().version(1, v =>
    v.createObjectStore({
      name: 'store',
      schema: schema<{ my: { key: number } }>(),
      primaryKey: 'my.key',
    })
  )

  const db = await openDB('test-db', migrations)

  await db.add('store', { my: { key: 10 } })

  const tx = db.transaction('store', 'readonly')
  const store = tx.objectStore('store')

  const keys: number[] = []
  let cursor = await store.openCursor()
  while (cursor) {
    keys.push(cursor.key as number)
    cursor = await cursor.continue()
  }

  await tx.done

  expect(keys).toEqual([10])

  db.close()
})

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/keypath.any.js#L48
 */
test('keypath my.key_ya (underscore)', async () => {
  const migrations = createMigrations().version(1, v =>
    v.createObjectStore({
      name: 'store',
      schema: schema<{ my: { key_ya: number } }>(),
      primaryKey: 'my.key_ya',
    })
  )

  const db = await openDB('test-db', migrations)

  await db.add('store', { my: { key_ya: 10 } })

  const tx = db.transaction('store', 'readonly')
  const store = tx.objectStore('store')

  const keys: number[] = []
  let cursor = await store.openCursor()
  while (cursor) {
    keys.push(cursor.key as number)
    cursor = await cursor.continue()
  }

  await tx.done

  expect(keys).toEqual([10])

  db.close()
})

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/keypath.any.js#L63-L65
 */
test('keypath str.length', async () => {
  const migrations = createMigrations().version(1, v =>
    v.createObjectStore({
      name: 'store',
      schema: schema<{ str: string }>(),
      primaryKey: 'str.length',
    })
  )

  const db = await openDB('test-db', migrations)

  await db.add('store', { str: 'pony' })
  await db.add('store', { str: 'my' })
  await db.add('store', { str: 'little' })
  await db.add('store', { str: '' })

  const tx = db.transaction('store', 'readonly')
  const store = tx.objectStore('store')

  const keys: number[] = []
  let cursor = await store.openCursor()
  while (cursor) {
    keys.push(cursor.key as number)
    cursor = await cursor.continue()
  }

  await tx.done

  expect(keys).toEqual([0, 2, 4, 6])

  db.close()
})

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/keypath.any.js#L75
 */
test('keypath length on arrays and strings', async () => {
  const migrations = createMigrations().version(1, v =>
    v.createObjectStore({
      name: 'store',
      schema: schema<number[] | string | { length: number }>(),
      primaryKey: 'length',
    })
  )

  const db = await openDB('test-db', migrations)

  await db.add('store', [10, 10])
  await db.add('store', '123')
  await db.add('store', { length: 20 })

  const tx = db.transaction('store', 'readonly')
  const store = tx.objectStore('store')

  const keys: number[] = []
  let cursor = await store.openCursor()
  while (cursor) {
    keys.push(cursor.key as number)
    cursor = await cursor.continue()
  }

  await tx.done

  expect(keys).toEqual([2, 3, 20])

  db.close()
})

/**
 * Deep nested keypath test
 */
test('deeply nested keypath', async () => {
  const migrations = createMigrations().version(1, v =>
    v.createObjectStore({
      name: 'store',
      schema: schema<{ a: { b: { c: { d: number } } } }>(),
      primaryKey: 'a.b.c.d',
    })
  )

  const db = await openDB('test-db', migrations)

  await db.add('store', { a: { b: { c: { d: 42 } } } })
  await db.add('store', { a: { b: { c: { d: 10 } } } })
  await db.add('store', { a: { b: { c: { d: 100 } } } })

  const tx = db.transaction('store', 'readonly')
  const store = tx.objectStore('store')

  const keys: number[] = []
  let cursor = await store.openCursor()
  while (cursor) {
    keys.push(cursor.key as number)
    cursor = await cursor.continue()
  }

  await tx.done

  expect(keys).toEqual([10, 42, 100])

  db.close()
})

/**
 * Index with nested keypath
 */
test('index with nested keypath', async () => {
  const migrations = createMigrations().version(1, v =>
    v
      .createObjectStore({
        name: 'store',
        schema: schema<{ id: number; nested: { value: string } }>(),
        primaryKey: 'id',
      })
      .createIndex('nested_index', {
        storeName: 'store',
        keyPath: 'nested.value',
      })
  )

  const db = await openDB('test-db', migrations)

  await db.add('store', { id: 1, nested: { value: 'apple' } })
  await db.add('store', { id: 2, nested: { value: 'banana' } })
  await db.add('store', { id: 3, nested: { value: 'cherry' } })

  const tx = db.transaction('store', 'readonly')
  const store = tx.objectStore('store')
  const index = store.index('nested_index')

  const result = await index.get('banana')
  expect(result?.id).toBe(2)

  const keys: string[] = []
  let cursor = await index.openCursor()
  while (cursor) {
    keys.push(cursor.key as string)
    cursor = await cursor.continue()
  }

  await tx.done

  expect(keys).toEqual(['apple', 'banana', 'cherry'])

  db.close()
})

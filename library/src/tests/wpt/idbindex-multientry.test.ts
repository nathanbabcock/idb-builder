/**
 * IDBIndex multiEntry Tests
 *
 * Ported from WPT idbindex-multientry.any.js
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbindex-multientry.any.js
 */

import './wpt-setup'
import { expect, test } from 'vitest'
import { openDB } from '../../lib/idb-adapter'
import { createMigrations } from '../../lib/migration-builder'
import { schema } from '../../lib/schema'

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbindex-multientry.any.js#L17-L50
 */
test('A 1000 entry multiEntry array', async () => {
  const idxkeys: string[] = []
  for (let i = 0; i < 1000; i++) {
    idxkeys.push('index_no_' + i)
  }

  const migrations = createMigrations().version(1, v =>
    v
      .createObjectStore({
        name: 'store',
        schema: schema<{ test: string; idxkeys: string[] }>(),
      })
      .createIndex('index', {
        storeName: 'store',
        keyPath: 'idxkeys',
        multiEntry: true,
      })
  )

  const db = await openDB('test-db', migrations)

  await db.add('store', { test: 'yo', idxkeys }, 1)

  const tx = db.transaction('store', 'readonly')
  const store = tx.objectStore('store')
  const index = store.index('index')

  // Test that we can look up by any of the 1000 keys
  const result0 = await index.get('index_no_0')
  expect(result0?.test).toBe('yo')

  const result500 = await index.get('index_no_500')
  expect(result500?.test).toBe('yo')

  const result999 = await index.get('index_no_999')
  expect(result999?.test).toBe('yo')
  expect(result999?.idxkeys.length).toBe(1000)

  await tx.done
  db.close()
})

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbindex-multientry.any.js#L52-L87
 */
test('Adding keys with multiEntry index', async () => {
  const migrations = createMigrations().version(1, v =>
    v
      .createObjectStore({
        name: 'store',
        schema: schema<{ name: string | string[] }>(),
      })
      .createIndex('actors', {
        storeName: 'store',
        keyPath: 'name', // !FIXME w3 says this is valid but it gives a compile error
        multiEntry: true,
      })
  )

  const db = await openDB('test-db', migrations)

  await db.add('store', { name: 'Odin' }, 1)
  await db.add('store', { name: ['Rita', 'Scheeta'] }, 2)
  await db.add('store', { name: ['Neil', 'Bobby'] }, 3)

  const tx = db.transaction('store', 'readonly')
  const store = tx.objectStore('store')
  const index = store.index('actors')

  const odinKey = await index.getKey('Odin')
  expect(odinKey).toBe(1)

  const ritaKey = await index.getKey('Rita')
  expect(ritaKey).toBe(2)

  const scheetaKey = await index.getKey('Scheeta')
  expect(scheetaKey).toBe(2)

  const neilKey = await index.getKey('Neil')
  expect(neilKey).toBe(3)

  const bobbyKey = await index.getKey('Bobby')
  expect(bobbyKey).toBe(3)

  await tx.done
  db.close()
})

/**
 * Test multiEntry with getAll
 */
test('multiEntry index with getAll', async () => {
  const migrations = createMigrations().version(1, v =>
    v
      .createObjectStore({
        name: 'store',
        schema: schema<{ id: number; tags: string[] }>(),
        primaryKey: 'id',
      })
      .createIndex('tags', {
        storeName: 'store',
        keyPath: 'tags',
        multiEntry: true,
      })
  )

  const db = await openDB('test-db', migrations)

  await db.add('store', { id: 1, tags: ['javascript', 'typescript'] })
  await db.add('store', { id: 2, tags: ['python', 'javascript'] })
  await db.add('store', { id: 3, tags: ['rust', 'typescript'] })

  const tx = db.transaction('store', 'readonly')
  const store = tx.objectStore('store')
  const index = store.index('tags')

  // Get all records with 'javascript' tag
  const jsRecords = await index.getAll('javascript')
  expect(jsRecords.length).toBe(2)
  expect(jsRecords.map(r => r.id).sort()).toEqual([1, 2])

  // Get all records with 'typescript' tag
  const tsRecords = await index.getAll('typescript')
  expect(tsRecords.length).toBe(2)
  expect(tsRecords.map(r => r.id).sort()).toEqual([1, 3])

  // Get all records with 'rust' tag
  const rustRecords = await index.getAll('rust')
  expect(rustRecords.length).toBe(1)
  expect(rustRecords[0].id).toBe(3)

  await tx.done
  db.close()
})

/**
 * Test multiEntry with count
 */
test('multiEntry index with count', async () => {
  const migrations = createMigrations().version(1, v =>
    v
      .createObjectStore({
        name: 'store',
        schema: schema<{ id: number; categories: string[] }>(),
        primaryKey: 'id',
      })
      .createIndex('categories', {
        storeName: 'store',
        keyPath: 'categories',
        multiEntry: true,
      })
  )

  const db = await openDB('test-db', migrations)

  await db.add('store', { id: 1, categories: ['a', 'b', 'c'] })
  await db.add('store', { id: 2, categories: ['b', 'c', 'd'] })
  await db.add('store', { id: 3, categories: ['c', 'd', 'e'] })

  const tx = db.transaction('store', 'readonly')
  const store = tx.objectStore('store')
  const index = store.index('categories')

  // Count entries for each category
  const countA = await index.count('a')
  expect(countA).toBe(1)

  const countB = await index.count('b')
  expect(countB).toBe(2)

  const countC = await index.count('c')
  expect(countC).toBe(3)

  const countD = await index.count('d')
  expect(countD).toBe(2)

  const countE = await index.count('e')
  expect(countE).toBe(1)

  await tx.done
  db.close()
})

/**
 * Test multiEntry with cursor
 */
test('multiEntry index cursor iteration', async () => {
  const migrations = createMigrations().version(1, v =>
    v
      .createObjectStore({
        name: 'store',
        schema: schema<{ id: number; letters: string[] }>(),
        primaryKey: 'id',
      })
      .createIndex('letters', {
        storeName: 'store',
        keyPath: 'letters',
        multiEntry: true,
      })
  )

  const db = await openDB('test-db', migrations)

  await db.add('store', { id: 1, letters: ['a', 'b'] })
  await db.add('store', { id: 2, letters: ['b', 'c'] })

  const tx = db.transaction('store', 'readonly')
  const store = tx.objectStore('store')
  const index = store.index('letters')

  const entries: Array<{ key: string; primaryKey: number }> = []
  let cursor = await index.openCursor()
  while (cursor) {
    entries.push({
      key: cursor.key as string,
      primaryKey: cursor.primaryKey as number,
    })
    cursor = await cursor.continue()
  }

  await tx.done

  // Should have 4 entries: a->1, b->1, b->2, c->2
  expect(entries.length).toBe(4)
  expect(entries[0]).toEqual({ key: 'a', primaryKey: 1 })
  expect(entries[1]).toEqual({ key: 'b', primaryKey: 1 })
  expect(entries[2]).toEqual({ key: 'b', primaryKey: 2 })
  expect(entries[3]).toEqual({ key: 'c', primaryKey: 2 })

  db.close()
})

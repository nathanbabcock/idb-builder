/**
 * IDBCursor.continue() - index Tests
 *
 * Ported from WPT idbcursor_continue_index.any.js
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbcursor_continue_index.any.js
 */

import './wpt-setup'
import { expect, test } from 'vitest'
import { openDB } from '../../lib/idb-adapter'
import { createMigrations } from '../../lib/migration-builder'
import { schema } from '../../lib/schema'

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbcursor_continue_index.any.js#L23-L56
 */
test('Iterate to the next record', async () => {
  const migrations = createMigrations().version(1, v =>
    v
      .createObjectStore({
        name: 'test',
        schema: schema<{ pKey: string; iKey: string }>(),
        primaryKey: 'pKey',
      })
      .createIndex('index', {
        storeName: 'test',
        keyPath: 'iKey',
      })
  )

  const records = [
    { pKey: 'primaryKey_0', iKey: 'indexKey_0' },
    { pKey: 'primaryKey_1', iKey: 'indexKey_1' },
    { pKey: 'primaryKey_1-2', iKey: 'indexKey_1' },
  ]

  const db = await openDB('test-db', migrations)

  for (const record of records) {
    await db.add('test', record)
  }

  const tx = db.transaction('test', 'readonly')
  const store = tx.objectStore('test')
  const index = store.index('index')

  const results: Array<{ pKey: string; iKey: string }> = []
  let cursor = await index.openCursor()
  while (cursor) {
    results.push(cursor.value)
    cursor = await cursor.continue()
  }

  await tx.done

  expect(results.length).toBe(records.length)
  expect(results[0].pKey).toBe('primaryKey_0')
  expect(results[0].iKey).toBe('indexKey_0')
  expect(results[1].pKey).toBe('primaryKey_1')
  expect(results[2].pKey).toBe('primaryKey_1-2')

  db.close()
})

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbcursor_continue_index.any.js#L122-L166
 */
test('Iterate in reverse direction', async () => {
  const migrations = createMigrations().version(1, v =>
    v
      .createObjectStore({
        name: 'test',
        schema: schema<{ pKey: string; iKey: string }>(),
        primaryKey: 'pKey',
      })
      .createIndex('index', {
        storeName: 'test',
        keyPath: 'iKey',
      })
  )

  const records = [
    { pKey: 'primaryKey_0', iKey: 'indexKey_0' },
    { pKey: 'primaryKey_1', iKey: 'indexKey_1' },
    { pKey: 'primaryKey_2', iKey: 'indexKey_2' },
  ]

  const db = await openDB('test-db', migrations)

  for (const record of records) {
    await db.add('test', record)
  }

  const tx = db.transaction('test', 'readonly')
  const store = tx.objectStore('test')
  const index = store.index('index')

  const results: Array<{ pKey: string; iKey: string }> = []
  let cursor = await index.openCursor(null, 'prev')
  while (cursor) {
    results.push(cursor.value)
    cursor = await cursor.continue()
  }

  await tx.done

  expect(results.length).toBe(3)
  expect(results[0].pKey).toBe('primaryKey_2')
  expect(results[1].pKey).toBe('primaryKey_1')
  expect(results[2].pKey).toBe('primaryKey_0')

  db.close()
})

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbcursor_continue_index.any.js#L168-L212
 */
test("Iterate using 'prevunique'", async () => {
  const migrations = createMigrations().version(1, v =>
    v
      .createObjectStore({
        name: 'test',
        schema: schema<{ pKey: string; iKey: string }>(),
        primaryKey: 'pKey',
      })
      .createIndex('index', {
        storeName: 'test',
        keyPath: 'iKey',
      })
  )

  const records = [
    { pKey: 'primaryKey_0', iKey: 'indexKey_0' },
    { pKey: 'primaryKey_1', iKey: 'indexKey_1' },
    { pKey: 'primaryKey_1-2', iKey: 'indexKey_1' },
    { pKey: 'primaryKey_2', iKey: 'indexKey_2' },
  ]

  const db = await openDB('test-db', migrations)

  for (const record of records) {
    await db.add('test', record)
  }

  const tx = db.transaction('test', 'readonly')
  const store = tx.objectStore('test')
  const index = store.index('index')

  const expected = [
    { pKey: 'primaryKey_2', iKey: 'indexKey_2' },
    { pKey: 'primaryKey_1', iKey: 'indexKey_1' },
    { pKey: 'primaryKey_0', iKey: 'indexKey_0' },
  ]

  const results: Array<{ pKey: string; iKey: string }> = []
  let cursor = await index.openCursor(null, 'prevunique')
  while (cursor) {
    results.push(cursor.value)
    cursor = await cursor.continue()
  }

  await tx.done

  expect(results.length).toBe(expected.length)
  for (let i = 0; i < expected.length; i++) {
    expect(results[i].pKey).toBe(expected[i].pKey)
    expect(results[i].iKey).toBe(expected[i].iKey)
  }

  db.close()
})

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbcursor_continue_index.any.js#L214-L258
 */
test('Iterate using nextunique', async () => {
  const migrations = createMigrations().version(1, v =>
    v
      .createObjectStore({
        name: 'test',
        schema: schema<{ pKey: string; iKey: string }>(),
        primaryKey: 'pKey',
      })
      .createIndex('index', {
        storeName: 'test',
        keyPath: 'iKey',
      })
  )

  const records = [
    { pKey: 'primaryKey_0', iKey: 'indexKey_0' },
    { pKey: 'primaryKey_1', iKey: 'indexKey_1' },
    { pKey: 'primaryKey_1-2', iKey: 'indexKey_1' },
    { pKey: 'primaryKey_2', iKey: 'indexKey_2' },
  ]

  const db = await openDB('test-db', migrations)

  for (const record of records) {
    await db.add('test', record)
  }

  const tx = db.transaction('test', 'readonly')
  const store = tx.objectStore('test')
  const index = store.index('index')

  const expected = [
    { pKey: 'primaryKey_0', iKey: 'indexKey_0' },
    { pKey: 'primaryKey_1', iKey: 'indexKey_1' },
    { pKey: 'primaryKey_2', iKey: 'indexKey_2' },
  ]

  const results: Array<{ pKey: string; iKey: string }> = []
  let cursor = await index.openCursor(null, 'nextunique')
  while (cursor) {
    results.push(cursor.value)
    cursor = await cursor.continue()
  }

  await tx.done

  expect(results.length).toBe(expected.length)
  for (let i = 0; i < expected.length; i++) {
    expect(results[i].pKey).toBe(expected[i].pKey)
    expect(results[i].iKey).toBe(expected[i].iKey)
  }

  db.close()
})

/**
 * Test cursor iteration with key range on index
 */
test('Iteration with key range on index', async () => {
  const migrations = createMigrations().version(1, v =>
    v
      .createObjectStore({
        name: 'test',
        schema: schema<{ pKey: string; iKey: string }>(),
        primaryKey: 'pKey',
      })
      .createIndex('index', {
        storeName: 'test',
        keyPath: 'iKey',
      })
  )

  const db = await openDB('test-db', migrations)

  for (let i = 0; i < 10; i++) {
    await db.add('test', { pKey: `primaryKey_${i}`, iKey: `indexKey_${i}` })
  }

  const tx = db.transaction('test', 'readonly')
  const store = tx.objectStore('test')
  const index = store.index('index')

  const results: string[] = []
  let cursor = await index.openCursor(IDBKeyRange.bound('indexKey_3', 'indexKey_6'))
  while (cursor) {
    results.push(cursor.value.iKey)
    cursor = await cursor.continue()
  }

  await tx.done

  expect(results).toEqual(['indexKey_3', 'indexKey_4', 'indexKey_5', 'indexKey_6'])

  db.close()
})

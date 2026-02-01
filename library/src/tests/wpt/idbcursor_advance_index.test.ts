/**
 * IDBCursor.advance() - index Tests
 *
 * Ported from WPT idbcursor_advance_index.any.js
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbcursor_advance_index.any.js
 */

import './wpt-setup'
import { expect, test } from 'vitest'
import { openDB } from '../../lib/idb-adapter'
import { createMigrations } from '../../lib/migration-builder'
import { schema } from '../../lib/schema'

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbcursor_advance_index.any.js#L26-L65
 */
test('index - iterate cursor number of times specified by count', async () => {
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
    { pKey: 'primaryKey_3', iKey: 'indexKey_3' },
  ]

  const db = await openDB('test-db', migrations)

  for (const record of records) {
    await db.add('test', record)
  }

  const tx = db.transaction('test', 'readonly')
  const store = tx.objectStore('test')
  const index = store.index('index')

  let cursor = await index.openCursor()
  expect(cursor).not.toBeNull()

  // Advance by 3 positions
  cursor = await cursor!.advance(3)
  expect(cursor).not.toBeNull()
  expect(cursor!.value.pKey).toBe('primaryKey_3')
  expect(cursor!.value.iKey).toBe('indexKey_3')

  await tx.done
  db.close()
})

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbcursor_advance_index.any.js#L162-L183
 */
test('Calling advance() with count argument 0 should throw TypeError', async () => {
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
  await db.add('test', { pKey: 'primaryKey_0', iKey: 'indexKey_0' })
  await db.add('test', { pKey: 'primaryKey_1', iKey: 'indexKey_1' })

  const tx = db.transaction('test', 'readonly')
  const store = tx.objectStore('test')
  const index = store.index('index')

  const cursor = await index.openCursor()
  expect(cursor).not.toBeNull()

  expect(() => {
    cursor!.advance(0)
  }).toThrow(TypeError)

  db.close()
})

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbcursor_advance_index.any.js#L123-L160
 */
test('index - iterate skipping duplicates with advance', async () => {
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

  const expected = [
    { pKey: 'primaryKey_0', iKey: 'indexKey_0' },
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
    cursor = await cursor.advance(2)
  }

  await tx.done

  expect(results.length).toBe(expected.length)
  expect(results[0].pKey).toBe(expected[0].pKey)
  expect(results[1].pKey).toBe(expected[1].pKey)

  db.close()
})

/**
 * Test advance past end of records on index
 */
test('advance() past end of records on index returns null cursor', async () => {
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
  await db.add('test', { pKey: 'primaryKey_0', iKey: 'indexKey_0' })
  await db.add('test', { pKey: 'primaryKey_1', iKey: 'indexKey_1' })

  const tx = db.transaction('test', 'readonly')
  const store = tx.objectStore('test')
  const index = store.index('index')

  let cursor = await index.openCursor()
  expect(cursor).not.toBeNull()

  // Advance past the end
  cursor = await cursor!.advance(10)
  expect(cursor).toBeNull()

  await tx.done
  db.close()
})

/**
 * Test advance with reverse direction on index
 */
test('advance() with reverse direction on index', async () => {
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
    { pKey: 'primaryKey_3', iKey: 'indexKey_3' },
  ]

  const db = await openDB('test-db', migrations)

  for (const record of records) {
    await db.add('test', record)
  }

  const tx = db.transaction('test', 'readonly')
  const store = tx.objectStore('test')
  const index = store.index('index')

  // Start from the end
  let cursor = await index.openCursor(null, 'prev')
  expect(cursor).not.toBeNull()
  expect(cursor!.value.iKey).toBe('indexKey_3')

  // Advance by 2 positions (backwards)
  cursor = await cursor!.advance(2)
  expect(cursor).not.toBeNull()
  expect(cursor!.value.iKey).toBe('indexKey_1')

  await tx.done
  db.close()
})

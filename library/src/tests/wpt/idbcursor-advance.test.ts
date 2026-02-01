/**
 * IDBCursor.advance() Tests
 *
 * Ported from WPT idbcursor-advance.any.js
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbcursor-advance.any.js
 */

import './wpt-setup'
import { expect, test } from 'vitest'
import { openDB } from '../../lib/idb-adapter'
import { createMigrations } from '../../lib/migration-builder'
import { schema } from '../../lib/schema'

async function setupDb() {
  const migrations = createMigrations().version(1, v =>
    v
      .createObjectStore({
        name: 'test',
        schema: schema<string>(),
      })
      .createIndex('index', {
        storeName: 'test',
        keyPath: '',
      })
  )

  const db = await openDB('test-db', migrations)

  // Add test data
  const txn = db.transaction('test', 'readwrite')
  await txn.objectStore('test').add('cupcake', 5)
  await txn.objectStore('test').add('pancake', 3)
  await txn.objectStore('test').add('pie', 1)
  await txn.objectStore('test').add('pie', 4)
  await txn.objectStore('test').add('taco', 2)
  await txn.done

  return db
}

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbcursor-advance.any.js#L18-L57
 */
test('IDBCursor.advance() - advances', async () => {
  const db = await setupDb()

  try {
    const txn = db.transaction('test', 'readonly')
    const index = txn.objectStore('test').index('index')

    const results: Array<{ value: string; primaryKey: IDBValidKey }> = []
    let cursor = await index.openCursor()

    while (cursor) {
      results.push({ value: cursor.value, primaryKey: cursor.primaryKey })
      cursor = await cursor.advance(2)
    }

    expect(results.length).toBe(3)
    expect(results[0]).toEqual({ value: 'cupcake', primaryKey: 5 })
    expect(results[1]).toEqual({ value: 'pie', primaryKey: 1 })
    expect(results[2]).toEqual({ value: 'taco', primaryKey: 2 })

    await txn.done
  } finally {
    db.close()
  }
})

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbcursor-advance.any.js#L59-L98
 */
test('IDBCursor.advance() - advances backwards', async () => {
  const db = await setupDb()

  try {
    const txn = db.transaction('test', 'readonly')
    const index = txn.objectStore('test').index('index')

    const results: Array<{ value: string; primaryKey: IDBValidKey }> = []
    let cursor = await index.openCursor(null, 'prev')

    while (cursor) {
      results.push({ value: cursor.value, primaryKey: cursor.primaryKey })
      cursor = await cursor.advance(2)
    }

    expect(results.length).toBe(3)
    expect(results[0]).toEqual({ value: 'taco', primaryKey: 2 })
    expect(results[1]).toEqual({ value: 'pie', primaryKey: 1 })
    expect(results[2]).toEqual({ value: 'cupcake', primaryKey: 5 })

    await txn.done
  } finally {
    db.close()
  }
})

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbcursor-advance.any.js#L100-L129
 */
test('IDBCursor.advance() - skip far forward', async () => {
  const db = await setupDb()

  try {
    const txn = db.transaction('test', 'readonly')
    const index = txn.objectStore('test').index('index')

    const results: Array<{ value: string; primaryKey: IDBValidKey }> = []
    let cursor = await index.openCursor()

    if (cursor) {
      results.push({ value: cursor.value, primaryKey: cursor.primaryKey })
      cursor = await cursor.advance(100000)
    }

    expect(results.length).toBe(1)
    expect(results[0]).toEqual({ value: 'cupcake', primaryKey: 5 })
    expect(cursor).toBeNull()

    await txn.done
  } finally {
    db.close()
  }
})

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbcursor-advance.any.js#L131-L165
 */
test('IDBCursor.advance() - within range', async () => {
  const db = await setupDb()

  try {
    const txn = db.transaction('test', 'readonly')
    const index = txn.objectStore('test').index('index')

    const results: Array<{ value: string; primaryKey: IDBValidKey }> = []
    let cursor = await index.openCursor(IDBKeyRange.lowerBound('cupcake', true))

    while (cursor) {
      results.push({ value: cursor.value, primaryKey: cursor.primaryKey })
      cursor = await cursor.advance(2)
    }

    expect(results.length).toBe(2)
    expect(results[0]).toEqual({ value: 'pancake', primaryKey: 3 })
    expect(results[1]).toEqual({ value: 'pie', primaryKey: 4 })

    await txn.done
  } finally {
    db.close()
  }
})

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbcursor-advance.any.js#L167-L196
 */
test('IDBCursor.advance() - within single key range', async () => {
  const db = await setupDb()

  try {
    const txn = db.transaction('test', 'readonly')
    const index = txn.objectStore('test').index('index')

    const results: Array<{ value: string; primaryKey: IDBValidKey }> = []
    let cursor = await index.openCursor('pancake')

    while (cursor) {
      results.push({ value: cursor.value, primaryKey: cursor.primaryKey })
      cursor = await cursor.advance(1)
    }

    expect(results.length).toBe(1)
    expect(results[0]).toEqual({ value: 'pancake', primaryKey: 3 })

    await txn.done
  } finally {
    db.close()
  }
})

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbcursor-advance.any.js#L198-L232
 */
test('IDBCursor.advance() - within single key range, with several results', async () => {
  const db = await setupDb()

  try {
    const txn = db.transaction('test', 'readonly')
    const index = txn.objectStore('test').index('index')

    const results: Array<{ value: string; primaryKey: IDBValidKey }> = []
    let cursor = await index.openCursor('pie')

    while (cursor) {
      results.push({ value: cursor.value, primaryKey: cursor.primaryKey })
      cursor = await cursor.advance(1)
    }

    expect(results.length).toBe(2)
    expect(results[0]).toEqual({ value: 'pie', primaryKey: 1 })
    expect(results[1]).toEqual({ value: 'pie', primaryKey: 4 })

    await txn.done
  } finally {
    db.close()
  }
})

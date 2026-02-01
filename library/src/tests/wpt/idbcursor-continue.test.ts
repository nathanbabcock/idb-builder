/**
 * IDBCursor.continue() Tests
 *
 * Ported from WPT idbcursor-continue.any.js
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbcursor-continue.any.js
 */

import './wpt-setup'
import { expect, test } from 'vitest'
import { openDB } from '../../lib/idb-adapter'
import { createMigrations } from '../../lib/migration-builder'
import { schema } from '../../lib/schema'

const storeData = [
  { value: 'cupcake', key: 5 },
  { value: 'pancake', key: 3 },
  { value: 'pie', key: 1 },
  { value: 'pie', key: 4 },
  { value: 'taco', key: 2 },
]

async function setupDatabase() {
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

  for (const item of storeData) {
    await db.add('test', item.value, item.key)
  }

  return db
}

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbcursor-continue.any.js#L27-L50
 */
test('IDBCursor.continue() - continues', async () => {
  const db = await setupDatabase()

  try {
    const tx = db.transaction('test', 'readonly')
    const store = tx.objectStore('test')
    const index = store.index('index')

    // Index iterates by value (string), so order is: cupcake, pancake, pie, pie, taco
    const expectedOrder = [
      { value: 'cupcake', key: 5 },
      { value: 'pancake', key: 3 },
      { value: 'pie', key: 1 },
      { value: 'pie', key: 4 },
      { value: 'taco', key: 2 },
    ]

    let count = 0
    let cursor = await index.openCursor()

    while (cursor) {
      expect(cursor.value).toBe(expectedOrder[count].value)
      expect(cursor.primaryKey).toBe(expectedOrder[count].key)
      count++
      cursor = await cursor.continue()
    }

    await tx.done
    expect(count).toBe(5)
  } finally {
    db.close()
  }
})

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbcursor-continue.any.js#L53-L94
 */
test('IDBCursor.continue() - with given key', async () => {
  const db = await setupDatabase()

  try {
    const tx = db.transaction('test', 'readonly')
    const store = tx.objectStore('test')
    const index = store.index('index')

    let cursor = await index.openCursor()
    expect(cursor).not.toBeNull()
    expect(cursor!.value).toBe('cupcake')
    expect(cursor!.primaryKey).toBe(5)

    // Skip to 'pie'
    cursor = await cursor!.continue('pie')
    expect(cursor).not.toBeNull()
    expect(cursor!.value).toBe('pie')
    expect(cursor!.primaryKey).toBe(1)

    // Skip to 'taco'
    cursor = await cursor!.continue('taco')
    expect(cursor).not.toBeNull()
    expect(cursor!.value).toBe('taco')
    expect(cursor!.primaryKey).toBe(2)

    // Continue past end
    cursor = await cursor!.continue()
    expect(cursor).toBeNull()

    await tx.done
  } finally {
    db.close()
  }
})

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbcursor-continue.any.js#L97-L126
 */
test('IDBCursor.continue() - skip far forward', async () => {
  const db = await setupDatabase()

  try {
    const tx = db.transaction('test', 'readonly')
    const store = tx.objectStore('test')
    const index = store.index('index')

    let cursor = await index.openCursor()
    expect(cursor).not.toBeNull()
    expect(cursor!.value).toBe('cupcake')

    // Skip far forward with an array key (arrays are always bigger than strings)
    // @ts-expect-error schema expects string keys
    cursor = await cursor!.continue([])
    expect(cursor).toBeNull()

    await tx.done
  } finally {
    db.close()
  }
})

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbcursor-continue.any.js#L129-L164
 */
test('IDBCursor.continue() - within range', async () => {
  const db = await setupDatabase()

  try {
    const tx = db.transaction('test', 'readonly')
    const store = tx.objectStore('test')
    const index = store.index('index')

    // Open cursor with lowerBound excluding 'cupcake'
    let cursor = await index.openCursor(IDBKeyRange.lowerBound('cupcake', true))
    expect(cursor).not.toBeNull()
    expect(cursor!.value).toBe('pancake')
    expect(cursor!.primaryKey).toBe(3)

    // Continue to 'pie'
    cursor = await cursor!.continue('pie')
    expect(cursor).not.toBeNull()
    expect(cursor!.value).toBe('pie')
    expect(cursor!.primaryKey).toBe(1)

    // Continue past range
    cursor = await cursor!.continue('zzz')
    expect(cursor).toBeNull()

    await tx.done
  } finally {
    db.close()
  }
})

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbcursor-continue.any.js#L167-L196
 */
test('IDBCursor.continue() - within single key range', async () => {
  const db = await setupDatabase()

  try {
    const tx = db.transaction('test', 'readonly')
    const store = tx.objectStore('test')
    const index = store.index('index')

    // Open cursor for only 'pancake'
    let cursor = await index.openCursor('pancake')
    expect(cursor).not.toBeNull()
    expect(cursor!.value).toBe('pancake')
    expect(cursor!.primaryKey).toBe(3)

    // Continue to 'pie' should go past the range
    cursor = await cursor!.continue('pie')
    expect(cursor).toBeNull()

    await tx.done
  } finally {
    db.close()
  }
})

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbcursor-continue.any.js#L198-L233
 */
test('IDBCursor.continue() - within single key range, with several results', async () => {
  const db = await setupDatabase()

  try {
    const tx = db.transaction('test', 'readonly')
    const store = tx.objectStore('test')
    const index = store.index('index')

    // Open cursor for only 'pie' (which has two entries)
    let count = 0
    let cursor = await index.openCursor('pie')

    while (cursor) {
      expect(cursor.value).toBe('pie')
      if (count === 0) {
        expect(cursor.primaryKey).toBe(1)
      } else {
        expect(cursor.primaryKey).toBe(4)
      }
      count++
      cursor = await cursor.continue()
    }

    await tx.done
    expect(count).toBe(2)
  } finally {
    db.close()
  }
})

/**
 * Additional test: continue on object store cursor
 */
test('IDBCursor.continue() on object store cursor', async () => {
  const migrations = createMigrations().version(1, v =>
    v.createObjectStore({
      name: 'store',
      schema: schema<{ name: string }>(),
    })
  )

  const db = await openDB('test-db', migrations)

  try {
    await db.add('store', { name: 'a' }, 1)
    await db.add('store', { name: 'b' }, 2)
    await db.add('store', { name: 'c' }, 3)
    await db.add('store', { name: 'd' }, 4)
    await db.add('store', { name: 'e' }, 5)

    const tx = db.transaction('store', 'readonly')
    const store = tx.objectStore('store')

    // Start at key 1
    let cursor = await store.openCursor()
    expect(cursor).not.toBeNull()
    expect(cursor!.key).toBe(1)

    // Skip to key 3
    cursor = await cursor!.continue(3)
    expect(cursor).not.toBeNull()
    expect(cursor!.key).toBe(3)

    // Skip to key 5
    cursor = await cursor!.continue(5)
    expect(cursor).not.toBeNull()
    expect(cursor!.key).toBe(5)

    // Continue past end
    cursor = await cursor!.continue()
    expect(cursor).toBeNull()

    await tx.done
  } finally {
    db.close()
  }
})

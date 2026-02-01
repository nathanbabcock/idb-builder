/**
 * IDBCursor.advance() - object store Tests
 *
 * Ported from WPT idbcursor_advance_objectstore.any.js
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbcursor_advance_objectstore.any.js
 */

import './wpt-setup'
import { expect, test } from 'vitest'
import { openDB } from '../../lib/idb-adapter'
import { createMigrations } from '../../lib/migration-builder'
import { schema } from '../../lib/schema'

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbcursor_advance_objectstore.any.js#L24-L61
 */
test('object store - iterate cursor number of times specified by count', async () => {
  const migrations = createMigrations().version(1, v =>
    v.createObjectStore({
      name: 'store',
      schema: schema<{ pKey: string }>(),
      primaryKey: 'pKey',
    })
  )

  const records = [
    { pKey: 'primaryKey_0' },
    { pKey: 'primaryKey_1' },
    { pKey: 'primaryKey_2' },
    { pKey: 'primaryKey_3' },
  ]

  const db = await openDB('test-db', migrations)

  for (const record of records) {
    await db.add('store', record)
  }

  const tx = db.transaction('store', 'readonly')
  const store = tx.objectStore('store')

  let cursor = await store.openCursor()
  expect(cursor).not.toBeNull()

  // Advance by 3 positions
  cursor = await cursor!.advance(3)
  expect(cursor).not.toBeNull()
  expect(cursor!.value.pKey).toBe('primaryKey_3')

  await tx.done
  db.close()
})

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbcursor_advance_objectstore.any.js#L63-L85
 */
test('Calling advance() with count argument 0 should throw TypeError', async () => {
  const migrations = createMigrations().version(1, v =>
    v.createObjectStore({
      name: 'store',
      schema: schema<{ pKey: string }>(),
      primaryKey: 'pKey',
    })
  )

  const db = await openDB('test-db', migrations)
  await db.add('store', { pKey: 'primaryKey_0' })
  await db.add('store', { pKey: 'primaryKey_1' })

  const tx = db.transaction('store', 'readonly')
  const store = tx.objectStore('store')

  const cursor = await store.openCursor()
  expect(cursor).not.toBeNull()

  expect(() => {
    cursor!.advance(0)
  }).toThrow(TypeError)

  db.close()
})

/**
 * Test advance past the end of records
 */
test('advance() past end of records returns null cursor', async () => {
  const migrations = createMigrations().version(1, v =>
    v.createObjectStore({
      name: 'store',
      schema: schema<{ pKey: string }>(),
      primaryKey: 'pKey',
    })
  )

  const db = await openDB('test-db', migrations)
  await db.add('store', { pKey: 'primaryKey_0' })
  await db.add('store', { pKey: 'primaryKey_1' })

  const tx = db.transaction('store', 'readonly')
  const store = tx.objectStore('store')

  let cursor = await store.openCursor()
  expect(cursor).not.toBeNull()

  // Advance past the end
  cursor = await cursor!.advance(10)
  expect(cursor).toBeNull()

  await tx.done
  db.close()
})

/**
 * Test advance with reverse direction
 */
test('advance() with reverse direction', async () => {
  const migrations = createMigrations().version(1, v =>
    v.createObjectStore({
      name: 'store',
      schema: schema<{ pKey: string }>(),
      primaryKey: 'pKey',
    })
  )

  const records = [
    { pKey: 'primaryKey_0' },
    { pKey: 'primaryKey_1' },
    { pKey: 'primaryKey_2' },
    { pKey: 'primaryKey_3' },
  ]

  const db = await openDB('test-db', migrations)

  for (const record of records) {
    await db.add('store', record)
  }

  const tx = db.transaction('store', 'readonly')
  const store = tx.objectStore('store')

  // Start from the end
  let cursor = await store.openCursor(null, 'prev')
  expect(cursor).not.toBeNull()
  expect(cursor!.value.pKey).toBe('primaryKey_3')

  // Advance by 2 positions (backwards)
  cursor = await cursor!.advance(2)
  expect(cursor).not.toBeNull()
  expect(cursor!.value.pKey).toBe('primaryKey_1')

  await tx.done
  db.close()
})

/**
 * Test advance by 1 is equivalent to continue
 */
test('advance(1) is equivalent to continue()', async () => {
  const migrations = createMigrations().version(1, v =>
    v.createObjectStore({
      name: 'store',
      schema: schema<{ pKey: string }>(),
      primaryKey: 'pKey',
    })
  )

  const records = [
    { pKey: 'primaryKey_0' },
    { pKey: 'primaryKey_1' },
    { pKey: 'primaryKey_2' },
  ]

  const db = await openDB('test-db', migrations)

  for (const record of records) {
    await db.add('store', record)
  }

  const tx = db.transaction('store', 'readonly')
  const store = tx.objectStore('store')

  let cursor = await store.openCursor()
  expect(cursor).not.toBeNull()
  expect(cursor!.value.pKey).toBe('primaryKey_0')

  cursor = await cursor!.advance(1)
  expect(cursor).not.toBeNull()
  expect(cursor!.value.pKey).toBe('primaryKey_1')

  await tx.done
  db.close()
})

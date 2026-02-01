/**
 * IDBCursor.continue() - object store Tests
 *
 * Ported from WPT idbcursor_continue_objectstore.any.js
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbcursor_continue_objectstore.any.js
 */

import './wpt-setup'
import { expect, test } from 'vitest'
import { openDB } from '../../lib/idb-adapter'
import { createMigrations } from '../../lib/migration-builder'
import { schema } from '../../lib/schema'

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbcursor_continue_objectstore.any.js#L34-L66
 */
test('Iterate to the next record', async () => {
  const migrations = createMigrations().version(1, v =>
    v.createObjectStore({
      name: 'test',
      schema: schema<{ pKey: string }>(),
      primaryKey: 'pKey',
    })
  )

  const records = [{ pKey: 'primaryKey_0' }, { pKey: 'primaryKey_1' }]

  const db = await openDB('test-db', migrations)

  for (const record of records) {
    await db.add('test', record)
  }

  const tx = db.transaction('test', 'readonly')
  const store = tx.objectStore('test')

  const results: string[] = []
  let cursor = await store.openCursor()
  while (cursor) {
    results.push(cursor.value.pKey)
    cursor = await cursor.continue()
  }

  await tx.done

  expect(results.length).toBe(records.length)
  expect(results[0]).toBe('primaryKey_0')
  expect(results[1]).toBe('primaryKey_1')

  db.close()
})

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbcursor_continue_objectstore.any.js#L124-L167
 */
test('Iterate in reverse direction with continue to specific key', async () => {
  const migrations = createMigrations().version(1, v =>
    v.createObjectStore({
      name: 'test',
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
    await db.add('test', record)
  }

  const tx = db.transaction('test', 'readonly')
  const store = tx.objectStore('test')

  const results: string[] = []
  let cursor = await store.openCursor(null, 'prev')
  if (cursor) {
    results.push(cursor.value.pKey)
    // Continue to a specific key
    cursor = await cursor.continue('primaryKey_1')
    if (cursor) {
      results.push(cursor.value.pKey)
    }
  }

  await tx.done

  expect(results[0]).toBe('primaryKey_2')
  expect(results[1]).toBe('primaryKey_1')

  db.close()
})

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbcursor_continue_objectstore.any.js#L226-L265
 */
test('Delete next element, and iterate to it', async () => {
  const migrations = createMigrations().version(1, v =>
    v.createObjectStore({
      name: 'test',
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
    await db.add('test', record)
  }

  const tx = db.transaction('test', 'readwrite')
  const store = tx.objectStore('test')

  const results: string[] = []
  let cursor = await store.openCursor()
  while (cursor) {
    const record = cursor.value
    // When at primaryKey_0, delete primaryKey_1
    if (record.pKey === 'primaryKey_0') {
      await store.delete('primaryKey_1')
    }
    results.push(record.pKey)
    cursor = await cursor.continue()
  }

  await tx.done

  // Should skip the deleted record
  expect(results).toEqual(['primaryKey_0', 'primaryKey_2'])

  db.close()
})

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbcursor_continue_objectstore.any.js#L267-L306
 */
test('Add next element, and iterate to it', async () => {
  const migrations = createMigrations().version(1, v =>
    v.createObjectStore({
      name: 'test',
      schema: schema<{ pKey: string }>(),
      primaryKey: 'pKey',
    })
  )

  const records = [{ pKey: 'primaryKey_0' }, { pKey: 'primaryKey_2' }]

  const db = await openDB('test-db', migrations)

  for (const record of records) {
    await db.add('test', record)
  }

  const tx = db.transaction('test', 'readwrite')
  const store = tx.objectStore('test')

  const results: string[] = []
  let cursor = await store.openCursor()
  while (cursor) {
    const record = cursor.value
    // When at primaryKey_0, add primaryKey_1
    if (record.pKey === 'primaryKey_0') {
      await store.add({ pKey: 'primaryKey_1' })
    }
    results.push(record.pKey)
    cursor = await cursor.continue()
  }

  await tx.done

  // Should iterate through the newly added record
  expect(results).toEqual(['primaryKey_0', 'primaryKey_1', 'primaryKey_2'])

  db.close()
})

/**
 * Test cursor.continue with key range
 */
test('Iterate with key range', async () => {
  const migrations = createMigrations().version(1, v =>
    v.createObjectStore({
      name: 'test',
      schema: schema<{ pKey: string }>(),
      primaryKey: 'pKey',
    })
  )

  const db = await openDB('test-db', migrations)

  for (let i = 0; i < 10; i++) {
    await db.add('test', { pKey: `key_${i}` })
  }

  const tx = db.transaction('test', 'readonly')
  const store = tx.objectStore('test')

  const results: string[] = []
  let cursor = await store.openCursor(IDBKeyRange.bound('key_3', 'key_6'))
  while (cursor) {
    results.push(cursor.value.pKey)
    cursor = await cursor.continue()
  }

  await tx.done

  expect(results).toEqual(['key_3', 'key_4', 'key_5', 'key_6'])

  db.close()
})

/**
 * IndexedDB Values Tests
 *
 * Ported from WPT value.any.js
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/value.any.js
 */

import './wpt-setup'
import { expect, test } from 'vitest'
import { openDB } from '../../lib/idb-adapter'
import { createMigrations } from '../../lib/migration-builder'
import { schema } from '../../lib/schema'

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/value.any.js#L87
 */
test('Values - Date', async () => {
  const migrations = createMigrations().version(1, v =>
    v.createObjectStore({
      name: 'store',
      schema: schema<Date>(),
    })
  )

  const db = await openDB('test-db', migrations)

  const originalDate = new Date('2024-01-15T12:00:00Z')
  await db.add('store', originalDate, 1)

  const tx = db.transaction('store', 'readonly')
  const store = tx.objectStore('store')

  const result = await store.get(1)
  expect(result).toBeInstanceOf(Date)
  expect(result?.getTime()).toBe(originalDate.getTime())

  await tx.done
  db.close()
})

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/value.any.js#L88
 */
test('Values - Array', async () => {
  const migrations = createMigrations().version(1, v =>
    v.createObjectStore({
      name: 'store',
      schema: schema<number[]>(),
    })
  )

  const db = await openDB('test-db', migrations)

  const originalArray = [1, 2, 3, 4, 5]
  await db.add('store', originalArray, 1)

  const tx = db.transaction('store', 'readonly')
  const store = tx.objectStore('store')

  const result = await store.get(1)
  expect(result).toBeInstanceOf(Array)
  expect(result).toEqual(originalArray)

  await tx.done
  db.close()
})

/**
 * Test storing objects
 */
test('Values - Object', async () => {
  const migrations = createMigrations().version(1, v =>
    v.createObjectStore({
      name: 'store',
      schema: schema<{ name: string; age: number; nested: { value: string } }>(),
    })
  )

  const db = await openDB('test-db', migrations)

  const originalObject = { name: 'test', age: 42, nested: { value: 'deep' } }
  await db.add('store', originalObject, 1)

  const tx = db.transaction('store', 'readonly')
  const store = tx.objectStore('store')

  const result = await store.get(1)
  expect(result).toEqual(originalObject)

  await tx.done
  db.close()
})

/**
 * Test storing strings
 */
test('Values - String', async () => {
  const migrations = createMigrations().version(1, v =>
    v.createObjectStore({
      name: 'store',
      schema: schema<string>(),
    })
  )

  const db = await openDB('test-db', migrations)

  const originalString = 'Hello, IndexedDB!'
  await db.add('store', originalString, 1)

  const tx = db.transaction('store', 'readonly')
  const store = tx.objectStore('store')

  const result = await store.get(1)
  expect(typeof result).toBe('string')
  expect(result).toBe(originalString)

  await tx.done
  db.close()
})

/**
 * Test storing numbers
 */
test('Values - Number', async () => {
  const migrations = createMigrations().version(1, v =>
    v.createObjectStore({
      name: 'store',
      schema: schema<number>(),
    })
  )

  const db = await openDB('test-db', migrations)

  await db.add('store', 42, 'int')
  await db.add('store', 3.14159, 'float')
  await db.add('store', -100, 'negative')
  await db.add('store', Infinity, 'infinity')
  await db.add('store', -Infinity, 'neg-infinity')

  const tx = db.transaction('store', 'readonly')
  const store = tx.objectStore('store')

  expect(await store.get('int')).toBe(42)
  expect(await store.get('float')).toBe(3.14159)
  expect(await store.get('negative')).toBe(-100)
  expect(await store.get('infinity')).toBe(Infinity)
  expect(await store.get('neg-infinity')).toBe(-Infinity)

  await tx.done
  db.close()
})

/**
 * Test storing boolean
 */
test('Values - Boolean', async () => {
  const migrations = createMigrations().version(1, v =>
    v.createObjectStore({
      name: 'store',
      schema: schema<boolean>(),
    })
  )

  const db = await openDB('test-db', migrations)

  await db.add('store', true, 'true')
  await db.add('store', false, 'false')

  const tx = db.transaction('store', 'readonly')
  const store = tx.objectStore('store')

  expect(await store.get('true')).toBe(true)
  expect(await store.get('false')).toBe(false)

  await tx.done
  db.close()
})

/**
 * Test storing null
 */
test('Values - null', async () => {
  const migrations = createMigrations().version(1, v =>
    v.createObjectStore({
      name: 'store',
      schema: schema<null>(),
    })
  )

  const db = await openDB('test-db', migrations)

  await db.add('store', null, 1)

  const tx = db.transaction('store', 'readonly')
  const store = tx.objectStore('store')

  const result = await store.get(1)
  expect(result).toBe(null)

  await tx.done
  db.close()
})

/**
 * Test storing undefined (becomes undefined on retrieval)
 */
test('Values - undefined', async () => {
  const migrations = createMigrations().version(1, v =>
    v.createObjectStore({
      name: 'store',
      schema: schema<undefined>(),
    })
  )

  const db = await openDB('test-db', migrations)

  await db.add('store', undefined, 1)

  const tx = db.transaction('store', 'readonly')
  const store = tx.objectStore('store')

  const result = await store.get(1)
  expect(result).toBe(undefined)

  await tx.done
  db.close()
})

/**
 * Test storing ArrayBuffer
 */
test('Values - ArrayBuffer', async () => {
  const migrations = createMigrations().version(1, v =>
    v.createObjectStore({
      name: 'store',
      schema: schema<ArrayBuffer>(),
    })
  )

  const db = await openDB('test-db', migrations)

  const buffer = new ArrayBuffer(8)
  const view = new Uint8Array(buffer)
  view[0] = 1
  view[1] = 2
  view[7] = 255

  await db.add('store', buffer, 1)

  const tx = db.transaction('store', 'readonly')
  const store = tx.objectStore('store')

  const result = await store.get(1)
  expect(result).toBeInstanceOf(ArrayBuffer)
  const resultView = new Uint8Array(result as ArrayBuffer)
  expect(resultView[0]).toBe(1)
  expect(resultView[1]).toBe(2)
  expect(resultView[7]).toBe(255)

  await tx.done
  db.close()
})

/**
 * Test storing Uint8Array
 */
test('Values - Uint8Array', async () => {
  const migrations = createMigrations().version(1, v =>
    v.createObjectStore({
      name: 'store',
      schema: schema<Uint8Array>(),
    })
  )

  const db = await openDB('test-db', migrations)

  const original = new Uint8Array([1, 2, 3, 4, 5])
  await db.add('store', original, 1)

  const tx = db.transaction('store', 'readonly')
  const store = tx.objectStore('store')

  const result = await store.get(1)
  expect(result).toBeInstanceOf(Uint8Array)
  expect(Array.from(result as Uint8Array)).toEqual([1, 2, 3, 4, 5])

  await tx.done
  db.close()
})

/**
 * Binary Key Tests
 *
 * Ported from WPT idb-binary-key-roundtrip.any.js and idb_binary_key_conversion.any.js
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idb-binary-key-roundtrip.any.js
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idb_binary_key_conversion.any.js
 */

import './wpt-setup'
import { expect, test } from 'vitest'
import { openDB } from '../../lib/idb-adapter'
import { createMigrations } from '../../lib/migration-builder'
import { schema } from '../../lib/schema'

const sample = [0x44, 0x33, 0x22, 0x11, 0xff, 0xee, 0xdd, 0xcc]
const buffer = new Uint8Array(sample).buffer

function assertBufferEquals(a: ArrayBuffer, b: ArrayBuffer) {
  expect(Array.from(new Uint8Array(a))).toEqual(Array.from(new Uint8Array(b)))
}

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idb_binary_key_conversion.any.js#L8-L15
 */
test('Empty ArrayBuffer', () => {
  const binary = new ArrayBuffer(0)
  const key = IDBKeyRange.lowerBound(binary).lower

  expect(key instanceof ArrayBuffer).toBe(true)
  expect((key as ArrayBuffer).byteLength).toBe(0)
  expect((key as ArrayBuffer).byteLength).toBe(binary.byteLength)
})

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idb_binary_key_conversion.any.js#L17-L27
 */
test('ArrayBuffer', () => {
  const binary = new ArrayBuffer(4)
  const dataView = new DataView(binary)
  dataView.setUint32(0, 1234567890)

  const key = IDBKeyRange.lowerBound(binary).lower

  expect(key instanceof ArrayBuffer).toBe(true)
  expect((key as ArrayBuffer).byteLength).toBe(4)
  expect(dataView.getUint32(0)).toBe(new DataView(key as ArrayBuffer).getUint32(0))
})

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idb_binary_key_conversion.any.js#L29-L39
 */
test('DataView', () => {
  const binary = new ArrayBuffer(4)
  const dataView = new DataView(binary)
  dataView.setUint32(0, 1234567890)

  const key = IDBKeyRange.lowerBound(dataView).lower

  expect(key instanceof ArrayBuffer).toBe(true)
  expect((key as ArrayBuffer).byteLength).toBe(4)
  expect(dataView.getUint32(0)).toBe(new DataView(key as ArrayBuffer).getUint32(0))
})

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idb_binary_key_conversion.any.js#L41-L55
 */
test('TypedArray (Int8Array)', () => {
  const binary = new ArrayBuffer(4)
  const int8Array = new Int8Array(binary)
  int8Array.set([16, -32, 64, -128])

  const key = IDBKeyRange.lowerBound(int8Array).lower
  const keyInInt8Array = new Int8Array(key as ArrayBuffer)

  expect(key instanceof ArrayBuffer).toBe(true)
  expect((key as ArrayBuffer).byteLength).toBe(4)
  for (let i = 0; i < int8Array.length; i++) {
    expect(keyInInt8Array[i]).toBe(int8Array[i])
  }
})

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idb_binary_key_conversion.any.js#L57-L74
 */
test('Array of TypedArray (Int8Array)', () => {
  const binary = new ArrayBuffer(4)
  const int8Array = new Int8Array(binary)
  int8Array.set([16, -32, 64, -128])

  const key = IDBKeyRange.lowerBound([int8Array]).lower

  expect(key instanceof Array).toBe(true)
  expect((key as ArrayBuffer[])[0] instanceof ArrayBuffer).toBe(true)
  expect(((key as ArrayBuffer[])[0] as ArrayBuffer).byteLength).toBe(4)

  const keyInInt8Array = new Int8Array((key as ArrayBuffer[])[0])
  for (let i = 0; i < int8Array.length; i++) {
    expect(keyInInt8Array[i]).toBe(int8Array[i])
  }
})

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idb-binary-key-roundtrip.any.js#L60-L77
 */
test('Binary keys can be supplied using ArrayBuffer', async () => {
  const migrations = createMigrations().version(1, v =>
    v.createObjectStore({
      name: 'store',
      schema: schema<string>(),
    })
  )

  const db = await openDB('test-db', migrations)

  try {
    const key = buffer
    expect(indexedDB.cmp(key, key)).toBe(0)

    // Put with key
    await db.add('store', 'value', key)

    // Get with key
    const result = await db.get('store', key)
    expect(result).toBe('value')

    // Verify key via cursor
    const tx = db.transaction('store', 'readonly')
    const store = tx.objectStore('store')
    const cursor = await store.openCursor()

    expect(cursor).not.toBeNull()
    const retrievedKey = cursor!.key
    expect(retrievedKey instanceof ArrayBuffer).toBe(true)
    expect(indexedDB.cmp(retrievedKey, key)).toBe(0)
    assertBufferEquals(retrievedKey as ArrayBuffer, buffer)

    await tx.done
  } finally {
    db.close()
  }
})

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idb-binary-key-roundtrip.any.js#L79-L82
 */
test('Binary keys can be supplied using Uint8Array', async () => {
  const migrations = createMigrations().version(1, v =>
    v.createObjectStore({
      name: 'store',
      schema: schema<string>(),
    })
  )

  const db = await openDB('test-db', migrations)

  try {
    const key = new Uint8Array(buffer)
    expect(indexedDB.cmp(key, key)).toBe(0)
    expect(indexedDB.cmp(key, buffer)).toBe(0)

    await db.add('store', 'value', key)
    const result = await db.get('store', key)
    expect(result).toBe('value')

    const tx = db.transaction('store', 'readonly')
    const store = tx.objectStore('store')
    const cursor = await store.openCursor()

    expect(cursor).not.toBeNull()
    const retrievedKey = cursor!.key
    expect(retrievedKey instanceof ArrayBuffer).toBe(true)
    assertBufferEquals(retrievedKey as ArrayBuffer, buffer)

    await tx.done
  } finally {
    db.close()
  }
})

/**
 * Test binary keys with DataView
 */
test('Binary keys can be supplied using DataView', async () => {
  const migrations = createMigrations().version(1, v =>
    v.createObjectStore({
      name: 'store',
      schema: schema<string>(),
    })
  )

  const db = await openDB('test-db', migrations)

  try {
    const key = new DataView(buffer)
    expect(indexedDB.cmp(key, key)).toBe(0)

    await db.add('store', 'value', key)
    const result = await db.get('store', key)
    expect(result).toBe('value')

    await db.close()
  } finally {
    db.close()
  }
})

/**
 * Test Uint8Array with offset
 */
test('Uint8Array with explicit offset', async () => {
  const migrations = createMigrations().version(1, v =>
    v.createObjectStore({
      name: 'store',
      schema: schema<string>(),
    })
  )

  const db = await openDB('test-db', migrations)

  try {
    const key = new Uint8Array(buffer, 3)
    expect(indexedDB.cmp(key, key)).toBe(0)

    await db.add('store', 'value', key)
    const result = await db.get('store', key)
    expect(result).toBe('value')

    const tx = db.transaction('store', 'readonly')
    const store = tx.objectStore('store')
    const cursor = await store.openCursor()

    expect(cursor).not.toBeNull()
    const retrievedKey = cursor!.key
    expect(retrievedKey instanceof ArrayBuffer).toBe(true)
    assertBufferEquals(retrievedKey as ArrayBuffer, new Uint8Array([0x11, 0xff, 0xee, 0xdd, 0xcc]).buffer)

    await tx.done
  } finally {
    db.close()
  }
})

/**
 * Test Uint8Array with offset and length
 */
test('Uint8Array with explicit offset and length', async () => {
  const migrations = createMigrations().version(1, v =>
    v.createObjectStore({
      name: 'store',
      schema: schema<string>(),
    })
  )

  const db = await openDB('test-db', migrations)

  try {
    const key = new Uint8Array(buffer, 3, 4)
    expect(indexedDB.cmp(key, key)).toBe(0)

    await db.add('store', 'value', key)
    const result = await db.get('store', key)
    expect(result).toBe('value')

    const tx = db.transaction('store', 'readonly')
    const store = tx.objectStore('store')
    const cursor = await store.openCursor()

    expect(cursor).not.toBeNull()
    const retrievedKey = cursor!.key
    expect(retrievedKey instanceof ArrayBuffer).toBe(true)
    assertBufferEquals(retrievedKey as ArrayBuffer, new Uint8Array([0x11, 0xff, 0xee, 0xdd]).buffer)

    await tx.done
  } finally {
    db.close()
  }
})

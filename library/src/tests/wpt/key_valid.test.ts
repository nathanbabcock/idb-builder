/**
 * Valid Key Tests
 *
 * Ported from WPT key_valid.any.js
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/key_valid.any.js
 */

import './wpt-setup'
import { expect, test } from 'vitest'
import { openDB } from '../../lib/idb-adapter'
import { createMigrations } from '../../lib/migration-builder'
import { schema } from '../../lib/schema'

/**
 * Helper to test valid keys
 */
async function validKeyTest(_desc: string, key: IDBValidKey) {
  const migrations = createMigrations().version(1, v =>
    v.createObjectStore({
      name: 'store',
      schema: schema<string>(),
    })
  )

  const db = await openDB('test-db', migrations)

  try {
    // Add with the key
    const txn1 = db.transaction('store', 'readwrite')
    await txn1.objectStore('store').add('value', key)
    await txn1.done

    // Get with the key
    const txn2 = db.transaction('store', 'readonly')
    const result = await txn2.objectStore('store').get(key)
    await txn2.done

    expect(result).toBe('value')
  } finally {
    db.close()
  }
}

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/key_valid.any.js#L44-L45
 */
test('Valid key - new Date()', async () => {
  await validKeyTest('new Date()', new Date())
})

test('Valid key - new Date(0)', async () => {
  await validKeyTest('new Date(0)', new Date(0))
})

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/key_valid.any.js#L47-L50
 */
test('Valid key - []', async () => {
  await validKeyTest('[]', [])
})

test('Valid key - new Array()', async () => {
  await validKeyTest('new Array()', new Array())
})

test('Valid key - ["undefined"]', async () => {
  await validKeyTest('["undefined"]', ['undefined'])
})

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/key_valid.any.js#L53-L58
 */
test('Valid key - Infinity', async () => {
  await validKeyTest('Infinity', Infinity)
})

test('Valid key - -Infinity', async () => {
  await validKeyTest('-Infinity', -Infinity)
})

test('Valid key - 0', async () => {
  await validKeyTest('0', 0)
})

test('Valid key - 1.5', async () => {
  await validKeyTest('1.5', 1.5)
})

test('Valid key - 3e38', async () => {
  await validKeyTest('3e38', 3e38)
})

test('Valid key - 3e-38', async () => {
  await validKeyTest('3e-38', 3e-38)
})

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/key_valid.any.js#L61-L68
 */
test('Valid key - "foo"', async () => {
  await validKeyTest('"foo"', 'foo')
})

test('Valid key - "\\n"', async () => {
  await validKeyTest('"\\n"', '\n')
})

test('Valid key - ""', async () => {
  await validKeyTest('""', '')
})

test('Valid key - "\\""', async () => {
  await validKeyTest('"\\""', '"')
})

test('Valid key - "\\u1234"', async () => {
  await validKeyTest('"\\u1234"', '\u1234')
})

test('Valid key - "\\u0000"', async () => {
  await validKeyTest('"\\u0000"', '\u0000')
})

test('Valid key - "NaN"', async () => {
  await validKeyTest('"NaN"', 'NaN')
})

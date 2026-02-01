/**
 * Invalid Key Tests
 *
 * Ported from WPT key_invalid.any.js
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/key_invalid.any.js
 */

import './wpt-setup'
import { expect, test } from 'vitest'
import { openDB } from '../../lib/idb-adapter'
import { createMigrations } from '../../lib/migration-builder'
import { schema } from '../../lib/schema'

/**
 * Helper to test invalid keys
 * Note: Invalid keys throw synchronously in IndexedDB as DataError
 */
async function invalidKeyTest(_desc: string, key: unknown) {
  const migrations = createMigrations().version(1, v =>
    v.createObjectStore({
      name: 'store',
      schema: schema<string>(),
    })
  )

  const db = await openDB('test-db', migrations)

  try {
    const txn = db.transaction('store', 'readwrite')
    // Invalid keys throw synchronously as DataError
    expect(
      () => void txn.objectStore('store').add('value', key as IDBValidKey)
    ).toThrow()
    // Clean up the transaction
    txn.abort()
    await txn.done.catch(() => {})
  } finally {
    db.close()
  }
}

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/key_invalid.any.js#L52-L54
 */
test('Invalid key - true', async () => {
  await invalidKeyTest('true', true)
})

test('Invalid key - false', async () => {
  await invalidKeyTest('false', false)
})

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/key_invalid.any.js#L56-L59
 */
test('Invalid key - null', async () => {
  await invalidKeyTest('null', null)
})

test('Invalid key - NaN', async () => {
  await invalidKeyTest('NaN', NaN)
})

test('Invalid key - undefined', async () => {
  await invalidKeyTest('undefined', undefined)
})

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/key_invalid.any.js#L62-L63
 */
test('Invalid key - function() {}', async () => {
  await invalidKeyTest('function() {}', function () {})
})

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/key_invalid.any.js#L65-L76
 */
test('Invalid key - {}', async () => {
  await invalidKeyTest('{}', {})
})

test('Invalid key - { obj: 1 }', async () => {
  await invalidKeyTest('{ obj: 1 }', { obj: 1 })
})

test('Invalid key - Math', async () => {
  await invalidKeyTest('Math', Math)
})

test('Invalid key - {length:0,constructor:Array}', async () => {
  const fakeArray = {
    length: 0,
    constructor: Array,
  }
  await invalidKeyTest('{length:0,constructor:Array}', fakeArray)
})

test('Invalid key - new String()', async () => {
  await invalidKeyTest('new String()', new String())
})

test('Invalid key - new Number()', async () => {
  await invalidKeyTest('new Number()', new Number())
})

test('Invalid key - new Boolean()', async () => {
  await invalidKeyTest('new Boolean()', new Boolean())
})

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/key_invalid.any.js#L78-L82
 */
test('Invalid key - [{}]', async () => {
  await invalidKeyTest('[{}]', [{}])
})

test('Invalid key - [undefined]', async () => {
  await invalidKeyTest('[undefined]', [undefined])
})

test('Invalid key - [,1]', async () => {
  // eslint-disable-next-line no-sparse-arrays
  await invalidKeyTest('[,1]', [, 1])
})

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/key_invalid.any.js#L90-L91
 */
test('Invalid key - new Date(NaN)', async () => {
  await invalidKeyTest('new Date(NaN)', new Date(NaN))
})

test('Invalid key - new Date(Infinity)', async () => {
  await invalidKeyTest('new Date(Infinity)', new Date(Infinity))
})

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/key_invalid.any.js#L94-L95
 */
test('Invalid key - /foo/', async () => {
  await invalidKeyTest('/foo/', /foo/)
})

test('Invalid key - new RegExp()', async () => {
  await invalidKeyTest('new RegExp()', new RegExp(''))
})

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/key_invalid.any.js#L98-L100
 */
test('Invalid key - sparse array', async () => {
  const sparse: unknown[] = []
  sparse[10] = 'hei'
  await invalidKeyTest('sparse array', sparse)
})

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/key_invalid.any.js#L123-L125
 */
test('Invalid key - array directly contains self', async () => {
  const recursive: unknown[] = []
  recursive.push(recursive)
  await invalidKeyTest('array directly contains self', recursive)
})

test('Invalid key - array indirectly contains self', async () => {
  const recursive2: unknown[] = []
  recursive2.push([recursive2])
  await invalidKeyTest('array indirectly contains self', recursive2)
})

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/key_invalid.any.js#L134
 *
 * Skipped: fake-indexeddb doesn't detect proxy of array as invalid key
 */
test.skip('Invalid key - proxy of an array', async () => {
  await invalidKeyTest('proxy of an array', new Proxy([1, 2, 3], {}))
})

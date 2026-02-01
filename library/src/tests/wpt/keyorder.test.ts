/**
 * Key Sort Order Tests
 *
 * Ported from WPT keyorder.any.js
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/keyorder.any.js
 */

import './wpt-setup'
import { expect, test } from 'vitest'
import { openDB } from '../../lib/idb-adapter'
import { createMigrations } from '../../lib/migration-builder'
import { schema } from '../../lib/schema'

type IDBValidKey = number | string | Date | ArrayBuffer | IDBValidKey[]

/**
 * Helper to run key sort order tests
 * Tests both database readback order and IDBKeyRange.cmp sorting
 */
async function keysortTest(
  desc: string,
  unsorted: IDBValidKey[],
  expected: IDBValidKey[]
) {
  // Database readback sort test
  test(`Database readback sort - ${desc}`, async () => {
    const migrations = createMigrations().version(1, v =>
      v.createObjectStore({
        name: 'store',
        schema: schema<string>(),
      })
    )

    const db = await openDB('test-db', migrations)

    try {
      // Add all unsorted keys
      for (const key of unsorted) {
        await db.add('store', 'value', key)
      }

      // Read back via cursor (should be sorted)
      const tx = db.transaction('store', 'readonly')
      const store = tx.objectStore('store')

      const actualKeys: IDBValidKey[] = []
      let cursor = await store.openCursor()
      while (cursor) {
        actualKeys.push(cursor.key as IDBValidKey)
        cursor = await cursor.continue()
      }

      await tx.done

      // Compare the key arrays
      expect(actualKeys.length).toBe(expected.length)
      for (let i = 0; i < expected.length; i++) {
        expect(indexedDB.cmp(actualKeys[i], expected[i])).toBe(0)
      }
    } finally {
      db.close()
    }
  })

  // IDBKey.cmp sort test
  test(`IDBKey.cmp sort - ${desc}`, () => {
    const sorted = unsorted.slice(0).sort((a, b) => indexedDB.cmp(a, b))

    expect(sorted.length).toBe(expected.length)
    for (let i = 0; i < expected.length; i++) {
      expect(indexedDB.cmp(sorted[i], expected[i])).toBe(0)
    }
  })
}

const now = new Date()
const one_sec_ago = new Date(now.getTime() - 1000)
const one_min_future = new Date(now.getTime() + 1000 * 60)

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/keyorder.any.js#L58
 */
keysortTest('String < Array', [[0], 'yo', '', []], ['', 'yo', [], [0]])

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/keyorder.any.js#L60-L62
 */
keysortTest(
  'float < String',
  [Infinity, 'yo', 0, '', 100],
  [0, 100, Infinity, '', 'yo']
)

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/keyorder.any.js#L64-L66
 */
keysortTest('float < Date', [now, 0, 9999999999999, -0.22], [-0.22, 0, 9999999999999, now])

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/keyorder.any.js#L68-L70
 */
keysortTest(
  'float < Date < String < Array',
  [[], '', now, [0], '-1', 0, 9999999999999],
  [0, 9999999999999, now, '', '-1', [], [0]]
)

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/keyorder.any.js#L72-L74
 */
keysortTest(
  'Date(1 sec ago) < Date(now) < Date(1 minute in future)',
  [now, one_sec_ago, one_min_future],
  [one_sec_ago, now, one_min_future]
)

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/keyorder.any.js#L76-L78
 */
keysortTest(
  '-1.1 < 1 < 1.01337 < 1.013373 < 2',
  [1.013373, 2, 1.01337, -1.1, 1],
  [-1.1, 1, 1.01337, 1.013373, 2]
)

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/keyorder.any.js#L80-L82
 */
keysortTest(
  '-Infinity < -0.01 < 0 < Infinity',
  [0, -0.01, -Infinity, Infinity],
  [-Infinity, -0.01, 0, Infinity]
)

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/keyorder.any.js#L84-L86
 */
keysortTest('"" < "a" < "ab" < "b" < "ba"', ['a', 'ba', '', 'b', 'ab'], ['', 'a', 'ab', 'b', 'ba'])

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/keyorder.any.js#L88-L90
 */
keysortTest('Arrays', [[[0]], [0], [], [0, 0], [0, [0]]], [[], [0], [0, 0], [0, [0]], [[0]]])

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/keyorder.any.js#L92-L103
 */
const big_array: number[] = []
const bigger_array: number[] = []
for (let i = 0; i < 10000; i++) {
  big_array.push(i)
  bigger_array.push(i)
}
bigger_array.push(0)

keysortTest(
  'Array.length: 10,000 < Array.length: 10,001',
  [bigger_array, [0, 2, 3], [0], [9], big_array],
  [[0], big_array, bigger_array, [0, 2, 3], [9]]
)

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/keyorder.any.js#L105-L122
 */
keysortTest(
  'Infinity inside arrays',
  [
    [Infinity, 1],
    [Infinity, Infinity],
    [1, 1],
    [1, Infinity],
    [1, -Infinity],
    [-Infinity, Infinity],
  ],
  [
    [-Infinity, Infinity],
    [1, -Infinity],
    [1, 1],
    [1, Infinity],
    [Infinity, 1],
    [Infinity, Infinity],
  ]
)

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/keyorder.any.js#L124-L169
 */
keysortTest(
  'Test different stuff at once',
  [
    now,
    [0, []],
    'test',
    1,
    ['a', [1, [-1]]],
    ['b', 'a'],
    [0, 2, 'c'],
    ['a', [1, 2]],
    [],
    [0, [], 3],
    ['a', 'b'],
    [1, 2],
    ['a', 'b', 'c'],
    one_sec_ago,
    [0, 'b', 'c'],
    Infinity,
    -Infinity,
    2.55,
    [0, now],
    [1],
  ],
  [
    -Infinity,
    1,
    2.55,
    Infinity,
    one_sec_ago,
    now,
    'test',
    [],
    [0, 2, 'c'],
    [0, now],
    [0, 'b', 'c'],
    [0, []],
    [0, [], 3],
    [1],
    [1, 2],
    ['a', 'b'],
    ['a', 'b', 'c'],
    ['a', [1, 2]],
    ['a', [1, [-1]]],
    ['b', 'a'],
  ]
)

/**
 * ObjectStoreNames and indexNames ordering Tests
 *
 * Ported from WPT list_ordering.any.js
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/list_ordering.any.js
 */

import './wpt-setup'
import { expect, test } from 'vitest'

/**
 * Helper function to test list ordering
 * Uses raw IDB API since this tests the ordering of objectStoreNames and indexNames
 */
async function listOrderTest(
  desc: string,
  unsorted: (string | number)[],
  expected: string[]
) {
  return new Promise<void>((resolve, reject) => {
    const dbName = `test-list-order-${desc}`
    const request = indexedDB.open(dbName, 1)

    request.onerror = () => reject(request.error)

    request.onupgradeneeded = e => {
      const db = (e.target as IDBOpenDBRequest).result
      let objStore: IDBObjectStore | null = null

      // Create object stores in unsorted order
      for (const name of unsorted) {
        objStore = db.createObjectStore(String(name))
      }

      // Verify objectStoreNames are sorted
      expect(db.objectStoreNames.length).toBe(expected.length)
      for (let i = 0; i < expected.length; i++) {
        expect(db.objectStoreNames[i]).toBe(expected[i])
      }

      // Create indexes on the last store in unsorted order
      if (objStore) {
        for (const name of unsorted) {
          objStore.createIndex(String(name), 'length')
        }

        // Verify indexNames are sorted
        expect(objStore.indexNames.length).toBe(expected.length)
        for (let i = 0; i < expected.length; i++) {
          expect(objStore.indexNames[i]).toBe(expected[i])
        }
      }
    }

    request.onsuccess = e => {
      const db = (e.target as IDBOpenDBRequest).result

      // Verify objectStoreNames after upgrade
      expect(db.objectStoreNames.length).toBe(expected.length)
      for (let i = 0; i < expected.length; i++) {
        expect(db.objectStoreNames[i]).toBe(expected[i])
      }

      db.close()
      resolve()
    }
  })
}

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/list_ordering.any.js#L53-L57
 */
test('Validate list order - numbers', async () => {
  await listOrderTest(
    'numbers',
    [123456, -12345, -123, 123, 1234, -1234, 0, 12345, -123456],
    [
      '-123',
      '-1234',
      '-12345',
      '-123456',
      '0',
      '123',
      '1234',
      '12345',
      '123456',
    ]
  )
})

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/list_ordering.any.js#L59-L61
 */
test("Validate list order - numbers 'overflow'", async () => {
  await listOrderTest(
    'numbers-overflow',
    [9, 1, 1000000000, 200000000000000000],
    ['1', '1000000000', '200000000000000000', '9']
  )
})

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/list_ordering.any.js#L63-L66
 */
test('Validate list order - lexigraphical string sort', async () => {
  await listOrderTest(
    'lexigraphical',
    ['cc', 'c', 'aa', 'a', 'bb', 'b', 'ab', '', 'ac'],
    ['', 'a', 'aa', 'ab', 'ac', 'b', 'bb', 'c', 'cc']
  )
})

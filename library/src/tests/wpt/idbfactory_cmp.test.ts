/**
 * IDBFactory.cmp() Tests
 *
 * Ported from WPT idbfactory_cmp.any.js
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbfactory_cmp.any.js
 */

import './wpt-setup'
import { expect, test } from 'vitest'

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbfactory_cmp.any.js#L12-L20
 */
test('IDBFactory.cmp() - compared keys return correct value', () => {
  const greater = indexedDB.cmp(2, 1)
  const equal = indexedDB.cmp(2, 2)
  const less = indexedDB.cmp(1, 2)

  expect(greater).toBe(1)
  expect(equal).toBe(0)
  expect(less).toBe(-1)
})

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbfactory_cmp.any.js#L30-L40
 */
test('IDBFactory.cmp() - null', () => {
  expect(() => {
    indexedDB.cmp(null as unknown as IDBValidKey, null as unknown as IDBValidKey)
  }).toThrow(expect.objectContaining({ name: 'DataError' }))

  expect(() => {
    indexedDB.cmp(1, null as unknown as IDBValidKey)
  }).toThrow(expect.objectContaining({ name: 'DataError' }))

  expect(() => {
    indexedDB.cmp(null as unknown as IDBValidKey, 1)
  }).toThrow(expect.objectContaining({ name: 'DataError' }))
})

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbfactory_cmp.any.js#L42-L52
 */
test('IDBFactory.cmp() - NaN', () => {
  expect(() => {
    indexedDB.cmp(NaN, NaN)
  }).toThrow(expect.objectContaining({ name: 'DataError' }))

  expect(() => {
    indexedDB.cmp(1, NaN)
  }).toThrow(expect.objectContaining({ name: 'DataError' }))

  expect(() => {
    indexedDB.cmp(NaN, 1)
  }).toThrow(expect.objectContaining({ name: 'DataError' }))
})

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbfactory_cmp.any.js#L56-L58
 */
test('Array vs. Binary', () => {
  expect(indexedDB.cmp([0], new Uint8Array([0]))).toBe(1)
})

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbfactory_cmp.any.js#L60-L62
 */
test('Binary vs. String', () => {
  expect(indexedDB.cmp(new Uint8Array([0]), '0')).toBe(1)
})

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbfactory_cmp.any.js#L64-L66
 */
test('String vs. Date', () => {
  expect(indexedDB.cmp('', new Date(0))).toBe(1)
})

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbfactory_cmp.any.js#L68-L70
 */
test('Date vs. Number', () => {
  expect(indexedDB.cmp(new Date(0), 0)).toBe(1)
})

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbfactory_cmp.any.js#L74-L78
 */
test('Compare in unsigned octet values (in the range [0, 255])', () => {
  // -1 as Int8 is 255 as Uint8
  expect(indexedDB.cmp(new Int8Array([-1]), new Uint8Array([0]))).toBe(1)
})

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbfactory_cmp.any.js#L80-L86
 */
test('Compare values of the same length', () => {
  expect(
    indexedDB.cmp(new Uint8Array([255, 254, 253]), new Uint8Array([255, 253, 254]))
  ).toBe(1)
})

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbfactory_cmp.any.js#L88-L92
 */
test('Compare values of different lengths', () => {
  expect(indexedDB.cmp(new Uint8Array([255, 254]), new Uint8Array([255, 253, 254]))).toBe(
    1
  )
})

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbfactory_cmp.any.js#L94-L99
 */
test('Compare when values in the range of their minimal length are the same', () => {
  expect(indexedDB.cmp(new Uint8Array([255, 253, 254]), new Uint8Array([255, 253]))).toBe(
    1
  )
})

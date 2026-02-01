/**
 * IDBKeyRange Tests
 *
 * Ported from WPT idbkeyrange.any.js
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbkeyrange.any.js
 */

import './wpt-setup'
import { expect, test } from 'vitest'

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbkeyrange.any.js#L7-L15
 */
test('IDBKeyRange.only() - returns an IDBKeyRange and the properties are set correctly', () => {
  const keyRange = IDBKeyRange.only(1)
  expect(keyRange).toBeInstanceOf(IDBKeyRange)
  expect(keyRange.lower).toBe(1)
  expect(keyRange.upper).toBe(1)
  expect(keyRange.lowerOpen).toBe(false)
  expect(keyRange.upperOpen).toBe(false)
})

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbkeyrange.any.js#L17-L36
 */
test('IDBKeyRange.only() - throws on invalid keys', () => {
  expect(() => {
    IDBKeyRange.only(undefined as unknown as IDBValidKey)
  }).toThrow(expect.objectContaining({ name: 'DataError' }))

  expect(() => {
    IDBKeyRange.only(null as unknown as IDBValidKey)
  }).toThrow(expect.objectContaining({ name: 'DataError' }))

  expect(() => {
    IDBKeyRange.only({} as unknown as IDBValidKey)
  }).toThrow(expect.objectContaining({ name: 'DataError' }))

  expect(() => {
    IDBKeyRange.only(Symbol() as unknown as IDBValidKey)
  }).toThrow(expect.objectContaining({ name: 'DataError' }))

  expect(() => {
    IDBKeyRange.only(true as unknown as IDBValidKey)
  }).toThrow(expect.objectContaining({ name: 'DataError' }))

  expect(() => {
    IDBKeyRange.only((() => {}) as unknown as IDBValidKey)
  }).toThrow(expect.objectContaining({ name: 'DataError' }))
})

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbkeyrange.any.js#L38-L46
 */
test('IDBKeyRange.lowerBound() - returns an IDBKeyRange and the properties are set correctly', () => {
  const keyRange = IDBKeyRange.lowerBound(1, true)
  expect(keyRange).toBeInstanceOf(IDBKeyRange)
  expect(keyRange.lower).toBe(1)
  expect(keyRange.upper).toBe(undefined)
  expect(keyRange.lowerOpen).toBe(true)
  expect(keyRange.upperOpen).toBe(true)
})

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbkeyrange.any.js#L48-L51
 */
test("IDBKeyRange.lowerBound() - 'open' parameter has correct default set", () => {
  const keyRange = IDBKeyRange.lowerBound(1)
  expect(keyRange.lowerOpen).toBe(false)
})

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbkeyrange.any.js#L53-L72
 */
test('IDBKeyRange.lowerBound() - throws on invalid keys', () => {
  expect(() => {
    IDBKeyRange.lowerBound(undefined as unknown as IDBValidKey)
  }).toThrow(expect.objectContaining({ name: 'DataError' }))

  expect(() => {
    IDBKeyRange.lowerBound(null as unknown as IDBValidKey)
  }).toThrow(expect.objectContaining({ name: 'DataError' }))

  expect(() => {
    IDBKeyRange.lowerBound({} as unknown as IDBValidKey)
  }).toThrow(expect.objectContaining({ name: 'DataError' }))

  expect(() => {
    IDBKeyRange.lowerBound(Symbol() as unknown as IDBValidKey)
  }).toThrow(expect.objectContaining({ name: 'DataError' }))

  expect(() => {
    IDBKeyRange.lowerBound(true as unknown as IDBValidKey)
  }).toThrow(expect.objectContaining({ name: 'DataError' }))

  expect(() => {
    IDBKeyRange.lowerBound((() => {}) as unknown as IDBValidKey)
  }).toThrow(expect.objectContaining({ name: 'DataError' }))
})

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbkeyrange.any.js#L74-L82
 */
test('IDBKeyRange.upperBound() - returns an IDBKeyRange and the properties are set correctly', () => {
  const keyRange = IDBKeyRange.upperBound(1, true)
  expect(keyRange).toBeInstanceOf(IDBKeyRange)
  expect(keyRange.lower).toBe(undefined)
  expect(keyRange.upper).toBe(1)
  expect(keyRange.lowerOpen).toBe(true)
  expect(keyRange.upperOpen).toBe(true)
})

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbkeyrange.any.js#L84-L87
 */
test("IDBKeyRange.upperBound() - 'open' parameter has correct default set", () => {
  const keyRange = IDBKeyRange.upperBound(1)
  expect(keyRange.upperOpen).toBe(false)
})

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbkeyrange.any.js#L89-L108
 */
test('IDBKeyRange.upperBound() - throws on invalid keys', () => {
  expect(() => {
    IDBKeyRange.upperBound(undefined as unknown as IDBValidKey)
  }).toThrow(expect.objectContaining({ name: 'DataError' }))

  expect(() => {
    IDBKeyRange.upperBound(null as unknown as IDBValidKey)
  }).toThrow(expect.objectContaining({ name: 'DataError' }))

  expect(() => {
    IDBKeyRange.upperBound({} as unknown as IDBValidKey)
  }).toThrow(expect.objectContaining({ name: 'DataError' }))

  expect(() => {
    IDBKeyRange.upperBound(Symbol() as unknown as IDBValidKey)
  }).toThrow(expect.objectContaining({ name: 'DataError' }))

  expect(() => {
    IDBKeyRange.upperBound(true as unknown as IDBValidKey)
  }).toThrow(expect.objectContaining({ name: 'DataError' }))

  expect(() => {
    IDBKeyRange.upperBound((() => {}) as unknown as IDBValidKey)
  }).toThrow(expect.objectContaining({ name: 'DataError' }))
})

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbkeyrange.any.js#L110-L118
 */
test('IDBKeyRange.bound() - returns an IDBKeyRange and the properties are set correctly', () => {
  const keyRange = IDBKeyRange.bound(1, 2, true, true)
  expect(keyRange).toBeInstanceOf(IDBKeyRange)
  expect(keyRange.lower).toBe(1)
  expect(keyRange.upper).toBe(2)
  expect(keyRange.lowerOpen).toBe(true)
  expect(keyRange.upperOpen).toBe(true)
})

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbkeyrange.any.js#L120-L124
 */
test("IDBKeyRange.bound() - 'lowerOpen' and 'upperOpen' parameters have correct defaults set", () => {
  const keyRange = IDBKeyRange.bound(1, 2)
  expect(keyRange.lowerOpen).toBe(false)
  expect(keyRange.upperOpen).toBe(false)
})

/**
 * Test IDBKeyRange.includes()
 */
test('IDBKeyRange.includes() - checks if a key is within the range', () => {
  const keyRange = IDBKeyRange.bound(1, 10)

  expect(keyRange.includes(1)).toBe(true)
  expect(keyRange.includes(5)).toBe(true)
  expect(keyRange.includes(10)).toBe(true)
  expect(keyRange.includes(0)).toBe(false)
  expect(keyRange.includes(11)).toBe(false)
})

/**
 * Test IDBKeyRange.includes() with open bounds
 */
test('IDBKeyRange.includes() - respects open bounds', () => {
  const keyRange = IDBKeyRange.bound(1, 10, true, true)

  expect(keyRange.includes(1)).toBe(false) // lower is open
  expect(keyRange.includes(5)).toBe(true)
  expect(keyRange.includes(10)).toBe(false) // upper is open
})

/**
 * Test IDBKeyRange with string keys
 */
test('IDBKeyRange works with string keys', () => {
  const keyRange = IDBKeyRange.bound('a', 'z')

  expect(keyRange.lower).toBe('a')
  expect(keyRange.upper).toBe('z')
  expect(keyRange.includes('m')).toBe(true)
  expect(keyRange.includes('A')).toBe(false) // 'A' < 'a' in string comparison
})

/**
 * Test IDBKeyRange with Date keys
 */
test('IDBKeyRange works with Date keys', () => {
  const date1 = new Date('2020-01-01')
  const date2 = new Date('2020-12-31')
  const dateMiddle = new Date('2020-06-15')

  const keyRange = IDBKeyRange.bound(date1, date2)

  expect(keyRange.lower).toEqual(date1)
  expect(keyRange.upper).toEqual(date2)
  expect(keyRange.includes(dateMiddle)).toBe(true)
})

/**
 * Test IDBKeyRange with array keys
 */
test('IDBKeyRange works with array keys', () => {
  const keyRange = IDBKeyRange.only([1, 2, 3])

  expect(keyRange.lower).toEqual([1, 2, 3])
  expect(keyRange.upper).toEqual([1, 2, 3])
})

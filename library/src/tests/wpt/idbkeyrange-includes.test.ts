/**
 * IDBKeyRange.includes() Tests
 *
 * Ported from WPT idbkeyrange-includes.any.js
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbkeyrange-includes.any.js
 */

import './wpt-setup'
import { expect, test } from 'vitest'

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbkeyrange-includes.any.js#L9-L35
 */
test('IDBKeyRange.includes() with invalid input', () => {
  const range = IDBKeyRange.bound(12, 34)

  // Note: In TypeScript we can't call includes() with no args, so we skip that test

  expect(() => {
    range.includes(undefined as unknown as IDBValidKey)
  }).toThrow()

  expect(() => {
    range.includes(null as unknown as IDBValidKey)
  }).toThrow()

  expect(() => {
    range.includes({} as unknown as IDBValidKey)
  }).toThrow()

  expect(() => {
    range.includes(NaN)
  }).toThrow()

  expect(() => {
    range.includes(new Date(NaN))
  }).toThrow()

  expect(() => {
    const a: unknown[] = []
    a[0] = a
    range.includes(a as unknown as IDBValidKey)
  }).toThrow()
})

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbkeyrange-includes.any.js#L37-L50
 */
test('IDBKeyRange.includes() with a closed range', () => {
  const closedRange = IDBKeyRange.bound(5, 20)
  expect(typeof closedRange.includes).toBe('function')
  expect(closedRange.includes(7)).toBe(true) // in range
  expect(closedRange.includes(1)).toBe(false) // below range
  expect(closedRange.includes(42)).toBe(false) // above range
  expect(closedRange.includes(5.01)).toBe(true) // at the lower end
  expect(closedRange.includes(19.99)).toBe(true) // at the upper end
  expect(closedRange.includes(4.99)).toBe(false) // right below range
  expect(closedRange.includes(21.01)).toBe(false) // right above range

  expect(closedRange.includes(5)).toBe(true) // lower boundary
  expect(closedRange.includes(20)).toBe(true) // upper boundary
})

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbkeyrange-includes.any.js#L52-L64
 */
test('IDBKeyRange.includes() with an open range', () => {
  const openRange = IDBKeyRange.bound(5, 20, true, true)
  expect(openRange.includes(7)).toBe(true) // in range
  expect(openRange.includes(1)).toBe(false) // below range
  expect(openRange.includes(42)).toBe(false) // above range
  expect(openRange.includes(5.01)).toBe(true) // at the lower end
  expect(openRange.includes(19.99)).toBe(true) // at the upper end
  expect(openRange.includes(4.99)).toBe(false) // right below range
  expect(openRange.includes(21.01)).toBe(false) // right above range

  expect(openRange.includes(5)).toBe(false) // lower boundary
  expect(openRange.includes(20)).toBe(false) // upper boundary
})

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbkeyrange-includes.any.js#L66-L78
 */
test('IDBKeyRange.includes() with a lower-open upper-closed range', () => {
  const range = IDBKeyRange.bound(5, 20, true)
  expect(range.includes(7)).toBe(true) // in range
  expect(range.includes(1)).toBe(false) // below range
  expect(range.includes(42)).toBe(false) // above range
  expect(range.includes(5.01)).toBe(true) // at the lower end
  expect(range.includes(19.99)).toBe(true) // at the upper end
  expect(range.includes(4.99)).toBe(false) // right below range
  expect(range.includes(21.01)).toBe(false) // right above range

  expect(range.includes(5)).toBe(false) // lower boundary
  expect(range.includes(20)).toBe(true) // upper boundary
})

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbkeyrange-includes.any.js#L80-L92
 */
test('IDBKeyRange.includes() with a lower-closed upper-open range', () => {
  const range = IDBKeyRange.bound(5, 20, false, true)
  expect(range.includes(7)).toBe(true) // in range
  expect(range.includes(1)).toBe(false) // below range
  expect(range.includes(42)).toBe(false) // above range
  expect(range.includes(5.01)).toBe(true) // at the lower end
  expect(range.includes(19.99)).toBe(true) // at the upper end
  expect(range.includes(4.99)).toBe(false) // right below range
  expect(range.includes(21.01)).toBe(false) // right above range

  expect(range.includes(5)).toBe(true) // lower boundary
  expect(range.includes(20)).toBe(false) // upper boundary
})

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbkeyrange-includes.any.js#L94-L101
 */
test('IDBKeyRange.includes() with an only range', () => {
  const onlyRange = IDBKeyRange.only(42)
  expect(onlyRange.includes(42)).toBe(true) // in range
  expect(onlyRange.includes(1)).toBe(false) // below range
  expect(onlyRange.includes(9000)).toBe(false) // above range
  expect(onlyRange.includes(41)).toBe(false) // right below range
  expect(onlyRange.includes(43)).toBe(false) // right above range
})

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbkeyrange-includes.any.js#L103-L109
 */
test('IDBKeyRange.includes() with a closed lower-bounded range', () => {
  const range = IDBKeyRange.lowerBound(5)
  expect(range.includes(4)).toBe(false) // value before closed lower bound
  expect(range.includes(5)).toBe(true) // value at closed lower bound
  expect(range.includes(6)).toBe(true) // value after closed lower bound
  expect(range.includes(42)).toBe(true) // value way after lower bound
})

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbkeyrange-includes.any.js#L111-L117
 */
test('IDBKeyRange.includes() with an open lower-bounded range', () => {
  const range = IDBKeyRange.lowerBound(5, true)
  expect(range.includes(4)).toBe(false) // value before open lower bound
  expect(range.includes(5)).toBe(false) // value at open lower bound
  expect(range.includes(6)).toBe(true) // value after open lower bound
  expect(range.includes(42)).toBe(true) // value way after open lower bound
})

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbkeyrange-includes.any.js#L119-L125
 */
test('IDBKeyRange.includes() with a closed upper-bounded range', () => {
  const range = IDBKeyRange.upperBound(5)
  expect(range.includes(-42)).toBe(true) // value way before closed upper bound
  expect(range.includes(4)).toBe(true) // value before closed upper bound
  expect(range.includes(5)).toBe(true) // value at closed upper bound
  expect(range.includes(6)).toBe(false) // value after closed upper bound
})

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbkeyrange-includes.any.js#L127-L133
 */
test('IDBKeyRange.includes() with an open upper-bounded range', () => {
  const range = IDBKeyRange.upperBound(5, true)
  expect(range.includes(-42)).toBe(true) // value way before upper bound
  expect(range.includes(4)).toBe(true) // value before open upper bound
  expect(range.includes(5)).toBe(false) // value at open upper bound
  expect(range.includes(6)).toBe(false) // value after open upper bound
})

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbkeyrange-includes.any.js#L135-L146
 */
test('IDBKeyRange.includes() with non-numeric keys', () => {
  expect(
    IDBKeyRange.bound(new Date(0), new Date()).includes(new Date(102729600000))
  ).toBe(true)
  expect(
    IDBKeyRange.bound(new Date(0), new Date(1e11)).includes(new Date(1e11 + 1))
  ).toBe(false)

  expect(IDBKeyRange.bound('a', 'c').includes('b')).toBe(true)
  expect(IDBKeyRange.bound('a', 'c').includes('d')).toBe(false)

  expect(IDBKeyRange.bound([], [[], []]).includes([[]])).toBe(true)
  expect(IDBKeyRange.bound([], [[]]).includes([[[]]])).toBe(false)
})

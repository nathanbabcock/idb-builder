/**
 * IDBKeyRange Tests - Incorrect
 *
 * Ported from WPT idbkeyrange_incorrect.any.js
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbkeyrange_incorrect.any.js
 */

import './wpt-setup'
import { expect, test } from 'vitest'

test('IDBKeyRange.bound() - bound requires more than 0 arguments', () => {
  expect(() => {
    // @ts-expect-error - testing invalid input
    IDBKeyRange.bound()
  }).toThrow(TypeError)
})

test('IDBKeyRange.bound(null, null) - null parameters are incorrect', () => {
  expect(() => {
    IDBKeyRange.bound(null, null)
  }).toThrow(expect.objectContaining({ name: 'DataError' }))
})

test('IDBKeyRange.bound(1, null / null, 1) - null parameter is incorrect', () => {
  expect(() => {
    IDBKeyRange.bound(1, null)
  }).toThrow(expect.objectContaining({ name: 'DataError' }))

  expect(() => {
    IDBKeyRange.bound(null, 1)
  }).toThrow(expect.objectContaining({ name: 'DataError' }))
})

test("IDBKeyRange.bound(lower, upper) - 'lower' is greater than 'upper'", () => {
  const lowerBad = Math.floor(Math.random() * 31) + 5
  const upper = lowerBad - 1

  expect(() => {
    IDBKeyRange.bound(lowerBad, upper)
  }).toThrow(expect.objectContaining({ name: 'DataError' }))

  expect(() => {
    IDBKeyRange.bound('b', 'a')
  }).toThrow(expect.objectContaining({ name: 'DataError' }))
})

test('IDBKeyRange.bound(DOMString/Date/Array, 1) - A DOMString, Date and Array are greater than a float', () => {
  expect(() => {
    IDBKeyRange.bound('a', 1)
  }).toThrow(expect.objectContaining({ name: 'DataError' }))

  expect(() => {
    IDBKeyRange.bound(new Date(), 1)
  }).toThrow(expect.objectContaining({ name: 'DataError' }))

  expect(() => {
    IDBKeyRange.bound([1, 2], 1)
  }).toThrow(expect.objectContaining({ name: 'DataError' }))
})

test('IDBKeyRange.bound(true, 1) - boolean is not a valid key type', () => {
  expect(() => {
    IDBKeyRange.bound(true as unknown as IDBValidKey, 1)
  }).toThrow(expect.objectContaining({ name: 'DataError' }))
})

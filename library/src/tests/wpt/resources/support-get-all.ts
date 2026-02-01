/**
 * WPT Get All Support Functions
 *
 * Ported from WPT resources/support-get-all.js
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/resources/support-get-all.js
 */

import { expect, test } from 'vitest'
import { openDB } from '../../../lib/idb-adapter'
import { createMigrations } from '../../../lib/migration-builder'
import { schema } from '../../../lib/schema'

// Define constants used to populate object stores and indexes.
export const alphabet = 'abcdefghijklmnopqrstuvwxyz'.split('')
export const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')

// Threshold for large values (matches WPT)
export const wrapThreshold = 32 * 1024

// Returns an Uint8Array with pseudo-random data
export function largeValue(size: number, seed: number): Uint8Array {
  const buffer = new Uint8Array(size)
  if (seed === 0) {
    buffer.fill(0x11, 0, size - 1)
    return buffer
  }

  // 32-bit xorshift - the seed can't be zero
  let state = 1000 + seed

  for (let i = 0; i < size; ++i) {
    state ^= state << 13
    state ^= state >> 17
    state ^= state << 5
    buffer[i] = state & 0xff
  }

  return buffer
}

export interface ExpectedRecord {
  key: IDBValidKey
  primaryKey: IDBValidKey
  value: unknown
}

export interface GetAllOptions {
  query?: IDBValidKey | IDBKeyRange
  count?: number
  direction?: IDBCursorDirection
}

type IndexStoreName =
  | 'generated'
  | 'out-of-line'
  | 'out-of-line-not-unique'
  | 'out-of-line-multi'
  | 'empty'
  | 'large-values'

// Type definitions for the different store schemas
interface GeneratedRecord {
  id: number
  ch: string
  upper: string
}

interface OutOfLineRecord {
  ch: string
  upper: string
}

interface NotUniqueRecord {
  ch: string
  half: string
}

interface MultiRecord {
  ch: string
  attribs: string[]
}

interface LargeValueRecord {
  seed: number
  randomValue: Uint8Array
}

/**
 * Filter records based on get all options.
 */
export function filterWithGetAllOptions(
  records: ExpectedRecord[],
  options?: GetAllOptions
): ExpectedRecord[] {
  if (!options) {
    return records
  }

  let filtered = [...records]

  // Remove records that don't satisfy the query
  if (options.query !== undefined) {
    let query = options.query
    if (!(query instanceof IDBKeyRange)) {
      query = IDBKeyRange.only(query)
    }
    filtered = filtered.filter(record => query.includes(record.key))
  }

  // Remove duplicate records for unique directions
  if (
    options.direction === 'nextunique' ||
    options.direction === 'prevunique'
  ) {
    const uniqueRecords: ExpectedRecord[] = []
    filtered.forEach(record => {
      if (
        !uniqueRecords.some(unique =>
          IDBKeyRange.only(unique.key).includes(record.key)
        )
      ) {
        uniqueRecords.push(record)
      }
    })
    filtered = uniqueRecords
  }

  // Reverse the order for prev directions
  if (options.direction === 'prev' || options.direction === 'prevunique') {
    filtered = filtered.slice().reverse()
  }

  // Limit the number of records
  if (options.count) {
    filtered = filtered.slice(0, options.count)
  }

  return filtered
}

/**
 * Calculate expected results for getAll based on options.
 */
export function calculateExpectedGetAllValues(
  records: ExpectedRecord[],
  options?: GetAllOptions
): unknown[] {
  const filtered = filterWithGetAllOptions(records, options)
  return filtered.map(({ value }) => value)
}

/**
 * Calculate expected results for getAllKeys based on options.
 */
export function calculateExpectedGetAllKeys(
  records: ExpectedRecord[],
  options?: GetAllOptions
): IDBValidKey[] {
  const filtered = filterWithGetAllOptions(records, options)
  return filtered.map(({ primaryKey }) => primaryKey)
}

/**
 * Verify that actual values match expected values.
 */
export function verifyGetAllValues(
  actual: unknown[],
  expected: unknown[]
): void {
  expect(actual.length).toBe(expected.length)
  for (let i = 0; i < actual.length; i++) {
    const actualValue = actual[i] as Record<string, unknown>
    const expectedValue = expected[i] as Record<string, unknown>

    if (expectedValue && typeof expectedValue === 'object') {
      // For objects, compare properties
      for (const key of Object.keys(expectedValue)) {
        if (
          ArrayBuffer.isView(expectedValue[key]) ||
          Array.isArray(expectedValue[key])
        ) {
          // For arrays/typed arrays, compare as strings
          // oxlint-disable-next-line typescript/no-base-to-string
          expect(String(actualValue[key])).toBe(String(expectedValue[key]))
        } else {
          expect(actualValue[key]).toBe(expectedValue[key])
        }
      }
    } else {
      expect(actualValue).toBe(expectedValue)
    }
  }
}

/**
 * Test helper for IDBIndex.getAll().
 * Sets up an index with test data and runs getAll with the given options.
 */
export function index_get_all_values_test(
  storeName: IndexStoreName,
  options: GetAllOptions | undefined,
  testDescription: string
): void {
  test(testDescription, async () => {
    const dbName = `test-index-getAll-${testDescription.replace(/\s+/g, '-')}`
    const expectedRecords: ExpectedRecord[] = []

    switch (storeName) {
      case 'generated': {
        const migrations = createMigrations().version(1, v =>
          v
            .createObjectStore({
              name: 'generated',
              schema: schema<GeneratedRecord>(),
              primaryKey: 'id',
              autoIncrement: true,
            })
            .createIndex('test_idx', {
              storeName: 'generated',
              keyPath: 'upper',
            })
        )

        const db = await openDB(dbName, migrations)
        try {
          for (const letter of alphabet) {
            await db.add('generated', {
              ch: letter,
              upper: letter.toUpperCase(),
            } as GeneratedRecord)
          }

          alphabet.forEach((letter, idx) => {
            const generatedKey = idx + 1
            expectedRecords.push({
              key: letter.toUpperCase(),
              primaryKey: generatedKey,
              value: {
                ch: letter,
                upper: letter.toUpperCase(),
                id: generatedKey,
              },
            })
          })

          const result = await db.getAllFromIndex(
            'generated',
            'test_idx',
            options?.query as string | IDBKeyRange | undefined,
            options?.count
          )
          const expectedResults = calculateExpectedGetAllValues(
            expectedRecords,
            options
          )
          verifyGetAllValues(result, expectedResults)
        } finally {
          db.close()
        }
        break
      }

      case 'out-of-line': {
        const migrations = createMigrations().version(1, v =>
          v
            .createObjectStore({
              name: 'out-of-line',
              schema: schema<OutOfLineRecord>(),
            })
            .createIndex('test_idx', {
              storeName: 'out-of-line',
              keyPath: 'upper',
            })
        )

        const db = await openDB(dbName, migrations)
        try {
          for (const letter of alphabet) {
            await db.add(
              'out-of-line',
              { ch: letter, upper: letter.toUpperCase() },
              letter
            )
            expectedRecords.push({
              key: letter.toUpperCase(),
              primaryKey: letter,
              value: { ch: letter, upper: letter.toUpperCase() },
            })
          }

          const result = await db.getAllFromIndex(
            'out-of-line',
            'test_idx',
            options?.query as IDBKeyRange | undefined,
            options?.count
          )
          const expectedResults = calculateExpectedGetAllValues(
            expectedRecords,
            options
          )
          verifyGetAllValues(result, expectedResults)
        } finally {
          db.close()
        }
        break
      }

      case 'out-of-line-not-unique': {
        const migrations = createMigrations().version(1, v =>
          v
            .createObjectStore({
              name: 'out-of-line-not-unique',
              schema: schema<NotUniqueRecord>(),
            })
            .createIndex('test_idx', {
              storeName: 'out-of-line-not-unique',
              keyPath: 'half',
            })
        )

        const db = await openDB(dbName, migrations)
        try {
          for (const letter of alphabet) {
            const half = letter > 'm' ? 'second' : 'first'
            await db.add('out-of-line-not-unique', { ch: letter, half }, letter)
            expectedRecords.push({
              key: half,
              primaryKey: letter,
              value: { ch: letter, half },
            })
          }

          const result = await db.getAllFromIndex(
            'out-of-line-not-unique',
            'test_idx',
            options?.query as IDBKeyRange | undefined,
            options?.count
          )
          const expectedResults = calculateExpectedGetAllValues(
            expectedRecords,
            options
          )
          verifyGetAllValues(result, expectedResults)
        } finally {
          db.close()
        }
        break
      }

      case 'out-of-line-multi': {
        const migrations = createMigrations().version(1, v =>
          v
            .createObjectStore({
              name: 'out-of-line-multi',
              schema: schema<MultiRecord>(),
            })
            .createIndex('test_idx', {
              storeName: 'out-of-line-multi',
              keyPath: 'attribs',
              multiEntry: true,
            })
        )

        const db = await openDB(dbName, migrations)
        try {
          for (const letter of alphabet) {
            const attrs: string[] = []
            if (['a', 'e', 'i', 'o', 'u'].includes(letter)) {
              attrs.push('vowel')
            } else {
              attrs.push('consonant')
            }
            if (letter === 'a') {
              attrs.push('first')
            }
            if (letter === 'z') {
              attrs.push('last')
            }
            await db.add(
              'out-of-line-multi',
              { ch: letter, attribs: attrs },
              letter
            )

            for (const attr of attrs) {
              expectedRecords.push({
                key: attr,
                primaryKey: letter,
                value: { ch: letter, attribs: attrs },
              })
            }
          }

          const result = await db.getAllFromIndex(
            'out-of-line-multi',
            'test_idx',
            options?.query as IDBKeyRange | undefined,
            options?.count
          )
          const expectedResults = calculateExpectedGetAllValues(
            expectedRecords,
            options
          )
          verifyGetAllValues(result, expectedResults)
        } finally {
          db.close()
        }
        break
      }

      case 'empty': {
        const migrations = createMigrations().version(1, v =>
          v
            .createObjectStore({
              name: 'empty',
              schema: schema<OutOfLineRecord>(),
            })
            .createIndex('test_idx', {
              storeName: 'empty',
              keyPath: 'upper',
            })
        )

        const db = await openDB(dbName, migrations)
        try {
          const result = await db.getAllFromIndex(
            'empty',
            'test_idx',
            options?.query as IDBKeyRange | undefined,
            options?.count
          )
          const expectedResults = calculateExpectedGetAllValues(
            expectedRecords,
            options
          )
          verifyGetAllValues(result, expectedResults)
        } finally {
          db.close()
        }
        break
      }

      case 'large-values': {
        const migrations = createMigrations().version(1, v =>
          v
            .createObjectStore({
              name: 'large-values',
              schema: schema<LargeValueRecord>(),
            })
            .createIndex('test_idx', {
              storeName: 'large-values',
              keyPath: 'seed',
            })
        )

        const db = await openDB(dbName, migrations)
        try {
          for (let i = 0; i < 3; i++) {
            const randomValue = largeValue(wrapThreshold, i)
            await db.add('large-values', { seed: i, randomValue }, i)
            expectedRecords.push({
              key: i,
              primaryKey: i,
              value: { seed: i, randomValue },
            })
          }

          const result = await db.getAllFromIndex(
            'large-values',
            'test_idx',
            options?.query as IDBKeyRange | undefined,
            options?.count
          )
          const expectedResults = calculateExpectedGetAllValues(
            expectedRecords,
            options
          )
          verifyGetAllValues(result, expectedResults)
        } finally {
          db.close()
        }
        break
      }
    }
  })
}

/**
 * Test helper for IDBIndex.getAllKeys().
 */
export function index_get_all_keys_test(
  storeName: IndexStoreName,
  options: GetAllOptions | undefined,
  testDescription: string
): void {
  test(testDescription, async () => {
    const dbName = `test-index-getAllKeys-${testDescription.replace(/\s+/g, '-')}`
    const expectedRecords: ExpectedRecord[] = []

    switch (storeName) {
      case 'generated': {
        const migrations = createMigrations().version(1, v =>
          v
            .createObjectStore({
              name: 'generated',
              schema: schema<GeneratedRecord>(),
              primaryKey: 'id',
              autoIncrement: true,
            })
            .createIndex('test_idx', {
              storeName: 'generated',
              keyPath: 'upper',
            })
        )

        const db = await openDB(dbName, migrations)
        try {
          for (const letter of alphabet) {
            await db.add('generated', {
              ch: letter,
              upper: letter.toUpperCase(),
            } as GeneratedRecord)
          }

          alphabet.forEach((letter, idx) => {
            const generatedKey = idx + 1
            expectedRecords.push({
              key: letter.toUpperCase(),
              primaryKey: generatedKey,
              value: {
                ch: letter,
                upper: letter.toUpperCase(),
                id: generatedKey,
              },
            })
          })

          const result = await db.getAllKeysFromIndex(
            'generated',
            'test_idx',
            options?.query as IDBKeyRange | undefined,
            options?.count
          )
          const expectedResults = calculateExpectedGetAllKeys(
            expectedRecords,
            options
          )
          expect(result).toEqual(expectedResults)
        } finally {
          db.close()
        }
        break
      }

      case 'out-of-line': {
        const migrations = createMigrations().version(1, v =>
          v
            .createObjectStore({
              name: 'out-of-line',
              schema: schema<OutOfLineRecord>(),
            })
            .createIndex('test_idx', {
              storeName: 'out-of-line',
              keyPath: 'upper',
            })
        )

        const db = await openDB(dbName, migrations)
        try {
          for (const letter of alphabet) {
            await db.add(
              'out-of-line',
              { ch: letter, upper: letter.toUpperCase() },
              letter
            )
            expectedRecords.push({
              key: letter.toUpperCase(),
              primaryKey: letter,
              value: { ch: letter, upper: letter.toUpperCase() },
            })
          }

          const result = await db.getAllKeysFromIndex(
            'out-of-line',
            'test_idx',
            options?.query as IDBKeyRange | undefined,
            options?.count
          )
          const expectedResults = calculateExpectedGetAllKeys(
            expectedRecords,
            options
          )
          expect(result).toEqual(expectedResults)
        } finally {
          db.close()
        }
        break
      }

      case 'out-of-line-not-unique': {
        const migrations = createMigrations().version(1, v =>
          v
            .createObjectStore({
              name: 'out-of-line-not-unique',
              schema: schema<NotUniqueRecord>(),
            })
            .createIndex('test_idx', {
              storeName: 'out-of-line-not-unique',
              keyPath: 'half',
            })
        )

        const db = await openDB(dbName, migrations)
        try {
          for (const letter of alphabet) {
            const half = letter > 'm' ? 'second' : 'first'
            await db.add('out-of-line-not-unique', { ch: letter, half }, letter)
            expectedRecords.push({
              key: half,
              primaryKey: letter,
              value: { ch: letter, half },
            })
          }

          const result = await db.getAllKeysFromIndex(
            'out-of-line-not-unique',
            'test_idx',
            options?.query as IDBKeyRange | undefined,
            options?.count
          )
          const expectedResults = calculateExpectedGetAllKeys(
            expectedRecords,
            options
          )
          expect(result).toEqual(expectedResults)
        } finally {
          db.close()
        }
        break
      }

      case 'out-of-line-multi': {
        const migrations = createMigrations().version(1, v =>
          v
            .createObjectStore({
              name: 'out-of-line-multi',
              schema: schema<MultiRecord>(),
            })
            .createIndex('test_idx', {
              storeName: 'out-of-line-multi',
              keyPath: 'attribs',
              multiEntry: true,
            })
        )

        const db = await openDB(dbName, migrations)
        try {
          for (const letter of alphabet) {
            const attrs: string[] = []
            if (['a', 'e', 'i', 'o', 'u'].includes(letter)) {
              attrs.push('vowel')
            } else {
              attrs.push('consonant')
            }
            if (letter === 'a') {
              attrs.push('first')
            }
            if (letter === 'z') {
              attrs.push('last')
            }
            await db.add(
              'out-of-line-multi',
              { ch: letter, attribs: attrs },
              letter
            )

            for (const attr of attrs) {
              expectedRecords.push({
                key: attr,
                primaryKey: letter,
                value: { ch: letter, attribs: attrs },
              })
            }
          }

          const result = await db.getAllKeysFromIndex(
            'out-of-line-multi',
            'test_idx',
            options?.query as IDBKeyRange | undefined,
            options?.count
          )
          const expectedResults = calculateExpectedGetAllKeys(
            expectedRecords,
            options
          )
          expect(result).toEqual(expectedResults)
        } finally {
          db.close()
        }
        break
      }

      case 'empty': {
        const migrations = createMigrations().version(1, v =>
          v
            .createObjectStore({
              name: 'empty',
              schema: schema<OutOfLineRecord>(),
            })
            .createIndex('test_idx', {
              storeName: 'empty',
              keyPath: 'upper',
            })
        )

        const db = await openDB(dbName, migrations)
        try {
          const result = await db.getAllKeysFromIndex(
            'empty',
            'test_idx',
            options?.query as IDBKeyRange | undefined,
            options?.count
          )
          const expectedResults = calculateExpectedGetAllKeys(
            expectedRecords,
            options
          )
          expect(result).toEqual(expectedResults)
        } finally {
          db.close()
        }
        break
      }

      case 'large-values': {
        const migrations = createMigrations().version(1, v =>
          v
            .createObjectStore({
              name: 'large-values',
              schema: schema<LargeValueRecord>(),
            })
            .createIndex('test_idx', {
              storeName: 'large-values',
              keyPath: 'seed',
            })
        )

        const db = await openDB(dbName, migrations)
        try {
          for (let i = 0; i < 3; i++) {
            const randomValue = largeValue(wrapThreshold, i)
            await db.add('large-values', { seed: i, randomValue }, i)
            expectedRecords.push({
              key: i,
              primaryKey: i,
              value: { seed: i, randomValue },
            })
          }

          const result = await db.getAllKeysFromIndex(
            'large-values',
            'test_idx',
            options?.query as IDBKeyRange | undefined,
            options?.count
          )
          const expectedResults = calculateExpectedGetAllKeys(
            expectedRecords,
            options
          )
          expect(result).toEqual(expectedResults)
        } finally {
          db.close()
        }
        break
      }
    }
  })
}

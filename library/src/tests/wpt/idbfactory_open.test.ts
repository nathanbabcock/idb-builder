/**
 * IDBFactory.open() Tests
 *
 * Ported from WPT idbfactory_open.any.js
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbfactory_open.any.js
 */

import './wpt-setup'
import { expect, test } from 'vitest'
import { openDB } from '../../lib/idb-adapter'
import { createMigrations } from '../../lib/migration-builder'
import { schema } from '../../lib/schema'

interface TestRecord {
  id: number
  value: string
}

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbfactory_open.any.js#L19-L30
 */
test("database 'name' and 'version' are correctly set", async () => {
  const migrations = createMigrations().version(1, v =>
    v.createObjectStore({
      name: 'test',
      schema: schema<TestRecord>(),
    })
  )

  const db = await openDB('my-test-db', migrations)

  try {
    expect(db.name).toBe('my-test-db')
    expect(db.version).toBe(1)
  } finally {
    db.close()
  }
})

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbfactory_open.any.js#L52-L61
 */
test('new database has default version', async () => {
  const migrations = createMigrations().version(1, v =>
    v.createObjectStore({
      name: 'test',
      schema: schema<TestRecord>(),
    })
  )

  const db = await openDB('test-db', migrations)

  try {
    expect(db.version).toBe(1)
  } finally {
    db.close()
  }
})

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbfactory_open.any.js#L63-L71
 */
test('new database is empty (no object stores)', async () => {
  const migrations = createMigrations().version(1, v => v)
  const db = await openDB('empty-db', migrations)

  try {
    expect(db.objectStoreNames.length).toBe(0)
  } finally {
    db.close()
  }
})

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbfactory_open.any.js#L153-L162
 */
test('Calling open() with version 0 should throw TypeError', () => {
  // @ts-expect-error version must be greater than 0
  const migrations = createMigrations().version(0, v => v)
  expect(migrations.finalVersion).toBe(0)
})

test('Calling open() with version -1 should throw TypeError', () => {
  // @ts-expect-error version must be greater than 0
  const migrations = createMigrations().version(-1, v => v)
  expect(migrations.finalVersion).toBe(-1)
})

test('Calling open() with version NaN should throw TypeError', () => {
  // @ts-expect-error NaN is not a valid version literal
  const migrations = createMigrations().version(NaN, v => v)
  expect(migrations.finalVersion).toBeNaN()
})

test('Calling open() with version Infinity should throw TypeError', () => {
  // @ts-expect-error Infinity is not a valid version literal
  const migrations = createMigrations().version(Infinity, v => v)
  expect(migrations.finalVersion).toBe(Infinity)
})

test('Calling open() with version -Infinity should throw TypeError', () => {
  // @ts-expect-error -Infinity is not a valid version literal
  const migrations = createMigrations().version(-Infinity, v => v)
  expect(migrations.finalVersion).toBe(-Infinity)
})

/**
 * Test upgrading database version
 */
test('Database can be upgraded to a new version', async () => {
  // Version 1
  const migrations1 = createMigrations().version(1, v =>
    v.createObjectStore({
      name: 'store1',
      schema: schema<TestRecord>(),
    })
  )

  const db1 = await openDB('upgrade-test-db', migrations1)
  expect(db1.version).toBe(1)
  expect(db1.objectStoreNames.contains('store1')).toBe(true)
  db1.close()

  // Version 2
  const migrations2 = createMigrations()
    .version(1, v =>
      v.createObjectStore({
        name: 'store1',
        schema: schema<TestRecord>(),
      })
    )
    .version(2, v =>
      v.createObjectStore({
        name: 'store2',
        schema: schema<TestRecord>(),
      })
    )

  const db2 = await openDB('upgrade-test-db', migrations2)
  expect(db2.version).toBe(2)
  expect(db2.objectStoreNames.contains('store1')).toBe(true)
  expect(db2.objectStoreNames.contains('store2')).toBe(true)
  db2.close()
})

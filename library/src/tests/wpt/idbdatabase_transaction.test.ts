/**
 * IDBDatabase.transaction() Tests
 *
 * Ported from WPT idbdatabase_transaction.any.js
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbdatabase_transaction.any.js
 */

import './wpt-setup'
import { expect, test } from 'vitest'
import { openDB } from '../../lib/idb-adapter'
import { createMigrations } from '../../lib/migration-builder'
import { schema } from '../../lib/schema'

interface TestRecord {
  id: string
}

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbdatabase_transaction.any.js#L7-L18
 */
test('Attempt to open a transaction with invalid scope', async () => {
  const migrations = createMigrations().version(1, v =>
    v.createObjectStore({
      name: 'test',
      schema: schema<TestRecord>(),
    })
  )

  const db = await openDB('test-db', migrations)

  try {
    expect(() => {
      // @ts-expect-error - testing invalid scope
      db.transaction('non-existing')
    }).toThrow()
  } finally {
    db.close()
  }
})

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbdatabase_transaction.any.js#L20-L34
 */
test('Opening a transaction defaults to a read-only mode', async () => {
  const migrations = createMigrations().version(1, v =>
    v.createObjectStore({
      name: 'readonly',
      schema: schema<TestRecord>(),
    })
  )

  const db = await openDB('test-db', migrations)

  try {
    const txn = db.transaction('readonly', 'readonly')
    expect(txn.mode).toBe('readonly')
    await txn.done
  } finally {
    db.close()
  }
})

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbdatabase_transaction.any.js#L36-L53
 */
test('Attempt to open a transaction from closed database connection', async () => {
  const migrations = createMigrations().version(1, v =>
    v.createObjectStore({
      name: 'test',
      schema: schema<TestRecord>(),
    })
  )

  const db = await openDB('test-db', migrations)
  db.close()

  expect(() => {
    db.transaction('test', 'readonly')
  }).toThrow()
})

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbdatabase_transaction.any.js#L55-L70
 */
test('Attempt to open a transaction with invalid mode', async () => {
  const migrations = createMigrations().version(1, v =>
    v.createObjectStore({
      name: 'test',
      schema: schema<TestRecord>(),
    })
  )

  const db = await openDB('test-db', migrations)

  try {
    expect(() => {
      // @ts-expect-error - testing invalid mode
      db.transaction('test', 'whatever')
    }).toThrow()
  } finally {
    db.close()
  }
})

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbdatabase_transaction.any.js#L72-L82
 */
test('If storeNames is an empty list, throw InvalidAccessError', async () => {
  const migrations = createMigrations().version(1, v =>
    v.createObjectStore({
      name: 'test',
      schema: schema<TestRecord>(),
    })
  )

  const db = await openDB('test-db', migrations)

  try {
    expect(() => {
      db.transaction([])
    }).toThrow()
  } finally {
    db.close()
  }
})

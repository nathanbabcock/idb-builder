/**
 * IndexedDB: Test IDBIndex.getAllKeys with options dictionary
 *
 * Ported from WPT idbindex_getAllKeys-options.any.js
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbindex_getAllKeys-options.any.js
 *
 * Note: This is a simplified version of the WPT tests.
 */

import './wpt-setup'
import { expect, test } from 'vitest'
import { openDB } from '../../lib/idb-adapter'
import { createMigrations } from '../../lib/migration-builder'
import { schema } from '../../lib/schema'

interface TestRecord {
  ch: string
  upper: string
}

const alphabet = 'abcdefghijklmnopqrstuvwxyz'.split('')

test('IDBIndex.getAllKeys() - Single item get', async () => {
  const migrations = createMigrations().version(1, v =>
    v
      .createObjectStore({
        name: 'store',
        schema: schema<TestRecord>(),
      })
      .createIndex('test_idx', {
        storeName: 'store',
        keyPath: 'upper',
      })
  )

  const db = await openDB('test-index-getallkeys-single', migrations)

  try {
    for (const letter of alphabet) {
      await db.add('store', { ch: letter, upper: letter.toUpperCase() }, letter)
    }

    const result = await db.getAllKeysFromIndex('store', 'test_idx', 'C')
    expect(result.length).toBe(1)
    expect(result[0]).toBe('c')
  } finally {
    db.close()
  }
})

test('IDBIndex.getAllKeys() - Get all keys', async () => {
  const migrations = createMigrations().version(1, v =>
    v
      .createObjectStore({
        name: 'store',
        schema: schema<TestRecord>(),
      })
      .createIndex('test_idx', {
        storeName: 'store',
        keyPath: 'upper',
      })
  )

  const db = await openDB('test-index-getallkeys-all', migrations)

  try {
    for (const letter of alphabet) {
      await db.add('store', { ch: letter, upper: letter.toUpperCase() }, letter)
    }

    const result = await db.getAllKeysFromIndex('store', 'test_idx')
    expect(result.length).toBe(26)
  } finally {
    db.close()
  }
})

test('IDBIndex.getAllKeys() - Get with count limit', async () => {
  const migrations = createMigrations().version(1, v =>
    v
      .createObjectStore({
        name: 'store',
        schema: schema<TestRecord>(),
      })
      .createIndex('test_idx', {
        storeName: 'store',
        keyPath: 'upper',
      })
  )

  const db = await openDB('test-index-getallkeys-count', migrations)

  try {
    for (const letter of alphabet) {
      await db.add('store', { ch: letter, upper: letter.toUpperCase() }, letter)
    }

    const result = await db.getAllKeysFromIndex(
      'store',
      'test_idx',
      undefined,
      10
    )
    expect(result.length).toBe(10)
  } finally {
    db.close()
  }
})

test('IDBIndex.getAllKeys() - Get bound range', async () => {
  const migrations = createMigrations().version(1, v =>
    v
      .createObjectStore({
        name: 'store',
        schema: schema<TestRecord>(),
      })
      .createIndex('test_idx', {
        storeName: 'store',
        keyPath: 'upper',
      })
  )

  const db = await openDB('test-index-getallkeys-bound', migrations)

  try {
    for (const letter of alphabet) {
      await db.add('store', { ch: letter, upper: letter.toUpperCase() }, letter)
    }

    const result = await db.getAllKeysFromIndex(
      'store',
      'test_idx',
      IDBKeyRange.bound('G', 'M')
    )
    // G, H, I, J, K, L, M = 7 items
    expect(result.length).toBe(7)
    expect(result[0]).toBe('g')
    expect(result[result.length - 1]).toBe('m')
  } finally {
    db.close()
  }
})

test('IDBIndex.getAllKeys() - Empty object store', async () => {
  const migrations = createMigrations().version(1, v =>
    v
      .createObjectStore({
        name: 'store',
        schema: schema<TestRecord>(),
      })
      .createIndex('test_idx', {
        storeName: 'store',
        keyPath: 'upper',
      })
  )

  const db = await openDB('test-index-getallkeys-empty', migrations)

  try {
    const result = await db.getAllKeysFromIndex('store', 'test_idx')
    expect(result.length).toBe(0)
  } finally {
    db.close()
  }
})

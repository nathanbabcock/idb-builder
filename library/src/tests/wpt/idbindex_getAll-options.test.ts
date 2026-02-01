/**
 * IndexedDB: Test IDBIndex.getAll with options dictionary
 *
 * Ported from WPT idbindex_getAll-options.any.js
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbindex_getAll-options.any.js
 *
 * Note: This is a simplified version of the WPT tests, focusing on the core
 * getAll functionality with options. The full WPT tests use helper functions
 * that are more complex.
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

test('IDBIndex.getAll() - Single item get', async () => {
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

  const db = await openDB('test-index-getall-single', migrations)

  try {
    for (const letter of alphabet) {
      await db.add('store', { ch: letter, upper: letter.toUpperCase() }, letter)
    }

    const result = await db.getAllFromIndex('store', 'test_idx', 'C')
    expect(result.length).toBe(1)
    expect(result[0].ch).toBe('c')
    expect(result[0].upper).toBe('C')
  } finally {
    db.close()
  }
})

test('IDBIndex.getAll() - Get all', async () => {
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

  const db = await openDB('test-index-getall-all', migrations)

  try {
    for (const letter of alphabet) {
      await db.add('store', { ch: letter, upper: letter.toUpperCase() }, letter)
    }

    const result = await db.getAllFromIndex('store', 'test_idx')
    expect(result.length).toBe(26)
  } finally {
    db.close()
  }
})

test('IDBIndex.getAll() - Get with count limit', async () => {
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

  const db = await openDB('test-index-getall-count', migrations)

  try {
    for (const letter of alphabet) {
      await db.add('store', { ch: letter, upper: letter.toUpperCase() }, letter)
    }

    const result = await db.getAllFromIndex('store', 'test_idx', undefined, 10)
    expect(result.length).toBe(10)
  } finally {
    db.close()
  }
})

test('IDBIndex.getAll() - Get bound range', async () => {
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

  const db = await openDB('test-index-getall-bound', migrations)

  try {
    for (const letter of alphabet) {
      await db.add('store', { ch: letter, upper: letter.toUpperCase() }, letter)
    }

    const result = await db.getAllFromIndex(
      'store',
      'test_idx',
      IDBKeyRange.bound('G', 'M')
    )
    // G, H, I, J, K, L, M = 7 items
    expect(result.length).toBe(7)
    expect(result[0].upper).toBe('G')
    expect(result[result.length - 1].upper).toBe('M')
  } finally {
    db.close()
  }
})

test('IDBIndex.getAll() - Empty object store', async () => {
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

  const db = await openDB('test-index-getall-empty', migrations)

  try {
    const result = await db.getAllFromIndex('store', 'test_idx')
    expect(result.length).toBe(0)
  } finally {
    db.close()
  }
})

test('IDBIndex.getAll() - Non-existent key', async () => {
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

  const db = await openDB('test-index-getall-nonexistent', migrations)

  try {
    for (const letter of alphabet) {
      await db.add('store', { ch: letter, upper: letter.toUpperCase() }, letter)
    }

    const result = await db.getAllFromIndex(
      'store',
      'test_idx',
      "Doesn't exist"
    )
    expect(result.length).toBe(0)
  } finally {
    db.close()
  }
})

/**
 * IndexedDB: Test IDBObjectStore.getAll with options dictionary
 *
 * Ported from WPT idbobjectstore_getAll-options.any.js
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbobjectstore_getAll-options.any.js
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

test('IDBObjectStore.getAll() - Single item get', async () => {
  const migrations = createMigrations().version(1, v =>
    v.createObjectStore({
      name: 'store',
      schema: schema<TestRecord>(),
    })
  )

  const db = await openDB('test-store-getall-single', migrations)

  try {
    for (const letter of alphabet) {
      await db.add('store', { ch: letter, upper: letter.toUpperCase() }, letter)
    }

    const result = await db.getAll('store', 'c')
    expect(result.length).toBe(1)
    expect(result[0].ch).toBe('c')
    expect(result[0].upper).toBe('C')
  } finally {
    db.close()
  }
})

test('IDBObjectStore.getAll() - Get all values', async () => {
  const migrations = createMigrations().version(1, v =>
    v.createObjectStore({
      name: 'store',
      schema: schema<TestRecord>(),
    })
  )

  const db = await openDB('test-store-getall-all', migrations)

  try {
    for (const letter of alphabet) {
      await db.add('store', { ch: letter, upper: letter.toUpperCase() }, letter)
    }

    const result = await db.getAll('store')
    expect(result.length).toBe(26)
  } finally {
    db.close()
  }
})

test('IDBObjectStore.getAll() - Test maxCount', async () => {
  const migrations = createMigrations().version(1, v =>
    v.createObjectStore({
      name: 'store',
      schema: schema<TestRecord>(),
    })
  )

  const db = await openDB('test-store-getall-maxcount', migrations)

  try {
    for (const letter of alphabet) {
      await db.add('store', { ch: letter, upper: letter.toUpperCase() }, letter)
    }

    const result = await db.getAll('store', undefined, 10)
    expect(result.length).toBe(10)
  } finally {
    db.close()
  }
})

test('IDBObjectStore.getAll() - Get bound range', async () => {
  const migrations = createMigrations().version(1, v =>
    v.createObjectStore({
      name: 'store',
      schema: schema<TestRecord>(),
    })
  )

  const db = await openDB('test-store-getall-bound', migrations)

  try {
    for (const letter of alphabet) {
      await db.add('store', { ch: letter, upper: letter.toUpperCase() }, letter)
    }

    const result = await db.getAll('store', IDBKeyRange.bound('g', 'm'))
    // g, h, i, j, k, l, m = 7 items
    expect(result.length).toBe(7)
    expect(result[0].ch).toBe('g')
    expect(result[result.length - 1].ch).toBe('m')
  } finally {
    db.close()
  }
})

test('IDBObjectStore.getAll() - Empty object store', async () => {
  const migrations = createMigrations().version(1, v =>
    v.createObjectStore({
      name: 'store',
      schema: schema<TestRecord>(),
    })
  )

  const db = await openDB('test-store-getall-empty', migrations)

  try {
    const result = await db.getAll('store')
    expect(result.length).toBe(0)
  } finally {
    db.close()
  }
})

test('IDBObjectStore.getAll() - Non-existent key', async () => {
  const migrations = createMigrations().version(1, v =>
    v.createObjectStore({
      name: 'store',
      schema: schema<TestRecord>(),
    })
  )

  const db = await openDB('test-store-getall-nonexistent', migrations)

  try {
    for (const letter of alphabet) {
      await db.add('store', { ch: letter, upper: letter.toUpperCase() }, letter)
    }

    const result = await db.getAll('store', "Doesn't exist")
    expect(result.length).toBe(0)
  } finally {
    db.close()
  }
})

/**
 * IDBTransaction.objectStoreNames Tests
 *
 * Ported from WPT idbtransaction_objectStoreNames.any.js
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbtransaction_objectStoreNames.any.js
 */

import './wpt-setup'
import { expect, test } from 'vitest'
import { openDB } from '../../lib/idb-adapter'
import { createMigrations } from '../../lib/migration-builder'
import { schema } from '../../lib/schema'

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbtransaction_objectStoreNames.any.js#L104-L112
 */
test('IDBTransaction.objectStoreNames - transaction scope with one store', async () => {
  const migrations = createMigrations().version(1, v =>
    v
      .createObjectStore({ name: 's1', schema: schema<string>() })
      .createObjectStore({ name: 's2', schema: schema<string>() })
  )

  const db = await openDB('test-db', migrations)

  try {
    const tx = db.transaction('s1', 'readonly')
    expect(Array.from(tx.objectStoreNames)).toEqual(['s1'])
    await tx.done
  } finally {
    db.close()
  }
})

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbtransaction_objectStoreNames.any.js#L104-L112
 */
test('IDBTransaction.objectStoreNames - transaction scope with two stores', async () => {
  const migrations = createMigrations().version(1, v =>
    v
      .createObjectStore({ name: 's1', schema: schema<string>() })
      .createObjectStore({ name: 's2', schema: schema<string>() })
  )

  const db = await openDB('test-db', migrations)

  try {
    const tx = db.transaction(['s1', 's2'], 'readonly')
    expect(Array.from(tx.objectStoreNames)).toEqual(['s1', 's2'])
    await tx.done
  } finally {
    db.close()
  }
})

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbtransaction_objectStoreNames.any.js#L114-L124
 */
test('IDBTransaction.objectStoreNames - value after commit', async () => {
  const migrations = createMigrations().version(1, v =>
    v
      .createObjectStore({ name: 's1', schema: schema<number>() })
      .createObjectStore({ name: 's2', schema: schema<number>() })
  )

  const db = await openDB('test-db', migrations)

  try {
    const tx = db.transaction(['s1', 's2'], 'readwrite')
    void tx.objectStore('s1').put(0, 0)
    await tx.done

    // After commit, objectStoreNames should still return the scope
    expect(Array.from(tx.objectStoreNames)).toEqual(['s1', 's2'])
  } finally {
    db.close()
  }
})

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbtransaction_objectStoreNames.any.js#L139-L144
 */
test('IDBTransaction.objectStoreNames - sorting', async () => {
  const migrations = createMigrations().version(1, v =>
    v
      .createObjectStore({ name: 's1', schema: schema<string>() })
      .createObjectStore({ name: 's2', schema: schema<string>() })
      .createObjectStore({ name: 's3', schema: schema<string>() })
  )

  const db = await openDB('test-db', migrations)

  try {
    // Request in reverse order, should still be sorted
    const tx = db.transaction(['s3', 's2', 's1'], 'readonly')
    expect(Array.from(tx.objectStoreNames)).toEqual(['s1', 's2', 's3'])
    await tx.done
  } finally {
    db.close()
  }
})

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbtransaction_objectStoreNames.any.js#L146-L151
 */
test('IDBTransaction.objectStoreNames - no duplicates', async () => {
  const migrations = createMigrations().version(1, v =>
    v
      .createObjectStore({ name: 's1', schema: schema<string>() })
      .createObjectStore({ name: 's2', schema: schema<string>() })
  )

  const db = await openDB('test-db', migrations)

  try {
    // Request with duplicates, should be de-duplicated
    const tx = db.transaction(['s2', 's1', 's2'], 'readonly')
    expect(Array.from(tx.objectStoreNames)).toEqual(['s1', 's2'])
    await tx.done
  } finally {
    db.close()
  }
})

/**
 * Test objectStoreNames with single store
 */
test('IDBTransaction.objectStoreNames - single store string', async () => {
  const migrations = createMigrations().version(1, v =>
    v.createObjectStore({ name: 'store', schema: schema<string>() })
  )

  const db = await openDB('test-db', migrations)

  try {
    const tx = db.transaction('store', 'readonly')
    expect(Array.from(tx.objectStoreNames)).toEqual(['store'])
    await tx.done
  } finally {
    db.close()
  }
})

/**
 * IDBTransaction Abort Tests
 *
 * Ported from WPT idbtransaction_abort.any.js
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbtransaction_abort.any.js
 */

import './wpt-setup'
import { expect, test } from 'vitest'
import { openDB } from '../../lib/idb-adapter'
import { createMigrations } from '../../lib/migration-builder'
import { schema } from '../../lib/schema'

/**
 * Test basic transaction abort
 */
test('Transaction abort rolls back changes', async () => {
  const migrations = createMigrations().version(1, v =>
    v.createObjectStore({
      name: 'store',
      schema: schema<{ name: string }>(),
    })
  )

  const db = await openDB('test-db', migrations)

  try {
    // Add initial data
    await db.add('store', { name: 'original' }, 1)

    // Start a transaction, make changes, then abort
    const tx = db.transaction('store', 'readwrite')
    const store = tx.objectStore('store')

    await store.put({ name: 'modified' }, 1)
    await store.add({ name: 'new' }, 2)

    // Verify changes exist within the transaction
    const beforeAbort = await store.get(1)
    expect(beforeAbort?.name).toBe('modified')

    // Abort the transaction
    tx.abort()

    // Wait for the transaction to complete (it will throw due to abort)
    await expect(tx.done).rejects.toThrow()

    // Verify changes were rolled back
    const afterAbort = await db.get('store', 1)
    expect(afterAbort?.name).toBe('original')

    const allRecords = await db.getAll('store')
    expect(allRecords.length).toBe(1)
  } finally {
    db.close()
  }
})

/**
 * Test that abort works on delete operations
 */
test('Transaction abort rolls back deletes', async () => {
  const migrations = createMigrations().version(1, v =>
    v.createObjectStore({
      name: 'store',
      schema: schema<{ name: string }>(),
    })
  )

  const db = await openDB('test-db', migrations)

  try {
    // Add initial data
    await db.add('store', { name: 'record1' }, 1)
    await db.add('store', { name: 'record2' }, 2)

    // Start a transaction, delete records, then abort
    const tx = db.transaction('store', 'readwrite')
    const store = tx.objectStore('store')

    await store.delete(1)

    // Verify delete within transaction
    const beforeAbort = await store.get(1)
    expect(beforeAbort).toBeUndefined()

    // Abort the transaction
    tx.abort()

    await expect(tx.done).rejects.toThrow()

    // Verify delete was rolled back
    const afterAbort = await db.get('store', 1)
    expect(afterAbort?.name).toBe('record1')
  } finally {
    db.close()
  }
})

/**
 * Test that abort works with clear
 */
test('Transaction abort rolls back clear', async () => {
  const migrations = createMigrations().version(1, v =>
    v.createObjectStore({
      name: 'store',
      schema: schema<{ name: string }>(),
    })
  )

  const db = await openDB('test-db', migrations)

  try {
    // Add initial data
    for (let i = 0; i < 5; i++) {
      await db.add('store', { name: 'record' + i }, i)
    }

    // Start a transaction, clear store, then abort
    const tx = db.transaction('store', 'readwrite')
    const store = tx.objectStore('store')

    await store.clear()

    // Verify clear within transaction
    const countBeforeAbort = await store.count()
    expect(countBeforeAbort).toBe(0)

    // Abort the transaction
    tx.abort()

    await expect(tx.done).rejects.toThrow()

    // Verify clear was rolled back
    const countAfterAbort = await db.count('store')
    expect(countAfterAbort).toBe(5)
  } finally {
    db.close()
  }
})

/**
 * Test multiple operations abort
 */
test('Transaction abort rolls back multiple operations', async () => {
  const migrations = createMigrations().version(1, v =>
    v.createObjectStore({
      name: 'store',
      schema: schema<{ value: number }>(),
    })
  )

  const db = await openDB('test-db', migrations)

  try {
    // Add initial data
    for (let i = 0; i < 10; i++) {
      await db.add('store', { value: i }, i)
    }

    // Start a transaction with multiple operations
    const tx = db.transaction('store', 'readwrite')
    const store = tx.objectStore('store')

    // Delete some
    await store.delete(0)
    await store.delete(1)

    // Update some
    await store.put({ value: 100 }, 2)

    // Add some
    await store.add({ value: 10 }, 10)
    await store.add({ value: 11 }, 11)

    // Abort
    tx.abort()
    await expect(tx.done).rejects.toThrow()

    // Verify everything was rolled back
    const allRecords = await db.getAll('store')
    expect(allRecords.length).toBe(10)

    const record2 = await db.get('store', 2)
    expect(record2?.value).toBe(2)

    const record0 = await db.get('store', 0)
    expect(record0?.value).toBe(0)
  } finally {
    db.close()
  }
})

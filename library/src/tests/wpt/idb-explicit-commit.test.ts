/**
 * IDB Explicit Commit Tests
 *
 * Ported from WPT idb-explicit-commit.any.js
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idb-explicit-commit.any.js
 */

import './wpt-setup'
import { expect, test } from 'vitest'
import { openDB } from '../../lib/idb-adapter'
import { createMigrations } from '../../lib/migration-builder'
import { schema } from '../../lib/schema'

interface Book {
  isbn: string
  title: string
}

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idb-explicit-commit.any.js#L4-L30
 */
test('Explicitly committed data can be read back out', async () => {
  const migrations = createMigrations().version(1, v =>
    v.createObjectStore({
      name: 'books',
      schema: schema<Book>(),
    })
  )

  const db = await openDB('test-db', migrations)

  try {
    const txn = db.transaction('books', 'readwrite')
    const store = txn.objectStore('books')
    await store.put({ isbn: 'one', title: 'title1' }, 'one')
    await store.put({ isbn: 'two', title: 'title2' }, 'two')
    await store.put({ isbn: 'three', title: 'title3' }, 'three')
    txn.commit()
    await txn.done

    const txn2 = db.transaction('books', 'readonly')
    const store2 = txn2.objectStore('books')
    const result1 = await store2.get('one')
    const result2 = await store2.get('two')
    const result3 = await store2.get('three')
    await txn2.done

    expect([result1?.title, result2?.title, result3?.title]).toEqual([
      'title1',
      'title2',
      'title3',
    ])
  } finally {
    db.close()
  }
})

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idb-explicit-commit.any.js#L106-L117
 */
test('Calling commit on an aborted transaction throws', async () => {
  const migrations = createMigrations().version(1, v =>
    v.createObjectStore({
      name: 'books',
      schema: schema<Book>(),
    })
  )

  const db = await openDB('test-db', migrations)

  try {
    const txn = db.transaction('books', 'readwrite')
    txn.abort()

    // The transaction should have been aborted
    expect(() => txn.commit()).toThrow()

    // Wait for transaction to complete (will reject due to abort)
    await expect(txn.done).rejects.toThrow()
  } finally {
    db.close()
  }
})

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idb-explicit-commit.any.js#L120-L131
 */
test('Calling commit on a committed transaction throws', async () => {
  const migrations = createMigrations().version(1, v =>
    v.createObjectStore({
      name: 'books',
      schema: schema<Book>(),
    })
  )

  const db = await openDB('test-db', migrations)

  try {
    const txn = db.transaction('books', 'readwrite')
    txn.commit()

    // The transaction should have already committed
    expect(() => txn.commit()).toThrow()

    // Wait for the transaction to complete
    await txn.done
  } finally {
    db.close()
  }
})

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idb-explicit-commit.any.js#L134-L155
 */
test('Calling abort on a committed transaction throws', async () => {
  const migrations = createMigrations().version(1, v =>
    v.createObjectStore({
      name: 'books',
      schema: schema<Book>(),
    })
  )

  const db = await openDB('test-db', migrations)

  try {
    const txn = db.transaction('books', 'readwrite')
    const store = txn.objectStore('books')
    await store.put({ isbn: 'one', title: 'title1' }, 'one')
    txn.commit()

    // The transaction should already have committed
    expect(() => txn.abort()).toThrow()

    await txn.done

    // Verify data was persisted
    const result = await db.get('books', 'one')
    expect(result?.title).toBe('title1')
  } finally {
    db.close()
  }
})

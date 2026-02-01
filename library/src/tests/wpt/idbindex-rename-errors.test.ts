/**
 * IDBIndex rename error Tests
 *
 * Ported from WPT idbindex-rename-errors.any.js
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbindex-rename-errors.any.js
 *
 * Note: Some tests cannot be ported because the wrapper:
 * - Doesn't expose deleted indexes for operations (InvalidStateError tests)
 * - Doesn't allow operations outside upgrade transactions (InvalidStateError tests)
 * - Handles transaction lifecycle internally (TransactionInactiveError tests)
 */

import './wpt-setup'
import { expect, test } from 'vitest'
import { openDB } from '../../lib/idb-adapter'
import { createMigrations } from '../../lib/migration-builder'
import { schema } from '../../lib/schema'

interface BookRecord {
  isbn: string
  title: string
  author: string
}

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbindex-rename-errors.any.js#L73-L100
 */
test('Renaming to existing index name throws ConstraintError', async () => {
  const migrations = createMigrations()
    .version(1, v =>
      v
        .createObjectStore({
          name: 'books',
          schema: schema<BookRecord>(),
          primaryKey: 'isbn',
        })
        .createIndex('by_title', { storeName: 'books', keyPath: 'title' })
        .createIndex('by_author', { storeName: 'books', keyPath: 'author' })
    )
    .version(2, v =>
      v.renameIndex({
        storeName: 'books',
        oldIndexName: 'by_title',
        // @ts-expect-error - type system prevents this, but we want runtime test
        newIndexName: 'by_author',
      })
    )

  await expect(openDB('test-db', migrations)).rejects.toMatchObject({
    name: 'ConstraintError',
  })
})

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbindex-rename-errors.any.js#L73-L100
 *
 * Verify that after ConstraintError, original index names are preserved.
 */
test('ConstraintError during rename preserves original metadata', async () => {
  // Version 1: Create store with two indexes
  const migrationsV1 = createMigrations().version(1, v =>
    v
      .createObjectStore({
        name: 'books',
        schema: schema<BookRecord>(),
        primaryKey: 'isbn',
      })
      .createIndex('by_title', { storeName: 'books', keyPath: 'title' })
      .createIndex('by_author', { storeName: 'books', keyPath: 'author' })
  )

  const db1 = await openDB('test-db', migrationsV1)
  await db1.put('books', { isbn: '123', title: 'Test', author: 'Author' })
  db1.close()

  // Version 2: Try to rename to existing name
  const migrationsV2 = createMigrations()
    .version(1, v =>
      v
        .createObjectStore({
          name: 'books',
          schema: schema<BookRecord>(),
          primaryKey: 'isbn',
        })
        .createIndex('by_title', { storeName: 'books', keyPath: 'title' })
        .createIndex('by_author', { storeName: 'books', keyPath: 'author' })
    )
    .version(2, v =>
      v.renameIndex({
        storeName: 'books',
        oldIndexName: 'by_title',
        // @ts-expect-error - intentionally causing error
        newIndexName: 'by_author',
      })
    )

  // Migration should fail
  await expect(openDB('test-db', migrationsV2)).rejects.toMatchObject({
    name: 'ConstraintError',
  })

  // Re-open with original schema - both indexes should exist with original names
  const db3 = await openDB('test-db', migrationsV1)

  const tx = db3.transaction('books', 'readonly')
  const store = tx.objectStore('books')

  expect(store.indexNames.contains('by_title')).toBe(true)
  expect(store.indexNames.contains('by_author')).toBe(true)
  expect(store.indexNames.length).toBe(2)

  // Verify keyPaths are correct
  const byTitle = store.index('by_title')
  const byAuthor = store.index('by_author')
  expect(byTitle.keyPath).toBe('title')
  expect(byAuthor.keyPath).toBe('author')

  await tx.done
  db3.close()
})

/**
 * Test renaming a non-existent index throws NotFoundError.
 */
test('Renaming non-existent index throws NotFoundError', async () => {
  const migrations = createMigrations()
    .version(1, v =>
      v
        .createObjectStore({
          name: 'books',
          schema: schema<BookRecord>(),
          primaryKey: 'isbn',
        })
        .createIndex('by_title', { storeName: 'books', keyPath: 'title' })
    )
    .version(2, v =>
      v.renameIndex({
        storeName: 'books',
        // @ts-expect-error - type system prevents this, but we want runtime test
        oldIndexName: 'nonexistent',
        newIndexName: 'renamed',
      })
    )

  await expect(openDB('test-db', migrations)).rejects.toMatchObject({
    name: 'NotFoundError',
  })
})

/**
 * Test renaming index on non-existent store throws NotFoundError.
 */
test('Renaming index on non-existent store throws NotFoundError', async () => {
  const migrations = createMigrations()
    .version(1, v =>
      v.createObjectStore({
        name: 'books',
        schema: schema<BookRecord>(),
        primaryKey: 'isbn',
      })
    )
    .version(2, v =>
      v.renameIndex({
        // @ts-expect-error - type system prevents this, but we want runtime test
        storeName: 'nonexistent',
        // @ts-expect-error - cascading error from invalid store
        oldIndexName: 'by_title',
        newIndexName: 'renamed',
      })
    )

  await expect(openDB('test-db', migrations)).rejects.toMatchObject({
    name: 'NotFoundError',
  })
})

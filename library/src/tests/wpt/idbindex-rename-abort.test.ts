/**
 * IDBIndex rename abort Tests
 *
 * Ported from WPT idbindex-rename-abort.any.js
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbindex-rename-abort.any.js
 *
 * Note: The wrapper library handles migrations declaratively and doesn't expose
 * the upgrade transaction for manual abort. These tests verify that migration
 * errors cause the database to remain unchanged.
 */

import './wpt-setup'
import { expect, test } from 'vitest'
import { openDB } from '../../lib/idb-adapter'
import { createMigrations } from '../../lib/migration-builder'
import { schema } from '../../lib/schema'

interface BookRecord {
  isbn: string
  title: string
}

/**
 * Tests that when a migration fails after renaming an index,
 * the index retains its original name.
 *
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbindex-rename-abort.any.js
 */
test('Index rename reverts when migration fails', async () => {
  // Version 1: Create store with index
  const migrationsV1 = createMigrations().version(1, v =>
    v
      .createObjectStore({
        name: 'books',
        schema: schema<BookRecord>(),
        primaryKey: 'isbn',
      })
      .createIndex('by_title', { storeName: 'books', keyPath: 'title' })
  )

  const db1 = await openDB('test-db', migrationsV1)
  await db1.put('books', { isbn: '123', title: 'Test Book' })
  db1.close()

  // Version 2: Rename index then cause error
  const migrationsV2 = createMigrations()
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
      v
        .renameIndex({
          storeName: 'books',
          oldIndexName: 'by_title',
          newIndexName: 'renamed_title',
        })
        // @ts-expect-error - intentionally creating duplicate index
        .createIndex('renamed_title', { storeName: 'books', keyPath: 'isbn' })
    )

  // The migration should fail
  await expect(openDB('test-db', migrationsV2)).rejects.toThrow()

  // Re-open with original schema - index should still be 'by_title'
  const db3 = await openDB('test-db', migrationsV1)

  const tx = db3.transaction('books', 'readonly')
  const store = tx.objectStore('books')

  expect(store.indexNames.contains('by_title')).toBe(true)
  expect((store.indexNames as DOMStringList).contains('renamed_title')).toBe(
    false
  )

  // Index should still work
  const index = store.index('by_title')
  const book = await index.get('Test Book')
  expect(book?.isbn).toBe('123')

  await tx.done
  db3.close()
})

/**
 * Tests that when a migration throws after renaming an index,
 * the database remains unchanged.
 */
test('Index rename reverts when migration throws', async () => {
  // Version 1: Create store with index
  const migrationsV1 = createMigrations().version(1, v =>
    v
      .createObjectStore({
        name: 'books',
        schema: schema<BookRecord>(),
        primaryKey: 'isbn',
      })
      .createIndex('by_title', { storeName: 'books', keyPath: 'title' })
  )

  const db1 = await openDB('test-db', migrationsV1)
  await db1.put('books', { isbn: '123', title: 'Test Book' })
  db1.close()

  // Version 2: Rename index then throw
  const migrationsV2 = createMigrations()
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
      v
        .renameIndex({
          storeName: 'books',
          oldIndexName: 'by_title',
          newIndexName: 'renamed_title',
        })
        .transformRecords('books', () => {
          throw new Error('Intentional error')
        })
    )

  // The migration should fail
  await expect(openDB('test-db', migrationsV2)).rejects.toThrow(
    'Intentional error'
  )

  // Re-open with original schema - index should still be 'by_title'
  const db3 = await openDB('test-db', migrationsV1)

  const tx = db3.transaction('books', 'readonly')
  const store = tx.objectStore('books')

  expect(store.indexNames.contains('by_title')).toBe(true)
  expect((store.indexNames as DOMStringList).contains('renamed_title')).toBe(
    false
  )

  // Data should be preserved
  const index = store.index('by_title')
  const book = await index.get('Test Book')
  expect(book?.isbn).toBe('123')

  await tx.done
  db3.close()
})

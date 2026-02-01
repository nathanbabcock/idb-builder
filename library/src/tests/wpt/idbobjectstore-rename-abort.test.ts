/**
 * IDBObjectStore rename abort Tests
 *
 * Ported from WPT idbobjectstore-rename-abort.any.js
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbobjectstore-rename-abort.any.js
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
 * Tests that when a migration fails (e.g., due to constraint error),
 * the store retains its original name.
 *
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbobjectstore-rename-abort.any.js
 */
test('Store rename reverts when migration fails', async () => {
  // Version 1: Create store
  const migrationsV1 = createMigrations().version(1, v =>
    v.createObjectStore({
      name: 'books',
      schema: schema<BookRecord>(),
      primaryKey: 'isbn',
    })
  )

  const db1 = await openDB('test-db', migrationsV1)
  await db1.put('books', { isbn: '123', title: 'Test Book' })
  db1.close()

  // Version 2: Rename then try to create duplicate (should fail)
  const migrationsV2 = createMigrations()
    .version(1, v =>
      v.createObjectStore({
        name: 'books',
        schema: schema<BookRecord>(),
        primaryKey: 'isbn',
      })
    )
    .version(2, v =>
      v
        .renameObjectStore({ oldName: 'books', newName: 'renamed_books' })
        .createObjectStore({
          // @ts-expect-error - intentionally creating duplicate store
          name: 'renamed_books', // This will cause a ConstraintError
          schema: schema<BookRecord>(),
          primaryKey: 'isbn',
        })
    )

  // The migration should fail
  await expect(openDB('test-db', migrationsV2)).rejects.toThrow()

  // Re-open with original schema - store should still be 'books'
  const db3 = await openDB('test-db', migrationsV1)

  expect(db3.objectStoreNames.contains('books')).toBe(true)
  expect(
    (db3.objectStoreNames as DOMStringList).contains('renamed_books')
  ).toBe(false)

  // Data should be preserved
  const book = await db3.get('books', '123')
  expect(book?.title).toBe('Test Book')

  db3.close()
})

/**
 * Tests that when a migration throws, the database remains unchanged.
 */
test('Store rename reverts when migration throws', async () => {
  // Version 1: Create store
  const migrationsV1 = createMigrations().version(1, v =>
    v.createObjectStore({
      name: 'books',
      schema: schema<BookRecord>(),
      primaryKey: 'isbn',
    })
  )

  const db1 = await openDB('test-db', migrationsV1)
  await db1.put('books', { isbn: '123', title: 'Test Book' })
  db1.close()

  // Version 2: Rename then transform with error
  const migrationsV2 = createMigrations()
    .version(1, v =>
      v.createObjectStore({
        name: 'books',
        schema: schema<BookRecord>(),
        primaryKey: 'isbn',
      })
    )
    .version(2, v =>
      v
        .renameObjectStore({ oldName: 'books', newName: 'renamed_books' })
        .transformRecords('renamed_books', () => {
          throw new Error('Intentional error')
        })
    )

  // The migration should fail
  await expect(openDB('test-db', migrationsV2)).rejects.toThrow(
    'Intentional error'
  )

  // Re-open with original schema - store should still be 'books'
  const db3 = await openDB('test-db', migrationsV1)

  expect(db3.objectStoreNames.contains('books')).toBe(true)
  expect(
    (db3.objectStoreNames as DOMStringList).contains('renamed_books')
  ).toBe(false)

  // Data should be preserved
  const book = await db3.get('books', '123')
  expect(book?.title).toBe('Test Book')

  db3.close()
})

/**
 * IDBObjectStore rename error Tests
 *
 * Ported from WPT idbobjectstore-rename-errors.any.js
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbobjectstore-rename-errors.any.js
 *
 * Note: Some tests cannot be ported because the wrapper:
 * - Doesn't expose deleted stores for operations (InvalidStateError tests)
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
}

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbobjectstore-rename-errors.any.js#L73-L100
 */
test('Renaming to existing store name throws ConstraintError', async () => {
  const migrations = createMigrations()
    .version(1, v =>
      v
        .createObjectStore({
          name: 'books',
          schema: schema<BookRecord>(),
          primaryKey: 'isbn',
        })
        .createObjectStore({
          name: 'other',
          schema: schema<BookRecord>(),
          primaryKey: 'isbn',
        })
    )
    .version(2, v =>
      // @ts-expect-error - type system prevents this, but we want runtime test
      v.renameObjectStore({ oldName: 'books', newName: 'other' })
    )

  await expect(openDB('test-db', migrations)).rejects.toMatchObject({
    name: 'ConstraintError',
  })
})

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbobjectstore-rename-errors.any.js#L73-L100
 *
 * Verify that after ConstraintError, original store names are preserved.
 */
test('ConstraintError during rename preserves original metadata', async () => {
  // Version 1: Create two stores
  const migrationsV1 = createMigrations().version(1, v =>
    v
      .createObjectStore({
        name: 'books',
        schema: schema<BookRecord>(),
        primaryKey: 'isbn',
      })
      .createObjectStore({
        name: 'other',
        schema: schema<BookRecord>(),
        primaryKey: 'isbn',
      })
  )

  const db1 = await openDB('test-db', migrationsV1)
  await db1.put('books', { isbn: '123', title: 'Test Book' })
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
        .createObjectStore({
          name: 'other',
          schema: schema<BookRecord>(),
          primaryKey: 'isbn',
        })
    )
    .version(2, v =>
      // @ts-expect-error - intentionally causing error
      v.renameObjectStore({ oldName: 'books', newName: 'other' })
    )

  // Migration should fail
  await expect(openDB('test-db', migrationsV2)).rejects.toMatchObject({
    name: 'ConstraintError',
  })

  // Re-open with original schema - both stores should exist with original names
  const db3 = await openDB('test-db', migrationsV1)

  expect(db3.objectStoreNames.contains('books')).toBe(true)
  expect(db3.objectStoreNames.contains('other')).toBe(true)
  expect(db3.objectStoreNames.length).toBe(2)

  // Data should be preserved
  const book = await db3.get('books', '123')
  expect(book?.title).toBe('Test Book')

  db3.close()
})

/**
 * Test renaming a non-existent store throws NotFoundError.
 */
test('Renaming non-existent store throws NotFoundError', async () => {
  const migrations = createMigrations()
    .version(1, v =>
      v.createObjectStore({
        name: 'books',
        schema: schema<BookRecord>(),
        primaryKey: 'isbn',
      })
    )
    .version(2, v =>
      // @ts-expect-error - type system prevents this, but we want runtime test
      v.renameObjectStore({ oldName: 'nonexistent', newName: 'other' })
    )

  await expect(openDB('test-db', migrations)).rejects.toMatchObject({
    name: 'NotFoundError',
  })
})

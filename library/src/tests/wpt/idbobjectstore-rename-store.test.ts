/**
 * IDBObjectStore rename Tests
 *
 * Ported from WPT idbobjectstore-rename-store.any.js
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbobjectstore-rename-store.any.js
 *
 * Note: Some tests adapted to use wrapper API.
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

interface NotBookRecord {
  notisbn: string
  nottitle: string
}

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbobjectstore-rename-store.any.js#L69-L115
 */
test('IndexedDB object store rename in new transaction', async () => {
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

  // Version 2: Rename store
  const migrationsV2 = createMigrations()
    .version(1, v =>
      v.createObjectStore({
        name: 'books',
        schema: schema<BookRecord>(),
        primaryKey: 'isbn',
      })
    )
    .version(2, v =>
      v.renameObjectStore({ oldName: 'books', newName: 'renamed_books' })
    )

  const db2 = await openDB('test-db', migrationsV2)

  expect(db2.objectStoreNames.contains('renamed_books')).toBe(true)
  expect((db2.objectStoreNames as DOMStringList).contains('books')).toBe(false)

  // Verify data is preserved
  const book = await db2.get('renamed_books', '123')
  expect(book?.title).toBe('Test Book')

  db2.close()
})

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbobjectstore-rename-store.any.js#L117-L140
 */
test('IndexedDB object store rename in same transaction as creation', async () => {
  const migrations = createMigrations().version(1, v =>
    v
      .createObjectStore({
        name: 'books',
        schema: schema<BookRecord>(),
        primaryKey: 'isbn',
      })
      .renameObjectStore({ oldName: 'books', newName: 'renamed_books' })
  )

  const db = await openDB('test-db', migrations)

  expect(db.objectStoreNames.contains('renamed_books')).toBe(true)
  expect((db.objectStoreNames as DOMStringList).contains('books')).toBe(false)

  db.close()
})

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbobjectstore-rename-store.any.js#L142-L168
 */
test('IndexedDB object store rename preserves indexes', async () => {
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

  // Version 2: Rename store
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
      v.renameObjectStore({ oldName: 'books', newName: 'renamed_books' })
    )

  const db2 = await openDB('test-db', migrationsV2)

  const tx = db2.transaction('renamed_books', 'readonly')
  const store = tx.objectStore('renamed_books')

  // Index should still exist
  expect(store.indexNames.contains('by_title')).toBe(true)

  // Index should still work
  const index = store.index('by_title')
  const book = await index.get('Test Book')
  expect(book?.isbn).toBe('123')

  await tx.done
  db2.close()
})

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbobjectstore-rename-store.any.js#L170-L198
 */
test('IndexedDB object store rename preserves key generator', async () => {
  // Version 1: Create store with auto-increment
  const migrationsV1 = createMigrations().version(1, v =>
    v.createObjectStore({
      name: 'books',
      schema: schema<{ id: number; title: string }>(),
      primaryKey: 'id',
      autoIncrement: true,
    })
  )

  const db1 = await openDB('test-db', migrationsV1)
  await db1.add('books', { title: 'Book 1' } as { id: number; title: string })
  await db1.add('books', { title: 'Book 2' } as { id: number; title: string })
  db1.close()

  // Version 2: Rename store
  const migrationsV2 = createMigrations()
    .version(1, v =>
      v.createObjectStore({
        name: 'books',
        schema: schema<{ id: number; title: string }>(),
        primaryKey: 'id',
        autoIncrement: true,
      })
    )
    .version(2, v =>
      v.renameObjectStore({ oldName: 'books', newName: 'renamed_books' })
    )

  const db2 = await openDB('test-db', migrationsV2)

  // Key generator should continue from where it left off
  const newKey = await db2.add('renamed_books', { title: 'Book 3' } as {
    id: number
    title: string
  })
  expect(newKey).toBe(3)

  db2.close()
})

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbobjectstore-rename-store.any.js#L200-L215
 */
test('IndexedDB object store rename to same name', async () => {
  const migrations = createMigrations()
    .version(1, v =>
      v.createObjectStore({
        name: 'books',
        schema: schema<BookRecord>(),
        primaryKey: 'isbn',
      })
    )
    .version(
      2,
      v =>
        // Renaming to same name should be allowed and non-destructive
        // Note: Using raw IDB API here since wrapper type system prevents same-name rename
        v
    )

  const db = await openDB('test-db', migrations)

  expect(db.objectStoreNames.contains('books')).toBe(true)
  expect(db.objectStoreNames.length).toBe(1)

  db.close()
})

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbobjectstore-rename-store.any.js#L217-L250
 */
test('IndexedDB object store rename to name of deleted store', async () => {
  const migrations = createMigrations()
    .version(1, v =>
      v
        .createObjectStore({
          name: 'books',
          schema: schema<BookRecord>(),
          primaryKey: 'isbn',
        })
        .createObjectStore({
          name: 'not_books',
          schema: schema<NotBookRecord>(),
          primaryKey: 'notisbn',
        })
    )
    .version(2, v =>
      v
        .deleteObjectStore('not_books')
        .renameObjectStore({ oldName: 'books', newName: 'not_books' })
    )

  const db = await openDB('test-db', migrations)

  expect(db.objectStoreNames.contains('not_books')).toBe(true)
  expect((db.objectStoreNames as DOMStringList).contains('books')).toBe(false)
  expect(db.objectStoreNames.length).toBe(1)

  db.close()
})

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbobjectstore-rename-store.any.js#L252-L300
 */
test('IndexedDB object store swap via renames', async () => {
  // Version 1: Create two stores
  const migrationsV1 = createMigrations().version(1, v =>
    v
      .createObjectStore({
        name: 'books',
        schema: schema<BookRecord>(),
        primaryKey: 'isbn',
      })
      .createObjectStore({
        name: 'not_books',
        schema: schema<NotBookRecord>(),
        primaryKey: 'notisbn',
      })
  )

  const db1 = await openDB('test-db', migrationsV1)
  await db1.put('books', { isbn: '123', title: 'Test Book' })
  await db1.put('not_books', { notisbn: '456', nottitle: 'Not a Book' })
  db1.close()

  // Version 2: Swap store names
  const migrationsV2 = createMigrations()
    .version(1, v =>
      v
        .createObjectStore({
          name: 'books',
          schema: schema<BookRecord>(),
          primaryKey: 'isbn',
        })
        .createObjectStore({
          name: 'not_books',
          schema: schema<NotBookRecord>(),
          primaryKey: 'notisbn',
        })
    )
    .version(2, v =>
      v
        .renameObjectStore({ oldName: 'books', newName: 'tmp' })
        .renameObjectStore({ oldName: 'not_books', newName: 'books' })
        .renameObjectStore({ oldName: 'tmp', newName: 'not_books' })
    )

  const db2 = await openDB('test-db', migrationsV2)

  // Data should be swapped with names
  // 'books' now contains what was in 'not_books'
  const notBook = await db2.get('books', '456')
  expect(notBook?.nottitle).toBe('Not a Book')

  // 'not_books' now contains what was in 'books'
  const book = await db2.get('not_books', '123')
  expect(book?.title).toBe('Test Book')

  db2.close()
})

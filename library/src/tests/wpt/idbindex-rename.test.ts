/**
 * IDBIndex rename Tests
 *
 * Ported from WPT idbindex-rename.any.js
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbindex-rename.any.js
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
  author: string
}

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbindex-rename.any.js#L64-L100
 */
test('IndexedDB index rename in new transaction', async () => {
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
  await db1.put('books', { isbn: '123', title: 'Test Book', author: 'Author' })
  db1.close()

  // Version 2: Rename index
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
      v.renameIndex({
        storeName: 'books',
        oldIndexName: 'by_title',
        newIndexName: 'renamed_title',
      })
    )

  const db2 = await openDB('test-db', migrationsV2)

  const tx = db2.transaction('books', 'readonly')
  const store = tx.objectStore('books')

  expect(store.indexNames.contains('renamed_title')).toBe(true)
  expect((store.indexNames as DOMStringList).contains('by_title')).toBe(false)

  // Index should still work
  const index = store.index('renamed_title')
  const book = await index.get('Test Book')
  expect(book?.isbn).toBe('123')

  await tx.done
  db2.close()
})

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbindex-rename.any.js#L102-L125
 */
test('IndexedDB index rename in same transaction as creation', async () => {
  const migrations = createMigrations().version(1, v =>
    v
      .createObjectStore({
        name: 'books',
        schema: schema<BookRecord>(),
        primaryKey: 'isbn',
      })
      .createIndex('by_title', { storeName: 'books', keyPath: 'title' })
      .renameIndex({
        storeName: 'books',
        oldIndexName: 'by_title',
        newIndexName: 'renamed_title',
      })
  )

  const db = await openDB('test-db', migrations)

  const tx = db.transaction('books', 'readonly')
  const store = tx.objectStore('books')

  expect(store.indexNames.contains('renamed_title')).toBe(true)
  expect((store.indexNames as DOMStringList).contains('by_title')).toBe(false)

  await tx.done
  db.close()
})

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbindex-rename.any.js#L127-L145
 */
test('IndexedDB index rename preserves configuration', async () => {
  // Version 1: Create unique index
  const migrationsV1 = createMigrations().version(1, v =>
    v
      .createObjectStore({
        name: 'books',
        schema: schema<BookRecord>(),
        primaryKey: 'isbn',
      })
      .createIndex('by_title', {
        storeName: 'books',
        keyPath: 'title',
        unique: true,
      })
  )

  const db1 = await openDB('test-db', migrationsV1)
  db1.close()

  // Version 2: Rename index
  const migrationsV2 = createMigrations()
    .version(1, v =>
      v
        .createObjectStore({
          name: 'books',
          schema: schema<BookRecord>(),
          primaryKey: 'isbn',
        })
        .createIndex('by_title', {
          storeName: 'books',
          keyPath: 'title',
          unique: true,
        })
    )
    .version(2, v =>
      v.renameIndex({
        storeName: 'books',
        oldIndexName: 'by_title',
        newIndexName: 'renamed_title',
      })
    )

  const db2 = await openDB('test-db', migrationsV2)

  const tx = db2.transaction('books', 'readonly')
  const store = tx.objectStore('books')
  const index = store.index('renamed_title')

  expect(index.keyPath).toBe('title')
  expect(index.unique).toBe(true)
  expect(index.multiEntry).toBe(false)

  await tx.done
  db2.close()
})

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbindex-rename.any.js#L167-L200
 */
test('IndexedDB index rename to name of deleted index', async () => {
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
      v.deleteIndex('by_author', { storeName: 'books' }).renameIndex({
        storeName: 'books',
        oldIndexName: 'by_title',
        newIndexName: 'by_author',
      })
    )

  const db = await openDB('test-db', migrations)

  const tx = db.transaction('books', 'readonly')
  const store = tx.objectStore('books')

  expect(store.indexNames.contains('by_author')).toBe(true)
  expect((store.indexNames as DOMStringList).contains('by_title')).toBe(false)
  expect(store.indexNames.length).toBe(1)

  // The renamed index should have title as keyPath
  const index = store.index('by_author')
  expect(index.keyPath).toBe('title')

  await tx.done
  db.close()
})

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbindex-rename.any.js#L202-L250
 */
test('IndexedDB index swap via renames', async () => {
  // Version 1: Create two indexes
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
  await db1.put('books', {
    isbn: '123',
    title: 'Test Book',
    author: 'Test Author',
  })
  db1.close()

  // Version 2: Swap index names
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
      v
        .renameIndex({
          storeName: 'books',
          oldIndexName: 'by_title',
          newIndexName: 'tmp',
        })
        .renameIndex({
          storeName: 'books',
          oldIndexName: 'by_author',
          newIndexName: 'by_title',
        })
        .renameIndex({
          storeName: 'books',
          oldIndexName: 'tmp',
          newIndexName: 'by_author',
        })
    )

  const db2 = await openDB('test-db', migrationsV2)

  const tx = db2.transaction('books', 'readonly')
  const store = tx.objectStore('books')

  // Names exist
  expect(store.indexNames.contains('by_title')).toBe(true)
  expect(store.indexNames.contains('by_author')).toBe(true)
  expect((store.indexNames as DOMStringList).contains('tmp')).toBe(false)

  // KeyPaths should be swapped
  const byTitle = store.index('by_title')
  const byAuthor = store.index('by_author')
  expect(byTitle.keyPath).toBe('author') // Was originally by_author
  expect(byAuthor.keyPath).toBe('title') // Was originally by_title

  // Indexes should work with swapped keyPaths
  const bookByAuthor = await byTitle.get('Test Author')
  expect(bookByAuthor?.isbn).toBe('123')

  const bookByTitle = await byAuthor.get('Test Book')
  expect(bookByTitle?.isbn).toBe('123')

  await tx.done
  db2.close()
})

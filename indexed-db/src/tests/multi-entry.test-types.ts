import z from 'zod'
import { openDB } from '../lib/idb-adapter'
import { createMigrations } from '../lib/migration-builder'

void async function testMultiEntryIndexQueriesByElementType() {
  const migrations = createMigrations()
    .version(1, v =>
      v.createObjectStore({
        name: 'posts',
        schema: z.object({
          id: z.string(),
          title: z.string(),
          tags: z.array(z.string()),
        }),
        primaryKey: 'id',
      })
    )
    .version(2, v =>
      v.createIndex('byTag', {
        storeName: 'posts',
        keyPath: 'tags',
        multiEntry: true,
      })
    )

  const db = await openDB('test-db', migrations)

  // With multiEntry: true, query by individual element (string), not array
  await db.getFromIndex('posts', 'byTag', 'javascript')

  // @ts-expect-error should not accept array when multiEntry is true
  await db.getFromIndex('posts', 'byTag', ['javascript'])
}

void function testMultiEntryRejectsObjectArrayElements() {
  createMigrations()
    .version(1, v =>
      v.createObjectStore({
        name: 'posts',
        schema: z.object({
          id: z.string(),
          authors: z.array(z.object({ id: z.string(), name: z.string() })),
        }),
        primaryKey: 'id',
      })
    )
    .version(2, v =>
      v.createIndex('byAuthor', {
        storeName: 'posts',
        // @ts-expect-error multiEntry requires array elements to be valid IDB keys
        keyPath: 'authors',
        multiEntry: true,
      })
    )
}

void function testMultiEntryRejectsCompositeKeyPath() {
  createMigrations()
    .version(1, v =>
      v.createObjectStore({
        name: 'posts',
        schema: z.object({
          id: z.string(),
          category: z.string(),
          subcategory: z.string(),
        }),
        primaryKey: 'id',
      })
    )
    .version(2, v =>
      v.createIndex('byCategory', {
        storeName: 'posts',
        // @ts-expect-error multiEntry cannot be used with composite keyPath
        keyPath: ['category', 'subcategory'],
        multiEntry: true,
      })
    )
}

void function testMultiEntryRejectsNonArrayKeyPath() {
  createMigrations()
    .version(1, v =>
      v.createObjectStore({
        name: 'posts',
        schema: z.object({
          id: z.string(),
          title: z.string(),
        }),
        primaryKey: 'id',
      })
    )
    .version(2, v =>
      v.createIndex('byTitle', {
        storeName: 'posts',
        // @ts-expect-error multiEntry requires keyPath to point to an array
        keyPath: 'title',
        multiEntry: true,
      })
    )
}

void function testMultiEntryInvalidatedByTransformRemovingKeyPath() {
  createMigrations()
    .version(1, v =>
      v.createObjectStore({
        name: 'posts',
        schema: z.object({
          id: z.string(),
          tags: z.array(z.string()),
        }),
        primaryKey: 'id',
      })
    )
    .version(2, v =>
      v.createIndex('byTag', {
        storeName: 'posts',
        keyPath: 'tags',
        multiEntry: true,
      })
    )
    .version(3, v =>
      // @ts-expect-error transform removes 'tags' field, invalidating the multiEntry index
      v.transformRecords('posts', post => ({
        id: post.id,
        categories: ['general'],
      }))
    )
}

void async function testMultiEntryWidenedArrayTypeAllowsBothTypes() {
  const migrations = createMigrations()
    .version(1, v =>
      v.createObjectStore({
        name: 'posts',
        schema: z.object({
          id: z.string(),
          codes: z.array(z.number()),
        }),
        primaryKey: 'id',
      })
    )
    .version(2, v =>
      v.createIndex('byCode', {
        storeName: 'posts',
        keyPath: 'codes',
        multiEntry: true,
      })
    )
    // Widen codes from number[] to (string | number)[]
    .version(3, v => v.updateSchema<'posts', { codes: (string | number)[] }>())

  const db = await openDB('test-db', migrations)

  // After widening, both number and string should be valid query keys
  await db.getFromIndex('posts', 'byCode', 42)
  await db.getFromIndex('posts', 'byCode', 'ABC123')
}

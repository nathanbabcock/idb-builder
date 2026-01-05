/**
 * Type tests for index query type inference.
 * Investigating whether index key types are correctly inferred for getFromIndex.
 */

import { z } from 'zod'
import { openDB } from '../lib/idb-adapter'
import { createMigrations } from '../lib/migration-builder'

// Single version with index created in same version as store
void async function testSingleVersionIndexQuery() {
  const migrations = createMigrations().version(1, v =>
    v
      .createObjectStore({
        name: 'users',
        schema: z.object({
          id: z.string(),
          email: z.string(),
          age: z.number(),
        }),
        primaryKey: 'id',
      })
      .createIndex('byEmail', { storeName: 'users', keyPath: 'email' })
      .createIndex('byAge', { storeName: 'users', keyPath: 'age' })
  )

  const db = await openDB('test', migrations)

  // These should accept string/number directly, not require IDBKeyRange
  await db.getFromIndex('users', 'byEmail', 'test@example.com')
  await db.getFromIndex('users', 'byAge', 25)
}

// Two versions: store in v1, index in v2
void async function testTwoVersionIndexQuery() {
  const migrations = createMigrations()
    .version(1, v =>
      v.createObjectStore({
        name: 'users',
        schema: z.object({
          id: z.string(),
          email: z.string(),
          age: z.number(),
        }),
        primaryKey: 'id',
      })
    )
    .version(2, v =>
      v
        .createIndex('byEmail', { storeName: 'users', keyPath: 'email' })
        .createIndex('byAge', { storeName: 'users', keyPath: 'age' })
    )

  const db = await openDB('test', migrations)

  // Do these still work with two versions?
  await db.getFromIndex('users', 'byEmail', 'test@example.com')
  await db.getFromIndex('users', 'byAge', 25)
}

// Three versions: store in v1, first index in v2, second index in v3
void async function testThreeVersionIndexQuery() {
  const migrations = createMigrations()
    .version(1, v =>
      v.createObjectStore({
        name: 'users',
        schema: z.object({
          id: z.string(),
          email: z.string(),
          age: z.number(),
        }),
        primaryKey: 'id',
      })
    )
    .version(2, v =>
      v.createIndex('byEmail', { storeName: 'users', keyPath: 'email' })
    )
    .version(3, v =>
      v.createIndex('byAge', { storeName: 'users', keyPath: 'age' })
    )

  const db = await openDB('test', migrations)

  // Do these still work with three versions?
  await db.getFromIndex('users', 'byEmail', 'test@example.com')
  await db.getFromIndex('users', 'byAge', 25)
}

// Test getAllFromIndex as well
void async function testGetAllFromIndex() {
  const migrations = createMigrations().version(1, v =>
    v
      .createObjectStore({
        name: 'users',
        schema: z.object({
          id: z.string(),
          role: z.string(),
        }),
        primaryKey: 'id',
      })
      .createIndex('byRole', { storeName: 'users', keyPath: 'role' })
  )

  const db = await openDB('test', migrations)

  // Should accept string directly
  await db.getAllFromIndex('users', 'byRole', 'admin')
}

// Test with multiEntry index
void async function testMultiEntryIndexQuery() {
  const migrations = createMigrations().version(1, v =>
    v
      .createObjectStore({
        name: 'posts',
        schema: z.object({
          id: z.string(),
          tags: z.array(z.string()),
        }),
        primaryKey: 'id',
      })
      .createIndex('byTag', {
        storeName: 'posts',
        keyPath: 'tags',
        multiEntry: true,
      })
  )

  const db = await openDB('test', migrations)

  // multiEntry index should accept individual element type (string), not array
  await db.getFromIndex('posts', 'byTag', 'typescript')
  await db.getAllFromIndex('posts', 'byTag', 'javascript')
}

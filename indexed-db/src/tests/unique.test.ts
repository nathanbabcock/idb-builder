import { IDBFactory } from 'fake-indexeddb'
import { beforeEach, expect, test } from 'vitest'
import { z } from 'zod'
import { openDB } from '../lib/idb-adapter'
import { createMigrations } from '../lib/migration-builder'

import 'fake-indexeddb/auto'

beforeEach(() => {
  indexedDB = new IDBFactory()
})

test('creates unique index', async () => {
  const migrations = createMigrations()
    .version(1, v =>
      v.createObjectStore({
        name: 'users',
        schema: z.object({
          id: z.string(),
          email: z.string(),
        }),
        primaryKey: 'id',
      })
    )
    .version(2, v =>
      v.createIndex('byEmail', {
        storeName: 'users',
        keyPath: 'email',
        unique: true,
      })
    )

  const db = await openDB('test-db', migrations)

  const tx = db.transaction('users', 'readonly')
  const index = tx.store.index('byEmail')
  expect(index.unique).toBe(true)

  db.close()
})

test('unique index rejects duplicate values', async () => {
  const migrations = createMigrations()
    .version(1, v =>
      v.createObjectStore({
        name: 'users',
        schema: z.object({
          id: z.string(),
          email: z.string(),
        }),
        primaryKey: 'id',
      })
    )
    .version(2, v =>
      v.createIndex('byEmail', {
        storeName: 'users',
        keyPath: 'email',
        unique: true,
      })
    )

  const db = await openDB('test-db', migrations)

  // First insert should succeed
  await db.put('users', { id: '1', email: 'test@example.com' })

  // Second insert with same email should fail
  await expect(
    db.put('users', { id: '2', email: 'test@example.com' })
  ).rejects.toThrow()

  db.close()
})

test('non-unique index allows duplicate values', async () => {
  const migrations = createMigrations()
    .version(1, v =>
      v.createObjectStore({
        name: 'users',
        schema: z.object({
          id: z.string(),
          email: z.string(),
        }),
        primaryKey: 'id',
      })
    )
    .version(2, v =>
      v.createIndex('byEmail', {
        storeName: 'users',
        keyPath: 'email',
        unique: false,
      })
    )

  const db = await openDB('test-db', migrations)

  // Both inserts should succeed with duplicate email
  await db.put('users', { id: '1', email: 'test@example.com' })
  await db.put('users', { id: '2', email: 'test@example.com' })

  // Should have 2 records
  const all = await db.getAll('users')
  expect(all).toHaveLength(2)

  db.close()
})

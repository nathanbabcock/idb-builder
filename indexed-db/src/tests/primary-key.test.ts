import { IDBFactory } from 'fake-indexeddb'
import { beforeEach, expect, test } from 'vitest'
import { z } from 'zod'
import { openDB } from '../lib/idb-adapter'
import { createMigrations } from '../lib/migration-builder'

import 'fake-indexeddb/auto'

beforeEach(() => {
  indexedDB = new IDBFactory()
})

test('creates object store with keyPath and verifies lookup', async () => {
  const userSchema = z.object({
    id: z.string(),
    name: z.string(),
    email: z.string(),
  })

  const migrations = createMigrations().version(1, v =>
    v.createObjectStore('users', userSchema, { primaryKey: 'id' })
  )

  const db = await openDB('test-db', migrations)

  await db.put('users', {
    id: 'user-1',
    name: 'Alice',
    email: 'alice@example.com',
  })
  await db.put('users', { id: 'user-2', name: 'Bob', email: 'bob@example.com' })

  const user1 = await db.get('users', 'user-1')
  const user2 = await db.get('users', 'user-2')

  expect(user1).toEqual({
    id: 'user-1',
    name: 'Alice',
    email: 'alice@example.com',
  })
  expect(user2).toEqual({ id: 'user-2', name: 'Bob', email: 'bob@example.com' })

  db.close()
})

test('creates object store without keyPath (out-of-line keys)', async () => {
  const userSchema = z.object({ name: z.string() })

  const migrations = createMigrations().version(1, v =>
    v.createObjectStore('users', userSchema)
  )

  const db = await openDB('test-db', migrations)

  await db.put('users', { name: 'Alice' }, 'user-1')
  await db.put('users', { name: 'Bob' }, 'user-2')

  const user1 = await db.get('users', 'user-1')
  const user2 = await db.get('users', 'user-2')

  expect(user1).toEqual({ name: 'Alice' })
  expect(user2).toEqual({ name: 'Bob' })

  db.close()
})

test('creates object store with nested keyPath', async () => {
  const documentSchema = z.object({
    metadata: z.object({
      id: z.string(),
      version: z.number(),
    }),
    title: z.string(),
    content: z.string(),
  })

  const migrations = createMigrations().version(1, v =>
    v.createObjectStore('documents', documentSchema, {
      primaryKey: 'metadata.id',
    })
  )

  const db = await openDB('test-db', migrations)

  await db.put('documents', {
    metadata: { id: 'doc-1', version: 1 },
    title: 'First Document',
    content: 'This is the first document',
  })
  await db.put('documents', {
    metadata: { id: 'doc-2', version: 2 },
    title: 'Second Document',
    content: 'This is the second document',
  })

  const doc1 = await db.get('documents', 'doc-1')
  const doc2 = await db.get('documents', 'doc-2')

  expect(doc1).toEqual({
    metadata: { id: 'doc-1', version: 1 },
    title: 'First Document',
    content: 'This is the first document',
  })
  expect(doc2).toEqual({
    metadata: { id: 'doc-2', version: 2 },
    title: 'Second Document',
    content: 'This is the second document',
  })

  db.close()
})

import { IDBFactory } from 'fake-indexeddb'
import { beforeEach, expect, test } from 'vitest'
import { openDB } from '../lib/idb-adapter'
import { createMigrations } from '../lib/migration-builder'
import { schema } from '../lib/schema'

import 'fake-indexeddb/auto'

beforeEach(() => {
  indexedDB = new IDBFactory()
})

test('creates object store with keyPath and verifies lookup', async () => {
  const migrations = createMigrations().version(1, v =>
    v.createObjectStore({
      name: 'users',
      schema: schema<{ id: string; name: string; email: string }>(),
      primaryKey: 'id',
    })
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
  const migrations = createMigrations().version(1, v =>
    v.createObjectStore({
      name: 'users',
      schema: schema<{ name: string }>(),
    })
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
  const migrations = createMigrations().version(1, v =>
    v.createObjectStore({
      name: 'documents',
      schema: schema<{
        metadata: { id: string; version: number }
        title: string
        content: string
      }>(),
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

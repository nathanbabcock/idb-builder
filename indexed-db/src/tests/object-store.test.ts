import { IDBFactory } from 'fake-indexeddb'
import { beforeEach, expect, test } from 'vitest'
import { z } from 'zod'
import { openDB } from '../lib/idb-adapter'
import { createMigrations } from '../lib/migration-builder'

import 'fake-indexeddb/auto'

beforeEach(() => {
  indexedDB = new IDBFactory()
})

test('creates object store', async () => {
  const migrations = createMigrations().version(1, v =>
    v.createObjectStore({
      name: 'users',
      schema: z.object({}),
    })
  )

  const db = await openDB('test-db', migrations)

  expect(db.objectStoreNames.contains('users')).toBe(true)

  db.close()
})

test('deletes object store', async () => {
  const migrations = createMigrations()
    .version(1, v =>
      v.createObjectStore({
        name: 'users',
        schema: z.object({}),
      })
    )
    .version(2, v => v.deleteObjectStore('users'))

  const db = await openDB('test-db', migrations)

  expect(db.objectStoreNames.contains('users')).toBe(false)

  db.close()
})

test('creates multiple object stores', async () => {
  const migrations = createMigrations().version(1, v =>
    v
      .createObjectStore({
        name: 'users',
        schema: z.object({}),
      })
      .createObjectStore({
        name: 'posts',
        schema: z.object({}),
      })
      .createObjectStore({
        name: 'comments',
        schema: z.object({}),
      })
  )

  const db = await openDB('test-db', migrations)

  expect(db.objectStoreNames.contains('users')).toBe(true)
  expect(db.objectStoreNames.contains('posts')).toBe(true)
  expect(db.objectStoreNames.contains('comments')).toBe(true)

  db.close()
})

test('deletes multiple object stores', async () => {
  const migrations = createMigrations()
    .version(1, v =>
      v
        .createObjectStore({
          name: 'users',
          schema: z.object({}),
        })
        .createObjectStore({
          name: 'posts',
          schema: z.object({}),
        })
        .createObjectStore({
          name: 'comments',
          schema: z.object({}),
        })
    )
    .version(2, v => v.deleteObjectStore('users').deleteObjectStore('comments'))

  const db = await openDB('test-db', migrations)

  expect(db.objectStoreNames.contains('posts')).toBe(true)

  // @ts-expect-error object store does not exist
  expect(db.objectStoreNames.contains('users')).toBe(false)

  // @ts-expect-error object store does not exist
  expect(db.objectStoreNames.contains('comments')).toBe(false)

  db.close()
})

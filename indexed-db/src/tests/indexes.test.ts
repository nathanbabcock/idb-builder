import { IDBFactory } from 'fake-indexeddb'
import { beforeEach, expect, test } from 'vitest'
import { openDB } from '../lib/idb-adapter'
import { createMigrations } from '../lib/migration-builder'
import { schema } from '../lib/schema'

import 'fake-indexeddb/auto'

beforeEach(() => {
  indexedDB = new IDBFactory()
})

test('retrieves record by index', async () => {
  const migrations = createMigrations().version(1, v =>
    v
      .createObjectStore({
        name: 'users',
        schema: schema<{ id: string; email: string }>(),
        primaryKey: 'id',
      })
      .createIndex('byEmail', { storeName: 'users', keyPath: 'email' })
  )

  const db = await openDB('test-db', migrations)

  await db.put('users', { id: '1', email: 'alice@example.com' })
  await db.put('users', { id: '2', email: 'bob@example.com' })

  const user = await db.getFromIndex('users', 'byEmail', 'bob@example.com')

  expect(user).toEqual({ id: '2', email: 'bob@example.com' })

  db.close()
})

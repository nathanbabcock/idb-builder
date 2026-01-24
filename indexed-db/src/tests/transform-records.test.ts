import { IDBFactory } from 'fake-indexeddb'
import { beforeEach, expect, test } from 'vitest'
import { openDB } from '../lib/idb-adapter'
import { createMigrations } from '../lib/migration-builder'
import { schema } from '../lib/schema'

import 'fake-indexeddb/auto'

beforeEach(() => {
  indexedDB = new IDBFactory()
})

test('records are transformed from firstName/lastName to single name field', async () => {
  const v1Migrations = createMigrations().version(1, v =>
    v.createObjectStore({
      name: 'users',
      schema: schema<{ id: string; firstName: string; lastName: string }>(),
      primaryKey: 'id',
    })
  )

  // Insert record using v1 schema
  const db1 = await openDB('test-db', v1Migrations)
  await db1.put('users', { id: '1', firstName: 'Alice', lastName: 'Smith' })
  await db1.put('users', { id: '2', firstName: 'Bob', lastName: 'Jones' })
  db1.close()

  // Reopen with v2 schema that transforms firstName/lastName into name
  const v2Migrations = createMigrations()
    .version(1, v =>
      v.createObjectStore({
        name: 'users',
        schema: schema<{ id: string; firstName: string; lastName: string }>(),
        primaryKey: 'id',
      })
    )
    .version(2, v =>
      v.transformRecords('users', user => ({
        id: user.id,
        name: `${user.firstName} ${user.lastName}`,
      }))
    )

  const db2 = await openDB('test-db', v2Migrations)

  // Records should now have combined name field
  const alice = await db2.get('users', '1')
  expect(alice).toEqual({ id: '1', name: 'Alice Smith' })

  const bob = await db2.get('users', '2')
  expect(bob).toEqual({ id: '2', name: 'Bob Jones' })

  db2.close()
})

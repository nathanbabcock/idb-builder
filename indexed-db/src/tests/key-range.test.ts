import { IDBFactory } from 'fake-indexeddb'
import { beforeEach, expect, test } from 'vitest'
import { z } from 'zod'
import { openDB } from '../lib/idb-adapter'
import { KeyRange } from '../lib/key-range'
import { createMigrations } from '../lib/migration-builder'

import 'fake-indexeddb/auto'

beforeEach(() => {
  indexedDB = new IDBFactory()
})

test('KeyRange.gte().lt() retrieves records in range', async () => {
  const migrations = createMigrations().version(1, v =>
    v.createObjectStore({
      name: 'scores',
      schema: z.object({ id: z.number(), value: z.number() }),
      primaryKey: 'id',
    })
  )

  const db = await openDB('test-db', migrations)

  await db.put('scores', { id: 1, value: 10 })
  await db.put('scores', { id: 2, value: 20 })
  await db.put('scores', { id: 3, value: 30 })
  await db.put('scores', { id: 4, value: 40 })
  await db.put('scores', { id: 5, value: 50 })

  // Get records where id >= 2 and id < 5
  const range = KeyRange.gte(2).lt(5)
  const results = await db.getAll('scores', range.toIDBKeyRange())

  expect(results).toEqual([
    { id: 2, value: 20 },
    { id: 3, value: 30 },
    { id: 4, value: 40 },
  ])

  db.close()
})

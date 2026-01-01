import { IDBFactory } from 'fake-indexeddb'
import { beforeEach, expect, test } from 'vitest'
import { z } from 'zod'
import { openDB } from '../lib/idb-adapter'
import { createMigrations } from '../lib/migration-builder'

import 'fake-indexeddb/auto'

beforeEach(() => {
  indexedDB = new IDBFactory()
})

test('out-of-line auto-increment generates sequential keys', async () => {
  const migrations = createMigrations().version(1, v =>
    v.createObjectStore('events', z.object({ name: z.string() }), {
      autoIncrement: true,
    })
  )

  const db = await openDB('test-db', migrations)

  // Insert with explicit key 0
  await db.put('events', { name: 'first' }, 0)

  // Insert without key - should auto-generate 1
  const autoKey = await db.put('events', { name: 'second' })

  expect(autoKey).toBe(1)

  // Verify both records exist
  expect(await db.get('events', 0)).toEqual({ name: 'first' })
  expect(await db.get('events', 1)).toEqual({ name: 'second' })

  db.close()
})

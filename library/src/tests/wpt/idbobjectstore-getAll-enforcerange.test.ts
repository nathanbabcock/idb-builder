/**
 * IndexedDB: IDBObjectStore getAll() uses [EnforceRange] Tests
 *
 * Ported from WPT idbobjectstore-getAll-enforcerange.any.js
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbobjectstore-getAll-enforcerange.any.js
 */

import './wpt-setup'
import { expect, test } from 'vitest'
import { openDB } from '../../lib/idb-adapter'
import { createMigrations } from '../../lib/migration-builder'
import { schema } from '../../lib/schema'

test('IDBObjectStore.getAll() uses [EnforceRange]', async () => {
  const migrations = createMigrations().version(1, v =>
    v.createObjectStore({
      name: 'store',
      schema: schema<string>(),
    })
  )

  const db = await openDB('test-db', migrations)

  try {
    const tx = db.transaction('store', 'readonly')
    const store = tx.objectStore('store')

    const invalidCounts = [
      NaN,
      Infinity,
      -Infinity,
      -1,
      -Number.MAX_SAFE_INTEGER,
    ]

    for (const count of invalidCounts) {
      expect(() => {
        store.getAll(null, count)
      }).toThrow(TypeError)
    }

    await tx.done
  } finally {
    db.close()
  }
})

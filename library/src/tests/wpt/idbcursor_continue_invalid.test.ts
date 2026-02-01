/**
 * IDBCursor.continue() - invalid Tests
 *
 * Ported from WPT idbcursor_continue_invalid.any.js
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbcursor_continue_invalid.any.js
 */

import './wpt-setup'
import { expect, test } from 'vitest'
import { openDB } from '../../lib/idb-adapter'
import { createMigrations } from '../../lib/migration-builder'
import { schema } from '../../lib/schema'

async function setupDb() {
  const migrations = createMigrations().version(1, v =>
    v
      .createObjectStore({
        name: 'test',
        schema: schema<string>(),
      })
      .createIndex('index', {
        storeName: 'test',
        keyPath: '',
      })
  )

  const db = await openDB('test-db', migrations)

  // Add test data
  const txn = db.transaction('test', 'readwrite')
  await txn.objectStore('test').add('data', 1)
  await txn.objectStore('test').add('data2', 2)
  await txn.done

  return db
}

test('Attempt to call continue two times', async () => {
  const db = await setupDb()

  try {
    const txn = db.transaction('test', 'readonly')
    const index = txn.objectStore('test').index('index')

    let count = 0
    let cursor = await index.openCursor()

    while (cursor) {
      // First continue is valid
      const continuePromise = cursor.continue(undefined)

      // Second try should throw InvalidStateError
      expect(() => {
        cursor!.continue()
      }).toThrow(expect.objectContaining({ name: 'InvalidStateError' }))

      // Third continue should also throw
      expect(() => {
        // @ts-expect-error - testing invalid key type
        cursor!.continue(3)
      }).toThrow(expect.objectContaining({ name: 'InvalidStateError' }))

      count++
      cursor = await continuePromise
    }

    expect(count).toBe(2)
    await txn.done
  } finally {
    db.close()
  }
})

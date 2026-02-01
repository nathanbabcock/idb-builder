/**
 * IDBObjectStore.delete() and IDBCursor.continue() Tests
 *
 * Ported from WPT idbcursor_continue_delete_objectstore.any.js
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbcursor_continue_delete_objectstore.any.js
 */

import './wpt-setup'
import { expect, test } from 'vitest'
import { openDB } from '../../lib/idb-adapter'
import { createMigrations } from '../../lib/migration-builder'
import { schema } from '../../lib/schema'

interface TestRecord {
  pKey: string
}

test('Object store - remove a record from the object store while iterating cursor', async () => {
  const records: TestRecord[] = [
    { pKey: 'primaryKey_0' },
    { pKey: 'primaryKey_1' },
    { pKey: 'primaryKey_2' },
  ]

  // This is a key that is not present in the database, but that is known to
  // be relevant to a forward iteration of the above keys by comparing to be
  // greater than all of them.
  const plausibleFutureKey = 'primaryKey_9'

  const migrations = createMigrations().version(1, v =>
    v.createObjectStore({
      name: 'test',
      schema: schema<TestRecord>(),
      primaryKey: 'pKey',
    })
  )

  const db = await openDB('test-db', migrations)

  try {
    // Add test data
    const txn1 = db.transaction('test', 'readwrite')
    for (const record of records) {
      await txn1.objectStore('test').add(record)
    }
    await txn1.done

    // Cursor iteration with deletion
    const txn2 = db.transaction('test', 'readwrite')
    const store = txn2.objectStore('test')

    let iteration = 0
    let cursor = await store.openCursor()

    while (cursor !== null) {
      if (iteration === 0) {
        // Delete a key that doesn't exist but is "in the future" of the cursor
        await store.delete(plausibleFutureKey)
        expect(cursor.value.pKey).toBe(records[0].pKey)

        // Issue continue and then delete record 2
        const continuePromise = cursor.continue()
        await store.delete(records[2].pKey)
        cursor = await continuePromise
      } else if (iteration === 1) {
        expect(cursor.value.pKey).toBe(records[1].pKey)
        cursor = await cursor.continue()
      } else if (iteration === 2) {
        // Record 2 was deleted, so cursor should be null
        expect(cursor).toBeNull()
        break
      }
      iteration++
    }

    await txn2.done

    // Verify record was deleted
    const txn3 = db.transaction('test', 'readonly')
    const store3 = txn3.objectStore('test')

    let count = 0
    let verifyCursor = await store3.openCursor()
    while (verifyCursor) {
      expect(verifyCursor.value.pKey).toBe(records[count].pKey)
      count++
      verifyCursor = await verifyCursor.continue()
    }

    expect(count).toBe(2)
    await txn3.done
  } finally {
    db.close()
  }
})

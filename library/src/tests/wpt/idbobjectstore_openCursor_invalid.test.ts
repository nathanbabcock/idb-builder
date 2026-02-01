/**
 * IDBObjectStore.openCursor() - invalid Tests
 *
 * Ported from WPT idbobjectstore_openCursor_invalid.any.js
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbobjectstore_openCursor_invalid.any.js
 */

import './wpt-setup'
import { expect, test } from 'vitest'
import { openDB } from '../../lib/idb-adapter'
import { createMigrations } from '../../lib/migration-builder'
import { schema } from '../../lib/schema'

test('IDBObjectStore.openCursor() - invalid - pass something other than valid key/keyrange', async () => {
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

  try {
    // Add test data
    const txn = db.transaction('test', 'readwrite')
    await txn.objectStore('test').add('data', 1)
    await txn.objectStore('test').add('data2', 2)
    await txn.done

    const tx = db.transaction('test', 'readonly')
    const store = tx.objectStore('test')
    const index = store.index('index')

    // Invalid object query should throw DataError
    expect(() => {
      // @ts-expect-error - testing invalid input
      index.openCursor({ lower: 'a' })
    }).toThrow(expect.objectContaining({ name: 'DataError' }))

    expect(() => {
      // @ts-expect-error - testing invalid input
      index.openCursor({ lower: 'a', lowerOpen: false })
    }).toThrow(expect.objectContaining({ name: 'DataError' }))

    expect(() => {
      // @ts-expect-error - testing invalid input
      index.openCursor({
        lower: 'a',
        lowerOpen: false,
        upper: null,
        upperOpen: false,
      })
    }).toThrow(expect.objectContaining({ name: 'DataError' }))

    await tx.done
  } finally {
    db.close()
  }
})

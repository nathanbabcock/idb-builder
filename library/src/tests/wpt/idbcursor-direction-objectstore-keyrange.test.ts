/**
 * IDBCursor direction - object store with keyrange Tests
 *
 * Ported from WPT idbcursor-direction-objectstore-keyrange.any.js
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbcursor-direction-objectstore-keyrange.any.js
 */

import './wpt-setup'
import { expect, test } from 'vitest'
import { openDB } from '../../lib/idb-adapter'
import { createMigrations } from '../../lib/migration-builder'
import { schema } from '../../lib/schema'

type RecordType = string | number | string[]

const records: RecordType[] = [1337, 'Alice', 'Bob', 'Greg', 'Åke', ['Anne']]

const cases: Array<{
  dir: IDBCursorDirection
  expect: string[]
}> = [
  { dir: 'next', expect: ['Alice', 'Bob', 'Greg'] },
  { dir: 'prev', expect: ['Greg', 'Bob', 'Alice'] },
  { dir: 'nextunique', expect: ['Alice', 'Bob', 'Greg'] },
  { dir: 'prevunique', expect: ['Greg', 'Bob', 'Alice'] },
]

for (const testcase of cases) {
  test(`IDBCursor direction - object store with keyrange - ${testcase.dir}`, async () => {
    const migrations = createMigrations().version(1, v =>
      v.createObjectStore({
        name: 'test',
        schema: schema<RecordType>(),
      })
    )

    const db = await openDB('test-db', migrations)

    try {
      // Add test data - use record value as key
      const txn = db.transaction('test', 'readwrite')
      for (let i = 0; i < records.length; i++) {
        await txn.objectStore('test').add(records[i], records[i])
      }
      await txn.done

      // Query with keyrange
      const txn2 = db.transaction('test', 'readonly')
      const store = txn2.objectStore('test')

      const results: string[] = []
      let cursor = await store.openCursor(
        IDBKeyRange.bound('AA', 'ZZ'),
        testcase.dir
      )

      while (cursor) {
        results.push(cursor.value as string)
        cursor = await cursor.continue()
      }

      expect(results.length).toBe(testcase.expect.length)
      expect(results).toEqual(testcase.expect)

      await txn2.done
    } finally {
      db.close()
    }
  })
}

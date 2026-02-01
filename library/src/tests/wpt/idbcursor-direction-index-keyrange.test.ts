/**
 * IDBCursor direction - index with keyrange Tests
 *
 * Ported from WPT idbcursor-direction-index-keyrange.any.js
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbcursor-direction-index-keyrange.any.js
 */

import './wpt-setup'
import { expect, test } from 'vitest'
import { openDB } from '../../lib/idb-adapter'
import { createMigrations } from '../../lib/migration-builder'
import { schema } from '../../lib/schema'

interface TestRecord {
  name: string | number | string[]
}

const records: (string | number | string[])[] = [
  1337,
  'Alice',
  'Bob',
  'Bob',
  'Greg',
  'Åke',
  ['Anne'],
]

const cases: Array<{
  dir: IDBCursorDirection
  expect: string[]
}> = [
  { dir: 'next', expect: ['Alice:1', 'Bob:2', 'Bob:3', 'Greg:4'] },
  { dir: 'prev', expect: ['Greg:4', 'Bob:3', 'Bob:2', 'Alice:1'] },
  { dir: 'nextunique', expect: ['Alice:1', 'Bob:2', 'Greg:4'] },
  { dir: 'prevunique', expect: ['Greg:4', 'Bob:2', 'Alice:1'] },
]

for (const testcase of cases) {
  test(`IDBCursor direction - index with keyrange - ${testcase.dir}`, async () => {
    const migrations = createMigrations().version(1, v =>
      v
        .createObjectStore({
          name: 'test',
          schema: schema<TestRecord>(),
        })
        .createIndex('idx', {
          storeName: 'test',
          keyPath: 'name',
        })
    )

    const db = await openDB('test-db', migrations)

    try {
      // Add test data
      const txn = db.transaction('test', 'readwrite')
      for (let i = 0; i < records.length; i++) {
        await txn.objectStore('test').add({ name: records[i] }, i)
      }
      await txn.done

      // Query with keyrange
      const txn2 = db.transaction('test', 'readonly')
      const index = txn2.objectStore('test').index('idx')

      const results: string[] = []
      let cursor = await index.openCursor(
        IDBKeyRange.bound('AA', 'ZZ'),
        testcase.dir
      )

      while (cursor) {
        results.push(
          `${(cursor.value as TestRecord).name}:${cursor.primaryKey}`
        )
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

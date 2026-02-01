/**
 * IDBCursor direction - index Tests
 *
 * Ported from WPT idbcursor-direction-index.any.js
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbcursor-direction-index.any.js
 */

import './wpt-setup'
import { expect, test } from 'vitest'
import { openDB } from '../../lib/idb-adapter'
import { createMigrations } from '../../lib/migration-builder'
import { schema } from '../../lib/schema'

interface TestRecord {
  name: string
}

const records = ['Alice', 'Bob', 'Bob', 'Greg']

const cases: Array<{
  dir: IDBCursorDirection
  expect: string[]
}> = [
  { dir: 'next', expect: ['Alice:0', 'Bob:1', 'Bob:2', 'Greg:3'] },
  { dir: 'prev', expect: ['Greg:3', 'Bob:2', 'Bob:1', 'Alice:0'] },
  { dir: 'nextunique', expect: ['Alice:0', 'Bob:1', 'Greg:3'] },
  { dir: 'prevunique', expect: ['Greg:3', 'Bob:1', 'Alice:0'] },
]

for (const testcase of cases) {
  test(`IDBCursor direction - index - ${testcase.dir}`, async () => {
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

      // Query with direction
      const txn2 = db.transaction('test', 'readonly')
      const index = txn2.objectStore('test').index('idx')

      const results: string[] = []
      let cursor = await index.openCursor(undefined, testcase.dir)

      while (cursor) {
        results.push(`${cursor.value.name}:${cursor.primaryKey}`)
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

/**
 * indexedDB.databases() Tests
 *
 * Ported from WPT get-databases.any.js
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/get-databases.any.js
 */

import './wpt-setup'
import { expect, test } from 'vitest'
import { openDB } from '../../lib/idb-adapter'
import { createMigrations } from '../../lib/migration-builder'
import { schema } from '../../lib/schema'

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/get-databases.any.js#L4-L9
 */
test('Ensure that databases() returns a promise', async () => {
  const result = indexedDB.databases()
  expect(result).toBeInstanceOf(Promise)
  // Clean up by awaiting the result
  await result
})

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/get-databases.any.js#L11-L30
 */
test('Enumerate one database', async () => {
  const dbName = 'TestDatabase-' + Math.random()
  const migrations = createMigrations().version(1, v =>
    v.createObjectStore({
      name: 'store',
      schema: schema<string>(),
    })
  )

  const db = await openDB(dbName, migrations)

  try {
    const databases = await indexedDB.databases()

    // Find our database in the list
    const ourDb = databases.find(d => d.name === dbName)
    expect(ourDb).toBeDefined()
    expect(ourDb?.version).toBe(1)
  } finally {
    db.close()
    // Clean up
    indexedDB.deleteDatabase(dbName)
  }
})

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/get-databases.any.js#L32-L66
 */
test('Enumerate multiple databases', async () => {
  const prefix = 'TestDB-' + Math.random() + '-'
  const dbName1 = prefix + '1'
  const dbName2 = prefix + '2'
  const dbName3 = prefix + '3'

  const migrations1 = createMigrations().version(1, v =>
    v.createObjectStore({ name: 'store', schema: schema<string>() })
  )
  const migrations2 = createMigrations().version(1, v =>
    v.createObjectStore({ name: 'store', schema: schema<string>() })
  )
  const migrations2v2 = createMigrations()
    .version(1, v =>
      v.createObjectStore({ name: 'store', schema: schema<string>() })
    )
    .version(2, v =>
      v.createObjectStore({ name: 'store2', schema: schema<string>() })
    )
  const migrations3 = createMigrations().version(1, v =>
    v.createObjectStore({ name: 'store', schema: schema<string>() })
  )

  const db1 = await openDB(dbName1, migrations1)
  const db2 = await openDB(dbName2, migrations2)
  const db3 = await openDB(dbName3, migrations3)

  db1.close()
  db2.close()
  db3.close()

  // Upgrade db2 to version 2
  const db2v2 = await openDB(dbName2, migrations2v2)
  db2v2.close()

  try {
    const databases = await indexedDB.databases()

    // Find our databases
    const ourDbs = databases.filter(d => d.name?.startsWith(prefix))
    expect(ourDbs.length).toBe(3)

    const db1Info = ourDbs.find(d => d.name === dbName1)
    const db2Info = ourDbs.find(d => d.name === dbName2)
    const db3Info = ourDbs.find(d => d.name === dbName3)

    expect(db1Info?.version).toBe(1)
    expect(db2Info?.version).toBe(2)
    expect(db3Info?.version).toBe(1)
  } finally {
    // Clean up
    indexedDB.deleteDatabase(dbName1)
    indexedDB.deleteDatabase(dbName2)
    indexedDB.deleteDatabase(dbName3)
  }
})

/**
 * Test that deleted databases are not returned
 */
test('Deleted database is not returned by databases()', async () => {
  const dbName = 'TestDatabase-ToDelete-' + Math.random()
  const migrations = createMigrations().version(1, v =>
    v.createObjectStore({ name: 'store', schema: schema<string>() })
  )

  const db = await openDB(dbName, migrations)
  db.close()

  // Delete the database
  await new Promise<void>((resolve, reject) => {
    const req = indexedDB.deleteDatabase(dbName)
    req.onsuccess = () => resolve()
    req.onerror = () => reject(req.error)
  })

  const databases = await indexedDB.databases()
  const ourDb = databases.find(d => d.name === dbName)
  expect(ourDb).toBeUndefined()
})

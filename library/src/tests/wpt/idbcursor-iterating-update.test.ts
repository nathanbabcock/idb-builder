/**
 * IndexedDB: Index iteration with cursor updates/deletes
 *
 * Ported from WPT idbcursor-iterating-update.any.js
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbcursor-iterating-update.any.js
 */

import './wpt-setup'
import { expect, test } from 'vitest'
import { openDB } from '../../lib/idb-adapter'
import { createMigrations } from '../../lib/migration-builder'
import { schema } from '../../lib/schema'

interface TestRecord {
  name: string
  id: number
}

const objStoreValues: TestRecord[] = [
  { name: 'foo', id: 1 },
  { name: 'bar', id: 2 },
  { name: 'foo', id: 3 },
  { name: 'bar', id: 4 },
]

// Values sorted by index 'name' (bar < foo)
const objStoreValuesByIndex = [
  objStoreValues[1], // bar, id: 2
  objStoreValues[3], // bar, id: 4
  objStoreValues[0], // foo, id: 1
  objStoreValues[2], // foo, id: 3
]

test("Calling cursor.update({}) doesn't affect index iteration", async () => {
  const migrations = createMigrations().version(1, v =>
    v
      .createObjectStore({
        name: 'items',
        schema: schema<TestRecord>(),
        autoIncrement: true,
      })
      .createIndex('name', {
        storeName: 'items',
        keyPath: 'name',
        unique: false,
      })
  )

  const db = await openDB('test-db', migrations)

  try {
    // Add test data
    const txn1 = db.transaction('items', 'readwrite')
    for (const value of objStoreValues) {
      await txn1.objectStore('items').add(value)
    }
    await txn1.done

    // Iterate and update
    const txn2 = db.transaction('items', 'readwrite')
    const index = txn2.objectStore('items').index('name')

    const cursorValues: TestRecord[] = []
    let cursor = await index.openCursor()

    while (cursor) {
      await cursor.update({} as TestRecord)
      cursorValues.push(cursor.value)
      cursor = await cursor.continue()
    }

    expect(cursorValues.length).toBe(4)
    for (let i = 0; i < cursorValues.length; i++) {
      expect(cursorValues[i]).toMatchObject(objStoreValuesByIndex[i])
    }

    await txn2.done
  } finally {
    db.close()
  }
})

test("Calling cursor.delete() doesn't affect index iteration", async () => {
  const migrations = createMigrations().version(1, v =>
    v
      .createObjectStore({
        name: 'items',
        schema: schema<TestRecord>(),
        autoIncrement: true,
      })
      .createIndex('name', {
        storeName: 'items',
        keyPath: 'name',
        unique: false,
      })
  )

  const db = await openDB('test-db', migrations)

  try {
    // Add test data
    const txn1 = db.transaction('items', 'readwrite')
    for (const value of objStoreValues) {
      await txn1.objectStore('items').add(value)
    }
    await txn1.done

    // Iterate and delete
    const txn2 = db.transaction('items', 'readwrite')
    const index = txn2.objectStore('items').index('name')

    const cursorValues: TestRecord[] = []
    let cursor = await index.openCursor()

    while (cursor) {
      await cursor.delete()
      cursorValues.push(cursor.value)
      cursor = await cursor.continue()
    }

    expect(cursorValues.length).toBe(4)
    for (let i = 0; i < cursorValues.length; i++) {
      expect(cursorValues[i]).toMatchObject(objStoreValuesByIndex[i])
    }

    await txn2.done
  } finally {
    db.close()
  }
})

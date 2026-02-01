/**
 * IDBFactory.deleteDatabase() Tests
 *
 * Ported from WPT idbfactory_deleteDatabase.any.js
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbfactory_deleteDatabase.any.js
 */

import './wpt-setup'
import { expect, test } from 'vitest'
import { openDB } from '../../lib/idb-adapter'
import { createMigrations } from '../../lib/migration-builder'
import { schema } from '../../lib/schema'

test('deleteDatabase() request should succeed for non-existent database with oldVersion of 0', async () => {
  // Delete a database that doesn't exist
  const deleteRequest = indexedDB.deleteDatabase('db-that-doesnt-exist')

  await new Promise<void>((resolve, reject) => {
    deleteRequest.onerror = () => reject(new Error('delete_rq.error'))
    deleteRequest.onsuccess = e => {
      const event = e as IDBVersionChangeEvent
      expect(event.oldVersion).toBe(0)
      resolve()
    }
  })
})

test('Result of the deleteDatabase() request is set to undefined', async () => {
  const migrations = createMigrations().version(1, v =>
    v.createObjectStore({
      name: 'test',
      schema: schema<string>(),
    })
  )

  // Create a database first
  const db = await openDB('test-delete-result', migrations)
  db.close()

  // Now delete it
  const deleteRequest = indexedDB.deleteDatabase('test-delete-result')

  await new Promise<void>((resolve, reject) => {
    deleteRequest.onerror = () => reject(new Error('delete_rq.error'))
    deleteRequest.onsuccess = () => {
      expect(deleteRequest.result).toBeUndefined()
      resolve()
    }
  })
})

test("The deleteDatabase() request's success event is an IDBVersionChangeEvent", async () => {
  const migrations = createMigrations().version(1, v =>
    v.createObjectStore({
      name: 'os',
      schema: schema<string>(),
    })
  )

  // Create a database with version 1 first
  const db = await openDB('test-delete-event', migrations)
  db.close()

  // Now delete it
  const deleteRequest = indexedDB.deleteDatabase('test-delete-event')

  await new Promise<void>((resolve, reject) => {
    deleteRequest.onerror = () => reject(new Error('delete_rq.error'))
    deleteRequest.onsuccess = e => {
      const event = e as IDBVersionChangeEvent
      expect(event.oldVersion).toBe(1)
      expect(event.newVersion).toBeNull()
      expect(deleteRequest.result).toBeUndefined()
      expect(event).toBeInstanceOf(IDBVersionChangeEvent)
      resolve()
    }
  })
})

test('Delete an existing database - Test events opening a second database when one connection is open already', async () => {
  const dbname = 'test-delete-second-connection'

  // Clean up first
  await new Promise<void>(resolve => {
    const req = indexedDB.deleteDatabase(dbname)
    req.onsuccess = () => resolve()
    req.onerror = () => resolve()
  })

  // Create database with version 3
  const openrq = indexedDB.open(dbname, 3)

  await new Promise<void>((resolve, reject) => {
    openrq.onupgradeneeded = e => {
      const db = (e.target as IDBOpenDBRequest).result
      db.createObjectStore('store')
    }

    openrq.onsuccess = e => {
      const db = (e.target as IDBOpenDBRequest).result
      db.close()

      // Now delete the database
      const deleteRq = indexedDB.deleteDatabase(dbname)

      deleteRq.onsuccess = () => {
        resolve()
      }

      deleteRq.onerror = () => reject(new Error('delete.error'))
      deleteRq.onblocked = () => reject(new Error('delete.blocked'))
    }

    openrq.onerror = () => reject(new Error('open.error'))
    openrq.onblocked = () => reject(new Error('open.blocked'))
  })
})

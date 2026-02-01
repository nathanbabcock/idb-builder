/**
 * Runtime tests for renameObjectStore and renameIndex methods.
 */

import { IDBFactory } from 'fake-indexeddb'
import { beforeEach, describe, expect, test } from 'vitest'
import { openDB } from '../lib/idb-adapter'
import { createMigrations } from '../lib/migration-builder'
import { schema } from '../lib/schema'

import 'fake-indexeddb/auto'

beforeEach(() => {
  indexedDB = new IDBFactory()
})

describe('renameObjectStore', () => {
  test('renames an object store', async () => {
    const migrations = createMigrations()
      .version(1, v =>
        v.createObjectStore({
          name: 'users',
          schema: schema<{ id: string; name: string }>(),
          primaryKey: 'id',
        })
      )
      .version(2, v =>
        v.renameObjectStore({ oldName: 'users', newName: 'people' })
      )

    const db = await openDB('test-db', migrations)

    // New name should exist
    expect(db.objectStoreNames.contains('people')).toBe(true)
    // Old name should not exist (cast to DOMStringList for type-unsafe check)
    expect((db.objectStoreNames as DOMStringList).contains('users')).toBe(false)

    db.close()
  })

  test('preserves data after rename', async () => {
    // Version 1: Create and populate
    const migrationsV1 = createMigrations().version(1, v =>
      v.createObjectStore({
        name: 'users',
        schema: schema<{ id: string; name: string }>(),
        primaryKey: 'id',
      })
    )

    const db1 = await openDB('test-db', migrationsV1)
    await db1.put('users', { id: '1', name: 'Alice' })
    db1.close()

    // Version 2: Rename
    const migrationsV2 = createMigrations()
      .version(1, v =>
        v.createObjectStore({
          name: 'users',
          schema: schema<{ id: string; name: string }>(),
          primaryKey: 'id',
        })
      )
      .version(2, v =>
        v.renameObjectStore({ oldName: 'users', newName: 'people' })
      )

    const db2 = await openDB('test-db', migrationsV2)
    const person = await db2.get('people', '1')
    expect(person).toEqual({ id: '1', name: 'Alice' })

    db2.close()
  })

  test('preserves indexes after store rename', async () => {
    const migrations = createMigrations()
      .version(1, v =>
        v
          .createObjectStore({
            name: 'users',
            schema: schema<{ id: string; email: string }>(),
            primaryKey: 'id',
          })
          .createIndex('byEmail', { storeName: 'users', keyPath: 'email' })
      )
      .version(2, v =>
        v.renameObjectStore({ oldName: 'users', newName: 'people' })
      )

    const db = await openDB('test-db', migrations)
    const tx = db.transaction('people', 'readonly')
    const store = tx.objectStore('people')

    // Index should still exist with same name
    expect(store.indexNames.contains('byEmail')).toBe(true)

    db.close()
  })

  test('preserves key generator after rename', async () => {
    // Version 1: Create store with autoIncrement and add records
    const migrationsV1 = createMigrations().version(1, v =>
      v.createObjectStore({
        name: 'items',
        schema: schema<{ id: number; name: string }>(),
        primaryKey: 'id',
        autoIncrement: true,
      })
    )

    const db1 = await openDB('test-db', migrationsV1)
    await db1.add('items', { name: 'first' } as { id: number; name: string })
    await db1.add('items', { name: 'second' } as { id: number; name: string })
    db1.close()

    // Version 2: Rename
    const migrationsV2 = createMigrations()
      .version(1, v =>
        v.createObjectStore({
          name: 'items',
          schema: schema<{ id: number; name: string }>(),
          primaryKey: 'id',
          autoIncrement: true,
        })
      )
      .version(2, v =>
        v.renameObjectStore({ oldName: 'items', newName: 'things' })
      )

    const db2 = await openDB('test-db', migrationsV2)

    // Add another record - should continue from where we left off
    const newKey = await db2.add('things', { name: 'third' } as {
      id: number
      name: string
    })
    expect(newKey).toBe(3)

    db2.close()
  })

  test('can swap store names using temporary name', async () => {
    const migrations = createMigrations()
      .version(1, v =>
        v
          .createObjectStore({
            name: 'a',
            schema: schema<{ id: string; type: 'a' }>(),
            primaryKey: 'id',
          })
          .createObjectStore({
            name: 'b',
            schema: schema<{ id: string; type: 'b' }>(),
            primaryKey: 'id',
          })
      )
      .version(2, v =>
        v
          .renameObjectStore({ oldName: 'a', newName: 'temp' })
          .renameObjectStore({ oldName: 'b', newName: 'a' })
          .renameObjectStore({ oldName: 'temp', newName: 'b' })
      )

    const db = await openDB('test-db', migrations)

    expect(db.objectStoreNames.contains('a')).toBe(true)
    expect(db.objectStoreNames.contains('b')).toBe(true)
    expect((db.objectStoreNames as DOMStringList).contains('temp')).toBe(false)

    db.close()
  })
})

describe('renameIndex', () => {
  test('renames an index', async () => {
    const migrations = createMigrations()
      .version(1, v =>
        v
          .createObjectStore({
            name: 'users',
            schema: schema<{ id: string; email: string }>(),
            primaryKey: 'id',
          })
          .createIndex('byEmail', { storeName: 'users', keyPath: 'email' })
      )
      .version(2, v =>
        v.renameIndex({
          storeName: 'users',
          oldIndexName: 'byEmail',
          newIndexName: 'emailIndex',
        })
      )

    const db = await openDB('test-db', migrations)
    const tx = db.transaction('users', 'readonly')
    const store = tx.objectStore('users')

    // New name should exist
    expect(store.indexNames.contains('emailIndex')).toBe(true)
    // Old name should not exist (cast for type-unsafe check)
    expect((store.indexNames as DOMStringList).contains('byEmail')).toBe(false)

    db.close()
  })

  test('preserves index configuration after rename', async () => {
    const migrations = createMigrations()
      .version(1, v =>
        v
          .createObjectStore({
            name: 'users',
            schema: schema<{ id: string; email: string }>(),
            primaryKey: 'id',
          })
          .createIndex('byEmail', {
            storeName: 'users',
            keyPath: 'email',
            unique: true,
          })
      )
      .version(2, v =>
        v.renameIndex({
          storeName: 'users',
          oldIndexName: 'byEmail',
          newIndexName: 'emailIndex',
        })
      )

    const db = await openDB('test-db', migrations)
    const tx = db.transaction('users', 'readonly')
    const store = tx.objectStore('users')
    const index = store.index('emailIndex')

    expect(index.keyPath).toBe('email')
    expect(index.unique).toBe(true)

    db.close()
  })

  test('index still functions after rename', async () => {
    // Version 1: Create and populate
    const migrationsV1 = createMigrations().version(1, v =>
      v
        .createObjectStore({
          name: 'users',
          schema: schema<{ id: string; email: string }>(),
          primaryKey: 'id',
        })
        .createIndex('byEmail', { storeName: 'users', keyPath: 'email' })
    )

    const db1 = await openDB('test-db', migrationsV1)
    await db1.put('users', { id: '1', email: 'alice@example.com' })
    await db1.put('users', { id: '2', email: 'bob@example.com' })
    db1.close()

    // Version 2: Rename
    const migrationsV2 = createMigrations()
      .version(1, v =>
        v
          .createObjectStore({
            name: 'users',
            schema: schema<{ id: string; email: string }>(),
            primaryKey: 'id',
          })
          .createIndex('byEmail', { storeName: 'users', keyPath: 'email' })
      )
      .version(2, v =>
        v.renameIndex({
          storeName: 'users',
          oldIndexName: 'byEmail',
          newIndexName: 'emailIndex',
        })
      )

    const db2 = await openDB('test-db', migrationsV2)
    const tx = db2.transaction('users', 'readonly')
    const store = tx.objectStore('users')
    const index = store.index('emailIndex')

    const user = await index.get('alice@example.com')
    expect(user).toEqual({ id: '1', email: 'alice@example.com' })

    db2.close()
  })

  test('can swap index names using temporary name', async () => {
    const migrations = createMigrations()
      .version(1, v =>
        v
          .createObjectStore({
            name: 'users',
            schema: schema<{ id: string; email: string; name: string }>(),
            primaryKey: 'id',
          })
          .createIndex('byEmail', { storeName: 'users', keyPath: 'email' })
          .createIndex('byName', { storeName: 'users', keyPath: 'name' })
      )
      .version(2, v =>
        v
          .renameIndex({
            storeName: 'users',
            oldIndexName: 'byEmail',
            newIndexName: 'temp',
          })
          .renameIndex({
            storeName: 'users',
            oldIndexName: 'byName',
            newIndexName: 'byEmail',
          })
          .renameIndex({
            storeName: 'users',
            oldIndexName: 'temp',
            newIndexName: 'byName',
          })
      )

    const db = await openDB('test-db', migrations)
    const tx = db.transaction('users', 'readonly')
    const store = tx.objectStore('users')

    expect(store.indexNames.contains('byEmail')).toBe(true)
    expect(store.indexNames.contains('byName')).toBe(true)
    expect((store.indexNames as DOMStringList).contains('temp')).toBe(false)

    // Verify keyPaths were swapped
    const byEmail = store.index('byEmail')
    const byName = store.index('byName')
    expect(byEmail.keyPath).toBe('name') // Was originally byName
    expect(byName.keyPath).toBe('email') // Was originally byEmail

    db.close()
  })
})

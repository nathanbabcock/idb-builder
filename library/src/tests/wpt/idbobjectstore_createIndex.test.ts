/**
 * IDBObjectStore.createIndex() Tests
 *
 * Ported from WPT idbobjectstore_createIndex.any.js
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbobjectstore_createIndex.any.js
 */

import './wpt-setup'
import { expect, test } from 'vitest'
import { openDB } from '../../lib/idb-adapter'
import { createMigrations } from '../../lib/migration-builder'
import { schema } from '../../lib/schema'

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbobjectstore_createIndex.any.js#L7-L25
 */
test('Returns an IDBIndex and the properties are set correctly', async () => {
  const migrations = createMigrations().version(1, v =>
    v
      .createObjectStore({
        name: 'store',
        schema: schema<{ indexedProperty: string }>(),
      })
      .createIndex('index', {
        storeName: 'store',
        keyPath: 'indexedProperty',
        unique: true,
      })
  )

  const db = await openDB('test-db', migrations)
  const tx = db.transaction('store', 'readonly')
  const store = tx.objectStore('store')
  const index = store.index('index')

  expect(index.name).toBe('index')
  expect(index.objectStore).toBe(store)
  expect(index.keyPath).toBe('indexedProperty')
  expect(index.unique).toBe(true)
  expect(index.multiEntry).toBe(false)

  await tx.done
  db.close()
})

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbobjectstore_createIndex.any.js#L57-L82
 */
test('The index is usable right after being made', async () => {
  const migrations = createMigrations().version(1, v =>
    v
      .createObjectStore({
        name: 'store',
        schema: schema<{ key: string; indexedProperty: string }>(),
        primaryKey: 'key',
      })
      .createIndex('index', {
        storeName: 'store',
        keyPath: 'indexedProperty',
      })
  )

  const db = await openDB('test-db', migrations)

  // Add data
  const tx = db.transaction('store', 'readwrite')
  for (let i = 0; i < 100; i++) {
    await tx.store.add({ key: 'key_' + i, indexedProperty: 'indexed_' + i })
  }
  await tx.done

  // Verify index lookups work
  const result99 = await db.getFromIndex('store', 'index', 'indexed_99')
  expect(result99?.key).toBe('key_99')

  const result9 = await db.getFromIndex('store', 'index', 'indexed_9')
  expect(result9?.key).toBe('key_9')

  db.close()
})

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbobjectstore_createIndex.any.js#L140-L166
 */
test('Empty keyPath', async () => {
  const migrations = createMigrations().version(1, v =>
    v
      .createObjectStore({
        name: 'store',
        schema: schema<string>(),
      })
      .createIndex('index', {
        storeName: 'store',
        keyPath: '',
      })
  )

  const db = await openDB('test-db', migrations)

  // Add data
  const tx = db.transaction('store', 'readwrite')
  for (let i = 0; i < 5; i++) {
    await tx.store.add('object_' + i, i)
  }
  await tx.done

  // Verify index lookup works with empty keyPath (whole value as key)
  const tx2 = db.transaction('store', 'readonly')
  const result = await tx2.objectStore('store').index('index').get('object_4')
  expect(result).toBe('object_4')
  await tx2.done

  db.close()
})

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbobjectstore_createIndex.any.js#L335-L365
 */
test('IDBObjectStore.createIndex() - empty name', async () => {
  const migrations = createMigrations().version(1, v =>
    v
      .createObjectStore({
        name: 'store',
        schema: schema<{ idx: string }>(),
      })
      .createIndex('', {
        storeName: 'store',
        keyPath: 'idx',
      })
  )

  const db = await openDB('test-db', migrations)

  // Add data
  const tx = db.transaction('store', 'readwrite')
  for (let i = 0; i < 5; i++) {
    await tx.store.add({ idx: 'object_' + i }, i)
  }
  await tx.done

  // Verify index with empty name works
  const tx2 = db.transaction('store', 'readonly')
  const store = tx2.objectStore('store')
  expect(store.indexNames[0]).toBe('')
  expect(store.indexNames.length).toBe(1)

  const result = await store.index('').get('object_4')
  expect(result?.idx).toBe('object_4')

  await tx2.done
  db.close()
})

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbobjectstore_createIndex.any.js#L367-L379
 */
test('If an index with the name already exists, throw ConstraintError', async () => {
  const migrations = createMigrations().version(1, v =>
    v
      .createObjectStore({
        name: 'store',
        schema: schema<{ a: string }>(),
      })
      .createIndex('a', {
        storeName: 'store',
        keyPath: 'a',
      })
      // @ts-expect-error
      .createIndex('a', {
        storeName: 'store',
        keyPath: 'a',
      })
  )

  await expect(openDB('test-db', migrations)).rejects.toMatchObject({
    name: 'ConstraintError',
  })
})

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbobjectstore_createIndex.any.js#L381-L392
 */
test('If keyPath is not a valid key path, throw SyntaxError', async () => {
  const migrations = createMigrations().version(1, v =>
    v
      .createObjectStore({
        name: 'store',
        schema: schema<{ value: string }>(),
      })
      .createIndex('ab', {
        storeName: 'store',
        // @ts-expect-error
        keyPath: '.',
      })
  )

  await expect(openDB('test-db', migrations)).rejects.toMatchObject({
    name: 'SyntaxError',
  })
})

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbobjectstore_createIndex.any.js#L394-L412
 */
test.skip('If the object store has been deleted, throw InvalidStateError', () => {
  // Wrapper doesn't allow accessing deleted object stores
})

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbobjectstore_createIndex.any.js#L414-L433
 */
test.skip('Operate outside versionchange throws InvalidStateError', () => {
  // Wrapper only allows index creation in migrations
})

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbobjectstore_createIndex.any.js#L516-L537
 */
test('Compound index - Explicit Primary Key', async () => {
  const migrations = createMigrations().version(1, v =>
    v
      .createObjectStore({
        name: 'Store1',
        schema: schema<{ id: number; num: number }>(),
        primaryKey: 'id',
      })
      .createIndex('CompoundKey', {
        storeName: 'Store1',
        keyPath: ['num', 'id'] as const,
      })
  )

  const db = await openDB('test-db', migrations)
  await db.put('Store1', { id: 1, num: 100 })

  const tx = db.transaction('Store1', 'readonly')
  const store = tx.objectStore('Store1')
  // @ts-expect-error - compound index key is an array
  const result = await store.index('CompoundKey').get([100, 1])

  expect(result?.num).toBe(100)

  await tx.done
  db.close()
})

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbobjectstore_createIndex.any.js#L539-L558
 */
test('Compound index - Auto-Increment Primary Key', async () => {
  const migrations = createMigrations().version(1, v =>
    v
      .createObjectStore({
        name: 'Store2',
        schema: schema<{ id: number; num: number }>(),
        primaryKey: 'id',
        autoIncrement: true,
      })
      .createIndex('CompoundKey', {
        storeName: 'Store2',
        keyPath: ['num', 'id'] as const,
      })
  )

  const db = await openDB('test-db', migrations)
  // @ts-expect-error - auto-increment doesn't require id
  await db.put('Store2', { num: 100 })

  const tx = db.transaction('Store2', 'readonly')
  const store = tx.objectStore('Store2')

  // Get the auto-generated id by opening a cursor
  const cursor = await store.openCursor()
  const item = cursor?.value
  expect(item?.num).toBe(100)
  expect(item?.id).toBe(1) // auto-incremented

  // Verify compound index lookup works
  // @ts-expect-error - compound index key is an array
  const result = await store.index('CompoundKey').get([100, 1])
  expect(result?.num).toBe(100)

  await tx.done
  db.close()
})

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbobjectstore_createIndex.any.js#L292-L333
 */
test('Index can be valid keys', async () => {
  const now = new Date()
  const mar18 = new Date(1111111111111)
  const ar: (string | number)[] = ['Yay', 2, -Infinity]
  const num = 1337

  const migrations = createMigrations().version(1, v =>
    v
      .createObjectStore({
        name: 'store',
        schema: schema<{
          key: string
          i: Date | (string | number)[] | number
        }>(),
        primaryKey: 'key',
      })
      .createIndex('index', {
        storeName: 'store',
        keyPath: 'i',
      })
  )

  const db = await openDB('test-db', migrations)

  // Add data with various key types
  await db.put('store', { key: 'now', i: now })
  await db.put('store', { key: 'mar18', i: mar18 })
  await db.put('store', { key: 'array', i: ar })
  await db.put('store', { key: 'number', i: num })

  // Verify index lookups with different key types
  const tx = db.transaction('store', 'readonly')
  const idx = tx.objectStore('store').index('index')

  const resultNow = await idx.get(now)
  expect(resultNow?.key).toBe('now')
  expect((resultNow!.i as Date).getTime()).toBe(now.getTime())

  const resultMar18 = await idx.get(mar18)
  expect(resultMar18?.key).toBe('mar18')
  expect((resultMar18!.i as Date).getTime()).toBe(mar18.getTime())

  const resultArray = await idx.get(ar)
  expect(resultArray?.key).toBe('array')
  expect(resultArray?.i).toEqual(ar)

  const resultNum = await idx.get(num)
  expect(resultNum?.key).toBe('number')
  expect(resultNum?.i).toBe(num)

  await tx.done
  db.close()
})

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbobjectstore_createIndex.any.js#L27-L55
 */
test.skip('Attempt to create unique index on store with duplicates triggers abort', () => {
  // Complex event ordering test - would require raw IDB access to properly test
})

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbobjectstore_createIndex.any.js#L84-L138
 */
test.skip('Event ordering for a later deleted index', () => {
  // Complex event ordering test
})

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbobjectstore_createIndex.any.js#L168-L227
 */
test.skip('Event order when unique constraint is triggered', () => {
  // Complex event ordering test
})

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbobjectstore_createIndex.any.js#L229-L290
 */
test.skip('Event ordering for ConstraintError on request', () => {
  // Complex event ordering test
})

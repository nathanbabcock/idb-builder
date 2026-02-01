/**
 * IDBDatabase.createObjectStore() Tests
 *
 * Ported from WPT idbdatabase_createObjectStore.any.js
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbdatabase_createObjectStore.any.js
 *
 * Spec: https://w3c.github.io/IndexedDB/#dom-idbdatabase-createobjectstore
 */

import './wpt-setup'
import { describe, expect, test } from 'vitest'
import { openDB } from '../../lib/idb-adapter'
import { createMigrations } from '../../lib/migration-builder'
import { schema } from '../../lib/schema'

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbdatabase_createObjectStore.any.js#L9-L39
 */
test('Both with empty name', async () => {
  const migrations = createMigrations().version(1, v =>
    v
      .createObjectStore({
        name: '',
        schema: schema<{ idx: string }>(),
      })
      .createIndex('', {
        storeName: '',
        keyPath: 'idx',
      })
  )

  const db = await openDB('test-db', migrations)

  // Add test data
  const tx = db.transaction('', 'readwrite')
  const store = tx.objectStore('')
  for (let i = 0; i < 5; i++) {
    await store.add({ idx: 'object_' + i }, i)
  }
  await tx.done

  // Verify store with empty name exists
  expect(db.objectStoreNames[0]).toBe('')
  expect(db.objectStoreNames.length).toBe(1)

  // Verify index with empty name exists
  const tx2 = db.transaction('', 'readonly')
  const store2 = tx2.objectStore('')
  expect(store2.indexNames[0]).toBe('')
  expect(store2.indexNames.length).toBe(1)

  // Verify data retrieval via index
  const result = await store2.index('').get('object_4')
  expect(result?.idx).toBe('object_4')

  await tx2.done
  db.close()
})

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbdatabase_createObjectStore.any.js#L41-L61
 */
test('Returns an instance of IDBObjectStore', async () => {
  const migrations = createMigrations().version(1, v =>
    v.createObjectStore({
      name: 'instancetest',
      schema: schema<{ value: string }>(),
    })
  )

  const db = await openDB('test-db', migrations)
  const tx = db.transaction('instancetest', 'readonly')
  const store = tx.objectStore('instancetest')

  // Verify store has expected IDBObjectStore properties
  expect(store.name).toBe('instancetest')
  expect(typeof store.keyPath).toBeDefined()
  expect(typeof store.autoIncrement).toBe('boolean')

  await tx.done
  db.close()
})

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbdatabase_createObjectStore.any.js#L63-L86
 */
test('Create 1000 object stores, add one item and delete', async () => {
  const migrations = createMigrations().version(1, v => {
    let builder = v
    for (let i = 0; i < 1000; i++) {
      builder = builder.createObjectStore({
        name: `object_store_${i}`,
        schema: schema<string>(),
      }) as any
    }
    return builder
  })

  const db = await openDB('test-db', migrations)

  // Add one item to the last store
  await db.put('object_store_999' as any, 'test', 1)

  // Verify retrieval
  const result = await db.get('object_store_999' as any, 1)
  expect(result).toBe('test')

  db.close()
})

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbdatabase_createObjectStore.any.js#L88-L114
 */
test('Empty name', async () => {
  const migrations = createMigrations().version(1, v =>
    v.createObjectStore({
      name: '',
      schema: schema<string>(),
    })
  )

  const db = await openDB('test-db', migrations)

  // Add test data
  const tx = db.transaction('', 'readwrite')
  const store = tx.objectStore('')
  for (let i = 0; i < 5; i++) {
    await store.add('object_' + i, i)
  }
  await tx.done

  // Verify store with empty name
  expect(db.objectStoreNames[0]).toBe('')
  expect(db.objectStoreNames.length).toBe(1)

  // Verify data retrieval
  const result = await db.get('', 2)
  expect(result).toBe('object_2')

  db.close()
})

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbdatabase_createObjectStore.any.js#L116-L129
 */
test('Attempting to create an existing object store with a different keyPath throw ConstraintError', async () => {
  const migrations = createMigrations().version(1, v =>
    v
      .createObjectStore({ name: 'store', schema: schema<{ a: string }>() })
      .createObjectStore({
        // @ts-expect-error - testing runtime error for duplicate name
        name: 'store',
        schema: schema<{ b: string }>(),
        primaryKey: 'b',
      })
  )

  await expect(openDB('test-db', migrations)).rejects.toMatchObject({
    name: 'ConstraintError',
  })
})

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbdatabase_createObjectStore.any.js#L131-L152
 */
test("Object store 'name' and 'keyPath' properties are correctly set", async () => {
  const migrations = createMigrations().version(1, v =>
    v.createObjectStore({
      name: 'prop',
      schema: schema<{ mykeypath: string; value: string }>(),
      primaryKey: 'mykeypath',
    })
  )

  const db = await openDB('test-db', migrations)
  const tx = db.transaction('prop', 'readonly')
  const store = tx.objectStore('prop')

  expect(store.name).toBe('prop')
  expect(store.keyPath).toBe('mykeypath')
  expect(store.autoIncrement).toBe(false)

  await tx.done
  db.close()
})

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbdatabase_createObjectStore.any.js#L154-L164
 */
test.skip('Attempt to create an object store outside of a version change transaction', () => {
  // Wrapper only allows store creation in migrations
})

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbdatabase_createObjectStore.any.js#L166-L180
 */
test('Attempt to create an object store that already exists', async () => {
  const migrations = createMigrations().version(1, v =>
    v
      .createObjectStore({ name: 'store', schema: schema<{ a: string }>() })
      .createObjectStore({
        // @ts-expect-error - testing runtime error for duplicate name
        name: 'store',
        schema: schema<{ a: string }>(),
      })
  )

  await expect(openDB('test-db', migrations)).rejects.toMatchObject({
    name: 'ConstraintError',
  })
})

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbdatabase_createObjectStore.any.js#L182-L202
 */
test("Object store's name appears in database's list", async () => {
  const migrations = createMigrations().version(1, v =>
    v.createObjectStore({
      name: 'My cool object store name',
      schema: schema<{ value: string }>(),
    })
  )

  const db = await openDB('test-db', migrations)

  expect(db.objectStoreNames.contains('My cool object store name')).toBe(true)

  db.close()
})

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbdatabase_createObjectStore.any.js#L204-L221
 */
test('Attempt to create an object store with an invalid key path', async () => {
  const migrations = createMigrations().version(1, v =>
    v.createObjectStore({
      name: 'invalidkeypath',
      schema: schema<{ value: string }>(),
      // @ts-expect-error - testing invalid keyPath with space
      primaryKey: 'Invalid Keypath',
    })
  )

  await expect(openDB('test-db', migrations)).rejects.toMatchObject({
    name: 'SyntaxError',
  })
})

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbdatabase_createObjectStore.any.js#L223-L232
 */
test.skip('Create an object store with an unknown optional parameter', () => {
  // Wrapper has typed API - unknown parameters not applicable
})

/**
 * Optional parameter tests
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbdatabase_createObjectStore.any.js#L234-L276
 */
describe('optionalParameters', () => {
  /**
   * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbdatabase_createObjectStore.any.js#L246
   */
  test('autoInc true', async () => {
    const migrations = createMigrations().version(1, v =>
      v.createObjectStore({
        name: 'store',
        schema: schema<{ value: string }>(),
        autoIncrement: true,
      })
    )

    const db = await openDB('test-db', migrations)
    const tx = db.transaction('store', 'readonly')
    const store = tx.objectStore('store')

    expect(store.autoIncrement).toBe(true)

    await tx.done
    db.close()
  })

  /**
   * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbdatabase_createObjectStore.any.js#L255-L256
   */
  test('autoInc true, keyPath string', async () => {
    const migrations = createMigrations().version(1, v =>
      v.createObjectStore({
        name: 'store',
        schema: schema<{ a: number; value: string }>(),
        primaryKey: 'a',
        autoIncrement: true,
      })
    )

    const db = await openDB('test-db', migrations)
    const tx = db.transaction('store', 'readonly')
    const store = tx.objectStore('store')

    expect(store.keyPath).toBe('a')
    expect(store.autoIncrement).toBe(true)

    await tx.done
    db.close()
  })

  /**
   * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbdatabase_createObjectStore.any.js#L258-L259
   */
  test('autoInc false, keyPath empty', async () => {
    const migrations = createMigrations().version(1, v =>
      v.createObjectStore({
        name: 'store',
        schema: schema<string>(),
        primaryKey: '',
        autoIncrement: false,
      })
    )

    const db = await openDB('test-db', migrations)
    const tx = db.transaction('store', 'readonly')
    const store = tx.objectStore('store')

    expect(store.keyPath).toBe('')
    expect(store.autoIncrement).toBe(false)

    await tx.done
    db.close()
  })

  /**
   * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbdatabase_createObjectStore.any.js#L261-L263
   */
  test('autoInc false, keyPath array', async () => {
    const migrations = createMigrations().version(1, v =>
      v.createObjectStore({
        name: 'store',
        schema: schema<{ h: string; j: string; value: string }>(),
        primaryKey: ['h', 'j'] as const,
        autoIncrement: false,
      })
    )

    const db = await openDB('test-db', migrations)
    const tx = db.transaction('store', 'readonly')
    const store = tx.objectStore('store')

    expect(store.keyPath).toEqual(['h', 'j'])
    expect(store.autoIncrement).toBe(false)

    await tx.done
    db.close()
  })

  /**
   * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbdatabase_createObjectStore.any.js#L265-L266
   */
  test('autoInc false, keyPath string', async () => {
    const migrations = createMigrations().version(1, v =>
      v.createObjectStore({
        name: 'store',
        schema: schema<{ abc: string; value: string }>(),
        primaryKey: 'abc',
        autoIncrement: false,
      })
    )

    const db = await openDB('test-db', migrations)
    const tx = db.transaction('store', 'readonly')
    const store = tx.objectStore('store')

    expect(store.keyPath).toBe('abc')
    expect(store.autoIncrement).toBe(false)

    await tx.done
    db.close()
  })

  /**
   * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbdatabase_createObjectStore.any.js#L268
   */
  test('keyPath empty', async () => {
    const migrations = createMigrations().version(1, v =>
      v.createObjectStore({
        name: 'store',
        schema: schema<string>(),
        primaryKey: '',
      })
    )

    const db = await openDB('test-db', migrations)
    const tx = db.transaction('store', 'readonly')
    const store = tx.objectStore('store')

    expect(store.keyPath).toBe('')

    await tx.done
    db.close()
  })

  /**
   * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbdatabase_createObjectStore.any.js#L270
   */
  test('keyPath array', async () => {
    const migrations = createMigrations().version(1, v =>
      v.createObjectStore({
        name: 'store',
        schema: schema<{ a: string; b: string }>(),
        primaryKey: ['a', 'b'] as const,
      })
    )

    const db = await openDB('test-db', migrations)
    const tx = db.transaction('store', 'readonly')
    const store = tx.objectStore('store')

    expect(store.keyPath).toEqual(['a', 'b'])

    await tx.done
    db.close()
  })

  /**
   * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbdatabase_createObjectStore.any.js#L272
   */
  test('keyPath string', async () => {
    const migrations = createMigrations().version(1, v =>
      v.createObjectStore({
        name: 'store',
        schema: schema<{ abc: string }>(),
        primaryKey: 'abc',
      })
    )

    const db = await openDB('test-db', migrations)
    const tx = db.transaction('store', 'readonly')
    const store = tx.objectStore('store')

    expect(store.keyPath).toBe('abc')

    await tx.done
    db.close()
  })

  /**
   * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbdatabase_createObjectStore.any.js#L274
   */
  test('keyPath null (no primaryKey specified)', async () => {
    const migrations = createMigrations().version(1, v =>
      v.createObjectStore({
        name: 'store',
        schema: schema<{ value: string }>(),
      })
    )

    const db = await openDB('test-db', migrations)
    const tx = db.transaction('store', 'readonly')
    const store = tx.objectStore('store')

    expect(store.keyPath).toBe(null)

    await tx.done
    db.close()
  })
})

/**
 * Invalid optional parameter tests
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbdatabase_createObjectStore.any.js#L278-L305
 */
describe('invalid_optionalParameters', () => {
  /**
   * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbdatabase_createObjectStore.any.js#L279-L280
   */
  test('autoInc and empty keyPath', async () => {
    const migrations = createMigrations().version(1, v =>
      v.createObjectStore({
        name: 'store',
        schema: schema<string>(),
        primaryKey: '',
        autoIncrement: true,
      })
    )

    await expect(openDB('test-db', migrations)).rejects.toMatchObject({
      name: 'InvalidAccessError',
    })
  })

  /**
   * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbdatabase_createObjectStore.any.js#L281-L283
   */
  test('autoInc and keyPath array', async () => {
    const migrations = createMigrations().version(1, v =>
      v.createObjectStore({
        name: 'store',
        schema: schema<{ value: string }>(),
        // @ts-expect-error - testing empty array keyPath with autoIncrement
        primaryKey: [] as const,
        autoIncrement: true,
      })
    )

    await expect(openDB('test-db', migrations)).rejects.toMatchObject({
      name: 'SyntaxError',
    })
  })

  /**
   * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbdatabase_createObjectStore.any.js#L285-L286
   */
  test('autoInc and keyPath array 2', async () => {
    const migrations = createMigrations().version(1, v =>
      v.createObjectStore({
        name: 'store',
        schema: schema<{ hey: string }>(),
        // @ts-expect-error - testing array keyPath with autoIncrement
        primaryKey: ['hey'] as const,
        autoIncrement: true,
      })
    )

    await expect(openDB('test-db', migrations)).rejects.toMatchObject({
      name: 'InvalidAccessError',
    })
  })

  /**
   * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbdatabase_createObjectStore.any.js#L288-L290
   */
  test('autoInc and keyPath object', async () => {
    const migrations = createMigrations().version(1, v =>
      v.createObjectStore({
        name: 'store',
        schema: schema<{ value: string }>(),
        // @ts-expect-error - testing object keyPath (invalid)
        primaryKey: { a: 'hey', b: 2 },
        autoIncrement: true,
      })
    )

    await expect(openDB('test-db', migrations)).rejects.toMatchObject({
      name: 'SyntaxError',
    })
  })
})

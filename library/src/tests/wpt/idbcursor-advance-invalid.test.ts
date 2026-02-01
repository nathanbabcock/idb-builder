/**
 * IDBCursor.advance() - invalid Tests
 *
 * Ported from WPT idbcursor-advance-invalid.any.js
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbcursor-advance-invalid.any.js
 */

import './wpt-setup'
import { expect, test } from 'vitest'
import { openDB } from '../../lib/idb-adapter'
import { createMigrations } from '../../lib/migration-builder'
import { schema } from '../../lib/schema'

async function setupDb() {
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

  // Add test data
  const txn = db.transaction('test', 'readwrite')
  await txn.objectStore('test').add('data', 1)
  await txn.objectStore('test').add('data2', 2)
  await txn.done

  return db
}

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbcursor-advance-invalid.any.js#L18-L47
 */
test('IDBCursor.advance() - invalid - attempt to call advance twice', async () => {
  const db = await setupDb()

  try {
    const txn = db.transaction('test', 'readonly')
    const index = txn.objectStore('test').index('index')

    let count = 0
    let cursor = await index.openCursor()

    while (cursor) {
      // First advance is valid
      const advancePromise = cursor.advance(1)

      // Second try should throw InvalidStateError
      expect(() => {
        cursor!.advance(1)
      }).toThrow(expect.objectContaining({ name: 'InvalidStateError' }))

      // Third advance should also throw
      expect(() => {
        cursor!.advance(3)
      }).toThrow(expect.objectContaining({ name: 'InvalidStateError' }))

      count++
      cursor = await advancePromise
    }

    expect(count).toBe(2)
    await txn.done
  } finally {
    db.close()
  }
})

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbcursor-advance-invalid.any.js#L49-L81
 */
test('IDBCursor.advance() - invalid - pass something other than number', async () => {
  const db = await setupDb()

  try {
    const txn = db.transaction('test', 'readonly')
    const index = txn.objectStore('test').index('index')

    const cursor = await index.openCursor()
    expect(cursor).not.toBeNull()

    // Various non-number values should throw TypeError
    expect(() => {
      // @ts-expect-error - testing invalid input
      cursor!.advance({})
    }).toThrow(TypeError)

    expect(() => {
      // @ts-expect-error - testing invalid input
      cursor!.advance([])
    }).toThrow(TypeError)

    expect(() => {
      // @ts-expect-error - testing invalid input
      cursor!.advance('')
    }).toThrow(TypeError)

    expect(() => {
      // @ts-expect-error - testing invalid input
      cursor!.advance('1 2')
    }).toThrow(TypeError)

    await txn.done
  } finally {
    db.close()
  }
})

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbcursor-advance-invalid.any.js#L84-L109
 */
test('IDBCursor.advance() - invalid - pass null/undefined', async () => {
  const db = await setupDb()

  try {
    const txn = db.transaction('test', 'readonly')
    const index = txn.objectStore('test').index('index')

    const cursor = await index.openCursor()
    expect(cursor).not.toBeNull()

    expect(() => {
      // @ts-expect-error - testing invalid input
      cursor!.advance(null)
    }).toThrow(TypeError)

    expect(() => {
      // @ts-expect-error - testing invalid input
      cursor!.advance(undefined)
    }).toThrow(TypeError)

    const myVar = null
    expect(() => {
      // @ts-expect-error - testing invalid input
      cursor!.advance(myVar)
    }).toThrow(TypeError)

    await txn.done
  } finally {
    db.close()
  }
})

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbcursor-advance-invalid.any.js#L112-L128
 */
test('IDBCursor.advance() - invalid - missing argument', async () => {
  const db = await setupDb()

  try {
    const txn = db.transaction('test', 'readonly')
    const index = txn.objectStore('test').index('index')

    const cursor = await index.openCursor()
    expect(cursor).not.toBeNull()

    expect(() => {
      // @ts-expect-error - testing invalid input
      cursor!.advance()
    }).toThrow(TypeError)

    await txn.done
  } finally {
    db.close()
  }
})

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbcursor-advance-invalid.any.js#L130-L171
 */
test('IDBCursor.advance() - invalid - pass negative numbers', async () => {
  const db = await setupDb()

  try {
    const txn = db.transaction('test', 'readonly')
    const index = txn.objectStore('test').index('index')

    const cursor = await index.openCursor()
    expect(cursor).not.toBeNull()

    expect(() => {
      cursor!.advance(-1)
    }).toThrow(TypeError)

    expect(() => {
      cursor!.advance(NaN)
    }).toThrow(TypeError)

    expect(() => {
      cursor!.advance(0)
    }).toThrow(TypeError)

    expect(() => {
      cursor!.advance(-0)
    }).toThrow(TypeError)

    expect(() => {
      cursor!.advance(Infinity)
    }).toThrow(TypeError)

    expect(() => {
      cursor!.advance(-Infinity)
    }).toThrow(TypeError)

    const myVar = -999999
    expect(() => {
      cursor!.advance(myVar)
    }).toThrow(TypeError)

    await txn.done
  } finally {
    db.close()
  }
})

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/idbcursor-advance-invalid.any.js#L173-L196
 */
test('IDBCursor.advance() - invalid - got value not set on exception', async () => {
  const db = await setupDb()

  try {
    const txn = db.transaction('test', 'readonly')
    const index = txn.objectStore('test').index('index')

    let count = 0
    let cursor = await index.openCursor()

    while (cursor) {
      // This should throw but not affect the cursor state
      expect(() => {
        cursor!.advance(0)
      }).toThrow(TypeError)

      // Valid advance should still work
      cursor = await cursor.advance(1)
      count++
    }

    expect(count).toBe(2)
    await txn.done
  } finally {
    db.close()
  }
})

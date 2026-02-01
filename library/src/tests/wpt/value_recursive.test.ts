/**
 * Recursive Value Tests
 *
 * Ported from WPT value_recursive.any.js
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/value_recursive.any.js
 */

import './wpt-setup'
import { expect, test } from 'vitest'
import { openDB } from '../../lib/idb-adapter'
import { createMigrations } from '../../lib/migration-builder'
import { schema } from '../../lib/schema'

/**
 * Helper function to test recursive values
 */
async function recursiveValueTest(_desc: string, value: unknown) {
  const migrations = createMigrations().version(1, v =>
    v.createObjectStore({
      name: 'store',
      schema: schema<unknown>(),
    })
  )

  const db = await openDB('test-db', migrations)

  try {
    // Store the recursive value
    const txn1 = db.transaction('store', 'readwrite')
    await txn1.objectStore('store').add(value, 1)
    await txn1.done

    // Read it back
    const txn2 = db.transaction('store', 'readonly')
    const result = await txn2.objectStore('store').get(1)
    await txn2.done

    // Verify that the value is not JSON-serializable (it's recursive)
    expect(() => JSON.stringify(value)).toThrow()

    // And the result should also not be JSON-serializable
    expect(() => JSON.stringify(result)).toThrow()
  } finally {
    db.close()
  }
}

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/value_recursive.any.js#L42-L44
 */
test('Recursive value - array directly contains self', async () => {
  const recursive: unknown[] = []
  recursive.push(recursive)
  await recursiveValueTest('array directly contains self', recursive)
})

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/value_recursive.any.js#L46-L48
 */
test('Recursive value - array indirectly contains self', async () => {
  const recursive2: unknown[] = []
  recursive2.push([recursive2])
  await recursiveValueTest('array indirectly contains self', recursive2)
})

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/value_recursive.any.js#L50-L51
 */
test('Recursive value - array member contains self', async () => {
  const recursive: unknown[] = []
  recursive.push(recursive)
  const recursive3 = [recursive]
  await recursiveValueTest('array member contains self', recursive3)
})

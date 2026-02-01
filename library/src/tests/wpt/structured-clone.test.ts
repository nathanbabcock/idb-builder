/**
 * Structured Clone Tests
 *
 * Ported from WPT structured-clone.any.js
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/structured-clone.any.js
 */

import './wpt-setup'
import { expect, test } from 'vitest'
import { openDB } from '../../lib/idb-adapter'
import { createMigrations } from '../../lib/migration-builder'
import { schema } from '../../lib/schema'

type CloneableValue = unknown

async function cloneTest(value: CloneableValue, verifyFunc: (orig: CloneableValue, clone: CloneableValue) => void | Promise<void>) {
  const migrations = createMigrations().version(1, v =>
    v.createObjectStore({
      name: 'store',
      schema: schema<CloneableValue>(),
    })
  )

  const db = await openDB('test-db', migrations)

  try {
    const tx = db.transaction('store', 'readwrite')
    const store = tx.objectStore('store')
    await store.put(value, 'key')
    await tx.done

    const tx2 = db.transaction('store', 'readonly')
    const store2 = tx2.objectStore('store')
    const result = await store2.get('key')
    await tx2.done

    await verifyFunc(value, result)
  } finally {
    db.close()
  }
}

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/structured-clone.any.js#L88-L124
 */
test('Clone primitive: undefined', async () => {
  await cloneTest(undefined, (orig, clone) => {
    expect(clone).toBe(orig)
  })
})

test('Clone primitive: null', async () => {
  await cloneTest(null, (orig, clone) => {
    expect(clone).toBe(orig)
  })
})

test('Clone primitive: boolean false', async () => {
  await cloneTest(false, (orig, clone) => {
    expect(clone).toBe(orig)
  })
})

test('Clone primitive: boolean true', async () => {
  await cloneTest(true, (orig, clone) => {
    expect(clone).toBe(orig)
  })
})

test('Clone primitive: number 0', async () => {
  await cloneTest(0, (orig, clone) => {
    expect(clone).toBe(orig)
  })
})

test('Clone primitive: number -0', async () => {
  await cloneTest(-0, (orig, clone) => {
    expect(Object.is(clone, -0)).toBe(true)
  })
})

/**
 * Skipped: fake-indexeddb has a bug where NaN values cause the transaction to hang.
 * This test passes in real browsers with real IndexedDB.
 */
test.skip('Clone primitive: number NaN', async () => {
  await cloneTest(NaN, (orig, clone) => {
    expect(Number.isNaN(clone)).toBe(true)
  })
})

test('Clone primitive: number Infinity', async () => {
  await cloneTest(Infinity, (orig, clone) => {
    expect(clone).toBe(Infinity)
  })
})

test('Clone primitive: number -Infinity', async () => {
  await cloneTest(-Infinity, (orig, clone) => {
    expect(clone).toBe(-Infinity)
  })
})

test('Clone primitive: string', async () => {
  await cloneTest('this is a sample string', (orig, clone) => {
    expect(clone).toBe(orig)
  })
})

test('Clone primitive: empty string', async () => {
  await cloneTest('', (orig, clone) => {
    expect(clone).toBe(orig)
  })
})

test('Clone primitive: string with null', async () => {
  await cloneTest('null(\0)', (orig, clone) => {
    expect(clone).toBe(orig)
  })
})

test('Clone primitive: bigint', async () => {
  await cloneTest(12345678901234567890n, (orig, clone) => {
    expect(clone).toBe(orig)
  })
})

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/structured-clone.any.js#L133-L150
 */
test('Clone Date object', async () => {
  const date = new Date()
  await cloneTest(date, (orig, clone) => {
    expect(clone).not.toBe(orig)
    expect(clone).toBeInstanceOf(Date)
    expect((clone as Date).valueOf()).toBe((orig as Date).valueOf())
  })
})

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/structured-clone.any.js#L152-L166
 */
test('Clone RegExp object', async () => {
  const regex = /abc/gi
  await cloneTest(regex, (orig, clone) => {
    expect(clone).not.toBe(orig)
    expect(clone).toBeInstanceOf(RegExp)
    expect((clone as RegExp).toString()).toBe((orig as RegExp).toString())
  })
})

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/structured-clone.any.js#L168-L171
 */
test('Clone ArrayBuffer', async () => {
  const buffer = new Uint8Array([0, 1, 254, 255]).buffer
  await cloneTest(buffer, (orig, clone) => {
    expect(clone).not.toBe(orig)
    expect(clone).toBeInstanceOf(ArrayBuffer)
    expect(Array.from(new Uint8Array(clone as ArrayBuffer))).toEqual(
      Array.from(new Uint8Array(orig as ArrayBuffer))
    )
  })
})

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/structured-clone.any.js#L176-L197
 */
test('Clone Uint8Array', async () => {
  const arr = new Uint8Array([0, 1, 254, 255])
  await cloneTest(arr, (orig, clone) => {
    expect(clone).not.toBe(orig)
    expect(clone).toBeInstanceOf(Uint8Array)
    expect(Array.from(clone as Uint8Array)).toEqual(Array.from(orig as Uint8Array))
  })
})

test('Clone Int32Array', async () => {
  const arr = new Int32Array([0, 1, -1, 0x7fffffff])
  await cloneTest(arr, (orig, clone) => {
    expect(clone).not.toBe(orig)
    expect(clone).toBeInstanceOf(Int32Array)
    expect(Array.from(clone as Int32Array)).toEqual(Array.from(orig as Int32Array))
  })
})

test('Clone Float64Array', async () => {
  const arr = new Float64Array([-Infinity, -1.5, 0, 1.5, Infinity, NaN])
  await cloneTest(arr, (orig, clone) => {
    expect(clone).not.toBe(orig)
    expect(clone).toBeInstanceOf(Float64Array)
    const cloneArr = clone as Float64Array
    const origArr = orig as Float64Array
    expect(cloneArr.length).toBe(origArr.length)
    for (let i = 0; i < origArr.length; i++) {
      if (Number.isNaN(origArr[i])) {
        expect(Number.isNaN(cloneArr[i])).toBe(true)
      } else {
        expect(cloneArr[i]).toBe(origArr[i])
      }
    }
  })
})

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/structured-clone.any.js#L199-L208
 */
test('Clone Map', async () => {
  const map = new Map([[1, 2], [3, 4]])
  await cloneTest(map, (orig, clone) => {
    expect(clone).not.toBe(orig)
    expect(clone).toBeInstanceOf(Map)
    expect([...(clone as Map<number, number>).keys()]).toEqual([...(orig as Map<number, number>).keys()])
    expect([...(clone as Map<number, number>).values()]).toEqual([...(orig as Map<number, number>).values()])
  })
})

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/structured-clone.any.js#L205-L208
 */
test('Clone Set', async () => {
  const set = new Set([1, 2, 3, 4])
  await cloneTest(set, (orig, clone) => {
    expect(clone).not.toBe(orig)
    expect(clone).toBeInstanceOf(Set)
    expect([...(clone as Set<number>).values()]).toEqual([...(orig as Set<number>).values()])
  })
})

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/structured-clone.any.js#L231-L247
 */
test('Clone Array', async () => {
  const arr = [1, 2, 3]
  await cloneTest(arr, (orig, clone) => {
    expect(clone).not.toBe(orig)
    expect(Array.isArray(clone)).toBe(true)
    expect(clone).toEqual(orig)
  })
})

test('Clone empty Array', async () => {
  const arr: number[] = []
  await cloneTest(arr, (orig, clone) => {
    expect(clone).not.toBe(orig)
    expect(Array.isArray(clone)).toBe(true)
    expect(clone).toEqual(orig)
  })
})

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/structured-clone.any.js#L249-L255
 */
test('Clone Object', async () => {
  const obj = { foo: true, bar: false }
  await cloneTest(obj, (orig, clone) => {
    expect(clone).not.toBe(orig)
    expect(typeof clone).toBe('object')
    expect(Object.keys(clone as object)).toEqual(Object.keys(orig as object))
    expect((clone as Record<string, boolean>).foo).toBe((orig as Record<string, boolean>).foo)
    expect((clone as Record<string, boolean>).bar).toBe((orig as Record<string, boolean>).bar)
  })
})

/**
 * Test nested objects
 */
test('Clone nested Object', async () => {
  const obj = {
    level1: {
      level2: {
        value: 42,
        arr: [1, 2, 3],
      },
    },
  }
  await cloneTest(obj, (orig, clone) => {
    expect(clone).not.toBe(orig)
    expect((clone as typeof obj).level1.level2.value).toBe(42)
    expect((clone as typeof obj).level1.level2.arr).toEqual([1, 2, 3])
  })
})

/**
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/structured-clone.any.js#L210-L229
 */
test('Clone Error object', async () => {
  const error = new Error('test error')
  await cloneTest(error, (orig, clone) => {
    expect(clone).not.toBe(orig)
    expect(clone).toBeInstanceOf(Error)
    expect((clone as Error).name).toBe((orig as Error).name)
    expect((clone as Error).message).toBe((orig as Error).message)
  })
})

test('Clone TypeError object', async () => {
  const error = new TypeError('type error')
  await cloneTest(error, (orig, clone) => {
    expect(clone).not.toBe(orig)
    expect(clone).toBeInstanceOf(TypeError)
    expect((clone as Error).name).toBe((orig as Error).name)
    expect((clone as Error).message).toBe((orig as Error).message)
  })
})

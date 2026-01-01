import z from 'zod'
import { openDB } from '../lib/idb-adapter'
import { createMigrations } from '../lib/migration-builder'

// Features which might interact with `autoIncrement:
// - nested keypaths
// - composite keys
// - in-line vs. out-of-line
// - number vs. non-number key

// =============================================================================
// Inline keys + autoIncrement: keyPath must point at a type assignable to number
// =============================================================================

void function testAutoIncrementWithNumericKeyPathIsValid() {
  createMigrations().version(1, v =>
    v.createObjectStore(
      'counters',
      z.object({
        id: z.number(),
        value: z.string(),
      }),
      { primaryKey: 'id', autoIncrement: true }
    )
  )
}

void function testAutoIncrementWithStringKeyPathIsInvalid() {
  createMigrations().version(1, v =>
    // @ts-expect-error autoIncrement requires keyPath to point at a number type, not string
    v.createObjectStore(
      'users',
      z.object({
        id: z.string(),
        name: z.string(),
      }),
      { primaryKey: 'id', autoIncrement: true }
    )
  )
}

void function testAutoIncrementWithNestedNumericKeyPathIsValid() {
  createMigrations().version(1, v =>
    v.createObjectStore(
      'documents',
      z.object({
        metadata: z.object({
          id: z.number(),
          version: z.number(),
        }),
        title: z.string(),
      }),
      { primaryKey: 'metadata.id', autoIncrement: true }
    )
  )
}

void function testAutoIncrementWithNestedStringKeyPathIsInvalid() {
  createMigrations().version(1, v =>
    // @ts-expect-error autoIncrement requires keyPath to point at a number type, not string
    v.createObjectStore(
      'documents',
      z.object({
        metadata: z.object({
          id: z.string(),
          version: z.number(),
        }),
        title: z.string(),
      }),
      { primaryKey: 'metadata.id', autoIncrement: true }
    )
  )
}

// =============================================================================
// Composite keys + autoIncrement: not allowed per IndexedDB spec
// =============================================================================

void function testCompositeKeysWithAutoIncrementIsInvalid() {
  createMigrations().version(1, v =>
    // @ts-expect-error composite keys (array keyPath) cannot be used with autoIncrement
    v.createObjectStore(
      'orders',
      z.object({
        customerId: z.number(),
        orderId: z.number(),
        amount: z.number(),
      }),
      { primaryKey: ['customerId', 'orderId'], autoIncrement: true }
    )
  )
}

// =============================================================================
// Out-of-line keys + autoIncrement: key type should resolve to number
// =============================================================================

void async function testOutOfLineAutoIncrementKeyIsNumber() {
  const migrations = createMigrations().version(1, v =>
    v.createObjectStore(
      'events',
      z.object({
        name: z.string(),
        timestamp: z.date(),
      }),
      { autoIncrement: true }
    )
  )

  const db = await openDB('test-db', migrations)

  // Correct: get() with number key (autoIncrement generates numbers)
  await db.get('events', 42)

  // @ts-expect-error get() with string key should error (autoIncrement keys are numbers)
  await db.get('events', 'not-a-number')
}

// =============================================================================
// Out-of-line keys + autoIncrement:false: key type should be IDBValidKey
// =============================================================================

void async function testOutOfLineNoAutoIncrementKeyIsIDBValidKey() {
  const migrations = createMigrations().version(1, v =>
    v.createObjectStore(
      'items',
      z.object({
        name: z.string(),
      }),
      { autoIncrement: false }
    )
  )

  const db = await openDB('test-db', migrations)

  // All valid: IDBValidKey accepts string, number, Date, etc.
  await db.get('items', 'string-key')
  await db.get('items', 42)
  await db.get('items', new Date())
}

// =============================================================================
// Out-of-line keys + autoIncrement: put() allows optional key parameter
// =============================================================================

void async function testOutOfLineAutoIncrementPutAllowsOptionalKey() {
  const migrations = createMigrations().version(1, v =>
    v.createObjectStore(
      'events',
      z.object({
        name: z.string(),
        timestamp: z.date(),
      }),
      { autoIncrement: true }
    )
  )

  const db = await openDB('test-db', migrations)

  // Valid: omit key (auto-generates)
  await db.put('events', { name: 'click', timestamp: new Date() })

  // Valid: explicit number key
  await db.put('events', { name: 'click', timestamp: new Date() }, 42)

  await db.put(
    'events',
    { name: 'click', timestamp: new Date() },
    // @ts-expect-error key must be number, not string
    'not-a-number'
  )
}

// =============================================================================
// Inline keys + autoIncrement: put() must not allow key parameter
// =============================================================================

// TODO: The idb library uses a single `StoreKey` type for both get() and put().
// Setting `key: never` for inline keys would break get() queries. To properly
// enforce that put()/add() disallow the key parameter for inline keys, we'd
// need to wrap idb's database with our own type-safe methods that distinguish
// between "key type for queries" vs "key type for insertion".
//
// void async function testInlineAutoIncrementPutDisallowsKeyParameter() {
//   const migrations = createMigrations().version(1, v =>
//     v.createObjectStore('counters', z.object({ id: z.number() }), {
//       primaryKey: 'id',
//       autoIncrement: true,
//     })
//   )
//
//   const db = await openDB('test-db', migrations)
//
//   // Valid: key is in the object
//   await db.put('counters', { id: 1 })
//
//   // @ts-expect-error cannot provide key parameter with inline keys
//   await db.put('counters', { id: 1 }, 42)
// }

// =============================================================================
// transformRecords + autoIncrement: key type should be preserved
// =============================================================================

void async function testTransformRecordsPreservesAutoIncrementKeyType() {
  const migrations = createMigrations()
    .version(1, v =>
      v.createObjectStore(
        'events',
        z.object({
          name: z.string(),
        }),
        { autoIncrement: true }
      )
    )
    .version(2, v =>
      v.transformRecords('events', row => ({
        ...row,
        timestamp: new Date(), // Add a field
      }))
    )

  const db = await openDB('test-db', migrations)

  // Key type should still be number after transform
  await db.get('events', 42)

  // @ts-expect-error key is still number, not string
  await db.get('events', 'not-a-number')
}

void function testTransformRecordsChangingInlineKeyTypeIsInvalid() {
  createMigrations()
    .version(1, v =>
      v.createObjectStore(
        'counters',
        z.object({
          id: z.number(),
          value: z.string(),
        }),
        { primaryKey: 'id', autoIncrement: true }
      )
    )
    .version(2, v =>
      // @ts-expect-error transforming id from number to string breaks autoIncrement constraint
      v.transformRecords('counters', row => ({
        ...row,
        id: String(row.id), // number → string, invalid with autoIncrement
      }))
    )
}

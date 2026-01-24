import { openDB } from '../lib/idb-adapter'
import { createMigrations } from '../lib/migration-builder'
import { schema } from '../lib/schema'

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
    v.createObjectStore({
      name: 'counters',
      schema: schema<{ id: number; value: string }>(),
      primaryKey: 'id',
      autoIncrement: true,
    })
  )
}

void function testAutoIncrementWithStringKeyPathIsInvalid() {
  createMigrations().version(1, v =>
    v.createObjectStore({
      name: 'users',
      schema: schema<{ id: string; name: string }>(),
      // @ts-expect-error autoIncrement requires keyPath to point at a number type, not string
      primaryKey: 'id',
      autoIncrement: true,
    })
  )
}

void function testAutoIncrementWithNestedNumericKeyPathIsValid() {
  createMigrations().version(1, v =>
    v.createObjectStore({
      name: 'documents',
      schema: schema<{
        metadata: { id: number; version: number }
        title: string
      }>(),
      primaryKey: 'metadata.id',
      autoIncrement: true,
    })
  )
}

void function testAutoIncrementWithNestedStringKeyPathIsInvalid() {
  createMigrations().version(1, v =>
    v.createObjectStore({
      name: 'documents',
      schema: schema<{
        metadata: { id: string; version: number }
        title: string
      }>(),
      // @ts-expect-error autoIncrement requires keyPath to point at a number type, not string
      primaryKey: 'metadata.id',
      autoIncrement: true,
    })
  )
}

// =============================================================================
// Composite keys + autoIncrement: not allowed per IndexedDB spec
// =============================================================================

void function testCompositeKeysWithAutoIncrementIsInvalid() {
  createMigrations().version(1, v =>
    v.createObjectStore({
      name: 'orders',
      schema: schema<{ customerId: number; orderId: number; amount: number }>(),
      // @ts-expect-error composite keys (array keyPath) cannot be used with autoIncrement
      primaryKey: ['customerId', 'orderId'],
      autoIncrement: true,
    })
  )
}

// =============================================================================
// Out-of-line keys + autoIncrement: key type should resolve to number
// =============================================================================

void async function testOutOfLineAutoIncrementKeyIsNumber() {
  const migrations = createMigrations().version(1, v =>
    v.createObjectStore({
      name: 'events',
      schema: schema<{ name: string; timestamp: Date }>(),
      autoIncrement: true,
    })
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
    v.createObjectStore({
      name: 'items',
      schema: schema<{ name: string }>(),
      autoIncrement: false,
    })
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
    v.createObjectStore({
      name: 'events',
      schema: schema<{ name: string; timestamp: Date }>(),
      autoIncrement: true,
    })
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
//     v.createObjectStore('counters', schema<{ id: number }>(), {
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
      v.createObjectStore({
        name: 'events',
        schema: schema<{ name: string }>(),
        autoIncrement: true,
      })
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
      v.createObjectStore({
        name: 'counters',
        schema: schema<{ id: number; value: string }>(),
        primaryKey: 'id',
        autoIncrement: true,
      })
    )
    .version(2, v =>
      // @ts-expect-error transforming id from number to string breaks autoIncrement constraint
      v.transformRecords('counters', row => ({
        ...row,
        id: String(row.id), // number → string, invalid with autoIncrement
      }))
    )
}

import z from 'zod'
import { openDB } from '../lib/idb-adapter'
import { KeyRange } from '../lib/key-range'
import { createMigrations } from '../lib/migration-builder'

// TODO: Type-safe KeyRange queries require a wrapper around idb.
// The idb library accepts IDBKeyRange for any store/index, so TypedKeyRange<K>
// is always accepted regardless of whether K matches the store's key type.
// See the TODO in idb-adapter.types.ts for more details.

void async function testGetAllWithKeyRangeOnStringPrimaryKey() {
  const migrations = createMigrations().version(1, v =>
    v.createObjectStore({
      name: 'users',
      schema: z.object({
        id: z.string(),
        name: z.string(),
      }),
      primaryKey: 'id',
    })
  )

  const db = await openDB('test-db', migrations)

  // Use .toIDBKeyRange() when passing to idb methods
  // (A future wrapper around idb would accept TypedKeyRange directly)
  await db.getAll('users', KeyRange.gte('a').lt('z').toIDBKeyRange())
  await db.getAll('users', KeyRange.eq('user-123').toIDBKeyRange())
  await db.getAll('users', KeyRange.gte('a').toIDBKeyRange())
  await db.getAll('users', KeyRange.bound('a', 'z').toIDBKeyRange())

  // TODO: These SHOULD error but don't without a wrapper around idb.
  // The type safety only happens at KeyRange construction, not at query time.
  // await db.getAll('users', KeyRange.gte(1).lt(100))
  // await db.getAll('users', KeyRange.eq(123))
  // await db.getAll('users', KeyRange.gte(1))
}

void async function testGetAllWithKeyRangeOnNumberPrimaryKey() {
  const migrations = createMigrations().version(1, v =>
    v.createObjectStore({
      name: 'products',
      schema: z.object({
        sku: z.number(),
        name: z.string(),
      }),
      primaryKey: 'sku',
    })
  )

  const db = await openDB('test-db', migrations)

  // Use .toIDBKeyRange() when passing to idb methods
  await db.getAll('products', KeyRange.gte(1000).lt(2000).toIDBKeyRange())
  await db.getAll('products', KeyRange.eq(1234).toIDBKeyRange())
  await db.getAll('products', KeyRange.bound(100, 200).toIDBKeyRange())

  // TODO: These SHOULD error but don't without a wrapper around idb.
  // await db.getAll('products', KeyRange.gte('a'))
  // await db.getAll('products', KeyRange.eq('product-123'))
}

void async function testGetAllFromIndexWithKeyRange() {
  const migrations = createMigrations()
    .version(1, v =>
      v.createObjectStore({
        name: 'orders',
        schema: z.object({
          id: z.string(),
          customerId: z.string(),
          total: z.number(),
        }),
        primaryKey: 'id',
      })
    )
    .version(2, v =>
      v
        .createIndex('by-customer', {
          storeName: 'orders',
          keyPath: 'customerId',
        })
        .createIndex('by-total', { storeName: 'orders', keyPath: 'total' })
    )

  const db = await openDB('test-db', migrations)

  // Use .toIDBKeyRange() when passing to idb methods
  await db.getAllFromIndex(
    'orders',
    'by-customer',
    KeyRange.gte('cust-100').toIDBKeyRange()
  )
  await db.getAllFromIndex(
    'orders',
    'by-total',
    KeyRange.bound(100, 500).toIDBKeyRange()
  )

  // TODO: These SHOULD error but don't without a wrapper around idb.
  // await db.getAllFromIndex('orders', 'by-customer', KeyRange.gte(100))
  // await db.getAllFromIndex('orders', 'by-total', KeyRange.gte('expensive'))
}

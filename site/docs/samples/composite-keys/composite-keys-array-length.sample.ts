import { createMigrations, openDB, schema } from 'idb-builder'

const migrations = createMigrations().version(1, v =>
  v.createObjectStore({
    name: 'orders',
    schema: schema<{
      customerId: string
      orderNumber: number
      amount: number
      status: string
    }>(),
    primaryKey: ['customerId', 'orderNumber'],
  })
)

const db = await openDB('test-db', migrations)

await db.put('orders', {
  customerId: 'customer-1',
  orderNumber: 0,
  amount: 100,
  status: 'pending',
})

// ---cut---
// @errors: 2345
await db.get('orders', ['customer-1', 0, undefined])

await db.get('orders', ['customer-1'])

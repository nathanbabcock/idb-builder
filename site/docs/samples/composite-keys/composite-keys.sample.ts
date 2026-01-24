// @errors: 2322 2345
import { createMigrations, openDB, schema } from '@typedex/indexed-db'

// Create an object store with a composite primary key
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
    //          ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  })
)

const db = await openDB('test-db', migrations)

await db.put('orders', {
  customerId: 'customer-1',
  orderNumber: 0,
  amount: 100,
  status: 'pending',
})

// ✅ Typesafety on queries for each array member
await db.get('orders', ['customer-1', 0])
//                     ^^^^^^^^^^^^^^^^^

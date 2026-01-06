import { createMigrations, openDB } from '@typedex/indexed-db'
import { z } from 'zod/v4'

const migrations = createMigrations().version(1, v =>
  v.createObjectStore({
    name: 'orders',
    schema: z.object({
      customerId: z.string(),
      orderNumber: z.number(),
      amount: z.number(),
      status: z.string(),
    }),
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
// @errors: 2322
await db.get('orders', ['customer-1', 'asdf'])

await db.get('orders', [123, 0])

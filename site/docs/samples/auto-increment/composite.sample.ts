// @errors: 2741

import { createMigrations, schema } from '@typedex/indexed-db'

// ---cut---
createMigrations().version(1, v =>
  v.createObjectStore({
    name: 'orders',
    schema: schema<{
      customerId: number
      orderId: number
      amount: number
    }>(),
    primaryKey: ['customerId', 'orderId'],
    autoIncrement: true,
  })
)

// @errors: 2741

import { createMigrations } from '@typedex/indexed-db'
import { z } from 'zod/v4'

// ---cut---
createMigrations().version(1, v =>
  v.createObjectStore({
    name: 'orders',
    schema: z.object({
      customerId: z.number(),
      orderId: z.number(),
      amount: z.number(),
    }),
    primaryKey: ['customerId', 'orderId'],
    autoIncrement: true,
  })
)

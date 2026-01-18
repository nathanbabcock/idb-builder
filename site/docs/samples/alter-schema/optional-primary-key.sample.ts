// @errors: 2741

import { createMigrations } from '@typedex/indexed-db'
import { z } from 'zod/v4'

// ---cut---
createMigrations()
  .version(1, v =>
    v.createObjectStore({
      name: 'users',
      schema: z.object({
        id: z.string(),
        name: z.string(),
      }),
      primaryKey: 'id',
    })
  )
  .version(2, v =>
    v.alterSchema('users', oldSchema =>
      oldSchema.extend({
        id: z.string().optional(),
      })
    )
  )

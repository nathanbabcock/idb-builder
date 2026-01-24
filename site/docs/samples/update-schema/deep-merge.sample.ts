import { createMigrations } from '@typedex/indexed-db'
import { z } from 'zod/v4'

// ---cut---
const migrations = createMigrations()
  .version(1, v =>
    v.createObjectStore({
      name: 'users',
      schema: z.object({
        id: z.string(),
        address: z.object({
          street: z.string(),
          city: z.string(),
        }),
      }),
      primaryKey: 'id',
    })
  )
  // Deep merge adds zip to the nested address object
  // while preserving street and city
  .version(2, v => v.updateSchema<'users', { address: { zip?: string } }>())

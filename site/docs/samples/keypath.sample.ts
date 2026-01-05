// @errors: 2740

import { createMigrations } from '@typedex/indexed-db'
import { z } from 'zod/v4'

// ---cut---
createMigrations().version(1, v =>
  v.createObjectStore(
    'users',
    z.object({
      id: z.string(),
      name: z.string(),
    }),
    {
      primaryKey: 'id',
      autoIncrement: true,
    }
  )
)

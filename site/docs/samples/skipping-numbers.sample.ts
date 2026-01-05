import { createMigrations } from '@typedex/indexed-db'
import { z } from 'zod/v4'

// ---cut---
createMigrations()
  .version(1, v =>
    v.createObjectStore({ name: 'users', schema: z.object({ id: z.string() }) })
  )
  // jump straight to v5, skipping v2, v3, and v4
  .version(5, v =>
    v.createObjectStore({ name: 'posts', schema: z.object({ id: z.string() }) })
  )

import { createMigrations } from '@typedex/indexed-db'
import { z } from 'zod/v4'

// ---cut---
createMigrations()
  .version(1, v =>
    v.createObjectStore({ name: 'users', schema: z.object({ id: z.string() }) })
  )
  .version(2, v =>
    v.createObjectStore({ name: 'posts', schema: z.object({ id: z.string() }) })
  )
  .version(3, v =>
    v.createObjectStore({ name: 'stuff', schema: z.object({ id: z.string() }) })
  )

// @errors: 2345

import { createMigrations } from '@typedex/indexed-db'
import { z } from 'zod/v4'

// ---cut---
createMigrations()
  .version(1, v =>
    v.createObjectStore({ name: 'users', schema: z.object({ id: z.string() }) })
  )
  .version(1 + 1, v =>
    v.createObjectStore({ name: 'posts', schema: z.object({ id: z.string() }) })
  )

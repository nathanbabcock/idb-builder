import { createMigrations } from '@typedex/indexed-db'
import { z } from 'zod/v4'

// ---cut---
createMigrations()
  .version(1, v => v.createObjectStore('users', z.object({ id: z.string() })))
  .version(2, v => v.createObjectStore('posts', z.object({ id: z.string() })))
  .version(3, v => v.createObjectStore('stuff', z.object({ id: z.string() })))

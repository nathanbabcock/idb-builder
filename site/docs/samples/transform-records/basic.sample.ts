import { createMigrations } from '@typedex/indexed-db'
import { z } from 'zod/v4'

// ---cut---
const migrations = createMigrations()
  .version(1, v =>
    v.createObjectStore({
      name: 'users',
      schema: z.object({
        id: z.string(),
        firstName: z.string(),
        lastName: z.string(),
      }),
      primaryKey: 'id',
    })
  )
  .version(2, v =>
    v.transformRecords('users', user => ({
      id: user.id,
      name: `${user.firstName} ${user.lastName}`,
    }))
  )

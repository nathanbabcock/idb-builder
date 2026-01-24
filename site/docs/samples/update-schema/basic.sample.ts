import { createMigrations, schema } from '@typedex/indexed-db'

// ---cut---
const migrations = createMigrations()
  .version(1, v =>
    v.createObjectStore({
      name: 'users',
      schema: schema<{ id: string; name: string }>(),
      primaryKey: 'id',
    })
  )
  .version(2, v => v.updateSchema<'users', { email?: string }>())

// @errors: 2740

import { createMigrations, schema } from 'idb-migrate'

// ---cut---
createMigrations()
  .version(1, v =>
    v.createObjectStore({
      name: 'users',
      schema: schema<{ id: string; name: string }>(),
      primaryKey: 'id',
    })
  )
  .version(2, v => v.updateSchema<'users', { email: string }>())

// @errors: 2345

import { createMigrations, schema } from 'idb-migrate'

// ---cut---
createMigrations()
  .version(1, v =>
    v.createObjectStore({ name: 'users', schema: schema<{ id: string }>() })
  )
  .version(1 + 1, v =>
    v.createObjectStore({ name: 'posts', schema: schema<{ id: string }>() })
  )

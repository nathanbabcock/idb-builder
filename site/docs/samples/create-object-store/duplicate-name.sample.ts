// @errors: 2322

import { createMigrations, schema } from 'idb-builder'

// ---cut---
createMigrations().version(1, v =>
  v
    .createObjectStore({
      name: 'users',
      schema: schema<{ id: string }>(),
    })
    .createObjectStore({
      name: 'users',
      schema: schema<{ id: string }>(),
    })
)

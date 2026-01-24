// @errors: 2322

import { createMigrations, schema } from '@typedex/indexed-db'

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

import { createMigrations, schema } from 'idb-builder'

// ---cut---
createMigrations()
  .version(1, v =>
    v.createObjectStore({ name: 'users', schema: schema<{ id: string }>() })
  )
  // jump straight to v5, skipping v2, v3, and v4
  .version(5, v =>
    v.createObjectStore({ name: 'posts', schema: schema<{ id: string }>() })
  )

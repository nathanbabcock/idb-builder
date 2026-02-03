import { createMigrations, schema } from 'idb-builder'

// ---cut---
createMigrations()
  .version(1, v =>
    v.createObjectStore({ name: 'users', schema: schema<{ id: string }>() })
  )
  .version(2, v =>
    v.createObjectStore({ name: 'posts', schema: schema<{ id: string }>() })
  )
  .version(3, v =>
    v.createObjectStore({ name: 'stuff', schema: schema<{ id: string }>() })
  )

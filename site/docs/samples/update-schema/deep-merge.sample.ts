import { createMigrations, schema } from 'idb-builder'

// ---cut---
const migrations = createMigrations()
  .version(1, v =>
    v.createObjectStore({
      name: 'users',
      schema: schema<{
        id: string
        address: { street: string; city: string }
      }>(),
      primaryKey: 'id',
    })
  )
  // Deep merge adds zip to the nested address object
  // while preserving street and city
  .version(2, v => v.updateSchema<'users', { address: { zip?: string } }>())

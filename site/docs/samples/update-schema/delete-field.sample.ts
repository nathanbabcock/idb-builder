import { createMigrations, schema } from 'idb-builder'

// ---cut---
const migrations = createMigrations()
  .version(1, v =>
    v.createObjectStore({
      name: 'users',
      schema: schema<{ id: string; name: string; legacyField: string }>(),
      primaryKey: 'id',
    })
  )
  // Delete a field by setting it to never
  .version(2, v => v.updateSchema<'users', { legacyField: never }>())

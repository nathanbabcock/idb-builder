import { createMigrations, schema } from '@typedex/indexed-db'

// ---cut---
// @errors: 2322
createMigrations().version(1, v =>
  v.createObjectStore({
    name: 'users',
    schema: schema<{
      id: string
      profile: { name: string; settings: { theme: string } }
    }>(),
    primaryKey: 'profile',
  })
)

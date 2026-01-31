import { createMigrations, schema } from '@typedex/indexed-db'

// ---cut---
// @errors: 2322
createMigrations().version(1, v =>
  v.createObjectStore({
    name: 'documents',
    schema: schema<{
      metadata: { id: string; version: number }
      title: string
    }>(),
    primaryKey: 'metadata.nonexistent',
  })
)

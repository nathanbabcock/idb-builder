import { createMigrations, schema } from 'idb-builder'

// @errors: 2322
// ---cut---
createMigrations().version(1, v =>
  v
    .createObjectStore({
      name: 'posts',
      schema: schema<{ id: string; title: string }>(),
      primaryKey: 'id',
    })
    .createIndex('byTitle', {
      storeName: 'posts',
      keyPath: 'title',
      multiEntry: true,
    })
)

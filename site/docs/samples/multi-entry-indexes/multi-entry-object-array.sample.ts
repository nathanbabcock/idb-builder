import { createMigrations, schema } from 'idb-builder'

// ---cut---
// @errors: 2322
createMigrations().version(1, v =>
  v
    .createObjectStore({
      name: 'posts',
      schema: schema<{
        id: string
        authors: { id: string; name: string }[]
      }>(),
    })
    .createIndex('byAuthor', {
      storeName: 'posts',
      keyPath: 'authors',
      multiEntry: true,
    })
)

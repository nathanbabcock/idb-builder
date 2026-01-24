import { createMigrations, schema } from '@typedex/indexed-db'

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

import { createMigrations, schema } from '@typedex/indexed-db'

// @errors: 2741
// ---cut---
createMigrations()
  .version(1, v =>
    v.createObjectStore({
      name: 'posts',
      schema: schema<{
        id: string
        category: string
        subcategory: string
      }>(),
      primaryKey: 'id',
    })
  )
  .version(2, v =>
    v.createIndex('byCategory', {
      storeName: 'posts',
      keyPath: ['category', 'subcategory'],
      multiEntry: true,
    })
  )

import { createMigrations } from '@typedex/indexed-db'
import { z } from 'zod'

// @errors: 2741
// ---cut---
createMigrations()
  .version(1, v =>
    v.createObjectStore({
      name: 'posts',
      schema: z.object({
        id: z.string(),
        category: z.string(),
        subcategory: z.string(),
      }),
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

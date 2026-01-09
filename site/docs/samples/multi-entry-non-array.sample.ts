import { createMigrations } from '@typedex/indexed-db'
import { z } from 'zod'

// @errors: 2322
// ---cut---
createMigrations().version(1, v =>
  v
    .createObjectStore({
      name: 'posts',
      schema: z.object({
        id: z.string(),
        title: z.string(),
      }),
      primaryKey: 'id',
    })
    .createIndex('byTitle', {
      storeName: 'posts',
      keyPath: 'title',
      multiEntry: true,
    })
)

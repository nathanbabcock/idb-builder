import { createMigrations } from '@typedex/indexed-db'
import { z } from 'zod'

// ---cut---
// @errors: 2322
createMigrations().version(1, v =>
  v
    .createObjectStore({
      name: 'posts',
      schema: z.object({
        id: z.string(),
        authors: z.array(z.object({ id: z.string(), name: z.string() })),
      }),
    })
    .createIndex('byAuthor', {
      storeName: 'posts',
      keyPath: 'authors',
      multiEntry: true,
    })
)

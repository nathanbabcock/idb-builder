// @errors: 2322 2345
import { createMigrations, openDB, schema } from 'idb-migrate'

// Nested keys can go multiple levels deep
const migrations = createMigrations().version(1, v =>
  v.createObjectStore({
    name: 'articles',
    schema: schema<{
      metadata: {
        author: { id: string; name: string }
        publishedAt: Date
      }
      content: string
    }>(),
    primaryKey: 'metadata.author.id',
    //          ^^^^^^^^^^^^^^^^^^^^
  })
)

const db = await openDB('test-db', migrations)

await db.put('articles', {
  metadata: {
    author: { id: 'author-1', name: 'Alice' },
    publishedAt: new Date(),
  },
  content: 'Article content...',
})

// ✅ Query by the deeply nested key
const article = await db.get('articles', 'author-1')

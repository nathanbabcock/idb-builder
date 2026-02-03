// @errors: 2322 2345
import { createMigrations, openDB, schema } from 'idb-migrate'

// Create an object store with a nested primary key
const migrations = createMigrations().version(1, v =>
  v.createObjectStore({
    name: 'documents',
    schema: schema<{
      metadata: { id: string; version: number }
      title: string
      content: string
    }>(),
    primaryKey: 'metadata.id',
    //          ^^^^^^^^^^^^^
  })
)

const db = await openDB('test-db', migrations)

await db.put('documents', {
  metadata: { id: 'doc-1', version: 1 },
  title: 'My Document',
  content: 'Hello, world!',
})

// ✅ Queries use the type of the nested field (string)
const doc = await db.get('documents', 'doc-1')
//                                    ^^^^^^^

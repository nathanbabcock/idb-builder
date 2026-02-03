import { createMigrations, openDB, schema } from 'idb-migrate'

// Create an index pointing to an array field in the schema
const migrations = createMigrations().version(1, v =>
  v
    .createObjectStore({
      name: 'posts',
      schema: schema<{
        id: string
        title: string
        tags: string[]
//      ^^^^^^^^^^^^
      }>(),
      primaryKey: 'id',
    })
    .createIndex('byTag', {
      storeName: 'posts',
      keyPath: 'tags',
//    ^^^^^^^^^^^^^^^
      multiEntry: true,
//    ^^^^^^^^^^^^^^^^
    })
)

const db = await openDB('test-db', migrations)

await db.put('posts', {
  id: '1',
  title: 'Learning TypeScript',
  tags: ['typescript', 'javascript', 'tutorial'],
})
await db.put('posts', {
  id: '2',
  title: 'React Basics',
  tags: ['react', 'javascript', 'tutorial'],
})
await db.put('posts', {
  id: '3',
  title: 'Node.js Guide',
  tags: ['nodejs', 'javascript'],
})

// ✅ Query by single tag - finds all three posts
await db.getAllFromIndex('posts', 'byTag', 'javascript')

// ✅ Query by 'tutorial' tag - finds two posts
await db.getAllFromIndex('posts', 'byTag', 'tutorial')

db.close()

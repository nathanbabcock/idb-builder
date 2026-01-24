import { createMigrations, openDB, schema } from '@typedex/indexed-db'

// ---cut---
const migrations = createMigrations().version(1, v =>
  v.createObjectStore({
    name: 'users',
    schema: schema<{ id: string; name: string; email: string }>(),
    primaryKey: 'id',
  })
)

const db = await openDB('my-app', migrations)

// Full type safety on all operations
await db.put('users', { id: '1', name: 'Alice', email: 'alice@example.com' })
const user = await db.get('users', '1')

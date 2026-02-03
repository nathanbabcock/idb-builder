import { createMigrations, openDB, schema } from 'idb-migrate'

const migrations = createMigrations().version(1, v =>
  v.createObjectStore({
    name: 'users',
    schema: schema<{
      id: string
      name: string
      email: string
    }>(),
    primaryKey: 'id',
  })
)
const db = await openDB('my-app', migrations)
// ---cut---
// Insert a record
await db.put('users', {
  id: '1',
  name: 'Alice',
  email: 'alice@example.com',
})

// Retrieve by primary key
const user = await db.get('users', '1')

// Get all records
const allUsers = await db.getAll('users')

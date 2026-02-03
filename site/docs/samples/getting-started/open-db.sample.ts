import { createMigrations, openDB, schema } from 'idb-builder'

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
// ---cut---
const db = await openDB('my-app', migrations)

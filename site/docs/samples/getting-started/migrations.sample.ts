import { createMigrations, schema } from 'idb-builder'

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

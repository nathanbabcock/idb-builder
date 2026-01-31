import { createMigrations, schema } from '@typedex/indexed-db'

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

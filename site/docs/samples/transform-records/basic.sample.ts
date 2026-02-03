import { createMigrations, schema } from 'idb-builder'

// ---cut---
const migrations = createMigrations()
  .version(1, v =>
    v.createObjectStore({
      name: 'users',
      schema: schema<{ id: string; firstName: string; lastName: string }>(),
      primaryKey: 'id',
    })
  )
  .version(2, v =>
    v.transformRecords('users', user => ({
      id: user.id,
      name: `${user.firstName} ${user.lastName}`,
    }))
  )

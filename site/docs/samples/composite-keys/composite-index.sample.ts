// @errors: 2322 2345
import { createMigrations, openDB, schema } from '@typedex/indexed-db'

// Indexes can also use composite key paths
const migrations = createMigrations()
  .version(1, v =>
    v.createObjectStore({
      name: 'users',
      schema: schema<{
        id: string
        firstName: string
        lastName: string
        email: string
      }>(),
      primaryKey: 'id',
    })
  )
  .version(2, v =>
    v.createIndex('byFullName', {
      storeName: 'users',
      keyPath: ['firstName', 'lastName'],
      //       ^^^^^^^^^^^^^^^^^^^^^^^^^^
    })
  )

const db = await openDB('test-db', migrations)

await db.put('users', {
  id: 'user-1',
  firstName: 'Alice',
  lastName: 'Smith',
  email: 'alice@example.com',
})

// ✅ Query by the composite index
const users = await db.getAllFromIndex('users', 'byFullName', ['Alice', 'Smith'])
//                                                            ^^^^^^^^^^^^^^^^^

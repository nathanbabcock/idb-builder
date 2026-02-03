// @errors: 2322 2345
import { createMigrations, openDB, schema } from 'idb-builder'

// Nested keys also work with indexes
const migrations = createMigrations()
  .version(1, v =>
    v.createObjectStore({
      name: 'users',
      schema: schema<{
        id: string
        address: { city: string; zip: string }
      }>(),
      primaryKey: 'id',
    })
  )
  .version(2, v =>
    v.createIndex('byCity', {
      storeName: 'users',
      keyPath: 'address.city',
      //       ^^^^^^^^^^^^^^
    })
  )

const db = await openDB('test-db', migrations)

await db.put('users', {
  id: 'user-1',
  address: { city: 'New York', zip: '10001' },
})

// ✅ Query by the nested index
const users = await db.getAllFromIndex('users', 'byCity', 'New York')

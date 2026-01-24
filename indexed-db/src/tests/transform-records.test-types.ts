import { createMigrations } from '../lib/migration-builder'
import { schema } from '../lib/schema'

void function testTransformRecordsAcceptsValidObjectStoreNames() {
  createMigrations()
    .version(1, v =>
      v.createObjectStore({
        name: 'users',
        schema: schema<{ id: string; name: string }>(),
      })
    )
    .version(2, v =>
      v.transformRecords('users', row => ({
        id: row.id,
        displayName: row.name.toUpperCase(),
      }))
    )
}

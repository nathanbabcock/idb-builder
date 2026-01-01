import z from 'zod'
import { createMigrations } from '../lib/migration-builder'

void function testTransformRecordsAcceptsValidObjectStoreNames() {
  createMigrations()
    .version(1, v =>
      v.createObjectStore(
        'users',
        z.object({
          id: z.string(),
          name: z.string(),
        })
      )
    )
    .version(2, v =>
      v.transformRecords('users', row => ({
        id: row.id,
        displayName: row.name.toUpperCase(),
      }))
    )
}

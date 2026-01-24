import { createMigrations } from '../lib/migration-builder'
import { schema } from '../lib/schema'
import type { InferSchema } from '../lib/migration-builder.types'

void function testInferSchemaExtractsCorrectFinalSchemaType() {
  const migrations = createMigrations()
    .version(1, v =>
      v.createObjectStore({
        name: 'users',
        schema: schema<{ id: string; name: string }>(),
      })
    )
    .version(2, v =>
      v.createObjectStore({
        name: 'posts',
        schema: schema<{ id: string; title: string }>(),
      })
    )

  type Schema = InferSchema<typeof migrations>

  // Verify InferSchema works correctly with type assertions
  void ({
    users: { id: 'user-1', name: 'Alice' },
    posts: { id: 'post-1', title: 'Hello World' },
  } satisfies Schema)
}

void function testInferSchemaShouldReflectTransformations() {
  const migrations = createMigrations()
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

  type Schema = InferSchema<typeof migrations>

  // Verify transformed schema has correct shape
  void ({
    users: { id: 'user-1', displayName: 'ALICE' },
  } satisfies Schema)
}

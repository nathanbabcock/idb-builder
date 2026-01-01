import { z } from 'zod'
import { createMigrations } from '../lib/migration-builder'
import type { InferSchema } from '../lib/migration-builder.types'

void function testInferSchemaExtractsCorrectFinalSchemaType() {
  const migrations = createMigrations()
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
      v.createObjectStore(
        'posts',
        z.object({
          id: z.string(),
          title: z.string(),
        })
      )
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

  type Schema = InferSchema<typeof migrations>

  // Verify transformed schema has correct shape
  void ({
    users: { id: 'user-1', displayName: 'ALICE' },
  } satisfies Schema)
}

import z from 'zod'
import { createMigrations } from '../lib/migration-builder'
import type { InferSchema } from '../lib/migration-builder.types'

// refactor: unify w/ alterObjectStore tests

void function testSimpleExtendPreservesTypeInformation() {
  const migrations = createMigrations()
    .version(1, v =>
      v.createObjectStore({
        name: 'users',
        schema: z.object({
          id: z.string(),
          name: z.string(),
        }),
      })
    )
    .version(2, v =>
      v.alterObjectStore('users', oldSchema =>
        oldSchema.extend({
          email: z.string().optional(),
        })
      )
    )

  type Schema = InferSchema<typeof migrations>

  void ({
    id: 'user-1',
    name: 'Alice',
    email: 'alice@example.com',
  } satisfies Schema['users'])
}

void function testExtendWithNestedObjectReplacement() {
  const migrations = createMigrations()
    .version(1, v =>
      v.createObjectStore({
        name: 'triggers',
        schema: z.object({
          id: z.string(),
          settings: z.object({
            prompt: z.string(),
          }),
        }),
      })
    )
    .version(2, v =>
      v.alterObjectStore('triggers', oldSchema =>
        oldSchema.extend({
          settings: z.object({
            prompt: z.string(),
            imageBase64: z.string().optional(),
          }),
        })
      )
    )

  type Schema = InferSchema<typeof migrations>
  type Trigger = Schema['triggers']

  // Does this preserve the type or become Record<string, unknown>?
  void ({
    id: 'trigger-1',
    settings: {
      prompt: 'test',
      imageBase64: 'data:image/png…',
    },
  } satisfies Trigger)

  void ({
    id: 'trigger-1',
    settings: { prompt: 'test' },
    // @ts-expect-error - should not allow unknown fields if inference works
    unknownField: 'oops',
  } satisfies Schema['triggers'])
}

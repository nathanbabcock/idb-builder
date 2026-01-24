import z from 'zod'
import { createMigrations } from '../lib/migration-builder'
import type { InferSchema } from '../lib/migration-builder.types'

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
    .version(2, v => v.updateSchema<'users', { email?: string }>())

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
    // Deep merge adds imageBase64 to the nested settings object
    .version(2, v => v.updateSchema<'triggers', { settings: { imageBase64?: string } }>())

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

import z from 'zod'
import { createMigrations } from '../lib/migration-builder'
import type { InferSchema } from '../lib/migration-builder.types'

void function testAlterTableAddsOptionalProperties() {
  const migrations = createMigrations()
    .version(1, v => v.createObjectStore({ name: 'users', schema: z.object({ id: z.string() }) }))
    .version(2, v =>
      v.alterObjectStore('users', oldSchema =>
        oldSchema.extend({
          email: z.string().optional(),
        })
      )
    )
  type Schema = InferSchema<typeof migrations>
  type User = Schema['users']

  // Verify optional properties can be omitted
  void ({ id: 'asdf' } satisfies User)

  // Verify optional properties can be provided
  void ({ id: 'asdf', email: 'test@example.com' } satisfies User)

  // Verify optional properties can be undefined
  void ({ id: 'asdf', email: undefined } satisfies User)
}

void function testAlterTableCanExtendNestedObjects() {
  const migrations = createMigrations()
    .version(1, v => v.createObjectStore({ name: 'users', schema: z.object({ id: z.string() }) }))
    .version(2, v =>
      v.alterObjectStore('users', oldSchema =>
        oldSchema.extend({
          settings: z.object({ theme: z.string().optional() }).optional(),
        })
      )
    )

  type Schema = InferSchema<typeof migrations>
  type User = Schema['users']

  // Verify nested optional object can be omitted
  void ({ id: 'asdf' } satisfies User)

  // Verify nested optional object can be provided with theme
  void ({ id: 'asdf', settings: { theme: 'dark' } } satisfies User)

  // Verify nested optional object theme can be omitted
  void ({ id: 'asdf', settings: {} } satisfies User)

  // Verify nested optional object can be undefined
  void ({ id: 'asdf', settings: undefined } satisfies User)
}

// =============================================================================
// Backwards-compatibility validation
// =============================================================================

void function testAlterObjectStoreRejectsAddingRequiredField() {
  createMigrations()
    .version(1, v => v.createObjectStore({ name: 'users', schema: z.object({ id: z.string() }) }))
    .version(2, v =>
      v.alterObjectStore('users', oldSchema =>
        // @ts-expect-error adding required field is not backwards-compatible
        oldSchema.extend({ email: z.string() })
      )
    )
}

void function testAlterObjectStoreAllowsWideningType() {
  createMigrations()
    .version(1, v =>
      v.createObjectStore({
        name: 'items',
        schema: z.object({ id: z.string(), status: z.literal('active') }),
      })
    )
    .version(2, v =>
      v.alterObjectStore('items', oldSchema =>
        oldSchema.extend({ status: z.string() })
      )
    )
}

void function testAlterObjectStoreRejectsNarrowingType() {
  createMigrations()
    .version(1, v =>
      v.createObjectStore({
        name: 'items',
        schema: z.object({ id: z.string(), status: z.string() }),
      })
    )
    .version(2, v =>
      v.alterObjectStore('items', oldSchema =>
        // @ts-expect-error narrowing type is not backwards-compatible
        oldSchema.extend({ status: z.literal('active') })
      )
    )
}

void function testAlterObjectStoreRejectsChangingFieldType() {
  createMigrations()
    .version(1, v =>
      v.createObjectStore({
        name: 'counters',
        schema: z.object({ id: z.string(), count: z.number() }),
      })
    )
    .version(2, v =>
      v.alterObjectStore('counters', oldSchema =>
        // @ts-expect-error changing field type is not backwards-compatible
        oldSchema.extend({ count: z.string() })
      )
    )
}

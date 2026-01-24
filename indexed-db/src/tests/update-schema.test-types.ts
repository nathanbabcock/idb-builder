import { createMigrations } from '../lib/migration-builder'
import { schema } from '../lib/schema'
import type { InferSchema } from '../lib/migration-builder.types'

void function testUpdateSchemaAddsOptionalProperties() {
  const migrations = createMigrations()
    .version(1, v => v.createObjectStore({ name: 'users', schema: schema<{ id: string }>() }))
    .version(2, v => v.updateSchema<'users', { email?: string }>())

  type Schema = InferSchema<typeof migrations>
  type User = Schema['users']

  // Verify optional properties can be omitted
  void ({ id: 'asdf' } satisfies User)

  // Verify optional properties can be provided
  void ({ id: 'asdf', email: 'test@example.com' } satisfies User)

  // Verify optional properties can be undefined
  void ({ id: 'asdf', email: undefined } satisfies User)
}

void function testUpdateSchemaCanExtendNestedObjects() {
  const migrations = createMigrations()
    .version(1, v =>
      v.createObjectStore({
        name: 'users',
        schema: schema<{ id: string; settings: { theme: string } }>(),
      })
    )
    .version(2, v => v.updateSchema<'users', { settings: { notifications?: boolean } }>())

  type Schema = InferSchema<typeof migrations>
  type User = Schema['users']

  // Verify nested object preserves existing properties
  void ({ id: 'asdf', settings: { theme: 'dark' } } satisfies User)

  // Verify nested optional property can be provided
  void ({ id: 'asdf', settings: { theme: 'dark', notifications: true } } satisfies User)

  // Verify nested optional property can be omitted
  void ({ id: 'asdf', settings: { theme: 'light' } } satisfies User)
}

void function testUpdateSchemaDeepMergesNestedObjects() {
  const migrations = createMigrations()
    .version(1, v =>
      v.createObjectStore({
        name: 'users',
        schema: schema<{ id: string; address: { street: string; city: string } }>(),
      })
    )
    .version(2, v => v.updateSchema<'users', { address: { zip?: string } }>())

  type Schema = InferSchema<typeof migrations>
  type User = Schema['users']

  // Verify deep merge preserves street and city
  void ({
    id: 'asdf',
    address: { street: '123 Main St', city: 'Anytown' },
  } satisfies User)

  // Verify zip can be added
  void ({
    id: 'asdf',
    address: { street: '123 Main St', city: 'Anytown', zip: '12345' },
  } satisfies User)
}

void function testUpdateSchemaDeletesWithNever() {
  const migrations = createMigrations()
    .version(1, v =>
      v.createObjectStore({
        name: 'users',
        schema: schema<{ id: string; name: string; legacyField: string }>(),
      })
    )
    .version(2, v => v.updateSchema<'users', { legacyField: never }>())

  type Schema = InferSchema<typeof migrations>
  type User = Schema['users']

  // Verify legacyField is removed
  void ({ id: 'asdf', name: 'John' } satisfies User)

  // @ts-expect-error legacyField should not exist
  void ({ id: 'asdf', name: 'John', legacyField: 'value' } satisfies User)
}

void function testUpdateSchemaDeletesNestedWithNever() {
  const migrations = createMigrations()
    .version(1, v =>
      v.createObjectStore({
        name: 'users',
        schema: schema<{
          id: string
          address: { street: string; city: string; legacyZone: string }
        }>(),
      })
    )
    .version(2, v => v.updateSchema<'users', { address: { legacyZone: never } }>())

  type Schema = InferSchema<typeof migrations>
  type User = Schema['users']

  // Verify legacyZone is removed but street and city remain
  void ({
    id: 'asdf',
    address: { street: '123 Main St', city: 'Anytown' },
  } satisfies User)
}

// =============================================================================
// Backwards-compatibility validation
// =============================================================================

void function testUpdateSchemaRejectsAddingRequiredField() {
  createMigrations()
    .version(1, v => v.createObjectStore({ name: 'users', schema: schema<{ id: string }>() }))
    // @ts-expect-error adding required field is not backwards-compatible
    .version(2, v => v.updateSchema<'users', { email: string }>())
}

void function testUpdateSchemaAllowsWideningType() {
  createMigrations()
    .version(1, v =>
      v.createObjectStore({
        name: 'items',
        schema: schema<{ id: string; status: 'active' }>(),
      })
    )
    .version(2, v => v.updateSchema<'items', { status: string }>())
}

void function testUpdateSchemaRejectsNarrowingType() {
  createMigrations()
    .version(1, v =>
      v.createObjectStore({
        name: 'items',
        schema: schema<{ id: string; status: string }>(),
      })
    )
    // @ts-expect-error narrowing type is not backwards-compatible
    .version(2, v => v.updateSchema<'items', { status: 'active' }>())
}

void function testUpdateSchemaRejectsChangingFieldType() {
  createMigrations()
    .version(1, v =>
      v.createObjectStore({
        name: 'counters',
        schema: schema<{ id: string; count: number }>(),
      })
    )
    // @ts-expect-error changing field type is not backwards-compatible
    .version(2, v => v.updateSchema<'counters', { count: string }>())
}

void function testUpdateSchemaMakesPropertyOptional() {
  const migrations = createMigrations()
    .version(1, v =>
      v.createObjectStore({
        name: 'users',
        schema: schema<{ id: string; name: string }>(),
      })
    )
    .version(2, v => v.updateSchema<'users', { name?: string }>())

  type Schema = InferSchema<typeof migrations>
  type User = Schema['users']

  // Verify name is now optional
  void ({ id: 'asdf' } satisfies User)
  void ({ id: 'asdf', name: 'John' } satisfies User)
  void ({ id: 'asdf', name: undefined } satisfies User)
}

void function testUpdateSchemaReplacesArraysEntirely() {
  const migrations = createMigrations()
    .version(1, v =>
      v.createObjectStore({
        name: 'users',
        schema: schema<{ id: string; tags: string[] }>(),
      })
    )
    .version(2, v => v.updateSchema<'users', { tags: (string | number)[] }>())

  type Schema = InferSchema<typeof migrations>
  type User = Schema['users']

  // Verify array type is replaced
  void ({ id: 'asdf', tags: ['a', 1, 'b'] } satisfies User)
}

void function testUpdateSchemaPreservesDiscriminatedUnions() {
  const migrations = createMigrations()
    .version(1, v =>
      v.createObjectStore({
        name: 'pets',
        schema: schema<
          | { type: 'dog'; breed: string }
          | { type: 'cat'; indoor: boolean }
        >(),
      })
    )
    .version(2, v => v.updateSchema<'pets', { name?: string }>())

  type Schema = InferSchema<typeof migrations>
  type Pet = Schema['pets']

  // Verify discriminated union is preserved with optional property added to each variant
  void ({ type: 'dog', breed: 'Golden Retriever' } satisfies Pet)
  void ({ type: 'dog', breed: 'Golden Retriever', name: 'Buddy' } satisfies Pet)
  void ({ type: 'cat', indoor: true } satisfies Pet)
  void ({ type: 'cat', indoor: true, name: 'Whiskers' } satisfies Pet)
}

import type { DBSchema } from 'idb'
import { createMigrations } from '../lib/migration-builder'
import { schema } from '../lib/schema'

// Define test schemas in IDBSchema format
interface UsersSchema extends DBSchema {
  users: { key: string; value: { id: string; name: string } }
}

interface UsersWithEmailSchema extends DBSchema {
  users: { key: string; value: { id: string; name: string; email: string } }
}

interface PostsSchema extends DBSchema {
  posts: { key: string; value: { id: string; title: string } }
}

void function testSchemaValidationMatchesExpected() {
  createMigrations()
    .version(1, v =>
      v.createObjectStore({
        name: 'users',
        schema: schema<{ id: string; name: string }>(),
      })
    )
    .expectType<UsersSchema>()
}

void function testSchemaValidationFailsWhenMismatch() {
  createMigrations()
    .version(1, v =>
      v.createObjectStore({
        name: 'users',
        schema: schema<{ id: string; name: string }>(),
      })
    )
    // @ts-expect-error computed schema has 'users', expected has 'posts'
    .expectType<PostsSchema>()
}

void function testSchemaValidationPassesWhenExpectedHasExtraProperties() {
  // (Expected can be a superset of computed - stricter than needed)
  createMigrations()
    .version(1, v =>
      v.createObjectStore({
        name: 'users',
        schema: schema<{ id: string; name: string }>(),
      })
    )
    .expectType<UsersWithEmailSchema>()
}

void function testSchemaValidationFailsWhenComputedHasExtraProperties() {
  // (Computed cannot have fields that Expected doesn't declare)
  createMigrations()
    .version(1, v =>
      v.createObjectStore({
        name: 'users',
        schema: schema<{ id: string; name: string; email: string }>(),
      })
    )
    // @ts-expect-error computed has 'email' but expected doesn't
    .expectType<UsersSchema>()
}

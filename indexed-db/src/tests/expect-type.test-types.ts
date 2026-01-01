import type { DBSchema } from 'idb'
import z from 'zod'
import { createMigrations } from '../lib/migration-builder'

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
      v.createObjectStore(
        'users',
        z.object({
          id: z.string(),
          name: z.string(),
        })
      )
    )
    .expectType<UsersSchema>()
}

void function testSchemaValidationFailsWhenMismatch() {
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
    // @ts-expect-error computed schema has 'users', expected has 'posts'
    .expectType<PostsSchema>()
}

void function testSchemaValidationPassesWhenExpectedHasExtraProperties() {
  // (Expected can be a superset of computed - stricter than needed)
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
    .expectType<UsersWithEmailSchema>()
}

void function testSchemaValidationFailsWhenComputedHasExtraProperties() {
  // (Computed cannot have fields that Expected doesn't declare)
  createMigrations()
    .version(1, v =>
      v.createObjectStore(
        'users',
        z.object({
          id: z.string(),
          name: z.string(),
          email: z.string(),
        })
      )
    )
    // @ts-expect-error computed has 'email' but expected doesn't
    .expectType<UsersSchema>()
}

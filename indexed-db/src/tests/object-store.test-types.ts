import z from 'zod'
import { createMigrations } from '../lib/migration-builder'

void function testDeleteObjectStoreOnlyAcceptsStoresThatExist() {
  createMigrations()
    .version(1, v => v.createObjectStore({ name: 'users', schema: z.object({ id: z.string() }) }))
    // @ts-expect-error 'nonexistent' was never created
    .version(2, v => v.deleteObjectStore('nonexistent'))
}

void function testDeleteObjectStoreAcceptsStoresThatWereCreated() {
  createMigrations()
    .version(1, v => v.createObjectStore({ name: 'users', schema: z.object({ id: z.string() }) }))
    .version(2, v => v.deleteObjectStore('users'))
}

void function testDeleteObjectStoreDoesNotAcceptAlreadyDeletedStores() {
  createMigrations()
    .version(1, v => v.createObjectStore({ name: 'users', schema: z.object({ id: z.string() }) }))
    .version(2, v => v.deleteObjectStore('users'))
    // @ts-expect-error 'users' was deleted in v2
    .version(3, v => v.deleteObjectStore('users'))
}

void function testSchemaAccumulatesAcrossVersions() {
  createMigrations()
    .version(1, v => v.createObjectStore({ name: 'users', schema: z.object({ id: z.string() }) }))
    .version(2, v => v.createObjectStore({ name: 'posts', schema: z.object({ id: z.string() }) }))
    .version(3, v => v.deleteObjectStore('users').deleteObjectStore('posts'))
}

void function testCreateObjectStoreDoesNotAcceptStoresThatAlreadyExist() {
  createMigrations()
    .version(1, v => v.createObjectStore({ name: 'users', schema: z.object({ id: z.string() }) }))
    .version(2, v =>
      // @ts-expect-error 'users' already exists
      v.createObjectStore({ name: 'users', schema: z.object({ id: z.string() }) })
    )
}

void function testCreateObjectStoreAcceptsPreviouslyDeletedStores() {
  createMigrations()
    .version(1, v => v.createObjectStore({ name: 'users', schema: z.object({ id: z.string() }) }))
    .version(2, v => v.deleteObjectStore('users'))
    .version(3, v => v.createObjectStore({ name: 'users', schema: z.object({ id: z.string() }) }))
}

void function testFullLifecycleCreateDeleteCreateDelete() {
  createMigrations()
    .version(1, v => v.createObjectStore({ name: 'users', schema: z.object({ id: z.string() }) }))
    .version(2, v => v.deleteObjectStore('users'))
    .version(3, v => v.createObjectStore({ name: 'users', schema: z.object({ id: z.string() }) }))
    .version(4, v => v.deleteObjectStore('users'))
}

void function testCreatingDuplicateStoresInSameVersionIsCaught() {
  createMigrations().version(1, v =>
    v
      .createObjectStore({ name: 'users', schema: z.object({ id: z.string() }) })
      // @ts-expect-error 'users' already created above - NOW CAUGHT!
      .createObjectStore({ name: 'users', schema: z.object({ id: z.string() }) })
  )
}

void function testDeletingSameStoreTwiceInSameVersionIsCaught() {
  createMigrations()
    .version(1, v => v.createObjectStore({ name: 'users', schema: z.object({ id: z.string() }) }))
    .version(2, v =>
      v
        .deleteObjectStore('users')
        // @ts-expect-error 'users' already deleted above - NOW CAUGHT!
        .deleteObjectStore('users')
    )
}

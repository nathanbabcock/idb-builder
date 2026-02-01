import { createMigrations } from '../lib/migration-builder'
import { schema } from '../lib/schema'

// =============== renameObjectStore Tests ===============

void function testRenameObjectStoreBasic() {
  createMigrations()
    .version(1, v =>
      v.createObjectStore({
        name: 'users',
        schema: schema<{ id: string; name: string }>(),
        primaryKey: 'id',
      })
    )
    .version(2, v =>
      v.renameObjectStore({ oldName: 'users', newName: 'people' })
    )
}

void function testRenameObjectStorePreservesStoreInfo() {
  // After renaming, the new store should have the same schema and indexes
  createMigrations()
    .version(1, v =>
      v
        .createObjectStore({
          name: 'users',
          schema: schema<{ id: string; name: string; email: string }>(),
          primaryKey: 'id',
        })
        .createIndex('byEmail', { storeName: 'users', keyPath: 'email' })
    )
    .version(2, v =>
      v.renameObjectStore({ oldName: 'users', newName: 'people' })
    )
    // Should be able to delete index on renamed store using new name
    .version(3, v => v.deleteIndex('byEmail', { storeName: 'people' }))
}

void function testRenameObjectStoreRejectsNonExistentStore() {
  createMigrations()
    .version(1, v =>
      v.createObjectStore({
        name: 'users',
        schema: schema<{ id: string }>(),
      })
    )
    .version(2, v =>
      // @ts-expect-error 'nonexistent' store does not exist
      v.renameObjectStore({ oldName: 'nonexistent', newName: 'people' })
    )
}

void function testRenameObjectStoreRejectsExistingTargetName() {
  createMigrations()
    .version(1, v =>
      v
        .createObjectStore({ name: 'users', schema: schema<{ id: string }>() })
        .createObjectStore({ name: 'people', schema: schema<{ id: string }>() })
    )
    .version(2, v =>
      // @ts-expect-error 'people' already exists
      v.renameObjectStore({ oldName: 'users', newName: 'people' })
    )
}

void function testRenameObjectStoreOldNameNoLongerAvailable() {
  createMigrations()
    .version(1, v =>
      v.createObjectStore({ name: 'users', schema: schema<{ id: string }>() })
    )
    .version(2, v =>
      v.renameObjectStore({ oldName: 'users', newName: 'people' })
    )
    .version(3, v =>
      // @ts-expect-error 'users' was renamed to 'people'
      v.deleteObjectStore('users')
    )
}

void function testRenameObjectStoreCanDeleteWithNewName() {
  createMigrations()
    .version(1, v =>
      v.createObjectStore({ name: 'users', schema: schema<{ id: string }>() })
    )
    .version(2, v =>
      v.renameObjectStore({ oldName: 'users', newName: 'people' })
    )
    .version(3, v => v.deleteObjectStore('people'))
}

// =============== renameIndex Tests ===============

void function testRenameIndexBasic() {
  createMigrations()
    .version(1, v =>
      v
        .createObjectStore({
          name: 'users',
          schema: schema<{ id: string; email: string }>(),
        })
        .createIndex('byEmail', { storeName: 'users', keyPath: 'email' })
    )
    .version(2, v =>
      v.renameIndex({
        storeName: 'users',
        oldIndexName: 'byEmail',
        newIndexName: 'emailIndex',
      })
    )
}

void function testRenameIndexRejectsNonExistentIndex() {
  createMigrations()
    .version(1, v =>
      v
        .createObjectStore({
          name: 'users',
          schema: schema<{ id: string; email: string }>(),
        })
        .createIndex('byEmail', { storeName: 'users', keyPath: 'email' })
    )
    .version(2, v =>
      v.renameIndex({
        storeName: 'users',
        // @ts-expect-error 'nonexistent' index does not exist
        oldIndexName: 'nonexistent',
        newIndexName: 'newIndex',
      })
    )
}

void function testRenameIndexRejectsNonExistentStore() {
  createMigrations()
    .version(1, v =>
      v.createObjectStore({
        name: 'users',
        schema: schema<{ id: string }>(),
      })
    )
    .version(2, v =>
      v.renameIndex({
        // @ts-expect-error 'nonexistent' store does not exist
        storeName: 'nonexistent',
        // @ts-expect-error cascading error from invalid store
        oldIndexName: 'byEmail',
        newIndexName: 'emailIndex',
      })
    )
}

void function testRenameIndexRejectsExistingTargetName() {
  createMigrations()
    .version(1, v =>
      v
        .createObjectStore({
          name: 'users',
          schema: schema<{ id: string; email: string; name: string }>(),
        })
        .createIndex('byEmail', { storeName: 'users', keyPath: 'email' })
        .createIndex('byName', { storeName: 'users', keyPath: 'name' })
    )
    .version(2, v =>
      v.renameIndex({
        storeName: 'users',
        oldIndexName: 'byEmail',
        // @ts-expect-error 'byName' already exists
        newIndexName: 'byName',
      })
    )
}

void function testRenameIndexOldNameNoLongerAvailable() {
  createMigrations()
    .version(1, v =>
      v
        .createObjectStore({
          name: 'users',
          schema: schema<{ id: string; email: string }>(),
        })
        .createIndex('byEmail', { storeName: 'users', keyPath: 'email' })
    )
    .version(2, v =>
      v.renameIndex({
        storeName: 'users',
        oldIndexName: 'byEmail',
        newIndexName: 'emailIndex',
      })
    )
    .version(3, v =>
      // @ts-expect-error 'byEmail' was renamed to 'emailIndex'
      v.deleteIndex('byEmail', { storeName: 'users' })
    )
}

void function testRenameIndexCanDeleteWithNewName() {
  createMigrations()
    .version(1, v =>
      v
        .createObjectStore({
          name: 'users',
          schema: schema<{ id: string; email: string }>(),
        })
        .createIndex('byEmail', { storeName: 'users', keyPath: 'email' })
    )
    .version(2, v =>
      v.renameIndex({
        storeName: 'users',
        oldIndexName: 'byEmail',
        newIndexName: 'emailIndex',
      })
    )
    .version(3, v => v.deleteIndex('emailIndex', { storeName: 'users' }))
}

// =============== Name Swapping Tests ===============

void function testSwapObjectStoreNames() {
  // Swapping requires a temporary name
  createMigrations()
    .version(1, v =>
      v
        .createObjectStore({ name: 'a', schema: schema<{ id: string }>() })
        .createObjectStore({ name: 'b', schema: schema<{ id: number }>() })
    )
    .version(2, v =>
      v
        .renameObjectStore({ oldName: 'a', newName: 'temp' })
        .renameObjectStore({ oldName: 'b', newName: 'a' })
        .renameObjectStore({ oldName: 'temp', newName: 'b' })
    )
}

void function testSwapIndexNames() {
  // Swapping requires a temporary name
  createMigrations()
    .version(1, v =>
      v
        .createObjectStore({
          name: 'users',
          schema: schema<{ id: string; email: string; name: string }>(),
        })
        .createIndex('byEmail', { storeName: 'users', keyPath: 'email' })
        .createIndex('byName', { storeName: 'users', keyPath: 'name' })
    )
    .version(2, v =>
      v
        .renameIndex({
          storeName: 'users',
          oldIndexName: 'byEmail',
          newIndexName: 'temp',
        })
        .renameIndex({
          storeName: 'users',
          oldIndexName: 'byName',
          newIndexName: 'byEmail',
        })
        .renameIndex({
          storeName: 'users',
          oldIndexName: 'temp',
          newIndexName: 'byName',
        })
    )
}

// =============== Chaining with other operations ===============

void function testRenameAndThenCreateNewWithOldName() {
  // After renaming, the old name should be available for reuse
  createMigrations()
    .version(1, v =>
      v.createObjectStore({
        name: 'users',
        schema: schema<{ id: string }>(),
      })
    )
    .version(2, v =>
      v.renameObjectStore({ oldName: 'users', newName: 'people' })
    )
    .version(3, v =>
      v.createObjectStore({
        name: 'users', // Can reuse the old name
        schema: schema<{ id: number }>(),
      })
    )
}

void function testRenameIndexAndThenCreateNewWithOldName() {
  // After renaming an index, the old name should be available for reuse
  createMigrations()
    .version(1, v =>
      v
        .createObjectStore({
          name: 'users',
          schema: schema<{ id: string; email: string; name: string }>(),
        })
        .createIndex('byEmail', { storeName: 'users', keyPath: 'email' })
    )
    .version(2, v =>
      v.renameIndex({
        storeName: 'users',
        oldIndexName: 'byEmail',
        newIndexName: 'emailIndex',
      })
    )
    .version(3, v =>
      v.createIndex('byEmail', {
        storeName: 'users',
        keyPath: 'name', // Can reuse the old index name with different keyPath
      })
    )
}

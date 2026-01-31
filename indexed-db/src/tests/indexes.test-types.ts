import { createMigrations } from '../lib/migration-builder'
import { schema } from '../lib/schema'

void function testCreateIndexKeyPathIsTypeSafe() {
  createMigrations()
    .version(1, v =>
      v.createObjectStore({
        name: 'users',
        schema: schema<{ id: string; email: string }>(),
      })
    )
    .version(2, v =>
      v.createIndex('byEmail', { storeName: 'users', keyPath: 'email' })
    )
}

void function testCreateIndexRejectsInvalidKeyPath() {
  createMigrations()
    .version(1, v =>
      v.createObjectStore({
        name: 'users',
        schema: schema<{ id: string; email: string }>(),
      })
    )
    .version(2, v =>
      v.createIndex('byFoo', {
        storeName: 'users',
        // @ts-expect-error 'nonexistent' is not a key of users
        keyPath: 'nonexistent',
      })
    )
}

void function testCreateIndexSupportsNestedKeyPath() {
  createMigrations()
    .version(1, v =>
      v.createObjectStore({
        name: 'users',
        schema: schema<{
          id: string
          address: { city: string; zip: string }
        }>(),
      })
    )
    .version(2, v =>
      v.createIndex('byCity', { storeName: 'users', keyPath: 'address.city' })
    )
}

void function testCreateIndexOnStoreCreatedInSameVersion() {
  createMigrations().version(1, v =>
    v
      .createObjectStore({
        name: 'users',
        schema: schema<{ id: string; email: string }>(),
      })
      .createIndex('byEmail', { storeName: 'users', keyPath: 'email' })
  )
}

void function testDeleteIndexOnlyAcceptsExistingIndexes() {
  createMigrations()
    .version(1, v =>
      v.createObjectStore({
        name: 'users',
        schema: schema<{ id: string; email: string }>(),
      })
    )
    .version(2, v =>
      v.createIndex('byEmail', { storeName: 'users', keyPath: 'email' })
    )
    .version(3, v => v.deleteIndex('byEmail', { storeName: 'users' }))
}

void function testDeleteIndexRejectsNonExistentIndexNames() {
  createMigrations()
    .version(1, v =>
      v.createObjectStore({
        name: 'users',
        schema: schema<{ id: string; email: string }>(),
      })
    )
    .version(2, v =>
      // @ts-expect-error 'byEmail' index was never created
      v.deleteIndex('byEmail', { storeName: 'users' })
    )
}

void function testDeleteIndexRejectsAlreadyDeletedIndexes() {
  createMigrations()
    .version(1, v =>
      v.createObjectStore({
        name: 'users',
        schema: schema<{ id: string; email: string }>(),
      })
    )
    .version(2, v =>
      v.createIndex('byEmail', { storeName: 'users', keyPath: 'email' })
    )
    .version(3, v => v.deleteIndex('byEmail', { storeName: 'users' }))
    .version(4, v =>
      // @ts-expect-error 'byEmail' was deleted in v3
      v.deleteIndex('byEmail', { storeName: 'users' })
    )
}

void function testCreateIndexCannotBeCalledTwiceWithSameName() {
  createMigrations()
    .version(1, v =>
      v.createObjectStore({
        name: 'users',
        schema: schema<{ id: string; email: string }>(),
      })
    )
    .version(2, v =>
      v.createIndex('byEmail', { storeName: 'users', keyPath: 'email' })
    )
    .version(3, v =>
      // @ts-expect-error 'byEmail' index already exists
      v.createIndex('byEmail', { storeName: 'users', keyPath: 'id' })
    )
}

void function testCreateIndexCanReuseNameAfterDeleteIndex() {
  createMigrations()
    .version(1, v =>
      v.createObjectStore({
        name: 'users',
        schema: schema<{ id: string; email: string }>(),
      })
    )
    .version(2, v =>
      v.createIndex('byEmail', { storeName: 'users', keyPath: 'email' })
    )
    .version(3, v => v.deleteIndex('byEmail', { storeName: 'users' }))
    .version(4, v =>
      v.createIndex('byEmail', { storeName: 'users', keyPath: 'id' })
    )
}

void function testValidCompositeKeyPath() {
  createMigrations()
    .version(1, v =>
      v.createObjectStore({
        name: 'users',
        schema: schema<{
          id: string
          firstName: string
          lastName: string
          email: string
        }>(),
      })
    )
    .version(2, v =>
      v.createIndex('byFullName', {
        storeName: 'users',
        keyPath: ['firstName', 'lastName'],
      })
    )
}

void function testInvalidateCompositeKeyPath() {
  createMigrations()
    .version(1, v =>
      v.createObjectStore({
        name: 'users',
        schema: schema<{ id: string; firstName: string; lastName: string }>(),
      })
    )
    .version(2, v =>
      v.createIndex('byFullName', {
        storeName: 'users',
        // @ts-expect-error 'middleName' is not a key of users
        keyPath: ['firstName', 'middleName'],
      })
    )
}

void function testValidEmptyKeyPath() {
  // When value type is a valid IDB key, empty string keyPath should be allowed
  createMigrations()
    .version(1, v =>
      v.createObjectStore({ name: 'emails', schema: schema<string>() })
    )
    .version(2, v =>
      v.createIndex('byValue', { storeName: 'emails', keyPath: '' })
    )
}

void function testInvalidEmptyKeyPath() {
  // When value type is NOT a valid IDB key, empty string keyPath should error
  createMigrations()
    .version(1, v =>
      v.createObjectStore({ name: 'users', schema: schema<{ id: string }>() })
    )
    .version(2, v =>
      // @ts-expect-error value type { id: string; name: string } is not a valid IDB key
      v.createIndex('byValue', { storeName: 'users', keyPath: '' })
    )
}

void function testInvalidEmptyKeyPathAfterTransform() {
  // Transforming a valid IDB key type into an object should error
  // because the existing empty string keyPath index would become invalid
  createMigrations()
    .version(1, v =>
      v.createObjectStore({ name: 'emails', schema: schema<string>() })
    )
    .version(2, v =>
      v.createIndex('byValue', { storeName: 'emails', keyPath: '' })
    )
    .version(3, v =>
      // @ts-expect-error transform invalidates '' keyPath index (object is not a valid IDB key)
      v.transformRecords('emails', email => ({ address: email }))
    )
}

void function testIndexKeyPathMustPointAtValidType_Flat() {
  createMigrations()
    .version(1, v =>
      v.createObjectStore({
        name: 'users',
        schema: schema<{
          id: string
          metadata: { createdAt: Date }
        }>(),
      })
    )
    // Valid: 'id' points at string
    .version(2, v =>
      v.createIndex('byId', { storeName: 'users', keyPath: 'id' })
    )
    .version(3, v =>
      // @ts-expect-error 'metadata' points at object, not a valid IDB key
      v.createIndex('byMetadata', { storeName: 'users', keyPath: 'metadata' })
    )
}

void function testIndexKeyPathMustPointAtValidType_Nested() {
  createMigrations()
    .version(1, v =>
      v.createObjectStore({
        name: 'users',
        schema: schema<{
          id: string
          profile: {
            name: string
            settings: { theme: string }
          }
        }>(),
      })
    )
    // Valid: 'profile.name' points at string
    .version(2, v =>
      v.createIndex('byName', { storeName: 'users', keyPath: 'profile.name' })
    )
    .version(3, v =>
      v.createIndex('bySettings', {
        storeName: 'users',
        // @ts-expect-error 'profile.settings' points at object, not a valid IDB key
        keyPath: 'profile.settings',
      })
    )
}

void function testIndexKeyPathMustPointAtValidType_Composite() {
  createMigrations()
    .version(1, v =>
      v.createObjectStore({
        name: 'users',
        schema: schema<{
          id: string
          profile: {
            name: string
            settings: { theme: string }
          }
        }>(),
      })
    )
    // Valid: both 'id' (string) and 'profile.name' (string) are valid IDB keys
    .version(2, v =>
      v.createIndex('byIdAndName', {
        storeName: 'users',
        keyPath: ['id', 'profile.name'],
      })
    )
    .version(3, v =>
      v.createIndex('byIdAndSettings', {
        storeName: 'users',
        // @ts-expect-error 'profile.settings' points at object, not a valid IDB key
        keyPath: ['id', 'profile.settings'],
      })
    )
}

void function testIndexKeyPathMustPointAtValidType_AfterTransform() {
  createMigrations()
    .version(1, v =>
      v.createObjectStore({
        name: 'users',
        schema: schema<{ id: string; name: string }>(),
      })
    )
    // Valid composite index on flat + nested after we add nested structure
    .version(2, v =>
      v.transformRecords('users', user => ({
        ...user,
        profile: { displayName: user.name },
      }))
    )
    .version(3, v =>
      v.createIndex('byIdAndDisplayName', {
        storeName: 'users',
        keyPath: ['id', 'profile.displayName'],
      })
    )
    // Now transform 'profile' to be the whole object instead of having displayName
    .version(4, v =>
      // @ts-expect-error transform makes 'profile.displayName' invalid (no longer exists)
      v.transformRecords('users', user => ({
        id: user.id,
        profile: { settings: { theme: 'dark' } },
      }))
    )
}

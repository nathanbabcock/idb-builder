import z from 'zod'
import { openDB } from '../lib/idb-adapter'
import { createMigrations } from '../lib/migration-builder'

void function testCreateObjectStoreSupportsPrimaryKeyForKeyPath() {
  createMigrations().version(1, v =>
    v.createObjectStore({
      name: 'users',
      schema: z.object({
        id: z.string(),
        name: z.string(),
      }),
      primaryKey: 'id',
    })
  )
}

void function testCreateObjectStorePrimaryKeyIsTypeSafe() {
  createMigrations().version(1, v =>
    // @ts-expect-error 'nonexistent' is not a key of the value type
    v.createObjectStore({
      name: 'users',
      schema: z.object({
        id: z.string(),
        name: z.string(),
      }),
      primaryKey: 'nonexistent',
    })
  )
}

void function testCreateObjectStoreSupportsNestedKeyPath() {
  createMigrations().version(1, v =>
    v.createObjectStore({
      name: 'documents',
      schema: z.object({
        metadata: z.object({
          id: z.string(),
          version: z.number(),
        }),
        title: z.string(),
      }),
      primaryKey: 'metadata.id',
    })
  )
}

void function testCreateObjectStoreNestedKeyPathIsTypeSafe() {
  createMigrations().version(1, v =>
    // @ts-expect-error 'metadata.nonexistent' is not a valid nested key path
    v.createObjectStore({
      name: 'documents',
      schema: z.object({
        metadata: z.object({
          id: z.string(),
          version: z.number(),
        }),
        title: z.string(),
      }),
      primaryKey: 'metadata.nonexistent',
    })
  )
}

void function testCreateObjectStoreSupportsDeeplyNestedKeyPath() {
  createMigrations().version(1, v =>
    v.createObjectStore({
      name: 'articles',
      schema: z.object({
        metadata: z.object({
          author: z.object({
            id: z.string(),
            name: z.string(),
          }),
          publishedAt: z.string(),
        }),
        content: z.string(),
      }),
      primaryKey: 'metadata.author.id',
    })
  )
}

void function testCreateObjectStoreDeeplyNestedKeyPathIsTypeSafe() {
  createMigrations().version(1, v =>
    // @ts-expect-error 'metadata.author.nonexistent' is not a valid nested key path
    v.createObjectStore({
      name: 'articles',
      schema: z.object({
        metadata: z.object({
          author: z.object({
            id: z.string(),
            name: z.string(),
          }),
          publishedAt: z.string(),
        }),
        content: z.string(),
      }),
      primaryKey: 'metadata.author.nonexistent',
    })
  )
}

void async function testGetKeyType() {
  const migrations = createMigrations().version(1, v =>
    v.createObjectStore({
      name: 'users',
      schema: z.object({
        id: z.string(),
        name: z.string(),
      }),
      primaryKey: 'id',
    })
  )

  const db = await openDB('test-db', migrations)

  // Correct: get() with string key (matches 'id' type)
  await db.get('users', 'some-id')

  // @ts-expect-error get() with number key should error (id is string)
  await db.get('users', 123)
}

void async function testGetNumericKeyType() {
  const migrations = createMigrations().version(1, v =>
    v.createObjectStore({
      name: 'counters',
      schema: z.object({
        index: z.number(),
        value: z.string(),
      }),
      primaryKey: 'index',
    })
  )

  const db = await openDB('test-db', migrations)

  // Correct: get() with number key (matches 'index' type)
  await db.get('counters', 42)

  // @ts-expect-error get() with string key should error (index is number)
  await db.get('counters', 'not-a-number')
}

void async function testGetKeyTypeAfterTransform() {
  const migrations = createMigrations()
    .version(1, v =>
      v.createObjectStore({
        name: 'items',
        schema: z.object({
          id: z.number(),
          name: z.string(),
        }),
        primaryKey: 'id',
      })
    )
    .version(2, v =>
      v.transformRecords('items', row => ({
        ...row,
        id: String(row.id), // Transform id from number to string
      }))
    )

  const db = await openDB('test-db', migrations)

  // Correct: get() with string key (id was transformed to string)
  await db.get('items', '123')

  // @ts-expect-error get() with number key should error (id is now string)
  await db.get('items', 123)
}

void function testValidEmptyStringPrimaryKey() {
  // Empty string primaryKey means "use the value itself as the key"
  // Valid when value type is a valid IDB key (string, number, Date, etc.)
  createMigrations().version(1, v =>
    v.createObjectStore({ name: 'emails', schema: z.string(), primaryKey: '' })
  )
}

void function testInvalidEmptyStringPrimaryKey() {
  // Empty string primaryKey is invalid when value is not a valid IDB key
  createMigrations().version(1, v =>
    // @ts-expect-error value type { id: string } is not a valid IDB key
    v.createObjectStore({
      name: 'users',
      schema: z.object({ id: z.string() }),
      primaryKey: '',
    })
  )
}

void function testInvalidEmptyStringPrimaryKeyAfterTransform() {
  // Transforming from valid IDB key to object invalidates empty string primaryKey
  createMigrations()
    .version(1, v =>
      v.createObjectStore({ name: 'emails', schema: z.string(), primaryKey: '' })
    )
    .version(2, v =>
      // @ts-expect-error transform makes '' primaryKey invalid (object is not a valid IDB key)
      v.transformRecords('emails', email => ({ address: email }))
    )
}

# Typedex

Typesafe Indexed DB

## Getting started

### Install

```sh
npm install @typedex/indexed-db
```

### Set up migrations

Define your database schema using TypeScript types and the `schema()` helper. The `createMigrations()` builder captures your database structure with full type inference.

```ts
import { createMigrations, schema } from '@typedex/indexed-db'

const migrations = createMigrations().version(1, v =>
  v.createObjectStore({
    name: 'users',
    schema: schema<{
      id: string
      name: string
      email: string
    }>(),
    primaryKey: 'id',
  })
)
```

### Open the database

Pass your migrations to `openDB()` to open the database. The returned database handle is fully typed based on your migration definitions.

```ts
const db = await openDB('my-app', migrations)
```

### Read and write data

All operations are type-safe. The compiler knows which object stores exist, what shape the data has, and what type the primary key is.

```ts
// Insert a record
await db.put('users', {
  id: '1',
  name: 'Alice',
  email: 'alice@example.com',
})

// Retrieve by primary key
const user = await db.get('users', '1')

// Get all records
const allUsers = await db.getAll('users')
```

## Future work

- Fully typesafe keyrange queries (will require a custom wrapper around `idb` methods)

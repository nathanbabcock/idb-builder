# Getting started

## Install Typedex

::: code-group

```sh [npm]
npm install @typedex/indexed-db
```

```sh [yarn]
yarn add @typedex/indexed-db
```

```sh [pnpm]
pnpm add @typedex/indexed-db
```

```sh [bun]
bun add @typedex/indexed-db
```

```sh [deno]
deno add npm:@typedex/indexed-db
```

:::


## Set up migrations

Define your database schema using TypeScript types and the `schema()` helper. The `createMigrations()` builder captures your database structure with full type inference.

<<< @/samples/getting-started/migrations.sample.ts{ts twoslash}

## Open the database

Pass your migrations to `openDB()` to open the database. The returned database handle is fully typed based on your migration definitions.

<<< @/samples/getting-started/open-db.sample.ts{ts twoslash}

## Read and write data

All operations are type-safe. The compiler knows which object stores exist, what shape the data has, and what type the primary key is.

<<< @/samples/getting-started/read-write.sample.ts{ts twoslash}

## See also

The database client returned is an instance of [`idb`](https://github.com/jakearchibald/idb) with the types inferred
from your schema migrations already applied. Refer to the [`idb` documentation](https://github.com/jakearchibald/idb#readme) for details on available methods and usage.
# Create object store

Object stores are the IndexedDB equivalent of tables. Each store holds records of a specific type, identified by a primary key.

## Basic usage

Use `createObjectStore` to define a new store with its schema and primary key:

<<< @/samples/create-object-store/basic.sample.ts{ts twoslash}

The `schema<T>()` helper captures your TypeScript type at compile time. This type flows through the entire API, giving you full type safety on `put`, `get`, `getAll`, and all other operations.

## Errors

### Duplicate store names

Creating two stores with the same name in the same version is caught at compile time:

<<< @/samples/create-object-store/duplicate-name.sample.ts{ts twoslash}

---
title: Database versions
# description: How to install and configure Typedex for typesafe Indexed DB usage.
---

In Indexed DB, database version must be positive integers (1, 2, 3, …). More
importantly, they must be monotonically increasing. Attempting to open a
database with a lower version then what's configured in the codebase will result
in an error.

This typically isn't too difficult to remember, but for good measure Typedex
enforces this through the type system when you define your migrations. It will
catch errors like copy-pasting a previous migration and forgetting to increment
the version number.

## Examples of invalid database versions

### Repeating the same version number twice

```ts
createMigrations()
  .version(1, v => v.createObjectStore('users', z.object({ id: z.string() })))
  .version(1, v => v.createObjectStore('posts', z.object({ id: z.string() })))
```

## Valid database version examples

### Monotonically increasing by 1

```ts
createMigrations()
  .version(1, v => v.createObjectStore('users', z.object({ id: z.string() })))
  .version(2, v => v.createObjectStore('posts', z.object({ id: z.string() })))
  .version(3, v => v.createObjectStore('posts', z.object({ id: z.string() })))
```

### Skipping version numbers

Jumping by more than 1 is totally valid as well:

```ts
createMigrations()
  .version(1, v => v.createObjectStore('users', z.object({ id: z.string() })))
  // jump straight to v5, skipping v2, v3, and v4
  .version(5, v => v.createObjectStore('posts', z.object({ id: z.string() })))
```

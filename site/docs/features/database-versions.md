# Database versions

In Indexed DB, database version must be positive integers (1, 2, 3, …). More
importantly, they must be monotonically increasing.

This typically isn't too difficult to remember, but for good measure idb-migrate
enforces this through the type system when you define your migrations. It will
catch errors like copy-pasting a previous migration and forgetting to increment
the version number.

<<< @/samples/database-versions/monotonically-increasing.sample.ts{ts twoslash}

### Skipping versions

Jumping by more than 1 is totally valid as well:

<<< @/samples/database-versions/skipping-numbers.sample.ts{ts twoslash}

## Errors

### Repeating the same version number twice

<<< @/samples/database-versions/same-version-twice.sample.ts{ts twoslash}

This can easily happen as an oversight when copy-pasting from previous migrations.

### Explicit version number can't be inferred

<<< @/samples/database-versions/broad-version-number.sample.ts{ts twoslash}

In this case Typescript doesn't evaluate `1 + 1` to `2` at compile time
(although there are some very cool alternative typecheckers like
[Ezno](https://kaleidawave.github.io/ezno/comparison/#arithmetic) which can do
this).

The best policy is to use explicit inline literals for version numbers and all
other schema values. On top of ensuring that the types are inferred automatically,
it also keeps the migration code simple and easy to read.

If you do require some kind of indirection for version numbers for any reason,
you just need to ensure that the value is a literal at compile time using e.g.
`as const` or other devices as needed.

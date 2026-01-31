# Composite keys

More than one property of an object can be used to form a composite (or
compound) key.

<<< @/samples/composite-keys/composite-keys.sample.ts{ts twoslash}

## Composite index key paths

Indexes can also use composite key paths, allowing you to query by multiple fields at once.

<<< @/samples/composite-keys/composite-index.sample.ts{ts twoslash}

## Errors

### Type mismatch

The expected type for each array member of the composite key is inferred from
the schema property that the keypath points to.

<<< @/samples/composite-keys/composite-keys-type-mismatch.sample.ts{ts twoslash}

### Key array length

You must specify a value for every array member in a composite key.

<<< @/samples/composite-keys/composite-keys-array-length.sample.ts{ts twoslash}
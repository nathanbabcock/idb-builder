# Nested keys

Use dot notation to reference nested properties as primary keys or index key paths. This allows you to structure your data with nested objects while still being able to efficiently query by deeply nested fields.

<<< @/samples/nested-keys/nested-keys.sample.ts{ts twoslash}

## Deeply nested paths

Key paths can traverse multiple levels of nesting using dot notation.

<<< @/samples/nested-keys/deeply-nested.sample.ts{ts twoslash}

## Nested index key paths

Nested key paths work with indexes too, allowing you to create indexes on nested properties.

<<< @/samples/nested-keys/nested-index.sample.ts{ts twoslash}

## Errors

### Invalid nested path

TypeScript will catch typos and invalid paths in your nested key path.

<<< @/samples/nested-keys/invalid-path.sample.ts{ts twoslash}

### Key path must point to a valid key type

The nested key path must point to a valid IndexedDB key type (string, number, Date, ArrayBuffer, or array). Pointing to an object will produce an error.

<<< @/samples/nested-keys/object-not-key.sample.ts{ts twoslash}

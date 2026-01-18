# Transform records

Use `transformRecords` to perform breaking schema changes that require migrating existing data. Unlike [`alterSchema`](/features/alter-schema), which only allows backwards-compatible changes, `transformRecords` runs a migration function on every record in the object store.

## When to use transformRecords

Use `transformRecords` when you need to:

- Rename fields
- Change field types
- Merge or split fields
- Remove fields
- Restructure data in ways that aren't backwards-compatible

## Basic usage

This example combines `firstName` and `lastName` into a single `name` field:

<<< @/samples/transform-records/basic.sample.ts{ts twoslash}

The transform function receives each record with its old shape and returns the new shape. The migration runs automatically when the database is opened at a version that includes this transform.

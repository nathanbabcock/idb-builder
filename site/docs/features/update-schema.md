# Update schema

Use `updateSchema` to evolve your schema over time by adding, modifying, or removing fields from existing object stores.

## Adding optional fields

The most common use case is adding new optional fields to an existing schema. This is backwards-compatible because existing records in the database won't have the new field, so it must be optional.

<<< @/samples/update-schema/basic.sample.ts{ts twoslash}

## Deep merging nested objects

`updateSchema` performs a deep merge, so you can add fields to nested objects without redefining the entire structure:

<<< @/samples/update-schema/deep-merge.sample.ts{ts twoslash}

## Deleting fields

To remove a field from the schema, set it to `never`:

<<< @/samples/update-schema/delete-field.sample.ts{ts twoslash}

## Cannot add required fields

Adding a required field is not backwards-compatible because existing records in the database won't have the new field. TypeScript will report an error if you try to add a required field:

<<< @/samples/update-schema/required-field.sample.ts{ts twoslash}

## Primary key fields cannot become optional

Making a field optional that is used as the primary key would break the object store's key path. TypeScript will catch this:

<<< @/samples/update-schema/optional-primary-key.sample.ts{ts twoslash}

For breaking schema changes like adding required fields, renaming fields, or changing types, use [`transformRecords`](/features/transform-records) instead.

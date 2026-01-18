# Alter schema

Use `alterSchema` to evolve your schema over time by adding new fields to existing object stores.

## Adding optional fields

The most common use case is adding new optional fields to an existing schema. This is backwards-compatible because existing records in the database won't have the new field, so it must be optional.

<<< @/samples/alter-schema/basic.sample.ts{ts twoslash}

## Required fields are not allowed

Adding a required field is not backwards-compatible because existing records in the database won't have the new field. TypeScript will report an error if you try to add a required field:

<<< @/samples/alter-schema/required-field.sample.ts{ts twoslash}

For breaking schema changes like adding required fields, renaming fields, or changing types, use [`transformRecords`](/features/transform-records) instead.

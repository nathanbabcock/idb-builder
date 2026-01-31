# Error messages

A useful pattern in type safety libraries is to perform validation
with a generic helper type like `Validate<T>` and conditionally return an
incompatible error value if the type `T` is invalid. This gives an entrypoint
for the library to inject rich and contextual error messages, including both the exact
input type it received, the reason it's invalid, and any other relevant
parameters that were involved in the validation.

When validation fails, Typescript will report this message as a "not
assignable" error:

```
Error ts(2345) ― Argument of type 'X' is not assignable to parameter of type 'Y'.
```

These special error values are designed to read
naturally when replaced in the `Y` position of the message. In other words, it
should concisely describe the set of values which satisfy the relevant
validation constraint.

As an example, when enforcing valid [database
versions](/features/database-versions), an invalid version number will
produce an error such as:

```
Error ts(2345) ― Argument of type '1' is not assignable to parameter of type 'MigrationError<"an integer greater than 1">'.
```

## The MigrationError type

To ensure the error triggers non-assignability for any input type, we use a
branded wrapper object with a unique symbol key:

```typescript
declare const MigrationErrorBrand: unique symbol

type MigrationError<Message extends string> = {
  [MigrationErrorBrand]: Message
}
```

This pattern creates an **uninhabitable type** that no runtime value can satisfy:

1. The `unique symbol` is private and cannot be referenced externally
2. No runtime value can accidentally satisfy this type
3. The error message is visible in IDE tooltips and error output

## Usage

```typescript
type ValidatedInput<T> = T extends ValidCondition
  ? T
  : MigrationError<'a descriptive error message'>
```

This produces clear, readable errors:

```
Error ts(2345) ― Argument of type '"foo"' is not assignable to parameter of type 'MigrationError<"a descriptive error message">'.
```

## Error message position

Error messages should be always be as localized as possible to the point of
failure. If an individual parameter is invalid, the error should show up on that
exact parameter, rather than bubbling up to a higher-level construct.

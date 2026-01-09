# Error messages

A useful pattern in typesafety libraries is to perform validation
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
Error ts(2345) ― Argument of type '1' is not assignable to parameter of type '"integer greater than 1"'.
```

To ensure the error triggers non-assignability for any input type (including
strings), intersect the error message with `Error`:

```typescript
type ValidatedInput<T> = T extends ValidCondition
  ? T
  : 'a descriptive error message' & Error
```

This produces clear, readable errors:

```
Error ts(2345) ― Argument of type '"foo"' is not assignable to parameter of type '"a descriptive error message" & Error'.
```

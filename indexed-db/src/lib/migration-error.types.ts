/**
 * Type-level error types for migration validation failures.
 * These produce helpful error messages when type validation fails.
 *
 * Uses a unique symbol brand with `never` to create uninhabitable types
 * that cannot be satisfied by any runtime value, including string literals
 * that match the error message itself.
 */

/**
 * Unique symbol used to brand error types. The symbol is private and
 * cannot be referenced externally, making it impossible to construct
 * a value that satisfies this type.
 */
declare const error: unique symbol

/**
 * Base migration error type. Produces clear error messages like:
 * `Type 'X' is not assignable to type 'MigrationError<"error message">'`
 *
 * Uses a branded wrapper object with a unique symbol key:
 * 1. The unique symbol cannot be referenced externally
 * 2. No runtime value can accidentally satisfy this type
 * 3. The error message is visible in IDE tooltips and error output
 */
export type MigrationError<Message extends string> = {
  [error]: Message
}

/**
 * Converts a string or string array to a string representation for error messages.
 */
export type Stringify<T> = T extends string
  ? T
  : T extends readonly [infer First extends string, ...infer Rest]
    ? Rest extends readonly string[]
      ? `[${First}${StringifyRest<Rest>}]`
      : `[${First}]`
    : T extends undefined
      ? 'undefined'
      : 'unknown'

type StringifyRest<T extends readonly string[]> = T extends readonly [
  infer First extends string,
  ...infer Rest extends readonly string[],
]
  ? `, ${First}${StringifyRest<Rest>}`
  : ''

/**
 * Converts a type to a human-readable string representation for error messages.
 */
export type TypeName<T> = T extends string
  ? 'string'
  : T extends number
    ? 'number'
    : T extends boolean
      ? 'boolean'
      : T extends Date
        ? 'Date'
        : T extends ArrayBuffer
          ? 'ArrayBuffer'
          : T extends IDBValidKey[]
            ? 'Array'
            : T extends undefined
              ? 'undefined'
              : T extends null
                ? 'null'
                : 'object'

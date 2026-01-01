/**
 * Type-level error types for migration validation failures.
 * These produce helpful error messages when type validation fails.
 */

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

/**
 * Base structure for migration error types.
 * The __error field identifies the error kind, and __message provides context.
 */
type MigrationError<Kind extends string, Message extends string> = {
  __error: Kind
  __message: Message
}

/**
 * Error returned when a keyPath doesn't exist in the schema.
 */
export type InvalidKeyPath<Message extends string> = MigrationError<
  'InvalidKeyPath',
  Message
>

/**
 * Error returned when autoIncrement is used with a non-numeric keyPath.
 */
export type InvalidAutoIncrementKey<Message extends string> = MigrationError<
  'InvalidAutoIncrementKey',
  Message
>

/**
 * Error returned when alterObjectStore produces a schema that existing data
 * cannot satisfy (e.g., adding a required field without transformRecords).
 */
export type InvalidAlteration<Message extends string> = MigrationError<
  'InvalidAlteration',
  Message
>

/**
 * Error returned when a transform invalidates an existing index keyPath.
 */
export type InvalidIndexKeyPath<Message extends string> = MigrationError<
  'InvalidIndexKeyPath',
  Message
>

/**
 * Error returned when multiEntry index points to array with non-IDB-key elements.
 */
export type InvalidMultiEntry<Message extends string> = MigrationError<
  'InvalidMultiEntry',
  Message
>

/**
 * Error returned when a migration version is not greater than the previous version.
 */
export type InvalidVersionOrder<Message extends string> = MigrationError<
  'InvalidVersionOrder',
  Message
>

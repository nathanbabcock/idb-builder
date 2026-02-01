import type { IsGreaterThan } from './greater-than.types'
import type { Schema as SchemaOf, SchemaAny } from './schema'
import type { MigrationBuilder } from './migration-builder'
import type {
  MigrationError,
  Stringify,
  TypeName,
} from './migration-error.types'

// Index info tracks the keyPath, multiEntry, and unique flags for each index
export type IndexInfo<
  KeyPath extends string | readonly string[] = string,
  MultiEntry extends boolean = false,
  Unique extends boolean = false,
> = {
  keyPath: KeyPath
  multiEntry: MultiEntry
  unique: Unique
}

// Store info tracks the value type, indexes, the schema, primary keyPath, and autoIncrement
export type StoreInfo<
  Value = unknown,
  Indexes extends Record<string, IndexInfo<any, any, any>> = {},
  SchemaType extends SchemaAny = SchemaOf<Value>,
  PrimaryKeyPath extends string | readonly string[] | undefined = undefined,
  AutoIncrement extends boolean = false,
> = {
  value: Value
  indexes: Indexes
  schema: SchemaType
  primaryKeyPath: PrimaryKeyPath
  autoIncrement: AutoIncrement
}

export type Schema = Record<string, StoreInfo<any, any, any, any, any>>

// Helper: Extract all properties from a store in one pass (avoids repeated lookups)
export type ExtractStoreInfo<S extends Schema, StoreName extends keyof S> = {
  value: S[StoreName]['value']
  indexes: S[StoreName]['indexes']
  schema: S[StoreName]['schema']
  primaryKeyPath: S[StoreName]['primaryKeyPath']
  autoIncrement: S[StoreName]['autoIncrement']
}

// Helper: Update a store in the schema using mapped types (avoids nested Omit/Record intersections)
export type UpdateStore<
  S extends Schema,
  StoreName extends string,
  NewStoreInfo extends StoreInfo<any, any, any, any, any>,
> = {
  [K in keyof S | StoreName]: K extends StoreName
    ? NewStoreInfo
    : K extends keyof S
      ? S[K]
      : never
}

// Helper: Rename a store key in the schema while preserving its StoreInfo
export type RenameStoreKey<
  S extends Schema,
  OldName extends keyof S,
  NewName extends string,
> = {
  [K in keyof S as K extends OldName ? NewName : K]: S[K]
}

// Helper: Rename an index key in a store's indexes while preserving its IndexInfo
export type RenameIndexKey<
  Indexes extends Record<string, IndexInfo<any, any, any>>,
  OldName extends keyof Indexes,
  NewName extends string,
> = {
  [K in keyof Indexes as K extends OldName ? NewName : K]: Indexes[K]
}

// Helper: Build a new StoreInfo preserving extracted properties
export type UpdateStoreInfo<
  Info extends {
    value: any
    indexes: any
    schema: any
    primaryKeyPath: any
    autoIncrement: any
  },
  Updates extends {
    value?: any
    indexes?: any
    schema?: any
    primaryKeyPath?: any
    autoIncrement?: any
  },
> = StoreInfo<
  Updates extends { value: infer V } ? V : Info['value'],
  Updates extends { indexes: infer I } ? I : Info['indexes'],
  Updates extends { schema: infer S } ? S : Info['schema'],
  Updates extends { primaryKeyPath: infer P } ? P : Info['primaryKeyPath'],
  Updates extends { autoIncrement: infer A } ? A : Info['autoIncrement']
>

// DEPRECATED: Generative KeyPaths (causes deep instantiation)
// export type KeyPaths<T, Prefix extends string = ''> = T extends object
//   ? {
//       [K in keyof T & string]: K extends string
//         ? `${Prefix}${K}` | KeyPaths<T[K], `${Prefix}${K}.`>
//         : never
//     }[keyof T & string]
//   : never

// Type-level: Validate if a given keypath is valid (doesn't generate all paths)
// Returns the path if valid, never if invalid, or passes through undefined
export type ValidateKeyPath<T, Path> = Path extends undefined
  ? undefined
  : Path extends string
    ? ValidateStringPath<T, Path>
    : Path extends readonly any[]
      ? ValidateArrayPath<T, Path>
      : never

// Validate that a path exists in the type (without IDBValidKey constraint)
// Used for multiEntry indexes where the keyPath points to an array
type ValidatePathExists<T, Path extends string> = Path extends ''
  ? Path
  : Path extends `${infer First}.${infer Rest}`
    ? First extends keyof T
      ? ValidatePathExists<T[First], Rest> extends never
        ? never
        : Path
      : never
    : Path extends keyof T
      ? Path
      : never

// Validate string paths like "address.city"
// Empty string '' means "use the value itself as the key" — valid only if T is a valid IDB key
// For non-empty paths, the type at the path must also be a valid IDB key
type ValidateStringPath<T, Path extends string> = Path extends ''
  ? T extends IDBValidKey
    ? Path // Empty string valid when value is a valid IDB key
    : never
  : Path extends `${infer First}.${infer Rest}`
    ? First extends keyof T
      ? ValidateStringPath<T[First], Rest> extends never
        ? never
        : Path // Valid path, return it
      : never
    : Path extends keyof T
      ? T[Path] extends IDBValidKey
        ? Path // Single key pointing at valid IDB key type
        : never
      : never

// Validate array paths like ["user", "id"] or ["userId", "orderId"]
// Each element must point to a valid IDB key type
type ValidateArrayPath<T, Path, OriginalT = T> =
  // First check if it's a tuple with elements we can validate
  Path extends readonly [infer First extends string, ...infer Rest]
    ? First extends `${infer K}.${infer Nested}`
      ? // Handle dotted paths like "user.id" - ValidateStringPath handles IDB key check
        K extends keyof T
        ? ValidateStringPath<T[K], Nested> extends never
          ? never
          : Rest extends readonly []
            ? Path
            : ValidateArrayPath<OriginalT, Rest, OriginalT> extends never
              ? never
              : Path
        : never
      : // Handle simple keys - must point to valid IDB key type
        First extends keyof T
        ? T[First] extends IDBValidKey
          ? Rest extends readonly []
            ? Path // Last element, valid!
            : // For composite keys, validate Rest against the ORIGINAL type, not T[First]
              ValidateArrayPath<OriginalT, Rest, OriginalT> extends never
              ? never
              : Path
          : never // Type at path is not a valid IDB key
        : never
    : Path extends readonly []
      ? Path
      : Path extends readonly string[]
        ? Path // Accept widened string[] (can't validate elements)
        : never

// Legacy alias for backwards compatibility
export type KeyPaths<T> = ValidateStringPath<T, string>

/**
 * Validates all index keyPaths against a new value type.
 * Returns the name of the first invalid index, or never if all are valid.
 */
export type FindInvalidIndexKeyPath<
  NewValue,
  Indexes extends Record<string, IndexInfo<any, any, any>>,
> = {
  [K in keyof Indexes]: ValidateKeyPath<
    NewValue,
    Indexes[K]['keyPath']
  > extends never
    ? K
    : never
}[keyof Indexes]

/**
 * Validates that a multiEntry index has valid key types.
 * When multiEntry is true, the keyPath can point to either:
 * - A single valid IDB key (creates one index entry)
 * - An array of valid IDB keys (each element creates a separate index entry)
 * Returns true if valid, false if invalid.
 */
export type ValidateMultiEntryIndex<
  Value,
  KeyPath extends string,
  MultiEntry extends boolean,
> = MultiEntry extends true
  ? ResolveKeyPath<Value, KeyPath> extends (infer E)[]
    ? E extends IDBValidKey
      ? true
      : false // Array elements are not valid IDB keys
    : ResolveKeyPath<Value, KeyPath> extends IDBValidKey
      ? true // Single valid key is also allowed
      : false // Not a valid key or array of valid keys
  : true // Not multiEntry, no validation needed

/**
 * Validates a keyPath for createIndex, returning the keyPath if valid or a
 * `string & Error` type if invalid. This causes TypeScript to show errors
 * directly on the keyPath property rather than the entire call.
 */
export type ValidatedKeyPath<
  Value,
  KeyPath,
  MultiEntry extends boolean,
> = MultiEntry extends true
  ? // For multiEntry, use path existence check (not IDBValidKey check)
    KeyPath extends string
    ? ValidatePathExists<Value, KeyPath> extends never
      ? MigrationError<`keyPath '${KeyPath}' is not a valid path in the store schema`>
      : ValidateMultiEntryIndex<Value, KeyPath, MultiEntry> extends true
        ? KeyPath
        : ResolveKeyPath<Value, KeyPath> extends (infer E)[]
          ? MigrationError<`multiEntry index '${KeyPath}' has array elements of type '${TypeName<E>}', but IndexedDB requires elements to be valid keys (string, number, Date, ArrayBuffer, or arrays of these)`>
          : MigrationError<`multiEntry index '${KeyPath}' resolves to '${TypeName<ResolveKeyPath<Value, KeyPath>>}', but must be a valid IDB key or array of valid IDB keys`>
    : MigrationError<'multiEntry cannot be used with composite keyPath'>
  : // For non-multiEntry, use full IDBValidKey validation
    ValidateKeyPath<Value, KeyPath> extends never
    ? MigrationError<`keyPath '${KeyPath extends string ? KeyPath : TypeName<KeyPath>}' is not a valid path in the store schema`>
    : KeyPath

/**
 * Validates a primaryKey for createObjectStore, returning the key path if valid
 * or an error type if invalid. This causes TypeScript to show errors directly
 * on the primaryKey property rather than the entire call.
 *
 * Checks:
 * 1. The keyPath must be valid within the schema
 * 2. The keyPath must point to a valid IDB key type (not an object)
 * 3. Composite keys (arrays) cannot be used with autoIncrement
 * 4. When autoIncrement is true, the keyPath must point to a number type
 */
export type ValidatedPrimaryKey<Value, KeyPath, AutoIncrement extends boolean> =
  ValidateKeyPath<Value, KeyPath> extends never
    ? KeyPath extends string
      ? ValidatePathExists<Value, KeyPath> extends never
        ? MigrationError<`Primary key '${KeyPath}' is not a valid path in the schema`>
        : MigrationError<`Primary key '${KeyPath}' resolves to '${TypeName<ResolveSingleKeyPath<Value, KeyPath>>}', but must be a valid IndexedDB key (string, number, Date, ArrayBuffer, or array of these)`>
      : MigrationError<`Primary key '${Stringify<KeyPath>}' is not a valid path in the schema`>
    : AutoIncrement extends true
      ? KeyPath extends readonly string[]
        ? MigrationError<'autoIncrement cannot be used with composite (array) primary keys'>
        : KeyPath extends string
          ? number extends ResolveSingleKeyPath<Value, KeyPath>
            ? KeyPath
            : ResolveSingleKeyPath<Value, KeyPath> extends number
              ? KeyPath
              : MigrationError<`autoIncrement requires primaryKey to resolve to number, but '${KeyPath}' resolves to ${TypeName<ResolveSingleKeyPath<Value, KeyPath>>}`>
          : KeyPath // undefined case - out-of-line keys are allowed with autoIncrement
      : KeyPath

// ============================================================================
// updateSchema types
// ============================================================================

/**
 * Check if a type is a plain object (not array, Date, etc.).
 * Used to determine when to deep merge vs replace.
 */
type IsPlainObject<T> = [T] extends [object]
  ? [T] extends [any[] | Date | RegExp | Function | SchemaAny]
    ? false
    : true
  : false

/**
 * Deep merge type utility for updateSchema.
 * Recursively merges Update into Base with these behaviors:
 * - Properties set to `never` are deleted
 * - Plain objects are deep merged
 * - Arrays and primitives are replaced entirely
 * - Optional properties (with ?) are preserved
 *
 * Made distributive to preserve discriminated unions.
 */
export type DeepMerge<Base, Update> = Base extends any
  ? [Update] extends [never]
    ? never
    : IsPlainObject<Base> extends true
      ? IsPlainObject<Update> extends true
        ? Prettify<MergeObjects<Base, Update>>
        : Update
      : Update
  : never

/**
 * Merge two object types, with Update taking precedence.
 * Handles required/optional preservation.
 */
type MergeObjects<Base, Update> = FilterNever<{
  // Keys only in Base - preserve as-is
  [K in keyof Base as K extends keyof Update ? never : K]: Base[K]
}> &
  FilterNever<{
    // Keys in Update - take from Update (possibly merged if nested objects)
    [K in keyof Update]: K extends keyof Base
      ? DeepMerge<Base[K], Update[K]>
      : Update[K]
  }>

/**
 * Remove keys whose values are never.
 */
type FilterNever<T> = {
  [K in keyof T as [T[K]] extends [never] ? never : K]: T[K]
}

/**
 * Validates that a schema update is backwards-compatible and preserves primary key.
 * Returns the merged value type if valid, or a MigrationError if:
 * - The update adds required properties (not backwards-compatible)
 * - The update narrows types (not backwards-compatible)
 * - The update removes or makes the primary key optional
 */
export type ValidatedSchemaUpdate<
  OldValue,
  MergedValue,
  PrimaryKeyPath extends string | undefined,
> =
  // Check backwards-compatibility: old data must satisfy new schema
  OldValue extends MergedValue
    ? // Check primary key constraints
      PrimaryKeyPath extends string
      ? PrimaryKeyPath extends keyof MergedValue
        ? undefined extends MergedValue[PrimaryKeyPath]
          ? MigrationError<`Schema update makes primaryKey '${PrimaryKeyPath}' optional, which is not allowed`>
          : MergedValue
        : MigrationError<`Schema update removes primaryKey '${PrimaryKeyPath}'`>
      : MergedValue
    : MigrationError<'Schema update is not backwards-compatible: existing data may not satisfy new schema. Use transformRecords for breaking changes.'>

/**
 * Resolves a single string keypath to its actual type within a value type.
 * Handles dotted paths like "user.id".
 */
type ResolveSingleKeyPath<T, Path> = Path extends `${infer First}.${infer Rest}`
  ? First extends keyof T
    ? ResolveSingleKeyPath<T[First], Rest>
    : never
  : Path extends keyof T
    ? T[Path]
    : never

/**
 * Resolves a keypath (string or array) to its actual type within a value type.
 *
 * When Path is undefined (out-of-line keys), returns IDBValidKey.
 *
 * @example
 * type T = { id: string; user: { name: string } }
 * ResolveKeyPath<T, 'id'> // string
 * ResolveKeyPath<T, 'user.name'> // string
 * ResolveKeyPath<T, ['id', 'user.name']> // [string, string]
 * ResolveKeyPath<T, undefined> // IDBValidKey (out-of-line keys)
 */
export type ResolveKeyPath<T, Path> = Path extends undefined
  ? IDBValidKey
  : Path extends readonly string[]
    ? ResolveArrayKeyPath<T, Path>
    : Path extends string
      ? ResolveSingleKeyPath<T, Path>
      : never

/**
 * Resolves an array of keypaths to a tuple of their types.
 */
type ResolveArrayKeyPath<
  T,
  Paths extends readonly string[],
> = Paths extends readonly [
  infer First extends string,
  ...infer Rest extends readonly string[],
]
  ? [ResolveSingleKeyPath<T, First>, ...ResolveArrayKeyPath<T, Rest>]
  : []

/**
 * Validates that when autoIncrement is true, the keyPath points to a number type.
 * Returns never if validation fails (autoIncrement + non-number key).
 * For composite keys with autoIncrement, this is not allowed per IndexedDB spec.
 */
export type ValidateAutoIncrementKey<
  T,
  Path,
  AutoIncrement extends boolean | undefined,
> = AutoIncrement extends true
  ? Path extends string
    ? number extends ResolveSingleKeyPath<T, Path>
      ? Path
      : ResolveSingleKeyPath<T, Path> extends number
        ? Path
        : never
    : Path extends undefined
      ? Path // No keyPath, out-of-line key — allowed with autoIncrement
      : never // Composite keys with autoIncrement not supported
  : Path // autoIncrement is false or undefined — no restriction

// Helper to get existing index names for a store
export type ExistingIndexes<
  S extends Schema,
  StoreName extends keyof S,
> = keyof S[StoreName]['indexes'] & string

/**
 * Extracts the value types from an internal migration Schema.
 * Converts { storeName: StoreInfo<V, ...> } to { storeName: V }
 */
export type ExtractMigrationSchemaValues<S extends Schema> = {
  [K in keyof S]: S[K]['value']
}

/**
 * Resolves the key type for an object store, considering both keyPath and autoIncrement.
 * When autoIncrement is true and there's no keyPath (out-of-line), the key is number.
 */
export type ResolveStoreKeyType<
  Value,
  Path,
  AutoIncrement extends boolean,
> = AutoIncrement extends true
  ? Path extends undefined
    ? number // out-of-line + autoIncrement = number key
    : ResolveKeyPath<Value, Path>
  : ResolveKeyPath<Value, Path>

/**
 * Converts an internal migration Schema to IDBSchema format.
 * Derives the key type from the primaryKeyPath and autoIncrement setting.
 *
 * This allows direct comparison with user-defined IDBSchema interfaces.
 */
export type SchemaToIDBSchema<S extends Schema> = {
  [K in keyof S]: {
    key: ResolveStoreKeyType<
      S[K]['value'],
      S[K]['primaryKeyPath'],
      S[K]['autoIncrement']
    >
    value: S[K]['value']
  }
}

/**
 * Extracts just the value types from an idb DBSchema format.
 * Converts { storeName: { key: K; value: V } } to { storeName: V }
 *
 * @example
 * interface MyDBSchema extends DBSchema {
 *   users: { key: string; value: { id: string; name: string } }
 * }
 *
 * type Values = ExtractDBSchemaValues<MyDBSchema>
 * // => { users: { id: string; name: string } }
 */
export type ExtractDBSchemaValues<DBSchema> = {
  [K in keyof DBSchema]: DBSchema[K] extends { value: infer V } ? V : never
}

/**
 * Forces TypeScript to expand and flatten a type for better readability in IDE tooltips.
 * This is particularly useful for complex mapped types that would otherwise show as unexpanded.
 */
export type Prettify<T> = {
  [K in keyof T]: T[K]
} & {}

/**
 * Recursively forces TypeScript to expand nested types for better readability.
 * Unlike Prettify (which only expands the top level), this recursively expands
 * nested objects so they display fully in IDE tooltips.
 */
export type DeepPrettify<T> = T extends object
  ? {
      [K in keyof T]: DeepPrettify<T[K]>
    }
  : T

/**
 * Infers the final schema type from a MigrationBuilder.
 * Extracts just the value types for each object store, fully flattened.
 *
 * @example
 * const migrations = createMigrations()
 *   .version(1, v => v.createObjectStore({
 *     name: 'users',
 *     schema: z.object({ id: z.string(), name: z.string() }),
 *   }))
 *
 * type Schema = InferSchema<typeof migrations>
 * // => { users: { id: string; name: string } }
 */
export type InferSchema<T> =
  T extends MigrationBuilder<infer S, any>
    ? Prettify<{
        [K in keyof S]: S[K] extends StoreInfo<infer Value, any, any, any, any>
          ? Prettify<Value>
          : never
      }>
    : never

/**
 * Validates that a version number V is:
 * 1. A literal number (not the broad `number` type)
 * 2. Greater than 0
 * 3. Greater than the previous version PrevVersion
 *
 * Returns V if valid, or an error type that produces helpful messages.
 */
export type ValidateVersion<
  V extends number,
  PrevVersion extends number | undefined,
> = number extends V
  ? MigrationError<'a specific numeric literal (e.g. 1, 2, 3, …)'>
  : IsGreaterThan<V, 0> extends false
    ? MigrationError<`version must be greater than 0, got ${V}`>
    : PrevVersion extends undefined
      ? V // First version - valid literal > 0
      : IsGreaterThan<V, PrevVersion & number> extends true
        ? V
        : MigrationError<`specified version ${PrevVersion} is the same as previous version`>

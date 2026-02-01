// Convert our schema format to idb's DBSchema format
// Our schema: Record<StoreName, StoreInfo<Value, Indexes>>

import type { MigrationBuilder } from './migration-builder'
import type { IndexInfo, ResolveStoreKeyType } from './migration-builder.types'

// TODO: To achieve type-safe KeyRange queries, we need a wrapper around idb.
// The idb library's query methods accept `StoreKey | IDBKeyRange | null`, and since
// TypedKeyRange<K> extends IDBKeyRange, any TypedKeyRange is accepted regardless of K.
// A wrapper layer would accept TypedKeyRange<K> directly and validate K matches the
// store/index key type before calling the underlying idb methods.

// idb schema: Record<StoreName, { key: K, value: V, indexes?: { [name]: keyType } }>
export type ToDBSchema<S> = {
  [K in keyof S]: S[K] extends {
    value: infer V
    indexes: infer I
    schema?: any
    primaryKeyPath: infer P
    autoIncrement: infer A extends boolean
  }
    ? {
        key: ResolveStoreKeyType<V, P, A>
        value: V
        indexes: {
          [IndexName in keyof I]: I[IndexName] extends IndexInfo<
            infer KeyPath extends string,
            infer MultiEntry,
            any
          >
            ? ResolveIndexKeyType<V, KeyPath, MultiEntry>
            : never
        }
      }
    : never
}

/**
 * Resolves the key type for an index, handling multiEntry.
 * When multiEntry is true and the value at keyPath is an array, unwrap to element type.
 */
type ResolveIndexKeyType<
  V,
  KeyPath extends string,
  MultiEntry,
> = MultiEntry extends true
  ? ExtractKeyPathType<V, KeyPath> extends (infer E)[]
    ? E
    : ExtractKeyPathType<V, KeyPath>
  : ExtractKeyPathType<V, KeyPath>

// Extract the type at a given keypath (e.g., 'address.city' -> string)
// Empty string means "use the value itself as the key"
export type ExtractKeyPathType<
  T,
  Path extends string,
> = Path extends ''
  ? T
  : Path extends `${infer Head}.${infer Tail}`
    ? Head extends keyof T
      ? ExtractKeyPathType<T[Head], Tail>
      : never
    : Path extends keyof T
      ? T[Path]
      : never

// Extract schema type from MigrationBuilder
export type ExtractSchema<M> =
  M extends MigrationBuilder<infer S, any> ? S : never

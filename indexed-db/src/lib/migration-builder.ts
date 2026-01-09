import { z } from 'zod'
import type { MigrationAction } from './migration-actions.types'
import type {
  ExtractStoreInfo,
  FindInvalidIndexKeyPath,
  IndexInfo,
  ResolveKeyPath,
  Schema,
  SchemaToIDBSchema,
  StoreInfo,
  UpdateStore,
  UpdateStoreInfo,
  ValidateAutoIncrementKey,
  ValidateKeyPath,
  ValidatedKeyPath,
  ValidateVersion,
} from './migration-builder.types'
import type {
  InvalidAlteration,
  InvalidAutoIncrementKey,
  InvalidIndexKeyPath,
  InvalidKeyPath,
  Stringify,
  TypeName,
} from './migration-error.types'

class VersionBuilder<S extends Schema> {
  constructor(readonly actions: MigrationAction[] = []) {}

  // Create a new builder with an additional action and updated schema type
  private chain<NewS extends Schema>(
    action: MigrationAction
  ): VersionBuilder<NewS> {
    return new VersionBuilder<NewS>([...this.actions, action])
  }

  createObjectStore<
    const Name extends string,
    const ZodSchema extends z.ZodTypeAny,
    const PrimaryKey extends string | readonly string[] | undefined = undefined,
    const AutoIncrement extends boolean = false,
  >(options: {
    name: Name & Exclude<Name, keyof S>
    schema: ZodSchema
    primaryKey?: PrimaryKey
    autoIncrement?: AutoIncrement
  }): ValidateKeyPath<z.infer<ZodSchema>, PrimaryKey> extends never
    ? InvalidKeyPath<`Primary key '${Stringify<PrimaryKey>}' is not a valid path in the schema`>
    : ValidateAutoIncrementKey<
          z.infer<ZodSchema>,
          PrimaryKey,
          AutoIncrement
        > extends never
      ? InvalidAutoIncrementKey<`autoIncrement requires keyPath to resolve to number, but '${Stringify<PrimaryKey>}' resolves to ${TypeName<
          ResolveKeyPath<z.infer<ZodSchema>, PrimaryKey>
        >}`>
      : VersionBuilder<
          UpdateStore<
            S,
            Name,
            StoreInfo<
              z.infer<ZodSchema>,
              {},
              ZodSchema,
              PrimaryKey,
              AutoIncrement
            >
          >
        > {
    return this.chain<any>({
      action: 'create-object-store',
      storeName: options.name,
      keyPath: options.primaryKey,
      autoIncrement: options.autoIncrement,
    }) as any
  }

  deleteObjectStore<Name extends keyof S & string>(
    name: Name
  ): VersionBuilder<Omit<S, Name>> {
    return this.chain<Omit<S, Name>>({
      action: 'delete-object-store',
      storeName: name,
    })
  }

  transformRecords<
    Name extends keyof S & string,
    NewValue,
    Info extends ExtractStoreInfo<S, Name> = ExtractStoreInfo<S, Name>,
    InvalidIndex extends string = FindInvalidIndexKeyPath<
      NewValue,
      Info['indexes']
    > &
      string,
  >(
    name: Name,
    transform: (row: S[Name]['value']) => NewValue
  ): ValidateKeyPath<NewValue, Info['primaryKeyPath']> extends never
    ? InvalidKeyPath<`Transform invalidates primaryKey '${Stringify<
        Info['primaryKeyPath']
      >}': keyPath no longer valid for new value type`>
    : ValidateAutoIncrementKey<
          NewValue,
          Info['primaryKeyPath'],
          Info['autoIncrement']
        > extends never
      ? InvalidAutoIncrementKey<`autoIncrement requires keyPath to resolve to number after transform, but '${Stringify<
          Info['primaryKeyPath']
        >}' resolves to ${TypeName<
          ResolveKeyPath<NewValue, Info['primaryKeyPath']>
        >}`>
      : [InvalidIndex] extends [never]
        ? VersionBuilder<
            UpdateStore<
              S,
              Name,
              StoreInfo<
                NewValue,
                Info['indexes'],
                Info['schema'],
                Info['primaryKeyPath'],
                Info['autoIncrement']
              >
            >
          >
        : InvalidIndexKeyPath<`Transform invalidates index '${InvalidIndex}': keyPath no longer valid for new value type`> {
    return this.chain<any>({
      action: 'transform-object-store',
      storeName: name,
      transform,
    }) as any
  }

  /**
   * Create an index on an object store.
   * @param indexName Name of the index
   * @param options Configuration for the index
   */
  createIndex<
    StoreName extends keyof S & string,
    const IndexName extends string,
    const KeyPath extends string | readonly string[],
    const MultiEntry extends boolean = false,
    const Unique extends boolean = false,
    Info extends ExtractStoreInfo<S, StoreName> = ExtractStoreInfo<
      S,
      StoreName
    >,
  >(
    indexName: IndexName & Exclude<IndexName, keyof Info['indexes']>,
    options: {
      storeName: StoreName
      keyPath: ValidatedKeyPath<Info['value'], KeyPath, MultiEntry>
      multiEntry?: MultiEntry
      unique?: Unique
    }
  ): VersionBuilder<
    UpdateStore<
      S,
      StoreName,
      UpdateStoreInfo<
        Info,
        {
          indexes: Info['indexes'] &
            Record<IndexName, IndexInfo<KeyPath, MultiEntry, Unique>>
        }
      >
    >
  > {
    return this.chain<any>({
      action: 'create-index',
      storeName: options.storeName,
      indexName,
      keyPath: options.keyPath,
      multiEntry: options.multiEntry,
      unique: options.unique,
    }) as any
  }

  deleteIndex<
    StoreName extends keyof S & string,
    Info extends ExtractStoreInfo<S, StoreName> = ExtractStoreInfo<
      S,
      StoreName
    >,
    IndexName extends keyof Info['indexes'] & string = keyof Info['indexes'] &
      string,
  >(
    indexName: IndexName,
    options: {
      storeName: StoreName
    }
  ): VersionBuilder<
    UpdateStore<
      S,
      StoreName,
      UpdateStoreInfo<
        Info,
        {
          indexes: {
            [K in keyof Info['indexes'] as K extends IndexName
              ? never
              : K]: Info['indexes'][K]
          }
        }
      >
    >
  > {
    return this.chain<any>({
      action: 'delete-index',
      storeName: options.storeName,
      indexName,
    })
  }

  /**
   * Alter object store schema by transforming the old schema into a new one.
   * This is a type-only operation - no runtime migration is performed.
   *
   * The new schema must be backwards-compatible: existing data must satisfy
   * the new type. For breaking changes, use transformRecords instead.
   *
   * @example
   * .alterObjectStore('users', oldSchema =>
   *   oldSchema.extend({ email: z.string().optional() })
   * )
   */
  alterObjectStore<
    StoreName extends keyof S & string,
    NewSchema extends z.ZodTypeAny,
    Info extends ExtractStoreInfo<S, StoreName> = ExtractStoreInfo<
      S,
      StoreName
    >,
  >(
    _storeName: StoreName,
    _transform: (oldSchema: S[StoreName]['schema']) => NewSchema
  ): z.infer<Info['schema']> extends z.infer<NewSchema>
    ? VersionBuilder<
        UpdateStore<
          S,
          StoreName,
          StoreInfo<
            z.infer<NewSchema>,
            Info['indexes'],
            NewSchema,
            Info['primaryKeyPath'],
            Info['autoIncrement']
          >
        >
      >
    : InvalidAlteration<'Schema alteration is not backwards-compatible: existing data may not satisfy new schema. Use transformRecords for breaking changes.'> {
    // No runtime action needed - this is purely a type-level transformation
    return this as any
  }
}

export interface Migration {
  version: number
  actions: MigrationAction[]
}

class MigrationBuilder<
  S extends Schema = {},
  const PrevVersion extends number | undefined = undefined,
> {
  readonly migrations: Migration[] = []

  get finalVersion(): PrevVersion {
    const last = this.migrations[this.migrations.length - 1]
    return (last?.version ?? 0) as PrevVersion
  }

  version<NewS extends Schema, const V extends number>(
    version: ValidateVersion<V, PrevVersion>,
    fn: (v: VersionBuilder<S>) => VersionBuilder<NewS>
  ): MigrationBuilder<NewS, V> {
    const builder = fn(new VersionBuilder<S>())
    const next = new MigrationBuilder<NewS, V>()
    ;(next.migrations as Migration[]).push(
      ...this.migrations,
      {
        version: version as number,
        actions: builder.actions,
      }
    )
    return next
  }

  /**
   * Validates that the computed schema matches the expected IDBSchema type.
   * Use this instead of `satisfies` to avoid bidirectional inference issues.
   *
   * @example
   * interface MyDBSchema extends DBSchema {
   *   users: { key: string; value: { id: string; name: string } }
   * }
   *
   * const migrations = createMigrations()
   *   .version(1, v1 => v1.createObjectStore({
   *     name: 'users',
   *     schema: z.object({ id: z.string(), name: z.string() }),
   *   }))
   *   .expectType<MyDBSchema>()
   */
  expectType<_Expected extends SchemaToIDBSchema<S>>(): MigrationBuilder<
    S,
    PrevVersion
  > {
    return this
  }
}

function createMigrations(): MigrationBuilder<{}> {
  return new MigrationBuilder()
}

export { createMigrations, MigrationBuilder, VersionBuilder }

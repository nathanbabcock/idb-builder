import type { MigrationAction } from './migration-actions.types'
import type {
  DeepMerge,
  ExtractStoreInfo,
  FindInvalidIndexKeyPath,
  IndexInfo,
  RenameIndexKey,
  RenameStoreKey,
  ResolveKeyPath,
  Schema,
  SchemaToIDBSchema,
  StoreInfo,
  UpdateStore,
  UpdateStoreInfo,
  ValidateAutoIncrementKey,
  ValidateKeyPath,
  ValidatedKeyPath,
  ValidatedPrimaryKey,
  ValidatedSchemaUpdate,
  ValidateVersion,
} from './migration-builder.types'
import type { Infer, SchemaAny } from './schema'
import type {
  MigrationError,
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
    const StoreSchema extends SchemaAny,
    const PrimaryKey extends string | readonly string[] | undefined = undefined,
    const AutoIncrement extends boolean = false,
  >(options: {
    name: Name & Exclude<Name, keyof S>
    schema: StoreSchema
    primaryKey?: ValidatedPrimaryKey<
      Infer<StoreSchema>,
      PrimaryKey,
      AutoIncrement
    >
    autoIncrement?: AutoIncrement
  }): VersionBuilder<
    UpdateStore<
      S,
      Name,
      StoreInfo<Infer<StoreSchema>, {}, StoreSchema, PrimaryKey, AutoIncrement>
    >
  > {
    return this.chain<any>({
      action: 'create-object-store',
      storeName: options.name,
      keyPath: options.primaryKey as PrimaryKey,
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
    ? MigrationError<`Transform invalidates primaryKey '${Stringify<
        Info['primaryKeyPath']
      >}': keyPath no longer valid for new value type`>
    : ValidateAutoIncrementKey<
          NewValue,
          Info['primaryKeyPath'],
          Info['autoIncrement']
        > extends never
      ? MigrationError<`autoIncrement requires keyPath to resolve to number after transform, but '${Stringify<
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
        : MigrationError<`Transform invalidates index '${InvalidIndex}': keyPath no longer valid for new value type`> {
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
      keyPath: options.keyPath as string | readonly string[],
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
   * Rename an object store.
   * @param options Configuration with old and new store names
   */
  renameObjectStore<
    OldName extends keyof S & string,
    const NewName extends string,
  >(options: {
    oldName: OldName
    newName: NewName & Exclude<NewName, keyof S>
  }): VersionBuilder<RenameStoreKey<S, OldName, NewName>> {
    return this.chain<RenameStoreKey<S, OldName, NewName>>({
      action: 'rename-object-store',
      oldName: options.oldName,
      newName: options.newName,
    })
  }

  /**
   * Rename an index on an object store.
   * @param options Configuration with store name, old index name, and new index name
   */
  renameIndex<
    StoreName extends keyof S & string,
    OldIndexName extends keyof S[StoreName]['indexes'] & string,
    const NewIndexName extends string,
    Info extends ExtractStoreInfo<S, StoreName> = ExtractStoreInfo<
      S,
      StoreName
    >,
  >(options: {
    storeName: StoreName
    oldIndexName: OldIndexName
    newIndexName: NewIndexName & Exclude<NewIndexName, keyof Info['indexes']>
  }): VersionBuilder<
    UpdateStore<
      S,
      StoreName,
      UpdateStoreInfo<
        Info,
        {
          indexes: RenameIndexKey<Info['indexes'], OldIndexName, NewIndexName>
        }
      >
    >
  > {
    return this.chain<any>({
      action: 'rename-index',
      storeName: options.storeName,
      oldIndexName: options.oldIndexName,
      newIndexName: options.newIndexName,
    })
  }

  /**
   * Update a store's schema by deep-merging type changes.
   * This is a type-only operation - no runtime migration is performed.
   *
   * The update must be backwards-compatible: existing data must satisfy
   * the new type. For breaking changes, use transformRecords instead.
   *
   * @example
   * // Add an optional property
   * .updateSchema<'users', { email?: string }>()
   *
   * // Make a property optional
   * .updateSchema<'users', { name?: string }>()
   *
   * // Delete a property (set to never)
   * .updateSchema<'users', { legacyField: never }>()
   *
   * // Deep merge nested objects
   * .updateSchema<'users', { address: { zip?: string } }>()
   */
  updateSchema<
    StoreName extends keyof S & string,
    Update,
    _Merged = DeepMerge<S[StoreName]['value'], Update>,
    _Validated = ValidatedSchemaUpdate<
      S[StoreName]['value'],
      _Merged,
      S[StoreName]['primaryKeyPath'] extends string
        ? S[StoreName]['primaryKeyPath']
        : undefined
    >,
  >(
    // Phantom parameters to help TypeScript with type inference
    _storeName?: StoreName,
    _update?: Update
  ): [_Validated] extends [MigrationError<infer Message>]
    ? MigrationError<Message>
    : VersionBuilder<
        UpdateStore<
          S,
          StoreName,
          StoreInfo<
            _Validated,
            S[StoreName]['indexes'],
            S[StoreName]['schema'],
            S[StoreName]['primaryKeyPath'],
            S[StoreName]['autoIncrement']
          >
        >
      > {
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
   *     schema: schema<{ id: string; name: string }>(),
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

export type MigrationAction =
  | CreateObjectStoreAction<
      string,
      unknown,
      string | string[] | readonly string[] | undefined,
      boolean | undefined
    >
  | DeleteObjectStoreAction<string>
  | TransformObjectStoreAction<string, any, any>
  | CreateIndexAction<
      string,
      string,
      string | readonly string[],
      boolean,
      boolean
    >
  | DeleteIndexAction<string, string>

export type CreateObjectStoreAction<
  Name extends string,
  Value = unknown,
  KeyPath extends string | string[] | readonly string[] | undefined = undefined,
  AutoIncrement extends boolean | undefined = undefined,
> = {
  action: 'create-object-store'
  storeName: Name
  keyPath: KeyPath
  autoIncrement?: AutoIncrement
  _value?: Value // phantom type carrier
}

export type DeleteObjectStoreAction<Name extends string> = {
  action: 'delete-object-store'
  storeName: Name
}

export type TransformObjectStoreAction<
  Name extends string,
  OldValue = unknown,
  NewValue = unknown,
> = {
  action: 'transform-object-store'
  storeName: Name
  transform: (row: OldValue) => NewValue
}

export type CreateIndexAction<
  StoreName extends string,
  IndexName extends string,
  KeyPath extends string | readonly string[],
  MultiEntry extends boolean = false,
  Unique extends boolean = false,
> = {
  action: 'create-index'
  storeName: StoreName
  indexName: IndexName
  keyPath: KeyPath
  multiEntry?: MultiEntry
  unique?: Unique
}

export type DeleteIndexAction<
  StoreName extends string,
  IndexName extends string,
> = {
  action: 'delete-index'
  storeName: StoreName
  indexName: IndexName
}

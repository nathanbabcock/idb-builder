declare const SchemaMarker: unique symbol

/** Opaque type that carries the schema type T at compile-time only */
export type Schema<T> = { readonly [SchemaMarker]: T }

/** Creates a schema marker. Returns undefined at runtime - zero cost. */
export function schema<T>(): Schema<T> {
  return undefined as unknown as Schema<T>
}

/** Extract the type from a Schema.*/
export type Infer<S> = S extends Schema<infer T> ? T : never

/** Type constraint for any schema.s */
export type SchemaAny = Schema<any>

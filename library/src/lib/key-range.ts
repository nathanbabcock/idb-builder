type IDBKey = IDBValidKey

// Widen literal types to their base types (10 -> number, "foo" -> string)
type Widen<T> = T extends number
  ? number
  : T extends string
    ? string
    : T extends Date
      ? Date
      : T extends ArrayBuffer
        ? ArrayBuffer
        : T extends IDBKey[]
          ? IDBKey[]
          : T

// Phantom types for builder state
type NoBound = 'none'
type HasLower = 'lower'
type HasUpper = 'upper'

type BoundState = NoBound | HasLower | HasUpper

/**
 * Internal representation of range bounds.
 * Stored separately and only converted to IDBKeyRange when needed.
 */
type RangeBounds =
  | { type: 'only'; value: IDBKey }
  | { type: 'lower'; value: IDBKey; open: boolean }
  | { type: 'upper'; value: IDBKey; open: boolean }
  | {
      type: 'bound'
      lower: IDBKey
      upper: IDBKey
      lowerOpen: boolean
      upperOpen: boolean
    }

/**
 * Convert stored bounds to a native IDBKeyRange.
 */
function boundsToIDBKeyRange(bounds: RangeBounds): IDBKeyRange {
  switch (bounds.type) {
    case 'only':
      return IDBKeyRange.only(bounds.value)
    case 'lower':
      return IDBKeyRange.lowerBound(bounds.value, bounds.open)
    case 'upper':
      return IDBKeyRange.upperBound(bounds.value, bounds.open)
    case 'bound':
      return IDBKeyRange.bound(
        bounds.lower,
        bounds.upper,
        bounds.lowerOpen,
        bounds.upperOpen
      )
  }
}

/**
 * A type-safe key range wrapper that carries key type information.
 * This is a pure wrapper — the native IDBKeyRange is only created
 * when `.toIDBKeyRange()` is called.
 */
declare const keyRangePhantom: unique symbol
type TypedKeyRange<K extends IDBKey> = {
  readonly [keyRangePhantom]?: K
  /** Get the underlying IDBKeyRange for passing to native/idb methods */
  toIDBKeyRange(): IDBKeyRange
}

/**
 * Methods for adding a lower bound.
 */
interface LowerBoundMethods<K extends IDBKey, Upper extends BoundState> {
  /** Add a lower bound (exclusive): key > value */
  gt(value: K): KeyRangeChain<K, HasLower, Upper> & TypedKeyRange<K>
  /** Add a lower bound (inclusive): key >= value */
  gte(value: K): KeyRangeChain<K, HasLower, Upper> & TypedKeyRange<K>
}

/**
 * Methods for adding an upper bound.
 */
interface UpperBoundMethods<K extends IDBKey, Lower extends BoundState> {
  /** Add an upper bound (exclusive): key < value */
  lt(value: K): KeyRangeChain<K, Lower, HasUpper> & TypedKeyRange<K>
  /** Add an upper bound (inclusive): key <= value */
  lte(value: K): KeyRangeChain<K, Lower, HasUpper> & TypedKeyRange<K>
}

/**
 * Chainable key range builder.
 * Methods are conditionally available based on which bounds have been set.
 */
type KeyRangeChain<
  K extends IDBKey,
  Lower extends BoundState,
  Upper extends BoundState,
> = (Lower extends NoBound ? LowerBoundMethods<K, Upper> : unknown) &
  (Upper extends NoBound ? UpperBoundMethods<K, Lower> : unknown)

/**
 * Create a chainable key range wrapper from stored bounds.
 */
function createChain<
  K extends IDBKey,
  Lower extends BoundState,
  Upper extends BoundState,
>(bounds: RangeBounds): KeyRangeChain<K, Lower, Upper> & TypedKeyRange<K> {
  return {
    gt(value: K) {
      if (bounds.type === 'upper') {
        return createChain<K, HasLower, Upper>({
          type: 'bound',
          lower: value,
          upper: bounds.value,
          lowerOpen: true,
          upperOpen: bounds.open,
        })
      }
      return createChain<K, HasLower, Upper>({
        type: 'lower',
        value,
        open: true,
      })
    },
    gte(value: K) {
      if (bounds.type === 'upper') {
        return createChain<K, HasLower, Upper>({
          type: 'bound',
          lower: value,
          upper: bounds.value,
          lowerOpen: false,
          upperOpen: bounds.open,
        })
      }
      return createChain<K, HasLower, Upper>({
        type: 'lower',
        value,
        open: false,
      })
    },
    lt(value: K) {
      if (bounds.type === 'lower') {
        return createChain<K, Lower, HasUpper>({
          type: 'bound',
          lower: bounds.value,
          upper: value,
          lowerOpen: bounds.open,
          upperOpen: true,
        })
      }
      return createChain<K, Lower, HasUpper>({
        type: 'upper',
        value,
        open: true,
      })
    },
    lte(value: K) {
      if (bounds.type === 'lower') {
        return createChain<K, Lower, HasUpper>({
          type: 'bound',
          lower: bounds.value,
          upper: value,
          lowerOpen: bounds.open,
          upperOpen: false,
        })
      }
      return createChain<K, Lower, HasUpper>({
        type: 'upper',
        value,
        open: false,
      })
    },
    toIDBKeyRange() {
      return boundsToIDBKeyRange(bounds)
    },
  }
}

/**
 * Create a simple (non-chainable) TypedKeyRange from bounds.
 */
function createSimpleRange<K extends IDBKey>(
  bounds: RangeBounds
): TypedKeyRange<K> {
  return {
    toIDBKeyRange() {
      return boundsToIDBKeyRange(bounds)
    },
  }
}

/**
 * Type-safe factory for creating IDBKeyRange instances.
 *
 * All methods return a pure wrapper that only creates the underlying
 * IDBKeyRange when `.toIDBKeyRange()` is called.
 *
 * @example
 * ```ts
 * // Chainable - start with any bound
 * KeyRange.gt(10).lte(100)    // 10 < key <= 100
 * KeyRange.gte(10).lt(100)    // 10 <= key < 100
 * KeyRange.lt(100).gte(10)    // 10 <= key < 100 (order doesn't matter)
 *
 * // Single bounds
 * KeyRange.gte(5)             // key >= 5
 * KeyRange.lt(100)            // key < 100
 *
 * // Native-style methods
 * KeyRange.lowerBound(10)     // key >= 10
 * KeyRange.lowerBound(10, true)  // key > 10
 * KeyRange.upperBound(100)    // key <= 100
 * KeyRange.bound(10, 100)     // 10 <= key <= 100
 *
 * // Exact match
 * KeyRange.eq("user-123")
 * ```
 */
const KeyRange = {
  /**
   * Create a range for key > value (chainable)
   */
  gt<K extends IDBKey>(
    value: K
  ): KeyRangeChain<Widen<K>, HasLower, NoBound> & TypedKeyRange<Widen<K>> {
    return createChain<Widen<K>, HasLower, NoBound>({
      type: 'lower',
      value,
      open: true,
    })
  },

  /**
   * Create a range for key >= value (chainable)
   */
  gte<K extends IDBKey>(
    value: K
  ): KeyRangeChain<Widen<K>, HasLower, NoBound> & TypedKeyRange<Widen<K>> {
    return createChain<Widen<K>, HasLower, NoBound>({
      type: 'lower',
      value,
      open: false,
    })
  },

  /**
   * Create a range for key < value (chainable)
   */
  lt<K extends IDBKey>(
    value: K
  ): KeyRangeChain<Widen<K>, NoBound, HasUpper> & TypedKeyRange<Widen<K>> {
    return createChain<Widen<K>, NoBound, HasUpper>({
      type: 'upper',
      value,
      open: true,
    })
  },

  /**
   * Create a range for key <= value (chainable)
   */
  lte<K extends IDBKey>(
    value: K
  ): KeyRangeChain<Widen<K>, NoBound, HasUpper> & TypedKeyRange<Widen<K>> {
    return createChain<Widen<K>, NoBound, HasUpper>({
      type: 'upper',
      value,
      open: false,
    })
  },

  /**
   * Create a lower bound range (mirrors native IDBKeyRange.lowerBound).
   * @param lower - The lower bound value
   * @param open - If true, excludes the lower value (key > lower). Default: false (key >= lower)
   */
  lowerBound<K extends IDBKey>(
    lower: K,
    open = false
  ): TypedKeyRange<Widen<K>> {
    return createSimpleRange<Widen<K>>({ type: 'lower', value: lower, open })
  },

  /**
   * Create an upper bound range (mirrors native IDBKeyRange.upperBound).
   * @param upper - The upper bound value
   * @param open - If true, excludes the upper value (key < upper). Default: false (key <= upper)
   */
  upperBound<K extends IDBKey>(
    upper: K,
    open = false
  ): TypedKeyRange<Widen<K>> {
    return createSimpleRange<Widen<K>>({ type: 'upper', value: upper, open })
  },

  /**
   * Create a bounded range (mirrors native IDBKeyRange.bound).
   * @param lower - The lower bound value
   * @param upper - The upper bound value
   * @param lowerOpen - If true, excludes the lower value. Default: false
   * @param upperOpen - If true, excludes the upper value. Default: false
   */
  bound<K extends IDBKey>(
    lower: K,
    upper: K,
    lowerOpen = false,
    upperOpen = false
  ): TypedKeyRange<Widen<K>> {
    return createSimpleRange<Widen<K>>({
      type: 'bound',
      lower,
      upper,
      lowerOpen,
      upperOpen,
    })
  },

  /**
   * Match exactly one key value (mirrors native IDBKeyRange.only).
   */
  eq<K extends IDBKey>(value: K): TypedKeyRange<Widen<K>> {
    return createSimpleRange<Widen<K>>({ type: 'only', value })
  },
} as const

export { KeyRange }
export type { TypedKeyRange }

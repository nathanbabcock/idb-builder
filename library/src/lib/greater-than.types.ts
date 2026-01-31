/**
 * Type-level numeric comparison utilities.
 *
 * Based on the string-parsing approach used by type-fest, which provides
 * O(log10 n) recursion depth instead of O(n) - allowing comparison of
 * arbitrary numbers without hitting TypeScript's recursion limits.
 *
 * @see https://github.com/sindresorhus/type-fest/blob/main/source/greater-than.d.ts
 */

/** The digits 0-9 as a string for positional comparison */
type DigitString = '0123456789'

/** A single digit character */
type Digit = '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9'

/**
 * Check if digit A > digit B by checking their position in DigitString.
 * If B appears before A in "0123456789", then A > B.
 */
type DigitGreaterThan<A extends Digit, B extends Digit> = A extends B
  ? false
  : DigitString extends `${string}${B}${string}${A}${string}`
    ? true
    : false

/**
 * Compare two positive numeric strings of the same length, digit by digit.
 * Returns 1 if A > B, -1 if A < B, 0 if equal.
 */
type CompareSameLengthPositive<
  A extends string,
  B extends string,
> = A extends `${infer DA extends Digit}${infer RestA}`
  ? B extends `${infer DB extends Digit}${infer RestB}`
    ? DA extends DB
      ? CompareSameLengthPositive<RestA, RestB> // digits equal, continue
      : DigitGreaterThan<DA, DB> extends true
        ? 1
        : -1
    : 0 // B exhausted (shouldn't happen with same length)
  : 0 // A exhausted, must be equal

/**
 * Compare string lengths. Returns true if A is longer than B.
 */
type IsLonger<
  A extends string,
  B extends string,
> = A extends `${string}${infer RestA}`
  ? B extends `${string}${infer RestB}`
    ? IsLonger<RestA, RestB>
    : true // A still has chars, B exhausted
  : false // A exhausted

/**
 * Compare two positive numeric strings.
 * First compares length (more digits = bigger), then digit-by-digit.
 */
type PositiveStringGreaterThan<A extends string, B extends string> =
  IsLonger<A, B> extends true
    ? true
    : IsLonger<B, A> extends true
      ? false
      : CompareSameLengthPositive<A, B> extends 1
        ? true
        : false

/**
 * Check if a number is negative.
 */
type IsNegative<N extends number> = `${N}` extends `-${string}` ? true : false

/**
 * Get the absolute value as a string (strip the leading minus).
 */
type AbsoluteString<N extends number> = `${N}` extends `-${infer Abs}`
  ? Abs
  : `${N}`

/**
 * Check if two types are equal.
 */
type IsEqual<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false

/**
 * Determine if number A is strictly greater than number B.
 *
 * Handles:
 * - Positive and negative integers
 * - Zero
 * - Positive and negative infinity
 *
 * @example
 * type T1 = IsGreaterThan<5, 3>      // true
 * type T2 = IsGreaterThan<3, 5>      // false
 * type T3 = IsGreaterThan<5, 5>      // false
 * type T4 = IsGreaterThan<-3, -5>    // true (-3 > -5)
 * type T5 = IsGreaterThan<5, -3>     // true
 */
export type IsGreaterThan<A extends number, B extends number> =
  // Handle distributive conditional types
  A extends A
    ? B extends B
      ? // Check for infinity cases
        [
          IsEqual<A, typeof Infinity>,
          IsEqual<A, typeof NegativeInfinity>,
          IsEqual<B, typeof Infinity>,
          IsEqual<B, typeof NegativeInfinity>,
        ] extends [infer AIsInf, infer AIsNegInf, infer BIsInf, infer BIsNegInf]
        ? // A is +Infinity and B is not +Infinity
          AIsInf extends true
          ? BIsInf extends true
            ? false
            : true
          : // B is -Infinity and A is not -Infinity
            BIsNegInf extends true
            ? AIsNegInf extends true
              ? false
              : true
            : // A is -Infinity (and B isn't, handled above)
              AIsNegInf extends true
              ? false
              : // B is +Infinity (and A isn't, handled above)
                BIsInf extends true
                ? false
                : // Neither is infinity, compare normally
                  CompareFinite<A, B>
        : never
      : never
    : never

declare const NegativeInfinity: unique symbol
// oxlint-disable-next-line no-loss-of-precision
type NegativeInfinity = -1e999

/**
 * Compare two finite numbers.
 */
type CompareFinite<A extends number, B extends number> =
  // Check signs
  [IsNegative<A>, IsNegative<B>] extends [true, true]
    ? // Both negative: -3 > -5 means |3| < |5|
      PositiveStringGreaterThan<AbsoluteString<B>, AbsoluteString<A>>
    : [IsNegative<A>, IsNegative<B>] extends [true, false]
      ? // A negative, B positive: A < B always
        false
      : [IsNegative<A>, IsNegative<B>] extends [false, true]
        ? // A positive, B negative: A > B always
          true
        : // Both positive
          PositiveStringGreaterThan<AbsoluteString<A>, AbsoluteString<B>>

/**
 * Determine if number A is strictly less than number B.
 *
 * @example
 * type T1 = LessThan<3, 5>   // true
 * type T2 = LessThan<5, 3>   // false
 * type T3 = LessThan<5, 5>   // false
 */
export type LessThan<A extends number, B extends number> = IsGreaterThan<B, A>

/**
 * Determine if number A is greater than or equal to number B.
 */
export type GreaterThanOrEqual<A extends number, B extends number> = A extends B
  ? true
  : IsGreaterThan<A, B>

/**
 * Determine if number A is less than or equal to number B.
 */
export type LessThanOrEqual<A extends number, B extends number> = A extends B
  ? true
  : LessThan<A, B>

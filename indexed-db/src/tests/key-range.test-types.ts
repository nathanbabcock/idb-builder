import { KeyRange } from '../lib/key-range'

// ============================================================================
// Basic usage - should compile
// ============================================================================

void function testLowerBoundOnly() {
  KeyRange.gt(10)
  KeyRange.gte(10)
}

void function testUpperBoundOnly() {
  KeyRange.lt(100)
  KeyRange.lte(100)
}

void function testBothBoundsLowerFirst() {
  KeyRange.gt(10).lt(100)
  KeyRange.gte(10).lte(100)
  KeyRange.gt(10).lte(100)
  KeyRange.gte(10).lt(100)
}

void function testBothBoundsUpperFirst() {
  KeyRange.lt(100).gt(10)
  KeyRange.lte(100).gte(10)
  KeyRange.lt(100).gte(10)
  KeyRange.lte(100).gt(10)
}

void function testExactMatch() {
  KeyRange.eq(42)
  KeyRange.eq('product-123')
}

void function testNativeStyleMethods() {
  // lowerBound
  KeyRange.lowerBound(10)
  KeyRange.lowerBound(10, false) // key >= 10
  KeyRange.lowerBound(10, true) // key > 10

  // upperBound
  KeyRange.upperBound(100)
  KeyRange.upperBound(100, false) // key <= 100
  KeyRange.upperBound(100, true) // key < 100

  // bound
  KeyRange.bound(10, 100)
  KeyRange.bound(10, 100, true, false)
  KeyRange.bound(10, 100, false, true)
  KeyRange.bound(10, 100, true, true)
}

// ============================================================================
// Type safety for key types - should error on mismatch
// ============================================================================

void function testCannotMixTypesInChain() {
  // @ts-expect-error string passed to number chain
  KeyRange.gt(10).lt('oops')
}

void function testCannotMixTypesInChainReverse() {
  // @ts-expect-error number passed to string chain
  KeyRange.gt('a').lt(100)
}

void function testCannotMixTypesInChainGte() {
  // @ts-expect-error string passed to number chain
  KeyRange.gte(10).lte('oops')
}

void function testCannotMixTypesInChainLt() {
  // @ts-expect-error number passed to string chain
  KeyRange.lt('z').gte(10)
}

void function testBoundTypeMismatchLower() {
  // @ts-expect-error mixed types in bound
  KeyRange.bound('a', 100)
}

void function testBoundTypeMismatchUpper() {
  // @ts-expect-error mixed types in bound
  KeyRange.bound(10, 'z')
}

// ============================================================================
// Phantom type constraints - prevent duplicate bounds
// ============================================================================

void function testCannotAddSecondLowerBound() {
  // @ts-expect-error gt is not available after gt (already has lower bound)
  KeyRange.gt(10).gt(20)
}

void function testCannotAddSecondLowerBoundGte() {
  // @ts-expect-error gte is not available after gt
  KeyRange.gt(10).gte(20)
}

void function testCannotAddSecondLowerBoundReverse() {
  // @ts-expect-error gt is not available after gte
  KeyRange.gte(10).gt(20)
}

void function testCannotAddSecondLowerBoundGteGte() {
  // @ts-expect-error gte is not available after gte
  KeyRange.gte(10).gte(20)
}

void function testCannotAddSecondUpperBound() {
  // @ts-expect-error lt is not available after lt (already has upper bound)
  KeyRange.lt(100).lt(200)
}

void function testCannotAddSecondUpperBoundLte() {
  // @ts-expect-error lte is not available after lt
  KeyRange.lt(100).lte(200)
}

void function testCannotAddSecondUpperBoundReverse() {
  // @ts-expect-error lt is not available after lte
  KeyRange.lte(100).lt(200)
}

void function testCannotAddSecondUpperBoundLteLte() {
  // @ts-expect-error lte is not available after lte
  KeyRange.lte(100).lte(200)
}

void function testCannotAddLowerAfterBothBounds() {
  // @ts-expect-error gt not available when both bounds already set
  KeyRange.gt(10).lt(100).gt(5)
}

void function testCannotAddUpperAfterBothBounds() {
  // @ts-expect-error lt not available when both bounds already set
  KeyRange.gt(10).lt(100).lt(200)
}

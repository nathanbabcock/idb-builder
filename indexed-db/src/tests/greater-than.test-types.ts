import type {
  GreaterThan,
  GreaterThanOrEqual,
  LessThan,
  LessThanOrEqual,
} from '../lib/greater-than.types'

void function testGreaterThanPositiveIntegers() {
  void (true satisfies GreaterThan<5, 3>)
  void (false satisfies GreaterThan<3, 5>)
  void (false satisfies GreaterThan<5, 5>)
  void (false satisfies GreaterThan<0, 0>)
  void (true satisfies GreaterThan<1, 0>)
  void (false satisfies GreaterThan<0, 1>)
}

void function testGreaterThanDifferentDigitLengths() {
  void (true satisfies GreaterThan<100, 99>)
  void (false satisfies GreaterThan<99, 100>)
  void (true satisfies GreaterThan<1000, 999>)
  void (false satisfies GreaterThan<999, 1000>)
}

void function testGreaterThanLargeNumbersBeyondTsToolbeltRange() {
  void (true satisfies GreaterThan<500, 499>)
  void (true satisfies GreaterThan<1000000, 999999>)
  void (false satisfies GreaterThan<999999, 1000000>)
}

void function testGreaterThanNegativeIntegers() {
  void (true satisfies GreaterThan<-3, -5>)
  void (false satisfies GreaterThan<-5, -3>)
  void (false satisfies GreaterThan<-5, -5>)
  void (true satisfies GreaterThan<-1, -100>)
  void (false satisfies GreaterThan<-100, -1>)
}

void function testGreaterThanMixedSigns() {
  void (true satisfies GreaterThan<5, -3>)
  void (false satisfies GreaterThan<-3, 5>)
  void (true satisfies GreaterThan<0, -1>)
  void (false satisfies GreaterThan<-1, 0>)
}

void function testGreaterThanInfinity() {
  type PosInf = typeof Infinity
  // oxlint-disable-next-line no-loss-of-precision
  type NegInf = -1e999

  void (true satisfies GreaterThan<PosInf, 999999>)
  void (false satisfies GreaterThan<999999, PosInf>)
  void (false satisfies GreaterThan<PosInf, PosInf>)

  void (false satisfies GreaterThan<NegInf, -999999>)
  void (true satisfies GreaterThan<-999999, NegInf>)
  void (false satisfies GreaterThan<NegInf, NegInf>)

  void (true satisfies GreaterThan<PosInf, NegInf>)
  void (false satisfies GreaterThan<NegInf, PosInf>)
}

void function testLessThanBasicCases() {
  void (true satisfies LessThan<3, 5>)
  void (false satisfies LessThan<5, 3>)
  void (false satisfies LessThan<5, 5>)
  void (true satisfies LessThan<-5, -3>)
  void (false satisfies LessThan<-3, -5>)
}

void function testGreaterThanOrEqualBasicCases() {
  void (true satisfies GreaterThanOrEqual<5, 3>)
  void (true satisfies GreaterThanOrEqual<5, 5>)
  void (false satisfies GreaterThanOrEqual<3, 5>)
}

void function testLessThanOrEqualBasicCases() {
  void (true satisfies LessThanOrEqual<3, 5>)
  void (true satisfies LessThanOrEqual<5, 5>)
  void (false satisfies LessThanOrEqual<5, 3>)
}

void function testGreaterThanMigrationVersionUseCase() {
  // Typical migration version numbers
  void (true satisfies GreaterThan<2, 1>)
  void (true satisfies GreaterThan<3, 2>)
  void (true satisfies GreaterThan<10, 9>)
  void (true satisfies GreaterThan<100, 99>)

  // Invalid orderings should be false
  void (false satisfies GreaterThan<1, 2>)
  void (false satisfies GreaterThan<1, 1>)
}

void function testGreaterThanRejectsWrongValues() {
  // @ts-expect-error 5 > 3 is true, not false
  void (false satisfies GreaterThan<5, 3>)

  // @ts-expect-error 3 > 5 is false, not true
  void (true satisfies GreaterThan<3, 5>)
}

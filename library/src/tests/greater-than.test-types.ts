import type {
  IsGreaterThan,
  GreaterThanOrEqual,
  LessThan,
  LessThanOrEqual,
} from '../lib/greater-than.types'

void function testGreaterThanPositiveIntegers() {
  void (true satisfies IsGreaterThan<5, 3>)
  void (false satisfies IsGreaterThan<3, 5>)
  void (false satisfies IsGreaterThan<5, 5>)
  void (false satisfies IsGreaterThan<0, 0>)
  void (true satisfies IsGreaterThan<1, 0>)
  void (false satisfies IsGreaterThan<0, 1>)
}

void function testGreaterThanDifferentDigitLengths() {
  void (true satisfies IsGreaterThan<100, 99>)
  void (false satisfies IsGreaterThan<99, 100>)
  void (true satisfies IsGreaterThan<1000, 999>)
  void (false satisfies IsGreaterThan<999, 1000>)
}

void function testGreaterThanLargeNumbersBeyondTsToolbeltRange() {
  void (true satisfies IsGreaterThan<500, 499>)
  void (true satisfies IsGreaterThan<1000000, 999999>)
  void (false satisfies IsGreaterThan<999999, 1000000>)
}

void function testGreaterThanNegativeIntegers() {
  void (true satisfies IsGreaterThan<-3, -5>)
  void (false satisfies IsGreaterThan<-5, -3>)
  void (false satisfies IsGreaterThan<-5, -5>)
  void (true satisfies IsGreaterThan<-1, -100>)
  void (false satisfies IsGreaterThan<-100, -1>)
}

void function testGreaterThanMixedSigns() {
  void (true satisfies IsGreaterThan<5, -3>)
  void (false satisfies IsGreaterThan<-3, 5>)
  void (true satisfies IsGreaterThan<0, -1>)
  void (false satisfies IsGreaterThan<-1, 0>)
}

void function testGreaterThanInfinity() {
  type PosInf = typeof Infinity
  // oxlint-disable-next-line no-loss-of-precision
  type NegInf = -1e999

  void (true satisfies IsGreaterThan<PosInf, 999999>)
  void (false satisfies IsGreaterThan<999999, PosInf>)
  void (false satisfies IsGreaterThan<PosInf, PosInf>)

  void (false satisfies IsGreaterThan<NegInf, -999999>)
  void (true satisfies IsGreaterThan<-999999, NegInf>)
  void (false satisfies IsGreaterThan<NegInf, NegInf>)

  void (true satisfies IsGreaterThan<PosInf, NegInf>)
  void (false satisfies IsGreaterThan<NegInf, PosInf>)
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
  void (true satisfies IsGreaterThan<2, 1>)
  void (true satisfies IsGreaterThan<3, 2>)
  void (true satisfies IsGreaterThan<10, 9>)
  void (true satisfies IsGreaterThan<100, 99>)

  // Invalid orderings should be false
  void (false satisfies IsGreaterThan<1, 2>)
  void (false satisfies IsGreaterThan<1, 1>)
}

void function testGreaterThanRejectsWrongValues() {
  // @ts-expect-error 5 > 3 is true, not false
  void (false satisfies IsGreaterThan<5, 3>)

  // @ts-expect-error 3 > 5 is false, not true
  void (true satisfies IsGreaterThan<3, 5>)
}

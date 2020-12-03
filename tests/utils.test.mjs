import * as utils from '../src/utils.js'

test('#bufToHex', () => {
  const testString1 = '1122334455aa'
  expect(utils.bufToHex(utils.hexToBuffer(testString1))).toBe(testString1)

  const testString2 = '00000000'
  expect(utils.bufToHex(utils.hexToBuffer(testString2))).toBe(testString2)
})

test('#getTokenAmountString', () => {
  const testString = '1234567'
  const testVector = [
    '1234567.0',
    '123456.7',
    '12345.67',
    '1234.567',
    '123.4567',
    '12.34567',
    '1.234567',
    '0.1234567',
    '0.01234567',
    '0.001234567'
  ]

  for (var i = 0; i < testVector.length; i++) {
    expect(utils.getTokenAmountString(testString, i)).toBe(testVector[i])
  }
})
test('#getTokenAmountBigInt', () => {
  const testString = '1234567'
  const testVector = [
    '1234567',
    '12345670',
    '123456700',
    '1234567000',
    '12345670000',
    '123456700000',
    '1234567000000',
    '12345670000000',
    '123456700000000',
    '1234567000000000'
  ]

  for (var i = 0; i < testVector.length; i++) {
    expect(utils.getTokenAmountBigInt(testString, i).toString()).toBe(testVector[i])
  }
})

import * as utils from '../../src/utils.js'

test('#hexToBuffer', () => {
  const testString = '1122334455aa'
  const testBuffer = Buffer.from([0x11, 0x22, 0x33, 0x44, 0x55, 0xaa])

  expect(utils.hexToBuffer(testString).toString()).toBe(testBuffer.toString())
})

test('#bufToHex', () => {
  const testString = '1122334455aa'
  const testBuffer = Buffer.from([0x11, 0x22, 0x33, 0x44, 0x55, 0xaa])

  expect(utils.bufToHex(testBuffer)).toBe(testString)
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

test('#getRandomBytes', () => {
  const pvtBytes = 32
  const pvtKeyRandom = utils.getRandomBytes(pvtBytes)

  expect(pvtKeyRandom.length).toBe(32)
  expect(pvtKeyRandom).not.toBe(undefined)
})

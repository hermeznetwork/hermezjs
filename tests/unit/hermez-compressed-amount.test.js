import { HermezCompressedAmount } from '../../src/hermez-compressed-amount.js'

test('#vectors floating point number', () => {
  const testVector = [
    [6 * 0x800000000 + 123, '123000000'],
    [2 * 0x800000000 + 4545, '454500'],
    [30 * 0x800000000 + 10235, '10235000000000000000000000000000000'],
    [0, '0'],
    [0x800000000, '0'],
    [0x0001, '1'],
    [31 * 0x800000000, '0'],
    [0x800000000 + 1, '10'],
    [0xFFFFFFFFFF, '343597383670000000000000000000000000000000']
  ]
  for (let i = 0; i < testVector.length; i++) {
    const fx = HermezCompressedAmount.decompressAmount(new HermezCompressedAmount(testVector[i][0]))
    expect(fx.toString()).toBe(testVector[i][1])

    const fl = HermezCompressedAmount.compressAmount(testVector[i][1])
    const fx2 = HermezCompressedAmount.decompressAmount(fl)
    expect(fx2.toString()).toBe(testVector[i][1])
  }
})

test('#floorCompressAmount', () => {
  const testVector = [
    [30 * 0x800000000 + 9922334455, '9922334455000000000000000000000000000001'],
    [30 * 0x800000000 + 9922334454, '9922334454999999999999999999999999999999']
  ]

  for (let i = 0; i < testVector.length; i++) {
    const testFloat = HermezCompressedAmount.floorCompressAmount(testVector[i][1])
    expect(testFloat.value).toBe(testVector[i][0])
  }
})

test('exceptions', async () => {
  expect(() => {
    HermezCompressedAmount.compressAmount('992233445500000000000000000000000000000000')
  }).toThrowError('number too big')

  expect(() => {
    HermezCompressedAmount.floorCompressAmount('992233445500000000000000000000000000000000')
  }).toThrowError('number too big')

  expect(() => {
    HermezCompressedAmount.compressAmount('99223344556573838487575')
  }).toThrowError('not enough precision')
})

import { Scalar } from 'ffjavascript'
import { HermezCompressedAmount } from '../src/hermez-compressed-amount.js'

test('#vectors floating point number', () => {
  const testVector = [
    [0x307B, '123000000'],
    [0x1DC6, '454500'],
    [0xFFFF, '10235000000000000000000000000000000'],
    [0x0000, '0'],
    [0x0400, '0'],
    [0x0001, '1'],
    [0x0401, '1'],
    [0x0800, '0'],
    [0x0c00, '5'],
    [0x0801, '10'],
    [0x0c01, '15']
  ]
  for (let i = 0; i < testVector.length; i++) {
    const fx = HermezCompressedAmount.decompressAmount(testVector[i][0])
    expect(fx.toString()).toBe(testVector[i][1])

    const fl = HermezCompressedAmount.compressAmount(Scalar.e(testVector[i][1]))
    const fx2 = HermezCompressedAmount.decompressAmount(fl)
    expect(fx2.toString()).toBe(testVector[i][1])
  }
})

test('#Floor compressAmount', () => {
  const testVector = [
    [0x776f, '87999990000000000'],
    [0x776f, '87950000000000001'],
    [0x776f, '87950000000000000'],
    [0x736f, '87949999999999999']
  ]

  for (let i = 0; i < testVector.length; i++) {
    const testFloat = HermezCompressedAmount.floorcompressAmount(testVector[i][1])
    expect(testFloat).toBe(testVector[i][0])
  }
})

test('#Round', () => {
  const testVector = [
    ['100000000000000000001', '100000000000000000000'],
    ['100000000000000000000', '100000000000000000000'],
    ['99999999999999999999', '100000000000000000000']
  ]

  for (let i = 0; i < testVector.length; i++) {
    const testFloat = HermezCompressedAmount.decompressAmount(HermezCompressedAmount.compressAmount(testVector[i][0]))
    expect(testFloat.toString()).toBe(testVector[i][1])
  }
})

import { Scalar } from 'ffjavascript'

const HERMEZ_COMPRESSES_AMOUNT_TYPE = 'HermezCompressedAmount'

/** Class representing valid amounts in the Hermez network */
class HermezCompressedAmount {
  /**
   * Builds an instance of HermezCompressedAmount, a wrapper
   * for compressed BigInts in 40 bits used within the Hermez network
   * @param {Number} value - Compressed representation of a BigInt in a 40bit Number
   */
  constructor (value) {
    this.type = HERMEZ_COMPRESSES_AMOUNT_TYPE
    this.value = value
  }

  /**
   *
   * @param {HermezCompressedAmount} instance
   */
  static isHermezCompressedAmount (instance) {
    return instance.type === HERMEZ_COMPRESSES_AMOUNT_TYPE &&
      instance instanceof HermezCompressedAmount
  }

  /**
   * Convert a HermezCompressedAmount to a fix
   * @param {Scalar} fl - HermezCompressedAmount representation of the amount
   * @returns {Scalar} Scalar encoded in fix
   */
  static decompressAmount (hermezCompressedAmount) {
    if (!HermezCompressedAmount.isHermezCompressedAmount(hermezCompressedAmount)) {
      throw new Error('The parameter needs to be an instance of HermezCompressedAmount created with HermezCompressedAmount.compressAmount')
    }
    const fl = hermezCompressedAmount.value
    const m = (fl % 0x800000000)
    const e = Math.floor(fl / 0x800000000)

    let exp = Scalar.e(1)
    for (let i = 0; i < e; i++) {
      exp *= Scalar.e(10)
    }

    const res = Scalar.mul(m, exp)

    return res
  }

  /**
   * Convert a fix to a float
   * @param {String} _f - Scalar encoded in fix
   * @returns {HermezCompressedAmount} HermezCompressedAmount representation of the amount
  */
  static compressAmount (_f) {
    const f = Scalar.e(_f)
    if (Scalar.isZero(f)) {
      return new HermezCompressedAmount(0)
    }

    let m = f
    let e = 0

    while (Scalar.isZero(Scalar.mod(m, 10)) && (!Scalar.isZero(Scalar.div(m, 0x800000000)))) {
      m = Scalar.div(m, 10)
      e++
    }

    if (e > 31) {
      throw new Error('number too big')
    }

    if (!Scalar.isZero(Scalar.div(m, 0x800000000))) {
      throw new Error('not enough precision')
    }

    const res = Scalar.toNumber(m) + (e * 0x800000000)

    return new HermezCompressedAmount(res)
  }

  /**
   * Convert a float to a fix, always rounding down
   * @param {Scalar} fl - Scalar encoded in fix
   * @returns {HermezCompressedAmount} HermezCompressedAmount representation of the amount
  */
  static floorCompressAmount (_f) {
    const f = Scalar.e(_f)
    if (Scalar.isZero(f)) {
      return new HermezCompressedAmount(0)
    }

    let m = f
    let e = 0

    while (!Scalar.isZero(Scalar.div(m, 0x800000000))) {
      m = Scalar.div(m, 10)
      e++
    }

    if (e > 31) {
      throw new Error('number too big')
    }

    const res = Scalar.toNumber(m) + (e * 0x800000000)
    return new HermezCompressedAmount(res)
  }
}

export { HermezCompressedAmount }

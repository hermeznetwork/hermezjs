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
    const m = (fl & 0x3FF)
    const e = (fl >> 11)
    const e5 = (fl >> 10) & 1

    let exp = Scalar.e(1)
    for (let i = 0; i < e; i++) {
      exp *= Scalar.e(10)
    }

    let res = Scalar.mul(m, exp)
    if (e5 && e) {
      res = Scalar.add(res, Scalar.div(exp, 2))
    }
    return res
  }

  /**
   * Convert a fix to a float, always rounding down
   * @param {String} _f - Scalar encoded in fix
   * @returns {Scalar} Scalar encoded in float
   * @private
  */
  static _floorCompressAmount (_f) {
    const f = Scalar.e(_f)
    if (Scalar.isZero(f)) return 0

    let m = f
    let e = 0

    while (!Scalar.isZero(Scalar.shr(m, 10))) {
      m = Scalar.div(m, 10)
      e++
    }

    const res = Scalar.toNumber(m) + (e << 11)
    return res
  }

  /**
   * Convert a fix to a float
   * @param {String} _f - Scalar encoded in fix
   * @returns {HermezCompressedAmount} HermezCompressedAmount representation of the amount
  */
  static compressAmount (_f) {
    const f = Scalar.e(_f)

    function dist (n1, n2) {
      const tmp = Scalar.sub(n1, n2)

      return Scalar.abs(tmp)
    }

    const fl1 = HermezCompressedAmount._floorCompressAmount(f)
    const fi1 = HermezCompressedAmount.decompressAmount(new HermezCompressedAmount(fl1))
    const fl2 = fl1 | 0x400
    const fi2 = HermezCompressedAmount.decompressAmount(new HermezCompressedAmount(fl2))

    let m3 = (fl1 & 0x3FF) + 1
    let e3 = (fl1 >> 11)
    if (m3 === 0x400) {
      m3 = 0x66 // 0x400 / 10
      e3++
    }
    const fl3 = m3 + (e3 << 11)
    const fi3 = HermezCompressedAmount.decompressAmount(new HermezCompressedAmount(fl3))

    let res = fl1
    let d = dist(fi1, f)

    const d2 = dist(fi2, f)
    if (Scalar.gt(d, d2)) {
      res = fl2
      d = d2
    }

    const d3 = dist(fi3, f)
    if (Scalar.gt(d, d3)) {
      res = fl3
    }

    return new HermezCompressedAmount(res)
  }

  /**
   * Convert a float to a fix, always rounding down
   * @param {Scalar} fl - Scalar encoded in fix
   * @returns {HermezCompressedAmount} HermezCompressedAmount representation of the amount
  */
  static floorCompressAmount (_f) {
    const f = Scalar.e(_f)

    const fl1 = HermezCompressedAmount._floorCompressAmount(f)
    const fl2 = fl1 | 0x400
    const fi2 = HermezCompressedAmount.decompressAmount(new HermezCompressedAmount(fl2))

    if (Scalar.leq(fi2, f)) {
      return new HermezCompressedAmount(fl2)
    } else {
      return new HermezCompressedAmount(fl1)
    }
  }
}

export { HermezCompressedAmount }

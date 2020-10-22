import { babyJub, eddsa } from 'circomlib'
import { utils } from 'ffjavascript'

/**
 * Class representing EdDSA Baby Jub signature
 */
class Signature {
  /**
     * Create a Signature with the R8 point and S scalar
     * @param {Array[bigInt]} r8 - R8 point
     * @param {bigInt} s - Scalar
     */
  constructor (r8, s) {
    this.r8 = r8
    this.s = s
  }

  /**
     * Create a Signature from a compressed Signature Buffer
     * @param {Buffer} buf - Buffer containing a signature
     * @returns {Signature} Object signature
     */
  static newFromCompressed (buf) {
    if (buf.length !== 64) {
      throw new Error('buf must be 64 bytes')
    }
    const sig = eddsa.unpackSignature(buf)
    if (sig.R8 == null) {
      throw new Error('unpackSignature failed')
    }
    return new Signature(sig.R8, sig.S)
  }
}

/**
 * Class representing a EdDSA baby jub public key
 */
class PublicKey {
  /**
     * Create a PublicKey from a curve point p
     * @param {Array[bigInt]} p - curve point
     */
  constructor (p) {
    this.p = p
  }

  /**
     * Create a PublicKey from a bigInt compressed pubKey
     *
     * @param {BigInt} compressedBigInt - compressed public key in a bigInt
     *
     * @returns {PublicKey} public key class
     */
  static newFromCompressed (compressedBigInt) {
    const compressedBuffLE = utils.leInt2Buff(compressedBigInt, 32)
    if (compressedBuffLE.length !== 32) {
      throw new Error('buf must be 32 bytes')
    }

    const p = babyJub.unpackPoint(compressedBuffLE)
    if (p == null) {
      throw new Error('unpackPoint failed')
    }
    return new PublicKey(p)
  }

  /**
     * Compress the PublicKey
     * @returns {Buffer} - point compressed into a buffer
     */
  compress () {
    return utils.leBuff2int(babyJub.packPoint(this.p))
  }
}

/**
 * Class representing EdDSA Baby Jub private key
 */
class PrivateKey {
  /**
     * Create a PirvateKey from a 32 byte Buffer
     * @param {Buffer} buf - private key
     */
  constructor (buf) {
    if (buf.length !== 32) {
      throw new Error('buf must be 32 bytes')
    }
    this.sk = buf
  }

  /**
     * Retrieve PublicKey of the PrivateKey
     * @returns {PublicKey} PublicKey derived from PrivateKey
     */
  public () {
    return new PublicKey(eddsa.prv2pub(this.sk))
  }
}

export {
  Signature,
  PublicKey,
  PrivateKey
}

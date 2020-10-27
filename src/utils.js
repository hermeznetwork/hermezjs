import { Scalar, utils as ffUtils } from 'ffjavascript'
import ethers from 'ethers'
import circomlib from 'circomlib'

const hash = circomlib.poseidon([6, 8, 57])
const F = circomlib.poseidon.F

/**
 * Converts a buffer to a hexadecimal representation
 *
 * @param {ArrayBuffer} buf
 *
 * @returns {String}
 */
function bufToHex (buf) {
  return Array.prototype.map.call(new Uint8Array(buf), x => ('00' + x.toString(16)).slice(-2)).join('')
}

/**
 * Chunks inputs in five elements and hash with Poseidon all them togheter
 * @param {Array} arr - inputs hash
 * @returns {BigInt} - final hash
 */
function _multiHash (arr) {
  let r = Scalar.e(0)
  for (let i = 0; i < arr.length; i += 5) {
    const fiveElems = []
    for (let j = 0; j < 5; j++) {
      if (i + j < arr.length) {
        fiveElems.push(arr[i + j])
      } else {
        fiveElems.push(Scalar.e(0))
      }
    }
    const ph = hash(fiveElems)
    r = F.add(r, ph)
  }
  return F.normalize(r)
}

/**
 * Poseidon hash of a generic buffer
 * @param {Buffer} msgBuff
 * @returns {BigInt} - final hash
 */
function hashBuffer (msgBuff) {
  const n = 31
  const msgArray = []
  const fullParts = Math.floor(msgBuff.length / n)
  for (let i = 0; i < fullParts; i++) {
    const v = ffUtils.leBuff2int(msgBuff.slice(n * i, n * (i + 1)))
    msgArray.push(v)
  }
  if (msgBuff.length % n !== 0) {
    const v = ffUtils.leBuff2int(msgBuff.slice(fullParts * n))
    msgArray.push(v)
  }
  return _multiHash(msgArray)
}

const hexToBuffer = (hexString) => {
  return Buffer.from(hexString.match(/.{1,2}/g).map(byte => parseInt(byte, 16)))
}

/**
 * Converts an amount in BigInt and decimals to a String with correct decimal point placement
 *
 * @param {String} amountBigInt - String representing the amount as a BigInt with no decimals
 * @param {Number} decimals - Number of decimal points the amount actually has
 *
 * @returns {String}
 */
function getTokenAmountString (amountBigInt, decimals) {
  return ethers.utils.formatUnits(amountBigInt, decimals)
}

/** s
 * Converts an amount in Float with the appropriate decimals to a BigInt
 *
 * @param {Number} amountString - String representing the amount as a Float
 * @param {Number} decimals - Number of decimal points the amount has
 *
 * @returns {BigInt}
 */
function getTokenAmountBigInt (amountString, decimals) {
  return ethers.utils.parseUnits(amountString, decimals)
}

export {
  bufToHex,
  hashBuffer,
  hexToBuffer,
  getTokenAmountString,
  getTokenAmountBigInt
}

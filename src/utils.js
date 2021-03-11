import { ethers } from 'ethers'
import { Scalar } from 'ffjavascript'

/**
 * Converts a buffer to a hexadecimal representation
 * @param {ArrayBuffer} buf
 * @returns {String}
 */
function bufToHex (buf) {
  return Array.prototype.map.call(new Uint8Array(buf), x => ('00' + x.toString(16)).slice(-2)).join('')
}

const hexToBuffer = (hexString) => {
  return Buffer.from(hexString.match(/.{1,2}/g).map(byte => parseInt(byte, 16)))
}

/**
 * Converts an amount in BigInt and decimals to a String with correct decimal point placement
 * @param {String} amountBigInt - String representing the amount as a BigInt with no decimals
 * @param {Number} decimals - Number of decimal points the amount actually has
 * @returns {String}
 */
function getTokenAmountString (amountBigInt, decimals) {
  return ethers.utils.formatUnits(amountBigInt, decimals)
}

/**
 * Converts an amount in Float with the appropriate decimals to a BigInt
 * @param {String} amountString - String representing the amount as a Float
 * @param {Number} decimals - Number of decimal points the amount has
 * @returns {BigInt}
 */
function getTokenAmountBigInt (amountString, decimals) {
  return ethers.utils.parseUnits(amountString, decimals)
}

/**
 * Pad a string hex number with 0
 * @param {String} string - String input
 * @param {Number} length - Length of the resulting string
 * @returns {String} Resulting string
 */
function padZeros (string, length) {
  if (length > string.length) { string = '0'.repeat(length - string.length) + string }
  return string
}

/**
 * Mask and shift a Scalar
 * @param {Scalar} num - Input number
 * @param {Number} origin - Initial bit
 * @param {Number} len - Bit length of the mask
 * @returns {Scalar} Scalar
 */
function extract (num, origin, len) {
  const mask = Scalar.sub(Scalar.shl(1, len), 1)
  return Scalar.band(Scalar.shr(num, origin), mask)
}

/**
 * Generates random bytes
 * @param {Number} numBytes - number of bytes to generate
 * @returns {Uint8Array} Array of random 'numBytes'
 */
function getRandomBytes (numBytes) {
  const array = new Uint8Array(numBytes)
  if (typeof window !== 'undefined' && typeof window.crypto !== 'undefined') {
    window.crypto.getRandomValues(array)
  } else {
    require('crypto').randomFillSync(array)
  }
  return array
}

export {
  bufToHex,
  hexToBuffer,
  getTokenAmountString,
  getTokenAmountBigInt,
  padZeros,
  extract,
  getRandomBytes
}

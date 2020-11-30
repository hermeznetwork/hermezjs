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
  hexToBuffer,
  getTokenAmountString,
  getTokenAmountBigInt
}

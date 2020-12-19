import * as ethers from 'ethers'

/**
 * Converts a buffer to a hexadecimal representation
 * @param {ArrayBuffer} buf
 * @returns {string}
 */
function bufToHex (buf) {
  return Array.prototype.map.call(new Uint8Array(buf), x => ('00' + x.toString(16)).slice(-2)).join('')
}

const hexToBuffer = (hexString) => {
  return Buffer.from(hexString.match(/.{1,2}/g).map(byte => parseInt(byte, 16)))
}

/**
 * Converts an amount in BigInt and decimals to a String with correct decimal point placement
 * @param {string} amountBigInt - String representing the amount as a BigInt with no decimals
 * @param {number} decimals - Number of decimal points the amount actually has
 * @returns {string}
 */
function getTokenAmountString (amountBigInt, decimals) {
  return ethers.utils.formatUnits(amountBigInt, decimals)
}

/**
 * Converts an amount in Float with the appropriate decimals to a BigInt
 * @param {string} amountString - String representing the amount as a Float
 * @param {number} decimals - Number of decimal points the amount has
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

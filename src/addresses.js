import { utils as utilsScalar, Scalar } from 'ffjavascript'
import base64url from 'base64url'

import { padZeros } from './utils.js'

const hermezPrefix = 'hez:'
const hezEthereumAddressPattern = new RegExp('^hez:0x[a-fA-F0-9]{40}$')
const bjjAddressPattern = new RegExp('^hez:[A-Za-z0-9_-]{44}$')

/**
 * Get the hermez address representation of an ethereum address
 * @param {String} ethereumAddress
 * @returns {String} hezEthereumAddress
 */
function getHermezAddress (ethereumAddress) {
  return `${hermezPrefix}${ethereumAddress}`
}

/**
 * Gets the Ethereum address part of a Hermez address
 * @param {String} hezEthereumAddress
 * @returns {String} ethereumAddress
 */
function getEthereumAddress (hezEthereumAddress) {
  if (hezEthereumAddress.includes('hez:')) {
    return hezEthereumAddress.replace('hez:', '')
  } else {
    return hezEthereumAddress
  }
}

/**
 * Checks if given string matches regex of a Hermez address
 * @param {String} test
 * @returns {Boolean}
 */
function isHermezEthereumAddress (test) {
  if (hezEthereumAddressPattern.test(test)) {
    return true
  }
  return false
}

/**
 * Checks if given string matches regex of a Hermez BJJ address
 * @param {String} test
 * @returns {Boolean}
 */
function isHermezBjjAddress (test) {
  if (bjjAddressPattern.test(test)) {
    return true
  }
  return false
}

/**
 * Extracts the account index from the address with the hez prefix
 * @param {String} hezAccountIndex - Account index with hez prefix e.g. hez:DAI:4444
 * @returns {String} accountIndex - e.g. 4444
 */
function getAccountIndex (hezAccountIndex) {
  const colonIndex = hezAccountIndex.lastIndexOf(':') + 1
  return Number(hezAccountIndex.substring(colonIndex))
}

/**
 * Get API Bjj compressed data format
 * @param {String} bjjCompressedHex Bjj compressed address encoded as hex string
 * @returns {String} API adapted bjj compressed address
 */
function hexToBase64BJJ (bjjCompressedHex) {
  // swap endian
  const bjjScalar = Scalar.fromString(bjjCompressedHex, 16)
  const bjjBuff = utilsScalar.leInt2Buff(bjjScalar, 32)
  const bjjSwap = padZeros(utilsScalar.beBuff2int(bjjBuff).toString(16), 64)

  const bjjSwapBuffer = Buffer.from(bjjSwap, 'hex')

  let sum = 0

  for (let i = 0; i < bjjSwapBuffer.length; i++) {
    sum += bjjSwapBuffer[i]
    sum = sum % 2 ** 8
  }

  const sumBuff = Buffer.alloc(1)
  sumBuff.writeUInt8(sum)

  const finalBuffBjj = Buffer.concat([bjjSwapBuffer, sumBuff])

  return `hez:${base64url.encode(finalBuffBjj)}`
}

export {
  getHermezAddress,
  getEthereumAddress,
  isHermezEthereumAddress,
  isHermezBjjAddress,
  getAccountIndex,
  hexToBase64BJJ
}

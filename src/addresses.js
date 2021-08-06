import { utils as utilsScalar, Scalar } from 'ffjavascript'
import base64url from 'base64url'

import { padZeros, extract } from './utils.js'

const hermezPrefix = 'hez:'
const ethereumAddressPattern = new RegExp('^0x[a-fA-F0-9]{40}$')
const hezEthereumAddressPattern = new RegExp('^hez:0x[a-fA-F0-9]{40}$')
const bjjAddressPattern = new RegExp('^hez:[A-Za-z0-9_-]{44}$')
const accountIndexPattern = new RegExp('^hez:[a-zA-Z0-9]{2,6}:[0-9]{0,9}$')

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
 * Checks if given string matches regex of a Ethereum address
 * @param {String} ethereumAddress
 * @returns {Boolean}
 */
function isEthereumAddress (ethereumAddress) {
  return ethereumAddressPattern.test(ethereumAddress)
}

/**
 * Checks if given string matches regex of a Hermez address
 * @param {String} hermezEthereumAddress
 * @returns {Boolean}
 */
function isHermezEthereumAddress (hermezEthereumAddress) {
  return hezEthereumAddressPattern.test(hermezEthereumAddress)
}

/**
 * Checks if given string matches regex of a Hermez BJJ address
 * @param {String} bjjAddress
 * @returns {Boolean}
 */
function isHermezBjjAddress (bjjAddress) {
  if (!bjjAddressPattern.test(bjjAddress)) {
    return false
  }

  const bjjCompressedHex = base64ToHexBJJ(bjjAddress)
  const bjjScalar = Scalar.fromString(bjjCompressedHex, 16)
  const bjjBuff = utilsScalar.leInt2Buff(bjjScalar, 32)
  const bjjSwap = padZeros(utilsScalar.beBuff2int(bjjBuff).toString(16), 64)
  const bjjSwapBuffer = Buffer.from(bjjSwap, 'hex')

  let sum = 0
  for (let i = 0; i < bjjSwapBuffer.length; i++) {
    sum += bjjSwapBuffer[i]
    sum = sum % 2 ** 8
  }

  if (bjjAddress.startsWith('hez:')) {
    bjjAddress = bjjAddress.replace('hez:', '')
  }
  const bjjDecodedBuffer = base64url.toBuffer(bjjAddress)
  const correctSum = bjjDecodedBuffer.slice(-1)[0]
  return sum === correctSum
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
 * Checks if given string matches regex of a Hermez account index
 * @param {String} test
 * @returns {Boolean}
 */
function isHermezAccountIndex (test) {
  if (accountIndexPattern.test(test)) {
    return true
  }
  return false
}

/**
 * Get API Bjj compressed data format
 * @param {String} bjjCompressedHex - Bjj compressed address encoded as hex string
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

/**
 * Gets the Babyjubjub hexadecimal from its base64 representation
 * @param {String} base64BJJ
 * @returns {String} babyjubjub address in hex string
 */
function base64ToHexBJJ (base64BJJ) {
  if (base64BJJ.includes('hez:')) {
    base64BJJ = base64BJJ.replace('hez:', '')
  }

  const bjjSwapHex = base64url.decode(base64BJJ, 'hex')
  const bjjSwapBuff = Buffer.from(bjjSwapHex, 'hex').slice(0, 32)

  return padZeros(utilsScalar.leBuff2int(bjjSwapBuff).toString(16), 64)
}

/**
 * Get Ay and Sign from Bjj compressed
 * @param {String} fromBjjCompressed - Bjj compressed encoded as hexadecimal string
 * @return {Object} Ay represented as hexadecimal string, Sign represented as BigInt
 */
function getAySignFromBJJ (fromBjjCompressed) {
  const scalarFromBjjCompressed = Scalar.fromString(fromBjjCompressed, 16)
  const ay = extract(scalarFromBjjCompressed, 0, 254).toString(16)
  const sign = Number(extract(scalarFromBjjCompressed, 255, 1))

  return { ay, sign }
}

export {
  getHermezAddress,
  getEthereumAddress,
  isEthereumAddress,
  isHermezEthereumAddress,
  isHermezBjjAddress,
  isHermezAccountIndex,
  getAccountIndex,
  hexToBase64BJJ,
  base64ToHexBJJ,
  getAySignFromBJJ
}

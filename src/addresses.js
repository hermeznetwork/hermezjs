const hermezPrefix = 'hez:'
const hezEthereumAddressPattern = new RegExp('^hez:0x[a-fA-F0-9]{40}$')
const bjjAddressPattern = new RegExp('^hez:[A-Za-z0-9_-]{44}$')

/**
 * Get the hermez address representation of an ethereum address
 * @param {string} ethereumAddress
 * @returns {string}
 */
function getHermezAddress (ethereumAddress) {
  return `${hermezPrefix}${ethereumAddress}`
}

/**
 * Gets the Ethereum address part of a Hermez address
 *
 * @param {String} hezEthereumAddress
 *
 * @returns {String}
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
 *
 * @param {String} test
 *
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
 *
 * @param {String} test
 *
 * @returns {Boolean}
 */
function isHermezBjjEthereumAddress (test) {
  if (bjjAddressPattern.test(test)) {
    return true
  }
  return false
}

/**
 * Extracts the account index from the address with the hez prefix
 *
 * @param {String} hezAccountIndex - Account index with hez prefix e.g. hez:DAI:4444
 *
 * @returns {String} accountIndex - e.g. 4444
 */
function getAccountIndex (hezAccountIndex) {
  const colonIndex = hezAccountIndex.lastIndexOf(':') + 1
  return Number(hezAccountIndex.substring(colonIndex))
}

export {
  getHermezAddress,
  getEthereumAddress,
  isHermezEthereumAddress,
  isHermezBjjEthereumAddress,
  getAccountIndex
}

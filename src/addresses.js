const hermezPrefix = 'hez:'


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

/**
 * Get the partially hidden hermez address representation of an ethereum address
 * @param {string} ethereumAddress
 * @returns {string}
 */
function getPartiallyHiddenHermezAddress (ethereumAddress) {
  const firstAddressSlice = ethereumAddress.slice(0, 10)
  const secondAddressSlice = ethereumAddress.slice(
    ethereumAddress.length - 4,
    ethereumAddress.length
  )

  return `${firstAddressSlice} *** ${secondAddressSlice}`
}

module.exports = {
  getHermezAddress,
  getEthereumAddress,
  getAccountIndex,
  getPartiallyHiddenHermezAddress
}

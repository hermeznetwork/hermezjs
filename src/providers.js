import ethers from 'ethers'

let provider

/**
 * Set a Provider URL
 *
 * @param {String} url - Network url (i.e, http://localhost:8545)
 */
function setProvider (url) {
  if (url) {
    return ethers.getDefaultProvider(url)
  } else {
    return new ethers.providers.Web3Provider(window.ethereum)
  }
}

/**
 * Retrieve provider
 *
 * @returns {Object} provider
 */
function getProvider () {
  if (provider) {
    return provider
  }
  return setProvider()
}

export {
  setProvider,
  getProvider
}

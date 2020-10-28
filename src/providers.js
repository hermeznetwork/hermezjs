import ethers from 'ethers'

let provider

/**
 * Set a Provider URL
 *
 * @param {String} url - Network url (i.e, http://localhost:8545)
 */
function setProvider (url) {
  if (url || typeof window === 'undefined') {
    provider = new ethers.getDefaultProvider(url)
  } else {
    provider = new ethers.providers.Web3Provider(ethereum)
  }
}

/**
 * Retrieve provider
 *
 * @returns {Object} provider
 */
function getProvider () {
  if (!provider) {
    setProvider()
  }
  return provider
}

export {
  setProvider,
  getProvider
}

const ethers = require('ethers')

var _networkURL

/**
 * Initilizes network URL
 *
 * @param {String} url - Network url (i.e, http://localhost:8545)
 */
function initNetwork(url){
   _networkURL = url
}

/**
 * Retrieved provider
 *
 * @returns {Object} provider
 */
function getProvider(){
  if (typeof window === "undefined" || window === null){
    return (new ethers.getDefaultProvider(_networkURL))
  } else {
    return (new ethers.providers.Web3Provider(window.ethereum))
  }
 
}

module.exports = {
  initNetwork,
  getProvider
}

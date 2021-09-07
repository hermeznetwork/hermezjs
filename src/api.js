import axios from 'axios'

import { extractJSON } from './http.js'
import { DEFAULT_PAGE_SIZE, BASE_API_URL, API_VERSION } from './constants.js'
import { isHermezEthereumAddress, isHermezBjjAddress } from './addresses.js'
import { TxType, TxState } from './enums.js'

const PaginationOrder = {
  ASC: 'ASC',
  DESC: 'DESC'
}

/**
 * Sets the query parameters related to pagination
 * @param {Number} fromItem - Item from where to start the request
 * @returns {Object} Includes the values `fromItem` and `limit`
 * @private
 */
function _getPageData (fromItem, order, limit) {
  return {
    ...(fromItem !== undefined ? { fromItem } : {}),
    order,
    limit
  }
}

let baseApiUrl = BASE_API_URL

/**
 * Sets the current coordinator API URL
 * @param {String} url - The currently forging Coordinator
 */
function setBaseApiUrl (url) {
  baseApiUrl = url
}

/**
 * Returns current coordinator API URL
 * @returns {String} The currently set Coordinator
*/
function getBaseApiUrl () {
  return baseApiUrl
}

/**
 * Makes sure a list of next forgers includes the base API URL
 * @param {Array} nextForgerUrls - Array of forger URLs that may or may not include the base API URL
 * @returns nextForgerUrls - Array of next forgers that definitely includes the base API URL
 */
function getForgerUrls (nextForgerUrls) {
  return nextForgerUrls.includes(baseApiUrl)
    ? nextForgerUrls
    : [...nextForgerUrls, baseApiUrl]
}

/**
 * Checks a list of responses from one same POST request to different coordinators
 * If all responses are errors, throw the error
 * If at least 1 was successful, return it
 * @param {Array} responsesArray - An array of responses, including errors
 * @returns response
 * @throws Axios Error
 */
function filterResponses (responsesArray) {
  const invalidResponses = responsesArray.filter((res) => res.isAxiosError)
  if (invalidResponses.length === responsesArray.length) {
    throw invalidResponses[0]
  } else {
    return responsesArray.filter((res) => !res.isAxiosError)[0]
  }
}

/**
 * Fetches the URLs of the next forgers from the /state API
 * @returns {Array} An array of URLs of the next forgers
 */
async function getNextForgerUrls () {
  const coordinatorState = await getState()
  return [...new Set(coordinatorState.network.nextForgers.map((nextForger) => nextForger.coordinator.URL))]
}

/**
 * GET request to the /accounts endpoint. Returns a list of token accountns associated to a Hermez address
 * @param {String} address - The account's address. It can be a Hermez Ethereum address or a Hermez BabyJubJub address
 * @param {Number[]} tokenIds - Array of token IDs as registered in the network
 * @param {Number} fromItem - Item from where to start the request
 * @returns {Object} Response data with filtered token accounts and pagination data
 */
async function getAccounts (address, tokenIds, fromItem, order = PaginationOrder.ASC, limit = DEFAULT_PAGE_SIZE, axiosConfig = {}) {
  const params = {
    ...(isHermezEthereumAddress(address) ? { hezEthereumAddress: address } : {}),
    ...(isHermezBjjAddress(address) ? { BJJ: address } : {}),
    ...(tokenIds ? { tokenIds: tokenIds.join(',') } : {}),
    ..._getPageData(fromItem, order, limit)
  }

  return extractJSON(axios.get(`${baseApiUrl}/${API_VERSION}/accounts`, { ...axiosConfig, params }))
}

/**
 * GET request to the /accounts/:accountIndex endpoint. Returns a specific token account for an accountIndex
 * @param {String} accountIndex - Account index in the format hez:DAI:4444
 * @returns {Object} Response data with the token account
 */
async function getAccount (accountIndex, axiosConfig = {}) {
  return extractJSON(axios.get(`${baseApiUrl}/${API_VERSION}/accounts/${accountIndex}`, axiosConfig))
}

/**
 * GET request to the /transactions-history endpoint. Returns a list of forged transaction based on certain filters
 * @param {String} address - Filter by the address that sent or received the transactions. It can be a Hermez Ethereum address or a Hermez BabyJubJub address
 * @param {Number} tokenId - Token ID as registered in the network
 * @param {Number} batchNum - Filter by batch number
 * @param {String} accountIndex - Filter by an account index that sent or received the transactions
 * @param {Number} fromItem - Item from where to start the request
 * @param {Object} axiosConfig - Additional Axios config to use in the request
 * @returns {Object} Response data with filtered transactions and pagination data
 */
async function getTransactions (address, tokenId, batchNum, accountIndex, fromItem, order = PaginationOrder.ASC, limit = DEFAULT_PAGE_SIZE, axiosConfig = {}) {
  const params = {
    ...(isHermezEthereumAddress(address) ? { hezEthereumAddress: address } : {}),
    ...(isHermezBjjAddress(address) ? { BJJ: address } : {}),
    ...(typeof tokenId !== 'undefined' ? { tokenId } : {}),
    ...(batchNum ? { batchNum } : {}),
    ...(accountIndex ? { accountIndex } : {}),
    ..._getPageData(fromItem, order, limit)
  }

  return extractJSON(axios.get(`${baseApiUrl}/${API_VERSION}/transactions-history`, { ...axiosConfig, params }))
}

/**
 * GET request to the /transactions-history/:transactionId endpoint. Returns a specific forged transaction
 * @param {String} transactionId - The ID for the specific transaction
 * @returns {Object} Response data with the transaction
 */
async function getHistoryTransaction (transactionId, axiosConfig = {}) {
  return extractJSON(axios.get(`${baseApiUrl}/${API_VERSION}/transactions-history/${transactionId}`, axiosConfig))
}

/**
 * GET request to the /transactions-pool endpoint. Returns a list of transactions which are in the pool based on certain filters
 * @param {String} address - Filter by the address that sent or received the transactions. It can be a Hermez Ethereum address or a Hermez BabyJubJub address
 * @param {String} state - Filter transaction by state [Pending, Forging, Forged, Invalid]
 * @param {String} type - Filter transaction by type [Transfer, TransferToEthAddr, TransferToBJJ, Exit]
 * @param {Number} tokenId - Token ID as registered in the network
 * @param {String} accountIndex - Filter by an account index that sent or received the transactions
 * @param {Number} fromItem - Item from where to start the request
 * @param {Object} axiosConfig - Additional Axios config to use in the request
 * @returns {Object} Response data with filtered transactions and pagination data
 */
async function getPoolTransactions (address, state, type, tokenId, accountIndex, fromItem, order = PaginationOrder.ASC, limit = DEFAULT_PAGE_SIZE, axiosConfig = {}) {
  const params = {
    ...(isHermezEthereumAddress(address) ? { hezEthereumAddress: address } : {}),
    ...(isHermezBjjAddress(address) ? { BJJ: address } : {}),
    ...(typeof TxState[state] !== 'undefined' ? { state: TxState[state] } : {}),
    ...(typeof TxType[type] !== 'undefined' ? { type: TxType[type] } : {}),
    ...(typeof tokenId !== 'undefined' ? { tokenId } : {}),
    ...(accountIndex ? { accountIndex } : {}),
    ..._getPageData(fromItem, order, limit)
  }

  return extractJSON(axios.get(`${baseApiUrl}/${API_VERSION}/transactions-pool`, { ...axiosConfig, params }))
}

/**
 * GET request to the /transactions-pool/:transactionId endpoint. Returns a specific unforged transaction
 * @param {String} transactionId - The ID for the specific transaction
 * @returns {Object} Response data with the transaction
 */
async function getPoolTransaction (transactionId, axiosConfig = {}) {
  return extractJSON(axios.get(`${baseApiUrl}/${API_VERSION}/transactions-pool/${transactionId}`, axiosConfig))
}

/**
 * POST request to the /transaction-pool endpoint. Sends an L2 transaction to the network
 * @param {Object} transaction - Transaction data returned by TxUtils.generateL2Transaction
 * @returns {String} Transaction id
 */
async function postPoolTransaction (transaction, nextForgerUrls = [], axiosConfig = {}) {
  nextForgerUrls = nextForgerUrls.length === 0
    ? await getNextForgerUrls()
    : nextForgerUrls
  return Promise.all(getForgerUrls(nextForgerUrls).map((apiUrl) => {
    return axios.post(`${apiUrl}/${API_VERSION}/transactions-pool`, transaction, axiosConfig).catch((error) => error)
  })).then(filterResponses)
}

/**
 * POST request to the /atomic-pool endpoint. Sends an atomic group to the network
 * @param {Object} atomicGroup - Object data returned by TxUtils.generateAtomicGroup
 * @returns {String} Transactions ids
 */
async function postAtomicGroup (atomicGroup, nextForgerUrls = [], axiosConfig = {}) {
  nextForgerUrls = nextForgerUrls.length === 0
    ? await getNextForgerUrls()
    : nextForgerUrls
  return Promise.all(getForgerUrls(nextForgerUrls).map((apiUrl) => {
    return axios.post(`${apiUrl}/${API_VERSION}/atomic-pool`, atomicGroup, axiosConfig).catch((error) => error)
  })).then(filterResponses)
}

/**
 * GET request to the /exits endpoint. Returns a list of exits based on certain filters
 * @param {String} address - Filter by the address associated to the exits. It can be a Hermez Ethereum address or a Hermez BabyJubJub address
 * @param {Boolean} onlyPendingWithdraws - Filter by exits that still haven't been withdrawn
 * @param {Number} tokenId - Filter by token id
 * @param {Number} fromItem - Item from where to start the request
 * @returns {Object} Response data with the list of exits
 */
async function getExits (address, onlyPendingWithdraws, tokenId, fromItem, order = PaginationOrder.ASC, limit = DEFAULT_PAGE_SIZE, axiosConfig = {}) {
  const params = {
    ...(isHermezEthereumAddress(address) ? { hezEthereumAddress: address } : {}),
    ...(isHermezBjjAddress(address) ? { BJJ: address } : {}),
    ...(onlyPendingWithdraws ? { onlyPendingWithdraws } : {}),
    ...(typeof tokenId !== 'undefined' ? { tokenId } : {}),
    ..._getPageData(fromItem, order, limit)
  }

  return extractJSON(axios.get(`${baseApiUrl}/${API_VERSION}/exits`, { ...axiosConfig, params }))
}

/**
 * GET request to the /exits/:batchNum/:accountIndex endpoint. Returns a specific exit
 * @param {Number} batchNum - Filter by an exit in a specific batch number
 * @param {String} accountIndex - Filter by an exit associated to an account index
 * @returns {Object} Response data with the specific exit
 */
async function getExit (batchNum, accountIndex, axiosConfig = {}) {
  return extractJSON(axios.get(`${baseApiUrl}/${API_VERSION}/exits/${batchNum}/${accountIndex}`, axiosConfig))
}

/**
 * GET request to the /tokens endpoint. Returns a list of token data
 * @param {Number[]} tokenIds - An array of token IDs
 * @param {String[]} tokenSymbols - An array of token symbols
 * @returns {Object} Response data with the list of tokens
 */
async function getTokens (tokenIds, tokenSymbols, fromItem, order = PaginationOrder.ASC, limit = DEFAULT_PAGE_SIZE, axiosConfig = {}) {
  const params = {
    ...(tokenIds ? { ids: tokenIds.join(',') } : {}),
    ...(tokenSymbols ? { symbols: tokenSymbols.join(',') } : {}),
    ..._getPageData(fromItem, order, limit)
  }

  return extractJSON(axios.get(`${baseApiUrl}/${API_VERSION}/tokens`, { ...axiosConfig, params }))
}

/**
 * GET request to the /tokens/:tokenId endpoint. Returns a specific token
 * @param {Number} tokenId - A token ID
 * @returns {Object} Response data with a specific token
 */
async function getToken (tokenId, axiosConfig = {}) {
  return extractJSON(axios.get(`${baseApiUrl}/${API_VERSION}/tokens/${tokenId}`, axiosConfig))
}

/**
 * GET request to the /state endpoint.
 * @param {String} apiUrl - API URL of the coordinator to request the state from
 * @returns {Object} Response data with the current state of the coordinator
 */
async function getState (axiosConfig = {}, apiUrl = baseApiUrl) {
  return extractJSON(axios.get(`${apiUrl}/${API_VERSION}/state`, axiosConfig))
}

/**
 * GET request to the /batches endpoint. Returns a filtered list of batches
 * @param {String} forgerAddr - Filter by forger address
 * @param {Number} slotNum - A specific slot number
 * @param {Number} fromItem - Item from where to start the request
 * @returns {Object} Response data with a paginated list of batches
 */
async function getBatches (forgerAddr, slotNum, fromItem, order = PaginationOrder.ASC, limit = DEFAULT_PAGE_SIZE, axiosConfig = {}) {
  const params = {
    ...(forgerAddr ? { forgerAddr } : {}),
    ...(slotNum ? { slotNum } : {}),
    ..._getPageData(fromItem, order, limit)
  }

  return extractJSON(axios.get(`${baseApiUrl}/${API_VERSION}/batches`, { ...axiosConfig, params }))
}

/**
 * GET request to the /batches/:batchNum endpoint. Returns a specific batch
 * @param {Number} batchNum - Number of a specific batch
 * @returns {Object} Response data with a specific batch
 */
async function getBatch (batchNum, axiosConfig = {}) {
  return extractJSON(axios.get(`${baseApiUrl}/${API_VERSION}/batches/${batchNum}`, axiosConfig))
}

/**
 * GET request to the /coordinators/:bidderAddr endpoint. Returns a specific coordinator information
 * @param {String} forgerAddr - A coordinator forger address
 * @param {String} bidderAddr - A coordinator bidder address
 * @returns {Object} Response data with a specific coordinator
 */
async function getCoordinators (forgerAddr, bidderAddr, axiosConfig = {}) {
  const params = {
    ...(forgerAddr ? { forgerAddr } : {}),
    ...(bidderAddr ? { bidderAddr } : {})
  }

  return extractJSON(axios.get(`${baseApiUrl}/${API_VERSION}/coordinators`, { ...axiosConfig, params }))
}

/**
 * GET request to the /slots/:slotNum endpoint. Returns the information for a specific slot
 * @param {Number} slotNum - The nunmber of a slot
 * @returns {Object} Response data with a specific slot
 */
async function getSlot (slotNum, axiosConfig = {}) {
  return extractJSON(axios.get(`${baseApiUrl}/${API_VERSION}/slots/${slotNum}`, axiosConfig))
}

/**
 * GET request to the /bids endpoint. Returns a list of bids
 * @param {Number} slotNum - Filter by slot
 * @param {String} bidderAddr - Filter by coordinator
 * @param {Number} fromItem - Item from where to start the request
 * @returns {Object} Response data with the list of slots
 */
async function getBids (slotNum, bidderAddr, fromItem, order = PaginationOrder.ASC, limit = DEFAULT_PAGE_SIZE, axiosConfig = {}) {
  const params = {
    ...(slotNum ? { slotNum } : {}),
    ...(bidderAddr ? { bidderAddr } : {}),
    ..._getPageData(fromItem, order, limit)
  }

  return extractJSON(axios.get(`${baseApiUrl}/${API_VERSION}/bids`, { ...axiosConfig, params }))
}

/**
 * POST request to the /account-creation-authorization endpoint. Sends an authorization to the coordinator to register token accounts on their behalf
 * @param {String} hezEthereumAddress - The Hermez Ethereum address of the account that makes the authorization
 * @param {String} bJJ - BabyJubJub address of the account that makes the authorization
 * @param {String} signature - The signature of the request
 * @returns {Object} Response data
 */
async function postCreateAccountAuthorization (hezEthereumAddress, bJJ, signature, nextForgerUrls = [], axiosConfig = {}) {
  nextForgerUrls = nextForgerUrls.length === 0
    ? await getNextForgerUrls()
    : nextForgerUrls
  return Promise.all(getForgerUrls(nextForgerUrls).map((apiUrl) => {
    return axios.post(`${apiUrl}/${API_VERSION}/account-creation-authorization`, {
      hezEthereumAddress,
      bjj: bJJ,
      signature
    }, axiosConfig).catch((error) => error)
  })).then(filterResponses)
}

/**
 * Get request to the /account-creation-authorization endpoint
 * Returns whether the Hermez account has previously sent a valid authorization
 * @param {String} hezEthereumAddress - A Hermez Ethereum Address
 * @returns {Object} Response data
 */
async function getCreateAccountAuthorization (hezEthereumAddress, axiosConfig = {}) {
  return extractJSON(axios.get(`${baseApiUrl}/${API_VERSION}/account-creation-authorization/${hezEthereumAddress}`, axiosConfig))
}

/**
 * GET request to the /config endpoint
 * @returns {Object} Response data
 */
async function getConfig (axiosConfig) {
  return extractJSON(axios.get(`${baseApiUrl}/${API_VERSION}/config`, axiosConfig))
}

/**
 * GET request to the /health endpoint
 * @returns {Object} Response data
 */
async function getHealth (axiosConfig) {
  return extractJSON(axios.get(`${baseApiUrl}/${API_VERSION}/health`, axiosConfig))
}

export {
  PaginationOrder,
  _getPageData,
  setBaseApiUrl,
  getBaseApiUrl,
  getAccounts,
  getAccount,
  getTransactions,
  getHistoryTransaction,
  getPoolTransaction,
  postPoolTransaction,
  postAtomicGroup,
  getExit,
  getExits,
  getTokens,
  getToken,
  getState,
  getBatches,
  getBatch,
  getCoordinators,
  getSlot,
  getBids,
  postCreateAccountAuthorization,
  getCreateAccountAuthorization,
  getConfig,
  getPoolTransactions,
  getHealth
}

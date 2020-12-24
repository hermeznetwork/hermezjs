import axios from 'axios'

import { extractJSON } from './http.js'
import { DEFAULT_PAGE_SIZE, BASE_API_URL } from './constants.js'
import { isHermezEthereumAddress, isHermezBjjAddress } from './addresses.js'

/**
 * Sets the query parameters related to pagination
 * @param {number} fromItem - Item from where to start the request
 * @returns {object} Includes the values `fromItem` and `limit`
 * @private
 */
function _getPageData (fromItem) {
  return {
    ...(fromItem !== undefined ? { fromItem } : {}),
    limit: DEFAULT_PAGE_SIZE
  }
}

/**
 * GET request to the /accounts endpoint. Returns a list of token accountns associated to a Hermez address
 * @param {string} address - The account's address. It can be a Hermez Ethereum address or a Hermez BabyJubJub address
 * @param {number[]} tokenIds - Array of token IDs as registered in the network
 * @param {number} fromItem - Item from where to start the request
 * @returns {object} Response data with filtered token accounts and pagination data
 */
async function getAccounts (address, tokenIds, fromItem) {
  const params = {
    ...(isHermezEthereumAddress(address) ? { hezEthereumAddress: address } : {}),
    ...(isHermezBjjAddress(address) ? { BJJ: address } : {}),
    ...(tokenIds ? { tokenIds: tokenIds.join(',') } : {}),
    ..._getPageData(fromItem)
  }

  try {
    const retVal = await axios.get(`${BASE_API_URL}/accounts`, { params })
    return retVal.data
  } catch (error) {
    return undefined
  }
}

/**
 * GET request to the /accounts/:accountIndex endpoint. Returns a specific token account for an accountIndex
 * @param {string} accountIndex - Account index in the format hez:DAI:4444
 * @returns {object} Response data with the token account
 */
async function getAccount (accountIndex) {
  return extractJSON(axios.get(`${BASE_API_URL}/accounts/${accountIndex}`))
}

/**
 * GET request to the /transactions-histroy endpoint. Returns a list of forged transaction based on certain filters
 * @param {string} address - Filter by the address that sent or received the transactions. It can be a Hermez Ethereum address or a Hermez BabyJubJub address
 * @param {number[]} tokenIds - Array of token IDs as registered in the network
 * @param {number} batchNum - Filter by batch number
 * @param {string} accountIndex - Filter by an account index that sent or received the transactions
 * @param {number} fromItem - Item from where to start the request
 * @returns {object} Response data with filtered transactions and pagination data
 */
async function getTransactions (address, tokenIds, batchNum, accountIndex, fromItem) {
  const params = {
    ...(isHermezEthereumAddress(address) ? { hezEthereumAddress: address } : {}),
    ...(isHermezBjjAddress(address) ? { BJJ: address } : {}),
    ...(tokenIds ? { tokenIds: tokenIds.join(',') } : {}),
    ...(batchNum ? { batchNum } : {}),
    ...(accountIndex ? { accountIndex } : {}),
    ..._getPageData(fromItem)
  }

  return extractJSON(axios.get(`${BASE_API_URL}/transactions-history`, { params }))
}

/**
 * GET request to the /transactions-history/:transactionId endpoint. Returns a specific forged transaction
 * @param {string} transactionId - The ID for the specific transaction
 * @returns {object} Response data with the transaction
 */
async function getHistoryTransaction (transactionId) {
  return extractJSON(axios.get(`${BASE_API_URL}/transactions-history/${transactionId}`))
}

/**
 * GET request to the /transactions-pool/:transactionId endpoint. Returns a specific unforged transaction
 * @param {strring} transactionId - The ID for the specific transaction
 * @returns {object} Response data with the transaction
 */
async function getPoolTransaction (transactionId) {
  return extractJSON(axios.get(`${BASE_API_URL}/transactions-pool/${transactionId}`))
}

/**
 * POST request to the /transaction-pool endpoint. Sends an L2 transaction to the network
 * @param {object} transaction - Transaction data returned by TxUtils.generateL2Transaction
 * @returns {string} Transaction id
 */
async function postPoolTransaction (transaction) {
  return axios.post(`${BASE_API_URL}/transactions-pool`, transaction)
}

/**
 * GET request to the /exits endpoint. Returns a list of exits based on certain filters
 * @param {string} address - Filter by the address associated to the exits. It can be a Hermez Ethereum address or a Hermez BabyJubJub address
 * @param {boolean} onlyPendingWithdraws - Filter by exits that still haven't been withdrawn
 * @returns {object} Response data with the list of exits
 */
async function getExits (address, onlyPendingWithdraws) {
  const params = {
    ...(isHermezEthereumAddress(address) ? { hezEthereumAddress: address } : {}),
    ...(isHermezBjjAddress(address) ? { BJJ: address } : {}),
    ...(onlyPendingWithdraws ? { onlyPendingWithdraws } : {})
  }

  return extractJSON(axios.get(`${BASE_API_URL}/exits`, { params }))
}

/**
 * GET request to the /exits/:batchNum/:accountIndex endpoint. Returns a specific exit
 * @param {number} batchNum - Filter by an exit in a specific batch number
 * @param {string} accountIndex - Filter by an exit associated to an account index
 * @returns {object} Response data with the specific exit
 */
async function getExit (batchNum, accountIndex) {
  return await extractJSON(axios.get(`${BASE_API_URL}/exits/${batchNum}/${accountIndex}`))
}

/**
 * GET request to the /tokens endpoint. Returns a list of token data
 * @param {number[]} tokenIds - An array of token IDs
 * @returns {object} Response data with the list of tokens
 */
async function getTokens (tokenIds) {
  const params = {
    ...(tokenIds ? { ids: tokenIds.join(',') } : {})
  }

  return extractJSON(axios.get(`${BASE_API_URL}/tokens`, { params }))
}

/**
 * GET request to the /tokens/:tokenId endpoint. Returns a specific token
 * @param {number} tokenId - A token ID
 * @returns {object} Response data with a specific token
 */
async function getToken (tokenId) {
  return extractJSON(axios.get(`${BASE_API_URL}/tokens/${tokenId}`))
}

/**
 * GET request to the /state endpoint.
 * @returns {object} Response data with the current state of the coordinator
 */
async function getState () {
  const state = await extractJSON(axios.get(`${BASE_API_URL}/state`))

  return state
}

/**
 * GET request to the /batches endpoint. Returns a filtered list of batches
 * @param {string} forgerAddr - Filter by forger address
 * @param {number} slotNum - A specific slot number
 * @param {number} fromItem - Item from where to start the request
 * @returns {object} Response data with a paginated list of batches
 */
async function getBatches (forgerAddr, slotNum, fromItem) {
  const params = {
    ...(forgerAddr ? { forgerAddr } : {}),
    ...(slotNum ? { slotNum } : {}),
    ..._getPageData(fromItem)
  }

  return extractJSON(axios.get(`${BASE_API_URL}/batches`, { params }))
}

/**
 * GET request to the /batches/:batchNum endpoint. Returns a specific batch
 * @param {numberr} batchNum - Number of a specific batch
 * @returns {object} Response data with a specific batch
 */
async function getBatch (batchNum) {
  return extractJSON(axios.get(`${BASE_API_URL}/batches/${batchNum}`))
}

/**
 * GET request to the /coordinators/:bidderAddr endpoint. Returns a specific coordinator information
 * @param {string} forgerAddr - A coordinator forger address
 * @param {string} bidderAddr - A coordinator bidder address
 * @returns {object} Response data with a specific coordinator
 */
async function getCoordinators (forgerAddr, bidderAddr) {
  const params = {
    ...(forgerAddr ? { forgerAddr } : {}),
    ...(bidderAddr ? { bidderAddr } : {})
  }

  return extractJSON(axios.get(`${BASE_API_URL}/coordinators`, { params }))
}

/**
 * GET request to the /slots/:slotNum endpoint. Returns the information for a specific slot
 * @param {number} slotNum - The nunmber of a slot
 * @returns {object} Response data with a specific slot
 */
async function getSlot (slotNum) {
  return extractJSON(axios.get(`${BASE_API_URL}/slots/${slotNum}`))
}

/**
 * GET request to the /bids endpoint. Returns a list of bids
 * @param {number} slotNum - Filter by slot
 * @param {string} bidderAddr - Filter by coordinator
 * @param {number} fromItem - Item from where to start the request
 * @returns {object} Response data with the list of slots
 */
async function getBids (slotNum, bidderAddr, fromItem) {
  const params = {
    ...(slotNum ? { slotNum } : {}),
    ...(bidderAddr ? { bidderAddr } : {}),
    ..._getPageData(fromItem)
  }

  return extractJSON(axios.get(`${BASE_API_URL}/bids`, { params }))
}

/**
 * POST request to the /account-creation-authorization endpoint. Sends an authorization to the coordinator to register token accounts on their behalf
 * @param {string} hezEthereumAddress - The Hermez Ethereum address of the account that makes the authorization
 * @param {string} bJJ - BabyJubJub address of the account that makes the authorization
 * @param {string} signature - The signature of the request
 * @returns {object} Response data
 */
async function postCreateAccountAuthorization (hezEthereumAddress, bJJ, signature) {
  return axios.post(`${BASE_API_URL}/account-creation-authorization`, {
    hezEthereumAddress,
    bjj: bJJ,
    signature
  })
}

export {
  _getPageData,
  getAccounts,
  getAccount,
  getTransactions,
  getHistoryTransaction,
  getPoolTransaction,
  postPoolTransaction,
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
  postCreateAccountAuthorization
}

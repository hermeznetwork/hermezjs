import axios from 'axios'

import { extractJSON } from './http.js'
import { DEFAULT_PAGE_SIZE, BASE_API_URL } from './constants.js'
import { isHermezEthereumAddress, isHermezBjjAddress } from './addresses.js'

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
 * GET request to the /accounts endpoint. Returns a list of token accountns associated to a Hermez address
 * @param {String} address - The account's address. It can be a Hermez Ethereum address or a Hermez BabyJubJub address
 * @param {Number[]} tokenIds - Array of token IDs as registered in the network
 * @param {Number} fromItem - Item from where to start the request
 * @returns {Object} Response data with filtered token accounts and pagination data
 */
async function getAccounts (address, tokenIds, fromItem, order = PaginationOrder.ASC, limit = DEFAULT_PAGE_SIZE) {
  const params = {
    ...(isHermezEthereumAddress(address) ? { hezEthereumAddress: address } : {}),
    ...(isHermezBjjAddress(address) ? { BJJ: address } : {}),
    ...(tokenIds ? { tokenIds: tokenIds.join(',') } : {}),
    ..._getPageData(fromItem, order, limit)
  }

  return extractJSON(axios.get(`${baseApiUrl}/accounts`, { params }))
}

/**
 * GET request to the /accounts/:accountIndex endpoint. Returns a specific token account for an accountIndex
 * @param {String} accountIndex - Account index in the format hez:DAI:4444
 * @returns {Object} Response data with the token account
 */
async function getAccount (accountIndex) {
  return extractJSON(axios.get(`${baseApiUrl}/accounts/${accountIndex}`))
}

/**
 * GET request to the /transactions-histroy endpoint. Returns a list of forged transaction based on certain filters
 * @param {String} address - Filter by the address that sent or received the transactions. It can be a Hermez Ethereum address or a Hermez BabyJubJub address
 * @param {Number[]} tokenIds - Array of token IDs as registered in the network
 * @param {Number} batchNum - Filter by batch number
 * @param {String} accountIndex - Filter by an account index that sent or received the transactions
 * @param {Number} fromItem - Item from where to start the request
 * @returns {Object} Response data with filtered transactions and pagination data
 */
async function getTransactions (address, tokenIds, batchNum, accountIndex, fromItem, order = PaginationOrder.ASC, limit = DEFAULT_PAGE_SIZE) {
  const params = {
    ...(isHermezEthereumAddress(address) ? { hezEthereumAddress: address } : {}),
    ...(isHermezBjjAddress(address) ? { BJJ: address } : {}),
    ...(tokenIds ? { tokenIds: tokenIds.join(',') } : {}),
    ...(batchNum ? { batchNum } : {}),
    ...(accountIndex ? { accountIndex } : {}),
    ..._getPageData(fromItem, order, limit)
  }

  return extractJSON(axios.get(`${baseApiUrl}/transactions-history`, { params }))
}

/**
 * GET request to the /transactions-history/:transactionId endpoint. Returns a specific forged transaction
 * @param {String} transactionId - The ID for the specific transaction
 * @returns {Object} Response data with the transaction
 */
async function getHistoryTransaction (transactionId) {
  return extractJSON(axios.get(`${baseApiUrl}/transactions-history/${transactionId}`))
}

/**
 * GET request to the /transactions-pool/:transactionId endpoint. Returns a specific unforged transaction
 * @param {String} transactionId - The ID for the specific transaction
 * @returns {Object} Response data with the transaction
 */
async function getPoolTransaction (transactionId) {
  return extractJSON(axios.get(`${baseApiUrl}/transactions-pool/${transactionId}`))
}

/**
 * POST request to the /transaction-pool endpoint. Sends an L2 transaction to the network
 * @param {Object} transaction - Transaction data returned by TxUtils.generateL2Transaction
 * @returns {String} Transaction id
 */
async function postPoolTransaction (transaction) {
  return axios.post(`${baseApiUrl}/transactions-pool`, transaction)
}

/**
 * GET request to the /exits endpoint. Returns a list of exits based on certain filters
 * @param {String} address - Filter by the address associated to the exits. It can be a Hermez Ethereum address or a Hermez BabyJubJub address
 * @param {Boolean} onlyPendingWithdraws - Filter by exits that still haven't been withdrawn
 * @returns {Object} Response data with the list of exits
 */
async function getExits (address, onlyPendingWithdraws) {
  const params = {
    ...(isHermezEthereumAddress(address) ? { hezEthereumAddress: address } : {}),
    ...(isHermezBjjAddress(address) ? { BJJ: address } : {}),
    ...(onlyPendingWithdraws ? { onlyPendingWithdraws } : {})
  }

  return extractJSON(axios.get(`${baseApiUrl}/exits`, { params }))
}

/**
 * GET request to the /exits/:batchNum/:accountIndex endpoint. Returns a specific exit
 * @param {Number} batchNum - Filter by an exit in a specific batch number
 * @param {String} accountIndex - Filter by an exit associated to an account index
 * @returns {Object} Response data with the specific exit
 */
async function getExit (batchNum, accountIndex) {
  return await extractJSON(axios.get(`${baseApiUrl}/exits/${batchNum}/${accountIndex}`))
}

/**
 * GET request to the /tokens endpoint. Returns a list of token data
 * @param {number[]} tokenIds - An array of token IDs
 * @returns {Object} Response data with the list of tokens
 */
async function getTokens (tokenIds, fromItem, order = PaginationOrder.ASC, limit = DEFAULT_PAGE_SIZE) {
  const params = {
    ...(tokenIds ? { ids: tokenIds.join(',') } : {}),
    ..._getPageData(fromItem, order, limit)
  }

  return extractJSON(axios.get(`${baseApiUrl}/tokens`, { params }))
}

/**
 * GET request to the /tokens/:tokenId endpoint. Returns a specific token
 * @param {Number} tokenId - A token ID
 * @returns {Object} Response data with a specific token
 */
async function getToken (tokenId) {
  return extractJSON(axios.get(`${baseApiUrl}/tokens/${tokenId}`))
}

/**
 * GET request to the /state endpoint.
 * @returns {Object} Response data with the current state of the coordinator
 */
async function getState () {
  const state = await extractJSON(axios.get(`${baseApiUrl}/state`))
  state.network.nextForgers = [{
    coordinator: {
      URL: 'http://localhost:8086'
    }
  }]

  return state
}

/**
 * GET request to the /batches endpoint. Returns a filtered list of batches
 * @param {String} forgerAddr - Filter by forger address
 * @param {Number} slotNum - A specific slot number
 * @param {Number} fromItem - Item from where to start the request
 * @returns {Object} Response data with a paginated list of batches
 */
async function getBatches (forgerAddr, slotNum, fromItem, order = PaginationOrder.ASC, limit = DEFAULT_PAGE_SIZE) {
  const params = {
    ...(forgerAddr ? { forgerAddr } : {}),
    ...(slotNum ? { slotNum } : {}),
    ..._getPageData(fromItem, order, limit)
  }

  return extractJSON(axios.get(`${baseApiUrl}/batches`, { params }))
}

/**
 * GET request to the /batches/:batchNum endpoint. Returns a specific batch
 * @param {Number} batchNum - Number of a specific batch
 * @returns {Object} Response data with a specific batch
 */
async function getBatch (batchNum) {
  return extractJSON(axios.get(`${baseApiUrl}/batches/${batchNum}`))
}

/**
 * GET request to the /coordinators/:bidderAddr endpoint. Returns a specific coordinator information
 * @param {String} forgerAddr - A coordinator forger address
 * @param {String} bidderAddr - A coordinator bidder address
 * @returns {Object} Response data with a specific coordinator
 */
async function getCoordinators (forgerAddr, bidderAddr) {
  const params = {
    ...(forgerAddr ? { forgerAddr } : {}),
    ...(bidderAddr ? { bidderAddr } : {})
  }

  return extractJSON(axios.get(`${baseApiUrl}/coordinators`, { params }))
}

/**
 * GET request to the /slots/:slotNum endpoint. Returns the information for a specific slot
 * @param {Number} slotNum - The nunmber of a slot
 * @returns {Object} Response data with a specific slot
 */
async function getSlot (slotNum) {
  return extractJSON(axios.get(`${baseApiUrl}/slots/${slotNum}`))
}

/**
 * GET request to the /bids endpoint. Returns a list of bids
 * @param {Number} slotNum - Filter by slot
 * @param {String} bidderAddr - Filter by coordinator
 * @param {Number} fromItem - Item from where to start the request
 * @returns {Object} Response data with the list of slots
 */
async function getBids (slotNum, bidderAddr, fromItem, order = PaginationOrder.ASC, limit = DEFAULT_PAGE_SIZE) {
  const params = {
    ...(slotNum ? { slotNum } : {}),
    ...(bidderAddr ? { bidderAddr } : {}),
    ..._getPageData(fromItem, order, limit)
  }

  return extractJSON(axios.get(`${baseApiUrl}/bids`, { params }))
}

/**
 * POST request to the /account-creation-authorization endpoint. Sends an authorization to the coordinator to register token accounts on their behalf
 * @param {String} hezEthereumAddress - The Hermez Ethereum address of the account that makes the authorization
 * @param {String} bJJ - BabyJubJub address of the account that makes the authorization
 * @param {String} signature - The signature of the request
 * @returns {Object} Response data
 */
async function postCreateAccountAuthorization (hezEthereumAddress, bJJ, signature) {
  return axios.post(`${baseApiUrl}/account-creation-authorization`, {
    hezEthereumAddress,
    bjj: bJJ,
    signature
  })
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

import axios from 'axios'

import { extractJSON } from './http.js'
import { DEFAULT_PAGE_SIZE } from './constants.js'

const baseApiUrl = 'http://167.71.59.190:4010'
const hezEthereumAddressPattern = new RegExp('^hez:0x[a-fA-F0-9]{40}$')
const bjjAddressPattern = new RegExp('^hez:[A-Za-z0-9_-]{44}$')

function isEthereumAddress (test) {
  if (hezEthereumAddressPattern.test(test)) {
    return true
  }
  return false
}
function isBjjAddress (test) {
  if (bjjAddressPattern.test(test)) {
    return true
  }
  return false
}

function getPageData (fromItem) {
  return {
    ...(fromItem !== undefined ? { fromItem } : {}),
    limit: DEFAULT_PAGE_SIZE
  }
}

async function getAccounts (address, tokenIds, fromItem) {
  const params = {
    ...(isEthereumAddress(address) ? { hezEthereumAddress: address } : {}),
    ...(isBjjAddress(address) ? { BJJ: address } : {}),
    ...(tokenIds ? { tokenIds: tokenIds.join(',') } : {}),
    ...getPageData(fromItem)
  }
  return extractJSON(axios.get(`${baseApiUrl}/accounts`, { params }))
}

async function getAccount (accountIndex) {
  return extractJSON(axios.get(`${baseApiUrl}/accounts/${accountIndex}`))
}

async function getTransactions (address, tokenIds, batchNum, accountIndex, fromItem) {
  const params = {
    ...(isEthereumAddress(address) ? { hezEthereumAddress: address } : {}),
    ...(isBjjAddress(address) ? { BJJ: address } : {}),
    ...(tokenIds ? { tokenIds: tokenIds.join(',') } : {}),
    ...(batchNum ? { batchNum } : {}),
    ...(accountIndex ? { accountIndex } : {}),
    ...getPageData(fromItem)
  }
  return extractJSON(axios.get(`${baseApiUrl}/transactions-history`, { params }))
}

async function getHistoryTransaction (transactionId) {
  return extractJSON(axios.get(`${baseApiUrl}/transactions-history/${transactionId}`))
}

async function getPoolTransaction (transactionId) {
  return extractJSON(axios.get(`${baseApiUrl}/transactions-pool/${transactionId}`))
}

async function postPoolTransaction (transaction) {
  return axios.post(`${baseApiUrl}/transactions-pool`, transaction)
}

async function getExits (onlyPendingWithdraws) {
  const params = {
    ...(onlyPendingWithdraws ? { onlyPendingWithdraws } : {})
  }

  return extractJSON(axios.get(`${baseApiUrl}/exits`, { params }))
  // exit.batchNum = 5432
  // exit.instantWithdrawn = null
}

async function getExit (batchNum, accountIndex) {
  return await extractJSON(axios.get(`${baseApiUrl}/exits/${batchNum}/${accountIndex}`))
}

async function getTokens (tokenIds) {
  const params = {
    ...(tokenIds ? { ids: tokenIds.join(',') } : {})
  }

  return extractJSON(axios.get(`${baseApiUrl}/tokens`, { params }))
}

async function getToken (tokenId) {
  return extractJSON(axios.get(`${baseApiUrl}/tokens/${tokenId}`))
}

async function getState () {
  const state = await extractJSON(axios.get(`${baseApiUrl}/state`))
  // state.withdrawalDelayer.emergencyMode = true
  state.rollup.buckets[0].withdrawals = 0
  return state
}

async function getBatches (forgerAddr, slotNum, fromItem) {
  const params = {
    ...(forgerAddr ? { forgerAddr } : {}),
    ...(slotNum ? { slotNum } : {}),
    ...getPageData(fromItem)
  }
  return extractJSON(axios.get(`${baseApiUrl}/batches`, { params }))
}

async function getBatch (batchNum) {
  return extractJSON(axios.get(`${baseApiUrl}/batches/${batchNum}`))
}

async function getCoordinator (forgerAddr) {
  return extractJSON(axios.get(`${baseApiUrl}/coordinators/${forgerAddr}`))
}

async function getSlot (slotNum) {
  return extractJSON(axios.get(`${baseApiUrl}/slots/${slotNum}`))
}

async function getBids (slotNum, forgerAddr) {
  const params = {
    ...(slotNum ? { slotNum } : {}),
    ...(forgerAddr ? { forgerAddr } : {})
  }
  return extractJSON(axios.get(`${baseApiUrl}/bids`, { params }))
}

export {
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
  getCoordinator,
  getSlot,
  getBids
}

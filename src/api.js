import axios from 'axios'
import { extractJSON } from './http.js'

const baseApiUrl = 'http://167.71.59.190:4010'

async function getAccounts (hermezEthereumAddress, tokenIds) {
  const params = {
    ...(hermezEthereumAddress ? { hermezEthereumAddress } : {}),
    tokenIds: tokenIds ? { tokenIds: tokenIds.join(',') } : ''
  }

  return extractJSON(axios.get(`${baseApiUrl}/accounts`, { params }))
}

async function getAccount (accountIndex) {
  return extractJSON(axios.get(`${baseApiUrl}/accounts/${accountIndex}`))
}

async function getTransactions (accountIndex) {
  const params = {
    ...(accountIndex ? { accountIndex } : {})
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

async function getExits (onlyPending) {
  const params = {
    ...(onlyPending ? { onlyPending } : {})
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
  return extractJSON(axios.get(`${baseApiUrl}/state`))
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
  getState
}

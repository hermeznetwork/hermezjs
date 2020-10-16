const axios = require("axios")
const { extractJSON } = require("./http.js")
require('dotenv').config();

const baseApiUrl = process.env.REACT_APP_ROLLUP_API_URL

async function getAccounts (hermezEthereumAddress, tokenIds) {
  const params = {
    ...(hermezEthereumAddress ? { hermezEthereumAddress } : {}),
    ...(tokenIds ? { tokenIds: tokenIds.join(',') } : {})
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

async function getTokens (tokenIds) {
  const params = {
    ...(tokenIds ? { ids: tokenIds.join(',') } : {})
  }

  return extractJSON(axios.get(`${baseApiUrl}/tokens`, { params }))
}

async function getToken (tokenId) {
  return extractJSON(axios.get(`${baseApiUrl}/tokens/${tokenId}`))
}

async function getFees () {
  return extractJSON(axios.get(`${baseApiUrl}/recommended-fee`))
}

module.exports = {
  getAccounts,
  getAccount,
  getTransactions,
  getHistoryTransaction,
  getPoolTransaction,
  postPoolTransaction,
  getTokens,
  getToken,
  getFees
}

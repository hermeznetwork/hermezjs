import nodeLocalstorage from 'node-localstorage'

import * as constants from './constants.js'
import { getPoolTransaction } from './api.js'
import { HttpStatusCode } from './http.js'
import { TxState } from './enums.js'
import { getProvider } from './providers.js'

const LocalStorage = nodeLocalstorage.LocalStorage
const storage = (typeof localStorage === 'undefined' || localStorage === null) ? new LocalStorage('./auxdata') : localStorage

/**
 * If there's no instance in LocalStorage for the Transaction Pool, create it
 * This needs to be run when the Hermez client loads
 */
function initializeTransactionPool () {
  const storageVersion = JSON.parse(storage.getItem(constants.STORAGE_VERSION_KEY))
  const emptyTransactionPool = {}

  if (!storageVersion) {
    storage.setItem(constants.STORAGE_VERSION_KEY, constants.STORAGE_VERSION)
  }

  if (!storage.getItem(constants.TRANSACTION_POOL_KEY) || storageVersion !== constants.STORAGE_VERSION) {
    storage.setItem(constants.TRANSACTION_POOL_KEY, JSON.stringify(emptyTransactionPool))
  }
}

/**
 * Fetches the transaction details for each transaction in the pool for the specified account index and bjj
 * @param {String} accountIndex - The account index
 * @param {String} bjj - The account's BabyJubJub
 * @returns {Array}
 */
function getPoolTransactions (accountIndex, bJJ) {
  const provider = getProvider()
  const transactionPool = JSON.parse(storage.getItem(constants.TRANSACTION_POOL_KEY))

  return provider.getNetwork()
    .then(({ chainId }) => {
      const chainIdTransactionPool = transactionPool[chainId] || {}
      const accountTransactionPool = chainIdTransactionPool[bJJ] || []

      if (typeof accountTransactionPool === 'undefined') {
        return Promise.resolve([])
      }

      return accountTransactionPool
        .filter(transaction => transaction.fromAccountIndex === accountIndex || !accountIndex)
        .map(({ id: transactionId }) => {
          return getPoolTransaction(transactionId)
            .then((transaction) => {
              if (transaction.state === TxState.Forged) {
                return removePoolTransaction(bJJ, transactionId)
              } else {
                return transaction
              }
            })
            .catch(err => {
              if (err.response.status === HttpStatusCode.NOT_FOUND) {
                return removePoolTransaction(bJJ, transactionId)
              }
            })
        })
    })
    .then((accountTransactionsPromises) => {
      return Promise.all(accountTransactionsPromises)
        .then((transactions) => {
          const successfulTransactions = transactions.filter(transaction => typeof transaction !== 'undefined')
          return successfulTransactions
        })
    })
}

/**
 * Adds a transaction to the transaction pool
 * @param {String} transaction - The transaction to add to the pool
 * @param {String} bJJ - The account with which the transaction was made
 * @returns {Promise}
 */
function addPoolTransaction (transaction, bJJ) {
  const provider = getProvider()
  const transactionPool = JSON.parse(storage.getItem(constants.TRANSACTION_POOL_KEY))

  return provider.getNetwork().then(({ chainId }) => {
    const chainIdTransactionPool = transactionPool[chainId] || {}
    const accountTransactionPool = chainIdTransactionPool[bJJ] || []
    const newTransactionPool = {
      ...transactionPool,
      [chainId]: {
        ...chainIdTransactionPool,
        [bJJ]: [...accountTransactionPool, transaction]
      }
    }

    storage.setItem(constants.TRANSACTION_POOL_KEY, JSON.stringify(newTransactionPool))
  })
}

/**
 * Removes a transaction from the transaction pool
 * @param {String} bJJ - The account with which the transaction was originally made
 * @param {String} transactionId - The transaction identifier to remove from the pool
 * @returns {Promise}
 */
function removePoolTransaction (bJJ, transactionId) {
  const provider = getProvider()
  const transactionPool = JSON.parse(storage.getItem(constants.TRANSACTION_POOL_KEY))

  return provider.getNetwork().then(({ chainId }) => {
    const chainIdTransactionPool = transactionPool[chainId] || {}
    const accountTransactionPool = chainIdTransactionPool[bJJ] || []
    const newTransactionPool = {
      ...transactionPool,
      [chainId]: {
        ...chainIdTransactionPool,
        [bJJ]: accountTransactionPool.filter((transaction) => transaction.id !== transactionId)
      }
    }

    storage.setItem(constants.TRANSACTION_POOL_KEY, JSON.stringify(newTransactionPool))
  })
}

export {
  initializeTransactionPool,
  getPoolTransactions,
  addPoolTransaction,
  removePoolTransaction
}

export const _storage = storage

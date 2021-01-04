import nodeLocalstorage from 'node-localstorage'

import { TRANSACTION_POOL_KEY } from './constants.js'
import { getPoolTransaction } from './api.js'
import { HttpStatusCode } from './http.js'

const LocalStorage = nodeLocalstorage.LocalStorage
const storage = (typeof localStorage === 'undefined' || localStorage === null) ? new LocalStorage('./auxdata') : localStorage

/**
 * If there's no instance in LocalStorage for the Transaction Pool, create it
 * This needs to be run when the Hermez client loads
 */
function initializeTransactionPool () {
  if (!storage.getItem(TRANSACTION_POOL_KEY)) {
    const emptyTransactionPool = {}
    storage.setItem(TRANSACTION_POOL_KEY, JSON.stringify(emptyTransactionPool))
  }
}

/**
 * Fetches the transaction details for each transaction in the pool for the specified account index and bjj
 * @param {String} accountIndex - The account index
 * @param {String} bjj - The account's BabyJubJub
 * @returns {Array}
 */
function getPoolTransactions (accountIndex, bJJ) {
  const transactionPool = JSON.parse(storage.getItem(TRANSACTION_POOL_KEY))
  const accountTransactionPool = transactionPool[bJJ]

  if (typeof accountTransactionPool === 'undefined') {
    return Promise.resolve([])
  }

  const accountTransactionsPromises = accountTransactionPool
    .filter(transaction => transaction.fromAccountIndex === accountIndex)
    .map(({ id: transactionId }) => {
      return getPoolTransaction(transactionId)
        .catch(err => {
          if (err.response.status === HttpStatusCode.NOT_FOUND) {
            removePoolTransaction(bJJ, transactionId)
          }
        })
    })

  return Promise.all(accountTransactionsPromises)
    .then((transactions) => {
      const successfulTransactions = transactions.filter(transaction => typeof transaction !== 'undefined')
      return successfulTransactions
    })
}

/**
 * Adds a transaction to the transaction pool
 * @param {String} transaction - The transaction to add to the pool
 * @param {String} bJJ - The account with which the transaction was made
 */
function addPoolTransaction (transaction, bJJ) {
  const transactionPool = JSON.parse(storage.getItem(TRANSACTION_POOL_KEY))
  const accountTransactionPool = transactionPool[bJJ]
  const newAccountTransactionPool = accountTransactionPool === undefined
    ? [transaction]
    : [...accountTransactionPool, transaction]
  const newTransactionPool = {
    ...transactionPool,
    [bJJ]: newAccountTransactionPool
  }

  storage.setItem(TRANSACTION_POOL_KEY, JSON.stringify(newTransactionPool))
}

/**
 * Removes a transaction from the transaction pool
 * @param {String} bJJ - The account with which the transaction was originally made
 * @param {String} transactionId - The transaction identifier to remove from the pool
 */
function removePoolTransaction (bJJ, transactionId) {
  const transactionPool = JSON.parse(storage.getItem(TRANSACTION_POOL_KEY))
  const accountTransactionPool = transactionPool[bJJ]
  const newAccountTransactionPool = accountTransactionPool
    .filter((transaction) => transaction.id !== transactionId)
  const newTransactionPool = {
    ...transactionPool,
    [bJJ]: newAccountTransactionPool
  }

  storage.setItem(TRANSACTION_POOL_KEY, JSON.stringify(newTransactionPool))
}

export {
  initializeTransactionPool,
  getPoolTransactions,
  addPoolTransaction,
  removePoolTransaction
}

export const _storage = storage

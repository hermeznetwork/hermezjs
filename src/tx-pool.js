const { TRANSACTION_POOL_KEY } = require("./constants.js")
const { getPoolTransaction }   = require("./api.js")
const { HttpStatusCode }       = require("./http.js")

if (typeof localStorage === "undefined" || localStorage === null) {
     var LocalStorage = require('node-localstorage').LocalStorage;
     localStorage = new LocalStorage('./auxdata');
}

/**
 * If there's no instance in LocalStorage for the Transaction Pool, create it
 * This needs to be run when the Hermez client loads
 */
function initializeTransactionPool () {
  if (!localStorage.getItem(TRANSACTION_POOL_KEY)) {
    const emptyTransactionPool = {}
    localStorage.setItem(TRANSACTION_POOL_KEY, JSON.stringify(emptyTransactionPool))
  }
}

/**
 * Fetches the transaction details for each transaction in the pool for the specified account index and bjj
 *
 * @param {String} accountIndex - The account index
 * @param {String} bjj - The account's BabyJubJub
 *
 * @returns {Array}
 */
function getPoolTransactions (accountIndex, bJJ) {
  const transactionPool = JSON.parse(localStorage.getItem(TRANSACTION_POOL_KEY))
  const accountTransactionPool = transactionPool[bJJ]

  if (typeof accountTransactionPool === 'undefined') {
    return Promise.resolve([])
  }

  const accountTransactionsPromises = accountTransactionPool
    .filter(transaction => transaction.fromAccountIndex === accountIndex)
    .map(({ id: transactionId }) => {
      return getPoolTransaction(transactionId)
        .then((transaction) => {
          return transaction
        })
        .catch(err => {
          if (err.response.status === HttpStatusCode.NOT_FOUND) {
            removePoolTransaction(bJJ, transactionId)
          }
        })
    }
    )

  return Promise.all(accountTransactionsPromises)
    .then((transactions) => {
      const successfulTransactions = transactions.filter(transaction => typeof transaction !== 'undefined')
      return successfulTransactions
    })
}

/**
 * Adds a transaction to the transaction pool
 *
 * @param {string} transaction - The transaction to add to the pool
 * @param {string} bJJ - The account with which the transaction was made
 * @returns {void}
 */
function addPoolTransaction (transaction, bJJ) {
  const transactionPool = JSON.parse(localStorage.getItem(TRANSACTION_POOL_KEY))
  const accountTransactionPool = transactionPool[bJJ]
  const newAccountTransactionPool = accountTransactionPool === undefined
    ? [transaction]
    : [...accountTransactionPool, transaction]
  const newTransactionPool = {
    ...transactionPool,
    [bJJ]: newAccountTransactionPool
  }

  localStorage.setItem(TRANSACTION_POOL_KEY, JSON.stringify(newTransactionPool))
}

/**
 * Removes a transaction from the transaction pool
 * @param {string} bJJ - The account with which the transaction was originally made
 * @param {string} transactionId - The transaction identifier to remove from the pool
 * @returns {void}
 */
function removePoolTransaction (bJJ, transactionId) {
  const transactionPool = JSON.parse(localStorage.getItem(TRANSACTION_POOL_KEY))
  const accountTransactionPool = transactionPool[bJJ]
  const newAccountTransactionPool = accountTransactionPool
    .filter((transaction) => transaction.id !== transactionId)
  const newTransactionPool = {
    ...transactionPool,
    [bJJ]: newAccountTransactionPool
  }

  localStorage.setItem(TRANSACTION_POOL_KEY, JSON.stringify(newTransactionPool))
}

module.exports = {
  initializeTransactionPool,
  getPoolTransactions,
  addPoolTransaction,
  removePoolTransaction
}

import * as CoordinatorAPI from '../../src/api.js'
import { getL1UserTxId } from '../../src/tx-utils.js'

/**
 * Wait timeout
 * @param {Number} timeout
 */
export async function sleep (timeout) {
  await new Promise(resolve => setTimeout(resolve, timeout))
}

/**
 * Get L1 transaction identifier by inspecting its ethereum receipt
 * @param {Object} l1Receipt ethereum receipt
 * @returns {String} L1 transaction identifier
 */
export function getL1TxIdFromReceipt (l1Receipt) {
  const eventL1UserTx = l1Receipt.events.filter(event => event.event === 'L1UserTxEvent')
  const eventArgs = eventL1UserTx[0].args
  return getL1UserTxId(eventArgs[0], eventArgs[1])
}

/**
 * Check that any transaction is forged by its txID
 * @param {Object} txId - transaction Id
 * @param {Object} timeoutLoop - timeout loop among checks
 */
export async function assertTxForged (txId, timeoutLoop) {
  let forged = false
  let counter = 0
  let txInfo

  while (!forged && counter < 20) {
    try {
      txInfo = await CoordinatorAPI.getHistoryTransaction(txId)
      if (txInfo.batchNum != null) {
        forged = true
        continue
      } else {
        counter += 1
      }
    } catch (error) {
      counter += 1
    }

    await sleep(timeoutLoop || 10000)
    counter += 1
  }
  if (!forged) {
    throw new Error(`TxId ${txId} has not been forged`)
  } else {
    return txInfo
  }
}

/**
 * Generic balances asserts
 * @param {Array[Object]} accounts array of account to check their balances
 * @param {Object} token token object
 */
export async function assertBalances (accounts, token) {
  for (let i = 0; i < accounts.length; i++) {
    const hezAddress = accounts[i].hermezWallet.hermezEthereumAddress
    const index = accounts[i].index
    const expectedBalance = accounts[i].expectedBalance

    if (expectedBalance !== null) {
      const accountInfo = await CoordinatorAPI.getAccounts(hezAddress, [token.id])

      if (accountInfo.accounts[0].balance.toString() !== expectedBalance.toString()) {
        let logError = `Account ${index}\n`
        logError += `   balance is ${accountInfo.accounts[0].balance.toString()}\n`
        logError += `   expected balance is ${expectedBalance.toString()}\n`
        throw new Error(logError)
      }
    }
  }
}

/**
 * Print balances for each account
 * @param {Array[Object]} accounts array of account to check its balances
 * @param {Object} token token object
 */
export async function printBalances (accounts, token) {
  for (let i = 0; i < accounts.length; i++) {
    const hezAddress = accounts[i].hermezWallet.hermezEthereumAddress
    const index = accounts[i].index

    const accountInfo = await CoordinatorAPI.getAccounts(hezAddress, [token.id])
    console.log('accountInfo: ', accountInfo)
    const balance = accountInfo.accounts[0].balance.toString()
    console.log(`Account ${index}: ${balance}`)
  }
}

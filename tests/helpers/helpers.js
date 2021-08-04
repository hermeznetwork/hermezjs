import * as CoordinatorAPI from '../../src/api.js'
import { getL1UserTxId, computeL2Transaction } from '../../src/tx-utils.js'
import { buildAtomicTransaction } from '../../src/atomic-utils.js'
import { generateAndSendAtomicGroup } from '../../src/txjs'

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

/**
 * Compute, generate and send atomic group
 * This functionality is only thought to be used in tests since it uses several wallets
 * @param {Array[Object]} transactions - list of tx, in order to link
 * @param {String} transaction.from - The account index that's sending the transaction e.g hez:DAI:4444
 * @param {String} transaction.to - The account index of the receiver e.g hez:DAI:2156. If it's an Exit, set to a falseable value
 * @param {HermezCompressedAmount} transaction.amount - The amount being sent in the compressed format
 * @param {Number} transaction.fee - The amount of tokens to be sent as a fee to the Coordinator
 * @param {Number} transaction.nonce - The current nonce of the sender's token account
 * @param {Object} wallets - Transactions senders Hermez Wallet
 * @param {Object} tokens - The tokens information object as returned from the Coordinator.
 * @return response status
*/
export async function computeGenerateAndSendAtomicGroup (txs, wallets, tokens) {
  const generateTxs = []
  const atomicTxs = []

  if (txs.length !== wallets.length || txs.length !== tokens.length) {
    throw new Error('Invalid atomic group')
  }

  // compute L2 transactions as the object almost ready to be sent to the Coordinator
  for (let i = 0; i < txs.length; i++) {
    const tx = await computeL2Transaction(txs[i], wallets[i], tokens[i])
    generateTxs.push(tx)
  }

  // link transactions as they are ordered in txs object circularly
  // example: [A, B, C, D] --> [A linkTo B], [B linkTo C], [C linkTo D], [D linkTo A]
  for (let j = 0; j < generateTxs.length; j++) {
    let atomicTx
    if (j !== generateTxs.length - 1) {
      atomicTx = await buildAtomicTransaction(generateTxs[j], wallets[j], generateTxs[j + 1])
    } else {
      atomicTx = await buildAtomicTransaction(generateTxs[j], wallets[j], generateTxs[0])
    }
    atomicTxs.push(atomicTx)
  }

  return generateAndSendAtomicGroup(atomicTxs, wallets, tokens)
}

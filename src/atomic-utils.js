import { Scalar } from 'ffjavascript'
import { keccak256 } from '@ethersproject/keccak256'

import { addPoolTransaction } from './tx-pool.js'
import { padZeros } from './utils.js'
import { TX_ID_BYTES } from './constants'
import { generateAtomicTransaction } from './tx-utils.js'

/**
 * Determines if the transaction has a linked transaction
 * @param {Object} transaction - Transaction object returned by generateL2Transaction
 * @returns {Boolean} True if a transaction is linked, false otherwise
 */
function hasLinkedTransaction (transaction) {
  if (
    (transaction.requestFromAccountIndex ?? false) ||
    (transaction.requestToAccountIndex !== null && transaction.requestToAccountIndex !== undefined) ||
    (transaction.requestToHezEthereumAddress !== null && transaction.requestToHezEthereumAddress !== undefined) ||
    (transaction.requestToBjj !== null && transaction.requestToBjj !== undefined) ||
    (transaction.requestTokenId !== null && transaction.requestTokenId !== undefined) ||
    (transaction.requestAmount !== null && transaction.requestAmount !== undefined) ||
    (transaction.requestFee !== null && transaction.requestFee !== undefined) ||
    (transaction.requestNonce !== null && transaction.requestNonce !== undefined)
  ) {
    return true
  }
  return false
}

/**
 * Add linked transaction parameters to the transaction object
 * @param {Object} transaction - Transaction object
 * @param {Object} linkedTransaction - Transaction to be linked
 */
function addLinkedTransaction (transaction, linkedTransaction) {
  if (typeof linkedTransaction !== 'undefined') {
    transaction.requestFromAccountIndex = linkedTransaction.fromAccountIndex
    transaction.requestToAccountIndex = linkedTransaction.toAccountIndex
    transaction.requestToHezEthereumAddress = linkedTransaction.toHezEthereumAddress
    transaction.requestToBjj = linkedTransaction.toBjj
    transaction.requestTokenId = linkedTransaction.tokenId
    transaction.requestAmount = linkedTransaction.amount
    transaction.requestFee = linkedTransaction.fee
    transaction.requestNonce = linkedTransaction.nonce
  } else {
    transaction.requestFromAccountIndex = null
    transaction.requestToAccountIndex = null
    transaction.requestToHezEthereumAddress = null
    transaction.requestToBjj = null
    transaction.requestTokenId = null
    transaction.requestAmount = null
    transaction.requestFee = null
    transaction.requestNonce = null
  }
}

/**
 * Build Atomic Transaction
 * @param {Object} txSender - Transaction object
 * @param {Object} wallet - Wallet sender
 * @param {Object} txLink - Transaction to be linked
 * @param {Boolean} addToTxPool - A boolean which indicates if the tx should be added to the tx pool or not
 * @returns {Object} Transaction object with a linked transaction
 */
async function buildAtomicTransaction (txSender, wallet, txLink, addToTxPool = true) {
  const l2TxParams = await generateAtomicTransaction(txSender, txLink)

  wallet.signTransaction(l2TxParams.transaction, l2TxParams.encodedTransaction)
  if (addToTxPool) {
    await addPoolTransaction(l2TxParams.transaction, wallet.publicKeyCompressedHex)
  }

  return l2TxParams.transaction
}

/**
 * Generate AtomicID
 * @param {Array} txs array of txs (atomic group)
 * @returns {String} atomicID as hex string
 */
function generateAtomicID (txs) {
  const txLenBits = (TX_ID_BYTES + 1) * 8
  const totalIDBits = txs.length * txLenBits

  let res = Scalar.e(0)
  for (let i = txs.length - 1; i > -1; i--) {
    res = Scalar.add(res, Scalar.shl(txs[i].id, txLenBits * (txs.length - 1 - i)))
  }
  const IDHex = padZeros(res.toString('16'), totalIDBits / 4)
  const hash = keccak256(`0x${IDHex}`)

  return hash
}

/**
 * Create Atomic Group, add requestOffset and generate atomic ID
 * @param {Array} txs - Transactions
 * @param {Array} requestOffsets - request offsets to set on each transaction
 * @returns {Object} Atomic group ready to be sent to the coordinator
 * @throws {Error} Throws an error if invalid txs lenght or custom requestOffsets doea not match txs length
 */
function generateAtomicGroup (txs, requestOffsets) {
  if (txs.length <= 1 || txs.length > 5) {
    throw new Error('Invalid atomic group')
  }
  const atomicID = generateAtomicID(txs)

  if (typeof requestOffsets !== 'undefined') {
    if (txs.length !== requestOffsets.length) {
      throw new Error('Invalid length requestOffsets')
    }

    for (let i = 0; i < txs.length; i++) {
      txs[i].requestOffset = requestOffsets[i]
    }
  } else {
    for (let i = 0; i < txs.length; i++) {
      if (i !== txs.length - 1) {
        txs[i].requestOffset = 1
      } else {
        txs[i].requestOffset = 8 - i
      }
    }
  }

  const atomicGroup = {
    atomicGroupId: atomicID,
    transactions: txs
  }
  return atomicGroup
}

export {
  hasLinkedTransaction,
  addLinkedTransaction,
  buildAtomicTransaction,
  generateAtomicGroup,
  generateAtomicID
}

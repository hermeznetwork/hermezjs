import BigInt from 'big-integer'
import { Scalar } from 'ffjavascript'
import circomlib from 'circomlib'
import { keccak256 } from '@ethersproject/keccak256'

import { feeFactors } from './fee-factors.js'
import { bufToHex } from './utils.js'
import { HermezCompressedAmount } from './hermez-compressed-amount.js'
import { getPoolTransactions } from './tx-pool.js'
import { getAccountIndex, getEthereumAddress, isHermezEthereumAddress, isHermezAccountIndex } from './addresses.js'
import { getAccount } from './api.js'
import { getProvider } from './providers.js'

export const TxType = {
  Deposit: 'Deposit',
  CreateAccountDeposit: 'CreateAccountDeposit',
  Transfer: 'Transfer',
  TransferToEthAddr: 'TransferToEthAddr',
  Withdraw: 'Withdrawn',
  Exit: 'Exit',
  ForceExit: 'ForceExit'
}

export const TxState = {
  Forged: 'fged',
  Forging: 'fing',
  Pending: 'pend',
  Invalid: 'invl'
}

export const TxLevel = {
  L1: 'L1',
  L2: 'L2'
}

/**
 * Encodes the transaction object to be in a format supported by the Smart Contracts and Circuits.
 * Used, for example, to sign the transaction
 * @param {Object} transaction - Transaction object returned by generateL2Transaction
 * @param {String} providerUrl - Network url (i.e, http://localhost:8545). Optional
 * @returns {Object} encodedTransaction
 * @private
 */
async function encodeTransaction (transaction, providerUrl) {
  const encodedTransaction = Object.assign({}, transaction)

  const provider = getProvider(providerUrl)
  encodedTransaction.chainId = (await provider.getNetwork()).chainId

  encodedTransaction.fromAccountIndex = getAccountIndex(transaction.fromAccountIndex)
  if (transaction.toAccountIndex) {
    encodedTransaction.toAccountIndex = getAccountIndex(transaction.toAccountIndex)
  } else if (transaction.type === 'Exit') {
    encodedTransaction.toAccountIndex = 1
  }

  if (transaction.toHezEthereumAddress) {
    encodedTransaction.toEthereumAddress = getEthereumAddress(transaction.toHezEthereumAddress)
  }

  return encodedTransaction
}

/**
 * Generates the Transaction Id based on the spec
 * TxID (33 bytes) for L2Tx is:
 * bytes:   | 1 byte |                    32 bytes                           |
 *                     SHA256( 6 bytes | 4 bytes | 2 bytes| 5 bytes | 1 byte )
 * content: |  type  | SHA256([FromIdx | TokenID | Amount |  Nonce  | Fee    ])
 * where type for L2Tx is '2'
 * @param {Number} fromIdx - The account index that sends the transaction
 * @param {Number} tokenId - The tokenId being transacted
 * @param {Number} amount - The amount being transacted in the compressed format
 * @param {Number} nonce - Nonce of the transaction
 * @param {Number} fee - The fee of the transaction
 * @returns {String} Transaction Id
 */
function getTxId (fromIdx, tokenId, amount, nonce, fee) {
  const fromIdxBytes = new ArrayBuffer(8)
  const fromIdxView = new DataView(fromIdxBytes)
  fromIdxView.setBigUint64(0, BigInt(fromIdx).value, false)

  const tokenIdBytes = new ArrayBuffer(8)
  const tokenIdView = new DataView(tokenIdBytes)
  tokenIdView.setBigUint64(0, BigInt(tokenId).value, false)

  const amountF16 = HermezCompressedAmount.compressAmount(amount).value
  const amountBytes = new ArrayBuffer(8)
  const amountView = new DataView(amountBytes)
  amountView.setBigUint64(0, BigInt(amountF16).value, false)

  const nonceBytes = new ArrayBuffer(8)
  const nonceView = new DataView(nonceBytes)
  nonceView.setBigUint64(0, BigInt(nonce).value, false)

  const fromIdxHex = bufToHex(fromIdxView.buffer.slice(2, 8))
  const tokenIdHex = bufToHex(tokenIdView.buffer.slice(4, 8))
  const amountHex = bufToHex(amountView.buffer.slice(6, 8))
  const nonceHex = bufToHex(nonceView.buffer.slice(3, 8))

  let feeHex = fee.toString(16)
  if (feeHex.length === 1) {
    feeHex = '0' + feeHex
  }
  const v = fromIdxHex + tokenIdHex + amountHex + nonceHex + feeHex
  const h = keccak256('0x' + v).slice(2)
  return '0x02' + h
}

/**
 * Calculates the appropriate fee factor depending on what's the fee as a percentage of the amount
 * @param {Number} fee - The fee in token value
 * @param {String} amount - The amount as a BigInt string
 * @return {Number} feeFactor
 */
function getFee (fee, amount, decimals) {
  const amountFloat = Number(amount) / Math.pow(10, decimals)
  const percentage = fee / amountFloat
  let low = 0
  let mid
  let high = feeFactors.length - 1
  while (high - low > 1) {
    mid = Math.floor((low + high) / 2)
    if (feeFactors[mid] < percentage) {
      low = mid
    } else {
      high = mid
    }
  }

  return high
}

/**
 * Gets the transaction type depending on the information in the transaction object
 * If an account index is used, it will be 'Transfer'
 * If a Hermez address is used, it will be 'TransferToEthAddr'
 * If a BabyJubJub is used, it will be 'TransferToBjj'
 * @param {Object} transaction - Transaction object sent to generateL2Transaction
 * @return {String} transactionType
 */
function getTransactionType (transaction) {
  if (transaction.to) {
    if (isHermezAccountIndex(transaction.to)) {
      return TxType.Transfer
    } else if (isHermezEthereumAddress(transaction.to)) {
      return TxType.TransferToEthAddr
    }
  } else {
    return TxType.Exit
  }
}

/**
 * Calculates the appropriate nonce based on the current token account nonce and existing transactions in the Pool.
 * It needs to find the lowest nonce available as transactions in the pool may fail and the Coordinator only forges
 * transactions in the order set by nonces.
 * @param {Number} currentNonce - The current token account nonce returned by the Coordinator (optional)
 * @param {String} accountIndex - The account index
 * @param {Number} tokenId - The token id of the token in the transaction
 * @return {Number} nonce
 */
async function getNonce (currentNonce, accountIndex, bjj, tokenId) {
  if (typeof currentNonce !== 'undefined') {
    return currentNonce
  }

  const accountData = await getAccount(accountIndex)
  let nonce = accountData.nonce

  const poolTxs = await getPoolTransactions(accountIndex, bjj)

  const poolTxsNonces = poolTxs
    .filter(tx => tx.token.id === tokenId)
    .map(tx => tx.nonce)
    .sort()

  // return current nonce if no transactions are pending
  if (poolTxsNonces.length) {
    while (poolTxsNonces.indexOf(nonce) !== -1) {
      nonce++
    }
  }

  return nonce
}

/**
 * Encode tx compressed data
 * @param {Object} tx - Transaction object returned by `encodeTransaction`
 * @returns {Scalar} Encoded tx compressed data
 * @private
 */
function buildTxCompressedData (tx) {
  const signatureConstant = Scalar.fromString('3322668559')
  let res = Scalar.e(0)

  res = Scalar.add(res, signatureConstant) // SignConst --> 32 bits
  res = Scalar.add(res, Scalar.shl(tx.chainId || 0, 32)) // chainId --> 16 bits
  res = Scalar.add(res, Scalar.shl(tx.fromAccountIndex || 0, 48)) // fromIdx --> 48 bits
  res = Scalar.add(res, Scalar.shl(tx.toAccountIndex || 0, 96)) // toIdx --> 48 bits
  res = Scalar.add(res, Scalar.shl(HermezCompressedAmount.compressAmount(tx.amount || 0).value, 144)) // amounf16 --> 16 bits
  res = Scalar.add(res, Scalar.shl(tx.tokenId || 0, 160)) // tokenID --> 32 bits
  res = Scalar.add(res, Scalar.shl(tx.nonce || 0, 192)) // nonce --> 40 bits
  res = Scalar.add(res, Scalar.shl(tx.fee || 0, 232)) // userFee --> 8 bits
  res = Scalar.add(res, Scalar.shl(tx.toBjjSign ? 1 : 0, 240)) // toBjjSign --> 1 bit

  return res
}

/**
 * Build element_1 for L2HashSignature
 * @param {Object} tx - Transaction object returned by `encodeTransaction`
 * @returns {Scalar} element_1 L2 signature
 */
function buildElement1 (tx) {
  let res = Scalar.e(0)

  res = Scalar.add(res, Scalar.fromString(tx.toEthereumAddress || '0', 16)) // ethAddr --> 160 bits
  res = Scalar.add(res, Scalar.shl(tx.maxNumBatch || 0, 160)) // maxNumBatch --> 32 bits

  return res
}

/**
 * Builds the message to hash. Used when signing transactions
 * @param {Object} encodedTransaction - Transaction object return from `encodeTransaction`
 * @returns {Scalar} Message to sign
 */
function buildTransactionHashMessage (encodedTransaction) {
  const txCompressedData = buildTxCompressedData(encodedTransaction)
  const element1 = buildElement1(encodedTransaction)

  const h = circomlib.poseidon([
    txCompressedData,
    element1,
    Scalar.fromString(encodedTransaction.toBjjAy || '0', 16),
    Scalar.e(encodedTransaction.rqTxCompressedDataV2 || 0),
    Scalar.fromString(encodedTransaction.rqToEthAddr || '0', 16),
    Scalar.fromString(encodedTransaction.rqToBjjAy || '0', 16)
  ])

  return h
}

/**
 * Prepares a transaction to be ready to be sent to a Coordinator.
 * @param {Object} transaction - ethAddress and babyPubKey together
 * @param {String} transaction.from - The account index that's sending the transaction e.g hez:DAI:4444
 * @param {String} transaction.to - The account index or Hermez address of the receiver e.g hez:DAI:2156. If it's an Exit, set to a falseable value
 * @param {HermezCompressedAmount} transaction.amount - The amount being sent as a HermezCompressedAmount
 * @param {Number} transaction.fee - The amount of tokens to be sent as a fee to the Coordinator
 * @param {Number} transaction.nonce - The current nonce of the sender's token account (optional)
 * @param {String} bjj - The compressed BabyJubJub in hexadecimal format of the transaction sender
 * @param {Object} token - The token information object as returned from the Coordinator.
 * @return {Object} - Contains `transaction` and `encodedTransaction`. `transaction` is the object almost ready to be sent to the Coordinator. `encodedTransaction` is needed to sign the `transaction`
*/
async function generateL2Transaction (tx, bjj, token) {
  const toAccountIndex = isHermezAccountIndex(tx.to) ? tx.to : null
  const decompressedAmount = HermezCompressedAmount.decompressAmount(tx.amount)
  const transaction = {
    type: getTransactionType(tx),
    tokenId: token.id,
    fromAccountIndex: tx.from,
    toAccountIndex: tx.type === 'Exit' ? `hez:${token.symbol}:1` : toAccountIndex,
    toHezEthereumAddress: isHermezEthereumAddress(tx.to) ? tx.to : null,
    toBjj: null,
    // Corrects precision errors using the same system used in the Coordinator
    amount: decompressedAmount.toString(),
    fee: getFee(tx.fee, decompressedAmount, token.decimals),
    nonce: await getNonce(tx.nonce, tx.from, bjj, token.id),
    requestFromAccountIndex: null,
    requestToAccountIndex: null,
    requestToHezEthereumAddress: null,
    requestToBjj: null,
    requestTokenId: null,
    requestAmount: null,
    requestFee: null,
    requestNonce: null
  }

  const encodedTransaction = await encodeTransaction(transaction)
  transaction.id = getTxId(
    encodedTransaction.fromAccountIndex,
    encodedTransaction.tokenId,
    encodedTransaction.amount,
    encodedTransaction.nonce,
    encodedTransaction.fee
  )

  return { transaction, encodedTransaction }
}

/**
 * Gets the beautified name of a transaction state
 * @param {String} transactionState - The original transaction state from the API
 * @return {String} - The beautified transaction state
*/
function beautifyTransactionState (transactionState) {
  return Object.keys(TxState).find(key => TxState[key] === transactionState)
}

export {
  encodeTransaction as _encodeTransaction,
  getTxId,
  getFee,
  getTransactionType,
  getNonce,
  buildTxCompressedData as _buildTxCompressedData,
  buildTransactionHashMessage,
  generateL2Transaction,
  beautifyTransactionState
}

import { Scalar } from 'ffjavascript'
import circomlib from 'circomlib'
import { keccak256 } from '@ethersproject/keccak256'

import { feeFactors, feeFactorsAsBigInts } from './fee-factors.js'
import { bufToHex, getTokenAmountBigInt } from './utils.js'
import { HermezCompressedAmount } from './hermez-compressed-amount.js'
import { getPoolTransactions } from './tx-pool.js'
import {
  getAccountIndex, getEthereumAddress, isHermezEthereumAddress, isHermezAccountIndex, isHermezBjjAddress,
  base64ToHexBJJ, getAySignFromBJJ
} from './addresses.js'
import { getAccount } from './api.js'
import { getProvider } from './providers.js'
import { TxType, TxState } from './enums.js'
import { INTERNAL_ACCOUNT_ETH_ADDR } from './constants.js'
import { hasLinkedTransaction, addLinkedTransaction } from './atomic-utils.js'

// Polyfill for Safari from: https://www.gitmemory.com/issue/tweag/asterius/792/851780352
// eslint-disable-next-line no-extend-native
DataView.prototype._setBigUint64 = DataView.prototype.setBigUint64
// eslint-disable-next-line no-extend-native
DataView.prototype.setBigUint64 = function (byteOffset, value, littleEndian) {
  if (typeof this._setBigUint64 !== 'undefined') {
    this._setBigUint64(byteOffset, value, littleEndian)
  } else {
    const wh = Number((value >> BigInt(32)) & BigInt(0xFFFFFFFF))
    const wl = Number((value) & BigInt(0xFFFFFFFF))
    const [h, l] = littleEndian ? [4, 0] : [0, 4]
    this.setUint32(byteOffset + h, wh, littleEndian)
    this.setUint32(byteOffset + l, wl, littleEndian)
  }
}

// 60 bits is the minimum bits to achieve enough precision among fee factor values < 192
// no shift value is applied for fee factor values >= 192
const bitsShiftPrecision = 60

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

  if (transaction.toBjj) {
    const bjjHex = base64ToHexBJJ(transaction.toBjj)
    const { ay, sign } = getAySignFromBJJ(bjjHex)
    encodedTransaction.toBjjSign = sign
    encodedTransaction.toBjjAy = ay
    encodedTransaction.toEthereumAddress = getEthereumAddress(INTERNAL_ACCOUNT_ETH_ADDR)
  }

  if (hasLinkedTransaction(transaction)) {
    const fieldsLinkedTx = {}
    fieldsLinkedTx.fromAccountIndex = getAccountIndex(transaction.requestFromAccountIndex)

    if (transaction.requestToAccountIndex) {
      fieldsLinkedTx.toAccountIndex = getAccountIndex(transaction.requestToAccountIndex)
    }

    if (transaction.requestToHezEthereumAddress) {
      fieldsLinkedTx.toEthereumAddress = getEthereumAddress(transaction.requestToHezEthereumAddress)
    }

    if (transaction.requestToBjj) {
      const bjjHex = base64ToHexBJJ(transaction.requestToBjj)
      const { ay, sign } = getAySignFromBJJ(bjjHex)
      fieldsLinkedTx.toBjjSign = sign
      fieldsLinkedTx.toBjjAy = ay
    }

    fieldsLinkedTx.tokenId = transaction.requestTokenId
    fieldsLinkedTx.amount = transaction.requestAmount
    fieldsLinkedTx.fee = transaction.requestFee
    fieldsLinkedTx.nonce = transaction.requestNonce

    encodedTransaction.rqTxCompressedDataV2 = buildTxCompressedDataV2(fieldsLinkedTx)
    encodedTransaction.rqToBjjAy = fieldsLinkedTx.toBjjAy
    encodedTransaction.rqToEthereumAddress = fieldsLinkedTx.toEthereumAddress
  }

  return encodedTransaction
}
/**
 * Generates the L1 Transaction Id based on the spec
 * TxID (32 bytes) for L1Tx is the Keccak256 (ethereum) hash of:
 * bytes:   | 1 byte |             32 bytes                |
 *                     SHA256(    8 bytes      |  2 bytes )
 * content: |  type  | SHA256([ToForgeL1TxsNum | Position ])
 * where type for L1UserTx is 0
 * @param {Number} toForgeL1TxsNum
 * @param {Number} currentPosition
 */
function getL1UserTxId (toForgeL1TxsNum, currentPosition) {
  const toForgeL1TxsNumBytes = new ArrayBuffer(8)
  const toForgeL1TxsNumView = new DataView(toForgeL1TxsNumBytes)
  toForgeL1TxsNumView.setBigUint64(0, BigInt(toForgeL1TxsNum), false)

  const positionBytes = new ArrayBuffer(8)
  const positionView = new DataView(positionBytes)
  positionView.setBigUint64(0, BigInt(currentPosition), false)

  const toForgeL1TxsNumHex = bufToHex(toForgeL1TxsNumView.buffer)
  const positionHex = bufToHex(positionView.buffer.slice(6, 8))

  const v = toForgeL1TxsNumHex + positionHex
  const h = keccak256('0x' + v).slice(2)

  return '0x00' + h
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
 * @param {BigInt} amount - The amount being transacted
 * @param {Number} nonce - Nonce of the transaction
 * @param {Number} fee - The fee of the transaction
 * @returns {String} Transaction Id
 */
function getL2TxId (fromIdx, tokenId, amount, nonce, fee) {
  const fromIdxBytes = new ArrayBuffer(8)
  const fromIdxView = new DataView(fromIdxBytes)
  fromIdxView.setBigUint64(0, BigInt(fromIdx), false)

  const tokenIdBytes = new ArrayBuffer(8)
  const tokenIdView = new DataView(tokenIdBytes)
  tokenIdView.setBigUint64(0, BigInt(tokenId), false)

  const amountF40 = HermezCompressedAmount.compressAmount(amount).value
  const amountBytes = new ArrayBuffer(8)
  const amountView = new DataView(amountBytes)
  amountView.setBigUint64(0, BigInt(amountF40), false)

  const nonceBytes = new ArrayBuffer(8)
  const nonceView = new DataView(nonceBytes)
  nonceView.setBigUint64(0, BigInt(nonce), false)

  const fromIdxHex = bufToHex(fromIdxView.buffer.slice(2, 8))
  const tokenIdHex = bufToHex(tokenIdView.buffer.slice(4, 8))
  const amountHex = bufToHex(amountView.buffer.slice(3, 8)) // float40: 5 bytes
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
 * @param {Scalar|String} fee - The fee in token value
 * @param {Scalar} amount - The amount of the transaction as a Scalar
 * @return {Number} feeIndex
 */
function getFeeIndex (fee, amount) {
  if (typeof fee === 'string') {
    fee = Scalar.fromString(fee)
  }
  if (Scalar.eq(fee, 0)) return 0

  let low = 0
  let mid
  let high = feeFactors.length - 1
  while (high - low > 1) {
    mid = Math.floor((low + high) / 2)
    if (Scalar.lt(getFeeValue(mid, amount), fee)) {
      low = mid
    } else {
      high = mid
    }
  }

  return high
}

/**
 * Compute fee in token value with an amount and a fee index
 * @param {Scalar} amount - The amount of the transaction as a Scalar
 * @param {Number} feeIndex - Fee selected among 0 - 255
 * @returns {Scalar} Resulting fee in token value
 */
function getFeeValue (feeIndex, amount) {
  if (feeIndex < 192) {
    const fee = Scalar.mul(amount, feeFactorsAsBigInts[feeIndex])
    return Scalar.shr(fee, bitsShiftPrecision)
  } else {
    return Scalar.mul(amount, feeFactorsAsBigInts[feeIndex])
  }
}

/**
 * Calculates the maximum amount that can be sent in an L2 tx
 * so the account doesn't attempt to send more than its balance
 * when the fee is applied
 * @param {Scalar} minimumFee - The fee in token value
 * @param {Scalar} amount - Amount in account balance
 * @returns {Scalar} - Max amount that can be sent
 */
function getMaxAmountFromMinimumFee (minimumFee, balance) {
  let maxAmount = Scalar.fromString(balance.toString())
  let bestRemainingAmount = Scalar.add(balance, Scalar.fromString(1))
  let isNotBestRemainingAmount = true
  let i = 0
  while (isNotBestRemainingAmount) {
    const feeIndex = getFeeIndex(minimumFee, maxAmount)
    const fee = getFeeValue(feeIndex, maxAmount)

    if (Scalar.geq(fee, maxAmount)) {
      maxAmount = Scalar.fromString(0)
      isNotBestRemainingAmount = false
      break
    }

    const amountAndFee = Scalar.add(maxAmount, fee)
    if (Scalar.gt(amountAndFee, balance)) {
      // Equation: maxAmount - (maxAmount + fee - balance)
      maxAmount = Scalar.sub(balance, fee)
    } else {
      const remainingAmount = Scalar.sub(balance, amountAndFee)
      if (Scalar.lt(remainingAmount, bestRemainingAmount)) {
        bestRemainingAmount = remainingAmount
      } else if (remainingAmount === bestRemainingAmount) {
        isNotBestRemainingAmount = false
        break
      }
      maxAmount = Scalar.add(maxAmount, remainingAmount)

      // If it doesn't converge in 100 iterations, return
      if (i === 100) {
        isNotBestRemainingAmount = false
      }
      i++
    }
  }
  return maxAmount
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
    } else if (isHermezBjjAddress(transaction.to)) {
      return TxType.TransferToBJJ
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
  res = Scalar.add(res, Scalar.shl(tx.tokenId || 0, 144)) // tokenID --> 32 bits
  res = Scalar.add(res, Scalar.shl(tx.nonce || 0, 176)) // nonce --> 40 bits
  res = Scalar.add(res, Scalar.shl(tx.fee || 0, 216)) // userFee --> 8 bits
  res = Scalar.add(res, Scalar.shl(tx.toBjjSign ? 1 : 0, 224)) // toBjjSign --> 1 bit

  return res
}

/**
 * Encode tx request compressed data
 * @param {Object} tx - Transaction object returned by `encodeTransaction`
 * @returns {Scalar} Encoded tx request compressed data
 */
function buildTxCompressedDataV2 (tx) {
  let res = Scalar.e(0)

  res = Scalar.add(res, tx.fromAccountIndex || 0) // fromIdx --> 48 bits
  res = Scalar.add(res, Scalar.shl(tx.toAccountIndex || 0, 48)) // toIdx --> 48 bits
  res = Scalar.add(res, Scalar.shl(HermezCompressedAmount.compressAmount(tx.amount || 0).value, 96)) // amount40 --> 40 bits
  res = Scalar.add(res, Scalar.shl(tx.tokenId || 0, 136)) // tokenID --> 32 bits
  res = Scalar.add(res, Scalar.shl(tx.nonce || 0, 168)) // nonce --> 40 bits
  res = Scalar.add(res, Scalar.shl(tx.fee || 0, 208)) // userFee --> 8 bits
  res = Scalar.add(res, Scalar.shl(tx.toBjjSign ? 1 : 0, 216)) // toBjjSign --> 1 bit

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
  res = Scalar.add(res, Scalar.shl(HermezCompressedAmount.compressAmount(tx.amount || 0).value, 160)) // amountF --> 40 bits
  res = Scalar.add(res, Scalar.shl(tx.maxNumBatch || 0, 200)) // maxNumBatch --> 32 bits

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
    Scalar.fromString(encodedTransaction.rqToEthereumAddress || '0', 16),
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
 * @param {Number} transaction.maxNumBatch - maximum allowed batch number when the transaction can be processed (optional)
 * @param {Object} transaction.linkedTransaction - Transaction to be linked in request fields. 'transaction' object returned by 'generateL2Transaction' (optional)
 * @param {String} bjj - The compressed BabyJubJub in hexadecimal format of the transaction sender
 * @param {Object} token - The token information object as returned from the Coordinator.
 * @return {Object} - Contains `transaction` and `encodedTransaction`. `transaction` is the object almost ready to be sent to the Coordinator. `encodedTransaction` is needed to sign the `transaction`
*/
async function generateL2Transaction (tx, bjj, token) {
  const transaction = await computeL2Transaction(tx, bjj, token)

  const encodedTransaction = await encodeTransaction(transaction)
  transaction.id = getL2TxId(
    encodedTransaction.fromAccountIndex,
    encodedTransaction.tokenId,
    encodedTransaction.amount,
    encodedTransaction.nonce,
    encodedTransaction.fee
  )

  return { transaction, encodedTransaction }
}

/**
 * Prepares a transaction to be ready to be sent to a Coordinator (without encodedTx)
 * @param {Object} transaction - ethAddress and babyPubKey together
 * @param {String} transaction.from - The account index that's sending the transaction e.g hez:DAI:4444
 * @param {String} transaction.to - The account index or Hermez address of the receiver e.g hez:DAI:2156. If it's an Exit, set to a falseable value
 * @param {HermezCompressedAmount} transaction.amount - The amount being sent as a HermezCompressedAmount
 * @param {Number} transaction.fee - The amount of tokens to be sent as a fee to the Coordinator
 * @param {Number} transaction.nonce - The current nonce of the sender's token account (optional)
 * @param {String} bjj - The compressed BabyJubJub in hexadecimal format of the transaction sender
 * @param {Object} token - The token information object as returned from the Coordinator.
 * @return {Object} - `transaction` is the object almost ready to be sent to the Coordinator
*/
async function computeL2Transaction (tx, bjj, token) {
  const type = tx.type || getTransactionType(tx)
  const toAccountIndex = type === TxType.Transfer ? tx.to : null
  const decompressedAmount = HermezCompressedAmount.decompressAmount(tx.amount)
  const feeInScalar = Scalar.fromString(getTokenAmountBigInt(tx.fee.toFixed(token.decimals), token.decimals).toString())

  let toHezEthereumAddress
  if (type === TxType.TransferToEthAddr) {
    toHezEthereumAddress = tx.to
  } else if (type === TxType.TransferToBJJ) {
    toHezEthereumAddress = (tx.toAuxEthAddr || INTERNAL_ACCOUNT_ETH_ADDR).toLowerCase()
  } else {
    toHezEthereumAddress = null
  }

  const transaction = {
    type: type,
    tokenId: token.id,
    fromAccountIndex: tx.from,
    toAccountIndex: type === TxType.Exit ? `hez:${token.symbol}:1` : toAccountIndex,
    toHezEthereumAddress: toHezEthereumAddress,
    toBjj: type === TxType.TransferToBJJ ? tx.to : null,
    // Corrects precision errors using the same system used in the Coordinator
    amount: decompressedAmount.toString(),
    fee: getFeeIndex(feeInScalar, decompressedAmount),
    nonce: await getNonce(tx.nonce, tx.from, bjj, token.id),
    requestFromAccountIndex: null,
    requestToAccountIndex: null,
    requestToHezEthereumAddress: null,
    requestToBjj: null,
    requestTokenId: null,
    requestAmount: null,
    requestFee: null,
    requestNonce: null,
    maxNumBatch: typeof tx.maxNumBatch === 'undefined' ? 0 : tx.maxNumBatch
  }

  return transaction
}

/**
 * Prepares an atomic transaction to be ready to be sent to a Coordinator.
 * @param {Object} transaction - Transaction to add linked transaction. 'transaction' object returned by 'generateL2Transaction'
 * @param {Object} txLink - Transaction to be linked in request fields. 'transaction' object returned by 'generateL2Transaction'
 * @return {Object} - Contains `transaction` and `encodedTransaction`. `transaction` is the object almost ready to be sent to the Coordinator. `encodedTransaction` is needed to sign the `transaction`
*/
async function generateAtomicTransaction (transaction, txLink) {
  addLinkedTransaction(transaction, txLink)

  const encodedTransaction = await encodeTransaction(transaction)
  transaction.id = getL2TxId(
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
  getL1UserTxId,
  getL2TxId,
  getFeeIndex,
  getFeeValue,
  getMaxAmountFromMinimumFee,
  getTransactionType,
  getNonce,
  buildTxCompressedData as _buildTxCompressedData,
  buildTransactionHashMessage,
  buildTxCompressedDataV2,
  generateL2Transaction,
  computeL2Transaction,
  generateAtomicTransaction,
  beautifyTransactionState
}

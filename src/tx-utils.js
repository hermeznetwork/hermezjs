const  BigInt      = require('big-integer')
const { Scalar }   = require( 'ffjavascript')
const { poseidon } = require('circomlib')
const ethers       = require('ethers')

const { feeFactors }          = require('./fee-factors')
const { bufToHex }            = require('./utils')
const { fix2Float }           = require('./float16')
const { getPoolTransactions } = require('./tx-pool')
const { getAccountIndex }     = require('./addresses')
const { getProvider }         = require('./providers')

/**
 * Encodes the transaction object to be in a format supported by the Smart Contracts and Circuits.
 * Used, for example, to sign the transaction
 *
 * @param {Object} transaction - Transaction object returned by generateL2Transaction
 *
 * @returns {Object} encodedTransaction
 */
async function encodeTransaction (transaction) {
  const encodedTransaction = Object.assign({}, transaction)

  const provider = getProvider()
  encodedTransaction.chainId = await provider.getNetwork().chainId

  encodedTransaction.fromAccountIndex = getAccountIndex(transaction.fromAccountIndex)
  encodedTransaction.toAccountIndex = getAccountIndex(transaction.toAccountIndex)

  return encodedTransaction
}

/**
 * TxID (12 bytes) for L2Tx is:
 * bytes:  |  1   |    6    |   5   |
 * values: | type | FromIdx | Nonce |
 * where type for L2Tx is '2'
 *
 * @param {Number} fromIdx
 * @param {Number} nonce
 *
 * @returns {String}
 */
function getTxId (fromIdx, nonce) {
  const fromIdxBytes = new ArrayBuffer(8)
  const fromIdxView = new DataView(fromIdxBytes)
  fromIdxView.setBigUint64(0, BigInt(fromIdx).value, false)

  const nonceBytes = new ArrayBuffer(8)
  const nonceView = new DataView(nonceBytes)
  nonceView.setBigUint64(0, BigInt(nonce).value, false)

  const fromIdxHex = bufToHex(fromIdxView.buffer.slice(2, 8))
  const nonceHex = bufToHex(nonceView.buffer.slice(3, 8))
  return '0x02' + fromIdxHex + nonceHex
}

/**
 * Calculates the appropriate fee factor depending on what's the fee as a percentage of the amount
 *
 * @param {Number} fee - The fee in token value
 * @param {String} amount - The amount as a BigInt string
 *
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
 *
 * @param {Object} transaction - Transaction object sent to generateL2Transaction
 *
 * @return {String} transactionType
 */
function getTransactionType (transaction) {
  if (transaction.to.includes('hez:')) {
    return 'Transfer'
  }
}

/**
 * Calculates the appropriate nonce based on the current token account nonce and existing transactions in the Pool.
 * It needs to find the lowest nonce available as transactions in the pool may fail and the Coordinator only forges
 * transactions in the order set by nonces.
 *
 * @param {Number} currentNonce - The current token account nonce
 * @param {String} bjj - The account's BabyJubJub
 * @param {Number} tokenId - The token id of the token in the transaction
 *
 * @return {Number} nonce
 */
async function getNonce (currentNonce, accountIndex, bjj, tokenId) {
  const poolTxs = await getPoolTransactions(accountIndex, bjj)
  const poolTxsNonces = poolTxs
    .filter(tx => tx.token.id === tokenId)
    .map(tx => tx.nonce)
    .sort()

  let nonce = currentNonce + 1
  while (poolTxsNonces.indexOf(nonce) !== -1) {
    nonce++
  }

  return nonce
}

/**
 * Encode tx compressed data
 * @param {Object} tx - Transaction object
 * @returns {Scalar} Encoded tx compressed data
 */
function buildTxCompressedData (tx) {
  const signatureConstant = Scalar.fromString('3322668559')
  let res = Scalar.e(0)

  res = Scalar.add(res, signatureConstant) // SignConst --> 32 bits
  res = Scalar.add(res, Scalar.shl(tx.chainId || 0, 32)) // chainId --> 16 bits
  res = Scalar.add(res, Scalar.shl(tx.fromAccountIndex || 0, 48)) // fromIdx --> 48 bits
  res = Scalar.add(res, Scalar.shl(tx.toAccountIndex || 0, 96)) // toIdx --> 48 bits
  res = Scalar.add(res, Scalar.shl(fix2Float(tx.amount || 0), 144)) // amounf16 --> 16 bits
  res = Scalar.add(res, Scalar.shl(tx.tokenId || 0, 160)) // tokenID --> 32 bits
  res = Scalar.add(res, Scalar.shl(tx.nonce || 0, 192)) // nonce --> 40 bits
  res = Scalar.add(res, Scalar.shl(tx.fee || 0, 232)) // userFee --> 8 bits
  res = Scalar.add(res, Scalar.shl(tx.toBjjSign ? 1 : 0, 240)) // toBjjSign --> 1 bit

  return res
}

/**
 * Builds the message to hash
 *
 * @param {Object} encodedTransaction - Transaction object
 *
 * @returns {Scalar} message to sign
 */
function buildTransactionHashMessage (encodedTransaction) {
  const txCompressedData = buildTxCompressedData(encodedTransaction)

  const h = poseidon([
    txCompressedData,
    Scalar.fromString(encodedTransaction.toEthAddr || '0', 16),
    Scalar.fromString(encodedTransaction.toBjjAy || '0', 16),
    Scalar.e(encodedTransaction.rqTxCompressedDataV2 || 0),
    Scalar.fromString(encodedTransaction.rqToEthAddr || '0', 16),
    Scalar.fromString(encodedTransaction.rqToBjjAy || '0', 16)
  ])

  return h
}

/**
 * Prepares a transaction to be ready to be sent to a Coordinator.
 *
 * @param {Object} transaction - ethAddress and babyPubKey together
 * @param {String} transaction.from - The account index that's sending the transaction e.g hez:DAI:4444
 * @param {String} transaction.to - The account index of the receiver e.g hez:DAI:2156
 * @param {String} transaction.amount - The amount being sent as a BigInt string
 * @param {Number} transaction.fee - The amount of tokens to be sent as a fee to the Coordinator
 * @param {Number} transaction.nonce - The current nonce of the sender's token account
 * @param {String} bJJ - The compressed BabyJubJub in hexadecimal format of the transaction sender
 * @param {Object} token - The token information object as returned from the Coordinator.
 *
 * @return {Object} - Contains `transaction` and `encodedTransaction`. `transaction` is the object almost ready to be sent to the Coordinator. `encodedTransaction` is needed to sign the `transaction`
*/
async function generateL2Transaction (tx, bjj, token) {
  const transaction = {
    type: getTransactionType(tx),
    tokenId: token.id,
    fromAccountIndex: tx.from,
    toAccountIndex: tx.to,
    toHezEthereumAddress: null,
    toBjj: null,
    amount: tx.amount.toString(),
    fee: getFee(tx.fee, tx.amount, token.decimals),
    nonce: await getNonce(tx.nonce, tx.from, bjj, token.id),
    requestFromAccountIndex: null,
    requestToAccountIndex: null,
    requestToHezEthereumAddress: null,
    requestToBJJ: null,
    requestTokenId: null,
    requestAmount: null,
    requestFee: null,
    requestNonce: null
  }

  const encodedTransaction = await encodeTransaction(transaction)
  transaction.id = getTxId(encodedTransaction.fromAccountIndex, encodedTransaction.nonce)
  // TODO: Remove once we have hermez-node
  transaction.id = '0x00000000000001e240004700'

  return { transaction, encodedTransaction }
}

module.exports = {
  getTxId,
  getFee,
  getNonce,
  getTransactionType,
  buildTransactionHashMessage,
  generateL2Transaction
}

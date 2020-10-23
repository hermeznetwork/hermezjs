import circomlib from 'circomlib'
import jsSha3 from 'js-sha3'

import * as eddsaBabyJub from './eddsa-babyjub.js'
import { buildTransactionHashMessage } from './tx-utils.js'
import { hashBuffer, hexToBuffer } from './utils.js'
import { getProvider } from './providers.js'
import { getHermezAddress } from './addresses.js'
import { METAMASK_MESSAGE } from './constants.js'

/**
 * @class
 * Manage Babyjubjub keys
 * Perform standard wallet actions
 */
class BabyJubWallet {
  /**
   * Initialize Babyjubjub wallet from private key
   * @param {Buffer} privateKey - 32 bytes buffer
   * @param {String} hermezEthereumAddress - Hexadecimal string containing the public Ethereum key from Metamask
   */
  constructor (privateKey, hermezEthereumAddress) {
    console.log(jsSha3)
    const priv = new eddsaBabyJub.PrivateKey(privateKey)
    const pub = priv.public()
    this.privateKey = privateKey
    this.publicKey = [pub.p[0].toString(), pub.p[1].toString()]
    this.publicKeyHex = [pub.p[0].toString(16), pub.p[1].toString(16)]
    this.publicKeyCompressed = pub.compress().toString()
    this.publicKeyCompressedHex = pub.compress().toString(16)
    this.hermezEthereumAddress = hermezEthereumAddress
  }

  /**
   * Signs message with private key
   * @param {String} messageStr - message to sign
   * @returns {String} - Babyjubjub signature packed and encoded as an hex string
   */
  signMessage (messageStr) {
    const messBuff = Buffer.from(messageStr)
    const messHash = hashBuffer(messBuff)
    const privKey = new eddsaBabyJub.PrivateKey(this.privateKey)
    const sig = privKey.signPoseidon(messHash)
    return sig.toString('hex')
  }

  /**
   * To sign transaction with babyjubjub keys
   * @param {Object} tx -transaction
   */
  signTransaction (transaction, encodedTransaction) {
    const hashMessage = buildTransactionHashMessage(encodedTransaction)
    const signature = circomlib.eddsa.signPoseidon(this.privateKey, hashMessage)
    const packedSignature = circomlib.eddsa.packSignature(signature)
    transaction.signature = packedSignature.toString('hex')
    return transaction
  }
}

/**
 * Verifies signature for a given message using babyjubjub
 * @param {String} publicKeyHex - Babyjubjub public key encoded as hex string
 * @param {String} messStr - clear message data
 * @param {String} signatureHex - Ecdsa signature compresed and encoded as hex string
 * @returns {boolean} True if validation is succesfull; otherwise false
 */
function verifyBabyJub (publicKeyHex, messStr, signatureHex) {
  const pkBuff = Buffer.from(publicKeyHex, 'hex')
  const pk = eddsaBabyJub.PublicKey.newFromCompressed(pkBuff)
  const msgBuff = Buffer.from(messStr)
  const hash = hashBuffer(msgBuff)
  const sigBuff = Buffer.from(signatureHex, 'hex')
  const sig = eddsaBabyJub.Signature.newFromCompressed(sigBuff)
  return pk.verifyPoseidon(hash, sig)
}

/**
 *
 * @param {*} AccountIndex
 */
async function createWalletFromEtherAccount (index) {
  const provider = getProvider()
  console.log(provider)
  const signer = provider.getSigner(index)
  const ethereumAddress = await signer.getAddress(index)
  const hermezEthereumAddress = getHermezAddress(ethereumAddress)
  const signature = await signer.signMessage(METAMASK_MESSAGE)
  const hashedSignature = jsSha3.keccak256(signature)
  const bufferSignature = hexToBuffer(hashedSignature)
  const hermezWallet = new BabyJubWallet(bufferSignature, hermezEthereumAddress)

  return { hermezWallet, hermezEthereumAddress }
}

export {
  BabyJubWallet,
  verifyBabyJub,
  createWalletFromEtherAccount
}

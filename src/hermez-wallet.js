import circomlib from 'circomlib'
import jsSha3 from 'js-sha3'
import { utils } from 'ffjavascript'

import { buildTransactionHashMessage } from './tx-utils.js'
import { hexToBuffer } from './utils.js'
import { getProvider } from './providers.js'
import { getHermezAddress } from './addresses.js'
import { METAMASK_MESSAGE } from './constants.js'

/**
 * @class
 * Manage Babyjubjub keys
 * Perform standard wallet actions
 */
class HermezWallet {
  /**
   * Initialize Babyjubjub wallet from private key
   * @param {buffer} privateKey - 32 bytes buffer
   * @param {string} hermezEthereumAddress - Hexadecimal string containing the public Ethereum key from Metamask
   */
  constructor (privateKey, hermezEthereumAddress) {
    if (privateKey.length !== 32) {
      throw new Error('buf must be 32 bytes')
    }

    const publicKey = circomlib.eddsa.prv2pub(privateKey)
    this.privateKey = privateKey
    this.publicKey = [publicKey[0].toString(), publicKey[1].toString()]
    this.publicKeyHex = [publicKey[0].toString(16), publicKey[1].toString(16)]

    const compressedPublicKey = utils.leBuff2int(circomlib.babyJub.packPoint(publicKey))
    this.publicKeyCompressed = compressedPublicKey.toString()
    this.publicKeyCompressedHex = compressedPublicKey.toString(16)
    this.hermezEthereumAddress = hermezEthereumAddress
  }

  /**
   * To sign transaction with babyjubjub keys
   * @param {object} transaction - Transaction object
   * @returns {object} The signed transaction object
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
 * Creates a BabyJubWallet from one of the Ethereum wallets in the provider
 * @param {number} accountIndex - Index of the Ethereum wallet in the provider
 * @returns {object} Contains the `hermezWallet` as a BabyJubWallet instance and the `hermezEthereumAddress`
 */
async function createWalletFromEtherAccount (accountIndex) {
  const provider = getProvider()
  const signer = provider.getSigner(accountIndex)
  const ethereumAddress = await signer.getAddress(accountIndex)
  const hermezEthereumAddress = getHermezAddress(ethereumAddress)
  const signature = await signer.signMessage(METAMASK_MESSAGE)
  const hashedSignature = jsSha3.keccak256(signature)
  const bufferSignature = hexToBuffer(hashedSignature)
  const hermezWallet = new BabyJubWallet(bufferSignature, hermezEthereumAddress)

  return { hermezWallet, hermezEthereumAddress }
}

export {
  HermezWallet,
  createWalletFromEtherAccount
}

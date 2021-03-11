import circomlib from 'circomlib'
import jsSha3 from 'js-sha3'
import { utils } from 'ffjavascript'
import { ethers } from 'ethers'

import { buildTransactionHashMessage } from './tx-utils.js'
import { hexToBuffer, getRandomBytes } from './utils.js'
import { getProvider } from './providers.js'
import { getHermezAddress, isHermezEthereumAddress, hexToBase64BJJ } from './addresses.js'
import { METAMASK_MESSAGE, CREATE_ACCOUNT_AUTH_MESSAGE, EIP_712_VERSION, EIP_712_PROVIDER, CONTRACT_ADDRESSES, ContractNames, INTERNAL_ACCOUNT_ETH_ADDR } from './constants.js'
import { getSigner } from './signers.js'

/**
 * @class
 * Manage Babyjubjub keys
 * Perform standard wallet actions like signing
 */
class HermezWallet {
  /**
   * Initialize Babyjubjub wallet from private key
   * @param {Buffer} privateKey - 32 bytes buffer
   * @param {String} hermezEthereumAddress - Hexadecimal string containing the public Ethereum key from Metamask
   */
  constructor (privateKey, hermezEthereumAddress) {
    if (privateKey.length !== 32) {
      throw new Error('Private key buffer must be 32 bytes')
    }

    if (!isHermezEthereumAddress(hermezEthereumAddress)) {
      throw new Error('Invalid Hermez Ethereum address')
    }

    const publicKey = circomlib.eddsa.prv2pub(privateKey)
    this.privateKey = privateKey
    this.publicKey = [publicKey[0].toString(), publicKey[1].toString()]
    this.publicKeyHex = [publicKey[0].toString(16), publicKey[1].toString(16)]

    const compressedPublicKey = utils.leBuff2int(circomlib.babyJub.packPoint(publicKey))
    this.publicKeyCompressed = compressedPublicKey.toString()
    this.publicKeyCompressedHex = ethers.utils.hexZeroPad(`0x${compressedPublicKey.toString(16)}`, 32).slice(2)
    this.publicKeyBase64 = hexToBase64BJJ(this.publicKeyCompressedHex)

    this.hermezEthereumAddress = hermezEthereumAddress
  }

  /**
   * To sign transaction with babyjubjub keys
   * @param {Object} transaction - Transaction object
   * @param {Object} encodedTransaction - Transaction encoded object
   * @returns {Object} The signed transaction object
   */
  signTransaction (transaction, encodedTransaction) {
    const hashMessage = buildTransactionHashMessage(encodedTransaction)
    const signature = circomlib.eddsa.signPoseidon(this.privateKey, hashMessage)
    const packedSignature = circomlib.eddsa.packSignature(signature)
    transaction.signature = packedSignature.toString('hex')
    return transaction
  }

  /**
   * Generates the signature necessary for /create-account-authorization endpoint
   * @param {String} providerUrl - Network url (i.e, http://localhost:8545). Optional
   * @param {Object} signerData - Signer data used to build a Signer to create the walet
   * @returns {String} The generated signature
   */
  async signCreateAccountAuthorization (providerUrl, signerData) {
    const provider = getProvider(providerUrl)
    const signer = getSigner(provider, signerData)
    const chainId = (await provider.getNetwork()).chainId
    const bJJ = this.publicKeyCompressedHex.startsWith('0x') ? this.publicKeyCompressedHex : `0x${this.publicKeyCompressedHex}`

    const domain = {
      name: EIP_712_PROVIDER,
      version: EIP_712_VERSION,
      chainId,
      verifyingContract: CONTRACT_ADDRESSES[ContractNames.Hermez]
    }
    const types = {
      Authorise: [
        { name: 'Provider', type: 'string' },
        { name: 'Authorisation', type: 'string' },
        { name: 'BJJKey', type: 'bytes32' }
      ]
    }
    const value = {
      Provider: EIP_712_PROVIDER,
      Authorisation: CREATE_ACCOUNT_AUTH_MESSAGE,
      BJJKey: bJJ
    }

    return signer._signTypedData(domain, types, value)
  }
}

/**
 * Creates a HermezWallet from one of the Ethereum wallets in the provider
 * @param {String} providerUrl - Network url (i.e, http://localhost:8545). Optional
 * @param {Object} signerData - Signer data used to build a Signer to create the walet
 * @returns {Object} Contains the `hermezWallet` as a HermezWallet instance and the `hermezEthereumAddress`
 */
async function createWalletFromEtherAccount (providerUrl, signerData) {
  const provider = getProvider(providerUrl)
  const signer = getSigner(provider, signerData)
  const ethereumAddress = await signer.getAddress()
  const hermezEthereumAddress = getHermezAddress(ethereumAddress)
  const signature = await signer.signMessage(METAMASK_MESSAGE)
  const hashedSignature = jsSha3.keccak256(signature)
  const bufferSignature = hexToBuffer(hashedSignature)
  const hermezWallet = new HermezWallet(bufferSignature, hermezEthereumAddress)

  return { hermezWallet, hermezEthereumAddress }
}

/**
 * Creates a HermezWallet from Babyjubjub private key
 * This creates a wallet for an internal account
 * An internal account has a Babyjubjub key and Ethereum account 0xFFFF...FFFF
 * Random wallet is created if no private key is provided
 * @param {Buffer} privateKey - 32 bytes buffer
 * @returns {Object} Contains the `hermezWallet` as a HermezWallet instance and the `hermezEthereumAddress`
 */
async function createWalletFromBjjPvtKey (privateKey) {
  const privateBjjKey = privateKey || Buffer.from(getRandomBytes(32))
  const hermezWallet = new HermezWallet(privateBjjKey, INTERNAL_ACCOUNT_ETH_ADDR)

  return { hermezWallet, hermezEthereumAddress: INTERNAL_ACCOUNT_ETH_ADDR }
}

export {
  HermezWallet,
  createWalletFromEtherAccount,
  createWalletFromBjjPvtKey
}

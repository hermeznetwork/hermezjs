import { ethers } from 'ethers'
import TrezorConnect from 'trezor-connect'

/**
 * Trezor hardware wallet signer
 */
export class TrezorSigner extends ethers.Signer {
  /**
   * Creates a TrezorSigner instance
   * @param {Object} provider - Ethers provider
   * @param {Object} options - Additional data to set up the signer, e.g. hw wallet path
   */
  constructor (provider, options) {
    super()
    this.provider = provider
    this.path = (options && options.path) ? options.path : ethers.utils.defaultPath
    this.address = options && options.address
    TrezorConnect.manifest(options && options.manifest)
  }

  /**
   * Returns the checksum address
   * @returns {Promise} - Promise of the checksum address
   */
  getAddress () {
    if (this.address) {
      return this.address
    }

    return TrezorConnect.ethereumGetAddress({ path: this.path })
      .then((result) => {
        if (!result.success) {
          console.error(result.payload.error)
        } else {
          return result.payload.address
        }
      })
  }

  /**
   * Returns the signed prefixed-message.
   * @param {Uint8[]|string} message - Message to sign in bytes[] or string
   * @returns {Promise} - Promise of the message signature
   */
  signMessage (message) {
    const messageBytes = typeof message === 'string'
      ? ethers.utils.toUtf8Bytes(message)
      : message
    const messageHex = ethers.utils.hexlify(messageBytes)

    return TrezorConnect.ethereumSignMessage({
      path: this.path,
      message: messageHex,
      hex: true
    }).then((result) => {
      if (!result.success) {
        console.error(result.payload.error)
      } else {
        return result.payload.signature
      }
    })
  }

  /**
   * Signs a transaction
   * @param {Object} transaction - Transaction to be signed
   * @returns {Promise} - Promise of the transaction signature
   */
  signTransaction (transactionData) {
    const transaction = {
      to: transactionData.to,
      value: transactionData.value.toHexString(),
      gasPrice: transactionData.gasPrice.toHexString(),
      gasLimit: transactionData.value.toHexString(),
      nonce: ethers.utils.hexlify(transactionData.nonce),
      data: transactionData.data,
      chainId: transactionData.chainId
    }

    return TrezorConnect.ethereumSignTransaction({ path: this.path, transaction })
      .then((result) => {
        if (!result.success) {
          console.error(result.payload.error)
        } else {
          const signature = {
            r: result.payload.r,
            s: result.payload.s,
            v: result.payload.v
          }

          return ethers.utils.serializeTransaction(transaction, signature)
        }
      })
  }

  /**
   * Returns a new instance of the Signer, connected to the provider.
   * @param {Object} provider - Ethers provider
   * @param {Object} options - Additional data to set up the signer, e.g. hw wallet path
   * @returns {Promise} - Promise of a new LedgerSigner instance
   */
  static connect (provider, options) {
    return new TrezorSigner(provider, options)
  }
}

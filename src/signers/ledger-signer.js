import TransportWebUSB from '@ledgerhq/hw-transport-webusb'
import Eth from '@ledgerhq/hw-app-eth'
import { ethers } from 'ethers'

/**
 * Ledger hardware wallet signer
 */
export class LedgerSigner extends ethers.Signer {
  /**
   * Creates a LedgerSigner instance
   * @param {Object} transport - Ledger transport
   * @param {Object} provider - Ethers provider
   * @param {Object} options - Additional data to set up the signer, e.g. hw wallet path
   */
  constructor (transport, provider, options) {
    super()
    this.eth = new Eth(transport)
    this.provider = provider
    this.path = (options && options.path)
      ? options.path
      : ethers.utils.defaultPath
  }

  /**
   * Returns the checksum address
   * @returns {Promise} - Promise of the checksum address
   */
  getAddress () {
    return this.eth.getAddress(this.path)
      .then(({ address }) => address)
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

    return this.eth.signPersonalMessage(this.path, messageHex.slice(2))
      .then((result) => {
        const hexV = (result.v - 27).toString(16)
        const fixedHexV = hexV.length < 2 ? `0${hexV}` : hexV
        const signature = `0x${result.r}${result.s}${fixedHexV}`

        return signature
      })
  }

  /**
   * Signs a transaction
   * @param {Object} transaction - Transaction to be signed
   * @returns {Promise} - Promise of the transaction signature
   */
  signTransaction (transaction) {
    return ethers.utils.resolveProperties()
      .then((tx) => {
        const unsignedTx = ethers.utils.serializeTransaction(tx).substr(2)

        return this.eth.signTransaction(this.path, unsignedTx)
          .then(({ r, s, v }) => {
            const signature = { r: `0x${r}`, s: `0x${s}`, v }

            return ethers.utils.serializeTransaction(tx, signature)
          })
      })
  }

  /**
   * Returns a new instance of the Signer, connected to the provider.
   * @param {Object} provider - Ethers provider
   * @param {Object} options - Additional data to set up the signer, e.g. hw wallet path
   * @returns {Promise} - Promise of a new LedgerSigner instance
   */
  static connect (provider, options) {
    return TransportWebUSB.create()
      .then((transport) => new LedgerSigner(transport, provider, options))
  }
}

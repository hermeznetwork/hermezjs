import circomlib from 'circomlib'
import { utils, Scalar } from 'ffjavascript'

import { HermezWallet, createWalletFromEtherAccount } from '../src/hermez-wallet.js'
import { isHermezEthereumAddress } from '../src/addresses.js'

describe('HermezWallet', () => {
  const hermezEthereumAddress = 'hez:0x4294cE558F2Eb6ca4C3191AeD502cF0c625AE995'
  const hermezEthereumAddressError = '0x4294cE558F2Eb6ca4C3191AeD502cF0c625AE995'
  const privateKey = Buffer.from([10, 147, 192, 202, 232, 207, 65, 134, 114, 147, 167, 10, 140, 18, 111, 145, 163, 133, 85, 250, 191, 58, 146, 129, 0, 79, 4, 238, 153, 79, 151, 219])
  const privateKeyError = Buffer.from([10, 147, 192, 202, 232, 207, 65, 134, 114, 147, 167, 10, 140, 18, 111, 145, 163, 133, 85, 250, 191, 58, 146, 129, 0, 79, 4, 238, 153, 79, 151])
  const wallet = new HermezWallet(privateKey, hermezEthereumAddress)

  describe('#constructor', () => {
    test.skip('accepts valid private key', () => {
      expect(wallet.privateKey).toBe(privateKey)
    })

    test.skip('fails with invalid private key', () => {
      try {
        new HermezWallet(privateKeyError, hermezEthereumAddress) // eslint-disable-line no-new
      } catch (error) {
        expect(error.message).toBe('Private key buffer must be 32 bytes')
      }
    })

    test.skip('fails with invalid Hermez Ethereum address', () => {
      try {
        new HermezWallet(privateKey, hermezEthereumAddressError) // eslint-disable-line no-new
      } catch (error) {
        expect(error.message).toBe('Invalid Hermez Ethereum address')
      }
    })

    test.skip('set up public key', () => {
      const publicKeyBuffer = utils.leInt2Buff(Scalar.fromString(wallet.publicKeyCompressedHex, 16))
      const point = circomlib.babyJub.unpackPoint(publicKeyBuffer)

      expect(point[0].toString()).toBe(wallet.publicKey[0])
      expect(point[1].toString()).toBe(wallet.publicKey[1])

      expect(point[0].toString(16)).toBe(wallet.publicKeyHex[0])
      expect(point[1].toString(16)).toBe(wallet.publicKeyHex[1])
    })
  })

  test.skip('#signtransaction', () => {
    const tx = {
      amount: '2340000000',
      fee: 235,
      fromAccountIndex: 'hez:SCC:256',
      id: '0x00000000000001e240004700',
      nonce: 1,
      requestAmount: null,
      requestFee: null,
      requestFromAccountIndex: null,
      requestNonce: null,
      requestToAccountIndex: null,
      requestToBJJ: null,
      requestToHezEthereumAddress: null,
      requestTokenId: null,
      toAccountIndex: 'hez:SCC:256',
      toBjj: null,
      toHezEthereumAddress: null,
      tokenId: 6,
      type: 'Transfer'
    }

    const encodedTx = {
      amount: '2340000000',
      chainId: 3,
      fee: 235,
      fromAccountIndex: 256,
      nonce: 1,
      requestAmount: null,
      requestFee: null,
      requestFromAccountIndex: null,
      requestNonce: null,
      requestToAccountIndex: null,
      requestToBJJ: null,
      requestToHezEthereumAddress: null,
      requestTokenId: null,
      toAccountIndex: 256,
      toBjj: null,
      toHezEthereumAddress: null,
      tokenId: 6,
      type: 'Transfer'
    }

    const signedTransaction = wallet.signTransaction(tx, encodedTx)
    expect(signedTransaction.signature.length).toBe(128)
  })

  test('#signCreateAccountAuthorization', async () => {
    const signature = await wallet.signCreateAccountAuthorization('http://localhost:8545')
    expect(signature).toBe('0x688389b045ca0940c2dde5e02a01d0aedf652dd8f7c13eaa7218854c60e9b680381befe0a65ed83bca9932c49a6ebe30ae5d65f9a3d9d40254b7ea9e2b8a11901c')
  })
})

test.skip('#createWalletFromEtherAccount', async () => {
  const { hermezWallet, hermezEthereumAddress } = await createWalletFromEtherAccount('http://localhost:8545')
  expect(hermezWallet).toBeInstanceOf(HermezWallet)
  expect(isHermezEthereumAddress(hermezEthereumAddress)).toBe(true)
})

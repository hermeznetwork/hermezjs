import circomlib from 'circomlib'
import { utils, Scalar } from 'ffjavascript'

import { HermezWallet, createWalletFromEtherAccount, createWalletFromBjjPvtKey } from '../../src/hermez-wallet.js'
import { isHermezEthereumAddress } from '../../src/addresses.js'
import { INTERNAL_ACCOUNT_ETH_ADDR } from '../../src/constants'

describe('HermezWallet', () => {
  const hermezEthereumAddress = 'hez:0x4294cE558F2Eb6ca4C3191AeD502cF0c625AE995'
  const hermezEthereumAddressError = '0x4294cE558F2Eb6ca4C3191AeD502cF0c625AE995'
  const privateKey = Buffer.from([10, 147, 192, 202, 232, 207, 65, 134, 114, 147, 167, 10, 140, 18, 111, 145, 163, 133, 85, 250, 191, 58, 146, 129, 0, 79, 4, 238, 153, 79, 151, 219])
  const privateKeyError = Buffer.from([10, 147, 192, 202, 232, 207, 65, 134, 114, 147, 167, 10, 140, 18, 111, 145, 163, 133, 85, 250, 191, 58, 146, 129, 0, 79, 4, 238, 153, 79, 151])
  const wallet = new HermezWallet(privateKey, hermezEthereumAddress)

  describe('#constructor', () => {
    test('accepts valid private key', () => {
      expect(wallet.privateKey).toBe(privateKey)
    })

    test('fails with invalid private key', () => {
      try {
        new HermezWallet(privateKeyError, hermezEthereumAddress) // eslint-disable-line no-new
      } catch (error) {
        expect(error.message).toBe('Private key buffer must be 32 bytes')
      }
    })

    test('fails with invalid Hermez Ethereum address', () => {
      try {
        new HermezWallet(privateKey, hermezEthereumAddressError) // eslint-disable-line no-new
      } catch (error) {
        expect(error.message).toBe('Invalid Hermez Ethereum address')
      }
    })

    test('set up public key', () => {
      const publicKeyBuffer = utils.leInt2Buff(Scalar.fromString(wallet.publicKeyCompressedHex, 16))
      const point = circomlib.babyJub.unpackPoint(publicKeyBuffer)

      expect(point[0].toString()).toBe(wallet.publicKey[0])
      expect(point[1].toString()).toBe(wallet.publicKey[1])

      expect(point[0].toString(16)).toBe(wallet.publicKeyHex[0])
      expect(point[1].toString(16)).toBe(wallet.publicKeyHex[1])
    })
  })

  test('#signtransaction', () => {
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
    const expectedSignature = '0x05800968d7d6ffa8368ac363f62ae00213479591e84b7ed07ccbfd40de84cb0d0bb7130748f4d3150d77f1848e1372b84113ba3955a9cefe1bb26b773986d4191b'
    const privateKeyEth = '0x0000000000000000000000000000000000000000000000000000000000000001'

    const signer = { type: 'WALLET', privateKey: privateKeyEth }
    const hermezWallet = (await createWalletFromEtherAccount('http://localhost:8545', signer)).hermezWallet

    const signature = await hermezWallet.signCreateAccountAuthorization('http://localhost:8545', signer)
    expect(signature).toEqual(expectedSignature)
  })

  test('#createWalletFromBjjPvtKey', async () => {
    const { hermezWallet, hermezEthereumAddress } = await createWalletFromBjjPvtKey(privateKey)
    expect(hermezWallet).toBeInstanceOf(HermezWallet)
    expect(isHermezEthereumAddress(hermezEthereumAddress)).toBe(true)
    expect(hermezEthereumAddress).toBe(INTERNAL_ACCOUNT_ETH_ADDR)
  })

  test('#createWalletFromBjjPvtKey random private', async () => {
    const { hermezWallet, hermezEthereumAddress } = await createWalletFromBjjPvtKey()
    expect(hermezWallet).toBeInstanceOf(HermezWallet)
    expect(isHermezEthereumAddress(hermezEthereumAddress)).toBe(true)
    expect(hermezEthereumAddress).toBe(INTERNAL_ACCOUNT_ETH_ADDR)
  })

  test('#createWalletFromEtherAccount', async () => {
    const expectedPvtBjj = '6d59205d6117b7185adda0456dd5c018651e98747f9b0754d97f2666313885f6'
    const privateKeyEth = '0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef'

    const signer = { type: 'WALLET', privateKey: privateKeyEth }

    const { hermezWallet, hermezEthereumAddress } = await createWalletFromEtherAccount('http://localhost:8545', signer)
    expect(hermezWallet).toBeInstanceOf(HermezWallet)
    expect(isHermezEthereumAddress(hermezEthereumAddress)).toBe(true)
    expect(hermezWallet.privateKey.toString('hex')).toBe(expectedPvtBjj)
  })
})

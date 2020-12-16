import { LedgerSigner } from './signers/ledger-signer'
import { TrezorSigner } from './signers/trezor-signer'

/**
 * Represents the different types of signers that can be built.
 */
const SignerType = {
  JSON_RPC: 'JSON-RPC',
  LEDGER: 'LEDGER',
  TREZOR: 'TREZOR'
}

/**
 * Builds an ethers Signer.
 * @param {Provider} provider - Ethers provider
 * @param {Object} signerData - Data required to build a signer
 */
const getSigner = (provider, signerData) => {
  switch (signerData.type) {
    case SignerType.JSON_RPC: {
      return provider.getSigner(signerData.addressOrIndex)
    }
    case SignerType.LEDGER: {
      return LedgerSigner.connect(provider, { path: signerData.path })
    }
    case SignerType.TREZOR: {
      return TrezorSigner.connect(provider, { path: signerData.path })
    }
  }
}

export {
  SignerType,
  getSigner
}

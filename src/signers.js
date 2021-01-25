import { ethers } from 'ethers'

import { LedgerSigner } from './signers/ledger-signer.js'
import { TrezorSigner } from './signers/trezor-signer.js'

/**
 * Represents the different types of signers that can be built.
 */
const SignerType = {
  JSON_RPC: 'JSON-RPC',
  LEDGER: 'LEDGER',
  TREZOR: 'TREZOR',
  WALLET: 'WALLET'
}

/**
 * Builds an ethers Signer.
 * @param {Provider} provider - Ethers provider
 * @param {Object} signerData - Data required to build a signer
 */
const getSigner = (provider, signerData) => {
  if (!signerData) {
    return provider.getSigner()
  }

  switch (signerData.type) {
    case SignerType.LEDGER: {
      return LedgerSigner.connect(provider, { path: signerData.path })
    }
    case SignerType.TREZOR: {
      return TrezorSigner.connect(
        provider,
        {
          manifest: signerData.manifest,
          path: signerData.path,
          address: signerData.address
        }
      )
    }
    case SignerType.JSON_RPC: {
      return provider.getSigner(signerData.addressOrIndex)
    }
    case SignerType.WALLET: {
      return new ethers.Wallet(signerData.privateKey, provider)
    }
    default: {
      return provider.getSigner()
    }
  }
}

export {
  SignerType,
  getSigner
}

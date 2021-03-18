import { Scalar } from 'ffjavascript'

import { WITHDRAWAL_CIRCUIT_NLEVELS } from './constants.js'
import { getEthereumAddress, getAccountIndex, base64ToHexBJJ, getAySignFromBJJ } from './addresses.js'

/**
 * Compute zk inputs from api exit response
 * @param {Object} exitInfo - exit object as it is returned by hermez-node API
 * @returns {Object} inputs ready to compute the witness
 */
async function buildZkInputWithdraw (exitInfo) {
  const bjjHex = base64ToHexBJJ(exitInfo.bjj)
  const { ay, sign } = getAySignFromBJJ(bjjHex)

  const zkInputWithdrawal = {}

  zkInputWithdrawal.rootExit = Scalar.fromString(exitInfo.merkleProof.root)
  zkInputWithdrawal.ethAddr = Scalar.fromString(getEthereumAddress(exitInfo.hezEthereumAddress), 16)
  zkInputWithdrawal.tokenID = Scalar.e(exitInfo.token.id)
  zkInputWithdrawal.balance = Scalar.fromString(exitInfo.balance)
  zkInputWithdrawal.idx = Scalar.e(getAccountIndex(exitInfo.accountIndex))
  zkInputWithdrawal.sign = Scalar.e(sign)
  zkInputWithdrawal.ay = Scalar.fromString(ay, 16)
  const siblings = exitInfo.merkleProof.siblings
  while (siblings.length < (WITHDRAWAL_CIRCUIT_NLEVELS + 1)) siblings.push(Scalar.e(0))
  zkInputWithdrawal.siblingsState = siblings

  return zkInputWithdrawal
}

/**
 * Build zkProof valid for the verifier contract
 * @param {Object} proofSnarkjs - Proof received from snarkjs package
 * @returns {Object} - zkProof ready for contract parameter
 */
async function buildProofContract (proofSnarkjs) {
  const proofContract = {}

  proofContract.proofA = [
    proofSnarkjs.pi_a[0],
    proofSnarkjs.pi_a[1]
  ]

  proofContract.proofB = [
    [
      proofSnarkjs.pi_b[0][1],
      proofSnarkjs.pi_b[0][0]
    ],
    [
      proofSnarkjs.pi_b[1][1],
      proofSnarkjs.pi_b[1][0]
    ]
  ]

  proofContract.proofC = [
    proofSnarkjs.pi_c[0],
    proofSnarkjs.pi_c[1]
  ]

  return proofContract
}

export {
  buildZkInputWithdraw,
  buildProofContract
}

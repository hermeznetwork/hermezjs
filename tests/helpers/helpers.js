import { txUtils, RollupDB } from '@hermeznetwork/commonjs'
import circomlib from 'circomlib'
import testHelpers from '@openzeppelin/test-helpers'

import { getProvider } from '../../src/providers.js'
import { contractAddresses } from '../../src/constants.js'
import { getContract } from '../../src/contracts.js'
import HermezABI from '../../src/abis/HermezABI.js'

export async function forgeBatch (providerUrl = 'http://localhost:8545', maxTx = 512, maxL1Tx = 256, nLevels = 32) {
  const provider = getProvider(providerUrl)
  const chainId = (await provider.getNetwork()).chainId
  const rollupDB = await RollupDB(new circomlib.SMTMemDB(), chainId)
  const buidlerHermez = getContract(contractAddresses.Hermez, HermezABI, providerUrl)

  // sync previous l1 tx
  const currentQueue = await buidlerHermez.nextL1ToForgeQueue()
  for (let i = 0; i < currentQueue; i++) {
    const bb = await rollupDB.buildBatch(maxTx, nLevels, maxL1Tx)

    // filter L1UserTxEvent for queueIndex
    const filter = buidlerHermez.filters.L1UserTxEvent(i, null, null)
    const events = await buidlerHermez.queryFilter(filter, 0, 'latest')
    events.forEach((e) => {
      bb.addTx(txUtils.decodeL1Tx(e.args.l1UserTx))
    })
    await bb.build()
    await rollupDB.consolidate(bb)
  }

  // build current batch with current L1Tx queue
  const bbCurrent = await rollupDB.buildBatch(maxTx, nLevels, maxL1Tx)
  const l1TxForged = []
  const l1TxBytes = 72
  let SCL1TxData = await buidlerHermez.mapL1TxQueue(currentQueue)
  SCL1TxData = SCL1TxData.slice(2)
  // 1 byte, 2 characters in hex String
  const l1TxLen = SCL1TxData.length / (l1TxBytes * 2)
  for (let i = 0; i < l1TxLen; i++) {
    const lastChar = i * l1TxBytes * 2
    const currentHexChar = (i + 1) * l1TxBytes * 2
    const currenTx = SCL1TxData.slice(lastChar, currentHexChar)
    const decodedTx = txUtils.decodeL1Tx(currenTx)
    l1TxForged.push(decodedTx)
    bbCurrent.addTx(decodedTx)
  }

  await bbCurrent.build()

  const stringL1CoordinatorTx = ''

  const proofA = ['0', '0']
  const proofB = [
    ['0', '0'],
    ['0', '0']
  ]
  const proofC = ['0', '0']

  const newLastIdx = bbCurrent.getNewLastIdx()
  const newStateRoot = bbCurrent.getNewStateRoot()
  const newExitRoot = bbCurrent.getNewExitRoot()
  const compressedL1CoordinatorTx = `0x${stringL1CoordinatorTx}`
  const L2TxsData = bbCurrent.getL2TxsDataSM()
  const feeIdxCoordinator = bbCurrent.getFeeTxsDataSM()
  const verifierIdx = 0
  const l1Batch = true

  await buidlerHermez.forgeBatch(
    newLastIdx,
    newStateRoot,
    newExitRoot,
    compressedL1CoordinatorTx,
    L2TxsData,
    feeIdxCoordinator,
    verifierIdx,
    l1Batch,
    proofA,
    proofB,
    proofC
  )

  await rollupDB.consolidate(bbCurrent)

  const batchForged = rollupDB.lastBatch
  const exits = []
  for (let i = 0; i < l1TxForged.length; i++) {
    if (l1TxForged[i].toIdx === 1) {
      const exitInfo = await rollupDB.getExitTreeInfo(l1TxForged[i].fromIdx, batchForged)
      exits.push({ siblings: exitInfo.siblings })
    }
  }

  return {
    batchForged,
    exits
  }
}

export async function advanceTime () {
  await testHelpers.time.increase(60)
}

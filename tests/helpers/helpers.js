import testHelpers from '@openzeppelin/test-helpers'

import * as CoordinatorAPI from '../../src/api.js'

/**
 * Wait a specific number of batches to be forged
 * @param {Number} nBatches
 */
export async function waitNBatches (nBatches) {
  let lastBatch = (await CoordinatorAPI.getState()).network.lastBatch
  while (true) {
    let currentBatch = (await CoordinatorAPI.getState()).network.lastBatch
    if (lastBatch !== null &&
        currentBatch !== null &&
        currentBatch.batchNum - lastBatch.batchNum >= nBatches) {
      return currentBatch.batchNum
    }
    if (lastBatch === null) {
      lastBatch = (await CoordinatorAPI.getState()).network.lastBatch
      currentBatch = lastBatch
    }
    if (currentBatch === null) {
      currentBatch = (await CoordinatorAPI.getState()).network.lastBatch
    }
    await sleep(2000)
  }
}

/**
 * Wait timeout
 * @param {Number} timeout
 */
async function sleep (timeout) {
  await new Promise(resolve => setTimeout(resolve, timeout))
}

/**
 * Skips time in the local blockchain
 * @returns {Promise}
 */
export async function advanceTime () {
  await testHelpers.time.increase(60 * 61)
}

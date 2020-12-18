import hermez from '../../src/index.js'

/**
 * wait a specific number of batches to be forged
 * @param {Number} nBatches
 */
async function waitNBatches (nBatches) {
  var lastBatch = (await hermez.CoordinatorAPI.getState()).network.lastBatch
  while (true) {
    var currentBatch = (await hermez.CoordinatorAPI.getState()).network.lastBatch
    if (lastBatch != null &&
        currentBatch != null &&
      currentBatch.batchNum - lastBatch.batchNum > nBatches) {
      break
    }
    if (lastBatch == null) {
      lastBatch = (await hermez.CoordinatorAPI.getState()).network.lastBatch
      currentBatch = lastBatch
    }
    if (currentBatch == null) {
      currentBatch = (await hermez.CoordinatorAPI.getState()).network.lastBatch
    }
    await sleep(2000)
  }
}

/**
 * wait timeout
 * @param {Number} timeout
 */
async function sleep (timeout) {
  await new Promise(resolve => setTimeout(resolve, timeout))
}

export {
  waitNBatches,
  sleep
}

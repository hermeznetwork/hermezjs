import hermez from '../../src/index.js'

/**
 * wait a specific number of batches to be forged
 * @param {number} nBatches
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
 * @param {number} timeout
 */
async function sleep (timeout) {
  await new Promise(resolve => setTimeout(resolve, timeout))
}

/**
 * Converts BigInt balance to string standard form. Issue exists whenre number > 1e22 it is represented
 * in scientific notation
 * @param {string} balanceBigInt - String representing a large number as a BigInt
 * @returns {string}
*/
function balanceToString (balanceBigInt) {
  return (balanceBigInt).toLocaleString('fullwide', { userGrouping: false }).replace(/,/g, '')
}

export {
  waitNBatches,
  sleep,
  balanceToString
}

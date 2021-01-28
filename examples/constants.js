const hermez = require('../dist/node/index.js')

const EXAMPLES_WEB3_URL = 'http://localhost:8545'
const EXAMPLES_HERMEZ_API_URL = 'http://localhost:8086'
const EXAMPLES_HERMEZ_ROLLUP_ADDRESS = '0x10465b16615ae36F350268eb951d7B0187141D3B'
const EXAMPLES_HERMEZ_WDELAYER_ADDRESS = '0x8EEaea23686c319133a7cC110b840d1591d9AeE0'
const EXAMPLES_PRIVATE_KEY1 = '451c81d2f92dc77ca53fad01d225becc169f3c3480c7f0fdcc77b6c86f342e03'
const EXAMPLES_PRIVATE_KEY2 = '0a3d30ae8b52b30669c9fc7e46eb2d37bec5027087b96130ec5b8564b64e46a8'

function configureEnvironment () {
  // Initializes Tx Pool
  hermez.TxPool.initializeTransactionPool()
  // load ethereum network provider
  hermez.Providers.setProvider(EXAMPLES_WEB3_URL)

  // set environment
  hermez.Environment.setEnvironment({
    baseApiUrl: EXAMPLES_HERMEZ_API_URL,
    contractAddresses: {
      [hermez.Constants.ContractNames.Hermez]: EXAMPLES_HERMEZ_ROLLUP_ADDRESS,
      [hermez.Constants.ContractNames.WithdrawalDelayer]: EXAMPLES_HERMEZ_WDELAYER_ADDRESS
    }
  })
}

module.exports = {
  EXAMPLES_WEB3_URL,
  EXAMPLES_HERMEZ_API_URL,
  EXAMPLES_PRIVATE_KEY1,
  EXAMPLES_PRIVATE_KEY2,
  configureEnvironment
}

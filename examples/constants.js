const hermez = require('../dist/node/index.js')

const EXAMPLES_WEB3_URL = ''
const EXAMPLES_HERMEZ_API_URL = ''
const EXAMPLES_HERMEZ_ROLLUP_ADDRESS = ''
const EXAMPLES_HERMEZ_WDELAYER_ADDRESS = ''
const EXAMPLES_PRIVATE_KEY1 = ''
const EXAMPLES_PRIVATE_KEY2 = ''

function configureEnvironment () {
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

const hermez = require('../dist/node/index.js')

const EXAMPLES_WEB3_URL = 'http://internal-global-private-elb-236792464.eu-west-1.elb.amazonaws.com:8545'
const EXAMPLES_HERMEZ_API_URL = 'http://localhost:8086'
const EXAMPLES_HERMEZ_ROLLUP_ADDRESS = 'ADD CONTRACT ADDRESS HERE'
const EXAMPLES_HERMEZ_WDELAYER_ADDRESS = 'ADD CONTRACT ADDRESS HERE'

function configureEnvironment () {
  // load ethereum network provider
  hermez.Providers.setProvider(EXAMPLES_WEB3_URL)
  // set API URL
  hermez.CoordinatorAPI.setBaseApiUrl(EXAMPLES_HERMEZ_API_URL)

  // set Contract Addresses
  hermez.Constants._setContractAddress(hermez.Constants.ContractNames.Hermez, EXAMPLES_HERMEZ_ROLLUP_ADDRESS)
  hermez.Constants._setContractAddress(hermez.Constants.ContractNames.WithdrawalDelayer, EXAMPLES_HERMEZ_WDELAYER_ADDRESS)
}

module.exports = {
  EXAMPLES_WEB3_URL,
  EXAMPLES_HERMEZ_API_URL,
  configureEnvironment
}

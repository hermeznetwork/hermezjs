import { getBaseApiUrl } from '../../src/api'
import { ContractNames, CONTRACT_ADDRESSES } from '../../src/constants'
import { setEnvironment, getBatchExplorerUrl, isEnvironmentSupported, getSupportedEnvironments } from '../../src/environment'

test('#getSupportedEnvironments', () => {
  const supportedEnvironments = getSupportedEnvironments()

  expect(supportedEnvironments).toHaveLength(3)
  expect(supportedEnvironments).toContainEqual({ name: 'Mainnet', chainId: 1 })
  expect(supportedEnvironments).toContainEqual({ name: 'Rinkeby', chainId: 4 })
  expect(supportedEnvironments).toContainEqual({ name: 'Localhost', chainId: 1337 })
})

test('#isEnvironmentSupported', () => {
  expect(isEnvironmentSupported(4)).toBe(true)
  expect(isEnvironmentSupported(1337)).toBe(true)
  expect(isEnvironmentSupported(1)).toBe(true)
})

test('#setEnvironment', () => {
  const hermezContractAddress = '0x98d51Ce36C2769176f443D1b967d42A7Bea4hR8f'
  const withdrawalDelayerContractAddress = '0x98d51Ce36C2769176f443D1b967d42A7Bea12jE9'
  const batchExplorerUrl = 'http://localhost:1234'
  const baseApiUrl = 'http://localhost:9999'

  setEnvironment({
    baseApiUrl,
    contractAddresses: {
      [ContractNames.Hermez]: hermezContractAddress,
      [ContractNames.WithdrawalDelayer]: withdrawalDelayerContractAddress
    },
    batchExplorerUrl
  })

  expect(getBaseApiUrl()).toBe(baseApiUrl)
  expect(CONTRACT_ADDRESSES[ContractNames.Hermez]).toBe(hermezContractAddress)
  expect(CONTRACT_ADDRESSES[ContractNames.WithdrawalDelayer]).toBe(withdrawalDelayerContractAddress)
  expect(getBatchExplorerUrl()).toBe(batchExplorerUrl)
})

import * as addresses from '../src/addresses.js'

const ethereumAddress = '0x4294cE558F2Eb6ca4C3191AeD502cF0c625AE995'
const hermezEthereumAddress = 'hez:0x4294cE558F2Eb6ca4C3191AeD502cF0c625AE995'
const hermezBjjAddress = 'hez:m9UXbJElX5OzHMM0IxgD3Qzhx2RJw18o-tiw8s1lnwx4'
const hermezAccountIndex = 'hez:TKN:256'
const accountIndex = 256

test('#getHermezAddress', () => {
  expect(addresses.getHermezAddress(ethereumAddress)).toBe(hermezEthereumAddress)
})

test('#getEthereumAddress', () => {
  expect(addresses.getEthereumAddress(hermezEthereumAddress)).toBe(ethereumAddress)
})

test('#isHermezEthereumAddress', () => {
  expect(addresses.isHermezEthereumAddress(hermezEthereumAddress)).toBe(true)
  expect(addresses.isHermezEthereumAddress(ethereumAddress)).toBe(false)
})

test('#isHermezBjjAddress', () => {
  expect(addresses.isHermezBjjAddress(hermezBjjAddress)).toBe(true)
  expect(addresses.isHermezBjjAddress(hermezEthereumAddress)).toBe(false)
})

test('#getAccountIndex', () => {
  expect(addresses.getAccountIndex(hermezAccountIndex)).toBe(accountIndex)
})

import * as addresses from '../../src/addresses.js'

const ethereumAddress = '0x4294cE558F2Eb6ca4C3191AeD502cF0c625AE995'
const hermezEthereumAddress = 'hez:0x4294cE558F2Eb6ca4C3191AeD502cF0c625AE995'
const hermezHexBjjAddress = '8128bb403a7e7641b1e34f00f9b5922b27a8583a163609e39e96bde63f422008'
const hermezBjjAddress = 'hez:CCBCP-a9lp7jCTYWOlioJyuStfkAT-OxQXZ-OkC7KIF6'
const hermezWrongBjjAddress = 'hez:testtesttesttesttesttesttesttesttesttesttest'
const expectedAy = '128bb403a7e7641b1e34f00f9b5922b27a8583a163609e39e96bde63f422008'
const expectedSign = 1
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
  expect(addresses.isHermezBjjAddress(hermezWrongBjjAddress)).toBe(false)
  expect(addresses.isHermezBjjAddress(hermezEthereumAddress)).toBe(false)
})

test('#getAccountIndex', () => {
  expect(addresses.getAccountIndex(hermezAccountIndex)).toBe(accountIndex)
})

test('#isHermezAccountIndex', () => {
  expect(addresses.isHermezAccountIndex(hermezAccountIndex)).toBe(true)
  expect(addresses.isHermezAccountIndex(hermezEthereumAddress)).toBe(false)
})

test('#hexToBase64BJJ', () => {
  expect(addresses.hexToBase64BJJ(hermezHexBjjAddress)).toBe(hermezBjjAddress)
})

test('#base64ToHexBJJ', () => {
  expect(addresses.base64ToHexBJJ(hermezBjjAddress)).toBe(hermezHexBjjAddress)
})

test('#getAySignFromBJJ', () => {
  const { ay, sign } = addresses.getAySignFromBJJ(hermezHexBjjAddress)
  expect(ay).toBe(expectedAy)
  expect(sign).toBe(expectedSign)
})

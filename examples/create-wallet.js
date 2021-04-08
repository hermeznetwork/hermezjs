const hermez = require('../dist/node/index.js')
const {
  EXAMPLES_WEB3_URL,
  EXAMPLES_PRIVATE_KEY1
} = require('./constants.js')

async function main () {
  const privKey1 = EXAMPLES_PRIVATE_KEY1

  // Create Wallet
  const wallet1 = await hermez.HermezWallet.createWalletFromEtherAccount(EXAMPLES_WEB3_URL, { type: 'WALLET', privateKey: privKey1 })
  const hermezWallet1 = wallet1.hermezWallet

  console.log('Hermez Wallet 1', hermezWallet1)

  const wallet2 = await hermez.HermezWallet.createWalletFromBjjPvtKey(hermezWallet1.privateKey)
  const hermezWallet2 = wallet2.hermezWallet

  console.log('Hermez Wallet 2', hermezWallet2)
}

main()

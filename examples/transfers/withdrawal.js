const hermez = require('@hermeznetwork/hermezjs')

const yargs = require('yargs').usage('')

// local arguments
const argv = yargs.argv
const ethNodeURL = argv.url === undefined ? 'http://localhost:8545' : argv.url

async function main () {
  // load ethereum network provider
  hermez.Providers.setProvider(ethNodeURL)

  // load token to deposit information
  const tokenToDeposit = 0
  const token = await hermez.CoordinatorAPI.getTokens()
  const tokenERC20 = token.tokens[tokenToDeposit]

  // load first account
  const mnemonicIndex1 = 1
  const wallet = await hermez.HermezWallet.createWalletFromEtherAccount(ethNodeURL, { type: 'JSON-RPC', addressOrIndex: mnemonicIndex1 })
  const hermezWallet = wallet.hermezWallet
  const hermezEthereumAddress = wallet.hermezEthereumAddress

  // get account information
  const infoAccount = (await hermez.CoordinatorAPI.getAccounts(hermezEthereumAddress, [tokenERC20.id]))
    .accounts[0]

  // get exit information
  const exitInfoN = (await hermez.CoordinatorAPI.getExits(infoAccount.hezEthereumAddress, true)).exits
  console.log('L', exitInfoN.length, exitInfoN)
  if (exitInfoN.length) {
    const exitInfo = exitInfoN[exitInfoN.length - 1]
    // set to perform instant withdraw
    const isInstant = true

    console.log('ExitInfo', JSON.stringify(exitInfo, null, 4))
    // perform withdraw
    await hermez.Tx.withdraw(
      exitInfo.balance,
      exitInfo.accountIndex,
      exitInfo.token,
      hermezWallet.publicKeyCompressedHex,
      exitInfo.batchNum,
      exitInfo.merkleProof.siblings,
      isInstant
    )
  }
}

main()

import ethers from 'ethers'
import hermez from './src/index.js'

test('Hermezjs sandbox', async () => {
  // Init network provider.
  hermez.Providers.setProvider('http://localhost:8545')

  // Initialize Transaction Pool
  // Transaction Pool declares an instance in LocalStorage where user transactions are stored.
  // When a L1Tx or L2Tx is sent, the transaction is also kept in the LocalStorage
  hermez.TxPool.initializeTransactionPool()

  // Create 2 wallets
  // To create a wallet, we need to provide a signature and a hermez ethereum address.
  //  Signature is created with a standard message (METAMASK_MESSAGE)
  //  Hermez ethereum address is created by appending 'hez:' to the ethereum address.
  // In this example we create a standard wallet. It is also possible to link the hermez wallet to a existing
  // Metamask wallet
  const wallet = await hermez.HermezWallet.createWalletFromEtherAccount(1)
  const hermezWallet = wallet.hermezWallet
  const hermezEthereumAddress = wallet.hermezEthereumAddress

  // Create 2nd wallet
  const wallet2 = await hermez.HermezWallet.createWalletFromEtherAccount(2)
  const hermezWallet2 = wallet2.hermezWallet
  const hermezEthereumAddress2 = wallet2.hermezEthereumAddress

  // Deposit
  // First transaction is a deposit from the ethereum address into hermez network. Since a hermez
  // account associated to the ethereum address doesn't exist at this point, this deposit transaction
  // will also create one.
  // The steps to do a deposit are:
  //   - Select amount to deposit from ethereum into hermez using getTokenAmountBitInt
  //   - Select the token denomination of the deposit. Hermez contains a list of supported token that
  //      can be queried with getTokens(). This function returns the list of supported tokens. Only
  //      tokens in this list can be used.
  //   - Sender Hermez address
  //   - Sender Compresed Babyjubjub
  //
  // NOTES
  //  In this preliminary version there are certain harcoded steps that stem from the fact that there is
  //    no real Hermez node running yet (mock server only that always provides same responses to the
  //    same queries). These are:
  //  - In the example deployment, one token have been deployed and initialized in Hermez (ERC20 token)
  //  - Deposit is a L1 transaction that interacts with a deployed mock smart contract.
  //  - Hermez node returns a single token available with a false address. Therefore, we substitute the
  //      token address returned by Hermez node by the real address of the token added to the list of supported
  //      tokens
  //  - Deposit funtion always returns that the deposit is to be done to a non existent account
  //  - ethereum account is preloaded with 1e6 ERC20Tokens

  const amount = hermez.Utils.getTokenAmountBigInt('100', 2)

  // retrieve token info from Hermez network
  const token = await hermez.CoordinatorAPI.getTokens()
  expect(token.tokens.length).toBe(11)
  expect(token.tokens[0].ethereumAddress).toBe('0x0000000000000000000000000000000000000000')

  for (var i = 1; i < 6; i++) {
    expect(token.tokens[i].name).toBe('ERC20_'.concat(i - 1).toString())
  }
  for (var i = 6; i < 11; i++) {
    expect(token.tokens[i].name).toBe('ERC20P_'.concat(i - 6).toString())
  }

  // ERC20 Token -> Pick 3rd token
  const tokenERC20 = token.tokens[3]

  // make deposit of ERC20 Tokens
  await hermez.Tx.deposit(amount, hermezEthereumAddress, tokenERC20, hermezWallet.publicKeyCompressedHex)

  // Wait until transaction is forged
  await waitAccount(hermezEthereumAddress, [tokenERC20.id])
  const tx1 = await hermez.CoordinatorAPI.getAccount(hermezEthereumAddress, [tokenERC20.id])

  // make deposit of ERC20 Tokens
  await hermez.Tx.deposit(amount, hermezEthereumAddress2, tokenERC20, hermezWallet2.publicKeyCompressedHex)

  // Wait until transaction is forged
  await waitAccount(hermezEthereumAddress, 2[tokenERC20.id])
  const tx2 = hermez.CoordinatorAPI.getAccount(hermezEthereumAddress2, [tokenERC20.id)
})

// Wait till batch is forged
async function waitAccount (hermezEthereumAddress, tokenId) {
  while (true) {
    const accounts = await hermez.CoordinatorAPI.getAccounts(hermezEthereumAddress, tokenId)
    console.log(accounts)
    if (typeof accounts !== 'undefined') {
      break
    } else {
      await sleep(2000)
    }
  }
}

async function sleep (timeout) {
  await new Promise(r => setTimeout(r, timeout))
}

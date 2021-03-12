const TxType = {
  Deposit: 'Deposit',
  CreateAccountDeposit: 'CreateAccountDeposit',
  Transfer: 'Transfer',
  TransferToEthAddr: 'TransferToEthAddr',
  TransferToBJJ: 'TransferToBJJ',
  Withdraw: 'Withdrawn',
  Exit: 'Exit',
  ForceExit: 'ForceExit'
}

const TxState = {
  Forged: 'fged',
  Forging: 'fing',
  Pending: 'pend',
  Invalid: 'invl'
}

const TxLevel = {
  L1: 'L1',
  L2: 'L2'
}

export {
  TxType,
  TxState,
  TxLevel
}

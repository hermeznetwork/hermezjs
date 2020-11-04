export default [
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "tokenAddress",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint32",
        "name": "tokenID",
        "type": "uint32"
      }
    ],
    "name": "AddToken",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint64",
        "name": "batchNum",
        "type": "uint64"
      }
    ],
    "name": "ForgeBatch",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint64",
        "name": "queueIndex",
        "type": "uint64"
      },
      {
        "indexed": true,
        "internalType": "uint8",
        "name": "position",
        "type": "uint8"
      },
      {
        "indexed": false,
        "internalType": "bytes",
        "name": "l1UserTx",
        "type": "bytes"
      }
    ],
    "name": "L1UserTxEvent",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "newFeeAddToken",
        "type": "uint256"
      }
    ],
    "name": "UpdateFeeAddToken",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "uint8",
        "name": "newForgeL1L2BatchTimeout",
        "type": "uint8"
      }
    ],
    "name": "UpdateForgeL1L2BatchTimeout",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint48",
        "name": "idx",
        "type": "uint48"
      },
      {
        "indexed": true,
        "internalType": "uint48",
        "name": "numExitRoot",
        "type": "uint48"
      },
      {
        "indexed": true,
        "internalType": "bool",
        "name": "instantWithdraw",
        "type": "bool"
      }
    ],
    "name": "WithdrawEvent",
    "type": "event"
  },
  {
    "inputs": [],
    "name": "ABSOLUTE_MAX_L1L2BATCHTIMEOUT",
    "outputs": [
      {
        "internalType": "uint8",
        "name": "",
        "type": "uint8"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "babyPubKey",
        "type": "uint256"
      },
      {
        "internalType": "uint48",
        "name": "fromIdx",
        "type": "uint48"
      },
      {
        "internalType": "uint16",
        "name": "loadAmountF",
        "type": "uint16"
      },
      {
        "internalType": "uint16",
        "name": "amountF",
        "type": "uint16"
      },
      {
        "internalType": "uint32",
        "name": "tokenID",
        "type": "uint32"
      },
      {
        "internalType": "uint48",
        "name": "toIdx",
        "type": "uint48"
      },
      {
        "internalType": "bytes",
        "name": "permit",
        "type": "bytes"
      }
    ],
    "name": "addL1Transaction",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "tokenAddress",
        "type": "address"
      },
      {
        "internalType": "bytes",
        "name": "permit",
        "type": "bytes"
      }
    ],
    "name": "addToken",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "name": "buckets",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "ceilUSD",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "blockStamp",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "withdrawals",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "blockWithdrawalRate",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "maxWithdrawals",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint64",
        "name": "",
        "type": "uint64"
      },
      {
        "internalType": "uint48",
        "name": "",
        "type": "uint48"
      }
    ],
    "name": "exitNullifierMap",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint64",
        "name": "",
        "type": "uint64"
      }
    ],
    "name": "exitRootsMap",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "feeAddToken",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint48",
        "name": "newLastIdx",
        "type": "uint48"
      },
      {
        "internalType": "uint256",
        "name": "newStRoot",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "newExitRoot",
        "type": "uint256"
      },
      {
        "internalType": "bytes",
        "name": "encodedL1CoordinatorTx",
        "type": "bytes"
      },
      {
        "internalType": "bytes",
        "name": "l2TxsData",
        "type": "bytes"
      },
      {
        "internalType": "bytes",
        "name": "feeIdxCoordinator",
        "type": "bytes"
      },
      {
        "internalType": "uint8",
        "name": "verifierIdx",
        "type": "uint8"
      },
      {
        "internalType": "bool",
        "name": "l1Batch",
        "type": "bool"
      },
      {
        "internalType": "uint256[2]",
        "name": "proofA",
        "type": "uint256[2]"
      },
      {
        "internalType": "uint256[2][2]",
        "name": "proofB",
        "type": "uint256[2][2]"
      },
      {
        "internalType": "uint256[2]",
        "name": "proofC",
        "type": "uint256[2]"
      }
    ],
    "name": "forgeBatch",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "forgeL1L2BatchTimeout",
    "outputs": [
      {
        "internalType": "uint8",
        "name": "",
        "type": "uint8"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "hermezAuctionContract",
    "outputs": [
      {
        "internalType": "contract AuctionInterface",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "hermezGovernanceDAOAddress",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address[]",
        "name": "_verifiers",
        "type": "address[]"
      },
      {
        "internalType": "uint256[]",
        "name": "_verifiersParams",
        "type": "uint256[]"
      },
      {
        "internalType": "address",
        "name": "_withdrawVerifier",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "_hermezAuctionContract",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "_tokenHEZ",
        "type": "address"
      },
      {
        "internalType": "uint8",
        "name": "_forgeL1L2BatchTimeout",
        "type": "uint8"
      },
      {
        "internalType": "uint256",
        "name": "_feeAddToken",
        "type": "uint256"
      },
      {
        "internalType": "address",
        "name": "_poseidon2Elements",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "_poseidon3Elements",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "_poseidon4Elements",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "_hermezGovernanceDAOAddress",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "_safetyAddress",
        "type": "address"
      },
      {
        "internalType": "uint64",
        "name": "_withdrawalDelay",
        "type": "uint64"
      },
      {
        "internalType": "address",
        "name": "_withdrawDelayerContract",
        "type": "address"
      }
    ],
    "name": "initializeHermez",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "tokenAddress",
        "type": "address"
      },
      {
        "internalType": "uint192",
        "name": "amount",
        "type": "uint192"
      }
    ],
    "name": "instantWithdrawalViewer",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "lastForgedBatch",
    "outputs": [
      {
        "internalType": "uint64",
        "name": "",
        "type": "uint64"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "lastIdx",
    "outputs": [
      {
        "internalType": "uint48",
        "name": "",
        "type": "uint48"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "lastL1L2Batch",
    "outputs": [
      {
        "internalType": "uint64",
        "name": "",
        "type": "uint64"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint64",
        "name": "",
        "type": "uint64"
      }
    ],
    "name": "mapL1TxQueue",
    "outputs": [
      {
        "internalType": "bytes",
        "name": "",
        "type": "bytes"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "nextL1FillingQueue",
    "outputs": [
      {
        "internalType": "uint64",
        "name": "",
        "type": "uint64"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "nextL1ToForgeQueue",
    "outputs": [
      {
        "internalType": "uint64",
        "name": "",
        "type": "uint64"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "registerTokensCount",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "name": "rollupVerifiers",
    "outputs": [
      {
        "internalType": "contract VerifierRollupInterface",
        "name": "verifierInterface",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "maxTx",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "nLevels",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "safeMode",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "safetyAddress",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint64",
        "name": "",
        "type": "uint64"
      }
    ],
    "name": "stateRootMap",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "name": "tokenExchange",
    "outputs": [
      {
        "internalType": "uint64",
        "name": "",
        "type": "uint64"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "tokenHEZ",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "name": "tokenList",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "name": "tokenMap",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256[4][5]",
        "name": "arrayBuckets",
        "type": "uint256[4][5]"
      }
    ],
    "name": "updateBucketsParameters",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "newFeeAddToken",
        "type": "uint256"
      }
    ],
    "name": "updateFeeAddToken",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint8",
        "name": "newForgeL1L2BatchTimeout",
        "type": "uint8"
      }
    ],
    "name": "updateForgeL1L2BatchTimeout",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address[]",
        "name": "addressArray",
        "type": "address[]"
      },
      {
        "internalType": "uint64[]",
        "name": "valueArray",
        "type": "uint64[]"
      }
    ],
    "name": "updateTokenExchange",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint64",
        "name": "newWithdrawalDelay",
        "type": "uint64"
      }
    ],
    "name": "updateWithdrawalDelay",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256[2]",
        "name": "proofA",
        "type": "uint256[2]"
      },
      {
        "internalType": "uint256[2][2]",
        "name": "proofB",
        "type": "uint256[2][2]"
      },
      {
        "internalType": "uint256[2]",
        "name": "proofC",
        "type": "uint256[2]"
      },
      {
        "internalType": "uint32",
        "name": "tokenID",
        "type": "uint32"
      },
      {
        "internalType": "uint192",
        "name": "amount",
        "type": "uint192"
      },
      {
        "internalType": "uint48",
        "name": "numExitRoot",
        "type": "uint48"
      },
      {
        "internalType": "uint48",
        "name": "idx",
        "type": "uint48"
      },
      {
        "internalType": "bool",
        "name": "instantWithdraw",
        "type": "bool"
      }
    ],
    "name": "withdrawCircuit",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "withdrawDelayerContract",
    "outputs": [
      {
        "internalType": "contract WithdrawalDelayerInterface",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint32",
        "name": "tokenID",
        "type": "uint32"
      },
      {
        "internalType": "uint192",
        "name": "amount",
        "type": "uint192"
      },
      {
        "internalType": "uint256",
        "name": "babyPubKey",
        "type": "uint256"
      },
      {
        "internalType": "uint48",
        "name": "numExitRoot",
        "type": "uint48"
      },
      {
        "internalType": "uint256[]",
        "name": "siblings",
        "type": "uint256[]"
      },
      {
        "internalType": "uint48",
        "name": "idx",
        "type": "uint48"
      },
      {
        "internalType": "bool",
        "name": "instantWithdraw",
        "type": "bool"
      }
    ],
    "name": "withdrawMerkleProof",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "withdrawVerifier",
    "outputs": [
      {
        "internalType": "contract VerifierWithdrawInterface",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "withdrawalDelay",
    "outputs": [
      {
        "internalType": "uint64",
        "name": "",
        "type": "uint64"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
]

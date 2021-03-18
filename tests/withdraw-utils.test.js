import * as withdrawUtils from '../src/withdraw-utils.js'

import { WITHDRAWAL_CIRCUIT_NLEVELS } from '../src/constants.js'
import { getEthereumAddress, getAccountIndex, base64ToHexBJJ, getAySignFromBJJ } from '../src/addresses.js'

describe('Withdraw utils', () => {
  test('#buildProofContract', async () => {
    const proofSnarkjs = {
      pi_a: [
        '6557365902006173902585895881491599956261637100789914779437824039181806619428',
        '17547235809091680743661105661235603683808853117611189891780721805720691705210',
        '1'
      ],
      pi_b: [
        [
          '6092307857564565537166825978353503989086039203916567756862443556847140906176',
          '14008615564626964909550685361573799887059829537756632507820807740862349516854'
        ],
        [
          '14749525498815057950911321846974645602776561415216496226199971068810298479575',
          '9625949392436169855211707984425506593703677380699774093226952031596583643005'
        ],
        [
          '1',
          '0'
        ]
      ],
      pi_c: [
        '19751761238788082485485782295592147387853195509253232129476034439772029001653',
        '3635016281318032270391337149678584018489690690880370006504444187549384347948',
        '1'
      ],
      protocol: 'groth16'
    }

    const proofContract = await withdrawUtils.buildProofContract(proofSnarkjs)

    expect(proofContract.proofA[0]).toBe(proofSnarkjs.pi_a[0])
    expect(proofContract.proofA[1]).toBe(proofSnarkjs.pi_a[1])

    expect(proofContract.proofB[0][0]).toBe(proofSnarkjs.pi_b[0][1])
    expect(proofContract.proofB[0][1]).toBe(proofSnarkjs.pi_b[0][0])
    expect(proofContract.proofB[1][0]).toBe(proofSnarkjs.pi_b[1][1])
    expect(proofContract.proofB[1][1]).toBe(proofSnarkjs.pi_b[1][0])

    expect(proofContract.proofC[0]).toBe(proofSnarkjs.pi_c[0])
    expect(proofContract.proofC[1]).toBe(proofSnarkjs.pi_c[1])
  })

  test('#buildZkInputWithdraw', async () => {
    const exitInfo = {
      accountIndex: 'hez:ETH:256',
      balance: '220000000000000000',
      batchNum: 18,
      bjj: 'hez:Ev0J4ZWXY2j_5N5TwzgRf4Sicri5G3CYHvvCFfTUiR4a',
      delayedWithdraw: null,
      delayedWithdrawRequest: null,
      hezEthereumAddress: 'hez:0x8401Eb5ff34cc943f096A32EF3d5113FEbE8D4Eb',
      instantWithdraw: null,
      itemId: 1,
      merkleProof: {
        root: '16422024321548097698035180867736716984371366264715639895458217376472016708238',
        siblings: [],
        oldKey: '0',
        oldValue: '0',
        isOld0: false,
        key: '256',
        value: '604412150365316267629426544273754691494827286798558365521471114802901687403',
        fnc: 0
      },
      token: {
        USD: 1789.46,
        decimals: 18,
        ethereumAddress: '0x0000000000000000000000000000000000000000',
        ethereumBlockNum: 0,
        fiatUpdate: '2021-03-17T08:46:32.12995Z',
        id: 0,
        itemId: 1,
        name: 'Ether',
        symbol: 'ETH'
      }
    }

    const zkInputsWithdrawal = await withdrawUtils.buildZkInputWithdraw(exitInfo)

    const ethAddr = getEthereumAddress(exitInfo.hezEthereumAddress)
    const bjjHex = base64ToHexBJJ(exitInfo.bjj)
    const { ay, sign } = getAySignFromBJJ(bjjHex)

    expect(zkInputsWithdrawal.rootExit.toString()).toBe(exitInfo.merkleProof.root)
    expect('0x' + zkInputsWithdrawal.ethAddr.toString(16)).toBe(ethAddr.toLowerCase())
    expect(zkInputsWithdrawal.tokenID.toString()).toBe(exitInfo.token.id.toString())
    expect(zkInputsWithdrawal.balance.toString()).toBe(exitInfo.balance)
    expect(zkInputsWithdrawal.idx.toString()).toBe(getAccountIndex(exitInfo.accountIndex).toString())
    expect(zkInputsWithdrawal.sign.toString()).toBe(sign.toString())
    expect(zkInputsWithdrawal.ay.toString(16)).toBe(ay.toString())
    expect(zkInputsWithdrawal.siblingsState.length).toBe(WITHDRAWAL_CIRCUIT_NLEVELS + 1)
  })
})

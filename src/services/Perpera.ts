
import TransportWebUSB from "@ledgerhq/hw-transport-webusb";
import AppBtc from "@ledgerhq/hw-app-btc";
// import { TransactionInput } from "@ledgerhq/hw-app-btc/src/types"
// import { TransactionOutput } from "@ledgerhq/hw-app-btc/lib/types";
// import { Transaction } from "@ledgerhq/hw-app-btc/lib/types";
const coinjs = require('coinjs-lib');

export default class PerperaService {
  private perpera: any;
  private network: string;

  constructor(network?: string) {
    this.perpera = window['perpera'];
    this.network = network || window['perpera'].networks['peercoin'];
  }

  public getDocument(hash: string) {
    return new this.perpera.Document(hash, this.network);
  }

  public async setDocument(hash: string, hashAlgo: string, wif: string) {
    const doc = new this.perpera.Document(hash, this.network);
    const spender = this.perpera.Spender.fromWIF(wif.trim(), this.network);
    await spender.sync();
    return await doc.updateContent({ hashAlgo: hash }, spender);
  }

  public async updateDocument(originalHash: string, hash: string, hashAlgo: string, wif: string) {
    const doc = new this.perpera.Document(hash, this.network);
    const spender = this.perpera.Spender.fromWIF(wif.trim(), this.network);
    await spender.sync();
    return await doc.updateContent({ hashAlgo: hash }, spender);
  }

  public async createLedgerTx(hash: string, hashAlgo: string, address: string) {

    console.log(hash, address)

    const doc = new this.perpera.Document(hash, this.network)
    console.log(doc)

    const timeout = 50000
    const transport = await TransportWebUSB.create(timeout)
    const appPPC = new AppBtc(transport)
    console.log(appPPC)


    const transaction = new coinjs.TransactionBuilder('peercoin')

    // Set our version
    transaction.setVersion(3)
    // Set our timestamp
    transaction.setTimestamp = null
    // Set our locktime?
    transaction.setLocktime = 0

    // Add outputs (scriptPubKey, value) //////////////////
    // 480 perpera.js
    const p2thFee: number = this.perpera.networks.peercoin.p2thFee
    const minOutputFee: number = this.perpera.networks.peercoin.minOutput
    console.log(p2thFee, minOutputFee)
    // p2thFee
    // transaction.addOutput(
    //   new Buffer(doc.address),
    //   p2thFee
    // )
    // Add data
    transaction.addOutput(
      new Buffer(hash),
      0
    )
    // Add minOutput
    transaction.addOutput(
      new Buffer(address),
      minOutputFee
    )

    let balance = -(minOutputFee + p2thFee)
    console.log(transaction, "balance", balance)
    let fee = this.getLedgerFee(transaction.tx.ins.length, transaction.tx.outs.length)

    // Gather inputs //////////
    const unspentsMasterObj = await fetch("https://blockbook.peercoin.net/api/utxo/" + address)
    const unspentMaster = await unspentsMasterObj.json()
    console.log(unspentMaster)
    // https://blockbook.peercoin.net/api/tx/{txid}

    // Add inputs
    let txIndex = 0
    while (balance <= fee) {
      for (const unspentRaw of unspentMaster) {
        // Update our fee
        fee = this.getLedgerFee(transaction.tx.ins.length, transaction.tx.outs.length)
        // Fetch our unspent by txid
        const unspentObj = await fetch("https://blockbook.peercoin.net/api/tx/" + unspentRaw.txid)
        const unspent = await unspentObj.json()
        // Iterate through our vouts
        for (const vout of unspent.vout) {
          console.log(vout)
          if (vout.scriptPubKey.addresses[0] === address) {
            transaction.addInput(
              unspent.txid,
              vout.n,
              txIndex,
              new Buffer(vout.scriptPubKey.hex)
            )
            balance += parseInt((parseInt(vout.value) * 100000000).toFixed(8))
            txIndex++
          }
        }
      }
    }

    // Set our fee
    fee = this.getLedgerFee(transaction.tx.ins.length, transaction.tx.outs.length)
    transaction.tx.fee = fee

    // Add the change address
    transaction.addOutput(new Buffer(address), balance - fee)

    console.log(transaction)

    const rawTx = transaction.buildIncomplete().toHex() 

    const ledgerTX = appPPC.splitTransaction(rawTx)
    console.log(ledgerTX)

    const outputHash = appPPC.serializeTransactionOutputs(ledgerTX).toString('hex')
    console.log(outputHash)

    const signedTx = await appPPC.createPaymentTransactionNew({
        inputs: [[ledgerTX, 1, undefined, undefined]],
        associatedKeysets: ["44'/6'/0'/0/0"],
        outputScriptHex: outputHash,
        lockTime: 0,
        additionals: [],
      })
    console.log(signedTx)

    console.log("GOOD TX", transaction, txIndex)
    return {
      outputHash: outputHash,
      rawTx: rawTx,
      fee: fee / 10 ** 6,
    }

  }

  public getLedgerFee(inputsArrayLength: number, outputsArrayLength: number) {
    const txSize = inputsArrayLength * 180 + outputsArrayLength * 34 + 10 - inputsArrayLength;
    const fee = this.perpera.networks.peercoin.feePerKb * txSize / 1000;
    return fee;
  }

  public async getFee(hash: string, hashAlgo: string, wif: string) {
    const doc = new this.perpera.Document(hash, this.network);
    console.log(doc.address)
    const spender = this.perpera.Spender.fromWIF(wif.trim(), this.network);
    await spender.sync();
    const update = await doc.considerUpdatingContent({ hashAlgo: hash }, spender);
    return {
      fee: (update.getFee() / 10 ** 6),
      reference: update
    }
  }

  public async getRawTransaction(hash: string, hashAlgo: string, wif: string) {
    const doc = new this.perpera.Document(hash, this.network);
    const spender = this.perpera.Spender.fromWIF(wif.trim(), this.network);
    await spender.sync();
    return await doc.getRawTransaction({ hashAlgo: hash }, spender);
  }
}


import TransportWebUSB from "@ledgerhq/hw-transport-webusb";
import AppBtc from "@ledgerhq/hw-app-btc";
import { TransactionInput } from "@ledgerhq/hw-app-btc/src/types"
import { TransactionOutput } from "@ledgerhq/hw-app-btc/lib/types";
import { Transaction } from "@ledgerhq/hw-app-btc/lib/types";

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

    const transport = await TransportWebUSB.create()
    const appPPC = new AppBtc(transport)
    console.log(appPPC)

    const outputsArray: TransactionOutput[] = []

    console.log(this.perpera)

    // Process outputs
    // Add p2thFee
    const p2thFeeOutput: TransactionOutput = {
      amount: new Buffer(String(this.perpera.networks.peercoin.p2thFee)),
      // TODO: This needs to go to the p2th address 
      script: new Buffer(String(address)),
    }
    outputsArray.push(p2thFeeOutput)

    // Add the data
    const dataOutput: TransactionOutput = {
      amount: new Buffer("0"),
      script: new Buffer(hash)
    }
    outputsArray.push(dataOutput)

    // Add min output - perpera.js line 479
    const minOutput: TransactionOutput = {
      amount: new Buffer(String(this.perpera.networks.peercoin.minOutput)),
      script: new Buffer(String(address))
    }
    outputsArray.push(minOutput)

    const p2thFee = this.perpera.networks.peercoin.p2thFee
    const minOutputFee = this.perpera.networks.peercoin.minOutput

    // Get our balance
    let balance = -(minOutputFee + p2thFee)
    console.log(balance)

    // Process inputs
    // Fetch from chainz
    const unspentData = await fetch("https://chainz.cryptoid.info/ppc/api.dws?key=5aae7ab0624d&q=unspent&active=" + address)
    const unspentJson = await unspentData.json();
    console.log("Unspents", unspentJson.unspent_outputs)

    // Collect our inputs
    const inputsArray: TransactionInput[] = []

    let fee = this.getLedgerFee(inputsArray.length, outputsArray.length)

    // TODO: Check to make sure this breaks or handles being broke
    while (true) {
      for (const unspent of unspentJson.unspent_outputs) {
        // Update our fee
        fee = this.getLedgerFee(inputsArray.length, outputsArray.length)
        if (balance >= fee) {
          console.log(p2thFee)
          fee += p2thFee
          // Change address
          const tempTx: Transaction = {
              version: new Buffer("3"),
              inputs: inputsArray,
              outputs: outputsArray
          }
          const outputHash = appPPC.serializeTransactionOutputs(tempTx).toString('hex')
          const signedTx = await appPPC.signP2SHTransaction({
            inputs: [ [tempTx, 0, "", 0]],
            associatedKeysets: ["44'/6'/0'/0/0"],
            outputScriptHex: outputHash
          })
          console.log(signedTx)
          // 
          // const transaction = await appPPC.signP2SHTransaction({
          //   inputs: tempTx,
          //   associatedKeysets: ["44'/6'/0'/0/0"],
          //   outputScriptHex: outputHash
          // })
          return {
            fee: fee / 10 ** 6,
            // transaction: transaction
          }
        }
        // Add the input
        const input: TransactionInput = {
          prevout: unspent.tx_hash,
          script: unspent.script,
          // This typo is intentional ("tx_output_n"). Preemptively fixing this incase it ever changes
          sequence: unspent.tx_output_n ?? unspent.tx_ouput_n
        }
        inputsArray.push(input)
        balance += unspent.value
        console.log("Balance", balance)
      }
      if (balance <= fee)  {
        console.log("Balance is less than fee")
        throw new Error("Insufficient funds.")
        break
      }
    }

    // console.log(fee)


    // for (const unspent of unspentJson.unspent_outputs) {
    //   const input: TransactionInput = {
    //     prevout: unspent.tx_hash,
    //     script: unspent.script,
    //     // This typo is intentional ("tx_output_n"). Preemptively fixing this incase it ever changes
    //     sequence: unspent.tx_output_n ?? unspent.tx_ouput_n
    //   }
    //   inputsArray.push(input)
    //   balance += unspent.value
    //   if (balance >= fee) { break }
    // }

    // In every bitcoin transaction, the inputs contribute 180 bytes each to the transaction,
    // while the output contributes 34 bytes each to the transaction. Then there is an extra 
    // 10 bytes you add or subtract from the transaction as well.
   

    // to(address, this.perpera.networks.peercoin.p2thFee)
    // .to(address, this.perpera.networks.peercoin.minOutput)

    // to address, network.p2thFee
    // addData
    // to address, minOutput
    // balance = -(network.p2thFee + network.minOutput)

    // const p2thFee: TransactionOutput = {
    //   amount: new Buffer(this.state.fee)
    // }

    // const tempTx: Transaction = {
    //   version: new Buffer("3"),
    //   inputs: inputsArray,
    //   outputs: outputsArray
    // }
    // console.log(tempTx)

    // const txHash = appPPC.serializeTransaction(tempTx)
    // console.log("txHash", txHash)
    // console.log(txHash.toString())

    // let fee = 0

    // return {
    //     tx: tempTx,
    //     fee: fee / 10**6,
    //     reference: ""
    //   }

    // let outputScriptHex

    // const tx = appPPC.createTransaction({
    //   inputs: inputsArray,
    //   associatedKeysets: ["44'/6'/0'/0/0"],
    //   outputScriptHex,
    //   segwit: true,
    //   additionals: ["bech32"]
    // })
    // console.log(tx)

    // const tx = new this.perpera.Transaction();
    // // Set version to 3
    // tx.version = 3;
    // // Set outputs
    // tx.to(address, this.perpera.networks.peercoin.p2thFee)
    //   .addData(hash)
    //   .to(address, this.perpera.networks.peercoin.minOutput)

    // let balance = -(this.perpera.networks.peercoin.p2thFee + this.perpera.networks.peercoin.minOutput);

    // const unspentData = await fetch("https://chainz.cryptoid.info/ppc/api.dws?key=5aae7ab0624d&q=unspent&active=" + address)
    // const unspentJson = await unspentData.json();
    // const unspentArray = unspentJson.unspent_outputs;
    // console.log(unspentArray)
    // if (unspentArray.length === 0) alert("No unspent outputs found for this address");
    // // Append the unspents starting with the most recent to avoid disrupting stakes
    // const txSize = tx.toBuffer().length;
    // const fee = this.perpera.networks.peercoin.getFee(txSize)
    // console.log(fee)
    // // https://blockbook.peercoin.net/api/utxo/PM21gPYk1rW64TMFXfmiNXzRU6sfdiLaWX

    // console.log("tx", tx)
    // for (const utxo of unspentArray) {
    //   console.log(utxo)
    //   if (balance >= fee) console.log("you have enough")

    //   // Have to spoof it so its compatible
    //   // Referencing perpera.js line 16589
    //   tx.from({
    //     txId: utxo.tx_hash,
    //     outputIndex: utxo.tx_ouput_n,
    //     amount: String(utxo.value / 100000000),
    //     address: address,
    //     script: utxo.script,
    //     satoshis: utxo.value
    //   });

    //   console.log(tx);
    //   balance += utxo.value;
    // }

    // // Send the remaining balance back to myself
    // tx.fee(fee);
    // tx.change(address);
    // console.log("serialized tx");

    // return {
    //   tx: tx,
    //   fee: fee / 10**6,
    //   reference: ""
    // }
  }

  public getLedgerFee(inputsArrayLength: number, outputsArrayLength: number) {
    const txSize = inputsArrayLength * 180 + outputsArrayLength * 34 + 10 - inputsArrayLength;
    const fee = this.perpera.networks.peercoin.feePerKb * txSize / 1000;
    return fee;
  }

  public async getFee(hash: string, hashAlgo: string, wif: string) {
    const doc = new this.perpera.Document(hash, this.network);
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

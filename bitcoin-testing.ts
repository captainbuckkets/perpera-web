const bitcoin = require("bitcoinjs-lib")

const p2thFee = 10000
const minOutputFee = 10000
const address = "PM21gPYk1rW64TMFXfmiNXzRU6sfdiLaWX"

const tx = new bitcoin.Psbt()
tx.setVersion(3)
tx.setLocktime(0)

tx.addInput({
    hash: "c9c3ffeffd527d769810c5e30d66b592d4e9939244d96672a38c43f045dda8c5",
    index: 0
})

tx.addOutput({
    address: address,
    value: minOutputFee
})

console.log(tx)
const rawTx = tx.extractTransaction().toHex()
console.log(rawTx)

// 0300000001c5a8dd45f0438ca37266d9449293e9d492b5660de3c51098767d52fdefffc3c90000000000feffffff0110270000000000000000000000
// 0300000001c5a8dd45f0438ca37266d9449293e9d492b5660de3c51098767d52fdefffc3c90000000000feffffff0110270000000000000000000000
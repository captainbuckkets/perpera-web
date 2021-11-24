const coinjs = require('coinjs-lib');

const transaction = new coinjs.TransactionBuilder('peercoin')

const p2thFee = 10000
const minOutputFee = 10000
const address = "PM21gPYk1rW64TMFXfmiNXzRU6sfdiLaWX"

// Set our version
transaction.setVersion(3)

// Don't need to set our locktime

transaction.addOutput(
    Buffer.from(address, "hex"),
    minOutputFee
)

transaction.addInput(
    "c9c3ffeffd527d769810c5e30d66b592d4e9939244d96672a38c43f045dda8c5",
    0,
    0xfffffffe,
    Buffer.from("76a9148853ffa690a6d81404a95cea91e43cbf5be234c088ac", "hex")
)

console.log(transaction)

const rawTx = transaction.buildIncomplete().toHex()
console.log(rawTx)

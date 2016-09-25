
// Example usage: Name Registry
// Create the contract, register the key 123, set the value 456

var lightwallet = require('../index.js')
var txutils = lightwallet.txutils
var signing = lightwallet.signing
var encryption = lightwallet.encryption

var source = '\ncontract NameCoin {\n\n    struct Item {\n\taddress owner;\n\tuint value;\n    }\n\n    mapping (uint => Item) registry;\n\n    function register(uint key) {\n\tif (registry[key].owner == 0) {\n\t    registry[key].owner = msg.sender;\n\t}\n    }\n\n    function transferOwnership(uint key, address newOwner) {\n\tif (registry[key].owner == msg.sender) {\n\t    registry[key].owner = newOwner;\n\t}\n    }\n\n    function setValue(uint key, uint newValue) {\n\tif (registry[key].owner == msg.sender) {\n\t    registry[key].value = newValue;\n\t}\n    }\n\n    function getValue(uint key) constant returns (uint value) {\n\treturn registry[key].value;\n    }\n\n    function getOwner(uint key) constant returns (address owner) {\n\treturn registry[key].owner;\n    }\n}\n'

// contract json abi, this is autogenerated using solc CLI
var abi = [{"constant":true,"inputs":[{"name":"key","type":"uint256"}],"name":"getValue","outputs":[{"name":"value","type":"uint256"}],"type":"function"},{"constant":false,"inputs":[{"name":"key","type":"uint256"},{"name":"newOwner","type":"address"}],"name":"transferOwnership","outputs":[],"type":"function"},{"constant":false,"inputs":[{"name":"key","type":"uint256"},{"name":"newValue","type":"uint256"}],"name":"setValue","outputs":[],"type":"function"},{"constant":true,"inputs":[{"name":"key","type":"uint256"}],"name":"getOwner","outputs":[{"name":"owner","type":"address"}],"type":"function"},{"constant":false,"inputs":[{"name":"key","type":"uint256"}],"name":"register","outputs":[],"type":"function"}]

var code = '6060604052610381806100136000396000f30060606040526000357c0100000000000000000000000000000000000000000000000000000000900480630ff4c9161461006557806329507f731461008c5780637b8d56e3146100a5578063c41a360a146100be578063f207564e146100fb57610063565b005b610076600480359060200150610308565b6040518082815260200191505060405180910390f35b6100a36004803590602001803590602001506101b3565b005b6100bc60048035906020018035906020015061026e565b005b6100cf600480359060200150610336565b604051808273ffffffffffffffffffffffffffffffffffffffff16815260200191505060405180910390f35b61010c60048035906020015061010e565b005b60006000600050600083815260200190815260200160002060005060000160009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1614156101af57336000600050600083815260200190815260200160002060005060000160006101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908302179055505b5b50565b3373ffffffffffffffffffffffffffffffffffffffff166000600050600084815260200190815260200160002060005060000160009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16141561026957806000600050600084815260200190815260200160002060005060000160006101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908302179055505b5b5050565b3373ffffffffffffffffffffffffffffffffffffffff166000600050600084815260200190815260200160002060005060000160009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff161415610303578060006000506000848152602001908152602001600020600050600101600050819055505b5b5050565b600060006000506000838152602001908152602001600020600050600101600050549050610331565b919050565b60006000600050600083815260200190815260200160002060005060000160009054906101000a900473ffffffffffffffffffffffffffffffffffffffff16905061037c565b91905056'

// You can change this to your seed
// and the nonce of the first address
var seed = 'unhappy nerve cancel reject october fix vital pulse cash behind curious bicycle'
var nonce = 2

lightwallet.keystore.deriveKeyFromPassword('mypassword', function(err, pwDerivedKey) {

var keystore = new lightwallet.keystore(seed, pwDerivedKey)
keystore.generateNewAddress(pwDerivedKey)

var sendingAddr = keystore.getAddresses()[0]


// The transaction data follows the format of ethereumjs-tx
txOptions = {
    gasPrice: 10000000000000,
    gasLimit: 1600000,
    value: 10000000,
    nonce: nonce,
    data: code
}

// sendingAddr is needed to compute the contract address
var contractData = txutils.createContractTx(sendingAddr, txOptions)
var signedTx = signing.signTx(keystore, pwDerivedKey, contractData.tx, sendingAddr)

console.log('Signed Contract creation TX: ' + signedTx)
console.log('')
console.log('Contract Address: ' + contractData.addr)
console.log('')

// TX to register the key 123
txOptions.to = contractData.addr
txOptions.nonce += 1
var registerTx = txutils.functionTx(abi, 'register', [123], txOptions)
var signedRegisterTx = signing.signTx(keystore, pwDerivedKey, registerTx, sendingAddr)

// inject signedRegisterTx into the network...
console.log('Signed register key TX: ' + signedRegisterTx)
console.log('')

// TX to set the value corresponding to key 123 to 456
txOptions.nonce += 1
var setValueTx = txutils.functionTx(abi, 'setValue', [123, 456], txOptions)
var signedSetValueTx = signing.signTx(keystore, pwDerivedKey, setValueTx, sendingAddr)

// inject signedSetValueTx into the network...
console.log('Signed setValueTx: ' + signedSetValueTx)
console.log('')

// Send a value transaction
txOptions.nonce += 1
txOptions.value = 1500000000000000000
txOptions.data = undefined
txOptions.to = 'eba8cdda5058cd20acbe5d1af35a71cfc442450e'
var valueTx = txutils.valueTx(txOptions)

var signedValueTx = signing.signTx(keystore, pwDerivedKey, valueTx, sendingAddr)
console.log('Signed value TX: ' + signedValueTx)
console.log('')

})

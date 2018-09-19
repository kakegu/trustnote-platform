// contains headless wallet
// this project should
var composer = require('trustnote-common/composer')
var headlessWallet = require('trustnote-headless')
var Mnemonic = require('bitcore-mnemonic')
var Bitcore = require('bitcore-lib')

const mnemonic = 'fury car kingdom design boat please trust enrich empower era paper erase'
function onError(err){
    throw Error(err)
}

/**
 * divide money all money to 
 * @param asset
 * @param outputs
 * @param message
 */
function sendPayment(asset, outputs, message) {

}

function refundCharge() {
    
}

/**
 * an delegate account that can send
 */
function deriveDelegateAccount() {

}

/**
 * max count 127
 * @param count
 */
function deriveRedPacketAddress(arrCodes) {
    var results = []
    let item = {
        pubkey: '',
        address: '',
        code: ''
    }

    results.push(item)
}

function deriveAddress(code) {
    var xPrivKey = mnemonic.toHDPrivateKey()
    var xPubKey  = Bitcore.HDPublicKey(xPrivKey).toString()

}

function sendMutiAssetPayment(payerAddress, chargeAddress, asset, message, baseOutputs, assetOutputs) {
    // send payment
    var network = require('trustnote-common/network.js')
    var divisibleAsset = require('trustnote-common/divisible_asset.js')


    divisibleAsset.composeAndSaveDivisibleAssetPaymentJoint({
        base_outputs: baseOutputs,
        asset: asset,
        asset_outputs: assetOutputs,
        paying_addresses: [payerAddress],
        fee_paying_addresses: [payerAddress],
        change_address: chargeAddress,
        signer: headlessWallet.signer,
        callbacks: {
            ifError: onError,
            ifNotEnoughFunds: onError,
            ifOk: function(objJoint, arrChains){
                network.broadcastJoint(objJoint);
            }
        }
    })
}

var asset_outputs = []
for(var i=1; i<2; i++) {
    asset_outputs.push({address: 'TIPXQ4CAO7G4C4P2P4PEN2KQK4MY73WD', amount: i});
}

var base_outputs = []

for(var i=1; i<2; i++) {
    base_outputs.push({address: 'TIPXQ4CAO7G4C4P2P4PEN2KQK4MY73WD', amount: 75});
}

sendMutiAssetPayment(
    'VP5IQETBYVNDIE7NSMFQEQEJFEBOYUID',
    'VP5IQETBYVNDIE7NSMFQEQEJFEBOYUID',
    'jGIo0TVY4gAyDUbN83+5tkB+34KqCzdQw3mgHc/rOnc=',
    'payment',
    base_outputs,
    asset_outputs)



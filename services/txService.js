var db = require('trustnote-common/db')
var async = require('async')
var objectHash = require('trustnote-common/object_hash.js')
var _ = require('lodash')
const BizError = require('../util/error')
var headlessWallet = require('trustnote-headless')
var placeholder = '----------------------------------------------------------------------------------------'
var tx = {}

function onError(msg) {
    console.log(msg)
}




tx.composePaymentJoint = function (assetPayer, feePayer, asset,assetOutputs,msg,callback) {

    var divisibleAsset = require('trustnote-common/divisible_asset.js');

    var base_outputs = []

    divisibleAsset.composeAndSaveDivisibleAssetPaymentJoint({
        base_outputs: base_outputs,
        asset: asset,
        asset_outputs: assetOutputs,
        paying_addresses: [assetPayer],
        fee_paying_addresses: [feePayer],
        change_address: feePayer,
        signer: headlessWallet.signer,
        suckers:[feePayer],
        message:msg,
        callbacks: {
            ifError: onError,
            ifNotEnoughFunds: onError,
            ifOk: function(objJoint, arrChains){
                var newJoint = removeFakeSignature(objJoint,[assetPayer])
                var buf_to_sign = objectHash.getUnitHashToSign(newJoint.unit)
                var b64ToSign = buf_to_sign.toString('base64')
                callback(b64ToSign,newJoint)
            }
        }
    });
}

tx.composeBaseAssetPayment = function (payer,arrOutputs,text,callbacks,errorHandler) {
    //
    var callback= {
        ifError: onError,
        ifNotEnoughFunds: errorHandler,
        ifOk: function(objJoint, arrChains){
            var newJoint = removeFakeSignature(objJoint,[payer])
            var buf_to_sign = objectHash.getUnitHashToSign(newJoint.unit)
            var b64ToSign = buf_to_sign.toString('base64')
            callbacks(b64ToSign,newJoint)
        }
    }

    var composer = require('trustnote-common/composer.js')
    composer.composePaymentAndTextJointWithCallBacks([payer], [payer], arrOutputs, text, headlessWallet.signer, callback)
}


tx.composeDefinitionJoint = function (address,cap,isSpo,isDestroyable,extraInfo,callback) {

    var composer = require('trustnote-common/composer.js');
    // var network = require('trustnote-common/network.js');
    var callbacks = composer.getSavingCallbacks({
        ifNotEnoughFunds: onError,
        ifError: onError,
        ifOk: function(objJoint){
            // network.broadcastJoint(objJoint);
            // var json = JSON.parse(JSON.stringify(objJoint, null, '\t'))
            // cb(json['unit']['unit'])
            // process.exit(0)

            var newJoint = removeFakeSignature(objJoint,[address])
            // console.log('new joint:\n')
            // console.log(JSON.stringify(objJoint))
            var buf_to_sign = objectHash.getUnitHashToSign(newJoint.unit)
            var b64ToSign = buf_to_sign.toString('base64')
            callback(b64ToSign,newJoint)
        }
    });
    var asset = {
        cap: cap,
        is_private: false,
        is_transferrable: true,
        auto_destroy: false,
        fixed_denominations: false,
        issued_by_definer_only: true,
        cosigned_by_definer: false,
        spender_attested: false,
    };

    if(isSpo){
        delete asset.cap
    }
    var msg = JSON.stringify(extraInfo)

    composer.composeAssetDefinitionWithOtherAssetInfoJoint(address, asset, msg,headlessWallet.signer, callbacks);

}

tx.composeFullJoint  = function (unsignedUnit,sig) {
    var unitStr = JSON.stringify(unsignedUnit)
    var signedUnitStr = unitStr.replace(placeholder,sig)
    var unit = reCalUnitHash(JSON.parse(signedUnitStr))
    return unit
}

// remove fake sig
 function removeFakeSignature (unit,arrAddress) {
    var authors = unit.unit.authors

    for (var i = 0; i<authors.length; i++){
        var item = unit.unit.authors[i]
        if (arrAddress.includes(item.address)){
            unit.unit.authors[i].authentifiers.r = placeholder
        }
    }
    return unit
}

function reCalUnitHash(unitJoint) {
    var objectunitHash = objectHash.getUnitHash(unitJoint.unit)
    unitJoint.unit.unit = objectunitHash
    return unitJoint
}


module.exports = tx




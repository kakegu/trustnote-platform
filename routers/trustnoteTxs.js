const txService = require('../services/txService')
const userService = require('../services/accountService')
const networkService = require('../services/networkService')
const headless = require('trustnote-headless')
const db = require('trustnote-common/db')
var network = require('trustnote-common/network.js')
const express   = require('express')
const router    = express.Router()
const QuickLRU = require('quick-lru')
var lru = new QuickLRU({maxSize: 1000})
const BizError = require('../util/error')
const _ = require('../util/httpUtil')
const tutil = require('../util/trustnoteutil')
var ecdsa = require('secp256k1')
let  suckers = []
var index = 0
function removeFromcache(txid) {
    if(lru.has(txid)){
        lru.delete(txid)
    }
}

router.post('/submittxsync', function(req, res, next){
    // 同步提交..
})

router.post('/submittx', function(req, res, next){
    var txid = req.body.txid
    var sig = req.body.sig

    if(!lru.has(txid)){
        next(new BizError('payment finished or cancel',1006))
        return
    }

    var unsignedunit = lru.get(txid)
    var newunit = txService.composeFullJoint(unsignedunit,sig)

    console.log(JSON.stringify(newunit))

    var callbacks = {
        ifError: function (error) {
            next(tutil.HandleSystemError(error))
            // return
        },
        ifNotEnoughFunds: function (error) {
            next(tutil.HandleSystemError(error))
            // return
        },
        ifOk: function(objJoint, arrChains){
            console.log('broadcastJoint backs')
            // delete from cache!!
            removeFromcache(objJoint.unit)
            network.broadcastJoint(objJoint);

            _.handleResponse(res,{unit:newunit.unit})
        }
    }

    networkService.broadCastUnit(newunit,callbacks)

})

router.post('/defination', function(req, res, next){
    var cap = req.body.cap
    var definerAddress = req.body.definerAddress
    var isSpo = req.body.isSpo
    var symbol = req.body.symbol
    var desc = req.body.desc
    var issuer = req.body.issuer
    var name = req.body.name

    try {
        tutil.validateAssetDefination(req)
    } catch(e) {
        next(e)
        return
    }

    // var isDestroyable = req.body.isDestroyable
    var extrInfo = {
        desc:desc,
        issuer:issuer,
        name:name,
        symbol:symbol
    }

    txService.composeDefinitionJoint(definerAddress,cap,isSpo,false,extrInfo,function (b64_to_sign,objoint) {
        lru.set(objoint.unit.unit, objoint)
        var data = {"b64_to_sign":b64_to_sign, "txid":objoint.unit.unit}
        _.handleResponse(res,data)
    })
})

router.post('/issue', function(req, res, next){
    var asset = req.body.asset
    var payer = req.body.definerAddress
    var outputs = [{address:payer,amount:1}]
    var message = req.body.message

    txService.composePaymentJoint(payer,'VP5IQETBYVNDIE7NSMFQEQEJFEBOYUID',asset,outputs,message,function (b64_to_sign,objoint) {
        lru.set(objoint.unit.unit, objoint)
        var data = {"b64_to_sign":b64_to_sign, "txid":objoint.unit.unit}
        _.handleResponse(res,data)
    })
})

router.post('/addtionalissue', function(req, res, next){
    var cap = req.body.cap
    var asset = req.body.asset
    var payer = req.body.definerAddress

    var message = req.body.message

    userService.balanceOf(asset,payer,outputs,function (asset,balance) {
        //
        var outputs = [{address:payer,amount:balance+cap}]
        txService.composePaymentJoint(payer,'VP5IQETBYVNDIE7NSMFQEQEJFEBOYUID',asset,outputs,message,function (b64_to_sign,objoint) {
            lru.set(objoint.unit.unit, objoint)
            var data = {"b64_to_sign":b64_to_sign, "txid":objoint.unit.unit}
            _.handleResponse(res,data)
        })
    })
})

router.post('/grouptransfer', function(req, res, next){
    var asset = req.body.asset
    var payer = req.body.payer
    var outputs = req.body.outputs
    var message = req.body.message

    index++
    var xAddress = suckers[index%10]


    tutil.asyncPrepare(asset,payer,outputs,function () {
        txService.composePaymentJoint(payer,xAddress,asset,outputs,message,function (b64_to_sign,objoint) {
            lru.set(objoint.unit.unit, objoint)
            var data = {"b64_to_sign":b64_to_sign, "txid":objoint.unit.unit}
            _.handleResponse(res,data)
        })
    },function (err) {
        next(err)
    })

})

router.post('/transfer', function(req, res, next){
    var asset = req.body.asset
    var payer = req.body.payer
    var payee =req.body.payee
    var amount = req.body.amount
    var outputs = [{address:payee,amount:amount}]
    var message = req.body.message

    index++
    var xAddress = suckers[index%10]

    tutil.asyncPrepare(asset,payer,outputs,function () {
        txService.composePaymentJoint(payer,xAddress,asset,outputs,message,function (b64_to_sign,objoint) {
            lru.set(objoint.unit.unit, objoint)
            var data = {"b64_to_sign":b64_to_sign, "txid":objoint.unit.unit}
            _.handleResponse(res,data)
        })
    },function (err) {
        next(err)
    })
})

router.post('/transferttt', function(req, res, next){

    var payer = req.body.payer
    var outputs = req.body.outputs
    var message = req.body.message
    outputs.push({address:payer,amount:0})

    try{
        tutil.validateBaseTransfer(req)
    }catch (e){
        next(e)
        return
    }
    // add charge address
    tutil.asyncPrepare('base',payer,outputs,function () {
        txService.composeBaseAssetPayment(payer, outputs, message, function (b64_to_sign, objoint) {
            lru.set(objoint.unit.unit, objoint)
            var data = {"b64_to_sign": b64_to_sign, "txid": objoint.unit.unit,unit:objoint}
            _.handleResponse(res, data)
        },function (error) {
            next(tutil.HandleSystemError(error))
        })
    },function (err) {
        next(err)
    })
})

router.post('/register',function(req, res, next){
    var pubkey = req.body.pubkey
    if (pubkey==''||!pubkey){
        next(new BizError('pubkey can not be null or empty',1001))
        return
    }

    if(!ecdsa.publicKeyVerify(new Buffer(pubkey,'base64'))) {
        next(new BizError('invalid pubkey',1013))
        return
    }

    userService.registerWithPubKey(pubkey,function (error,address) {
        _.handleResponse(res,{address:address})
    })
})

router.get('/address',function(req, res, next){
    userService.address()
    _.handleResponse(res,{address:'success'})
})


// router.get('/balance',function(req, res, next){
//     var asset = req.query.asset
//     var address = req.query.address
//
//     if (asset==''||!asset){
//         next(new BizError('asset can not be null or empty',1001))
//         return
//     }
//
//     if (address==''||!address){
//         next(new BizError('address can not be null or empty',1001))
//         return
//     }
//
//     userService.balanceOf(asset,address,function (asset,balance) {
//         _.handleResponse(res,{asset:asset, balance:balance})
//     })
// })

function readAutherAddress(cb){
    db.query("select address from my_addresses ORDER BY address_index asc limit 100",
        [],
        function(rows){
            var autherAddresses = [];
            rows.forEach(item => {
                autherAddresses.push(item.address);
            });
            cb(autherAddresses);
        })
}




readAutherAddress(function (addresses) {
    suckers = addresses
})

module.exports = router
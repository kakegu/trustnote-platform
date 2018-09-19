const commonStatics = require('../services/commonStaticService')
const _ = require('../util/httpUtil')
const express   = require('express')
const router    = express.Router()
const async     = require('async')
const v = require('../util/trustnoteutil')

// all tx
router.get('/txs/:address/:asset/:index/:size', function (req, res, next) {
    let asset = req.params.asset
    let address = req.params.address
    let index = parseInt(req.params.index)
    let size = parseInt(req.params.size)
    let pageXOffset = index*size-size

    commonStatics.scanSingleAddressUnit(address,asset,pageXOffset,size,function (results) {
        _.handleResponse(res,results)
    })
})

function getFee(unit) {
    return unit.headers_commission+unit.payload_commission
}

function getPayer(unit) {
    //
    return unit.authors[0].address
}

function getAmount(arr,address) {
    for (var i = 0;i<arr.length;i++) {
        if(arr[i].address==address){
            return arr[i].amount
        }
        else {
            continue
        }
    }
    return 0
}

function plusAmout(arr,item) {
    for(var i = 0;i<arr.length;i++) {
        if(arr[i].address==item.address){
            // find
            var curamount = arr[i].amount
            arr.splice(i, 1)
            arr.push({address:item.address,amount:curamount+item.amount})
            return arr
        }
    }
    return arr
}

function addressMerge(outputs) {
    var mergedArr = []
    for(var i = 0;i<outputs.length;i++) {
        if(getAmount(mergedArr,outputs[i].address)>0){
            // has .. find it , plus it.
            mergedArr = plusAmout(mergedArr,outputs[i])
        }
        else {
            // new
            mergedArr.push(outputs[i])
        }
    }
    return mergedArr
}

function getPayees(payer,unit) {
    var msgs = unit.messages

    for(var i = 0;i<msgs.length;i++) {
        var item = msgs[i]

        if (item.app == 'payment'){
            // filter items
            var outputs = item.payload.outputs
            //
            return addressMerge(outputs)
        }
    }
}

function getMessage(unit) {
    var msgs = unit.messages

    for(var i = 0;i<msgs.length;i++) {
        var item = msgs[i]

        if (item.app == 'text') {
            return item.payload
        }
    }
    return ''
}

function getType(address,unit) {
    return unit.authors[0].address==address?'payment':'received'
}

function beautifytx(address,results) {
    var xarr = []

    for(var i = 0;i<results.length;i++) {
        var unit = results[i]
        var payer = getPayer(unit)
        var payees = getPayees(payer,unit)
        var fee = getFee(unit)
        var type = getType(address,unit)
        var timestamp = unit.timestamp
        var msg = getMessage(unit)
        // remove change
        // for(var i = 0;i<payees.length;i++){
        //     //
        //     if (payees[i].address==payer){
        //         payees.splice(i,1)
        //     }
        // }


        var jitem = {
            payer:payer,
            payees:payees,
            fee:fee,
            type:type,
            timestamp:timestamp,
            unit:unit.unit,
            msg:msg
        }

        xarr.push(jitem)
    }

    return xarr
}

router.get('/readabletxs/:address/:asset/:index/:size', function (req, res, next) {
    let asset = req.params.asset
    let address = req.params.address
    let index = parseInt(req.params.index)
    let size = parseInt(req.params.size)
    let pageXOffset = index*size-size

    commonStatics.scanSingleAddressUnit(address,asset,pageXOffset,size,function (results) {
        _.handleResponse(res,beautifytx(address,results))
    })
})

router.get('/topholder/:asset', function (req, res, next) {
    let asset = req.params.asset
    commonStatics.scanTopHolder(asset,function (data) {
       _.handleResponse(res,data)
    })
})

router.get('/holdercount/:asset', function (req, res, next) {

})

router.get('/assetinfo/:asset', function (req, res, next) {

})

router.get('/balance/:address/:asset', function (req, res, next) {
    let address = req.params.address
    let asset = req.params.asset

    commonStatics.scanBalance(asset,address,function (data) {
        _.handleResponse(res,data)
    })
})

router.get('/balance/:address', function (req, res, next) {
    let address = req.params.address
    commonStatics.scanAllAsset(address,function (data) {
        _.handleResponse(res,data)
    })
})

router.get('/readabletxs/:address', function (req, res, next) {
    commonStatics.readUnit('ewERCamJVshs3hDSyiqIh4AKQ2QsGQ7mOhkchUdUcls=')
})

router.get('/recentdaytxcount', function (req, res, next) {
    commonStatics.readUnit('ewERCamJVshs3hDSyiqIh4AKQ2QsGQ7mOhkchUdUcls=')
})

router.get('/unit/:unit', function (req, res, next) {

})

router.get('/addressvalidation/:address', function (req, res, next) {
    let address = req.params.address
    try {
        v.validateAddr(address)
        _.handleResponse(res,{})
    }catch (err){
        next(err)
    }
})











module.exports = router
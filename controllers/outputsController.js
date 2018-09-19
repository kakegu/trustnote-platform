const Outputs = require('../dao/outputsDAO')
var crypto = require('crypto')
var chash = require('trustnote-common/chash.js')
var httputil = require('../util/httpUtil')
validateoutputs = function(asset,message,outputs){
    //asset exist
    //message length
    //outputs:size,address,amount
    if(message&&message.length>100){
        throw new Error('message too long')
    }
    if(!Array.isArray(outputs)){
        throw new Error('outputs should be JSON Array')
    }
    if(outputs.length==0){
        throw new Error('empty outputs')
    }
    if(outputs.length>127){
        throw new Error('exceed max outputs size,outputs size should be less than 127')
    }
    for(var i =0;i<outputs.length;i++){
        var address = outputs[i].address
        var amount = outputs[i].amount

        try{
            var valid = chash.isChashValid(address);
            if(!valid){
                throw new Error(address+' address not valid')
            }
        }catch(ex){
            throw new Error(address+' address not valid')
        }
        if(!Number.isInteger(amount)||amount<0){
            throw new Error('amount should be a positive number')
        }
    }
}

processOutputs = function (result, cb) {
    var asset = result.asset
    httputil.asyncGroupFetch([{asset:asset}],function (data) {

        console.log("abc: "+JSON.stringify(data))

        var assetName = data[0].symbol
        var asset = result.asset
        var msg = result.message
        var outputs = result.outputs
        var bdata = {
            assetName:assetName,
            message:msg,
            outputs:JSON.parse(outputs),
            asset:asset
        }
        cb(bdata)
    })
}


const outputsController = {

    addOutputs: function (req,res,next) {
        var asset = req.body.asset
        var outputs = req.body.outputs
        var message =req.body.message
        try {
            validateoutputs(asset,message,outputs)
        } catch(ex){
            res.json({
                errCode:1,
                errMsg:ex.message
            })
            return
        }
        var txid = crypto.randomBytes(32).toString('hex')

        Outputs.addOutputs(asset,message,txid,outputs).then(function (results) {
            res.json({
                errCode:0,
                errMsg:'success',
                data:{txid:txid}
            })
        })
    },

    updateOutputs: function (req,res,next) {
        var txid = req.body.txid
        var unit = req.body.unit

        Outputs.updateOutputs(unit,txid).then(function (results) {
            res.json({
                errCode: 0,
                errMsg: 'success'
            })
        })
    },

    queryOutputs: function (req,res,next) {
        var txid = req.query.txid

        Outputs.queryOutputs(txid).then(function (results) {
            // query assetName from external server
            console.log(JSON.stringify(results[0]))
            processOutputs(results[0],function (data) {
                res.json({
                    errCode: 0,
                    errMsg:'success',
                    data:data
                })
            })
        })
    },

    queryOutputsState: function (req,res,next) {
        var txid = req.query.txid

        Outputs.queryOutputsState(txid).then(function (results) {

            if (results.length){
                if (results[0].unit!=''){
                    res.json({
                        errCode: 0,
                        errMsg: 'success',
                        data:{data:results[0].unit}
                    })
                }
                else {
                    res.json({
                        errCode: 1,
                        errMsg: 'no unit found'
                    })
                }
            }

            else {
                res.json({
                    errCode: 1,
                    errMsg: 'no txid found'
                })
            }
        })

    },
}

module.exports = outputsController
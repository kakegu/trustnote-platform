const BizError = require('../util/error')
const chash = require('trustnote-common/chash.js')
var db = require('trustnote-common/db.js')
var async = require('async')
var trustnoteutil = {}
var Static = require('../dao/commonStatisticDAO')
trustnoteutil.validateUnit = function(unit) {
    
}

trustnoteutil.validateAssetDefination = function(req) {
    var cap = req.body.cap
    var definerAddress = req.body.definerAddress
    var isSpo = req.body.isSpo
    var symbol = req.body.symbol
    var desc = req.body.desc
    var issuer = req.body.issuer
    var name = req.body.name

    if (!Number.isInteger(cap)){
        throw(new BizError('cap should be integer type',1001))
    }

    if (cap<=0||cap>1e15){
        throw(new BizError('cap should be a positive integer no more bigger than 1e15',1001))
    }

    try {
        var valid = chash.isChashValid(definerAddress)
        if(!valid){
            throw(new BizError('invalid address: '+definerAddress ,1001))
        }
    }catch (e){
        throw(new BizError('invalid address: '+definerAddress ,1001))
    }

    if(!(typeof(isSpo) === "boolean")){
        throw(new BizError('isSpo should be a boolean value',1001))
    }

    if (!(typeof symbol === 'string' || symbol instanceof String)){
        throw(new BizError('invalid symbol:'+symbol,1001))
    }

    if (!isValidSymbol(symbol)){
        throw(new BizError('invalid symbol:'+symbol,1001))
    }

    if (!(typeof desc === 'string' || desc instanceof String)){
        throw(new BizError('invalid desc:'+desc,1001))
    }

    if (!(typeof issuer === 'string' || issuer instanceof String)){
        throw(new BizError('invalid issuer:'+issuer,1001))
    }

    if (!(typeof name === 'string' || name instanceof String)){
        throw(new BizError('invalid name:'+name,1001))
    }

    if (lengthInBytes(desc)>1000) {
        throw(new BizError('desc too long',1001))
    }

    if (lengthInBytes(name)>20) {
        throw(new BizError('name too long',1001))
    }

    if (lengthInBytes(issuer)>20) {
        throw(new BizError('issuer too long',1001))
    }
}

trustnoteutil.asyncPrepare = function (asset,address,outputs,successcb,errorcb) {

    async.series([
        // check address define exist
        function (callback) {
            db.query('SELECT 1 FROM my_addresses WHERE address=?',[address],function (rows) {
                //
                if (rows.length){
                    callback(null)
                }
                else {
                    callback(new BizError('address not register yet',1005))
                }
            })
        },

        // check asset define exist
        function (callback) {
            if(asset=='base'){
                callback(null)
            }
            else {
                db.query('SELECT 1 FROM assets WHERE unit=?', [asset], function (rows) {
                    if (rows.length){
                        callback(null)
                    }
                    else {
                       callback(new BizError('asset not exist',1003))
                    }
                })
            }
        },

        // check asset is stable
        function (callback) {
            if(asset=='base'){
                callback(null)
            }
            else {
                db.query('SELECT 1 FROM units WHERE unit=? AND is_stable=1', [asset], function (rows) {
                    if (rows.length){
                        callback(null)
                    }
                    else {
                        callback(new BizError('unit not stable yet',1004))
                    }
                })
            }
        },

        // check asset balance
        function (callback) {
            if(asset=='base'){
                callback(null)
            }
            else {
                // Static.confirmedBalance(address,asset).then(function (balance) {
                //     if(balance>100) {
                //         callback(null)
                //     }
                //     else {
                //         callback(new BizError('not enough asset:'+asset+'from address'+address,1002))
                //     }
                // })
                var allsum = 0
                for (var i = 0;i<outputs.length; i++){
                    allsum+=outputs[i].amount
                }

                Static.confirmedBalance(address,asset).then(function (results) {
                        if(results[0].balance>=allsum) {
                            callback(null)
                        }
                        else {
                            callback(new BizError('not enough asset:'+asset+'from address'+address,1002))
                        }
                })

            }
        }



    ],function (err,results) {
        //
        if(err){
            errorcb(err)
        }
        else{
            successcb()
        }
    })




}

function validateAssetIssue(req) {

}

function validateAssetTransfer(req) {

}

trustnoteutil.validateBaseTransfer= function(req) {
    var payer = req.body.payer
    var outputs = req.body.outputs
    var message = req.body.message

    validateAddress(payer)
    validateOutputs(outputs)
    validateMessage(message)

}

trustnoteutil.HandleSystemError = function(error) {
    if (error.includes('not enough')) {
        return new BizError(error, 1002)
    }

    else if (error.includes('already exists')) {
        return new BizError('tx has been sent', 1008)
    }

    else if (error.includes('bad signature')) {
        return new BizError(error, 1007)
    }

    else if (error.includes('Divisible asset bad sequence final-bad')) {
        return new BizError(error, 1010)
    }

    else if (error.includes('Divisible asset bad sequence temp-bad')) {
        return new BizError(error, 1011)
    }

    return new BizError(error, 1100)

}

function validateAssetGroupTransfer(req) {
    //
}
// TODO:
function isValidSymbol(str) {
    var re = new RegExp(/^[A-Z] {3,4}$/)
    // return re.test(str)
    return true
}

function lengthInBytes(str) {
   return Buffer.byteLength(str, 'utf8')
}

function validateAddress(address) {
    try {
        var valid = chash.isChashValid(address)
        if(!valid){
            throw(new BizError('invalid address: '+address ,1001))
        }
    }catch (e){
        throw(new BizError('invalid address: '+address ,1001))
    }
}

function validateMessage(message) {
    if (!(typeof message === 'string' || message instanceof String)){
        throw(new BizError('message should be string value',1001))
    }

    if (lengthInBytes(message)>400){
        throw new BizError('message to long',1001)
    }
}

function validateOutputs(outputs){
    if(!Array.isArray(outputs)){
        throw new BizError('outputs should be JSON Array',1001)
    }
    if(outputs.length==0){
        throw new BizError('empty outputs',1001)
    }
    if(outputs.length>127){
        throw new BizError('exceed max outputs size,outputs size should be less than 127',1001)
    }
    for(var i =0;i<outputs.length;i++){
        var address = outputs[i].address
        var amount = outputs[i].amount

        try{
            var valid = chash.isChashValid(address);
            if(!valid){
                throw new BizError(address+' address not valid',1001)
            }
        }catch(ex){
            throw new BizError(address+' address not valid',1001)
        }
        if(!Number.isInteger(amount)||amount<0){
            throw new BizError('amount should be a positive number',1001)
        }
    }
}


trustnoteutil.f = function (asset,sql) {
    if ('base' == asset){
        return sql.replace(/\%s/g,'is null')
    }
    else {
        return sql.replace(/\%s/g,'='+"'"+asset+"'")
    }
}

trustnoteutil.validateAddr = function (address) {
    let valid = false
    try {
        valid = chash.isChashValid(address)
        if(!valid){
            throw(new BizError('invalid address: '+address ,1001))
        }
    }catch (e){
        throw(new BizError('invalid address: '+address ,1001))
    }
    return valid
}

module.exports = trustnoteutil
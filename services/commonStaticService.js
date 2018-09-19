const httputil = require('../util/httpUtil')
var async = require('async')
var Static = require('../dao/commonStatisticDAO')
var storage = require('trustnote-common/storage')
var db = require('trustnote-common/db')
var commonStaticService = {}



commonStaticService.scanSingleAddressUnit = function (address, asset,offset,size,cb) {
    Static.txHistory(asset,address,offset,size).then(function (results) {
        concurrentRead(results,function (data) {
            cb(data)
        })
    })

}

commonStaticService.scanTopHolder = function (asset,cb) {
    Static.topHolder(asset).then(function (results) {
        cb(results)
    })
}

commonStaticService.scanBalance = function (asset,address,cb) {

    async.series({
        amount:function(callback){
            Static.confirmedBalance(address,asset).then(function (results) {
                callback(null,results[0].balance)
            })
        },
        pending:function(callback){
            Static.unConfirmedBalance(address,asset).then(function (results) {
                callback(null,results[0].balance)
            })
        }
    }, function(error,result){
        result['asset'] = asset
        cb(result)
    })

}

commonStaticService.scanAllAsset = function (address,cb) {
    Static.allAsset(address).then(function (results) {
        cb(results)
    })
}







function concurrentRead(units,cb) {
    var async = require('async');
    var jointArray = []
    async.eachSeries(units,function (unit,callback) {
        readJoints(unit.unit,function (obj) {
            jointArray.push(obj.unit)
            callback(null)
        })
    },function (error) {
        console.log('all process~~')
        cb(jointArray)
    })
}

function readJoints(unit,cb) {
    storage.readJoint(db, unit, {
        ifFound: function(objJoint){
            cb(objJoint)
        },
        ifNotFound: function(){
            console.log('ERR0R_')
        }
    })
}








module.exports = commonStaticService


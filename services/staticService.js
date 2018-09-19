const httputil = require('../util/httpUtil')
var async = require('async')
var Static = require('../dao/statisticsDAO')
var staticService = {}



staticService.scanMytx = function (xpub, asset,index,pagesize,cb) {
    var txarray = []
    Static.myHistoryTxs(xpub,asset,index,pagesize).then(function (results) {

        async.each(results, function(result,callback) {
            scanUnitOutputs(xpub,result.unit,asset,function (arr) {
                // add arr to
                txarray = txarray.concat(arr)
                callback(null)
            })
        },function (err) {
            cb(txarray)
        })
    })
}

staticService.scanAllTx = function (asset, index, pagesize, cb) {
    async.series({
        data: function (callback) {
            Static.allHistoryTxs(asset,index,pagesize).then(function (data) {
                callback(null,data)
            })
        },
        count: function (callback) {
            Static.allTxCount(asset).then(function (data) {
                callback(null,data)
            })
        }
    },function (error, results) {
        cb(results)
    })
}

staticService.scanAssetInfo = function (asset, extendedpubkey,cb) {
    tokenSummary(asset,extendedpubkey,function (data) {
        console.log(JSON.stringify(data))
        httputil.asyncGroupFetch([{asset:asset,amount:data.myAssetBalance}], function (datab) {
            cb(Object.assign(datab[0], data))
        })
    })
}

staticService.scanSingleAddressTx = function (asset, ) {

}

function tokenSummary (asset, extendedpubkey, cb) {
    async.series({
        totalSupply:function(cb){
            Static.totalSupply(asset).then(function (data) {
                cb(null,data[0].cap)
            })
        },
        tokenHolders:function(cb){
            Static.totalHolderCount(asset).then(function (data) {
                cb(null,data[0].count)
            })

        },
        recentdayTxs:function(cb){
            Static.recentDayTxCount(extendedpubkey,asset).then(function (data) {
                cb(null, data[0].count)
            })

        },
        allhistoryTxs:function(cb){
            Static.allTxCount(asset).then(function (data) {
                cb(null, data[0].count)
            })
        },
        myBalance:function(cb){
            Static.myAssetBalance(extendedpubkey,asset).then(function (data) {
                cb(null, data[0].amount)
            })
        }
    },function(error,result){
        cb(result)
    })
}


function scanUnitOutputs(xpub,unit,asset,cb) {
    async.series([
        // scan payers that belongs to me
        function (callback) {
            Static.scanPayers(xpub,unit,asset).then(function (result) {
                callback(null,result)
            })
        },

        // scan payees that belongs to me
        function (callback) {
            Static.scanPayees(xpub,unit,asset).then(function (result) {
                callback(null,result)
            })
        },

        // scan inputs and outputs for asset in unit
        function (callback) {
            Static.scanInputsOutputs(asset,unit).then(function (result) {
                callback(null,result)
            })
        },

    ],function (err,results) {
        // cal record from inputs-outputs
        var payers = results[0]
        var payees = results[1]
        var ioputs = results[2]

        var items = calculate(payees,payers,ioputs)
        cb(items)
    })
}

function calculate(payees,payers,data){
    //
    var results = []
    var type = txType(payees,payers,data)
    var fee = data[0].fee
    var unit = data[0].unit
    var date = data[0].creation_date
    data.forEach(item => {
        if(item.to_address){
            //根据收款方，遍历
            var amount = item.amount
            var address = item.address
            if(1==type){
                //付款，要过滤掉找零的地址
                if(payees.indexOf(address)>-1) {
                    return
                }
                else {
                    // 添加记录
                }
            }
            //收款，只显示属于我的
            else if(2==type){
                if(payees.indexOf(address)>-1) {
                    // 添加记录
                }
                else {
                    return
                }
            }
            else if(3==type) {
                //移动，显示所有的
            }
            //

            var result = {
                "fee":fee,
                "unit":unit,
                "type":type,
                "date":date.toLocaleDateString()+' '+date.toLocaleTimeString(),
                "amount":amount,
                "address":address
            }
            results.push(result)
        }
    })
    return results
}
/**
 *
 * 3:移动  付款地址，收款地址全属于我自己的，移动
 * 2:收款
 * 1:付款
 * @param {*} payers 属于我自己的额付款地址
 * @param {*} payees 属于我自己的收款地址
 * @param {*} data
 */
function txType(payees,payers,data){
    var i
    var count = 0
    // 没有inputs，算收入
    if(payers.length ==0){
        return 2
    }

    // 计算outputs的地址数量
    for(i=0; i<data.length; i++) {
        count += data[i].to_address?1:0
    }
    // TODO:如何判断资产增发？？
    //所有收款人都是我自己，移动
    if(count==payees.length){
        return 3
    }
    //去扫描有没有付款方式是我的，有的话，就是付钱
    for(i=0; i<data.length; i++) {

        for(j=0; j<payers.length; j++) {
            if (payers[j]==data[i].from_address){
                return 1
            }
        }
    }
    //收钱
    return 2
}

module.exports = staticService


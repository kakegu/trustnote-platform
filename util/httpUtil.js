const request = require('request')
const conf = require('../conf/token')
var async = require('async')

var fetchExternalAssetInfo = function (item, cb) {
    var requesturl = conf.webservice.baseUrl+encodeURIComponent(item.asset)
    request(requesturl, { json: true }, (err, res, body) => {
        if (err) { throw new Error('webservice error')}

        var date = new Date(parseInt(body.data.createTime))
        // console.log("data:"+JSON.stringify(body.data))
        var dateString = date.toLocaleString()
        var itemb = {
            symbol:body.data.symbol,
            desc:body.data.descript,
            tokenName:body.data.assetName,
            issuer:body.data.issuserName,
            assetid:body.data.assetId,
            totalSupply:body.data.cap,
            ctime:dateString,
            amount:item.amount
        }
        if (!body.data.symbol) {
            cb(null)
        }
        else {
            cb(itemb)
        }
    })
}


module.exports = {

    asyncGroupFetch: function (assets,cb) {
        var results = []
        async.each(assets, function(asset,callback) {
            fetchExternalAssetInfo(asset,function (data) {
                if (data) {
                    results.push(data)
                }
                callback(null)
            })
        },function (error) {
            console.log(error)
                cb(results)
        })
    },

    handleResponse: function (res,data) {
        res.send({
            network:'testnet',
            errCode:0,
            errMsg:'success',
            data:data
        })
    }
}
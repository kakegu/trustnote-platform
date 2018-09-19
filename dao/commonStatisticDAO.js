const $sqlQuery = require('./sqlCRUD').commonStatistic
const _ = require('./query')
const x = require('../util/sqlutil')

const commonStatistics = {
    topHolder: function (asset) {
        return _.query($sqlQuery.sqlTopHolder, [asset,asset])
    },

    txHistory: function (asset,address,offset,size) {
        return _.query(x.f(asset,$sqlQuery.sqlTxHistory),[address,address,offset,size])
    },

    allAsset: function (address) {
        return _.query($sqlQuery.sqlAllAsset,[address])
    },

    confirmedBalance: function (address,asset) {
        return _.query(x.f(asset,$sqlQuery.sqlConfirmedBalance),[address])
    },

    unConfirmedBalance: function (address,asset) {
        return _.query(x.f(asset,$sqlQuery.sqlUnconfirmedBalance),[address])
    },

    assetInfo: function (asset) {

    },

    readUnit: function (unit) {

    },

    txReadableHistory:function (asset,address) {
        // type,message,outputs
    }
}

module.exports = commonStatistics
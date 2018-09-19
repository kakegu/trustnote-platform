const $sqlQuery = require('./sqlCRUD').statistic
const _ = require('./query')

const statistics = {
    topHolder: function (asset) {
        return _.query($sqlQuery.sqlTopholder, [asset,asset])
    },

    recentMonthTxs: function (asset,xPub) {
        return _.query($sqlQuery.sqlRecentMonthTxs,[asset,xPub])
    },

    allAsset: function (xPub) {
        return _.query($sqlQuery.sqlAllasset,[xPub])
    },

    allHistoryTxs: function (asset,index,size) {
        return _.query($sqlQuery.sqlAllHistoryUnit, [asset,index,size])
    },

    allTxCount: function (asset) {
        return _.query($sqlQuery.sqlAllTxCount, [asset])
    },

    myHistoryTxs: function (xPub, asset, index, size) {
        return _.query($sqlQuery.sqlMyHistoryUnit,[asset,xPub,asset,xPub,index,size])
    },

    scanPayers: function (xPub,unit,asset) {
        return _.query($sqlQuery.sqlScanPayers,[xPub,unit,asset])
    },

    scanPayees: function (xPub,unit,asset) {
        return _.query($sqlQuery.sqlScanPayees,[xPub,unit,asset])
    },

    scanInputsOutputs: function (asset,unit) {
        return _.query($sqlQuery.sqlScanInputsOutputs,[unit,asset,unit,asset])
    },

    totalSupply: function (asset) {
        return _.query($sqlQuery.sqlCap, [asset])
    },

    totalHolderCount: function (asset) {
        return _.query($sqlQuery.sqlTokenHolderCount,[asset])
    },

    recentDayTxCount: function (xPub, asset) {
        return _.query($sqlQuery.sqlRecentDayTxCount,[asset,xPub])
    },

    myAssetBalance: function (xPub, asset) {
      return _.query($sqlQuery.sqlMyAssetBalance, [asset,xPub])
    }

}

module.exports = statistics
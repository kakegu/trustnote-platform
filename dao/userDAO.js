const $sqlQuery = require('./sqlCRUD').user
const _ = require('./query')
const util = require('util')
const user = {
    addRandomBytes: function (b64_bytes) {
        return _.query($sqlQuery.addRandomBytes,[b64_bytes])
    },
    addLoginHistory: function (extendedpubkey, maxindex) {
        return _.query($sqlQuery.addloginRecord,[extendedpubkey, maxindex])
    },
    updateMaxindex: function (extendedpubkey,maxindex) {
        return _.query($sqlQuery.updateMaxIndex, [maxindex, extendedpubkey])
    },
    queryRandomBytesExistance: function (data) {
        return _.query($sqlQuery.queryDataExistance, [data])
    },
    queryLoginState: function (data) {
        return _.query($sqlQuery.querylogininfo,[data])
    },
    updateDataAsused: function (data) {
        return _.query($sqlQuery.updateUsed,[data])
    },
    queryxPubkeyExistance: function (xpub) {
        return _.query($sqlQuery.queryXpubkey,[xpub])
    },
    addWatchingAddress: function (addresses) {
        var sql = util.format($sqlQuery.addAddress,addresses)
        return _.query(sql)
    },
    updateVerState: function (xPub, data) {
        return _.query($sqlQuery.updateVerficicationState,[xPub,data])
    }
}

module.exports = user

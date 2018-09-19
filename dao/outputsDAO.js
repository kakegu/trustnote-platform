const $sqlQuery = require('./sqlCRUD').tx
const _ = require('./query')
const outputs = {
    addOutputs: function (asset,message,txid,outputs) {
        return _.query($sqlQuery.sqlAddOutputs,[asset, message, txid, JSON.stringify(outputs)])
    },

    updateOutputs: function (unit, txid) {
        return _.query($sqlQuery.sqlUpdateOutputs,[unit, txid])
    },

    queryOutputs: function (txid) {
        return _.query($sqlQuery.sqlQueryOutputs, [txid])
    },

    queryOutputsState: function (txid) {
        return _.query($sqlQuery.sqlQueryOutputsState, [txid])
    }
}

module.exports = outputs

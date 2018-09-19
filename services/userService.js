const user = require('../dao/userDAO')
const tutils = require('../util/utils')
const util = require('util')

var userService = {}
userService.doLogin = function(xPub, sig, data, index, cb) {

    user.queryRandomBytesExistance(data).then(function (result) {
        if (result.length) {
            var bool = false
            try {
                bool = tutils.checkSig(xPub,sig,data)
            }catch (error){
                cb({errCode:1,
                    errMsg:error.message})
            }

            if (!bool) {
                cb({errCode: 1,
                    errMsg: 'invalid sig'})
            }
            else {
                updateVertifiedState(xPub,data)
                catchUpAddress(xPub, index,cb)
            }
        }
        else {
            cb({errCode: 1,
                errMsg: 'invalid data'})
        }
    })
}

/**
 * 根据 index 添加地址,钱包往后推20个地址，为了确保同步，add another 20 address
 * @param xPub
 * @param index
 */
function catchUpAddress(xPub, index,cb) {
    user.queryxPubkeyExistance(xPub).then(function (result) {
        console.log(JSON.stringify(result))
        var from_index = 0
        var to_index = 0
        // type ? update record or insert  record
        var type = result.length?true:false
        if (type) {
            // make sure toIndex 20 bigger than index
            from_index = result[0].max_index
            to_index = from_index - index > 20?from_index:index + 20
        }
        else {
            to_index = index + 20
        }
        addAddressRecord(type, xPub, from_index, to_index, cb)
    })
}

function addAddressRecord(type, xPub, from_index, to_index, cb) {
    if(from_index >= to_index) {
        cb({errCode:0,
        errMsg:'success',
        data:{extendedpubkey:xPub}})
        return
    }
    var addresses = tutils.deriveGroupAddress(xPub, from_index, to_index)
    var paras = formatSQLString(addresses)
    user.addWatchingAddress(paras).then(function (results) {
        updateMaxAddrIndex(type, xPub, to_index)
        cb({errCode:0,
            errMsg:'success',
            data:{extendedpubkey:xPub}})
    })
}

function formatSQLString(array) {
    var sqlString = ""
    var oriStr = "('%s','%s','%s'),"
    var i
    for (i=0;i<array.length;i++) {
        var cStr = util.format(oriStr,array[i].extendedpubkey,array[i].address,array[i].index)
        sqlString+=cStr
    }
    return sqlString.slice(0, -1)
}

function updateMaxAddrIndex(type, xPub, index) {
    if(type){
        user.updateMaxindex(xPub, index)
    }
    else {
        user.addLoginHistory(xPub,index)
    }
}

function updateVertifiedState (xPub,b64_data) {
    user.updateVerState(xPub,b64_data)
}

module.exports = userService
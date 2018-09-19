var db = require('trustnote-common/db')
var async = require('async')
var objectHash = require('trustnote-common/object_hash.js')
var walletID

var userService = {}

userService.registerWithPubKey = function (pubkey,callback) {

    var arrDefinition = ['sig', {pubkey: pubkey}]
    var address = objectHash.getChash160(arrDefinition)

    async.waterfall([
        function (cb) {

        var sqlCheckExistance = 'SELECT 1 FROM my_addresses WHERE address = ?'
            db.query(sqlCheckExistance, [address], function (rows) {
                if(rows.length){
                    cb(new Error('address exist'))
                }
                else {
                    cb(null)
                }
            })
        },
        
        function (cb) {
            var idx = Math.floor(Date.now() / 1000)
            var sqlAddAddress = 'INSERT INTO my_addresses(address,wallet,is_change,address_index,definition) VALUES(?,?,?,?,?)'
            db.query(sqlAddAddress, [address,walletID,1,idx,JSON.stringify(arrDefinition)],function (rows) {
                cb(null)
            })
        },

    ], function (error) {
        callback(error,address)
    })

}

userService.balanceOf = function (asset,address,callback) {
    //
    db.query(
        "SELECT \n\
            SUM(amount) AS balance \n\
        FROM \n\
            outputs  left join units on outputs.unit=units.unit \n\
        WHERE \n\
            outputs.asset is ? \n\
            AND outputs.address = ? \n\
            AND outputs.is_spent = 0 \n\
            AND units.sequence = 'good' \n\
            AND units.is_stable = 1  ",
        [asset,address],
        function(rows){
            var balance = rows[0].balance;
            balance = (balance==null?0:balance)
            callback(asset, balance);
        }
    )
}

function readWalletId(cb){
    db.query("select wallet from my_addresses limit 1",
        [],
        function(rows){
            cb(rows[0].wallet);
        })
}

readWalletId(function (id) {
    walletID = id
})


userService.address = function () {
    var walletDefinedByKeys = require('trustnote-common/wallet_defined_by_keys.js');
    walletDefinedByKeys.issueNextAddress(walletID, 0, function(addressInfo){
        console.log(JSON.stringify(addressInfo))
    })
}

module.exports = userService
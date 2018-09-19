
const crypto = require('crypto')
const user = require('../dao/userDAO')
const tutils = require('../util/utils')
const userService = require('../services/userService')

module.exports = {
    addRandomBytes: function (req, res, next) {
        var randomStr = crypto.randomBytes(32).toString('base64')
        user.addRandomBytes(randomStr).then(function (resData) {
            res.json({
                errCode:0,
                errMsg:'success',
                data:randomStr
            })
        })
    },

    performLogin: function (req, res, next) {
        var xPub = req.body.extendedpubkey
        var sig = req.body.sig
        var data = req.body.data
        var addrIndex = req.body.max_index

        userService.doLogin(xPub,sig,data,addrIndex,function (data) {
            res.json(data)
        })
    },

    checkLoginState: function (req, res, next) {
        var data = req.query.data

        if (data===null){
            res.json({errCode: 1,
            errMsg:'data can not be empty'})
        }

        user.queryLoginState(data).then(function (results) {
            if (results.length) {

                user.updateDataAsused(data)

                res.json({errCode:0,
                    errMsg:'success',
                data:results})
            }
            else {
               res.json({errCode:1,
               errMsg:'not login'})
            }
        })
    }
}
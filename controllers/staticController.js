const Static = require('../dao/statisticsDAO')
const httputil = require('../util/httpUtil')
const tutil = require('../util/utils')
const staticService = require('../services/staticService')
const staticController = {

    recentMonthTxs: function (req, res, next) {
        var xPub = req.query.extendedpubkey
        var asset = req.query.asset
        Static.recentMonthTxs(asset, xPub).then(function (results) {
            res.json({
                errCode: 0,
                errMsg: 'success',
                data: tutil.processMonthlyReport(results)
            })
        })
    },

    topHolder: function (req, res, next) {
        var asset = req.query.asset
        Static.topHolder(asset).then(function (results) {
            res.json({
                errCode: 0,
                errMsg: 'success',
                data: results
            })
        })
    },

    myhistoryTxs: function (req, res, next) {
        var pagesize = parseInt(req.query.pagesize)
        var pageindex = parseInt(req.query.pageindex)
        var start_index = pagesize * pageindex
        var asset = req.query.asset
        var extendedpubkey = req.query.extendedpubkey

        staticService.scanMytx(extendedpubkey, asset, start_index, pagesize, function (results) {
            res.json({
                errCode: 0,
                errMsg: 'success',
                data: results
            })
        })

    },

    allhistoryTxs: function (req, res, next) {
        var pagesize = parseInt(req.query.pagesize)
        var pageindex = parseInt(req.query.pageindex)
        var start_index = pagesize * pageindex
        var asset = req.query.asset

        staticService.scanAllTx(asset, start_index, pagesize, function (data) {
            res.json({
                errCode: 0,
                errMsg: 'success',
                data: data
            })
        })
    },

    allAsset: function (req, res, next) {
        var xPub = req.query.extendedpubkey
        Static.allAsset(xPub).then(function (results) {
            // fetch other asset info from external server
            httputil.asyncGroupFetch(results, function (data) {
                res.json({
                    errCode: 0,
                    errMsg: 'success',
                    data: data
                })
            })
        })
    },

    assetInfo: function (req, res, next) {
        var asset = req.query.asset
        var xPub = req.query.extendedpubkey

        staticService.scanAssetInfo(asset, xPub, function (data) {
            res.json({
                errCode: 0,
                errMsg: 'success',
                data: data
            })
        })
    }
}

module.exports = staticController
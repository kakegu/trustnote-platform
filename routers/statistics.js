const express   = require('express')
const staticController    = require('../controllers/staticController')
const router    = express.Router()

router.get('/topholder', function (req, res, next) {
    staticController.topHolder(req, res, next)
})

router.get('/allhistory', function (req, res, next) {
    staticController.allhistoryTxs(req, res, next)
})

router.get('/history', function (req, res, next) {
    staticController.myhistoryTxs(req, res, next)
})

router.get('/allasset', function (req, res, next) {
    staticController.allAsset(req, res, next)
})

router.get('/static', function (req, res, next) {
    staticController.recentMonthTxs(req, res, next)
})

router.get('/assetinfo', function (req, res, next) {
    staticController.assetInfo(req, res, next)
})

router.get('/')

module.exports = router

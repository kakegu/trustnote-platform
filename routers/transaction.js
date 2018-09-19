const express   = require('express')
const router    = express.Router()
const outputsController = require('../controllers/outputsController')

router.post('/addoutputs', function (req, res, next) {
    outputsController.addOutputs(req,res,next)
})

router.post('/updateoutputs', function (req, res, next) {
    outputsController.updateOutputs(req,res,next)
})

router.get('/getoutputs', function (req, res, next) {
    outputsController.queryOutputs(req,res,next)
})

router.get('/txstate', function (req, res, next) {
    outputsController.queryOutputsState(req,res,next)
})

router.get('/groupaddress', function (req, res, next) {

})

router.post('/grouppayment', function (req, res, next) {

})



module.exports = router

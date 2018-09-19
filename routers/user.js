const express   = require('express')
const User      = require('../controllers/users')
var jwt = require('jsonwebtoken')
const conf = require('../conf/token')
const router    = express.Router()

// login
router.get('/randomBytes', function (req, res, next) {
    User.addRandomBytes(req, res, next)
})

router.get('/checklogin', function (req, res, next) {
    User.checkLoginState(req, res, next)
})

router.post('/login',function (req, res, next) {
    User.performLogin(req, res, next)
})

router.get('/access', function (req, res, next) {
    var token = jwt.sign({ userId: '83e03ef3fae0fdb2dc4334f6ce20ffce65e46fca' }, conf.secret,{
        expiresIn: 60*60*24
    })
    res.json(token)
})

module.exports = router



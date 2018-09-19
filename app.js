const express = require('express')
const bodyParser = require('body-parser')
const logger = require('morgan')
var app = express()
var server = require('http').createServer(app)
app.use(bodyParser.json({limit: '1mb'}));  //这里指定参数使用json格式
app.use(bodyParser.urlencoded({
    extended: false
}))

app.use(logger('combined'))




// const userRoute = require('./routers/user')
const statisticRoute = require('./routers/commonStatics')
// const txRoute = require('./routers/transaction')
const trustNotetxRoute = require('./routers/trustnoteTxs')
// app.use('/api/user', userRoute)
// app.use('/api/static', statisticRoute)
// app.use('/api/tx', txRoute)
app.use('/api/v1/asset', trustNotetxRoute)
app.use('/api/v1/query',statisticRoute)



app.use(function (error,req,res,next) {
    res.status(500).json({
        errCode:error.errcode?error.errcode:9999,
        errMsg:error.message
    })
})


server.listen(3007)

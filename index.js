var db = require('trustnote-common/db.js')
var util = require('util')
var schedule = require('node-schedule')
var express = require('express');
var async = require("async")
var crypto = require('crypto')
var StaticModel = require('./sql.js')
var tutil = require('./utils')
var bodyParser = require('body-parser')
const request = require('request')
var conf = require('./conf')

// var multipart = require('connect-multiparty');

// var multipartMiddleware = multipart();
var app = express();
var server = require('http').createServer(app);
app.use(bodyParser.json({limit: '1mb'}));  //这里指定参数使用json格式
app.use(bodyParser.urlencoded({
  extended: false
}));


var cors = require('cors')

const corsOptions = {
  origin: 'http://localhost:8080',
  credentials: true,
}
app.use(cors(corsOptions))


app.post('/webwallet/login', function(req, res){
  var extendedpubkey = req.body.extendedpubkey
  var sig = req.body.sig
  var data = req.body.data
  var max_index = parseInt(req.body.max_index)
  // TODO:
  
  perfomLogin(data,sig,extendedpubkey,max_index,function(error){
    res.send(error)
  })
})

app.get('/webwallet/random', function(req, res){
  var randomStr = crypto.randomBytes(32).toString('base64')
  StaticModel.addRandomData(randomStr,function(){
    res.send({errCode:0,
      errMsg:"success",
      data:{data:randomStr}})
  })
})

app.get('/webwallet/checkloginstate', function(req, res){
  var data = req.query.data
  StaticModel.vertfifyLoginState(data,function(rows){
    if(rows.length){
      res.send({errCode:0,
        errMsg:"success",
        data:{extendedpubkey:rows[0].extendedpubkey}}
      )
    }
    else {
      res.send({
        errCode:1,
        errMsg:"error"
      })
    }
  })
})
// extendedpubkey查询所有的资产以及余额
app.get('/webwallet/allasset', function(req,res){

  console.log('all asset')
  var extendedpubkey = req.query.extendedpubkey
  StaticModel.allTokens(extendedpubkey,function(data){
    var assets = []
    data.forEach(item => {
      assets.push(item.asset)
    })
    fetchTokenDetailx(assets, data,function(data){
      res.send({
        errCode:0,
        errMsg:"success",
        data:data
      })
    })
  })
})

//extendpubkey,assetID查询交易记录
app.get('/webwallet/history', function(req,res){
  //  
  var pagesize = parseInt(req.query.pagesize)
  var pageindex = parseInt(req.query.pageindex)
  var start_index = pagesize*pageindex
  var asset = req.query.asset
  var extendedpubkey = req.query.extendedpubkey
  async.waterfall([
    //查询
    function(cb){
      var orisql = "SELECT DISTINCT ( unit ), creation_date FROM units CROSS JOIN outputs USING ( unit ) WHERE outputs.asset = '%s' AND outputs.address IN ( SELECT address FROM web_addresses WHERE extendedpubkey = '%s' ) UNION SELECT DISTINCT ( unit ), creation_date FROM units CROSS JOIN inputs USING ( unit ) WHERE inputs.asset = '%s' AND inputs.address IN ( SELECT address FROM web_addresses WHERE extendedpubkey = '%s' ) ORDER BY creation_date DESC LIMIT %s,%s"
      var sql = util.format(orisql,asset,extendedpubkey,asset,extendedpubkey,start_index,pagesize)
      db.query(util.format(orisql,asset,extendedpubkey,asset,extendedpubkey,start_index,pagesize), function (rows) {
        // get units
        cb(null,rows)
      })
    },
    function(data,cb){
      // get transaction for each unit
      console.log(JSON.stringify(data))
      var array = []
      data.forEach(item => {
        array.push(item.unit)
      });
      scanDetail(array,asset,extendedpubkey,function(results){
        res.send({
          errCode:0,
          errMsg:'success',
          data:results
        })
      })
    }
  ],function(error){
     if(error){
      res.send({
        errCode:1,
        errMsg:error.message
      })
     }
  })
})

// assetid all history 
app.get('/webwallet/allhistory', function(req,res){
  var asset = req.query.asset
  var pagesize = parseInt(req.query.pagesize)
  var pageindex = parseInt(req.query.pageindex)
  var start_index = pagesize*pageindex
  var orisql = "SELECT unit, ( payload_commission + headers_commission ) AS fees, sum( amount ) AS amount, main_chain_index FROM units JOIN outputs USING ( unit ) WHERE outputs.asset = '%s' GROUP BY unit ORDER BY main_chain_index DESC LIMIT %s,%s"


  async.series({
    count:function(callback){
      var orisql1 = "SELECT count(DISTINCT(unit)) as count FROM units JOIN outputs USING ( unit ) WHERE outputs.asset = '%s'"
      db.query(util.format(orisql1,asset), function (rows) {
        callback(null,rows[0].count)
      })
    },
    data:function(callback){
      db.query(util.format(orisql,asset,start_index,pagesize), function (rows) {
        //
        callback(null,rows)
      })

    }
  }, function(error,result){
    res.send({
      errCode:0,
      errMsg:'success',
      data:result
    })
  })

})

// assetSummery
app.get('/webwallet/assetinfo', function(req, res){
  var asset = req.query.asset
  var extendedpubkey = req.query.extendedpubkey
  StaticModel.tokenSummery(asset,extendedpubkey, function(data){
    var requesturl = conf.webservice_url+encodeURIComponent(asset)
    request(requesturl, { json: true }, (err, ress, body) => {
      if (err) { return console.log(err)}
      else{
        var date = new Date(parseInt(body.data.createTime))
        var dateString = date.toLocaleString()

        var item = {
          symbol:body.data.symbol,
          desc:body.data.descript,
          tokenName:body.data.assetName,
          issuer:body.data.issuserName,
          ctime:dateString
        }

        res.send({
          errCode:0,
          errMsg:"success",
          data:Object.assign(item, data)
        })
      }
  })
})
})

// recent 30 days static
app.get('/webwallet/static', function(req, res){
  var asset = req.query.asset
  var extendedpubkey = req.query.extendedpubkey
  StaticModel.recentMonth(asset,extendedpubkey, function(data){
    res.send({
      errCode:0,
      errMsg:"success",
      data:data
    })
  })
})
// topHolder
app.get('/webwallet/topholder', function(req, res){
  var asset = req.query.asset
  StaticModel.topHolder(asset, function(data){
    res.send({
      errCode:0,
      errMsg:"success",
      data:data
    })
  })
})

// add input,return txid
app.post('/webwallet/addoutputs', function(req, res){
  var asset = req.body.asset
  var outputs = req.body.outputs
  var message =req.body.message
  try {
    StaticModel.addOutputs(asset,outputs,message,function(txid){
      if(!txid) {
        res.send({errCode:1,
          errMsg:'asset not valid'})
      }
      else {
        res.send({errCode:0,
          errMsg:'success',
          data:{'txid':txid}})
      }
    })
  } catch (error) {
    res.send({errCode:1,
              errMsg:error.message})
  }
})

// get input though txid
app.get('/webwallet/getoutputs', function(req,res) {
  var txid = req.query.txid
  StaticModel.getOutputs(txid,function(rows){
    if(0 == rows.length) {
      res.send({errCode:1,
        errMsg:"txid not found"})
    }
    else {
      var assetid = rows[0].asset
      fetchTokenDetail([assetid],function(results){
        res.send({errCode:0,
          errMsg:"success",
          data:{outputs:JSON.parse(rows[0].outputs),
                message:rows[0].message,
                assetName:results[0].symbol,
                asset:rows[0].asset}})
      })
    }       
  })
})

app.post('/webwallet/updateoutputs', function(req,res) {
  var txid = req.body.txid
  var unit = req.body.unit
  StaticModel.updateOutputs(txid,unit,function(count){
    if(0 == count) {
      res.send({errCode:1,
        errMsg:"txid not found"})
    }
    else {
      res.send({errCode:0,
                errMsg:"success"
               })
    }
  })
})

app.get('/webwallet/txstate', function(req,res) {
  var txid = req.query.txid
  StaticModel.checkTxState(txid,function(rows){
    if(0 == rows.length) {
      res.send({errCode:1,
        errMsg:"no unit found"})
    }
    else if(rows[0].unit==''){
        res.send({errCode:1,
            errMsg:"no unit found"})
    }
    else {
      res.send({errCode:0,
                errMsg:"success",
                data:{"unit":rows[0].unit}
               })
    }
    
  })
})


// query asset

function scanDetail (units,asset,extendedpubkey,cb){
  var results = []
  async.eachSeries(units,function(unit,callback){
    console.log(unit)
    var belongsmepayeeAddress = []
    var belongsmepayerAddress = []
    async.waterfall([
      //payer
      function(cb){
        var orisql = "select DISTINCT(address) from web_addresses where extendedpubkey='%s' and address in (select address from inputs where inputs.unit='%s' AND inputs.asset='%s')"
        db.query(util.format(orisql,extendedpubkey,unit,asset), function(rows){
          console.log('付款人地址'+JSON.stringify(rows))
          rows.forEach(item => {
            belongsmepayerAddress.push(item.address)
          });
          cb(null)
        })
      },
      //payee
      function(cb){
        var orisql = "select DISTINCT(address) from web_addresses where extendedpubkey='%s' and address in (select address from outputs where outputs.unit='%s' AND outputs.asset='%s')"
        db.query(util.format(orisql,extendedpubkey,unit,asset), function(rows){
          console.log('收款人地址'+JSON.stringify(rows))
          rows.forEach(item => {
            belongsmepayeeAddress.push(item.address)
          });
          cb(null)
        })
      },
      //outputs and inputs
      function(cb){
        var orisql = "SELECT unit, creation_date,LEVEL, is_stable, sequence, address, headers_commission + payload_commission AS fee, SUM( amount ) AS amount, address AS to_address, NULL AS from_address, main_chain_index AS mci FROM units CROSS JOIN outputs USING ( unit ) where units.unit='%s' AND outputs.asset='%s' GROUP BY unit, address union SELECT unit, creation_date,LEVEL, is_stable, sequence, address, headers_commission + payload_commission AS fee, SUM( amount ) AS amount, null AS to_address, address AS from_address, main_chain_index AS mci FROM units CROSS JOIN inputs USING ( unit ) where units.unit='%s' AND inputs.asset='%s' GROUP BY unit, address"
        var sql = (util.format(orisql,unit,asset,unit,asset))
        db.query(util.format(orisql,unit,asset,unit,asset), function(rows) {
          // console.log(JSON.ST)
          cb(null,rows)
        })
      },
      //process outputs and inputs,combile it Array
      function(data,cb){
        //spilt into outputs
        //split into inputs
        var result = calculate(belongsmepayeeAddress,belongsmepayerAddress,data)
        result.forEach(element => {
          results.push(element)
        })
        cb(null)
      }
  
    ],function(error){
      // in
      callback(null)
    })

  },function(error){
     // 
     cb(results)
     console.log("success")
  })
}

function calculate(payees,payers,data){
  //
  var results = []
  var type = txType(payees,payers,data)
  var fee = data[0].fee
  var unit = data[0].unit
  var date = data[0].creation_date
  data.forEach(item => {
    if(item.to_address){
      //根据收款方，遍历
      var amount = item.amount
      var address = item.address
      if(1==type){
        //付款，要过滤掉找零的地址
        if(payees.indexOf(address)>-1) {
          return
        }
        else {
          // 添加记录
        }
      }
      //收款，只显示属于我的
      else if(2==type){
        if(payees.indexOf(address)>-1) {
          // 添加记录
        }
        else {
          return
        }
      }
      else if(3==type) {
        //移动，显示所有的
      }
      //

      var result = {
        "fee":fee,
        "unit":unit,
        "type":type,
        "date":date.toLocaleDateString()+' '+date.toLocaleTimeString(),
        "amount":amount,
        "address":address
      }
      results.push(result)
    }
  })
  return results
}
/**
 * 
 * 3:移动  付款地址，收款地址全属于我自己的，移动
 * 2：收款
 * 1：付款  
 * @param {*} payers 属于我自己的额付款地址
 * @param {*} payees 属于我自己的收款地址
 * @param {*} data 
 */
function txType(payees,payers,data){
  var i
  var count = 0
  // 计算outputs的地址数量
  for(i=0; i<data.length; i++) {
    count += data[i].to_address?1:0
  }
  //所有收款人都是我自己，移动
  if(count==payees.length){
    return 3
  }
  //去扫描有没有付款方式是我的，有的话，就是付钱
  for(i=0; i<data.length; i++) {

    for(j=0; j<payers.length; j++) {
      if (payers[j]==data[i].from_address){
        return 1
      }
    }
  }
  //收钱
  return 2
}
// 付出的钱，扣掉自己的额
function calPayment (addresses, data) {
  var amount=0
  for(var i = 0;i<data.length; i++){
    var to_address = data[i].to_address
    //没有 to_address,不是
    if(!to_address){
      continue
    }
    else {
      if (!(addresses.indexOf(to_address) > -1)) {
        amount+=parseInt(data[i].amount)  
      }
    }
  }
  return amount
}


//收到的钱，只计算自己的额
function calReceived (addresses, data) {
  var amount=0
  for(var i = 0;i<data.length; i++){
    var to_address = data[i].to_address
    //没有 to_address,不是
    if(!to_address){
      continue
    }
    else {
      if (addresses.indexOf(to_address) > -1) {
        amount+=parseInt(data[i].amount)  
      }
    }
  }
  return amount
}

//移动的钱
function calMoved (addresses, data) {
  var amount=0
  for(var i = 0;i<data.length; i++){
    var to_address = data[i].to_address
    //没有 to_address,不是
    if(!to_address){
      continue
    }
    else {
      amount+=parseInt(data[i].amount)  
    }
  }
  return amount
}
// TODO catchup address
function perfomLogin(b64_data,sig,extendedpubkey,max_index,callback){
  async.waterfall([
    function(cb){//if exist
      StaticModel.checkExistence(b64_data,function(length){
      if (!length) {
        cb(new Error("invalid data"))
      }
      else {
        cb(null,length)
      }
    })
  },
  function(length,cb){
    // check signature
    try {
      var result = tutil.checkSig(extendedpubkey,sig,b64_data)
      if (result) {
        StaticModel.updateLoginInfo(extendedpubkey,b64_data,max_index,function(){
          // set status as vetified
          cb(null)
        })
      }
      else {
        cb(new Error("invalid sig"))
      }
    } catch (error) {
      // return error response
      cb(error)
    }
  }],function(error){
    var result
    if (error) {
      result = {
        errCode:1,
        errMsg:error.message
      }
    }
    else {
      result = {
        errCode:0,
        errMsg:"success"
      }
    }
    callback(result)
  })
}

// 获取token详情
function fetchTokenDetail(assets,callbacks) {
  var results=[]
  async.eachSeries(assets, function(asset,callback) {
    var requesturl = conf.webservice_url+encodeURIComponent(asset)
    request(requesturl, { json: true }, (err, ress, body) => {
      if (err) { return console.log(err)}
      else{
        var date = new Date(parseInt(body.data.createTime))
        var dateString = date.toLocaleString()
        var item = {
          symbol:body.data.symbol,
          desc:body.data.descript,
          tokenName:body.data.assetName,
          issuer:body.data.issuserName,
          assetid:body.data.assetId,
          totalSupply:body.data.cap,
          ctime:dateString
        }
        results.push(item)
        callback(null)
      }
  })
  },function(error) {
    callbacks(results)
  }) 
}
function fetchTokenDetailx(assets,data,callbacks) {
  var results=[]
  async.eachSeries(assets, function(asset,callback) {
    var requesturl = conf.webservice_url+encodeURIComponent(asset)
    request(requesturl, { json: true }, (err, ress, body) => {
      if (err) { return console.log(err)}
      else{
        var date = new Date(parseInt(body.data.createTime))
        console.log("data:"+JSON.stringify(body.data))
        var dateString = date.toLocaleString()
        var item = {
          symbol:body.data.symbol,
          desc:body.data.descript,
          tokenName:body.data.assetName,
          issuer:body.data.issuserName,
          assetid:body.data.assetId,
          totalSupply:body.data.cap,
          ctime:dateString,
          amount:getAmount(data,body.data.assetId)
        }
        // remove empty item
        if(body.data.symbol){
        results.push(item)
        }
        callback(null)
      }
  })
  },function(error) {
    callbacks(results)
  }) 
}

function getAmount(data,asset){
  for(var i = 0;i<data.length;i++){
    if(data[i].asset==asset){
      return data[i].amount
    }
  }
  return 0
}

app.get('/test.html', function getState(req,res,next){
  res.sendfile(`${__dirname}/index.html`)
})

server.listen(3005)
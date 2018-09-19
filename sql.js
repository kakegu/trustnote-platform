var db = require('trustnote-common/db.js')
var util = require('util')
var async = require("async")
var tutils = require('./utils')
var moment = require('moment')
var crypto = require('crypto')
var chash = require('trustnote-common/chash.js')

var StaticModel = function () {

}

StaticModel.addRandomData = function (data, cb) {
  var orisql = "INSERT INTO web_vertification(data,date) values ('%s',CURDATE())"
  db.query(util.format(orisql,data), function(rows){
      cb()
  })
}

StaticModel.updateLoginInfo = function (extended_pubkey,data,max_index,cb) {
  // TODO
  updateVertifiedState(data,extended_pubkey)
  var orisql = "select * from web_login where extendedpubkey = '%s' order by max_index DESC"
  db.query(util.format(orisql,extended_pubkey),function(rows){
    if(1 == rows.length) {
      var startIndex = parseInt(rows[0].max_index)
      //多往前扫20个地址
      max_index=(startIndex-max_index>=20)?startIndex:max_index+20
      var orisql = "update web_login set max_index = %s where extendedpubkey='%s'"
      db.query(util.format(orisql,max_index,extended_pubkey),function(rows){
        addCatchedUpAddress(extended_pubkey,startIndex,max_index)
        cb()
     })
    }
    else {
      var orisql = "insert into web_login (extendedpubkey,max_index) values('%s','%s')"
      db.query(util.format(orisql,extended_pubkey,max_index),function (rows){
        var offset = 20
        addCatchedUpAddress(extended_pubkey,0,max_index+offset)
        cb()
     })
    }
  })
}

function updateVertifiedState(b64_data,extendedpubkey) {
  var orisql = "update web_vertification set vertified = 1,extendedpubkey='%s' where data='%s'"
  db.query(util.format(orisql,extendedpubkey,b64_data),function(rows){

 })
}

function updateUedState(b64_data) {
  var orisql = "update web_vertification set used = 1 where data='%s'"
  db.query(util.format(orisql,b64_data),function(rows){
 })
}

/**
 * 检查用户是否已经登录成功
 * @param {*} data 
 * @param {*} cb 
 */
StaticModel.vertfifyLoginState = function (data,cb) {
  var orisql = "select extendedpubkey from web_vertification where used=0 and vertified=1 and data='%s'"
  db.query(util.format(orisql,data),function(rows){
    //将used状态设置为1，说明此验证码已被使用过
    if(rows.length==1) {
    updateUedState(data)
    }
    cb(rows)
 })
}


/**
 * insert new address into database
 * @param {*} extended_pubkey 
 * @param {*} addressArray 
 */
StaticModel.updateAddress = function (extended_pubkey,addressArray) {
  var orisql = "INSERT INTO alladdress ('extendedpubkey','address','path') values %s"
  var placeholder = Array.apply()
  db.query(util.format(orisql,placeholder), function () {

  })

}

StaticModel.scanFreshAddress = function (extended_pubkey,index) {
  // scan next 20 address if has transaction
  // if exist transaction  saveAddress, scan next 20 address,  scanFreshAddress
  // not exist, exit,
  // update max_index
  var addresses = tutils.derive20Address(extended_pubkey,index)
  var orisql = "SELECT 1 FROM INPUTS WHERE ADDRESS IN %s UNION SELECT 1 FROM OUTPUTS WHERE ADDRESS IN %s "
  db.query(util.format(orisql),function (rows){
    if(rows.length>0){
      
      this.scanFreshAddress(extended_pubkey,index+20)
    }
    else {
      cb()
    }
  })
}

StaticModel.checkExistence = function (data,cb) {
  var orisql = "SELECT 1 FROM web_vertification WHERE data='%s'"
  db.query(util.format(orisql,data),function(rows){
    cb(rows.length)
  })
}

function addCatchedUpAddress(extendedpubkey,from_index,to_index) {
  var results = tutils.catchUpAddress(extendedpubkey,from_index,to_index)
  var resultsSql = formatSQLString(results)
  if(0 ==results.length){
    return
  }
  var orisql = "INSERT INTO web_addresses (extendedpubkey,address,address_index) values %s"
  db.query(util.format(orisql,resultsSql),function(rows){

  }).catch((err)=> {
      console.log('error happens at web_address')
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
// get all tokens
StaticModel.allTokens = function (extendedpubkey,cb) {
  var orisql = "SELECT SUM(amount)as amount, asset FROM outputs WHERE is_spent=0 AND asset IS NOT NULL AND address in (SELECT address FROM web_addresses WHERE extendedpubkey='%s') GROUP BY asset"
  db.query(util.format(orisql,extendedpubkey), function(rows){
    cb(rows)
  }) 
}

// get topholder
StaticModel.topHolder = function(asset,cb) {
  var orisql = "SELECT unit AS asset, cap, address, sum AS amount, sum/cap * 100 AS percentage, @row_number := @row_number + 1 AS rank FROM ( SELECT * FROM ( SELECT unit, cap FROM assets WHERE assets.unit = '%s' ) AS newtable ) AS atable LEFT JOIN ( SELECT asset, address, sum( amount ) AS sum FROM outputs WHERE is_spent = 0 AND asset = '%s' GROUP BY address ORDER BY sum DESC ) AS ctable ON atable.unit = ctable.asset, ( SELECT @row_number := 0 ) AS t ORDER BY sum DESC, rank ASC LIMIT 100"
  var sql = util.format(orisql,asset,asset)
  db.query(util.format(orisql,asset,asset), function(rows){
    cb(rows)
  })
}
// token Summery
StaticModel.tokenSummery = function(asset,extendedpubkey,cb) {
  async.series({
    totalSupply:function(cb){
      var orisql = "SELECT cap FROM assets WHERE unit = '%s'"
      db.query(util.format(orisql,asset), function(rows){
        cb(null,rows[0].cap)
      })
    },
    tokenHolders:function(cb){
      var orisql = "SELECT COUNT(DISTINCT(address)) as count FROM outputs WHERE outputs.asset = '%s' AND is_spent=0 "
      db.query(util.format(orisql,asset), function(rows){
        cb(null,rows[0].count)
      })
    },
    recentdayTxs:function(cb){
      var orisql = "SELECT COUNT(DISTINCT(unit)) as count FROM units JOIN outputs USING(unit) WHERE outputs.asset = '%s' AND address in (SELECT address FROM web_addresses WHERE extendedpubkey='%s') AND creation_date> NOW() + INTERVAL - 24 HOUR"
      db.query(util.format(orisql,asset,extendedpubkey), function(rows){
        cb(null,rows[0].count)
      })
    },
    allhistoryTxs:function(cb){
      var orisql = "SELECT COUNT(DISTINCT(unit)) as count FROM units JOIN outputs USING(unit) WHERE outputs.asset = '%s' "
      db.query(util.format(orisql,asset), function(rows){
        cb(null,rows[0].count)
      })
    },
    myBalance:function(cb){
      var orisql = "SELECT SUM(amount) as amount FROM outputs WHERE outputs.asset = '%s' AND is_spent=0 AND address in (SELECT address FROM web_addresses WHERE extendedpubkey='%s')"
      db.query(util.format(orisql,asset,extendedpubkey), function(rows){
        cb(null,rows[0].amount)
      })
    }
  },function(error,result){
    cb(result)
  })
}

// Monthly static
StaticModel.recentMonth = function(asset,extendedpubkey,cb){
  var orisql = "SELECT count( * ) AS count, CAST( creation_date AS DATE ) AS date FROM units JOIN outputs USING(unit) WHERE unit IN ( SELECT DISTINCT ( unit ) FROM outputs WHERE asset = '%s') AND address in (SELECT address FROM web_addresses WHERE extendedpubkey='%s') AND units.creation_date > NOW( ) + INTERVAL - 768 HOUR GROUP BY date"
  var sql = util.format(orisql,asset,extendedpubkey)
  db.query(util.format(orisql,asset,extendedpubkey), function(rows) {
    // this 
    var data = processMonthlyReport(rows)
    cb(data)
  })
}

// add outputs
StaticModel.addOutputs = function(asset,data,message,callback){
  var dataString = JSON.stringify(data)
  validateoutputs(asset,message,data)
  async.series({
    validate:function(cb){
      var orisql = "SELECT 1 FROM assets where unit='%s'"
      db.query(util.format(orisql,asset), function(rows){
        if(rows.length==0) {
          cb(new Error('asset not valid'))
        }
        else{
          cb(null,1)
        }
      })
    },
    insert:function(cb){

      var txid = crypto.randomBytes(32).toString('hex')
      if(message){
        var orisql = "INSERT INTO web_outputs(asset,message,txid,outputs) VALUES ('%s','%s','%s','%s')"
        db.query(util.format(orisql,asset,message,txid,dataString), function(rows){
          callback(txid)
        })
      }
      else{
        var orisql = "INSERT INTO web_outputs(asset,txid,outputs) VALUES ('%s','%s','%s')"
        var qq = util.format(asset,txid,dataString)
        db.query(util.format(orisql,asset,txid,dataString), function(rows){
          callback(txid)
        })
      }
    }
  },function(error,result){
    if(error){
      callback(null)
    }
  })
}

StaticModel.getOutputs = function(txid,cb){
  var orisql = "SELECT * FROM web_outputs where txid='%s'"
  db.query(util.format(orisql,txid), function(rows){
    cb(rows)
  })
}

StaticModel.updateOutputs = function(txid,unit,cb){
  var orisql = "UPDATE  web_outputs SET unit='%s' where txid='%s'"
  db.query(util.format(orisql,unit,txid), function(rows){
    cb(rows.affectedRows)
  })
}

StaticModel.checkTxState = function(txid,cb){
  var orisql = "SELECT unit FROM web_outputs where txid='%s'"
  db.query(util.format(orisql,txid), function(rows){
    cb(rows)
  })
}




/**
 * 统计有部分是空的，需要通过程序补齐
 * @param {*} data 
 */
function processMonthlyReport(data) {
  var days =[]
  for(var i =0;i<31;i++) {
    var date =moment().subtract(i, 'days').format('YYYY-MM-DD',{ trim: true })
    days.push(date.replace(/-0+/g, '-'))
  }
  return getCount(data,days)
}

function getCount(data,days){
  var static = []
  var day
  for(var idx=0;idx<days.length;idx++){
    day = days[idx]
    var count = 0
    for(var i=0;i<data.length;i++){
      var dateString = data[i].date.toLocaleDateString()
      if(dateString==day){
        count = data[i].count?data[i].count:0
        break
      }
      else{
      }
    }
    var item={day:day,count:count}
    static.push(item)
  
  }
  return static
}

validateoutputs = function(asset,message,outputs){
  //asset exist??
  //message length??
  //outputs:size,address,amount
  if(message&&message.length>100){
    throw new Error('message too long')
  }
  if(!Array.isArray(outputs)){
    throw new Error('outputs should be JSON Array')
  }
  if(outputs.length==0){
    throw new Error('empty outputs')
  }
  if(outputs.length>127){
    throw new Error('exceed max outputs size,outputs size should be less than 127')
  }
  for(var i =0;i<outputs.length;i++){
    var address = outputs[i].address
    var amount = outputs[i].amount
    
    try{
      var valid = chash.isChashValid(address);
      if(!valid){
        throw new Error(address+' address not valid')    
      }
    }catch(ex){
     throw new Error(address+' address not valid')    
    }
    if(!Number.isInteger(amount)||amount<0){
      throw new Error('amount should be a positive number')
    }
  }
}
  



module.exports = StaticModel
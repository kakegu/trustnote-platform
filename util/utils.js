var util = require('util')
var Bitcore = require('bitcore-lib');
var signature = require('trustnote-common/signature')
var moment = require('moment')
var objectHash = require('trustnote-common/object_hash.js')
var tutils = function () {
    //
}

const loginpath = "m/1/1024"
const basicPath = "m/0/%s"
const basicChangePath = "m/1/%s"

tutils.derivePubkey = function (extendedpubkey,path) {
  var hdPubKey = new Bitcore.HDPublicKey(extendedpubkey)
  return hdPubKey.derive(path).publicKey.toBuffer().toString("base64")
}

tutils.deriveAddress = function (pubkey) {
  var arrDefinition = ['sig', {pubkey: pubkey}]
  var address = objectHash.getChash160(arrDefinition)
  return address
}

tutils.derive20Address = function (extendedpubkey,start_index) {
  var results = []
  for(i=0; i<20; i++) {
      var pubkey = this.derivePubkey(extendedpubkey,i+start_index)
      var address = this.deriveAddress(pubkey)
      results.push(address)
  }
  return results
}

//
tutils.deriveGroupAddress = function (extendedpubkey,from_address,to_address) {
  var results = []

  // address
  for(i=from_address; i<to_address; i++) {
    var pubkey = this.derivePubkey(extendedpubkey,util.format(basicPath,i))
    var address = this.deriveAddress(pubkey)
    var item = {
      extendedpubkey:extendedpubkey,
      index:i,
      address:address
    }
    results.push(item)
  }

  // change address
  for(i=from_address; i<to_address; i++) {
    var pubkey = this.derivePubkey(extendedpubkey,util.format(basicChangePath,i))
    var address = this.deriveAddress(pubkey)
    var item = {
      extendedpubkey:extendedpubkey,
      index:i,
      address:address
    }
    results.push(item)
  }

  return results
}


tutils.checkSig = function (extendedpubkey,b64_sig,b64_data) {
  var pubkey = this.derivePubkey(extendedpubkey,loginpath)
  try {
    var buf = Buffer.from(b64_data, 'base64');
    return signature.verify(buf,b64_sig,pubkey)
  } catch (error) {
    return false
  }
}

tutils.processMonthlyReport = function(data) {
    var days =[]
    for(var i =0;i<31;i++) {
        var date =moment().subtract(i, 'days').format('YYYY-MM-DD',{ trim: true })
        days.push(date.replace(/-0+/g, '-'))
    }
    return getCount(data,days)
}

function getCount(data,days){
    var statistic = []
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
        statistic.push(item)
    }
    return statistic
}


function checkAccessControl(res) {
}

function readUnit(unit) {
    conn = require('trustnote-common/db')


}




module.exports = tutils

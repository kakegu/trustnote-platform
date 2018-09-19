var util = require('util')
var Bitcore = require('bitcore-lib');
var signature = require('trustnote-common/signature')
var objectHash = require('trustnote-common/object_hash.js')
var tutils = function () {

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
tutils.catchUpAddress = function (extendedpubkey,from_address,to_address) {
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




module.exports = tutils

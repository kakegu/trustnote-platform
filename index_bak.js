var headlessWallet = require('trustnote-headless')
const fs = require('fs')
const db = require('trustnote-common/db.js')
const eventBus = require('trustnote-common/event_bus.js')
const constants = require('trustnote-common/constants.js')
var objectHash = require('trustnote-common/object_hash.js')
var Mnemonic = require('bitcore-mnemonic')
var ecdsaSig = require('trustnote-common/signature.js')
var validation = require('trustnote-common/validation.js')

function onError () {
  console.log('')
}

function getConfEntryByAddress(address) {
  // for (let item of genesisConfigData) {
  //     if(item["address"] === address){
  //         return item;
  //     }
  // }
  // console.log(" \n >> Error: witness address "
  // + address +" not founded in the \"bgensis.json\" file!!!!\n");
  // process.exit(0);
  //return null;
}

function getDerivedKey(mnemonic_phrase, passphrase, account, is_change, address_index) {
  console.log("**************************************************************");
  console.log(mnemonic_phrase);

  var mnemonic = new Mnemonic(mnemonic_phrase);
  var xPrivKey = mnemonic.toHDPrivateKey(passphrase);
  //console.log(">> about to  signature with private key: " + xPrivKey);
  var path = "m/44'/0'/" + account + "'/"+is_change+"/"+address_index;
  var derivedPrivateKey = xPrivKey.derive(path).privateKey;
  console.log(">> derived key: " + derivedPrivateKey);
  return derivedPrivateKey.bn.toBuffer({size:32});        // return as buffer
}

// signer that uses witeness address
var signer = {
  readSigningPaths: function(conn, address, handleLengthsBySigningPaths){
      handleLengthsBySigningPaths({r: constants.SIG_LENGTH});
  },
  readDefinition: function(conn, address, handleDefinition){
      // var conf_entry = getConfEntryByAddress(address);
     // console.log(" \n\n conf_entry is ---> \n" + JSON.stringify(conf_entry,null,2));
      // var definition = conf_entry["definition"];
      // handleDefinition(null, definition);
  },
  sign: function(objUnsignedUnit, assocPrivatePayloads, address, signing_path, handleSignature){
      var buf_to_sign = objectHash.getUnitHashToSign(objUnsignedUnit);
      var item = getConfEntryByAddress(address);
      var derivedPrivateKey = getDerivedKey(
          item["mnemonic_phrase"],
          item["passphrase"],
          0,
          item["is_change"],
          item["address_index"]
        );
      handleSignature(null, ecdsaSig.sign(buf_to_sign, derivedPrivateKey));
  }
};

function login () {
  // step1: read random string 
  // step2: sign the it with privateKey
}

function createPayment () {
  console.log('starting createPayment')
  var composer = require('trustnote-common/composer.js')
  var network = require('trustnote-common/network.js')
  var callbacks = composer.getSavingCallbacks({
    ifNotEnoughFunds: onError,
    ifError: onError,
    ifOk: function (objJoint) {
      network.broadcastJoint(objJoint)
    }
  })

  var fromAddress = 'MBYCM3KSIRWPC6FZGIPTD4GYYPODFVGB'
  var payeeAddress = 'XIM76DRNUNFWPXPI5AGOCYNMA3IOXL7V'
  var arrOutputs = [
    { address: fromAddress, amount: 0 },
    { address: payeeAddress, amount: 100000 }
  ]
  composer.setGenesis(false)
  composer.composePaymentJoint([fromAddress], arrOutputs, headlessWallet.signer, callbacks)
}

eventBus.once('headless_wallet_ready', function () {
  createPayment()
})

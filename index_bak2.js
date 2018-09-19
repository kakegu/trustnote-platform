var fs = require('fs');
var crypto = require('crypto');
var Mnemonic = require('bitcore-mnemonic');
var Bitcore = require('bitcore-lib');
var objectHash = require('trustnote-common/object_hash.js');
var ecdsa = require('secp256k1');
var signature = require('trustnote-common/signature')
var util = require('./utils')


const loginpath = 'm/1024/1024'

function derivePubkey(xPubKey, path){
  // convert xpubstring to xpubObject
  var hdPubKey = new Bitcore.HDPublicKey(xPubKey);
  var cc = hdPubKey._buffers.publicKey.toS;
  var xcd = hdPubKey.derive(path);

	return hdPubKey.derive(path).publicKey.toBuffer().toString("base64");
}

// get xPrivKey from mnemonic
var mnemonic = new Mnemonic('deal combine source range dilemma echo beach van harsh simple estate cover'); 

var xPrivKey = mnemonic.toHDPrivateKey();
var xPubKey  = Bitcore.HDPublicKey(xPrivKey).toString()


var rootpath = "m/44'/0'/0'";

//  通过这个key可以枚举出所有的钱包地址？？
var strXPubKey = Bitcore.HDPublicKey(xPrivKey.derive(rootpath)).toString();

console.log("strXpubKey: "+ strXPubKey)

// 生成pubkey
var pubkey = derivePubkey(strXPubKey, "m/"+1+"/"+1)
console.log("pubkey: "+ pubkey)

// ADDRESS  
var address = util.deriveAddress(pubkey)
console.log('address: '+address)

//生成私钥，用于签名

var path1 = "m/44'/0'/" + 0 + "'/"+1+"/"+1;
var privateKey = xPrivKey.derive(path1).privateKey;
var privKeyBuf = privateKey.bn.toBuffer({size:32})
// var buffer = crypto.randomBytes(32)
//var unit = '{"unit":{"version":"1.0","alt":"1","messages":[{"app":"text","payload_location":"inline","payload_hash":"1PCGnRBnli9zrCjfuo2VFxOv6XTMu1iRGxfvqYO086Q=","payload":"dear"},{"app":"payment","payload_location":"inline","payload_hash":"cgnKRGcbJJ4BPsGBctVHydWbYdI1WfzyhscMwmWqv8s=","payload":{"outputs":[{"address":"TIPXQ4CAO7G4C4P2P4PEN2KQK4MY73WD","amount":75},{"address":"YAZTIHFC7JS43HOYKGNAU7A5NULUUG5T","amount":4038}],"inputs":[{"unit":"piqJ/sIg72ETy9+2gJkKx3GbAzlHXGZYb8sbVj1LS7A=","message_index":0,"output_index":1}]}},{"app":"payment","payload_location":"inline","payload_hash":"K1QLmhig1D9evYulnnircDNwAXy8mWd9vgAl8wOObus=","payload":{"asset":"N4r1C7d2gI53QejTs5bx1wm27IrfD9mN2SrPeAoWU4k=","inputs":[{"unit":"gt0o49IDqPcrz49ZR1oDgHWxadI51YJ7lVf3gwjvCgU=","message_index":1,"output_index":0}],"outputs":[{"address":"TIPXQ4CAO7G4C4P2P4PEN2KQK4MY73WD","amount":1},{"address":"YAZTIHFC7JS43HOYKGNAU7A5NULUUG5T","amount":999}]}}],"authors":[{"address":"YAZTIHFC7JS43HOYKGNAU7A5NULUUG5T","authentifiers":{"r":"----------------------------------------------------------------------------------------"},"definition":["sig",{"pubkey":"AyIiqBX8LaRaBLrvoms3rZ5vivkK63Zy+tTSiSPCtrXK"}]}],"parent_units":["7i9XhE7NWW+HJzk0Rb90lBsoIWe2CkbuAqYHx5cvHPg="],"last_ball":"Q9ZRzkRKhNJ9qWNTyv0jbU2M4FR4fiInMnkyyIxV3cA=","last_ball_unit":"YbMcvBw3VR9ute2W4Pfbjm1a7vj0BHQ66l5kkVZvMIA=","witness_list_unit":"MtzrZeOHHjqVZheuLylf0DX7zhp10nBsQX5e/+cA3PQ=","headers_commission":391,"payload_commission":496,"unit":"1f9UWjTqZzrlO7b3zEkFPg9ALaN1T9goB8G0kDWlUXs=","timestamp":1531817132}}'
var unit = '{"unit":{"version":"1.0","alt":"1","messages":[{"app":"text","payload_location":"inline","payload_hash":"1PCGnRBnli9zrCjfuo2VFxOv6XTMu1iRGxfvqYO086Q=","payload":"dear"},{"app":"payment","payload_location":"inline","payload_hash":"cgnKRGcbJJ4BPsGBctVHydWbYdI1WfzyhscMwmWqv8s=","payload":{"outputs":[{"address":"TIPXQ4CAO7G4C4P2P4PEN2KQK4MY73WD","amount":75},{"address":"YAZTIHFC7JS43HOYKGNAU7A5NULUUG5T","amount":4038}],"inputs":[{"unit":"piqJ/sIg72ETy9+2gJkKx3GbAzlHXGZYb8sbVj1LS7A=","message_index":0,"output_index":1}]}},{"app":"payment","payload_location":"inline","payload_hash":"K1QLmhig1D9evYulnnircDNwAXy8mWd9vgAl8wOObus=","payload":{"asset":"N4r1C7d2gI53QejTs5bx1wm27IrfD9mN2SrPeAoWU4k=","inputs":[{"unit":"gt0o49IDqPcrz49ZR1oDgHWxadI51YJ7lVf3gwjvCgU=","message_index":1,"output_index":0}],"outputs":[{"address":"TIPXQ4CAO7G4C4P2P4PEN2KQK4MY73WD","amount":1},{"address":"YAZTIHFC7JS43HOYKGNAU7A5NULUUG5T","amount":999}]}}],"authors":[{"address":"YAZTIHFC7JS43HOYKGNAU7A5NULUUG5T","authentifiers":{"r":"Tdag779sWGkEQNWQgeqQ+mKRkzQ5vnLDwGdVto4kBJxiMii7JUnbORrMo9TvXju7F54wAMpNawsTs4O437Kdug=="},"definition":["sig",{"pubkey":"AyIiqBX8LaRaBLrvoms3rZ5vivkK63Zy+tTSiSPCtrXK"}]}],"parent_units":["7i9XhE7NWW+HJzk0Rb90lBsoIWe2CkbuAqYHx5cvHPg="],"last_ball":"Q9ZRzkRKhNJ9qWNTyv0jbU2M4FR4fiInMnkyyIxV3cA=","last_ball_unit":"YbMcvBw3VR9ute2W4Pfbjm1a7vj0BHQ66l5kkVZvMIA=","witness_list_unit":"MtzrZeOHHjqVZheuLylf0DX7zhp10nBsQX5e/+cA3PQ=","headers_commission":391,"payload_commission":496,"unit":"1f9UWjTqZzrlO7b3zEkFPg9ALaN1T9goB8G0kDWlUXs=","timestamp":1531817132}}'


var objUnsignedUnit = JSON.parse(unit)
// var buf_to_sign = objectHash.getUnitHashToSign(objUnsignedUnit.unit)
var buf_to_sign = new Buffer('F24UZTZPeJlwcJvsdF9kW4TuOkuAErz0YkbdBR2gdiA=','base64')


var objectunitHash = objectHash.getUnitHash(objUnsignedUnit.unit)

console.log('objectunitHash: '+objectunitHash)

var sig = signature.sign(buf_to_sign,privKeyBuf)

console.log("originaldata: "+buf_to_sign.toString('base64'))
console.log("signature: "+sig.toString('base64'))

console.log("buf_to_sign: "+buf_to_sign.toString('base64'))



//签名
var result = signature.verify(buf_to_sign,sig.toString('base64'),pubkey)




console.log('results: '+result)


// replace signature with valid sig
var placeholder = 'Tdag779sWGkEQNWQgeqQ+mKRkzQ5vnLDwGdVto4kBJxiMii7JUnbORrMo9TvXju7F54wAMpNawsTs4O437Kdug=='

var newunit = unit.replace(placeholder,sig)

console.log(newunit)




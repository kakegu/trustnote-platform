/*jslint node: true */
"use strict";
//
// exports.storage = 'mysql'
// exports.database = {}
// exports.database.max_connections = 30
// exports.database.host = '192.144.132.161'
// exports.database.name = 'trustnote'
// exports.database.password = 'trustnote_123'
// exports.database.user = 'root'
exports.webservice_url = 'https://beta.itoken.top/v1/token/payment/detail?assetId='

/*jslint node: true */
// "use strict";

exports.port = null;
//exports.myUrl = 'wss://mydomain.com/bb';
exports.bServeAsHub = false;
exports.bLight = false;

exports.storage = 'sqlite';

exports.hub = 'raytest.trustnote.org/tn';
// exports.hub = 'newton.trustnote.org/tn';
exports.deviceName = 'Witness';
exports.permanent_pairing_secret = 'randomstring';
exports.control_addresses = ['DEVICE ALLOWED TO CHAT'];
exports.payout_address = 'WHERE THE MONEY CAN BE SENT TO';

exports.fee = 10000000;

// exports.bSingleAddress = true;
// exports.THRESHOLD_DISTANCE = 10;
// exports.MIN_AVAILABLE_WITNESSINGS = 100;

exports.KEYS_FILENAME = 'keys.json';

console.log('finished witness conf');

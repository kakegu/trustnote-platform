var composer = require("trustnote-common/composer.js");
var ValidationUtils = require('trustnote-common/validation_utils.js');
var validation = require('trustnote-common/validation.js');
var writer = require('trustnote-common/writer.js');

var network = require('trustnote-common/network.js')

var networkService = {}




networkService.broadCastUnit = function (objJoint,callbacks) {

    var unit = objJoint.unit;
    // validate unit
    validation.validate(objJoint, {
        ifUnitError: function(err){
            // composer_unlock();
            callbacks.ifError("Validation error: "+err)
            //
            // callbacks.ifOk(objJoint)
            //	throw Error("unexpected validation error: "+err);
        },
        ifJointError: function(err){
            throw Error("unexpected validation joint error: "+err);
        },
        ifTransientError: function(err){
            throw Error("unexpected validation transient error: "+err);
        },
        ifNeedHashTree: function(){
            throw Error("unexpected need hash tree");
        },
        ifNeedParentUnits: function(arrMissingUnits){
            throw Error("unexpected dependencies: "+arrMissingUnits.join(", "));
        },
        ifOk: function(objValidationState, validation_unlock){
            console.log("divisible asset OK "+objValidationState.sequence);
            if (objValidationState.sequence !== 'good'){
                validation_unlock();
                // composer_unlock();
                return callbacks.ifError("Divisible asset bad sequence "+objValidationState.sequence);
            }
            // var bPrivate = !!private_payload;
            var objPrivateElement;
            var preCommitCallback = null;

            // if (bPrivate){
            //     preCommitCallback = function(conn, cb){
            //         var payload_hash = objectHash.getBase64Hash(private_payload);
            //         var message_index = composer.getMessageIndexByPayloadHash(objUnit, payload_hash);
            //         objPrivateElement = {
            //             unit: unit,
            //             message_index: message_index,
            //             payload: private_payload
            //         };
            //         validateAndSaveDivisiblePrivatePayment(conn, objPrivateElement, {
            //             ifError: function(err){
            //                 cb(err);
            //             },
            //             ifOk: function(){
            //                 cb();
            //             }
            //         });
            //     };
            // }

            composer.postJointToLightVendorIfNecessaryAndSave(
                objJoint,
                function onLightError(err){ // light only
                    console.log("failed to post divisible payment "+unit);
                    validation_unlock();
                    // composer_unlock();
                    callbacks.ifError(err);
                },
                function save(){
                    writer.saveJoint(
                        objJoint, objValidationState,
                        preCommitCallback,
                        function onDone(err){
                            console.log("saved unit "+unit, objPrivateElement);
                            validation_unlock();
                            // composer_unlock();
                            var arrChains = objPrivateElement ? [[objPrivateElement]] : null; // only one chain that consists of one element

                            callbacks.ifOk(objJoint, arrChains, arrChains);
                        }
                    );
                }
            );
        } // ifOk validation
    }); // validate
}


networkService.getUnitState = function (unit) {
    //
}

module.exports = networkService



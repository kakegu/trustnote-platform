'use strict';

module.exports = function CustomError(message, errcode) {
  Error.captureStackTrace(this, this.constructor);
  this.name = this.constructor.name;
  this.message = message;
  this.errcode = errcode;
};

require('util').inherits(module.exports, Error);

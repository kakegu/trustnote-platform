const $sqlQuery = require('./sqlCRUD').test;
const _ = require('./query');

const test = {

    testsql: function () {
        console.log('testsql success','<>>>>')
        return _.query($sqlQuery.test);
    }
};
module.exports = test;
var actionUtil = require("../framework/action/actionUtils")();
var query = actionUtil.query;
var opPool = require('../openplant/openPlantPool');
var utils = require('../rsa/rsaUtils');
var moduleName = "gview";

var sql = require('sql-query'),
    sqlQuery = sql.Query();

var realTimes = 10 * 60;
var message = {
    flag: 0,
    message: '成功',
    data: null
}

var gview = {}

module.exports = gview;

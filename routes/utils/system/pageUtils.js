/**
 * Created by se7en on 2016/9/6.
 */
var actionUtil = require("../../framework/action/actionUtils")();
var query = actionUtil.query;
var moduleName = "system";
var sql = require('sql-query'),
    sqlQuery = sql.Query();
var message = {
    flag: 0,
    message: '成功',
    data: null
}
var pageUtils = {
    /**
     * 获取传递sql的个数
     * @param sql
     */
    getCountByCondition: function (sql) {
        query(sql, function (err, rows, columns) {
            console.log(rows[0].count);
            return rows[0].count;
        });
    }
}
module.exports = pageUtils;

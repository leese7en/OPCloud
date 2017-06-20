var actionUtil = require("../framework/action/actionUtils")();
var query = actionUtil.query;
var sqlQuery = require('sql-query').Query();
var async = require("async");
var logger = require('log4js').getLogger('system');
var message = {
    total: 0,
    error: 'OK',
    rows: null
}

var systemLog = {
    querySysLog: function (req, res) {
        var offset = req.body.offset || 0;
        var limit = req.body.limit || 10;
        var url = req.body.url;
        var beginTime = req.body.beginTime;
        var endTime = req.body.endTime;
        async.waterfall(
            [
                function (callback) {
                    var sqlCount = 'SELECT count(ID) as count FROM sys_Log t WHERE url like "%' + url + '%" and time between "' + beginTime + '" and "' + endTime + '"';
                    var sql = 'SELECT l.url,u.USER_NAME as userName,l.time,l.flag,l.message FROM sys_Log l LEFT JOIN sys_user u on l.user_id = u.USER_ID  where l.url like "%' + url + '%" and l.time between "' + beginTime + '" and "' + endTime + '" order by ID desc limit ' + offset + ',' + limit;
                    logger.debug('查询满足条件的日志总个数sql：' + sqlCount);
                    query(sqlCount, function (error, rows, columns) {
                        if (error) {
                            logger.error('查询满足添加条件的总个数错误:' + error);
                            message.error = '获取数据失败';
                            message.rows = [];
                            message.total = 0;
                            callback(error, message);
                        } else {
                            if (!rows || rows.length < 1 || rows[0].count < 1) {
                                message.error = 'OK';
                                message.rows = [];
                                message.total = 0;
                                callback(new Error('没有数据'), message);
                            } else {
                                callback(null, sql, rows[0].count);
                            }
                        }
                    });
                },
                function (sql, count, callback) {
                    logger.debug('查询满足条件的日志数据sql：' + sql);
                    query(sql, function (err, rows, columns) {
                        if (err) {
                            logger.error('查询满足条件的数据错误：' + err)
                            message.error = '获取数据失败';
                            message.rows = [];
                            message.total = 0;
                            callback(err, message);
                        }
                        else {
                            message.error = 'OK';
                            message.rows = rows;
                            message.total = count;
                            res.json(message);
                        }
                    });
                }
            ],
            function (error, message) {
                res.json(message);
            }
        );
    }
}

module.exports = systemLog;
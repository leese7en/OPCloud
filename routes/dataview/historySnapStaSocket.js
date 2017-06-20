var opPool = require('../openplant/openPlantPool')
var async = require('async');
var logger = require('log4js').getLogger('system');
var GlobalAgent = require('../message/GlobalAgent');
var sqlQuery = require('sql-query').Query();
var message = {
    total: 0,
    message: '成功',
    rows: []
};

var historySnapStaSocket = {
    socketOn: function (socket) {
        /**
         * 实时数据
         */
        socket.on('historyStatistics', function (data) {
            var user = socket.handshake.session.user;
            var domainId = GlobalAgent.getUserDomain(user.USER_ID);
            if (domainId && domainId.length < 1) {
                message.rows = [];
                message.total = 0;
                message.error = '用户没有域';
                socket.emit('historyStatistics', message);
                return;
            }
            var offset = data.offset || 0;
            var limit = data.limit || 10;
            var pointIds = data.pointIds.toString().split(',');
            var ids = [];
            var pointSize = pointIds.length
            for (var i = 0; i < pointSize; i++) {
                ids.push(pointIds[i]);
            }
            var beginDate = data.beginDate;
            beginDate = new Date(beginDate).getTime() / 1000;
            var endDate = data.endDate;
            endDate = new Date(endDate).getTime() / 1000;
            var interval = endDate - beginDate;
            if (interval < 1) {
                message.error = '获取统计静态信息错误';
                message.total = 0;
                message.rows = [];
                socket.emit('historyStatistics', message);
                return;
            }
            async.waterfall(
                [
                    function (callback) {
                        var sql = sqlQuery.select().from('sys_point').select('POINT_ID', 'URI', 'DESCRIPTION', 'POINT_TYPE').where({
                            DOMAIN_ID: domainId,
                            POINT_ID: ids
                        }).build();
                        logger.debug('获取测点静态信息sql：' + sql);
                        query(sql, function (error, rows, columns) {
                            if (error) {
                                logger.error('获取关系库静态信息错误:' + error);
                                message.error = '获取信息错误';
                                message.total = 0;
                                message.rows = [];
                                socket.emit('historyStatistics', message);
                                return;
                            } else if (rows && rows.length < 1) {
                                message.error = 'OK';
                                message.total = 0;
                                message.rows = [];
                                socket.emit('historyStatistics', message);
                                return;
                            } else {
                                ids = [];
                                for (var i in rows) {
                                    ids.push(rows[i].POINT_ID);
                                }
                                callback(null, rows);
                            }
                        });
                    },
                    function (pointRows, callback) {
                        var sql = "select count(ID) as count from Stat where interval = '" + interval + "s' and ID in (" + ids + ") and TM between '" + beginDate + "' and '" + endDate + "'";
                        logger.debug('查询统计总个数sql：' + sql);
                        var sqlHistory = "select ID,TM,MAXV,MINV,MAXTIME,MINTIME,AVGV,FLOW from Stat where interval = '" + interval + "s' and ID in (" + ids + ") and TM between '" + beginDate + "' and '" + endDate + "'";
                        sqlHistory += " limit " + offset + "," + limit;
                        logger.debug('查询统计数据sql：' + sqlHistory);
                        var countRows = opPool.syncQuery(sql).rows;
                        opPool.query(sqlHistory, function (error, rows, colums) {
                            if (error || rows.length < 1) {
                                logger.error('查询历史数据错误：' + (error || rows.length))
                                message.rows = [];
                                message.total = 0;
                                socket.emit('historyStatistics', message);
                            } else {
                                callback(null, pointRows, rows, parseInt(countRows[0].count, 16));
                            }
                        });
                    },
                    function (pointRows, rows, count, callback) {
                        for (var i in rows) {
                            var row = rows[i];
                            for (var j in pointRows) {
                                var pointRow = pointRows[j];
                                if (row.ID == pointRow.POINT_ID) {
                                    row.GN = pointRow.URI;
                                    row.ED = pointRow.DESCRIPTION;
                                    row.RT = pointRow.POINT_TYPE;
                                    rows[i] = row;
                                    break;
                                }
                            }
                        }
                        message.total = count;
                        message.rows = rows;
                        socket.emit('historyStatistics', message);
                    }
                ],
                function (err, rows) {
                    if (err) {
                        logger.errro('获取统计信息错误:' + err);
                        message.error = '获取统计信息错误';
                        message.total = 0;
                        message.rows = [];
                        socket.emit('historyStatistics', message);
                        return;
                    }
                });
        });
        /**
         * 获取历史数据
         */
        socket.on('historySnapshot', function (data) {
            var user = socket.handshake.session.user;
            var domainId = GlobalAgent.getUserDomain(user.USER_ID);
            if (!domainId || domainId.length < 1) {
                message.rows = [];
                message.total = 0;
                message.error = '用户没有域';
                socket.emit('historySnapshot', message);
                return;
            }
            var offset = data.offset || 0;
            var limit = data.limit || 10;
            var pointIds = data.pointIds.toString().split(',');
            var hisType = data.hisType;
            var ids = [];
            var pointSize = pointIds.length
            for (var i = 0; i < pointSize; i++) {
                ids.push(pointIds[i]);
            }
            var beginDate = data.beginDate;
            beginDate = new Date(beginDate).getTime() / 1000;
            var endDate = data.endDate;
            endDate = new Date(endDate).getTime() / 1000;
            var interval = data.interval;
            async.waterfall(
                [

                    function (callback) {
                        var sql = sqlQuery.select().from('sys_point').select('POINT_ID', 'URI', 'DESCRIPTION', 'POINT_TYPE').where({
                            DOMAIN_ID: domainId,
                            POINT_ID: ids
                        }).build();
                        logger.debug('获取测点静态信息sql：' + sql);
                        query(sql, function (error, rows, columns) {
                            if (error) {
                                logger.error('获取关系库静态信息错误:' + error);
                                message.error = '获取信息错误';
                                message.total = 0;
                                message.rows = [];
                                socket.emit('historyStatistics', message);
                                return;
                            } else if (rows && rows.length < 1) {
                                message.error = 'OK';
                                message.total = 0;
                                message.rows = [];
                                socket.emit('historyStatistics', message);
                                return;
                            } else {
                                ids = [];
                                for (var i in rows) {
                                    ids.push(rows[i].POINT_ID);
                                }
                                callback(null, rows);
                            }
                        });
                    },
                    function (pointRows, callback) {
                        if (hisType == 'RAW') {
                            var sql = "select distinct TM from archive where ID in (" + ids + ") and TM between '" + beginDate + "' and '" + endDate + "'";
                            logger.debug('查询采样值总个数sql：' + sql);
                            var sqlTM = "select distinct TM from Archive where ID in (" + ids + ") and TM between '" + beginDate + "' and '" + endDate + "'";
                            sqlTM += " order by TM limit " + offset + "," + limit;
                            logger.debug('查詢满足条件的时间sql：' + sqlTM);
                            var countRows = opPool.syncQuery(sql).rows.length;
                            var tmRows = opPool.syncQuery(sqlTM).rows;
                            var minTime = 0;
                            var maxTime = 0;
                            if (tmRows && tmRows.length > 0) {
                                minTime = tmRows[0].TM;
                                maxTime = tmRows[tmRows.length - 1].TM;
                            }
                            if (!minTime || !maxTime) {
                                logger.error('没有对应的时间数据');
                                message.rows = [];
                                message.total = 0;
                                socket.emit('historySnapshot', message);
                                return;
                            }
                            var sqlHistory = "select ID,TM,DS,AV from archive where ID in (" + ids + ") and TM between '" + minTime + "' and '" + maxTime + "' order by TM";
                            logger.debug('查询采样值数据sql：' + sqlHistory);
                            var rows = opPool.query(sqlHistory, function (error, rows, colums) {
                                if (error || rows.length < 1) {
                                    logger.error('查询采样值数据错误：' + (JSON.stringify(error) || rows.length))
                                    message.rows = [];
                                    message.total = 0;
                                    socket.emit('historySnapshot', message);
                                    return;
                                } else {
                                    callback(null, pointRows, rows, countRows);
                                }
                            });
                        } else if (hisType == 'SPAN' || hisType == 'PLOT') {
                            if (hisType == 'PLOT' && interval < 2) {
                                logger.error('非采样值和等间距统计，间隔要大于1s');
                                message.error = '非采样值和等间距统计，间隔要大于1s';
                                message.total = 0;
                                message.rows = [];
                                socket.emit('historySnapshot', message);
                                return;
                            }
                            var sql = "select distinct TM from Archive where mode ='" + hisType + "' and interval = '" + interval + "s' and  ID in (" + ids + ") and TM between " + beginDate + " and " + endDate;
                            logger.debug('查询等间距或绘图值总个数sql：' + sql);

                            var countRows = opPool.syncQuery(sql).rows.length;
                            if (countRows < 1) {
                                logger.error('没有查到结果');
                                message.error = '没有查到结果';
                                message.total = 0;
                                message.rows = [];
                                socket.emit('historySnapshot', message);
                                return;
                            }
                            var sqlTM = "select distinct TM from Archive where mode ='" + hisType + "' and interval = '" + interval + "s' and ID in (" + ids + ") and TM between '" + beginDate + "' and '" + endDate + "'";
                            sqlTM += " order by TM limit " + offset + "," + limit;
                            logger.debug('查詢满足条件的时间sql：' + sqlTM);
                            var tmRows = opPool.syncQuery(sqlTM).rows;
                            var minTime = 0;
                            var maxTime = 0;
                            if (tmRows && tmRows.length > 0) {
                                minTime = tmRows[0].TM;
                                maxTime = tmRows[tmRows.length - 1].TM;
                            }
                            if (!minTime || !maxTime) {
                                logger.error('没有对应的时间数据');
                                message.rows = [];
                                message.total = 0;
                                socket.emit('historySnapshot', message);
                                return;
                            }
                            var sqlHistory = "select ID,TM,DS,AV from archive where mode ='" + hisType + "' and interval = '" + interval + "s' and ID in (" + ids + ") and TM between '" + minTime + "' and '" + maxTime + "' order by TM";
                            logger.debug('查询等间距或绘图值数据sql：' + sqlHistory);
                            opPool.query(sqlHistory, function (error, rows, colums) {
                                if (error || rows.length < 1) {
                                    logger.error('查询等间距或绘图值数据错误：' + (JSON.stringify(error) || rows.length))
                                    message.rows = [];
                                    message.total = 0;
                                    socket.emit('historySnapshot', message);
                                    return;
                                } else {
                                    callback(null, pointRows, rows, countRows);
                                }
                            });
                        } else {
                            if (interval < 1) {
                                logger.error('非采样值和等间距统计，间隔要大于1s');
                                message.error = '非采样值和等间距统计，间隔要大于1s';
                                message.total = 0;
                                message.rows = [];
                                socket.emit('historySnapshot', message);
                                return;
                            }

                            var sql = "select distinct TM from Stat where interval = '" + interval + "s' and ID in (" + ids + ") and TM between '" + beginDate + "' and '" + endDate + "'";
                            logger.debug('查询统计总个数sql：' + sql);

                            var countRows = opPool.syncQuery(sql).rows.length;
                            if (countRows < 1) {
                                logger.error('没有查到结果');
                                message.error = '没有查到结果';
                                message.total = 0;
                                message.rows = [];
                                socket.emit('historySnapshot', message);
                                return;
                            }
                            var sqlTM = "select distinct TM from Stat where interval = '" + interval + "s' and ID in (" + ids + ") and TM between '" + beginDate + "' and '" + endDate + "'";
                            sqlTM += " order by TM limit " + offset + "," + limit;
                            logger.debug('查詢满足条件的时间sql：' + sqlTM);
                            var tmRows = opPool.syncQuery(sqlTM).rows;
                            var minTime = 0;
                            var maxTime = 0;
                            if (tmRows && tmRows.length > 0) {
                                minTime = tmRows[0].TM;
                                maxTime = tmRows[tmRows.length - 1].TM + interval;
                            }
                            if (!minTime || !maxTime) {
                                logger.error('没有对应的时间数据');
                                message.rows = [];
                                message.total = 0;
                                socket.emit('historySnapshot', message);
                                return;
                            }
                            var sqlHistory = "select ID,TM,MAXV,MINV,AVGV,FLOW,MINTIME,MAXTIME from Stat where interval = '" + interval + "s' and ID in (" + ids + ") and TM between '" + minTime + "' and '" + maxTime + "' order by TM";
                            logger.debug('查询统计数据sql：' + sqlHistory);
                            opPool.query(sqlHistory, function (error, rows, colums) {
                                if (error || rows.length < 1) {
                                    logger.error('查询统计数据错误：' + (JSON.stringify(error) || rows.length))
                                    message.rows = [];
                                    message.total = 0;
                                    socket.emit('historySnapshot', message);
                                    return;
                                } else {
                                    var rs = [];
                                    for (var i in rows) {
                                        var r = new Object();
                                        var row = rows[i];
                                        r.ID = row.ID;
                                        r.DS = row.DS;
                                        r.TM = row.TM;
                                        r.AV = row[hisType];
                                        rs.push(r);
                                    }
                                    callback(null, pointRows, rs, countRows);
                                }
                            });
                        }
                    },
                    function (pointRows, rows, count, callback) {
                        for (var i in rows) {
                            var row = rows[i];
                            for (var j in pointRows) {
                                var pointRow = pointRows[j];
                                if (row.ID == pointRow.POINT_ID) {
                                    row.GN = pointRow.URI;
                                    row.ED = pointRow.DESCRIPTION;
                                    row.RT = pointRow.POINT_TYPE;
                                    rows[i] = row;
                                    break;
                                }
                            }
                        }
                        message.total = count;
                        message.data = pointRows;
                        message.rows = rows;
                        socket.emit('historySnapshot', message);
                    }
                ],
                function (err, rows) {
                    if (err) {
                        logger.error('获取统计信息错误:' + err);
                        message.error = '获取统计信息错误';
                        message.total = 0;
                        message.rows = [];
                        socket.emit('historySnapshot', message);
                        return;
                    }
                });
        });

        /**
         * 获取测点
         */
        socket.on('jsTreePointData', function (groupId) {
            var userId = socket.handshake.session.user.USER_ID;
            var result = {error: '', data: ''}; //结果返回
            var group = [];
            async.waterfall([
                function (callback) {
                    var sql = 'select ID,0 as parentId, GROUP_NAME as NAME from sys_point_group where USER_ID = ' + userId;
                    logger.debug('获取对应点组的信息sql:' + sql);
                    query(sql, function (err, rows, columns) {
                        if (err) {
                            result.error = '获取测点数据失败';
                            result.data = null;
                            socket.emit('jsTreePointData', result);
                            return;
                        }
                        callback(null, rows);
                    });
                },
                function (rows, callback) {
                    var gid = [];
                    for (var i in rows) {
                        gid.push(rows[i].ID);
                    }
                    var sqlChildern = 'select gp.ID as ID,gp.POINT_ID as value, GROUP_ID as parentId, p.URI as NAME from sys_group_point gp left join sys_point p on gp.POINT_ID = p.POINT_ID where p.POINT_ID is not null and  gp.GROUP_ID IN (' + gid.toString() + ')';
                    logger.debug('获取对应测点的信息sql:' + sqlChildern);
                    query(sqlChildern, function (err, crows, columns) {
                        if (err) {
                            logger.error('获取测点信息错误：' + err);
                            result.error = '获取测点子节点数据失败';
                            result.data = null;
                            socket.emit('jsTreePointData', result);
                            return;
                        }
                        result.error = err;
                        rows = rows.concat(crows);
                        result.data = rows;
                        socket.emit('jsTreePointData', result);
                        return;
                    });
                }
            ], function (err) {
                if (err) {
                    result.error = '获取测点子节点数据失败';
                    result.data = null;
                    socket.emit('jsTreePointData', result);
                    return;
                }
            });


        });
    }
}
module.exports = historySnapStaSocket;

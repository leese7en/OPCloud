var opPool = require('../openplant/openPlantPool')
var async = require('async');
var logger = require('log4js').getLogger('system');
var GlobalAgent = require('../message/GlobalAgent');
var message = {
    flag: 0,
    message: '成功',
    data: null
}
var rhDataSocket = {
    socketOn: function (socket) {
        /**
         * 实时数据
         */
        socket.on('realtimeData', function (data) {
            var offset = data.offset || 0;
            var limit = data.limit || 10;
            var mtreeNode = data.mtreeNode;
            var pointName = data.pointName;
            var pointType = data.pointType;
            var pointDesc = data.pointDesc;
            var user = socket.handshake.session.user;
            var domainId = GlobalAgent.getUserDomain(user.USER_ID).toString();
            if (!domainId) {
                socket.emit('realtimeData', {
                    value: result
                });
                return;
            }
            async.waterfall(
                [
                    function (callback) {
                        var sql = 'select POINT_ID,URI,POINT_NAME from sys_Point where DOMAIN_ID in (' + domainId + ') ';
                        if (mtreeNode) {
                            mtreeNode += '/';
                            sql += ' and URI like \'' + mtreeNode.replace(/_/g, '\\_') + '%\'';
                        }
                        if (pointName != undefined && pointName != null) {
                            sql += ' and URI like \'%' + pointName.replace(/_/g, '\\_') + '%\'';
                        }
                        if (pointDesc != undefined && pointDesc != null) {
                            sql += ' and DESCRIPTION like \'%' + pointDesc.replace(/_/g, '\\_') + '%\'';
                        }
                        if (pointType != -1) {
                            sql += ' and POINT_TYPE  = ' + pointType;
                        }
                        logger.debug('查询测点总个数sql：' + sql);
                        query(sql, function (error, rows, columns) {
                            if (error) {
                                logger.error('获取测点总个数错误:' + error);
                                message.error = '获取数据失败';
                                message.rows = [];
                                message.total = 0;
                                socket.emit('realtimeData', message);
                                return;
                            } else if (!rows || rows.length < 1) {
                                message.error = 'OK';
                                message.rows = [];
                                message.total = 0;
                                socket.emit('realtimeData', message);
                                return;
                            } else {
                                var ids = [];
                                for (var i in rows) {
                                    ids.push(rows[i].POINT_ID);
                                }
                                callback(null, rows, ids);
                            }
                        });
                    },
                    function (rr, ids, callback) {
                        var sqlReal = 'select ID,GN,TN,ED,RT,TM,DS,AV from realtime where ID in (' + ids.toString() + ') order by ID ';
                        sqlReal += " limit " + offset + "," + limit;
                        logger.debug('获取实时数据sql:' + sqlReal);
                        opPool.query(sqlReal, function (error, rows, colums) {
                            if (error && error.code) {
                                logger.error('查询实时数据错误：' + JSON.stringify(error));
                                message.error = error.message;
                                message.rows = [];
                                message.total = 0;
                                socket.emit('realtimeData', message);
                                return;
                            } else if (rows.length < 1) {
                                message.error = 'OK';
                                message.rows = [];
                                message.total = 0;
                                socket.emit('realtimeData', message);
                                return;
                            } else {
                                for (var i in rows) {
                                    var row = rows[i];
                                    for (var j in rr) {
                                        var r = rr[j];
                                        if (row.ID == r.POINT_ID) {
                                            row.GN = r.URI;
                                            rows[i] = row;
                                        }
                                    }
                                }
                                message.error = 'OK';
                                message.rows = rows;
                                message.total = rr.length;
                                socket.emit('realtimeData', message);
                                return;
                            }
                        });
                    }
                ],
                function (error) {
                    if (error) {
                        message.error = '获取数据出错';
                        message.rows = [];
                        message.total = 0;
                        socket.emit('realtimeData', message);
                        return;
                    }
                });
        });
        /**
         * 获取历史数据
         */
        socket.on('historyData', function (data) {
            var offset = data.offset;
            var limit = data.limit;
            var mtreeNode = data.mtreeNode;
            var pointName = data.pointName;
            var beginDate = data.beginDate;
            var endDate = data.endDate;
            if (endDate <= beginDate) {
                message.error = '开始时间不能大于结束使劲按';
                message.rows = [];
                message.total = 0;
                socket.emit('historyData', message);
                return;
            }
            var user = socket.handshake.session.user;
            var domainId = GlobalAgent.getUserDomain(user.USER_ID).toString();
            if (!domainId) {
                socket.emit('historyData', {
                    value: result
                });
                return;
            }
            async.waterfall(
                [
                    function (callback) {
                        var sql = 'select POINT_ID,URI,POINT_NAME,POINT_TYPE,DESCRIPTION from sys_point where DOMAIN_ID in (' + domainId.toString() + ') ';
                        if (mtreeNode) {
                            mtreeNode += '/'
                            sql += ' and URI like \'' + mtreeNode + '%\'';
                        }
                        if (pointName != undefined && pointName != null) {
                            sql += ' and URI like \'%' + pointName.replace(/_/g, '\\_') + '%\'';
                        }
                        logger.debug('查询测点总个数sql：' + sql);
                        query(sql, function (error, rows, columns) {
                            if (error) {
                                logger.error('获取测点总个数错误:' + error);
                                message.error = '获取数据失败';
                                message.rows = [];
                                message.total = 0;
                                socket.emit('historyData', message);
                                return;
                            } else if (!rows || rows.length < 1) {
                                message.error = 'OK';
                                message.rows = [];
                                message.total = 0;
                                socket.emit('historyData', message);
                                return;
                            } else {
                                var ids = [];
                                for (var i in rows) {
                                    ids.push(rows[i].POINT_ID);
                                }
                                callback(null, rows, ids);
                            }
                        });
                    },
                    function (pointRows, ids, callback) {
                        var sql = "select count(*) as count from archive where ID in (" + ids.toString() + ") and TM between '" + beginDate + "' and '" + endDate + "'";
                        logger.debug('查询历史总个数sql：' + sql);
                        var sqlHistory = "select ID,GN,TM,DS,AV from archive where ID in (" + ids.toString() + ") and TM between '" + beginDate + "' and '" + endDate + "' order by TM ";
                        sqlHistory += " limit " + offset + "," + limit;
                        logger.debug('查询历史数据sql：' + sqlHistory);
                        var countRows = opPool.syncQuery(sql).rows;
                        opPool.query(sqlHistory, function (error, rows, colums) {
                            if (error && error.code) {
                                logger.error('查询历史数据错误：:' + JSON.stringify(error));
                                message.rows = [];
                                message.total = 0;
                                message.error = error.message;
                                socket.emit('historyData', message);
                                return;
                            } else if (rows.length < 1) {
                                message.rows = [];
                                message.total = 0;
                                message.error = 'OK';
                                socket.emit('historyData', message);
                                return;
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
                        message.error = 'OK';
                        socket.emit('historyData', message);
                    }
                ],
                function (err, rows) {
                    if (err) {
                        logger.error('获取历史信息错误');
                        message.error = '获取历史信息错误';
                        message.total = 0;
                        message.rows = [];
                        socket.emit('historyData', message);
                        return;
                    }
                });
        });
    }
}
module.exports = rhDataSocket;

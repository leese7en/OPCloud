var opPool = require('../openplant/openPlantPool')
var async = require('async');
var logger = require('log4js').getLogger('system');
var GlobalAgent = require('../message/GlobalAgent');
var alarmSocket = {
    socketOn: function (socket) {
        /**
         * 监听获取历史数据
         */
        socket.on('alarmRealtimeData', function (data) {
            var result = {error: "", total: "", rows: ""};
            var user = socket.handshake.session.user;
            var domainId = GlobalAgent.getUserDomain(user.USER_ID).toString();
            if (!domainId) {
                socket.emit('alarmRealtimeData', {
                    value: result
                });
                return;
            }
            var offset = data.offset || 0;
            var limit = data.limit || 10;
            var mtreeNode = data.mtreeNode;
            var alarmName = data.alarmRealName;
            var alarmDesc = data.alarmRealDesc;
            var apLevels = data.alarmRealLevel;
            async.waterfall(
                [
                    function (callback) {
                        var sql = 'select POINT_ID,URI,POINT_NAME from sys_Point where DOMAIN_ID in (' + domainId + ') ';
                        if (mtreeNode) {
                            mtreeNode += '/'
                            sql += ' and URI like \'' + mtreeNode + '%\'';
                        }
                        if (alarmName != undefined && alarmName != null) {
                            sql += ' and URI like \'%' + alarmName.replace(/_/g, '\\_') + '%\'';
                        }
                        if (alarmDesc != undefined && alarmDesc != null) {
                            sql += ' and DESCRIPTION like \'%' + alarmDesc.replace(/_/g, '\\_') + '%\'';
                        }
                        logger.debug('查询满足条件的测点sql：' + sql);
                        query(sql, function (error, rows, columns) {
                            if (error) {
                                logger.error('查询满足条件的测点错误：' + error);
                                result.error = '获取报警实时静态信息错误';
                                result.total = 0;
                                result.rows = [];
                                socket.emit('alarmRealtimeData', result);
                                return;
                            } else if (!rows || rows.length < 1) {
                                result.error = 'OK';
                                result.total = 0;
                                result.rows = [];
                                socket.emit('alarmRealtimeData', result);
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
                        var sqlPoint = 'select ID,RT,TN,PN,ED,C1,C2,C3,C4,C5,C6,C7,C8,LC from point where LC <> 0 and KR in (' + domainId + ') and ID in (' + ids.toString() + ')';
                        if (apLevels && apLevels.length > 0) {
                            sqlPoint += ' and AP in (' + apLevels.toString() + ')';
                        }
                        logger.debug('获取历时数据点静态信息sql：' + sqlPoint);
                        opPool.query(sqlPoint, function (error, rows, columns) {
                            if (error) {
                                logger.error('获取报警实时静态信息错误:' + JSON.stringify(error));
                                result.error = error.message;
                                result.total = 0;
                                result.rows = [];
                                socket.emit('alarmRealtimeData', result);
                                return;
                            } else if (!rows || rows.length < 1) {
                                result.error = 'OK';
                                result.total = 0;
                                result.rows = [];
                                socket.emit('alarmRealtimeData', result);
                                return;
                            } else {
                                ids = [];
                                for (var i in rows) {
                                    ids.push(rows[i].ID);
                                }
                                if (ids.length < 1) {
                                    result.error = 'OK';
                                    result.total = 0;
                                    result.rows = [];
                                    socket.emit('alarmRealtimeData', result);
                                    return;
                                }
                                callback(null, rows, rr, ids);
                            }
                        });
                    },
                    function (pointRows, rr, ids, callback) {
                        var sql = "select count(*) as count from Alarm where ID in (" + ids.toString() + ") ";
                        var sqlAlarmReal = "select ID,AL,AC,TM,DS,AV from Alarm where ID in (" + ids.toString() + ") ";
                        sqlAlarmReal += " limit " + offset + "," + limit;
                        logger.debug('查询报警实时总个数sql：' + sql);
                        logger.debug('查询报警实时数据sql：' + sqlAlarmReal);
                        var countRows = opPool.syncQuery(sql).rows;
                        opPool.query(sqlAlarmReal, function (error, rows, colums) {
                            if (error && error.code) {
                                logger.error('查询报警实时数据错误：' + JSON.stringify(error));
                                result.error = error.message;
                                result.total = 0;
                                result.rows = [];
                                socket.emit('alarmRealtimeData', result);
                                return;
                            } else if (!rows || rows.length < 1) {
                                result.error = 'OK';
                                result.total = 0;
                                result.rows = [];
                                socket.emit('alarmRealtimeData', result);
                                return;
                            } else {
                                callback(null, pointRows, rows, parseInt(countRows[0].count, 16), rr);
                            }
                        });
                    },
                    function (pointRows, rows, count, rr, callback) {
                        for (var i in rows) {
                            var row = rows[i];
                            for (var j in pointRows) {
                                var pointRow = pointRows[j];
                                if (row.ID == pointRow.ID) {
                                    row.ED = pointRow.ED;
                                    row.RT = pointRow.RT;
                                    row.LC = pointRow.LC;
                                    row.C1 = pointRow.C1;
                                    row.C2 = pointRow.C2;
                                    row.C3 = pointRow.C3;
                                    row.C4 = pointRow.C4;
                                    row.C5 = pointRow.C5;
                                    row.C6 = pointRow.C6;
                                    row.C7 = pointRow.C7;
                                    row.C8 = pointRow.C8;
                                    rows[i] = row;
                                    break;
                                }
                            }
                            for (var t in rr) {
                                var r = rr[t];
                                if (row.ID == r.POINT_ID) {
                                    row.GN = r.URI;
                                    rows[i] = row;
                                    break;
                                }
                            }
                        }
                        result.total = count;
                        result.rows = rows;
                        socket.emit('alarmRealtimeData', result);
                    }
                ],
                function (err, rows) {
                    if (err) {
                        result.error = '获取报警实时信息错误';
                        result.total = 0;
                        result.rows = [];
                        socket.emit('alarmRealtimeData', result);
                        return;
                    }
                });
        });

        /**
         * 监听历史报警数据
         */
        socket.on('alarmHistoryData', function (data) {
            var result = {error: "", total: "", rows: ""};
            var user = socket.handshake.session.user;
            var domainId = GlobalAgent.getUserDomain(user.USER_ID).toString();
            if (!domainId) {
                socket.emit('alarmHistoryData', {
                    value: result
                });
                return;
            }
            var offset = data.offset || 0;
            var limit = data.limit || 10;
            var mtreeNode = data.mtreeNode;
            var alarmName = data.alarmRealName;
            var alarmDesc = data.alarmRealDesc;
            var apLevels = data.alarmRealLevel;
            var beginDate = data.beginDate;
            var endDate = data.endDate;
            if (endDate <= beginDate) {
                result.error = '开始时间不能大于结束使劲按';
                result.total = 0;
                result.rows = [];
                socket.emit('alarmHistoryData', message);
                return;
            }
            async.waterfall(
                [
                    function (callback) {
                        var sql = 'select POINT_ID,URI,POINT_NAME from sys_Point where DOMAIN_ID in (' + domainId + ') ';
                        if (mtreeNode) {
                            mtreeNode += '/'
                            sql += ' and URI like \'' + mtreeNode + '%\'';
                        }
                        if (alarmName != undefined && alarmName != null) {
                            sql += ' and URI like \'%' + alarmName.replace(/_/g, '\\_') + '%\'';
                        }
                        if (alarmDesc != undefined && alarmDesc != null) {
                            sql += ' and DESCRIPTION like \'%' + alarmDesc.replace(/_/g, '\\_') + '%\'';
                        }
                        logger.debug('查询满足条件的测点sql：' + sql);
                        query(sql, function (error, rows, columns) {
                            if (error) {
                                logger.error('查询满足条件的测点错误：' + error);
                                result.error = '获取数据失败';
                                result.total = 0;
                                result.rows = [];
                                socket.emit('alarmHistoryData', error);
                                return;
                            } else if (!rows || rows.length < 1) {
                                result.error = 'OK';
                                result.data = [];
                                result.total = 0;
                                socket.emit('alarmHistoryData', error);
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
                        var sqlPoint = 'select ID,RT,TN,PN,ED,C1,C2,C3,C4,C5,C6,C7,C8 from point where LC <> 0 and KR in (' + domainId + ') and ID  in ( ' + ids.toString() + ')  ';
                        if (apLevels && apLevels.length > 0) {
                            sqlPoint += ' and AP in (' + apLevels.toString() + ')';
                        }
                        logger.debug('获取点静态信息sql：' + sqlPoint);
                        opPool.query(sqlPoint, function (error, rows, columns) {
                            if (error && error.code) {
                                logger.error('获取报警历史静态信息错误:' + JSON.stringify(error));
                                result.error = '获取数据失败';
                                result.total = 0;
                                result.rows = [];
                                socket.emit('alarmHistoryData', error);
                                return;
                            } else if (!rows || rows.length < 1) {
                                result.error = 'OK';
                                result.data = [];
                                result.total = 0;
                                socket.emit('alarmHistoryData', error);
                                return;
                            } else {
                                ids = [];
                                for (var i in rows) {
                                    ids.push(rows[i].ID);
                                }
                                if (ids.length < 1) {
                                    result.error = 'OK';
                                    result.total = 0;
                                    result.rows = [];
                                    socket.emit('alarmRealtimeData', result);
                                    return;
                                }
                                callback(null, rows, rr, ids);
                            }
                        });
                    },
                    function (pointRows, rr, ids, callback) {
                        var sql = "select count(*) as count from AAlarm where ID in (" + ids.toString() + ")  and TM between '" + beginDate + "' and '" + endDate + "'";
                        var sqlAlarmHistory = "select ID,RT,AL,AC,TM,DS,AV from AAlarm where ID in (" + ids.toString() + ")  and TM between '" + beginDate + "' and '" + endDate + "' order by TM";
                        sqlAlarmHistory += " limit " + offset + "," + limit;
                        logger.debug('查询报警历史总个数sql：' + sql);
                        logger.debug('查询报警历史数据sql：' + sqlAlarmHistory);
                        var countRows = opPool.syncQuery(sql).rows;
                        opPool.query(sqlAlarmHistory, function (error, rows, colums) {
                            if (error && error.code) {
                                logger.error('查询报警历史数据错误：' + JSON.stringify(error));
                                result.error = '获取数据失败';
                                result.total = 0;
                                result.rows = [];
                                socket.emit('alarmHistoryData', error);
                                return;
                            } else if (!rows || rows.length < 1) {
                                result.error = 'OK';
                                result.data = [];
                                result.total = 0;
                                socket.emit('alarmHistoryData', error);
                                return;
                            } else {
                                callback(null, pointRows, rows, parseInt(countRows[0].count, 16), rr);
                            }
                        });
                    },
                    function (pointRows, rows, count, rr, callback) {
                        for (var i in rows) {
                            var row = rows[i];
                            for (var j in pointRows) {
                                var pointRow = pointRows[j];
                                if (row.ID == pointRow.ID) {
                                    row.RT = pointRow.RT;
                                    row.ED = pointRow.ED;
                                    row.C1 = pointRow.C1;
                                    row.C2 = pointRow.C2;
                                    row.C3 = pointRow.C3;
                                    row.C4 = pointRow.C4;
                                    row.C5 = pointRow.C5;
                                    row.C6 = pointRow.C6;
                                    row.C7 = pointRow.C7;
                                    row.C8 = pointRow.C8;
                                    rows[i] = row;
                                    break;
                                }
                            }
                            for (var t in rr) {
                                var r = rr[t];
                                if (row.ID == r.POINT_ID) {
                                    row.GN = r.URI;
                                    rows[i] = row;
                                    break;
                                }
                            }
                        }
                        result.error = 'OK';
                        result.total = count;
                        result.rows = rows;
                        socket.emit('alarmHistoryData', result);
                    }
                ],
                function (err, rows) {
                    if (err) {
                        result.error = '获取报警历史信息错误';
                        result.total = 0;
                        result.rows = [];
                        socket.emit('alarmHistoryData', result);
                        return;
                    }
                });
        });
    }
}

module.exports = alarmSocket;

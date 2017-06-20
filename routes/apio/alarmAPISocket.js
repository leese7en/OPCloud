var opPool = require('../openplant/openPlantPool')
var async = require('async');
var logger = require('log4js').getLogger('api');
var GlobalAgent = require('../message/GlobalAgent');
var APIUtils = require('../utils/tools/APIUtils');
var sqlQuery = require('sql-query').Query();
var message = {
    flag: 0,
    message: 'OK',
    total: 0,
    data: null
}
var alarmSocket = {
    socketOn: function (socket) {
        /**
         * 实时报警
         */
        socket.on('api/blurryAlarm', function (data) {
            var mess = GlobalAgent.getAPInfo(socket.id, APIUtils.READ_ALARM);
            if (mess.flag < 0) {
                socket.emit('api/blurryAlarm', {
                    flag: -1,
                    total: 0,
                    message: mess.message,
                    data: []
                });
                return;
            }
            var offset = data.offset;
            var limit = data.limit;
            var alarmName = data.alarmName;
            var alarmDesc = data.alarmDesc;
            var apLevels = data.alarmLevel;
            var GM = data.GM;
            if (!GM && typeof (GM) != 'number') {
                GM = 1;
            }
            var pointType = data.pointType;
            var domainId = mess.data.domainId;
            if (!domainId || domainId.length < 1) {
                message.flag = -1;
                message.message = '当前用户没有域';
                message.total = 0;
                message.data = [];
                socket.emit('api/blurryAlarm', message);
                return;
            }
            async.waterfall(
                [
                    function (callback) {
                        var sql = 'select POINT_ID,URI,POINT_NAME from sys_Point where DOMAIN_ID in (' + domainId + ') ';
                        if (alarmName) {
                            if (GM == 1) {
                                sql += ' and URI like \'%' + alarmName + '%\'';
                            } else {
                                sql += ' and URI like \'' + alarmName + '%\'';
                            }
                        }
                        if (alarmDesc) {
                            sql += ' and DESCRIPTION like \'%' + alarmDesc + '%\'';
                        }
                        if (pointType == 0 || pointType) {
                            sql += ' and POINT_TYPE  = ' + pointType;
                        }
                        logger.debug('查询满足条件的测点sql：' + sql);
                        query(sql, function (error, rows, columns) {
                            if (error) {
                                logger.error('查询满足条件的测点错误：' + error);
                                message.flag = -1;
                                message.message = '获取数据失败';
                                message.data = [];
                                message.total = 0;
                                socket.emit('api/blurryPoint', message);
                                return;
                            } else if (!rows || rows.length < 1) {
                                message.flag = 0;
                                message.message = 'OK';
                                message.data = [];
                                message.total = 0;
                                socket.emit('api/blurryPoint', message);
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
                        var sqlPoint = 'select ID,RT,TN,PN,ED,C1,C2,C3,C4,C5,C6,C7,C8 from point where LC <> 0 and KR in (' + domainId + ') and ID in (' + ids.toString() + ') and LC > 0';
                        if (apLevels && apLevels.length > 0) {
                            sqlPoint += ' and AP in (' + apLevels.toString() + ')';
                        }
                        logger.debug('获取历时数据点静态信息sql：' + sqlPoint);
                        opPool.query(sqlPoint, function (error, rows, columns) {
                            if (error) {
                                logger.error('获取报警实时静态信息错误:' + JSON.stringify(error));
                                message.flag = -1;
                                message.message = error.message;
                                message.total = 0;
                                message.data = [];
                                socket.emit('api/blurryAlarm', message);
                                return;
                            } else if (!rows || rows.length < 1) {
                                message.flag = 0;
                                message.data = [];
                                message.total = 0;
                                message.message = 'OK';
                                socket.emit('api/blurryAlarm', message);
                                return;
                            } else {
                                ids = [];
                                for (var i in rows) {
                                    ids.push(rows[i].ID);
                                }
                                if (ids.length < 1) {
                                    message.flag = 0;
                                    message.data = [];
                                    message.total = 0;
                                    message.message = 'OK';
                                    socket.emit('api/blurryAlarm', message);
                                    return;
                                }
                                callback(null, rows, rr, ids);
                            }
                        });
                    },
                    function (pointRows, rr, ids, callback) {
                        var sql = "select count(*) as count from Alarm where ID in (" + ids.toString() + ") ";
                        var sqlAlarmReal = "select ID,AL,AC,TM,DS,AV from Alarm where ID in (" + ids.toString() + ") ";
                        if (offset && limit && typeof(offset) == 'number' && typeof(limit) == 'number') {
                            sqlAlarmReal += " limit " + offset + "," + limit;
                        }
                        logger.debug('查询报警实时总个数sql：' + sql);
                        logger.debug('查询报警实时数据sql：' + sqlAlarmReal);
                        var countRows = opPool.syncQuery(sql).rows;
                        opPool.query(sqlAlarmReal, function (error, rows, colums) {
                            if (error && error.code) {
                                logger.error('查询报警实时数据错误：' + JSON.stringify(error));
                                message.flag = -1;
                                message.data = [];
                                message.total = 0;
                                message.message = error.message;
                                socket.emit('api/blurryAlarm', message);
                                return;
                            } else if (!rows || rows.length < 1) {
                                message.flag = 0;
                                message.data = [];
                                message.total = 0;
                                message.message = 'OK';
                                socket.emit('api/blurryAlarm', message);
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
                        message.total = count;
                        message.data = rows;
                        socket.emit('api/blurryAlarm', message);
                    }
                ],
                function (err, rows) {
                    if (err) {
                        message.message = '获取报警实时信息错误';
                        message.total = 0;
                        message.data = [];
                        socket.emit('api/blurryAlarm', message);
                        return;
                    }
                });
        });

        /**
         * 实时报警
         */
        socket.on('api/getAlarmByName', function (data) {
            var mess = GlobalAgent.getAPInfo(socket.id, APIUtils.READ_ALARM);
            if (mess.flag < 0) {
                socket.emit('api/getAlarmByName', {
                    flag: -1,
                    total: 0,
                    message: mess.message,
                    data: []
                });
                return;
            }
            var domainId = mess.data.domainId;
            if (!domainId || domainId.length < 1) {
                message.flag = -1;
                message.message = '当前用户没有域';
                message.total = 0;
                message.data = [];
                socket.emit('api/getAlarmByName', message);
                return;
            }
            var gns = data;
            async.waterfall(
                [
                    function (callback) {
                        var sql = sqlQuery.select().from('sys_point').select('POINT_ID', 'URI', 'POINT_NAME').where({DOMAIN_ID: domainId, URI: gns}).build();
                        logger.debug('查询满足条件的测点sql：' + sql);
                        query(sql, function (error, rows, columns) {
                            if (error) {
                                logger.error('查询满足条件的测点错误：' + error);
                                message.flag = -1;
                                message.message = '获取数据失败';
                                message.data = [];
                                message.total = 0;
                                socket.emit('api/getAlarmByName', message);
                                return;
                            } else if (!rows || rows.length < 1) {
                                message.flag = 0;
                                message.message = 'OK';
                                message.data = [];
                                message.total = 0;
                                socket.emit('api/getAlarmByName', message);
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
                        var sqlPoint = 'select ID,RT,TN,PN,ED,C1,C2,C3,C4,C5,C6,C7,C8 from point where KR in (' + domainId.toString() + ') and ID in (' + ids.toString() + ')';
                        logger.debug('获取历时数据点静态信息sql：' + sqlPoint);
                        opPool.query(sqlPoint, function (error, rows, columns) {
                            if (error || error.code) {
                                logger.error('获取报警实时静态信息错误:' + JSON.stringify(error));
                                message.flag = -1;
                                message.message = error.message;
                                message.total = 0;
                                message.data = [];
                                socket.emit('api/getAlarmByName', message);
                                return;
                            } else if (!rows || rows.length < 1) {
                                message.flag = 0;
                                message.data = [];
                                message.total = 0;
                                message.message = 'OK';
                                socket.emit('api/getAlarmByName', message);
                                return;
                            } else {
                                callback(null, rows, ids, pointRows);
                            }
                        });
                    },
                    function (pointRows, ids, rr, callback) {
                        var sql = "select count(*) as count from Alarm where ID in (" + ids.toString() + ") ";
                        var sqlAlarmReal = "select ID,AL,AC,TM,DS,AV from Alarm where ID in (" + ids.toString() + ") ";
                        logger.debug('查询报警实时总个数sql：' + sql);
                        logger.debug('查询报警实时数据sql：' + sqlAlarmReal);
                        var countRows = opPool.syncQuery(sql).rows;
                        opPool.query(sqlAlarmReal, function (error, rows, colums) {
                            if (error && error.code) {
                                logger.error('查询报警实时数据错误：' + JSON.stringify(error));
                                message.flag = -1;
                                message.data = [];
                                message.total = 0;
                                message.message = error.message;
                                socket.emit('api/getAlarmByName', message);
                                return;
                            } else if (!rows || rows.length < 1) {
                                message.flag = 0;
                                message.data = [];
                                message.total = 0;
                                message.message = 'OK';
                                socket.emit('api/getAlarmByName', message);
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
                        message.total = count;
                        message.data = rows;
                        socket.emit('api/getAlarmByName', message);
                    }
                ],
                function (err, rows) {
                    if (err) {
                        message.message = '获取报警实时信息错误';
                        message.total = 0;
                        message.data = [];
                        socket.emit('api/getAlarmByName', message);
                        return;
                    }
                });
        });

        /**
         * 获取历史数据
         */
        socket.on('api/blurryAalarm', function (data) {
            var mess = GlobalAgent.getAPInfo(socket.id, APIUtils.READ_ALARM);
            if (mess.flag < 0) {
                socket.emit('api/blurryAalarm', {
                    flag: -1,
                    message: mess.message,
                    data: []
                });
                return;
            }
            var offset = data.offset;
            var limit = data.limit;
            var alarmName = data.alarmName;
            var alarmDesc = data.alarmDesc;
            var apLevels = data.alarmLevel;
            var GM = data.GM;
            if (!GM && typeof (GM) != 'number') {
                GM = 1;
            }
            var domainId = mess.data.domainId;
            if (!domainId || domainId.length < 1) {
                message.flag = -1;
                message.message = '当前用户没有域';
                message.total = 0;
                message.data = [];
                socket.emit('api/blurryAalarm', message);
                return;
            }
            var pointType = data.pointType;
            var beginDate = data.beginDate;
            var endDate = data.endDate;
            if (!beginDate || !endDate) {
                message.flag = -1;
                message.data = [];
                message.total = 0;
                message.message = '开始时间和结束时间都不能为空';
                socket.emit('api/blurryAalarm', message);
                return;
            }
            async.waterfall(
                [
                    function (callback) {
                        var sql = 'select POINT_ID,URI,POINT_NAME from sys_Point where DOMAIN_ID in (' + domainId + ') ';
                        if (alarmName) {
                            if (GM == 1) {
                                sql += ' and URI like \'%' + alarmName + '%\'';
                            } else {
                                sql += ' and URI like \'' + alarmName + '%\'';
                            }
                        }
                        if (alarmDesc) {
                            sql += ' and DESCRIPTION like \'%' + alarmDesc + '%\'';
                        }
                        if (pointType == 0 || pointType) {
                            sql += ' and POINT_TYPE  = ' + pointType;
                        }
                        logger.debug('查询满足条件的测点sql：' + sql);
                        query(sql, function (error, rows, columns) {
                            if (error) {
                                logger.error('查询满足条件的测点错误：' + error);
                                message.flag = -1;
                                message.message = '获取数据失败';
                                message.data = [];
                                message.total = 0;
                                socket.emit('api/blurryPoint', message);
                                return;
                            } else if (!rows || rows.length < 1) {
                                message.flag = 0;
                                message.message = 'OK';
                                message.data = [];
                                message.total = 0;
                                socket.emit('api/blurryPoint', message);
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
                        var sqlPoint = 'select ID,RT,TN,PN,ED,C1,C2,C3,C4,C5,C6,C7,C8 from point where LC <> 0 and KR in (' + domainId + ') and ID  in ( ' + ids.toString() + ') and LC >0 ';
                        if (apLevels && apLevels.length > 0) {
                            sqlPoint += ' and AP in (' + apLevels.toString() + ')';
                        }
                        logger.debug('获取点静态信息sql：' + sqlPoint);
                        opPool.query(sqlPoint, function (error, rows, columns) {
                            if (error && error.code) {
                                logger.error('获取报警历史静态信息错误:' + JSON.stringify(error));
                                message.flag = -1
                                message.message = error.message;
                                message.total = 0;
                                message.data = [];
                                socket.emit('api/blurryAalarm', message);
                                return;
                            } else if (!rows || rows.length < 1) {
                                message.flag = 0;
                                message.data = [];
                                message.total = 0;
                                message.message = 'OK';
                                socket.emit('api/blurryAalarm', message);
                                return;
                            } else {
                                ids = [];
                                for (var i in rows) {
                                    ids.push(rows[i].ID);
                                }
                                if (ids.length < 1) {
                                    message.flag = 0;
                                    message.data = [];
                                    message.total = 0;
                                    message.message = 'OK';
                                    socket.emit('api/blurryAalarm', message);
                                    return;
                                }
                                callback(null, rows, rr, ids);
                            }
                        });
                    },
                    function (pointRows, rr, ids, callback) {
                        var sql = "select count(*) as count from AAlarm where ID in (" + ids.toString() + ")  and TM between '" + beginDate + "' and '" + endDate + "'";
                        var sqlAlarmHistory = "select ID,RT,AL,AC,TM,DS,AV from AAlarm where ID in (" + ids.toString() + ")  and TM between '" + beginDate + "' and '" + endDate + "' order by TM";
                        if (offset && limit && typeof(offset) == 'number' && typeof(limit) == 'number') {
                            sqlAlarmHistory += " limit " + offset + "," + limit;
                        }
                        logger.debug('查询报警历史总个数sql：' + sql);
                        logger.debug('查询报警历史数据sql：' + sqlAlarmHistory);
                        var countRows = opPool.syncQuery(sql).rows;
                        opPool.query(sqlAlarmHistory, function (error, rows, colums) {
                            if (error && error.code) {
                                logger.error('查询报警历史数据错误：' + JSON.stringify(error));
                                message.flag = -1;
                                message.data = [];
                                message.total = 0;
                                message.message = error.message;
                                socket.emit('api/blurryAalarm', message);
                                return;
                            } else if (!rows || rows.length < 1) {
                                message.flag = 0;
                                message.data = [];
                                message.total = 0;
                                message.message = 'OK';
                                socket.emit('api/blurryAalarm', message);
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
                                    row.TN = pointRow.TN;
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
                        message.total = count;
                        message.data = rows;
                        socket.emit('api/blurryAalarm', message);
                    }
                ],
                function (err, rows) {
                    if (err) {
                        message.message = '获取报警历史信息错误';
                        message.total = 0;
                        message.data = [];
                        socket.emit('api/blurryAalarm', message);
                        return;
                    }
                });
        });
        /**
         * 获取历史数据
         */
        socket.on('api/getAalarmByName', function (data) {
            var mess = GlobalAgent.getAPInfo(socket.id, APIUtils.READ_ALARM);
            if (mess.flag < 0) {
                socket.emit('api/getAalarmByName', {
                    flag: -1,
                    message: mess.message,
                    data: []
                });
                return;
            }
            var offset = data.offset;
            var limit = data.limit;
            var domainId = mess.data.domainId;
            if (!domainId || domainId.length < 1) {
                message.flag = -1;
                message.message = '当前用户没有域';
                message.total = 0;
                message.data = [];
                socket.emit('api/getAalarmByName', message);
                return;
            }
            var beginDate = data.beginDate;
            var endDate = data.endDate;
            if (!beginDate || !endDate) {
                message.flag = -1;
                message.data = [];
                message.total = 0;
                message.message = '开始时间和结束时间都不能为空';
                socket.emit('api/getAalarmByName', aalarm);
                return;
            }
            var gns = data.GN;
            async.waterfall(
                [
                    function (callback) {
                        var sql = sqlQuery.select().from('sys_point').select('POINT_ID', 'URI', 'POINT_NAME').where({DOMAIN_ID: domainId, URI: gns}).build();
                        logger.debug('查询满足条件的测点sql：' + sql);
                        query(sql, function (error, rows, columns) {
                            if (error) {
                                logger.error('查询满足条件的测点错误：' + error);
                                message.flag = -1;
                                message.message = '获取数据失败';
                                message.data = [];
                                message.total = 0;
                                socket.emit('api/getAalarmByName', message);
                                return;
                            } else if (!rows || rows.length < 1) {
                                message.flag = 0;
                                message.message = 'OK';
                                message.data = [];
                                message.total = 0;
                                socket.emit('api/getAalarmByName', message);
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
                        var sqlPoint = 'select ID,RT,TN,PN,ED,C1,C2,C3,C4,C5,C6,C7,C8 from  point where ID in (' + ids.toString() + ')';
                        logger.debug('获取点静态信息sql：' + sqlPoint);
                        opPool.query(sqlPoint, function (error, rows, columns) {
                            if (error && error.code) {
                                logger.error('获取报警历史静态信息错误:' + JSON.stringify(error));
                                message.flag = -1
                                message.message = error.message;
                                message.total = 0;
                                message.data = [];
                                socket.emit('api/getAalarmByName', message);
                                return;
                            } else if (!rows || rows.length < 1) {
                                message.flag = 0;
                                message.data = [];
                                message.total = 0;
                                message.message = 'OK';
                                socket.emit('api/getAalarmByName', message);
                                return;
                            } else {
                                callback(null, rows, pointRows, ids);
                            }
                        });
                    },
                    function (pointRows, rr, ids, callback) {
                        var sql = "select count(*) as count from AAlarm where ID in (" + ids.toString() + ")  and TM between '" + beginDate + "' and '" + endDate + "'";
                        var sqlAlarmHistory = "select ID,RT,AL,AC,TM,DS,AV from AAlarm where ID in (" + ids.toString() + ")  and TM between '" + beginDate + "' and '" + endDate + "' order by TM";
                        if (offset && limit && typeof(offset) == 'number' && typeof(limit) == 'number') {
                            sqlAlarmHistory += " limit " + offset + "," + limit;
                        }
                        logger.debug('查询报警历史总个数sql：' + sql);
                        logger.debug('查询报警历史数据sql：' + sqlAlarmHistory);
                        var countRows = opPool.syncQuery(sql).rows;
                        opPool.query(sqlAlarmHistory, function (error, rows, colums) {
                            if (error && error.code) {
                                logger.error('查询报警历史数据错误：' + JSON.stringify(error));
                                message.flag = -1;
                                message.data = [];
                                message.total = 0;
                                message.message = error.message;
                                socket.emit('api/getAalarmByName', message);
                                return;
                            } else if (!rows || rows.length < 1) {
                                message.flag = 0;
                                message.data = [];
                                message.total = 0;
                                message.message = 'OK';
                                socket.emit('api/getAalarmByName', message);
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
                        message.total = count;
                        message.data = rows;
                        socket.emit('api/getAalarmByName', message);
                    }
                ],
                function (err, rows) {
                    if (err) {
                        message.message = '获取报警历史信息错误';
                        message.total = 0;
                        message.data = [];
                        socket.emit('api/getAalarmByName', message);
                        return;
                    }
                });
        });
    }
}
module.exports = alarmSocket;

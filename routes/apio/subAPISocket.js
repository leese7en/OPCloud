var opPool = require('../openplant/openPlantPool')
var async = require('async');
var logger = require('log4js').getLogger('api');
var GlobalAgent = require('../message/GlobalAgent');
var APIUtils = require('../utils/tools/APIUtils');
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
        socket.on('api/subRealtimeByName', function (data) {
            var mess = GlobalAgent.getAPInfo(socket.id, APIUtils.SUB_REALTIME);
            if (mess.flag < 0) {
                socket.emit('api/subRealtimeByName', {
                    flag: -1,
                    message: mess.message,
                    total: 0,
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
                socket.emit('api/subRealtimeByName', message);
                return;
            }
            var gns = data;
            if (!gns || gns.length < 1) {
                message.flag = -1;
                message.message = '查询数据点名不能为空';
                message.total = 0;
                message.data = [];
                socket.emit('api/subRealtimeByName', message);
                return;
            }
            var sql = sqlQuery.select().from().select('POINT_ID', 'URI').where({DOMAIN_ID: domainId, URI: gns});
            logger.debug('获取测点信息sql：' + sql);
            query(sql, function (error, rows, columns) {
                if (error) {
                    logger.error('获取测点信息错误:' + error);
                    message.flag = -1;
                    message.data = [];
                    message.total = 0;
                    message.message = '获取测点信息失败';
                    socket.emit('api/subRealtimeByName', message);
                    return;
                } else if (rows.length < 1) {
                    message.flag = 0;
                    message.data = [];
                    message.total = 0;
                    message.message = 'OK';
                    socket.emit('api/subRealtimeByName', message);
                    return;
                } else {
                    GlobalAgent.SubRealtime(socket, rows, 'api/subRealtimeByName');
                }
            });
        });

        /**
         * 实时报警
         */
        socket.on('api/blurrySubRealtime', function (data) {
                var mess = GlobalAgent.getAPInfo(socket.id, APIUtils.SUB_REALTIME);
                if (mess.flag < 0) {
                    socket.emit('api/blurrySubRealtime', {
                        flag: -1,
                        message: mess.message,
                        total: 0,
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
                    socket.emit('api/blurrySubRealtime', message);
                    return;
                }
                var GN = data.GN;
                var GM = data.GM;
                if (!GM || typeof (GM) != 'number') {
                    GM = 1;
                }
                var sql = 'select POINT_ID,URI from sys_point where DOMAIN_ID in(' + domainId + ') ';
                if (GM == 1) {
                    sql += ' and URI like \'%' + GN + '%\'';
                } else {
                    sql += ' and URI like \'' + GN + '%\'';
                }
                logger.debug('查询测点信息数据sql：' + sql);
                query(sql, function (error, rows, colums) {
                    if (error) {
                        logger.error('查询数据错误：' + error);
                        message.flag = -1;
                        message.data = [];
                        message.total = 0;
                        message.message = '查询数据出错';
                        socket.emit('api/blurrySubRealtime', message);
                        return;
                    } else if (rows.length < 1) {
                        message.flag = 0;
                        message.data = [];
                        message.total = 0;
                        message.message = '没有满足条件的数据';
                        socket.emit('api/blurrySubRealtime', message);
                        return;
                    } else {
                        GlobalAgent.SubRealtime(socket, rows, 'api/blurrySubRealtime');
                    }
                });
            }
        )
        ;

        /**
         * 获取历史数据
         */
        socket.on('api/subAlarmByName', function (data) {
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
            var apLevel = '';
            if (apLevels) {
                for (var i = 0; i < apLevels.length; i++) {
                    apLevel += apLevels[i];
                    if (apLevels[i + 1]) {
                        apLevel += ',';
                    }
                }
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
                socket.emit('api/blurryAalarm', aalarm);
                return;
            }
            async.waterfall(
                [
                    function (callback) {
                        var sqlPoint = 'select ID,RT,TN,PN,ED,C1,C2,C3,C4,C5,C6,C7,C8 from point where KR in (' + domainId + ') ';
                        if (pointType && pointType != '-1') {
                            sqlPoint += ' and RT = ' + pointType;
                        }
                        if (apLevel) {
                            sqlPoint += ' and AP in (' + apLevel + ') ';
                        }
                        if (alarmName) {
                            sqlPoint += ' and TN like \'%' + alarmName + '%\'';
                        }
                        if (alarmDesc) {
                            sqlPoint += ' and ED like \'%' + alarmDesc + '%\'';
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
                                callback(null, rows);
                            }
                        });
                    },
                    function (pointRows, callback) {
                        var ids = '';
                        var pointSize = pointRows.length
                        for (var i = 0; i < pointSize; i++) {
                            ids += pointRows[i].ID;
                            if (pointRows[i + 1]) {
                                ids += ',';
                            }
                        }
                        var sql = "select count(*) as count from AAlarm where ID in (" + ids + ")  and TM between '" + beginDate + "' and '" + endDate + "'";
                        var sqlAlarmHistory = "select ID,RT,AL,AC,TM,DS,AV from AAlarm where ID in (" + ids + ")  and TM between '" + beginDate + "' and '" + endDate + "' order by TM";
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
                                callback(null, pointRows, rows, parseInt(countRows[0].count, 16));
                            }
                        });
                    },
                    function (pointRows, rows, count, callback) {
                        for (var i in rows) {
                            var row = rows[i];
                            for (var j in pointRows) {
                                var pointRow = pointRows[j];
                                if (row.ID == pointRow.ID) {
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
        socket.on('api/blurrySubAlarm', function (data) {
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
            var gns = data;
            var ud = '';
            var size = gns.length;
            for (var i = 0; i < size; i++) {
                ud += '"0x' + opPool.makeUUID(gns[i]) + '"'.toLowerCase();
                if (gns[i + 1]) {
                    ud += ','
                }
            }
            async.waterfall(
                [
                    function (callback) {
                        var sqlPoint = 'select ID,RT,TN,PN,ED,C1,C2,C3,C4,C5,C6,C7,C8 from point KR in (' + domainId + ') and UD in (' + ud + ') ';
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
                                callback(null, rows);
                            }
                        });
                    },
                    function (pointRows, callback) {
                        var ids = '';
                        var pointSize = pointRows.length
                        for (var i = 0; i < pointSize; i++) {
                            ids += pointRows[i].ID;
                            if (pointRows[i + 1]) {
                                ids += ',';
                            }
                        }
                        var sql = "select count(*) as count from AAlarm where ID in (" + ids + ")  and TM between '" + beginDate + "' and '" + endDate + "'";
                        var sqlAlarmHistory = "select ID,RT,AL,AC,TM,DS,AV from AAlarm where ID in (" + ids + ")  and TM between '" + beginDate + "' and '" + endDate + "' order by TM";
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
                                callback(null, pointRows, rows, parseInt(countRows[0].count, 16));
                            }
                        });
                    },
                    function (pointRows, rows, count, callback) {
                        for (var i in rows) {
                            var row = rows[i];
                            for (var j in pointRows) {
                                var pointRow = pointRows[j];
                                if (row.ID == pointRow.ID) {
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

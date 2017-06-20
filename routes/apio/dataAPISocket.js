var opPool = require('../openplant/openPlantPool')
var async = require('async');
var logger = require('log4js').getLogger('api');
var GlobalAgent = require('../message/GlobalAgent');
var APIUtils = require('../utils/tools/APIUtils');
var OPAPI = require('opapi');
var sqlQuery = require('sql-query').Query();
var message = {
    flag: 0,
    total: 0,
    message: 'OK',
    data: []
}
var dataSocket = {
    socketOn: function (socket) {
        /**
         * 实时数据
         */
        socket.on('api/blurryRealtime', function (data) {
            var mess = GlobalAgent.getAPInfo(socket.id, APIUtils.READ_REALTIME);
            if (mess.flag < 0) {
                socket.emit('api/blurryRealtime', {
                    flag: -1,
                    message: mess.message,
                    total: 0,
                    data: []
                });
                return;
            }
            var offset = data.offset;
            var limit = data.limit;
            var pointName = data.pointName;
            var pointType = data.pointType;
            var pointDesc = data.pointDesc;
            var domainId = mess.data.domainId;
            if (!domainId || domainId.length < 1) {
                message.flag = -1;
                message.message = '当前用户没有域';
                message.total = 0;
                message.data = [];
                socket.emit('api/blurryRealtime', message);
                return;
            }

            var GM = data.GM;
            if (!GM && typeof(GM) != 'number') {
                GM = 1;
            }
            async.waterfall(
                [
                    function (callback) {
                        var sql = 'select POINT_ID,URI,POINT_NAME from sys_Point where DOMAIN_ID in (' + domainId + ') ';
                        if (pointName) {
                            if (GM == 1) {
                                sql += ' and URI like \'%' + pointName + '%\'';
                            } else {
                                sql += ' and URI like \'' + pointName + '%\'';
                            }
                        }
                        if (pointDesc) {
                            sql += ' and DESCRIPTION like \'%' + pointDesc + '%\'';
                        }
                        if (pointType == 0 || pointType) {
                            sql += ' and POINT_TYPE  = ' + pointType;
                        }
                        logger.debug('查询测点总个数sql：' + sql);
                        query(sql, function (error, rows, columns) {
                            if (error) {
                                logger.error('获取测点总个数错误:' + error);
                                message.flag = -1;
                                message.message = '获取数据失败';
                                message.total = 0;
                                message.data = [];
                                socket.emit('api/blurryRealtime', message);
                                return;
                            } else if (!rows || rows.length < 1) {
                                message.flag = 0;
                                message.message = 'OK';
                                message.total = 0;
                                message.data = [];
                                socket.emit('api/blurryRealtime', message);
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
                        if (offset && limit && typeof(offset) == 'number' && typeof(limit) == 'number') {
                            sqlReal += " limit " + offset + "," + limit;
                        }
                        logger.debug('获取实时数据sql:' + sqlReal);
                        opPool.query(sqlReal, function (error, rows, colums) {
                            if (error && error.code) {
                                logger.error('查询实时数据错误：' + JSON.stringify(error));
                                message.flag = -1;
                                message.data = [];
                                message.total = 0;
                                message.message = error.message;
                                socket.emit('api/blurryRealtime', message);
                                return;
                            } else if (rows.length < 1) {
                                message.flag = 0;
                                message.data = [];
                                message.total = 0;
                                message.message = 'OK';
                                socket.emit('api/blurryRealtime', message);
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
                                message.flag = 0;
                                message.total = rr.length;
                                message.data = rows;
                                message.message = 'OK';
                                socket.emit('api/blurryRealtime', message);
                                return;
                            }
                        });
                    }
                ],
                function (error) {
                    if (error) {
                        message.flag = -1;
                        message.total = 0;
                        message.data = [];
                        message.message = '获取数据出错';
                        socket.emit('api/blurryRealtime', message);
                        return;
                    }
                }
            )

        });

        /**
         * 实时数据
         */
        socket.on('api/getRealtimeByName', function (data) {
            var mess = GlobalAgent.getAPInfo(socket.id, APIUtils.READ_REALTIME);
            if (mess.flag < 0) {
                socket.emit('api/getRealtimeByName', {
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
                socket.emit('api/getRealtimeByName', message);
                return;
            }
            var gns = data;
            if (!gns || gns.length < 1) {
                message.flag = -1;
                message.message = '查询数据点名不能为空';
                message.total = 0;
                message.data = [];
                socket.emit('api/getRealtimeByName', message);
                return;
            }
            async.waterfall(
                [
                    function (callback) {
                        var sql = sqlQuery.select().from('sys_point').select('POINT_ID', 'URI', 'POINT_NAME').where({
                            DOMAIN_ID: domainId,
                            URI: gns
                        }).build();
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
                                if (ids.length < 1) {
                                    message.flag = 0;
                                    message.data = [];
                                    message.total = 0;
                                    message.message = 'OK';
                                    socket.emit('api/getRealtimeByName', message);
                                    return;
                                }
                                callback(null, rows, ids);
                            }
                        });
                    },
                    function (pointRows, ids, callback) {
                        var sql = 'select ID,GN,TN,ED,RT,TM,DS,AV from realtime where ID in (' + ids.toString() + ') order by ID';
                        logger.debug('根据名称获取实时数据sql：' + sql);
                        opPool.query(sql, function (error, rows) {
                            if (error && error.code) {
                                logger.error('查询实时数据错误：' + JSON.stringify(error));
                                message.flag = -1;
                                message.data = [];
                                message.total = 0;
                                message.message = error.message;
                                socket.emit('api/getRealtimeByName', message);
                                return;
                            } else if (rows.length < 1) {
                                message.flag = 0;
                                message.data = [];
                                message.total = 0;
                                message.message = 'OK';
                                socket.emit('api/getRealtimeByName', message);
                                return;
                            } else {
                                var rrs = [];
                                for (var i in rows) {
                                    var row = rows[i];
                                    for (var j in pointRows) {
                                        var pointRow = pointRows[j];
                                        if (row.ID == pointRow.POINT_ID) {
                                            row.GN = pointRow.URI;
                                            rrs.push(row);
                                        }
                                    }
                                }
                                message.flag = 0;
                                message.total = rrs.length;
                                message.data = rrs;
                                message.message = 'OK';
                                socket.emit('api/getRealtimeByName', message);
                                return;
                            }
                        });
                    }
                ],
                function (err) {
                    if (err) {
                        message.flag = -1;
                        message.total = 0;
                        message.data = null;
                        message.message = '获取实时数据出错';
                        socket.emit('api/getRealtimeByName', message);
                        return;
                    }

                }
            );
        });
        /**
         * 获取历史数据
         */
        socket.on('api/blurryArchive', function (data) {
            var mess = GlobalAgent.getAPInfo(socket.id, APIUtils.READ_ARCHVIE);
            if (mess.flag < 0) {
                socket.emit('api/blurryArchive', {
                    flag: -1,
                    message: mess.message,
                    total: 0,
                    data: []
                });
                return;
            }
            var offset = data.offset;
            var limit = data.limit;
            var pointName = data.pointName;
            var pointDesc = data.pointDesc;
            var beginDate = data.beginDate;
            var endDate = data.endDate;
            var domainId = mess.data.domainId;

            if (!domainId || domainId.length < 1) {
                message.flag = -1;
                message.message = '当前用户没有域';
                message.total = 0;
                message.data = [];
                socket.emit('api/blurryArchive', message);
                return;
            }
            if (!beginDate || !endDate) {
                message.flag = -1;
                message.data = [];
                message.total = 0;
                message.message = '开始时间和结束时间都不能为空';
                socket.emit('api/blurryArchive', message);
                return;
            } else {
                var btime = new Date(beginDate).getTime();
                var etime = new Date(endDate).getTime();
                if ((etime - btime) / 1000 > 30 * 86400) {
                    message.flag = -1;
                    message.data = [];
                    message.total = 0;
                    message.message = '历史一次最多只能查询30天';
                    socket.emit('api/blurryArchive', message);
                    return;
                }
            }
            var GM = data.GM;
            if (!GM || typeof(GM) != 'number') {
                GM = 1;
            }
            var pointType = data.pointType;
            async.waterfall(
                [
                    function (callback) {
                        var sql = 'select POINT_ID,URI,POINT_NAME,POINT_TYPE,DESCRIPTION from sys_point where DOMAIN_ID in (' + domainId + ') ';
                        if (pointName) {
                            if (GM == 1) {
                                sql += ' and URI like \'%' + pointName + '%\'';
                            } else {
                                sql += ' and URI like \'' + pointName + '%\'';
                            }
                        }
                        if (pointDesc) {
                            sql += ' and DESCRIPTION like \'%' + pointDesc + '%\'';
                        }
                        if (pointType) {
                            sql += ' and POINT_TYPE  = ' + pointType;
                        }
                        logger.debug('查询测点总个数sql：' + sql);
                        query(sql, function (error, rows, columns) {
                            if (error) {
                                logger.error('获取测点总个数错误:' + error);
                                message.flag = -1;
                                message.message = '获取数据失败';
                                message.total = 0;
                                message.data = [];
                                socket.emit('api/blurryArchive', message);
                                return;
                            } else if (!rows || rows.length < 1) {
                                message.flag = 0;
                                message.message = 'OK';
                                message.total = 0;
                                message.data = [];
                                socket.emit('api/blurryArchive', message);
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
                        if (offset && limit && typeof(offset) == 'number' && typeof(limit) == 'number') {
                            sqlHistory += " limit " + offset + "," + limit;
                        }
                        logger.debug('查询历史数据sql：' + sqlHistory);
                        var countRows = opPool.syncQuery(sql).rows;
                        opPool.query(sqlHistory, function (error, rows, colums) {
                            if (error && error.code) {
                                logger.error('查询历史数据错误：:' + JSON.stringify(error));
                                message.flag = -1;
                                message.data = [];
                                message.total = 0;
                                message.message = error.message;
                                socket.emit('api/blurryArchive', message);
                                return;
                            } else if (rows.length < 1) {
                                message.flag = 0;
                                message.data = [];
                                message.total = 0;
                                message.message = 'OK';
                                socket.emit('api/blurryArchive', message);
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
                        message.flag = 0;
                        message.total = count;
                        message.data = rows;
                        message.message = 'OK';
                        socket.emit('api/blurryArchive', message);
                    }
                ],
                function (err, rows) {
                    if (err) {
                        message.message = '获取实时信息错误';
                        message.total = 0;
                        message.data = [];
                        socket.emit('api/blurryArchive', message);
                        return;
                    }
                });
        });

        /**
         * 获取历史数据
         */
        socket.on('api/getArchiveByName', function (data) {
            var mess = GlobalAgent.getAPInfo(socket.id, APIUtils.READ_ARCHVIE);
            if (mess.flag < 0) {
                socket.emit('api/getArchiveByName', {
                    flag: -1,
                    message: mess.message,
                    total: 0,
                    data: []
                });
                return;
            }
            var offset = data.offset;
            var limit = data.limit;
            var beginDate = data.beginDate;
            var endDate = data.endDate;
            var domainId = mess.data.domainId;

            if (!domainId || domainId.length < 1) {
                message.flag = -1;
                message.message = '当前用户没有域';
                message.total = 0;
                message.data = [];
                socket.emit('api/getArchiveByName', message);
                return;
            }
            if (!beginDate || !endDate) {
                message.flag = -1;
                message.data = [];
                message.total = 0;
                message.message = '开始时间和结束时间都不能为空';
                socket.emit('api/getArchiveByName', message);
                return;
            } else {
                var btime = new Date(beginDate).getTime();
                var etime = new Date(endDate).getTime();
                if ((etime - btime) / 1000 > 30 * 86400) {
                    message.flag = -1;
                    message.data = [];
                    message.total = 0;
                    message.message = '历史一次最多只能查询30天';
                    socket.emit('api/getArchiveByName', message);
                    return;
                }
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
                                socket.emit('api/getArchiveByName', message);
                                return;
                            } else if (!rows || rows.length < 1) {
                                message.flag = 0;
                                message.message = 'OK';
                                message.data = [];
                                message.total = 0;
                                socket.emit('api/getArchiveByName', message);
                                return;
                            } else {
                                var ids = [];
                                for (var i in rows) {
                                    ids.push(rows[i].POINT_ID);
                                }
                                if (ids.length < 1) {
                                    message.flag = 0;
                                    message.message = 'OK';
                                    message.data = [];
                                    message.total = 0;
                                    socket.emit('api/getArchiveByName', message);
                                    return;
                                }
                                callback(null, rows, ids);
                            }
                        });
                    },
                    function (pointRows, ids, callback) {
                        var sqlPoint = 'select ID,RT,TN,PN,ED from point where ID in (' + ids.toString() + ')';
                        logger.debug('获取历时数据点静态信息sql：' + sqlPoint);
                        opPool.query(sqlPoint, function (error, rows, columns) {
                            if (error && error.code) {
                                logger.error('获取历史静态信息错误:' + JSON.stringify(error));
                                message.flag = -1;
                                message.data = [];
                                message.total = 0;
                                message.message = error.message;
                                socket.emit('api/getArchiveByName', message);
                                return;
                            } else if (rows.length < 1) {
                                message.flag = 0;
                                message.data = [];
                                message.total = 0;
                                message.message = 'OK';
                                socket.emit('api/getArchiveByName', message);
                                return;
                            } else {
                                callback(null, rows, pointRows, ids);
                            }
                        });
                    },
                    function (pointRows, rr, ids, callback) {
                        var sql = "select count(*) as count from archive where ID in (" + ids.toString() + ") and TM between '" + beginDate + "' and '" + endDate + "'";
                        logger.debug('查询历史总个数sql：' + sql);
                        var sqlHistory = "select ID,TM,DS,AV from archive where ID in (" + ids.toString() + ") and TM between '" + beginDate + "' and '" + endDate + "' order by TM";
                        if (offset && limit && typeof(offset) == 'number' && typeof(limit) == 'number') {
                            sqlHistory += " limit " + offset + "," + limit;
                        }
                        logger.debug('查询历史数据sql：' + sqlHistory);
                        var countRows = opPool.syncQuery(sql).rows;
                        opPool.query(sqlHistory, function (error, rows, colums) {
                            if (error && error.code) {
                                logger.error('查询历史数据错误：:' + JSON.stringify(error));
                                message.flag = -1;
                                message.data = [];
                                message.total = 0;
                                message.message = error.message;
                                socket.emit('api/getArchiveByName', message);
                                return;
                            } else if (rows.length < 1) {
                                message.flag = 0;
                                message.data = [];
                                message.total = 0;
                                message.message = 'OK';
                                socket.emit('api/getArchiveByName', message);
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
                        message.flag = 0;
                        message.total = count;
                        message.data = rows;
                        message.message = 'OK';
                        socket.emit('api/getArchiveByName', message);
                    }
                ],
                function (err, rows) {
                    if (err) {
                        message.message = '获取实时信息错误';
                        message.total = 0;
                        message.data = [];
                        socket.emit('api/getArchiveByName', message);
                        return;
                    }
                });
        });
        /**
         * 统计数据
         */
        socket.on('api/statistics', function (data) {
            var mess = GlobalAgent.getAPInfo(socket.id, APIUtils.READ_ARCHVIE);
            if (mess.flag < 0) {
                socket.emit('api/statistics', {
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
                socket.emit('api/alarm', message);
                return;
            }
            var offset = data.offset;
            var limit = data.limit;
            var GNs = data.GN;
            if (!GNs) {
                message.flag = -1;
                message.data = [];
                message.total = 0;
                message.message = '查询统计值GN不能为空';
                socket.emit('api/snapshot', message);
                return;
            }
            var beginDate = data.beginDate;
            var endDate = data.endDate;
            if (!beginDate || !endDate) {
                message.flag = -1;
                message.data = [];
                message.total = 0;
                message.message = '开始时间和结束时间都不能为空';
                socket.emit('api/statistics', message);
                return;
            }
            endDate = new Date(endDate).getTime() / 1000;
            beginDate = new Date(beginDate).getTime() / 1000;
            if (beginDate == 'NaN' || endDate == 'NaN') {
                message.flag = -1;
                message.data = [];
                message.total = 0;
                message.message = '时间格式不正确';
                socket.emit('api/statistics', message);
                return;
            }
            var interval = endDate - beginDate;
            if (interval < 1) {
                logger.error('间隔时间不能小于1s');
                message.flag = -1;
                message.data = [];
                message.total = 0;
                message.message = '间隔时间不能小于1s';
                socket.emit('api/statistics', message);
                return;
            }
            async.waterfall(
                [
                    function (callback) {
                        var sql = sqlQuery.select().from('sys_point').select('POINT_ID', 'URI').where({DOMAIN_ID: domainId, URI: GNs}).build();
                        logger.debug('获取测点静态信息sql：' + sql);
                        query(sql, function (error, rows, columns) {
                            if (error) {
                                logger.error('获取关系库静态信息错误:' + error);
                                message.flag = -1;
                                message.total = 0;
                                message.message = '获取信息错误';
                                message.data = [];
                                socket.emit('api/statistics', message);
                                return;
                            } else if (rows && rows.length < 1) {
                                message.flag = 0;
                                message.total = 0;
                                message.message = '没有满足条件的数据';
                                message.data = [];
                                socket.emit('api/statistics', message);
                            } else {
                                var ids = [];
                                for (var i  in rows) {
                                    ids.push(rows[i].POINT_ID);
                                }
                                if (ids.length < 1) {
                                    message.flag = 0;
                                    message.data = [];
                                    message.total = 0;
                                    message.message = 'OK';
                                    socket.emit('api/statistics', message);
                                    return;
                                }
                                callback(null, rows, ids);
                            }
                        });
                    },
                    function (rr, ids, callback) {
                        ids = ids.toString();
                        var sql = "select count(*) as count from Stat('" + interval + "s') where TM between '" + beginDate + "' and '" + endDate + "' ";
                        var sqlHistory = "select ID,TM,MAXV,MINV,MAXTIME,MINTIME,AVGV,FLOW from Stat where interval = '" + interval + "s' and TM between '" + beginDate + "' and '" + endDate + "' ";
                        sql += " and ID in (" + ids + ") ";
                        sqlHistory += " and ID in (" + ids + ") ";
                        logger.debug('查询统计总个数sql：' + sql);
                        if (offset && limit && typeof(offset) == 'number' && typeof(limit) == 'number') {
                            sqlHistory += " limit " + offset + "," + limit;
                        }
                        logger.debug('查询统计数据sql：' + sqlHistory);
                        var countRows = opPool.syncQuery(sql).rows;
                        opPool.query(sqlHistory, function (error, rows, colums) {
                            if (error) {
                                logger.error('查询历史数据错误：' + JSON.stringify(error));
                                message.flag = -1;
                                message.message = error.message;
                                message.data = [];
                                message.total = 0;
                                socket.emit('api/statistics', message);
                            } else if (rows.length < 1) {
                                message.flag = 0;
                                message.data = [];
                                message.total = 0;
                                message.message = 'OK';
                                socket.emit('api/statistics', message);
                                return;
                            } else {
                                callback(null, rr, rows, parseInt(countRows[0].count, 16));
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
                                    row.ED = pointRow.ED;
                                    row.RT = pointRow.RT;
                                    rows[i] = row;
                                    break;
                                }
                            }
                        }
                        message.flag = 0;
                        message.message = 'OK';
                        message.total = count;
                        message.data = rows;
                        socket.emit('api/statistics', message);
                    }
                ],
                function (err, rows) {
                    if (err) {
                        logger.error('获取统计信息错误:' + err);
                        message.flag = -1
                        message.message = '获取统计信息错误';
                        message.total = 0;
                        message.data = [];
                        socket.emit('api/statistics', message);
                        return;
                    }
                });
        });
        /**
         * 获取快照数据
         */
        socket.on('api/snapshot', function (data) {
            var mess = GlobalAgent.getAPInfo(socket.id, APIUtils.READ_ARCHVIE);
            if (mess.flag < 0) {
                socket.emit('api/snapshot', {
                    flag: -1,
                    message: mess.message,
                    total: 0,
                    data: null
                });
                return;
            }
            var domainId = mess.data.domainId;
            if (!domainId || domainId.length < 1) {
                message.flag = -1;
                message.message = '当前用户没有域';
                message.total = 0;
                message.data = [];
                socket.emit('api/alarm', message);
                return;
            }
            var GNs = data.GN;
            if (!GNs) {
                message.flag = -1;
                message.data = [];
                message.total = 0;
                message.message = '查询快照GN不能为空';
                socket.emit('api/snapshot', message);
                return;
            }
            var hisType = data.hisType;
            var interval = parseInt(data.interval);
            if (typeof(interval) != 'number' || interval < 0) {
                message.flag = -1;
                message.data = [];
                message.total = 0;
                message.message = 'interval参数必须为数字,且大于0';
                socket.emit('api/snapshot', message);
                return;
            }
            if (hisType == 'RAW' && interval != 1) {
                message.flag = -1;
                message.data = [];
                message.total = 0;
                message.message = '查询采样值，interval参数必须1';
                socket.emit('api/snapshot', message);
                return;
            }
            hisType = hisType.toUpperCase();
            if (hisType != 'RAW' && interval < 2) {
                message.flag = -1;
                message.data = [];
                message.total = 0;
                message.message = '查询非采样值，interval参数必须大于1';
                socket.emit('api/snapshot', message);
                return;
            }
            var beginDate = data.beginDate;
            var endDate = data.endDate;
            if (!beginDate || !endDate) {
                message.flag = -1;
                message.data = [];
                message.total = 0;
                message.message = '开始时间和结束时间都不能为空';
                socket.emit('api/snapshot', message);
                return;
            }
            endDate = new Date(endDate).getTime() / 1000;
            beginDate = new Date(beginDate).getTime() / 1000;
            if (beginDate == 'NaN' || endDate == 'NaN') {
                message.flag = -1;
                message.data = [];
                message.total = 0;
                message.message = '时间格式不正确';
                socket.emit('api/snapshot', message);
                return;
            }

            async.waterfall(
                [
                    function (callback) {
                        var sql = sqlQuery.select().from('sys_point').select('POINT_ID', 'URI', 'DESCRIPTION').where({DOMAIN_ID: domainId, URI: GNs}).build();
                        logger.debug('获取测点静态信息sql：' + sql);
                        query(sql, function (error, rows, columns) {
                            if (error) {
                                logger.error('获取关系库静态信息错误:' + error);
                                message.flag = -1;
                                message.total = 0;
                                message.message = '获取信息错误';
                                message.data = [];
                                socket.emit('api/snapshot', message);
                                return;
                            } else if (rows && rows.length < 1) {
                                message.flag = 0;
                                message.total = 0;
                                message.message = '没有满足条件的数据';
                                message.data = [];
                                socket.emit('api/snapshot', message);
                            } else {
                                var ids = [];
                                for (var i  in rows) {
                                    ids.push(rows[i].POINT_ID);
                                }
                                if (ids.length < 1) {
                                    message.flag = 0;
                                    message.data = [];
                                    message.total = 0;
                                    message.message = 'OK';
                                    socket.emit('api/snapshot', message);
                                    return;
                                }
                                callback(null, rows, ids);
                            }
                        });
                    },
                    function (rr, ids, callback) {
                        ids = ids.toString();
                        if (hisType == 'RAW') {
                            var sql = "select count(*) as count from archive where TM between '" + beginDate + "' and '" + endDate + "' and ID in (" + ids + ") ";
                            var sqlHistory = "select ID,TM,DS,AV from archive where TM between '" + beginDate + "' and '" + endDate + "'  and ID in (" + ids + ")";
                            logger.debug('查询采样值总个数sql：' + sql);
                            logger.debug('查询采样值数据sql：' + sqlHistory);
                            var countRows = opPool.syncQuery(sql).rows;
                            opPool.query(sqlHistory, function (error, rows, colums) {
                                if (error && error.code) {
                                    logger.error('查询采样值数据错误：' + JSON.stringify(error));
                                    message.flag = -1;
                                    message.data = [];
                                    message.total = 0;
                                    message.message = error.message;
                                    socket.emit('api/snapshot', message);
                                    return;
                                } else if (rows.length < 1) {
                                    message.flag = 0;
                                    message.data = [];
                                    message.total = 0;
                                    message.message = 'OK';
                                    socket.emit('api/snapshot', message);
                                    return;
                                } else {
                                    callback(null, rr, rows, parseInt(countRows[0].count, 16));
                                }
                            });
                        } else {
                            if (interval < 1) {
                                logger.error('非采样值统计，间隔要大于1s');
                                message.flag = -1;
                                message.message = '非采样值统计，间隔要大于1s';
                                message.total = 0;
                                message.data = [];
                                socket.emit('api/snapshot', message);
                                return;
                            }
                            var sqlHistory = "select ID,TM,DS,FLOW,MAXV,MINV,MAXTIME,MINTIME,AVGV,MEAN,STDEV from Stat where interval = '" + interval + "' and ID in (" + ids + ") and TM between '" + beginDate + "' and '" + endDate + "'";
                            logger.debug('查询统计数据sql：' + sqlHistory);
                            var countRows = opPool.syncQuery(sql).rows;
                            opPool.query(sqlHistory, function (error, rows, colums) {
                                if (error && error.code) {
                                    logger.error('查询统计数据错误：' + JSON.stringify(error));
                                    message.data = [];
                                    message.message = error.message;
                                    message.total = 0;
                                    socket.emit('api/snapshot', message);
                                    return;
                                } else if (rows.length < 1) {
                                    message.data = [];
                                    message.total = 0;
                                    message.message = 'OK';
                                    socket.emit('api/snapshot', message);
                                    return;
                                } else {
                                    var rs = [];
                                    for (var i in rows) {
                                        var r = {};
                                        var row = rows[i];
                                        r.ID = row.ID;
                                        r.DS = row.DS;
                                        r.TM = row.TM;
                                        r.AV = row[hisType];
                                        if (hisType == 'MAX') {
                                            r.TM = row.MAXTIME;
                                        } else if (hisType == 'MIN') {
                                            r.TM = row.MINTIME;
                                        }
                                        rs.push(r);
                                    }
                                    callback(null, rr, rs);
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
                                    row.ED = pointRow.DESCRIPTION;
                                    row.GN = pointRow.URI;
                                    rows[i] = row;
                                    break;
                                }
                            }
                        }
                        message.flag = 0;
                        message.total = rows.length;
                        message.data = rows;
                        message.message = 'OK';
                        socket.emit('api/snapshot', message);
                    }
                ],
                function (err, rows) {
                    if (err) {
                        logger.error('获取统计信息错误:' + err);
                        message.message = '获取统计信息错误';
                        message.total = 0;
                        message.data = [];
                        socket.emit('api/snapshot', message);
                        return;
                    }
                });
        });

        /**
         * 插入实时数据 通过ID集合
         */
        socket.on('api/insertRealtimeByID', function (data) {
            var mess = GlobalAgent.getAPInfo(socket.id, APIUtils.WRITE_REALTIME);
            if (mess.flag < 0) {
                socket.emit('api/insertRealtimeByID', {
                    flag: -1,
                    message: mess.message,
                    total: 0,
                    data: null
                });
                return;
            }
            var domainId = mess.data.domainId;
            if (!domainId || domainId.length < 1) {
                message.flag = -1;
                message.message = '当前用户没有域';
                message.total = 0;
                message.data = [];
                socket.emit('api/insertRealtimeByID', message);
                return;
            }
            var value = data;
            if (!value || value.length < 1) {
                message.flag = -1;
                message.data = [];
                message.total = 0;
                message.message = '插入数据不能为空';
                socket.emit('api/insertRealtimeByID', message);
                return;
            }
            var rrs = [];
            var size = value.length;
            var ids = [];
            for (var j = 0; j < size; j++) {
                var v = value[j];
                if (!v.ID || typeof(v.ID) != 'number') {
                    message.flag = -1;
                    message.message = '第' + (j + 1) + '行数据ID不为数字';
                    message.total = 0;
                    socket.emit('api/insertRealtimeByID', message);
                    return;
                }
                ids.push(v.ID);
            }
            var cols = [];
            cols.push(["ID", OPAPI.TYPE.INT32]);
            cols.push(["AV", OPAPI.TYPE.FLOAT]);
            cols.push(["TM", OPAPI.TYPE.DOUBLE]);
            cols.push(["DS", OPAPI.TYPE.INT32]);
            delete message.data;
            async.waterfall(
                [
                    function (callback) {
                        var sql = 'select POINT_ID as ID from sys_point where DOMAIN_ID in (' + domainId + ') and POINT_ID in (' + ids.toString() + ')';
                        query(sql, function (error, rows, columns) {
                            if (error || !rows) {
                                logger.error('插入实时数据错误：' + error);
                                message.flag = -1;
                                message.message = '查询权限测点信息错误';
                                message.total = 0;
                                socket.emit('api/insertRealtimeByID', message);
                                return;
                            } else if (!rows || rows.length < 1) {
                                message.flag = -1;
                                message.message = '所有ID都不存在';
                                message.total = 0;
                                socket.emit('api/insertRealtimeByID', message);
                                return;
                            } else {
                                var tt = [];
                                var ttt = [];
                                for (var i in rows) {
                                    ttt.push(rows[i].ID);
                                }
                                for (var i in ids) {
                                    if (ttt.indexOf(ids[i]) < 0) {
                                        tt.push(ids[i]);
                                    }
                                }
                                var me = 'OK';
                                if (tt.length > 0) {
                                    me = 'ID为' + tt.toString() + '不存在';
                                }
                                var size = value.length;
                                for (var j = 0; j < size; j++) {
                                    var v = value[j];
                                    if (ttt.indexOf(v.ID) > -1) {
                                        var row = [];
                                        row[0] = v.ID;
                                        row[1] = v.AV;
                                        row[2] = v.TM;
                                        row[3] = v.DS;
                                        rrs.push(row);
                                    }
                                }
                                if (rrs.length < 1) {
                                    message.flag = -1;
                                    message.message = '所有ID都不存在';
                                    message.total = 0;
                                    socket.emit('api/insertRealtimeByID', message);
                                    return;
                                }
                                callback(null, me);
                            }
                        });
                    },
                    function (me, callback) {
                        opPool.update('Realtime', rrs, cols, function (error, rows, cols) {
                            if (error && error.code) {
                                logger.error("通过ID集合更新实时信息错误：" + JSON.stringify(error));
                                message.flag = -1;
                                message.message = error.message;
                                message.total = 0;
                                socket.emit('api/insertRealtimeByID', message);
                                return;
                            } else {
                                message.flag = 0;
                                message.message = me;
                                message.total = rows.length;
                                socket.emit('api/insertRealtimeByID', message);
                                return;
                            }
                        });
                    }
                ],
                function (err) {
                    if (err) {
                        message.flag = -1;
                        message.message = '插入实时值错误';
                        message.total = 0;
                        socket.emit('api/insertRealtimeByID', message);
                        return;
                    }
                }
            )

        });
        /**
         * 插入实时数据 通过ID集合
         */
        socket.on('api/insertRealtimeByName', function (data) {
            var mess = GlobalAgent.getAPInfo(socket.id, APIUtils.WRITE_REALTIME);
            if (mess.flag < 0) {
                socket.emit('api/insertRealtimeByName', {
                    flag: -1,
                    message: mess.message,
                    total: 0,
                    data: null
                });
                return;
            }
            var domainId = mess.data.domainId;
            if (!domainId || domainId.length < 1) {
                message.flag = -1;
                message.message = '当前用户没有域';
                message.total = 0;
                message.data = [];
                socket.emit('api/insertRealtimeByName', message);
                return;
            }
            var value = data;
            if (!value || value.length < 1) {
                message.flag = -1;
                message.data = [];
                message.total = 0;
                message.message = '插入数据不能为空';
                socket.emit('api/insertRealtimeByName', message);
                return;
            }
            var rrs = [];
            var gns = [];
            var size = value.length;
            for (var j = 0; j < size; j++) {
                var v = value[j];
                if (!v.GN) {
                    message.flag = -1;
                    message.message = '第' + (j + 1) + '行数据GN不存在';
                    message.total = 0;
                    socket.emit('api/insertRealtimeByName', message);
                    return;
                }
                gns.push(v.GN);
            }
            var cols = [];
            cols.push(["ID", OPAPI.TYPE.INT32]);
            cols.push(["AV", OPAPI.TYPE.FLOAT]);
            cols.push(["TM", OPAPI.TYPE.DOUBLE]);
            cols.push(["DS", OPAPI.TYPE.INT32]);
            delete message.data;
            async.waterfall(
                [
                    function (callback) {
                        var sql = sqlQuery.select().from('sys_point').select('POINT_ID', 'URI').where({URI: gns, DOMAIN_ID: domainId}).build();
                        logger.debug('获取对应的测点信息sql:' + sql);
                        query(sql, function (error, rows, columns) {
                            if (error || !rows) {
                                logger.error('插入实时数据错误：' + error);
                                message.flag = -1;
                                message.message = '查询权限测点信息错误';
                                message.total = 0;
                                socket.emit('api/insertRealtimeByID', message);
                                return;
                            } else {
                                var tt = [];
                                var ttt = [];
                                var ids = [];
                                for (var i in rows) {
                                    ttt.push(rows[i].URI);
                                    ids.push(rows[i].POINT_ID);
                                }
                                for (var i in gns) {
                                    if (ttt.indexOf(gns[i]) < 0) {
                                        tt.push(gns[i]);
                                    }
                                }
                                var me = 'OK';
                                if (tt.length > 0) {
                                    me = 'GN为' + tt.toString() + '不存在';
                                }
                                var size = value.length;
                                for (var j = 0; j < size; j++) {
                                    var v = value[j];
                                    for (var t = 0; t < ttt.length; t++) {
                                        if (ttt[t] == v.GN) {
                                            var row = [];
                                            row[0] = ids[t];
                                            row[1] = v.AV;
                                            row[2] = v.TM;
                                            row[3] = v.DS;
                                            rrs.push(row);
                                        }
                                    }
                                }
                                if (rrs.length < 1) {
                                    message.flag = -1;
                                    message.message = '所有GN都不存在';
                                    message.total = 0;
                                    socket.emit('api/insertRealtimeByName', message);
                                    return;
                                }
                                callback(null, me);
                            }
                        });
                    },
                    function (me, callback) {
                        opPool.update('Realtime', rrs, cols, function (error, rows, cols) {
                            if (error && error.code) {
                                logger.error("通过点名集合更新实时信息错误：" + JSON.stringify(error));
                                message.flag = -1;
                                message.message = error.message;
                                message.total = 0;
                                socket.emit('api/insertRealtimeByName', message);
                                return;
                            } else {
                                message.flag = 0;
                                message.message = me;
                                message.total = rows.length;
                                socket.emit('api/insertRealtimeByName', message);
                                return;
                            }
                        });
                    }
                ],
                function (err) {

                }
            )

        });
        /**
         * 插入历史数据 通过ID 集合
         */
        socket.on('api/insertArchiveByID', function (data) {
            var mess = GlobalAgent.getAPInfo(socket.id, APIUtils.WRITH_ARCHIVE);
            if (mess.flag < 0) {
                socket.emit('api/insertArchiveByID', {
                    flag: -1,
                    message: mess.message,
                    total: 0,
                    data: null
                });
                return;
            }
            var domainId = mess.data.domainId;
            if (!domainId || domainId.length < 1) {
                message.flag = -1;
                message.message = '当前用户没有域';
                message.total = 0;
                message.data = [];
                socket.emit('api/insertArchiveByID', message);
                return;
            }
            var value = data;
            if (!value || value.length < 1) {
                message.flag = -1;
                message.data = [];
                message.total = 0;
                message.message = '插入数据不能为空';
                socket.emit('api/insertArchiveByID', message);
                return;
            }
            var rrs = [];
            var size = value.length;
            var ids = [];
            for (var j = 0; j < size; j++) {
                var v = value[j];
                if (!v.ID || typeof(v.ID) != 'number') {
                    message.flag = -1;
                    message.message = '第' + (j + 1) + '行数据ID不为数字';
                    message.total = 0;
                    socket.emit('api/insertArchiveByID', message);
                    return;
                }
                ids.push(v.ID);
            }
            var cols = [];
            cols.push(["ID", OPAPI.TYPE.INT32]);
            cols.push(["AV", OPAPI.TYPE.FLOAT]);
            cols.push(["TM", OPAPI.TYPE.DOUBLE]);
            cols.push(["DS", OPAPI.TYPE.INT32]);
            delete message.data;
            async.waterfall(
                [
                    function (callback) {
                        var sql = 'select POINT_ID as ID from sys_point where DOMAIN_ID in (' + domainId + ') and POINT_ID in (' + ids.toString() + ')';
                        query(sql, function (error, rows, columns) {
                            if (error || !rows) {
                                logger.error('插入实时数据错误：' + error);
                                message.flag = -1;
                                message.message = '查询权限测点信息错误';
                                message.total = 0;
                                socket.emit('api/insertArchiveByID', message);
                                return;
                            } else {
                                var tt = [];
                                var ttt = [];
                                for (var i in rows) {
                                    ttt.push(rows[i].ID);
                                }
                                for (var i in ids) {
                                    if (ttt.indexOf(ids[i]) < 0) {
                                        tt.push(ids[i]);
                                    }
                                }
                                var me = 'OK';
                                if (tt.length > 0) {
                                    me = 'ID为' + tt.toString() + '不存在';
                                }
                                var size = value.length;
                                for (var j = 0; j < size; j++) {
                                    var v = value[j];
                                    if (ttt.indexOf(v.ID) > -1) {
                                        var row = [];
                                        row[0] = v.ID;
                                        row[1] = v.AV;
                                        row[2] = v.TM;
                                        row[3] = v.DS;
                                        rrs.push(row);
                                    }
                                }
                                if (rrs.length < 1) {
                                    message.flag = -1;
                                    message.message = '所有ID都不存在';
                                    message.total = 0;
                                    socket.emit('api/insertArchiveByID', message);
                                    return;
                                }
                                callback(null, me);
                            }
                        });
                    },
                    function (me, callback) {
                        opPool.update('Archive', rrs, cols, function (error, rows, cols) {
                            if (error && error.code) {
                                logger.error("通过ID集合更新历史信息错误：" + JSON.stringify(error));
                                message.flag = -1;
                                message.message = error.message;
                                message.total = 0;
                                socket.emit('api/insertArchiveByID', message);
                                return;
                            } else {
                                message.flag = 0;
                                message.message = me;
                                message.total = rrs.length;
                                socket.emit('api/insertArchiveByID', message);
                                return;
                            }
                        });
                    }
                ],
                function (err) {
                    if (err) {
                        message.flag = -1;
                        message.message = '插入历史失败';
                        message.total = 0;
                        socket.emit('api/insertArchiveByID', message);
                        return;
                    }
                }
            );

        });
        /**
         * 插入历史数据 通过UD 集合
         */
        socket.on('api/insertArchiveByName', function (data) {
            var mess = GlobalAgent.getAPInfo(socket.id, APIUtils.WRITH_ARCHIVE);
            if (mess.flag < 0) {
                socket.emit('api/insertArchiveByName', {
                    flag: -1,
                    message: mess.message,
                    total: 0,
                    data: null
                });
                return;
            }
            var domainId = mess.data.domainId;
            if (!domainId || domainId.length < 1) {
                message.flag = -1;
                message.message = '当前用户没有域';
                message.total = 0;
                message.data = [];
                socket.emit('api/insertArchiveByName', message);
                return;
            }
            var value = data;
            if (!value || value.length < 1) {
                message.flag = -1;
                message.data = [];
                message.total = 0;
                message.message = '插入数据不能为空';
                socket.emit('api/insertArchiveByName', message);
                return;
            }
            var rrs = [];
            var gns = [];
            var size = value.length;
            for (var j = 0; j < size; j++) {
                var v = value[j];
                if (!v.GN) {
                    message.flag = -1;
                    message.message = '第' + (j + 1) + '行数据GN不存在';
                    message.total = 0;
                    socket.emit('api/insertRealtimeByName', message);
                    return;
                }
                gns.push(v.GN);
            }
            var cols = [];
            cols.push(["ID", OPAPI.TYPE.INT32]);
            cols.push(["AV", OPAPI.TYPE.FLOAT]);
            cols.push(["TM", OPAPI.TYPE.DOUBLE]);
            cols.push(["DS", OPAPI.TYPE.INT32]);
            delete message.data;
            async.waterfall(
                [
                    function (callback) {
                        var sql = sqlQuery.select().from('sys_point').select('POINT_ID', 'URI').where({URI: gns, DOMAIN_ID: domainId}).build();
                        query(sql, function (error, rows, columns) {
                            if (error || !rows) {
                                logger.error('插入实时数据错误：' + error);
                                message.flag = -1;
                                message.message = '查询权限测点信息错误';
                                message.total = 0;
                                socket.emit('api/insertArchiveByName', message);
                                return;
                            } else {
                                var tt = [];
                                var ttt = [];
                                var ids = [];
                                for (var i in rows) {
                                    ttt.push(rows[i].URI);
                                    ids.push(rows[i].POINT_ID);
                                }
                                for (var i in gns) {
                                    if (ttt.indexOf(gns[i]) < 0) {
                                        tt.push(gns[i]);
                                    }
                                }
                                var me = 'OK';
                                if (tt.length > 0) {
                                    me = 'GN为' + tt.toString() + '不存在';
                                }
                                var size = value.length;
                                for (var j = 0; j < size; j++) {
                                    var v = value[j];
                                    for (var t = 0; t < ttt.length; t++) {
                                        if (ttt[t] == v.GN) {
                                            var row = [];
                                            row[0] = ids[t];
                                            row[1] = v.AV;
                                            row[2] = v.TM;
                                            row[3] = v.DS;
                                            rrs.push(row);
                                        }
                                    }
                                }
                                if (rrs.length < 1) {
                                    message.flag = -1;
                                    message.message = '所有GN都不存在';
                                    message.total = 0;
                                    socket.emit('api/insertArchiveByName', message);
                                    return;
                                }
                                callback(null, me);
                            }
                        });
                    },
                    function (me, callback) {
                        opPool.update('Archive', rrs, cols, function (error, rows, cols) {
                            if (error && error.code) {
                                logger.error("通过点名集合更新历史信息错误：" + JSON.stringify(error));
                                message.flag = -1;
                                message.message = error.message;
                                message.total = 0;
                                socket.emit('api/insertArchiveByName', message);
                                return;
                            } else {
                                message.flag = 0;
                                message.message = 'OK';
                                message.total;
                                socket.emit('api/insertArchiveByName', message);
                                return;
                            }
                        });
                    }
                ],
                function (err) {
                    if (err) {
                    }
                });

        });

    }
}
module.exports = dataSocket;

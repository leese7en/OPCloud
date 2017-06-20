var opPool = require('../openplant/openPlantPool')
var utils = require('../rsa/rsaUtils');
var log4js = require('log4js');
var logger = log4js.getLogger('system');
var GlobalAgent = require('../message/GlobalAgent');
var async = require('async');
var sqlQuery = require('sql-query').Query();
var message = {
    flag: 0,
    message: 'OK',
    data: null
}
var realTimes = 60 * 10;
var trendSocket = {
    socketOn: function (socket) {
        /*查询点静态信息*/
        socket.on('trend/getPointInfo', function (data) {
            var user = socket.handshake.session.user;
            var domainId = GlobalAgent.getUserDomain(user.USER_ID);
            if (!domainId) {
                message.flag = -1;
                message.data = [];
                message.message = '没有对应的域';
                socket.emit('trend/getPointInfo', {
                    value: message
                });
                return;
            }
            var pointsName = data.pointsName.toString().split(',');
            async.waterfall(
                [
                    function (callback) {
                        var sql = sqlQuery.select().from('sys_point').select('POINT_ID', 'UUID', 'URI').where({URI: pointsName, DOMAIN_ID: domainId}).build();
                        logger.debug('获取测点信息sql：' + sql);
                        query(sql, function (error, rows, columns) {
                            if (error) {
                                logger.error('获取测点信息错误：' + error);
                                message.flag = -1;
                                message.message = '获取测点信息错误';
                                message.data = null;
                                socket.emit('trend/getPointInfo', {
                                    value: message
                                });
                                return;
                            } else {
                                callback(null, rows);
                            }

                        });
                    },
                    function (rrs, callback) {
                        var ids = [];
                        for (var i in rrs) {
                            ids.push(rrs[i].POINT_ID);
                        }
                        if (ids.length < 1) {
                            message.flag = 0;
                            message.message = 'OK';
                            message.data = [];
                            socket.emit('trend/getPointInfo', {
                                value: message
                            });
                            return;
                        }
                        var cols = ["ID", "GN", "PN", "ED", "FM", "EU", "RT", "TV", "BV"];
                        logger.debug('获取测点静态信息');
                        opPool.find("Point", 'ID', ids, cols, function (error, rows, columns) {
                            if (error || error.code) {
                                logger.error('获取静态信息错误：' + JSON.stringify(error));
                                message.flag = -1;
                                message.message = '没有获取到满足条件的数据';
                                message.data = null;
                            } else {
                                for (var i in rows) {
                                    var row = rows[i];
                                    for (var j in rrs) {
                                        if (rrs[j].POINT_ID == row.ID) {
                                            row.GN = rrs[j].URI;
                                            rows[i] = row;
                                            break;
                                        }
                                    }
                                }
                                message.flag = 0;
                                message.data = rows;
                                message.message = 'OK';
                            }
                            socket.emit('trend/getPointInfo', {
                                value: message
                            });
                        });
                    }
                ],
                function (err) {
                    if (err) {
                        message.flag = 0;
                        message.data = rows;
                        message.message = null;
                        socket.emit('trend/getPointInfo', {
                            value: message
                        });
                        return;
                    }
                }
            )
        });
        /*
         查询历史数据
         */
        socket.on('trend/getTrendHis', function (data) {
            var user = socket.handshake.session.user;
            var domainId = GlobalAgent.getUserDomain(user.USER_ID);
            if (!domainId) {
                message.flag = -1;
                message.data = [];
                message.message = '没有对应的域';
                socket.emit('trend/getPointInfo', {
                    value: message
                });
                return;
            }
            var pointsName = data.pointsName.toString().split(',');
            var isRealFlag = true;
            var mode = data.pointType;
            //格式化时间
            var beginTime = data.beginTime;
            var endTime = data.endTime;
            if (!beginTime || !endTime) {
                var nowTime = opPool.systemTime();
                endTime = new Date(nowTime).getTime() / 1000;
                beginTime = endTime - realTimes;
                mode = '';
            } else {
                endTime = new Date(endTime).getTime() / 1000;
                beginTime = new Date(beginTime).getTime() / 1000;
                //获取查询时间间隔
                var interval = utils.getInterval(beginTime, endTime);
                //构建查询数值类型
                if (interval < 2) {
                    mode = '';
                } else {
                    mode = 'mode  ="' + mode + '" and interval ="' + interval + 's" and  ';
                }
                isRealFlag = false;
            }
            if (!isRealFlag) {
                async.waterfall(
                    [
                        function (callback) {
                            var sql = sqlQuery.select().from('sys_point').select('POINT_ID', 'UUID', 'URI').where({
                                URI: pointsName,
                                DOMAIN_ID: domainId
                            }).build();
                            logger.debug('获取测点信息sql：' + sql);
                            query(sql, function (error, rows, columns) {
                                if (error) {
                                    logger.error('获取测点信息错误：' + error);
                                    message.flag = -1;
                                    message.message = '获取测点信息错误';
                                    message.data = null;
                                    socket.emit('trend/getPointInfo', {
                                        value: message
                                    });
                                    return;
                                } else {

                                    callback(null, rows);
                                }
                            });
                        },
                        function (rr, callback) {
                            var ids = [];
                            for (var i in rr) {
                                ids.push(rr[i].POINT_ID);
                            }
                            if (ids.length < 1) {
                                socket.emit('trend/getTrendHis', {
                                    value: {
                                        beginTime: beginTime * 1000,
                                        endTime: endTime * 1000
                                    }
                                });
                                return;
                            }
                            var sql = 'select ID,GN,TM,DS,AV from archive where 1=1 and ' + mode + ' TM between ' + beginTime + ' and ' + endTime + ' and ID in (' + ids.toString() + ') order by TM';
                            logger.debug('获取趋势历史信息:' + sql);
                            opPool.query(sql, function (error, rows, columns) {
                                var result = rows;
                                var pointMap = {};
                                var pointsArray = {};
                                var point;
                                for (var i = 0; i < result.length; i++) {
                                    var obj = result[i];
                                    point = {};
                                    var pointArray = pointMap[obj.ID];
                                    if (!pointArray) {
                                        pointArray = [];
                                        pointMap[obj.ID] = pointArray;
                                    }
                                    if (utils.statusOfDS(obj.DS)) {
                                        var indexObj = pointArray[pointArray.length - 1];
                                        if (indexObj && indexObj.y == null) {
                                            continue;
                                        } else {
                                            point.y = null;
                                            point.x = obj.TM * 1000;
                                            point.DS = obj.DS;
                                            pointArray.push(point);
                                        }
                                    } else {
                                        var indexObj = pointArray[pointArray.length - 1];
                                        if (indexObj && !indexObj.y && pointArray.length != 1) {
                                            point.y = null;
                                            point.x = obj.TM * 1000 - 1000;
                                            point.DS = obj.DS;
                                            pointArray.push(point);
                                        }
                                        point.y = obj.AV;
                                        point.x = obj.TM * 1000;
                                        point.DS = obj.DS;
                                        pointArray.push(point);
                                    }
                                    pointMap[obj.ID] = pointArray;
                                }

                                //数据对应
                                for (var i = 0; i < pointsName.length; i++) {
                                    for (var t in rr) {
                                        if (rr[t].URI == pointsName[i]) {
                                            pointsArray[pointsName[i]] = pointMap[rr[t].POINT_ID];
                                            break;
                                        }
                                    }
                                }
                                var returnValue = {};
                                returnValue.beginTime = beginTime * 1000;
                                returnValue.endTime = endTime * 1000;
                                returnValue.value = pointsArray;
                                socket.emit('trend/getTrendHis', {
                                    value: returnValue
                                });
                            });
                        }
                    ],
                    function (err) {
                        if (err) {
                            logger.error('获取历史数据错误：' + err);
                            socket.emit('trend/getTrendHis', {
                                value: {}
                            });
                        }
                    }
                );
            } else {
                async.waterfall(
                    [
                        function (callback) {
                            var sql = sqlQuery.select().from('sys_point').select('POINT_ID', 'UUID', 'URI').where({
                                URI: pointsName,
                                DOMAIN_ID: domainId
                            }).build();
                            logger.debug('获取测点信息sql：' + sql);
                            query(sql, function (error, rows, columns) {
                                if (error) {
                                    logger.error('获取测点信息错误：' + error);
                                    message.flag = -1;
                                    message.message = '获取测点信息错误';
                                    message.data = null;
                                    socket.emit('trend/getPointInfo', {
                                        value: message
                                    });
                                    return;
                                } else {
                                    callback(null, rows);
                                }
                            });
                        },
                        function (rr, callback) {
                            var ids = [];
                            for (var i in rr) {
                                ids.push(rr[i].POINT_ID);
                            }
                            if (ids.length < 1) {
                                socket.emit('trend/getTrendHis', {
                                    value: {
                                        beginTime: beginTime * 1000,
                                        endTime: endTime * 1000
                                    }
                                });
                                return;
                            }
                            var dEndtime = endTime;
                            var sqlReal = 'select ID,GN,TM,DS,AV from realtime where ID in (' + ids.toString() + ')';
                            logger.debug('获取实时数据,用于验证测点和服务器时间:' + sqlReal);
                            opPool.query(sqlReal, function (error, rows, columns) {
                                for (var i = 0; i < rows.length; i++) {
                                    var TM = rows[i].TM;
                                    if (TM > dEndtime) {
                                        dEndtime = TM;
                                    }
                                }
                                callback(null, ids, dEndtime, rr);
                            });
                        },
                        function (ids, dEndtime, rr, callback) {
                            var sql = 'select ID, TM, DS,AV from archive' + mode + ' where TM between ' + beginTime + ' and ' + dEndtime + ' and ID in (' + ids.toString() + ') order by TM ';
                            logger.debug('获取趋势历史信息:' + sql);
                            opPool.query(sql, function (error, rows, columns) {
                                var result = rows;
                                var pointMap = {};
                                var pointsArray = {};
                                var point;
                                for (var i = 0; i < result.length; i++) {
                                    var obj = result[i];
                                    point = {};
                                    var pointArray = pointMap[obj.ID];
                                    if (!pointArray) {
                                        pointArray = [];
                                        pointMap[obj.ID] = pointArray;
                                    }
                                    if (utils.statusOfDS(obj.DS)) {
                                        var indexObj = pointArray[pointArray.length - 1];
                                        if (indexObj && indexObj.y == null) {
                                            continue;
                                        } else {
                                            point.y = null;
                                            point.x = obj.TM * 1000;
                                            point.DS = obj.DS;
                                            pointArray.push(point);
                                        }
                                    } else {
                                        var indexObj = pointArray[pointArray.length - 1];
                                        if (indexObj && !indexObj.y) {
                                            point.y = null;
                                            point.x = obj.TM * 1000 - 1000;
                                            point.DS = obj.DS;
                                            pointArray.push(point);
                                        }
                                        point.y = obj.AV;
                                        point.x = obj.TM * 1000;
                                        point.DS = obj.DS;
                                        pointArray.push(point);
                                    }
                                    pointMap[obj.ID] = pointArray;
                                }
                                //数据对应
                                for (var i = 0; i < pointsName.length; i++) {
                                    for (var t in rr) {
                                        if (rr[t].URI == pointsName[i]) {
                                            pointsArray[pointsName[i]] = pointMap[rr[t].POINT_ID];
                                            break;
                                        }
                                    }
                                }
                                var returnValue = {};
                                returnValue.beginTime = beginTime * 1000;
                                returnValue.endTime = endTime * 1000;
                                returnValue.value = pointsArray;
                                socket.emit('trend/getTrendHis', {
                                    value: returnValue
                                });
                            });
                        }
                    ],
                    function (err) {
                        if (err) {
                            logger.error('获取历史数据错误：' + err);
                            socket.emit('trend/getTrendHis', {
                                value: {}
                            });
                        }
                    });
            }
        });
        /**
         * 监听获取实时值
         */
        socket.on('trend/refreshTrend', function (data) {
            var user = socket.handshake.session.user;
            var domainId = GlobalAgent.getUserDomain(user.USER_ID);
            if (!domainId) {
                message.flag = -1;
                message.data = [];
                message.message = '没有对应的域';
                socket.emit('trend/refreshTrend', {
                    value: message
                });
                return;
            }
            var pointsName = data.pointsName.toString().split(',');
            async.waterfall(
                [
                    function (callback) {
                        var sql = sqlQuery.select().from('sys_point').select('POINT_ID', 'UUID', 'URI').where({URI: pointsName, DOMAIN_ID: domainId}).build();
                        logger.debug('获取测点信息sql：' + sql);
                        query(sql, function (error, rows, columns) {
                            if (error) {
                                logger.error('获取测点信息错误：' + error);
                                message.flag = -1;
                                message.message = '获取测点信息错误';
                                message.data = null;
                                socket.emit('trend/refreshTrend', {
                                    value: message
                                });
                                return;
                            } else {
                                var ids = [];
                                for (var i in rows) {
                                    ids.push(rows[i].POINT_ID);
                                }
                                if (ids.length < 1) {
                                    var nowTime = opPool.systemTime();
                                    nowTime = new Date(nowTime).getTime();
                                    socket.emit('trend/refreshTrend', {
                                        value: {
                                            time: nowTime
                                        }
                                    });
                                    return;
                                }
                                callback(null, ids);
                            }
                        });
                    },
                    function (ids, callback) {
                        var time = opPool.systemTime();
                        var sqlReal = 'select ID,TM, DS,AV from realtime where ID in (' + ids.toString() + ')';
                        logger.debug('获取实时数据sql:' + sqlReal);
                        opPool.query(sqlReal, function (error, rows, columns) {
                            var oo = {};
                            var pointsArray = {};
                            var point;
                            for (var j = 0; j < ids.length; j++) {
                                for (var i = 0; i < rows.length; i++) {
                                    var obj = rows[i];
                                    if (ids[j] != obj.ID) {
                                        continue;
                                    }
                                    point = {};
                                    if (utils.statusOfDS(obj.DS)) {
                                        point.y = null;
                                    } else {
                                        point.y = obj.AV;
                                    }
                                    point.x = obj.TM * 1000;
                                    point.DS = obj.DS;
                                    pointsArray[obj.ID] = point;
                                }
                            }
                            oo.time = new Date(time).getTime();
                            oo.value = pointsArray;
                            socket.emit('trend/refreshTrend', {value: oo});
                        });
                    }
                ],
                function (err) {
                    logger.error('查询实时数据错误：' + err);
                    socket.emit('trend/refreshTrend', {
                        value: {}
                    });
                }
            )
        });
    }
}

module.exports = trendSocket;

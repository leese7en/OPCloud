var actionUtil = require("../../framework/action/actionUtils")();
var async = require("async");
var query = actionUtil.query;
var utils = require('../../rsa/rsaUtils');
var logger = require('log4js').getLogger('Ibox');
var GlobalAgent = require('../../message/GlobalAgent');
var sqlQuery = require('sql-query').Query();
var opPool = require('../../openplant/openPlantPoolBox');
var message = {
    Status: 0,
    message: '成功',
    Data: null
}

var boxInfo = {
    /**
     * 模糊查询所有测点
     * @param req
     * @param res
     */
    blurryBoxPoint: function (req, res) {
        var userId = req.body.userId || req.query.userId;
        var devCode = req.body.devCode || req.query.devCode;
        var ED = req.body.ED || req.query.ED;
        if (!userId) {
            message.Status = false;
            message.message = '用户ID不能为空';
            message.Data = null;
            res.json(message);
            return;
        }
        if (!devCode) {
            message.Status = false;
            message.message = '设备码不能为空';
            message.Data = null;
            res.json(message);
            return;
        }
        async.waterfall(
            [
                function (callback) {
                    var sql = sqlQuery.select().from('box_user_box').select(['user_id']).where({
                        user_id: userId,
                        dev_code: devCode
                    }).build();
                    logger.debug('获取是否有盒子信息sql:' + sql);
                    query(sql, function (error, rows) {
                        if (error) {
                            logger.error('获取是否有盒子信息错误：' + error);
                            message.Status = false;
                            message.message = '获取是否有盒子信息失败';
                            message.Data = null;
                            callback(error, message);
                        } else {
                            if (rows.length != 1) {
                                message.Status = false;
                                message.message = '获取是否有盒子信息';
                                message.Data = null;
                                callback(new Error('获取是否有盒子信息'), message);
                            } else {
                                callback(null);
                            }
                        }
                    });
                },
                function (callback) {
                    devCode = 'UNIT1';
                    var sqlReal = 'select GN,ED from Point where GN like "W3.' + devCode + '.%"';
                    if (ED) {
                        sqlReal += ' and ED like "%' + ED + '%"'
                    }
                    logger.debug('获取测点数据sql:' + sqlReal);
                    opPool.query(sqlReal, function (error, rows, colums) {
                        if (error && error.code) {
                            logger.error('查询测点数据错误：' + JSON.stringify(error));
                            message.Status = false;
                            message.message = '获取测点数据出错';
                            message.Data = [];
                            callback(new Error('获取实时数据出错'), message);
                        } else {
                            message.Status = true;
                            message.message = 'OK';
                            message.Data = rows;
                            callback(null, message);
                        }
                    });
                }
            ],
            function (error, message) {
                res.json(message);
            }
        );
    },
    /**
     * 模糊查询所有测点实时数据
     * @param req
     * @param res
     */
    blurryBoxRealtime: function (req, res) {
        var userId = req.body.userId || req.query.userId;
        var devCode = req.body.devCode || req.query.devCode;
        var ED = req.body.ED || req.query.ED;
        var limit = req.body.limit || req.query.limit || 0;
        var offset = req.body.offset || req.query.offset || 20;
        if (!userId) {
            message.Status = false;
            message.message = '用户ID不能为空';
            message.Data = null;
            res.json(message);
            return;
        }
        if (!devCode) {
            message.Status = false;
            message.message = '设备码不能为空';
            message.Data = null;
            res.json(message);
            return;
        }
        async.waterfall(
            [
                function (callback) {
                    var sql = sqlQuery.select().from('box_user_box').select(['user_id']).where({
                        user_id: userId,
                        dev_code: devCode
                    }).build();
                    logger.debug('获取是否有盒子信息sql:' + sql);
                    query(sql, function (error, rows) {
                        if (error) {
                            logger.error('获取是否有盒子信息错误：' + error);
                            message.Status = false;
                            message.message = '获取是否有盒子信息失败';
                            message.Data = null;
                            callback(error, message);
                        } else {
                            if (rows.length != 1) {
                                message.Status = false;
                                message.message = '获取是否有盒子信息';
                                message.Data = null;
                                callback(new Error('获取是否有盒子信息'), message);
                            } else {
                                callback(null);
                            }
                        }
                    });
                },
                function (callback) {
                    devCode = 'UNIT1';
                    var countSQL = 'select count(ID) as count from realtime where GN like "W3.' + devCode + '.%"';
                    var sqlReal = 'select ID,GN,ED,RT,TM,DS,AV from realtime where GN like "W3.' + devCode + '.%"';
                    if (ED) {
                        countSQL += ' and ED like "%' + ED + '%"'
                        sqlReal += ' and ED like "%' + ED + '%"'
                    }
                    sqlReal += ' order by ID limit ' + offset + ',' + limit;
                    logger.debug('获取实时总个数sql:', countSQL);
                    var count = opPool.syncQuery(countSQL).rows[0].count;
                    logger.debug('获取实时数据sql:' + sqlReal);
                    opPool.query(sqlReal, function (error, rows, colums) {
                        if (error && error.code) {
                            logger.error('查询实时数据错误：' + JSON.stringify(error));
                            message.Status = false;
                            message.message = '获取实时数据出错';
                            message.Data = {
                                total: 0,
                                rows: []
                            };
                            callback(new Error('获取实时数据出错'), message);
                        } else {
                            message.Status = true;
                            message.message = 'OK';
                            message.Data = {
                                total: parseInt(count, 16),
                                rows: rows
                            };
                            callback(null, message);
                        }
                    });
                }
            ],
            function (error, message) {
                res.json(message);
            }
        );
    },
    /**
     * 获取测点历史数据
     * @param req
     * @param res
     */
    getBoxHis: function (req, res) {
        var userId = req.body.userId || req.query.userId;
        var devCode = req.body.devCode || req.query.devCode;
        if (!userId) {
            message.Status = false;
            message.message = '用户ID不能为空';
            message.Data = null;
            res.json(message);
            return;
        }
        if (!devCode) {
            message.Status = false;
            message.message = '设备码不能为空';
            message.Data = null;
            res.json(message);
            return;
        }
        var GNs = req.body.GNs || req.query.GNs;
        if (!GNs) {
            message.Status = false;
            message.message = '点名不能为空';
            message.Data = null;
            res.json(message);
            return;
        }
        GNs = GNs.split(',');
        var limit = req.body.limit || req.query.limit || 0;
        var offset = req.body.offset || req.query.offset || 20;
        var beginDate = req.body.beginDate || req.query.beginDate;
        var endDate = req.body.endDate || req.query.endDate;
        if (!beginDate || !endDate) {
            message.Status = false;
            message.message = '开始时间和结束时间都不能为空';
            message.Data = null;
            res.json(message);
            return;
        }
        var pointNames = '';
        var size = GNs.length;
        for (var i = 0; i < size; i++) {
            pointNames += '"' + GNs[i] + '"';
            if (GNs[i + 1]) {
                pointNames += ',';
            }
        }
        async.waterfall(
            [
                function (callback) {
                    var sql = sqlQuery.select().from('box_user_box').select(['user_id']).where({
                        user_id: userId,
                        dev_code: devCode
                    }).build();
                    logger.debug('获取是否有盒子信息sql:' + sql);
                    query(sql, function (error, rows) {
                        if (error) {
                            logger.error('获取是否有盒子信息错误：' + error);
                            message.Status = false;
                            message.message = '获取是否有盒子信息失败';
                            message.Data = null;
                            callback(error, message);
                        } else {
                            if (rows.length != 1) {
                                message.Status = false;
                                message.message = '获取是否有盒子信息';
                                message.Data = null;
                                callback(new Error('获取是否有盒子信息'), message);
                            } else {
                                callback(null);
                            }
                        }
                    });
                },
                function (callback) {
                    var sql = "select distinct TM from archive where GN in (" + pointNames + ") and TM between '" + beginDate + "' and '" + endDate + "'";
                    logger.debug('查询采样值总个数sql：' + sql);
                    var sqlTM = "select distinct TM from Archive where GN in (" + pointNames + ") and TM between '" + beginDate + "' and '" + endDate + "'";
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
                        message.Status = false;
                        message.message = '没有对应的时间数据';
                        message.Data = {
                            total: 0,
                            rows: []
                        };
                        callback(new Error('没有对应的时间数据'), message);
                    } else {
                        var sqlHistory = "select ID,GN,ED,TM,DS,AV from archive where GN in (" + pointNames + ") and TM between '" + minTime + "' and '" + maxTime + "' order by TM";
                        logger.debug('查询采样值数据sql：' + sqlHistory);
                        opPool.query(sqlHistory, function (error, rows, colums) {
                            if (error || rows.length < 1) {
                                logger.error('查询历史数据错误：:' + JSON.stringify(error));
                                message.Status = false;
                                message.message = '获取历史数据出错';
                                message.Data = {
                                    total: 0,
                                    rows: []
                                };
                                callback(new Error('获取历史数据出错'), message);
                            } else {

                                var os = {};
                                for (var i in rows) {
                                    var row = rows[i];
                                    var TM = row.TM;
                                    var oo = os[TM];
                                    if (oo) {
                                        oo['value' + (GNs.indexOf(row.GN) + 1)] = row.AV;
                                    } else {
                                        oo = {};
                                        oo.TM = row.TM;
                                        oo['value' + (GNs.indexOf(row.GN) + 1)] = row.AV;
                                    }
                                    os[TM] = oo;
                                }
                                var rs = [];
                                for (var j in os) {
                                    rs.push(os[j]);
                                }
                                message.Status = true;
                                message.message = 'OK';
                                message.Data = {
                                    total: countRows,
                                    rows: rs
                                };
                                callback(null, message);
                            }
                        });
                    }
                }
            ],
            function (error, message) {
                res.json(message);
            }
        );
    },
    /**
     * 模糊查询所有测点报警数据
     * @param req
     * @param res
     */
    blurryBoxAlarm: function (req, res) {
        var userId = req.body.userId || req.query.userId;
        var devCode = req.body.devCode || req.query.devCode;
        var ED = req.body.ED || req.query.ED;
        var limit = req.body.limit || req.query.limit || 0;
        var offset = req.body.offset || req.query.offset || 20;
        if (!userId) {
            message.Status = false;
            message.message = '用户ID不能为空';
            message.Data = null;
            res.json(message);
            return;
        }
        if (!devCode) {
            message.Status = false;
            message.message = '设备码不能为空';
            message.Data = null;
            res.json(message);
            return;
        }
        async.waterfall(
            [
                function (callback) {
                    var sql = sqlQuery.select().from('box_user_box').select(['user_id']).where({
                        user_id: userId,
                        dev_code: devCode
                    }).build();
                    logger.debug('获取是否有盒子信息sql:' + sql);
                    query(sql, function (error, rows) {
                        if (error) {
                            logger.error('获取是否有盒子信息错误：' + error);
                            message.Status = false;
                            message.message = '获取是否有盒子信息失败';
                            message.Data = null;
                            callback(error, message);
                        } else {
                            if (rows.length != 1) {
                                message.Status = false;
                                message.message = '获取是否有盒子信息';
                                message.Data = null;
                                callback(new Error('获取是否有盒子信息'), message);
                            } else {
                                callback(null);
                            }
                        }
                    });
                },
                function (callback) {
                    var countSQL = 'select count(ID) as count from alarm where GN like "W3.' + devCode + '.%"';
                    var sqlReal = 'select ID,GN,ED,RT,TM,DS,AV from alarm where GN like "W3.' + devCode + '.%"';
                    if (ED) {
                        countSQL += ' and ED like "%' + ED + '%"'
                        sqlReal += ' and ED like "%' + ED + '%"'
                    }
                    sqlReal += ' order by ID limit ' + offset + ',' + limit;
                    logger.debug('获取报警总个数sql:', countSQL);
                    var count = opPool.syncQuery(countSQL).rows[0].count;
                    logger.debug('获取报警数据sql:' + sqlReal);
                    opPool.query(sqlReal, function (error, rows, colums) {
                        if (error && error.code) {
                            logger.error('查询报警数据错误：' + JSON.stringify(error));
                            message.Status = false;
                            message.message = '获取报警数据出错';
                            message.Data = {
                                total: 0,
                                rows: []
                            };
                            callback(new Error('获取报警数据出错'), message);
                        } else {
                            message.Status = true;
                            message.message = 'OK';
                            message.Data = {
                                total: parseInt(count, 16),
                                rows: rows
                            };
                            callback(null, message);
                        }
                    });
                }
            ],
            function (error, message) {
                res.json(message);
            }
        );
    },
    /**
     * 获取报警历史数据
     * @param req
     * @param res
     */
    getBoxAlarmHis: function (req, res) {
        var userId = req.body.userId || req.query.userId;
        var devCode = req.body.devCode || req.query.devCode;
        if (!userId) {
            message.Status = false;
            message.message = '用户ID不能为空';
            message.Data = null;
            res.json(message);
            return;
        }
        if (!devCode) {
            message.Status = false;
            message.message = '设备码不能为空';
            message.Data = null;
            res.json(message);
            return;
        }
        var ED = req.body.ED || req.query.ED;
        var limit = req.body.limit || req.query.limit || 0;
        var offset = req.body.offset || req.query.offset || 20;
        var beginDate = req.body.beginDate || req.query.beginDate;
        var endDate = req.body.endDate || req.query.endDate;
        if (!beginDate || !endDate) {
            message.Status = false;
            message.message = '开始时间和结束时间都不能为空';
            message.Data = null;
            res.json(message);
            return;
        }
        async.waterfall(
            [
                function (callback) {
                    var sql = sqlQuery.select().from('box_user_box').select(['user_id']).where({
                        user_id: userId,
                        dev_code: devCode
                    }).build();
                    logger.debug('获取是否有盒子信息sql:' + sql);
                    query(sql, function (error, rows) {
                        if (error) {
                            logger.error('获取是否有盒子信息错误：' + error);
                            message.Status = false;
                            message.message = '获取是否有盒子信息失败';
                            message.Data = null;
                            callback(error, message);
                        } else {
                            if (rows.length != 1) {
                                message.Status = false;
                                message.message = '获取是否有盒子信息';
                                message.Data = null;
                                callback(new Error('获取是否有盒子信息'), message);
                            } else {
                                callback(null);
                            }
                        }
                    });
                },
                function (callback) {
                    var sql = 'select count(ID) as count from AAlarm where GN like "W3.' + devCode + '.%" and TM between "' + beginDate + '" and "' + endDate + '"';
                    logger.debug('查询报警历史总个数sql：' + sql);
                    var sqlHistory = 'select ID,GN,ED,TM,DS,AV from AAlarm where GN like "W3.' + devCode + '.%" and TM between "' + beginDate + '" and "' + endDate + '" ';
                    if (ED) {
                        sql += ' and ED like "%' + ED + '%"'
                        sqlHistory += ' and ED like "%' + ED + '%"'
                    }
                    sqlHistory += 'order by TM limit ' + offset + ',' + limit;
                    logger.debug('查询报警历史数据sql：' + sqlHistory);
                    var count = opPool.syncQuery(sql).rows[0].count;
                    opPool.query(sqlHistory, function (error, rows, colums) {
                        if (error && error.code) {
                            logger.error('查询报警历史数据错误：:' + JSON.stringify(error));
                            message.Status = false;
                            message.message = '获取报警历史数据出错';
                            message.Data = {
                                total: 0,
                                rows: []
                            };
                            callback(new Error('获取报警历史数据出错'), message);
                        } else {
                            message.Status = true;
                            message.message = 'OK';
                            message.Data = {
                                total: parseInt(count, 16),
                                rows: rows
                            };
                            callback(null, message);
                        }
                    });
                }
            ],
            function (error, message) {
                res.json(message);
            }
        );
    },
    /**
     * 获取盒子曲线数据
     * @param req
     * @param res
     */
    getBoxLine: function (req, res) {
        var userId = req.body.userId || req.query.userId;
        var devCode = req.body.devCode || req.query.devCode;
        if (!userId) {
            message.Status = false;
            message.message = '用户ID不能为空';
            message.Data = null;
            res.json(message);
            return;
        }
        if (!devCode) {
            message.Status = false;
            message.message = '设备码不能为空';
            message.Data = null;
            res.json(message);
            return;
        }
        var GNs = req.body.GNs || req.query.GNs;
        if (!GNs) {
            message.Status = false;
            message.message = '点名不能为空';
            message.Data = null;
            res.json(message);
            return;
        }
        GNs = GNs.split(',');
        var beginDate = req.body.beginDate || req.query.beginDate;
        var endDate = req.body.endDate || req.query.endDate;

        if (!beginDate || !endDate) {
            message.Status = false;
            message.message = '开始时间和结束时间都不能为空';
            message.Data = null;
            res.json(message);
            return;
        }
        var mode = '';
        endDate = new Date(endDate).getTime() / 1000;
        beginDate = new Date(beginDate).getTime() / 1000;
        //获取查询时间间隔
        var interval = utils.getInterval(beginDate, endDate);
        //构建查询数值类型
        if (interval < 2) {
            mode = '';
        } else {
            mode = 'mode  ="plot" and interval ="' + interval + 's" and  ';
        }
        var pointNames = '';
        var size = GNs.length;
        for (var i = 0; i < size; i++) {
            pointNames += '"' + GNs[i] + '"';
            if (GNs[i + 1]) {
                pointNames += ',';
            }
        }
        async.waterfall(
            [
                function (callback) {
                    var sql = sqlQuery.select().from('box_user_box').select(['user_id']).where({
                        user_id: userId,
                        dev_code: devCode
                    }).build();
                    logger.debug('获取是否有盒子信息sql:' + sql);
                    query(sql, function (error, rows) {
                        if (error) {
                            logger.error('获取是否有盒子信息错误：' + error);
                            message.Status = false;
                            message.message = '获取是否有盒子信息失败';
                            message.Data = null;
                            callback(error, message);
                        } else {
                            if (rows.length != 1) {
                                message.Status = false;
                                message.message = '获取是否有盒子信息';
                                message.Data = null;
                                callback(new Error('获取是否有盒子信息'), message);
                            } else {
                                callback(null);
                            }
                        }
                    });
                },
                function (callback) {
                    var sql = 'select ID,GN,TM,DS,AV from archive where 1=1  and ' + mode + ' GN in (' + pointNames + ') and TM between ' + beginDate + ' and ' + endDate + ' order by TM';
                    logger.debug('获取趋势历史信息:' + sql);
                    opPool.query(sql, function (error, rows) {
                        var pointMap = {};
                        var point;
                        for (var i = 0; i < rows.length; i++) {
                            var obj = rows[i];
                            point = {};
                            var pointArray = pointMap[obj.GN];
                            if (!pointArray) {
                                pointArray = [];
                                pointMap[obj.GN] = pointArray;
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
                            pointMap[obj.GN] = pointArray;
                        }
                        var returnValue = {
                            beginDate: beginDate * 1000,
                            endDate: endDate * 1000,
                            value: pointMap
                        };
                        message.Status = true;
                        message.message = 'OK';
                        message.Data = returnValue;
                        callback(null, message);
                    });
                }
            ],
            function (error, message) {
                res.json(message);
            }
        );
    }
};
module.exports = boxInfo;
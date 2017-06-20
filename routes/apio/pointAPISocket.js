var actionUtil = require("../framework/action/actionUtils")();
var transaction = actionUtil.transaction;
var configUtils = require('../utils/tools/configUtils');
var Utils = require('../utils/tools/utils');
var query = actionUtil.query;
var opPool = require('../openplant/openPlantPool');
var OPAPI = require('opapi');
var async = require('async');
var logger = require('log4js').getLogger('api');
var sqlQuery = require('sql-query').Query();
var GlobalAgent = require('../message/GlobalAgent')
var APIUtils = require('../utils/tools/APIUtils');
var UUID = require('node-uuid');
var message = {
    flag: 0,
    message: '成功'
}
var pointSocket = {
    socketOn: function (socket) {
        /**
         * 添加点信息
         */
        socket.on('api/addPoint', function (data) {
            var mess = GlobalAgent.getAPInfo(socket.id, APIUtils.ADD_POINT);
            if (mess.flag < 0) {
                socket.emit('api/addPoint', {
                    flag: -1,
                    message: mess.message,
                    total: 0
                });
                return;
            }
            var domainId = mess.data.domainId;
            if (!domainId || domainId.length < 1) {
                message.flag = -1;
                message.message = '当前用户没有域';
                message.total = 0;
                message.data = [];
                socket.emit('api/addPoint', message);
                return;
            }
            var mtreeURI = data.mtreeURI;
            if (!mtreeURI) {
                message.flag = -1;
                message.total = 0;
                message.message = '上级节点不能为空';
                socket.emit('api/addPoint', message);
                return;
            }
            var value = data.value;
            if (!value || value.length < 1) {
                message.flag = -1;
                message.total = 0;
                message.message = '插入数据不能为空';
                socket.emit('api/addPoint', message);
                return;
            }
            var cols = [];
            cols.push(["ID", OPAPI.TYPE.INT32]);
            cols.push(["GN", OPAPI.TYPE.STRING]);
            cols.push(["KR", OPAPI.TYPE.STRING]);
            cols.push(["HW", OPAPI.TYPE.INT64]);
            cols.push(["UD", OPAPI.TYPE.INT64]);
            cols.push(["TN", OPAPI.TYPE.STRING]);
            cols.push(["RT", OPAPI.TYPE.INT8]);
            cols.push(["AN", OPAPI.TYPE.STRING]);
            cols.push(["FQ", OPAPI.TYPE.INT16]);
            cols.push(["ED", OPAPI.TYPE.STRING]);
            cols.push(["TV", OPAPI.TYPE.FLOAT]);
            cols.push(["BV", OPAPI.TYPE.FLOAT]);
            cols.push(["EU", OPAPI.TYPE.STRING]);
            cols.push(["DB", OPAPI.TYPE.INT8]);
            cols.push(["FM", OPAPI.TYPE.INT8]);
            cols.push(["PT", OPAPI.TYPE.INT8]);
            cols.push(["KT", OPAPI.TYPE.INT8]);
            cols.push(["EX", OPAPI.TYPE.STRING]);
            cols.push(["AP", OPAPI.TYPE.INT8]);
            cols.push(["LC", OPAPI.TYPE.INT8]);
            cols.push(["H4", OPAPI.TYPE.FLOAT]);
            cols.push(["H3", OPAPI.TYPE.FLOAT]);
            cols.push(["ZH", OPAPI.TYPE.FLOAT]);
            cols.push(["HL", OPAPI.TYPE.FLOAT]);
            cols.push(["LL", OPAPI.TYPE.FLOAT]);
            cols.push(["ZL", OPAPI.TYPE.FLOAT]);
            cols.push(["L3", OPAPI.TYPE.FLOAT]);
            cols.push(["L4", OPAPI.TYPE.FLOAT]);
            cols.push(["C1", OPAPI.TYPE.INT32]);
            cols.push(["C2", OPAPI.TYPE.INT32]);
            cols.push(["C3", OPAPI.TYPE.INT32]);
            cols.push(["C4", OPAPI.TYPE.INT32]);
            cols.push(["C5", OPAPI.TYPE.INT32]);
            cols.push(["C6", OPAPI.TYPE.INT32]);
            cols.push(["C7", OPAPI.TYPE.INT32]);
            cols.push(["C8", OPAPI.TYPE.INT32]);
            //通过mtreeId获取URI从而生成uuid
            delete message.data;
            async.waterfall(
                [
                    function (callback) {
                        var sql = 'SELECT ID,DOMAIN_ID,URI FROM sys_mtree WHERE IS_DELETED =0 and URI = "' + mtreeURI + '"';
                        logger.debug('获取URI的sql:' + sql);
                        query(sql, function (err, rows, columns) {
                            if (err) {
                                logger.error('查询上级节点信息错误：' + err);
                                message.flag = -1;
                                message.total = 0;
                                message.message = '查询上级节点出错';
                                socket.emit('api/addPoint', message);
                                return;
                            } else if (rows && rows.length < 1) {
                                message.flag = -1;
                                message.total = 0;
                                message.message = '上级节点不存在，请确认';
                                socket.emit('api/addPoint', message);
                                return;
                            } else {
                                if (domainId.indexOf(rows[0].DOMAIN_ID) < 0) {
                                    message.flag = -1;
                                    message.total = 0;
                                    message.message = '当前节点不属于你';
                                    socket.emit('api/addPoint', message);
                                    return;
                                }
                                callback(null, rows[0]);
                            }
                        })
                    },
                    function (ttt, callback) {
                        var uris = [];
                        var uu = '';
                        var size = value.length;
                        for (var i = 0; i < size; i++) {
                            var oo = value[i];
                            var pn = oo.PN;
                            if (!pn) {
                                message.flag = -1;
                                message.total = 0;
                                message.message = '点名不能为空';
                                socket.emit('api/addPoint', message);
                                return;
                            }
                            pn = pn.toUpperCase();
                            if (uris.indexOf((ttt.URI + '/' + pn).toString()) > -1) {
                                message.flag = -1;
                                message.total = 0;
                                message.message = '点名为' + pn + '重复';
                                socket.emit('api/addPoint', message);
                                return;
                            } else {
                                uris.push((ttt.URI + '/' + pn).toString());
                                uu += '"' + (ttt.URI + '/' + pn).toString() + '"';
                                if (value[i + 1]) {
                                    uu += ',';
                                }
                            }
                        }
                        var sql = 'select ID,POINT_NAME from sys_point where URI in (' + uu + ')';
                        logger.debug('查询点名是否存在sql:' + sql);
                        query(sql, function (error, rows) {
                            if (error) {
                                logger.error('获取测点信息失败：' + error);
                                message.flag = -1;
                                message.message = '查询点信息失败';
                                message.total = 0;
                                socket.emit('api/addPoint', message);
                                return;
                            } else if (rows && rows.length > 0) {
                                var pns = '';
                                var size = rows.length;
                                for (var i = 0; i < size; i++) {
                                    pns += rows[i].POINT_NAME;
                                    if (rows[i + 1]) {
                                        pns += ',';
                                    }
                                }
                                message.flag = -1;
                                message.total = 0;
                                message.message = '点名为：' + pns + '的点存在于当前节点下';
                                socket.emit('api/addPoint', message);
                                return;
                            } else {
                                callback(null, ttt);
                            }
                        });
                    },
                    function (ttt, callback) {
                        var rows = [];
                        var domainId = ttt.DOMAIN_ID;
                        var URI = ttt.URI;
                        var sysPoints = [];
                        var size = value.length;
                        for (var i = 0; i < size; i++) {
                            var row = [];
                            var obj = value[i];
                            var pn = obj.PN.toUpperCase();
                            var pointURI = URI + '/' + pn;
                            var uuid = opPool.makeUUID(pointURI);
                            var pointId = configUtils.getPointIDNext();
                            row[0] = pointId;
                            row[1] = 'W3.NODE.' + uuid;
                            row[2] = domainId;
                            row[3] = mess.data.companyID;
                            row[4] = '0x' + uuid;
                            row[5] = obj.TN;
                            row[6] = obj.RT;
                            row[7] = obj.AN;
                            row[8] = obj.FQ;
                            row[9] = obj.ED;
                            row[10] = obj.TV;
                            row[11] = obj.BV;
                            row[12] = obj.EU;
                            row[13] = obj.DB;
                            row[14] = obj.FM;
                            row[15] = obj.PT;
                            row[16] = obj.KT;
                            row[17] = obj.EX;
                            row[18] = obj.AP;
                            row[19] = obj.LC;
                            row[20] = obj.H4;
                            row[21] = obj.H3;
                            row[22] = obj.ZH;
                            row[23] = obj.HL;
                            row[24] = obj.LL;
                            row[25] = obj.ZL;
                            row[26] = obj.L3;
                            row[27] = obj.L4;
                            row[28] = obj.C1;
                            row[29] = obj.C2;
                            row[30] = obj.C3;
                            row[31] = obj.C4;
                            row[32] = obj.C5;
                            row[33] = obj.C6;
                            row[34] = obj.C7;
                            row[35] = obj.C8;
                            var sysPoint = {};
                            sysPoint.POINT_ID = pointId;
                            sysPoint.UUID = '0x' + uuid;
                            sysPoint.POINT_NAME = pn;
                            sysPoint.URI = pointURI;
                            sysPoint.MTREE_ID = ttt.ID;
                            sysPoint.POINT_TYPE = obj.RT ? obj.RT : 0;
                            sysPoint.UNIT = obj.EU ? obj.EU : '';
                            sysPoint.DESCRIPTION = obj.ED ? obj.ED : '';
                            sysPoint.ENTERPRISE_ID = mess.data.companyID;
                            sysPoint.COMPRESS_TYPE = obj.DB ? obj.DB : 0;
                            sysPoint.CREATE_DATE = Utils.dateFormat(new Date().getTime(), Utils.yyyyMMddhhmmss);
                            rows.push(row);
                            sysPoints.push(sysPoint);
                        }
                        callback(null, ttt, rows, sysPoints);
                    },
                    function (ttt, rr, sysPoints, callback) {
                        opPool.insert('Point', rr, cols, function (err, rows, columns) {
                            if (err && err.code) {
                                logger.error('插入测点错误:' + JSON.stringify(err));
                                message.flag = -1;
                                message.total = 0;
                                message.message = err.message;
                                socket.emit('api/addPoint', message);
                                return;
                            } else {
                                var idsFail = [];
                                for (var i in rows) {
                                    if (rows[i].EC) {
                                        idsFail.push(rows[i].ID)
                                    }
                                }
                                callback(null, ttt, sysPoints, idsFail);
                            }
                        });
                    },
                    function (ttt, sysPointss, idsFail, callback) {
                        var sysPoints = [];
                        for (var i in sysPointss) {
                            var sys = sysPointss[i];
                            if (idsFail.indexOf(sys.POINT_ID) < 0) {
                                sysPoints.push(sys);
                            }
                        }
                        if (sysPoints.length < 1) {
                            logger.error('插入点失败');
                            message.flag = -1;
                            message.total = 0;
                            message.message = '插入点失败';
                            socket.emit('api/addPoint', message);
                            return;
                        }
                        var sqlPoints = 'insert into sys_point (`ID`,`POINT_ID`, `UUID`, `URI`, `MTREE_ID`, `POINT_NAME`, `UNIT`, `POINT_TYPE`,`DESCRIPTION`,`COMPRESS_TYPE`,`CREATE_DATE`,`DOMAIN_ID`,`ENTERPRISE_ID`)';
                        var sqlValue = '';
                        var size = sysPoints.length;
                        for (var i = 0; i < size; i++) {
                            var tagID = UUID.v1();
                            var row = sysPoints[i];
                            sqlValue += '(';
                            sqlValue += '\'' + tagID + '\',';
                            sqlValue += row.POINT_ID + ',';
                            sqlValue += '\'' + row.UUID + '\',';
                            sqlValue += '\'' + row.URI + '\',';
                            sqlValue += sysPoints.MTREE_ID + ',';
                            sqlValue += '\'' + row.POINT_NAME + '\',';
                            sqlValue += '\'' + row.UNIT + '\',';
                            sqlValue += row.POINT_TYPE + ',';
                            sqlValue += '\'' + row.DESCRIPTION + '\',';
                            sqlValue += row.COMPRESS_TYPE + ',';
                            sqlValue += '\'' + Utils.dateFormat(new Date().getTime(), Utils.yyyyMMddhhmmss) + '\',';
                            sqlValue += ttt.DOMAIN_ID + ',';
                            sqlValue += mess.data.companyID;
                            sqlValue += ')';
                            if (sysPoints[i + 1]) {
                                sqlValue += ',';
                            }
                        }
                        sqlPoints += ' values ' + sqlValue;
                        logger.debug('批量插入关系库sql为:' + sqlPoints);
                        query(sqlPoints, function (perr, result, columns) {
                            if (perr) {
                                logger.error('插入测点到关系库错误：' + perr);
                                message.flag = -1;
                                message.total = 0;
                                message.message = '插入测点到关系库失败';
                                socket.emit('api/addPoint', message);
                                return;
                            }
                            message.flag = 0;
                            var pns = [];
                            if (idsFail && idsFail.length > 0) {
                                for (var i in idsFail) {
                                    var id = idsFail[i];
                                    for (var j in sysPoints) {
                                        if (id == sysPoints[j].POINT_ID) {
                                            pns.push(sysPoints[j].POINT_NAME);
                                            break;
                                        }
                                    }
                                }
                            }
                            if (pns.length > 0) {
                                message.message = '点' + pns.toString() + '插入失败';
                            } else {
                                message.message = 'OK';
                            }
                            message.total = sysPoints.length - pns.length;
                            socket.emit('api/addPoint', message);
                            return;
                        });
                    }
                ],
                function (err) {
                    if (err) {
                        message.flag = -1;
                        message.total = 0;
                        message.message = '插入测点失败';
                        socket.emit('api/addPoint', message);
                        return;
                    }
                });
        });
        /**
         * 更新点信息
         */
        socket.on('api/updatePoint', function (data) {
                var mess = GlobalAgent.getAPInfo(socket.id, APIUtils.UPDATE_POINT);
                if (mess.flag < 0) {
                    socket.emit('api/addPoint', {
                        flag: -1,
                        message: mess.message,
                        total: 0
                    });
                    return;
                }
                var domainId = mess.data.domainId;
                if (!domainId || domainId.length < 1) {
                    message.flag = -1;
                    message.message = '当前用户没有域';
                    message.total = 0;
                    message.data = [];
                    socket.emit('api/updatePoint', message);
                    return;
                }
                var value = data;
                if (!value || value.length < 1) {
                    message.flag = -1;
                    message.total = 0;
                    message.message = '更新数据不能为空';
                    socket.emit('api/updatePoint', message);
                    return;
                }
                var cols = [];
                cols.push(["ID", OPAPI.TYPE.INT32]);
                cols.push(["AN", OPAPI.TYPE.STRING]);
                cols.push(["FQ", OPAPI.TYPE.INT16]);
                cols.push(["ED", OPAPI.TYPE.STRING]);
                cols.push(["TV", OPAPI.TYPE.FLOAT]);
                cols.push(["BV", OPAPI.TYPE.FLOAT]);
                cols.push(["EU", OPAPI.TYPE.STRING]);
                cols.push(["DB", OPAPI.TYPE.INT8]);
                cols.push(["FM", OPAPI.TYPE.INT8]);
                cols.push(["PT", OPAPI.TYPE.INT8]);
                cols.push(["KT", OPAPI.TYPE.INT8]);
                cols.push(["EX", OPAPI.TYPE.STRING]);
                cols.push(["AP", OPAPI.TYPE.INT8]);
                cols.push(["LC", OPAPI.TYPE.INT8]);
                cols.push(["H4", OPAPI.TYPE.FLOAT]);
                cols.push(["H3", OPAPI.TYPE.FLOAT]);
                cols.push(["ZH", OPAPI.TYPE.FLOAT]);
                cols.push(["HL", OPAPI.TYPE.FLOAT]);
                cols.push(["LL", OPAPI.TYPE.FLOAT]);
                cols.push(["ZL", OPAPI.TYPE.FLOAT]);
                cols.push(["L3", OPAPI.TYPE.FLOAT]);
                cols.push(["L4", OPAPI.TYPE.FLOAT]);
                cols.push(["C1", OPAPI.TYPE.INT32]);
                cols.push(["C2", OPAPI.TYPE.INT32]);
                cols.push(["C3", OPAPI.TYPE.INT32]);
                cols.push(["C4", OPAPI.TYPE.INT32]);
                cols.push(["C5", OPAPI.TYPE.INT32]);
                cols.push(["C6", OPAPI.TYPE.INT32]);
                cols.push(["C7", OPAPI.TYPE.INT32]);
                cols.push(["C8", OPAPI.TYPE.INT32]);
                delete message.data;
                async.waterfall(
                    [
                        function (callback) {
                            var uris = [];
                            var size = value.length;
                            var idValue = [];
                            var gnValue = [];
                            var idArray = []
                            for (var i = 0; i < size; i++) {
                                var obj = value[i];
                                if (obj.ID) {
                                    delete obj.GN;
                                    idArray.push(obj.ID);
                                    idValue.push(obj);
                                    continue;
                                }
                                if (obj.GN) {
                                    uris.push(obj.GN.toUpperCase());
                                    gnValue.push(obj);
                                    continue;
                                }
                                message.flag = -1;
                                message.total = 0;
                                message.message = '第' + (i + 1) + '需要有GN或ID字段,且不能为空';
                                socket.emit('api/updatePoint', message);
                                return;
                            }
                            var sql = sqlQuery.select().from('sys_point').select('POINT_ID', 'URI').where({
                                DOMAIN_ID: domainId,
                                or: [{URI: uris}, {POINT_ID: idArray}]
                            }).build();
                            logger.debug('查询对应测点的ID sql:' + sql);
                            query(sql, function (error, rows) {
                                if (error) {
                                    logger.error('查询测点信息错误：' + error);
                                    message.flag = -1;
                                    message.total = 0;
                                    message.message = '查询测点信息错误';
                                    socket.emit('api/updatePoint', message);
                                    return;
                                } else {
                                    var ids = [];
                                    if (rows && rows.length > 0) {
                                        for (var i in rows) {
                                            var flag = false;
                                            for (var j in gnValue) {
                                                if (gnValue[j].GN == rows[i].URI) {
                                                    var tt = gnValue[j];
                                                    tt.ID = rows[i].POINT_ID;
                                                    ids.push(tt.ID);
                                                    delete tt.GN;
                                                    gnValue[j] = tt;
                                                    flag = true;
                                                    break;
                                                }
                                            }
                                            if (flag) {
                                                continue;
                                            }
                                            for (var t in idValue) {
                                                if (idValue[t].ID == rows[i].POINT_ID) {
                                                    var tt = idValue[j];
                                                    tt.ID = rows[i].POINT_ID;
                                                    ids.push(tt.ID);
                                                    delete tt.GN;
                                                    idValue[t] = tt;
                                                    break;
                                                }
                                            }
                                        }
                                        value = idValue.concat(gnValue);
                                        if (!ids || ids.length < 1) {
                                            message.flag = -1;
                                            message.total = 0;
                                            message.message = '测点不存在';
                                            socket.emit('api/updatePoint', message);
                                            return;
                                        }
                                        callback(null, ids);
                                    } else {
                                        message.flag = -1;
                                        message.total = 0;
                                        message.message = '测点不存在';
                                        socket.emit('api/updatePoint', message);
                                        return;
                                    }
                                }
                            });
                        },
                        function (idArray, callback) {
                            var cols = ['ID', 'UD', 'AN', 'FQ', 'ED', 'TV', 'BV', 'EU', 'DB', 'FM', 'PT', 'KT', 'EX', 'AP', 'LC', 'H4', 'H3', 'ZH', 'HL', 'LL', 'ZL', 'L3', 'L4', 'C1', 'C2', 'C3', 'C4', 'C5', 'C6', 'C7', 'C8']
                            opPool.find('Point', 'ID', idArray, cols, function (error, rows, columns) {
                                if (error) {
                                    logger.error('获取实时库数据错误：' + JSON.stringify(error));
                                    message.flag = -1;
                                    message.total = 0;
                                    message.message = error.message;
                                    socket.emit('api/updatePoint', message);
                                    return;
                                } else if (rows && rows.length < 1) {
                                    message.flag = 0;
                                    message.total = 0;
                                    message.mesage = '没有满足条件的数据';
                                    socket.emit('api/updatePoint', message);
                                    return;
                                } else {
                                    var sysPoints = [];
                                    var rr = [];
                                    for (var i in rows) {
                                        var row = rows[i];
                                        for (var j in value) {
                                            var v = value[j];
                                            if (row.ID == v.ID) {
                                                var r = [];
                                                r.push(row.ID);
                                                r.push(v.AN ? v.AN : row.AN);
                                                r.push(v.FQ ? v.FQ : row.FQ);
                                                r.push(v.ED ? v.ED : row.ED);
                                                r.push(v.TV ? v.TV : row.TV);
                                                r.push(v.BV ? v.BV : row.BV);
                                                r.push(v.EU ? v.EU : row.EU);
                                                r.push(v.DB ? v.DB : row.DB);
                                                r.push(v.FM ? v.FM : row.FM);
                                                r.push(v.PT ? v.PT : row.PT);
                                                r.push(v.KT ? v.KT : row.KT);
                                                r.push(v.EX ? v.EX : row.EX);
                                                r.push(v.AP ? v.AP : row.AP);
                                                r.push(v.LC ? v.LC : row.LC);
                                                r.push(v.H4 ? v.H4 : row.H4);
                                                r.push(v.H3 ? v.H3 : row.H3);
                                                r.push(v.ZH ? v.ZH : row.ZH);
                                                r.push(v.HL ? v.HL : row.HL);
                                                r.push(v.LL ? v.LL : row.LL);
                                                r.push(v.ZL ? v.ZL : row.ZL);
                                                r.push(v.L3 ? v.L3 : row.L3);
                                                r.push(v.L4 ? v.L4 : row.L4);
                                                r.push(v.C1 ? v.C1 : row.C1);
                                                r.push(v.C2 ? v.C2 : row.C2);
                                                r.push(v.C3 ? v.C3 : row.C3);
                                                r.push(v.C4 ? v.C4 : row.C4);
                                                r.push(v.C5 ? v.C5 : row.C5);
                                                r.push(v.C6 ? v.C6 : row.C6);
                                                r.push(v.C7 ? v.C7 : row.C7);
                                                r.push(v.C8 ? v.C8 : row.C8);
                                                var sysPoint = {};
                                                sysPoint.UUID = row.UD.toUpperCase();
                                                sysPoint.UNIT = v.EU ? v.EU : row.EU;
                                                sysPoint.DESCRIPTION = v.ED ? v.ED : row.ED;
                                                sysPoint.COMPRESS_TYPE = v.DB ? v.DB : parseInt(row.DB);
                                                sysPoint.UPDATE_DATE = Utils.dateFormat(new Date().getTime(), Utils.yyyyMMddhhmmss);
                                                rr.push(r);
                                                sysPoints.push(sysPoint);
                                                break;
                                            }
                                        }
                                    }
                                    callback(null, rr, sysPoints);
                                }
                            });
                        },
                        function (rr, sysPoints, callback) {
                            opPool.update('Point', rr, cols, function (error, rows, columns) {
                                if ((error && error.code)) {
                                    logger.error('更新测点信息错误：' + JSON.stringify(error));
                                    message.flag = -1;
                                    message.total = 0;
                                    message.message = error.message;
                                    socket.emit('api/updatePoint', message);
                                    return;
                                } else {
                                    callback(null, sysPoints);
                                }
                            });
                        },
                        function (sysPoints, callback) {
                            var sql = '';
                            for (var i in sysPoints) {
                                var sysPoint = sysPoints[i];
                                var sqlPoint = sqlQuery.update().into('sys_point').set({
                                    UNIT: sysPoint.UNIT,
                                    DESCRIPTION: sysPoint.DESCRIPTION,
                                    COMPRESS_TYPE: sysPoint.COMPRESS_TYPE,
                                    UPDATE_DATE: sysPoint.COMPRESS_TYPE
                                }).where({UUID: sysPoint.UUID}).build();
                                sql += sqlPoint + ';'
                            }
                            logger.debug('更新point表sql:' + sql);
                            query(sqlPoint, function (err, result) {
                                if (err) {
                                    logger.debug('更新关系库数据错误:' + err);
                                    message.flag = -1;
                                    message.total = 0;
                                    message.message = '更新数据失败';
                                    socket.emit('api/updatePoint', message);
                                    return;
                                } else {
                                    message.flag = 0;
                                    message.total = value.length;
                                    message.message = 'OK';
                                    socket.emit('api/updatePoint', message);
                                    return;
                                }
                            });
                        }
                    ],
                    function (err) {
                        if (err) {
                            message.flag = -1;
                            message.total = 0;
                            mesage.message = '更新测点失败';
                            socket.emit('api/updatePoint', message);
                            return;
                        }
                    }
                )
                ;
            }
        );
        /**删除点 通过ID集合**/
        socket.on('api/deletePointByID', function (data) {
            var mess = GlobalAgent.getAPInfo(socket.id, APIUtils.DELETE_POINT);
            if (mess.flag < 0) {
                socket.emit('api/deletePointByID', {
                    flag: -1,
                    message: mess.message,
                    total: 0
                });
                return;
            }
            var domainId = mess.data.domainId;
            if (!domainId || domainId.length < 1) {
                message.flag = -1;
                message.message = '当前用户没有域';
                message.total = 0;
                message.data = [];
                socket.emit('api/deletePointByID', message);
                return;
            }
            var value = data;
            if (!value || value.length < 1) {
                message.flag = -1;
                message.total = 0;
                message.message = '删除数据不能为空';
                socket.emit('api/deletePointByID', message);
                return;
            }
            async.waterfall(
                [
                    function (callback) {
                        var sql = sqlQuery.select().from('sys_point').select('POINT_ID', 'UUID').where({POINT_ID: value, DOMAIN_ID: domainId}).build();
                        logger.debug('查询点信息sql：' + sql);
                        query(sql, function (err, rows, columns) {
                            if (err) {
                                logger.error('获取测点信息错误：' + err);
                                message.flag = -1;
                                message.total = 0;
                                message.message = '删除点失败';
                                socket.emit('api/deletePointByID', message);
                                return;
                            } else if (rows && rows.length < 1) {
                                message.flag = 0;
                                message.total = 0;
                                message.message = '没有对应的测点';
                                socket.emit('api/deletePointByID', message);
                                return;
                            } else {
                                var ids = [];
                                var UUIDs = [];
                                for (var i in rows) {
                                    UUIDs.push(rows[i].UUID);
                                    ids.push(rows[i].POINT_ID);
                                }
                                if (ids.length < 1) {
                                    message.flag = 0;
                                    message.total = 0;
                                    message.message = '没有对应的测点';
                                    socket.emit('api/deletePointByID', message);
                                    return;
                                }
                                callback(null, UUIDs, ids);
                            }
                        });

                    },
                    function (UUIDs, ids, callback) {
                        opPool.remove('Point', 'ID', ids, function (error, rows) {
                            if (error || error.code) {
                                logger.debug('删除实时库测点信息错误：' + JSON.stringify(error));
                                message.flag = -1;
                                message.total = 0;
                                message.message = error.message;
                                socket.emit('api/deletePointByID', message);
                                return;
                            } else {
                                logger.debug(rows);
                                callback(null, UUIDs);
                            }
                        });
                    },
                    function (UUIDs, callback) {
                        var sql = sqlQuery.remove().from('sys_point').where({
                            UUID: UUIDs
                        }).build();
                        logger.debug('删除关系库测点信息sql:' + sql);
                        query(sql, function (err, result) {
                            if (err) {
                                message.flag = -1;
                                message.total = 0;
                                message.message = '删除点失败';
                                socket.emit('api/deletePointByID', message);
                                return;
                            } else {
                                message.flag = 0;
                                message.total = rows.affectedRows;
                                message.message = 'OK';
                                socket.emit('api/deletePointByID', message);
                                return;
                            }
                        });
                    }
                ],
                function (err) {
                    if (err) {
                        message.flag = -1;
                        message.total = 0;
                        message.message = '删除点失败';
                        socket.emit('api/deletePointByID', message);
                        return;
                    }
                });
        });
        /**删除点 通过TN 集合**/
        socket.on('api/deletePointByName', function (data) {
            var mess = GlobalAgent.getAPInfo(socket.id, APIUtils.DELETE_POINT);
            if (mess.flag < 0) {
                socket.emit('api/deletePointByName', {
                    flag: -1,
                    message: mess.message,
                    total: 0
                });
                return;
            }
            var domainId = mess.data.domainId;
            if (!domainId || domainId.length < 1) {
                message.flag = -1;
                message.message = '当前用户没有域';
                message.total = 0;
                message.data = [];
                socket.emit('api/deletePointByName', message);
                return;
            }
            var value = data;
            if (!value || value.length < 1) {
                message.flag = -1;
                message.total = 0;
                message.message = '删除数据不能为空';
                socket.emit('api/deletePointByName', message);
                return;
            }
            var size = value.length;
            var UUIDs = [];
            for (var i = 0; i < size; i++) {
                var UUID = opPool.makeUUID(value[i]);
                UUIDs.push('0x' + UUID);
            }
            async.waterfall(
                [
                    function (callback) {
                        var sql = sqlQuery.select().from('sys_point').select('POINT_ID', 'URI').where({UUID: UUIDs, DOMAIN_ID: domainId}).build();
                        logger.debug('查询对应测点的ID sql:' + sql);
                        query(sql, function (error, rows) {
                            if (error) {
                                logger.error('查询测点信息错误：' + error);
                                message.flag = -1;
                                message.total = 0;
                                message.message = '查询测点信息错误';
                                socket.emit('api/deletePointByName', message);
                                return;
                            } else if (rows && rows.length < 1) {
                                message.flag = 0;
                                message.total = 0;
                                message.message = '没有满足条件的数据';
                                socket.emit('api/deletePointByName', message);
                                return;
                            } else {
                                var ids = [];
                                for (var i in rows) {
                                    ids.push(rows[i].POINT_ID);
                                }
                                if (ids.length < 1) {
                                    message.flag = 0;
                                    message.total = 0;
                                    message.message = '没有对应的测点';
                                    socket.emit('api/deletePointByName', message);
                                    return;
                                }
                                callback(null, ids);
                            }
                        });
                    },
                    function (ids, callback) {
                        opPool.remove('Point', 'ID', ids, function (error, rows) {
                            if (error || error.code) {
                                logger.debug('删除实时库测点信息错误：' + JSON.stringify(error));
                                message.flag = -1;
                                message.total = 0;
                                message.message = error.message;
                                socket.emit('api/deletePointByName', message);
                                return;
                            } else {
                                callback(null);
                            }
                        });
                    },
                    function (callback) {
                        var sql = sqlQuery.remove().from('sys_point').where({
                            UUID: UUIDs
                        }).build();
                        logger.debug('删除关系库测点信息sql:' + sql);
                        query(sql, function (err, result) {
                            if (err) {
                                message.flag = -1;
                                message.total = 0;
                                message.message = '删除点失败';
                                socket.emit('api/deletePointByName', message);
                                return;
                            } else {
                                message.flag = 0;
                                message.total = rows.affectedRows;
                                message.message = 'OK';
                                socket.emit('api/deletePointByName', message);
                                return;
                            }
                        });
                    }
                ],
                function (err) {
                    if (err) {
                        message.flag = -1;
                        message.total = 0;
                        message.message = '删除点失败';
                        socket.emit('api/deletePointByName', message);
                        return;
                    }
                });
        });
        /*获取测点信息 同过ID集合*/
        socket.on('api/getPointByID', function (data) {
            var mess = GlobalAgent.getAPInfo(socket.id, APIUtils.QUERY_POINT);
            if (mess.flag < 0) {
                socket.emit('api/getPointByID', {
                    flag: -1,
                    message: mess.message,
                    total: 0
                });
                return;
            }
            var domainId = mess.data.domainId;
            if (!domainId || domainId.length < 1) {
                message.flag = -1;
                message.message = '当前用户没有域';
                message.total = 0;
                message.data = [];
                socket.emit('api/getPointByID', message);
                return;
            }
            var value = data.ID;
            if (!value || value.length < 1) {
                message.flag = -1;
                message.total = 0;
                message.message = '查询ID不能为空';
                socket.emit('api/getPointByID', message);
                return;
            }
            var field = data.FIELD;
            if (!field) {
                field = ['ID', 'GN', 'RT', 'ED', 'FQ', 'FM', 'TV', 'BV', 'EU', 'DB', 'EX', 'PT', 'KT', 'AP', 'LC', 'H4', 'H3', 'ZH', 'HL', 'LL', 'ZL', 'L3', 'L4', 'C1', 'C2', 'C3', 'C4', 'C5', 'C6', 'C7', 'C8']
            }
            if (field.indexOf('ID') < 0) {
                field.unshift('ID');
            }
            field = field.toString();
            async.waterfall(
                [
                    function (callback) {
                        var sql = 'select POINT_ID, URI,POINT_NAME from sys_point where DOMAIN_ID in (' + domainId + ') and POINT_ID in (' + value.toString() + ')';
                        logger.debug('获取测点静态信息by IDs sql：' + sql);
                        query(sql, function (error, rows, columns) {
                            if (error) {
                                logger.error('获取关系库静态信息错误:' + error);
                                message.flag = -1;
                                message.total = 0;
                                message.message = '获取信息错误';
                                message.data = [];
                                socket.emit('api/getPointByID', message);
                                return;
                            } else {
                                callback(null, rows);
                            }
                        });
                    },
                    function (rr, callback) {
                        var sqlPoint = 'select ' + field + ' from Point where KR in (' + domainId + ') and ID in (' + value.toString() + ')';
                        logger.debug('获取测点静态信息by IDs sql：' + sqlPoint);
                        opPool.query(sqlPoint, function (error, rows, columns) {
                            if (error && error.code) {
                                logger.error('获取实时静态信息错误:' + JSON.stringify(error));
                                message.flag = -1;
                                message.total = 0;
                                message.message = error.message;
                                message.data = [];
                                socket.emit('api/getPointByID', message);
                                return;
                            } else {
                                var tt = [];
                                for (var i in rr) {
                                    for (var j in rows) {
                                        if (rr[i].POINT_ID == rows[j].ID) {
                                            var r = rows[j];
                                            r.GN = rr[i].URI;
                                            r.PN = rr[i].POINT_NAME;
                                            tt.push(r);
                                            break;
                                        }
                                    }
                                }
                                message.flag = 0;
                                message.total = tt.length;
                                message.message = 'OK';
                                message.data = tt;
                                socket.emit('api/getPointByID', message);
                                return;
                            }
                        });
                    }
                ],
                function (err) {
                    if (err) {
                        message.flag = -1;
                        message.total = 0;
                        message.message = '查询数据异常';
                        message.data = null;
                        socket.emit('api/getPointByID', message);
                        return;
                    }
                });

        });
        /*获取测点信息 同过UD*/
        socket.on('api/getPointByName', function (data) {
            var mess = GlobalAgent.getAPInfo(socket.id, APIUtils.QUERY_POINT);
            if (mess.flag < 0) {
                socket.emit('api/getPointByName', {
                    flag: -1,
                    message: mess.message,
                    total: 0
                });
                return;
            }
            var domainId = mess.data.domainId;
            if (!domainId || domainId.length < 1) {
                message.flag = -1;
                message.message = '当前用户没有域';
                message.total = 0;
                message.data = [];
                socket.emit('api/getPointByName', message);
                return;
            }
            var value = data.GN;
            if (!value || value.length < 1) {
                message.flag = -1;
                message.total = 0;
                message.message = '查询ID不能为空';
                socket.emit('api/getPointByName', message);
                return;
            }
            var field = data.FIELD;
            if (!field) {
                field = ['ID', 'GN', 'RT', 'ED', 'FQ', 'FM', 'TV', 'BV', 'EU', 'DB', 'EX', 'PT', 'KT', 'AP', 'LC', 'H4', 'H3', 'ZH', 'HL', 'LL', 'ZL', 'L3', 'L4', 'C1', 'C2', 'C3', 'C4', 'C5', 'C6', 'C7', 'C8']
            }
            if (field.indexOf('ID') < 0) {
                field.unshift('ID');
            }
            field = field.toString();
            async.waterfall(
                [
                    function (callback) {
                        var sql = sqlQuery.select().from('sys_point').select('POINT_ID', 'URI', 'POINT_NAME').where({DOMAIN_ID: domainId, URI: value}).build();
                        logger.debug('获取测点静态信息by IDs sql：' + sql);
                        query(sql, function (error, rows, columns) {
                            if (error) {
                                logger.error('获取关系库静态信息错误:' + error);
                                message.flag = -1;
                                message.total = 0;
                                message.message = '获取信息错误';
                                message.data = [];
                                socket.emit('api/getPointByName', message);
                                return;
                            } else {
                                var ids = [];
                                for (var i in rows) {
                                    ids.push(rows[i].POINT_ID);
                                }
                                if (ids.length < 1) {
                                    message.flag = -0;
                                    message.total = 0;
                                    message.message = 'OK';
                                    message.data = [];
                                    socket.emit('api/getPointByName', message);
                                    return;
                                }
                                callback(null, rows, ids);
                            }
                        });
                    },
                    function (rr, ids, callback) {
                        var sqlPoint = 'select ' + field + ' from Point where KR in (' + domainId + ') and ID in (' + ids.toString() + ')';
                        logger.debug('获取测点静态信息by IDs sql：' + sqlPoint);
                        opPool.query(sqlPoint, function (error, rows, columns) {
                            if (error && error.code) {
                                logger.error('获取实时静态信息错误:' + JSON.stringify(error));
                                message.flag = -1;
                                message.total = 0;
                                message.message = error.message;
                                message.data = [];
                                socket.emit('api/getPointByName', message);
                                return;
                            } else {
                                var tt = [];
                                for (var i in rr) {
                                    for (var j in rows) {
                                        if (rr[i].POINT_ID == rows[j].ID) {
                                            var r = rows[j];
                                            r.GN = rr[i].URI;
                                            r.PN = rr[i].POINT_NAME;
                                            tt.push(r);
                                            break;
                                        }
                                    }
                                }
                                message.flag = 0;
                                message.total = tt.length;
                                message.message = 'OK';
                                message.data = tt;
                                socket.emit('api/getPointByName', message);
                                return;
                            }
                        });
                    }
                ],
                function (err) {
                    if (err) {
                        message.flag = -1;
                        message.total = 0;
                        message.message = '查询数据异常';
                        message.data = null;
                        socket.emit('api/getPointByName', message);
                        return;
                    }
                });
        });
        /*模糊查询获取测点信息 分页*/
        socket.on('api/blurryPoint', function (data) {
            var mess = GlobalAgent.getAPInfo(socket.id, APIUtils.QUERY_POINT);
            if (mess.flag < 0) {
                socket.emit('api/blurryPoint', {
                    flag: -1,
                    message: mess.message,
                    total: 0
                });
                return;
            }
            var domainId = mess.data.domainId;
            if (!domainId || domainId.length < 1) {
                message.flag = -1;
                message.message = '当前用户没有域';
                message.total = 0;
                message.data = [];
                socket.emit('api/blurryPoint', message);
                return;
            }
            var field = data.FIELD
            if (!field) {
                field = ['ID', 'RT', 'ED', 'FQ', 'FM', 'TV', 'BV', 'EU', 'DB', 'EX', 'PT', 'KT', 'AP', 'LC', 'H4', 'H3', 'ZH', 'HL', 'LL', 'ZL', 'L3', 'L4', 'C1', 'C2', 'C3', 'C4', 'C5', 'C6', 'C7', 'C8']
            }
            if (field.indexOf('ID') < 0) {
                field.unshift('ID');
            }
            field = field.toString();
            var offset = data.offset;
            var limit = data.limit;
            var pointName = data.pointName;
            var pointDesc = data.pointDesc;
            var pointType = data.pointType;
            var GM = data.GM;
            if (!GM && typeof(GM) != 'number') {
                GM = 1;
            }
            async.waterfall(
                [
                    function (callback) {
                        var sql = 'select POINT_ID,URI,POINT_NAME from sys_Point where DOMAIN_ID in (' + domainId + ') ';
                        var sqlPoint = 'select ' + field + ' from Point where KR in (' + domainId + ') ';
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
                                sqlPoint += ' and ID in (' + ids.toString() + ') '
                                if (offset && limit && typeof(offset) == 'number' && typeof(limit) == 'number') {
                                    sqlPoint += ' limit ' + offset + ',' + limit;
                                }
                                callback(null, rows, sqlPoint);
                            }
                        });
                    },
                    function (rr, sqlPoint, callback) {
                        opPool.query(sqlPoint, function (error, rows, colums) {
                            if (error && error.code) {
                                logger.error('查询数据错误：' + JSON.stringify(error));
                                message.flag = -1;
                                message.message = error.message;
                                message.data = [];
                                message.total = 0;
                                socket.emit('api/blurryPoint', message);
                                return;
                            } else {
                                callback(null, rr, rows);
                            }
                        });
                    },
                    function (rr, rows, callback) {
                        var tt = [];
                        for (var i in rr) {
                            for (var j in rows) {
                                if (rr[i].POINT_ID == rows[j].ID) {
                                    var r = rows[j];
                                    r.GN = rr[i].URI;
                                    r.PN = rr[i].POINT_NAME;
                                    tt.push(r);
                                    break;
                                }
                            }
                        }
                        message.flag = 0;
                        message.total = tt.length;
                        message.message = 'OK';
                        message.data = tt;
                        socket.emit('api/blurryPoint', message);
                        return;
                    }
                ],
                function (err) {
                    if (err) {
                        message.flag = -1;
                        message.total = 0;
                        message.message = '查询数据异常';
                        message.data = [];
                        socket.emit('api/blurryPoint', message);
                        return;
                    }
                });
        });
        /**
         * 添加MTree节点
         */
        socket.on('api/addMTree', function (data) {
            var mess = GlobalAgent.getAPInfo(socket.id, APIUtils.ADD_MTREE);
            if (mess.flag < 0) {
                socket.emit('api/addMTree', {
                    flag: -1,
                    message: mess.message,
                    total: 0
                });
                return;
            }
            var domainId = mess.data.domainId;
            if (!domainId || domainId.length < 1) {
                message.flag = -1;
                message.message = '当前用户没有域';
                message.total = 0;
                message.data = [];
                socket.emit('api/addMTree', message);
                return;
            }

            var NAME = data.NAME;
            var DESC = data.DESC;
            var PMTree = data.PMTree
            if (!PMTree) {
                message.flag = -1;
                message.message = '上级节点不能为空';
                message.data = [];
                message.total = 0;
                socket.emit('api/addMTree', message);
                return;
            }
            if (!NAME) {
                message.flag = -1;
                message.message = '名称不能为空';
                message.data = [];
                message.total = 0;
                socket.emit('api/addMTree', message);
                return;
            }
            var data = {
                NAME: NAME,
                DESCRIPTION: DESC,
                COMPANY_ID: mess.data.companyID,
                CREATE_DATE: Utils.dateFormat(new Date().getTime(), Utils.yyyyMMddhhmmss)
            };
            delete message.data;
            async.waterfall(
                [
                    function (callback) {
                        var sql = 'select ID,URI,DOMAIN_ID,MTREE_SOURCE from sys_mtree where DOMAIN_ID in (' + domainId + ') and IS_DELETED = 0 and URI  = "' + PMTree + '"';
                        logger.debug('获取父节点信息sql:' + sql);
                        query(sql, function (err, rows) {
                            if (err) {
                                logger.error('获取父节点信息错误：' + err);
                                message.flag = -1;
                                message.total = 0;
                                message.message = '创建出错';
                                socket.emit('api/addMTree', message);
                                return;
                            } else if (rows && rows.length < 1) {
                                message.flag = -1;
                                message.total = 0;
                                message.message = '上级节点不存在';
                                socket.emit('api/addMTree', message);
                                return;
                            } else {
                                callback(null, rows[0]);
                            }
                        });
                    },
                    function (row, callback) {
                        var sql = 'select count(ID) as count from sys_mtree where IS_DELETED = 0 and PID  = ' + row.ID + ' and name ="' + NAME + '"';
                        logger.debug('获取当前节点下是否有相同名称的节点sql:' + sql);
                        query(sql, function (err, rows, cols) {
                            if (err) {
                                logger.error('统计节点信息错误：' + err);
                                message.flag = -1;
                                message.total = 0;
                                message.message = '创建出错';
                                socket.emit('api/addMTree', message);
                                return;
                            } else {
                                if (rows && rows[0].count > 0) {
                                    message.flag = -1;
                                    message.total = 0;
                                    message.message = '父节点下存在同名节点';
                                    socket.emit('api/addMTree', message);
                                    return;
                                }
                                callback(null, row);
                            }
                        });
                    },
                    function (row, callback) {
                        data.PID = row.ID;
                        data.URI = row.URI + '/' + NAME;
                        data.DOMAIN_ID = row.DOMAIN_ID;
                        if (row.MTREE_SOURCE != 0) {
                            callback(null);
                        } else {
                            var sql = 'select count(DOMAIN_ID) as count from sys_domain where is_deleted =0 and pre_domain_id = ' + row.DOMAIN_ID;
                            logger.debug('获取当前节点所属域下的子域信息sql:' + sql);
                            query(sql, function (err, rows) {
                                if (err) {
                                    logger.error('当前节点所属域下的子域信息错误：' + err);
                                    message.flag = -1;
                                    message.total = 0;
                                    message.message = '查询子域出错';
                                    socket.emit('api/addMTree', message);
                                    return;
                                } else {
                                    if (rows && rows[0].count > 0) {
                                        message.flag = -1;
                                        message.total = 0;
                                        message.message = '当前节点所属域下存在同名的子域';
                                        socket.emit('api/addMTree', message);
                                        return;
                                    }
                                    callback(null);
                                }
                            });
                        }
                    },
                    function (callback) {
                        var sql = sqlQuery.insert().into('sys_mtree').set(data).build();
                        logger.debug('创建节点信息sql:' + sql);
                        query(sql, function (err, result) {
                            if (err == null && result) {
                                message.flag = 0;
                                message.total = 1;
                                message.message = 'OK';
                                socket.emit('api/addMTree', message);
                                return;
                            } else {
                                logger.error('创建节点错误：' + err);
                                message.flag = -1;
                                message.total = 0;
                                message.message = '创建节点出错';
                                socket.emit('api/addMTree', message);
                                return;
                            }
                        });
                    }
                ],
                function (err, rows) {
                    if (err) {
                        logger.error('添加MTree节点错误：' + err);
                        message.flag = -1;
                        message.total = 0;
                        message.message = '创建出错';
                        socket.emit('api/addMTree', message);
                        return;
                    }
                });
        });
        /**
         * 删除MTree节点
         */
        socket.on('api/deleteMTree', function (data) {
            var mess = GlobalAgent.getAPInfo(socket.id, APIUtils.DELETE_MTREE);
            if (mess.flag < 0) {
                socket.emit('api/deleteMTree', {
                    flag: -1,
                    message: mess.message,
                    total: 0
                });
                return;
            }
            var domainId = mess.data.domainId;
            if (!domainId || domainId.length < 1) {
                message.flag = -1;
                message.message = '当前用户没有域';
                message.total = 0;
                socket.emit('api/deleteMTree', message);
                return;
            }
            var URI = data.URI;
            if (!URI) {
                message.flag = -1;
                message.message = '名称不能为空';
                message.data = [];
                message.total = 0;
                socket.emit('api/deleteMTree', message);
                return;
            }
            delete  message.data;
            try {
                transaction(function (err, conn) {
                    if (err) {
                        logger.error('删除节点失败：' + err);
                        message.flag = -1;
                        message.message = "操作失败";
                        res.json(message);
                        return;
                    } else {
                        async.waterfall(
                            [
                                function (callback) {
                                    var sql = 'select ID,MTREE_SOURCE from sys_mtree where DOMAIN_ID in (' + domainId + ') and IS_DELETED = 0 and URI = "' + URI + '"';
                                    logger.debug('获取是否是域节点 sql:' + sql)
                                    conn.query(sql, function (err, rows) {
                                        if (err) {
                                            logger.error('获取是否是域节点错误：' + err);
                                            message.flag = -1;
                                            message.total = 0;
                                            message.message = '获取是否是域节点失败';
                                            socket.emit('api/deleteMTree', message);
                                            return;
                                        } else if (rows && rows.length < 1) {
                                            message.flag = -1;
                                            message.message = '当前节点不存在';
                                            socket.emit('api/deleteMTree', message);
                                            return;
                                        } else {
                                            callback(null, rows[0].ID);
                                        }
                                    });
                                },
                                function (treeID, callback) {
                                    var sqlIds = 'select UUID as uuid,POINT_ID as id from sys_point where URI LIKE (SELECT CONCAT(URI,"/%") FROM sys_mtree  WHERE ID = ' + treeID + ')';
                                    logger.debug('获取对应MTree下面的点ID sql:' + sqlIds)
                                    conn.query(sqlIds, function (err, rows) {
                                        if (err) {
                                            logger.error('获取对应Mtree下面的点ID错误：' + (err || rows.length));
                                            message.flag = -1;
                                            message.total = 0;
                                            message.message = '获取点数据信息失败';
                                            socket.emit('api/deleteMTree', message);
                                            return;
                                        } else {
                                            var size = rows.length;
                                            var ids = [];
                                            var uuids = [];
                                            for (var i = 0; i < size; i++) {
                                                ids.push(rows[i].id);
                                                uuids.push(rows[i].uuid);
                                            }
                                            callback(null, ids, uuids, treeID);
                                        }
                                    });
                                },
                                function (ids, uuids, treeID, callback) {
                                    if (ids && ids.length > 0) {
                                        opPool.remove('Point', 'ID', ids, function (error, rows) {
                                            if (error) {
                                                message.flag = -1;
                                                message.total = 0;
                                                message.message = '删除点失败';
                                                socket.emit('api/deleteMTree', message);
                                                return;
                                            } else {
                                                callback(null, uuids, treeID);
                                            }
                                        });
                                    } else {
                                        callback(null, uuids, treeID);
                                    }
                                },
                                function (uuids, treeID, callback) {
                                    if (uuids && uuids.length > 0) {
                                        var sql = sqlQuery.remove().from('sys_point').where({
                                            UUID: uuids
                                        }).build();
                                        logger.debug('删除关系库中点信息sql:' + sql);
                                        conn.query(sql, function (cerr, result) {
                                            if (cerr) {
                                                logger.error('删除关系库中点信息错误:' + cerr);
                                                message.flag = -1;
                                                message.total = 0;
                                                message.message = '删除点失败';
                                                socket.emit('api/deleteMTree', message);
                                                return;
                                            } else {
                                                callback(null, treeID);
                                            }
                                        });
                                    } else {
                                        callback(null, treeID);
                                    }
                                },
                                function (treeID, callback) {
                                    var sql = 'DELETE FROM sys_mtree WHERE ID = ' + treeID + ' or ID IN (select ID from (SELECT ID FROM sys_mtree WHERE URI LIKE (SELECT CONCAT(URI, "/%") FROM sys_mtree WHERE ID = ' + treeID + '))t)'
                                    logger.debug('删除MTree sql :' + sql);
                                    conn.query(sql, function (cerr, result) {
                                        if (cerr) {
                                            logger.error('删除MTree信息错误:' + cerr);
                                            message.flag = -1;
                                            message.total = 0;
                                            message.message = '删除点失败';
                                            socket.emit('api/deleteMTree', message);
                                            return;
                                        } else {
                                            message.flag = 0;
                                            message.total = result.affectedRows;
                                            message.message = 'OK';
                                            socket.emit('api/deleteMTree', message);
                                            return;
                                        }
                                    });
                                }
                            ],
                            function (err, rows) {
                                if (err) {
                                    logger.debug('删除MTree错误：' + err);
                                    message.flag = -1;
                                    message.total = 0;
                                    message.message = '删除点失败';
                                    socket.emit('api/deleteMTree', message);
                                    return;
                                }
                            });
                    }
                });
            } catch (e) {
                logger.error('删除MTree节点出现异常：' + e);
                message.flag = -1;
                message.total = 0;
                message.message = "操作失败";
                socket.emit('api/deleteMTree', message);
            }
        });
        /**
         * 删除MTree节点
         */
        socket.on('api/blurryMTree', function (data) {
            var mess = GlobalAgent.getAPInfo(socket.id, APIUtils.READ_MTREE);
            if (mess.flag < 0) {
                socket.emit('api/blurryMTree', {
                    flag: -1,
                    message: mess.message,
                    total: 0
                });
                return;
            }
            var domainId = mess.data.domainId;
            if (!domainId || domainId.length < 1) {
                message.flag = -1;
                message.message = '当前用户没有域';
                message.total = 0;
                socket.emit('api/blurryMTree', message);
                return;
            }
            var URI = data.URI;
            if (!URI) {
                message.flag = -1;
                message.message = '名称不能为空';
                message.data = [];
                message.total = 0;
                socket.emit('api/blurryMTree', message);
                return;
            }
            var GM = data.GM;
            if (!GM && typeof (GM) != 'number') {
                GM = 1;
            }
            delete  message.data;
            async.waterfall(
                [
                    function (callback) {
                        var sql = 'select USER_ID,DOMAIN_ID,IS_ADMIN from sys_user_domain where IS_DELETED = 0 and DOMAIN_ID in (' + domainId.toString() + ')';
                        logger.debug('获取Domain信息sql:' + sql);
                        query(sql, function (err, rows) {
                            if (err) {
                                logger.error('获取用户domain信息错误:' + err);
                                return;
                            }
                            if (rows && rows.length < 1) {
                                message.flag = 0;
                                message.message = 'OK';
                                message.data = [];
                                message.total = 0;
                                socket.emit('api/blurryMTree', message);
                                return;
                            }
                            callback(null, rows);
                        });
                    },
                    function (userDomain, callback) {
                        var sql = 'select DOMAIN_ID,URI from sys_mtree where IS_DELETED = 0 and COMPANY_ID = ' + mess.data.companyID;
                        logger.debug('获取用户对应的MTree信息sql:' + sql);
                        query(sql, function (err, rows) {
                            if (err) {
                                logger.error('获取用户MTree信息错误:' + err);
                                return;
                            }
                            if (rows && rows.length < 1) {
                                message.flag = 0;
                                message.message = 'OK';
                                message.data = [];
                                message.total = 0;
                                socket.emit('api/blurryMTree', message);
                                return;
                            }
                            //管理员
                            for (var t in userDomain) {
                                var ud = userDomain[t];
                                for (var j in rows) {
                                    var r = rows[j];
                                    if (r.DOMAIN_ID == ud.DOMAIN_ID) {
                                        ud.URI = r.URI;
                                        userDomain[t] = ud;
                                        break;
                                    }
                                }
                            }
                            var rrs = [];
                            for (var i in rows) {
                                var row = rows[i];
                                for (var j in userDomain) {
                                    var ud = userDomain[j];
                                    if (row.URI.indexOf(ud.URI + '/') > -1 || row.DOMAIN_ID == ud.DOMAIN_ID) {
                                        rrs.push(row);
                                        break;
                                    }
                                }
                            }
                            var rs = [];
                            if (GM == 1) {
                                for (var i in rrs) {
                                    var rr = rrs[i];
                                    if (rr.URI.indexOf(URI) > -1) {
                                        delete rr.DOMAIN_ID;
                                        rs.push(rr);
                                    }
                                }
                            } else {
                                for (var i in rrs) {
                                    var rr = rrs[i];
                                    if (rr.URI.indexOf(URI) == 0) {
                                        delete rr.DOMAIN_ID;
                                        rs.push(rr);
                                    }
                                }
                            }
                            message.flag = 0;
                            message.message = 'OK';
                            message.data = rs;
                            message.total = rs.length;
                            socket.emit('api/blurryMTree', message);
                            return;
                        });
                    }
                ],
                function (err) {
                    if (err) {
                        logger.error('刷新用户Domain缓存错误，用户ID:' + user.USER_NAME);
                    }
                });
        });
    }
}
module.exports = pointSocket;

var actionUtil = require("../../framework/action/actionUtils")();
var transaction = actionUtil.transaction;
var async = require("async");
var uuidUtil = require('node-uuid');
var Utils = require('../../utils/tools/utils');
var configUtils = require('../../utils/tools/configUtils');
var OPAPI = require('opapi');
var xlsx = require("node-xlsx");
var formidable = require('formidable');
var fs = require('fs'); //node.js核心的文件处理模块
var querystring = require('querystring');
var query = actionUtil.query;

var opPool = require('../../openplant/openPlantPool');
var moduleName = "domain";
var sql = require('sql-query'),
    sqlQuery = sql.Query();
var logger = require('log4js').getLogger('system');

function URIUtils(URI, Name) {
    return (URI == "/" ? "" : URI) + "/" + Name;
};

var message = {
    flag: 0,
    message: '成功',
    data: null
}

var domain_manage = {
    //创建对象
    createAction: function(req, res, action) {
        var NAME = req.body.NAME;
        var DESCRIPTION = req.body.DESCRIPTION;
        var PID = req.body.PID;
        var companyId = req.session.user.ENTERPRISE_ID;
        if (PID == "") {
            PID = null;
        }
        var data = {
            NAME: NAME,
            DESCRIPTION: DESCRIPTION,
            PID: PID,
            COMPANY_ID: companyId
        };
        if (NAME != undefined && NAME != null && NAME != "") {
            var URL = "";
            if (PID != null) {
                var sql = sqlQuery.select().from('sys_mtree').select("ID", "URI").where({ ID: PID }).limit(1).build();
                query(sql, function(err, result) {
                    data.URI = URIUtils(result[0].URI, NAME);
                    var sql = sqlQuery.insert().into('sys_mtree')
                        .set(data)
                        .build();
                    query(sql, function(err, result) {
                        var insertId = result.insertId; //获取自动生成的id
                        var message = {};
                        if (err == null && result) {
                            message.insertId = result.insertId;
                            message.msg = 'success';
                        } else {
                            message.insertId = -1;
                            message.msg = 'fail';
                        }
                        res.write(JSON.stringify(message));
                        res.end();

                    });
                })
            }
        } else {
            return res.redirect("/");
        }
    },
    //修改数据库表
    updateAction: function(req, res, action) {

    },
    //删除节点
    removeMTree: function(req, res, sction) {
        var treeID = req.body.treeId;
        transaction(function(err, conn) {
            if (err) {
                logger.error('删除节点失败：' + err);
                message.flag = -1;
                message.message = "操作失败";
                res.json(message);
                return;
            } else {
                async.waterfall(
                    [
                        function(callback) {
                            var sqlIds = 'select UUID as uuid,POINT_ID as id from sys_point where UUID in(select UUID from sys_mtree_tags where mtree_id in(SELECT ID FROM sys_mtree WHERE URI LIKE (SELECT CONCAT(URI,"%") FROM sys_mtree  WHERE ID = ' + treeID + ')))';
                            logger.debug('获取对应MTree下面的点ID sql:' + sqlIds)
                            conn.query(sqlIds, function(err, rows) {
                                if (err) {
                                    logger.error('获取对应Mtree下面的点ID错误：' + (err || rows.length));
                                    message.flag = -1;
                                    message.message = '获取点数据信息失败';
                                    message.data = null;
                                    res.json(message);
                                } else {
                                    var size = rows.length;
                                    var ids = new Array();
                                    var uuids = new Array();
                                    for (var i = 0; i < size; i++) {
                                        ids.push(rows[i].id);
                                        uuids.push(rows[i].uuid);
                                    }
                                    callback(null, ids, uuids);
                                }
                            });

                        },
                        function(ids, uuids, callback) {
                            if (ids && ids.length > 0) {
                                opPool.remove('Point', 'ID', ids, function(error, rows) {
                                    if (error) {
                                        message.flag = -1;
                                        message.data = null;
                                        message.message = '删除点失败';
                                        res.send(message);
                                        return;
                                    } else {
                                        callback(null, uuids);
                                    }
                                });
                            } else {
                                callback(null, uuids);
                            }
                        },
                        function(uuids, callback) {
                            if (uuids && uuids.length > 0) {
                                var deleteTag = sqlQuery.remove().from('sys_mtree_tags').where({ UUID: uuids }).build();
                                logger.debug('删除Mtree中测信息:' + deleteTag);
                                conn.query(deleteTag, function(perr, result) {
                                    if (perr) {
                                        logger.error('删除Mtree中测信息错误:' + perr);
                                        message.flag = -1;
                                        message.data = null;
                                        message.message = '删除点失败';
                                        res.send(message);
                                    } else {
                                        callback(null, uuids);
                                    }
                                });
                            } else {
                                callback(null, uuids);
                            }
                        },
                        function(uuids, callback) {
                            if (uuids && uuids.length > 0) {
                                var sql = sqlQuery.remove().from('sys_point').where({ UUID: uuids }).build();
                                logger.debug('删除关系库中点信息sql:' + sql);
                                conn.query(sql, function(cerr, result) {
                                    if (cerr) {
                                        logger.error('删除关系库中点信息错误:' + cerr);
                                        message.flag = -1;
                                        message.data = null;
                                        message.message = '删除点失败';
                                        res.send(message);
                                        return;
                                    } else {
                                        callback(null);
                                    }
                                });
                            } else {
                                callback(null);
                            }
                        },
                        function(callback) {
                            var sql = 'DELETE FROM sys_mtree WHERE ID IN (select ID from (SELECT ID FROM sys_mtree WHERE URI LIKE (SELECT CONCAT(URI, "%") FROM sys_mtree WHERE ID = ' + treeID + '))t)'
                            logger.debug('删除MTree sql :' + sql);
                            conn.query(sql, function(cerr, result) {
                                if (cerr) {
                                    logger.error('删除MTree信息错误:' + cerr);
                                    message.flag = -1;
                                    message.data = null;
                                    message.message = '删除点失败';
                                    res.send(message);
                                } else {
                                    message.flag = 0;
                                    message.data = null;
                                    message.message = 'OK';
                                    res.send(message);
                                    return;
                                }
                            });
                        }
                    ],
                    function(err, rows) {
                        if (err) {
                            message.flag = -1;
                            mesage.message = '删除点失败';
                            message.data = null;
                            res.json(message);
                            return;
                        } else {
                            message.flag = 0;
                            message.message = 'OK';
                            message.data = null;
                            res.json(message);
                            return;
                        }
                    });
            }
        });
    },
    //重命名树结构
    renameTreeAction: function(req, res, action) {
        var id = req.body.id;
        var newName = req.body.newName;
        if (id && newName) {
            var sqlUpdate = sqlQuery.update()
            var sql = sqlUpdate
                .into('sys_mtree')
                .set({ NAME: newName }).where({ ID: id })
                .build();
            query(sql, function(err, result) {
                var message = {};
                if (err == null && result) {
                    message.msg = 'success';
                } else {
                    message.msg = 'fail';
                }
                res.write(JSON.stringify(message));
                res.end();

            });
        } else {
            res.write(JSON.stringify({ msg: "fail" }));
            res.end();
        }
    },
    //拷贝树
    copyMTree: function(req, res, action) {
        var sourceID = req.body.sourceID;
        var newName = req.body.newName;
        var targetID = req.body.targetID;
        var pasteType = req.body.pasteType;
        var companyId = req.session.user.ENTERPRISE_ID;
        var mtreeRowsGlobal = new Array();
        var treeIDMap = new Object();
        if (pasteType == "copy") {
            try {
                transaction(function(err, connection) {
                    if (err) {
                        logger.error("transaction ERROR" + err);
                    } else {
                        async.waterfall(
                            [
                                function(callback) {
                                    var sql = 'SELECT count(ID) as count from sys_mtree c WHERE PID = ' + targetID + ' and NAME = "' + newName + '"';
                                    logger.debug('获取当前节点下的同名数据sql:' + sql);
                                    connection.query(sql, function(err, rows) {
                                        if (err || rows[0].count > 0) {
                                            logger.error('获取目标节点相同名称节点错误：' + (err || rows[0].count));
                                            message.flag = -1;
                                            message.data = null;
                                            message.message = '目标节点下面存在相同名称的点';
                                            res.json(message);
                                            return;
                                        } else {
                                            callback(null);
                                        }
                                    });
                                },
                                function(callback) {
                                    var sql = "SELECT ID,PID,NAME,DESCRIPTION FROM sys_mtree c " +
                                        " WHERE c.URI LIKE (SELECT CONCAT(uri,'%') FROM sys_mtree c WHERE c.ID = " + sourceID + ") " +
                                        " order by URI";
                                    logger.debug('获取节点及子节点sql：' + sql);
                                    connection.query(sql, function(err, result) {
                                        var rows = result;
                                        if (err == null && rows && rows.length > 0) {
                                            callback(null, rows);
                                        } else {
                                            message.data = null;
                                            message.flag = -1;
                                            message.message = '获取节点性失败';
                                            logger.error('获取节点及子节点错误：' + err);
                                            res.json(message);
                                            return;
                                        }
                                    });
                                },
                                function(mtreeRows, callback) {
                                    mtreeRowsGlobal = mtreeRows;
                                    var targetSQL = "SELECT ID,PID,URI FROM sys_mtree c WHERE ID = " + targetID;
                                    logger.debug('获取目标节点sql：' + targetSQL);
                                    connection.query(targetSQL, function(err, result) {
                                        var URI = result[0].URI;
                                        async.eachSeries(mtreeRows, function(row, callbackMTree) {
                                            var treeCatch = treeIDMap[row.PID];
                                            if (row.ID == sourceID) {
                                                row.PID = targetID;
                                                row.URI = URIUtils(URI, (newName? newName : row.NAME));
                                                row.NAME = newName;
                                            } else if (treeCatch) {
                                                var treeCatch = treeIDMap[row.PID];
                                                row.PID = treeCatch.ID;
                                                row.URI = URIUtils(treeCatch.URI, row.NAME);
                                            } else {
                                                row.PID = targetID;
                                                row.URI = URIUtils(URI, row.Name);
                                                callbackMTree(null);
                                            }
                                            var id = row.ID;
                                            row.OID  =row.ID;
                                            //采用自增ID
                                            delete row.ID;
                                            var sql = sqlQuery.insert().into('sys_mtree').set(row).build();
                                            connection.query(sql, function(err, insertResult) {
                                                if (err) {
                                                    callbackMTree(err)
                                                } else {
                                                    treeIDMap[id] = {
                                                        ID: insertResult.insertId,
                                                        URI: row.URI
                                                    }
                                                    callbackMTree(err);
                                                }
                                            });
                                        }, function(err) {
                                            if (err) {
                                                logger.error('复制节点信息错误：' + err);
                                                message.flag = -1;
                                                message.message = '复制出错';
                                                message.data = null;
                                                res.json(message);
                                                return;
                                            } else {
                                                callback(null);
                                            }
                                        });
                                    });
                                },
                                function(callback) {
                                    logger.error('----------------------------');
                                    logger.error(treeIDMap);
                                    logger.error(mtreeRowsGlobal);
                                    logger.error('----------------------------');
                                    var tagId = '';
                                    for (var i = 0; i < mtreeRowsGlobal.length; i++) {
                                        tagId += mtreeRowsGlobal[i].OID;
                                        if (mtreeRowsGlobal[i + 1]) {
                                            tagId += ',';
                                        }
                                    }
                                    var sql = 'SELECT ID,UUID,TAG_ID from sys_mtree_tags where TAG_ID in (' + tagId + ')';
                                    logger.debug('获取对应节点下面的测点UD sql：' + sql);
                                    connection.query(sql, function(err, rows) {
                                        if (err) {
                                            logger.error('获取测点信息错误：'+err);
                                            message.flag = -1;
                                            message.message = '获取节点测点信息失败';
                                            message.data = null;
                                            res.json(message);
                                            return;
                                        } else {
                                            callback(null, rows);
                                        }
                                    });
                                },
                                function( pointRows, callback) {
                                    var pointUDs = '';
                                    for (var i = 0; i < pointRows.length; i++) {
                                        pointUDs += pointRows[i].UUID;
                                        if (pointRows[i + 1]) {
                                            pointUDs += ',';
                                        }
                                    }
                                    if (!pointUDs || pointUDs == '') {
                                        message.flag = 0;
                                        message.message = 'OK';
                                        message.data = null;
                                        res.json(message);
                                        return;
                                    }
                                    var sql = 'select ID,UD,TN,RT,ED,FQ,FM,TV,BV,EU,DB,EX,PT,KT,AP,LC,H4,H3,ZH,HL,LL,ZL,L3,L4,CT from Point where UD in (' + pointUDs + ')';
                                    opPool.query(sql, function(error, rows, columns) {
                                        if (error && error.code) {
                                            logger.error('获取测点信息失败：' + JSON.stringify(error));
                                            message.flag = -1;
                                            message.message = '编辑点失败';
                                            message.data = null;
                                            res.send(message);
                                            return;
                                        } else {
                                            callback(null, pointRows, rows);
                                        }
                                    });
                                },
                                function(pointTagRows, pointRows) {
                                    var pointMTrees = new Array();
                                    var pointMTreeTags = new Array();
                                    for (var i in pointTagRows) {
                                        var pointTag = pointTagRows[i];
                                        var mtree = treeIDMap[pointTag.ID];
                                        for (var j in pointRows) {
                                            var pointRow = pointRows[j];
                                            if (pointTag.UUID == pointRow.UD) {
                                                pointRow.ID = configUtils.getPointIDNext();
                                                pointRow.ND = 1;
                                                var pointURI = pointRow.URI + '/' + pointPN;
                                                var uuid = opPool.makeUUID(pointURI);
                                                pointRow.PN = uuid;
                                                pointRow.UD = uuid;
                                                pointRows[j] = pointRow;
                                                var pointMTree = new Object();

                                                pointMTree.POINT_ID = pointRow.ID;
                                                pointMTree.UUID = uuid;
                                                POINT_NAME = pointRow.TN;
                                                pointMTree.URI = pointRow.URI + '/' + pointPN;;
                                                pointMTree.POINT_TYPE = pointRow.RT;
                                                pointMTree.UNIT = pointRow.EU;
                                                pointMTree.DESCRIPTION = pointRow.ED;
                                                pointMTree.COMPRESS_TYPE = pointRow.DB;
                                                pointMTreeTags.push(pointMTreeTag);
                                                var pointMTreeTag = new Object();
                                                pointMTreeTag.UUID = uuid;
                                                pointMTreeTag.MTREE_ID = targetID;
                                                pointMTreeTags.push(pointMTreeTag);
                                            }
                                        }
                                    }
                                    callback(null, pointRows, pointMTrees, pointMTreeTags);
                                },
                                function(pointRows, pointMTrees, pointMTreeTags, callback) {
                                    var cols = new Array();
                                    var pointPN = req.body.pointPN.toUpperCase();
                                    cols.push(["ID", OPAPI.TYPE.INT32]);
                                    cols.push(["ND", OPAPI.TYPE.INT32]);
                                    cols.push(["UD", OPAPI.TYPE.INT64]);
                                    cols.push(["PN", OPAPI.TYPE.STRING]);
                                    cols.push(["TN", OPAPI.TYPE.STRING]);
                                    cols.push(["RT", OPAPI.TYPE.INT8]);
                                    cols.push(["KR", OPAPI.TYPE.STRING]);
                                    cols.push(["AN", OPAPI.TYPE.STRING]);
                                    cols.push(["FQ", OPAPI.TYPE.INT16]);
                                    cols.push(["ED", OPAPI.TYPE.STRING]);
                                    cols.push(["TV", OPAPI.TYPE.FLOAT]);
                                    cols.push(["BV", OPAPI.TYPE.FLOAT]);
                                    cols.push(["EU", OPAPI.TYPE.STRING]);
                                    cols.push(["DB", OPAPI.TYPE.FLOAT]);
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
                                    var rows = new Array();
                                    for (var i in pointRows) {
                                        var row = new Array();
                                        var pointRow = pointRows[i];
                                        row.push(pointRow.ID);
                                        row.push(1);
                                        row.push(pointRow.PN);
                                        row.push(pointRow.TN);
                                        row.push(pointRow.RT);
                                        row.push(pointRow.KR);
                                        row.push(pointRow.AN);
                                        row.push(pointRow.FQ);
                                        row.push(pointRow.ED);
                                        row.push(pointRow.TV);
                                        row.push(pointRow.BV);
                                        row.push(pointRow.EU);
                                        row.push(pointRow.DB);
                                        row.push(pointRow.FM);
                                        row.push(pointRow.PT);
                                        row.push(pointRow.KT);
                                        row.push(pointRow.EX);
                                        row.push(pointRow.AP);
                                        row.push(pointRow.LC);
                                        row.push(pointRow.H4);
                                        row.push(pointRow.H3);
                                        row.push(pointRow.ZH);
                                        row.push(pointRow.HL);
                                        row.push(pointRow.LL);
                                        row.push(pointRow.ZL);
                                        row.push(pointRow.L3);
                                        row.push(pointRow.L4);
                                        row.push(pointRow.C1);
                                        row.push(pointRow.C2);
                                        row.push(pointRow.C3);
                                        row.push(pointRow.C4);
                                        row.push(pointRow.C5);
                                        row.push(pointRow.C6);
                                        row.push(pointRow.C7);
                                        row.push(pointRow.C8);
                                        rows.push(row);
                                    }
                                    opPool.insert('Point', rows, cols, function(err, rows, columns) {
                                        if (err && err.code || rows[0].EC != 0) {
                                            logger.error('插入测点错误:' + (JSON.stringify(err) || rows[0].EC));
                                            message.flag = -1;
                                            message.message = '编辑点失败';
                                            res.send(message);
                                            return;
                                        } else {
                                            callback(null, pointMTrees, pointMTreeTags);
                                        }
                                    });
                                },
                                function(pointMTrees, pointMTreeTags, callback) {
                                    var sqlPoints = 'insert into sys_point (`POINT_ID`, `UUID`, `URI`, `DB_ID`, `POINT_NAME`, `UNIT`, `POINT_TYPE`,`DESCRIPTION`,`COMPRESS_TYPE`,`CREATE_DATE`,`ENTERPRISE_ID`)';
                                    var sqlValue = '';
                                    var size = pointMTrees.length;
                                    for (var i = 0; i < size; i++) {
                                        var row = pointMTrees[i];
                                        sqlValue += '(';
                                        sqlValue += row.ID + ',';
                                        sqlValue += '\'' + row.UUID + '\',';
                                        sqlValue += '\'' + row.URI + '\',';
                                        sqlValue += 1 + ',';
                                        sqlValue += '\'' + row.TN + '\',';
                                        sqlValue += '\'' + row.EU + '\',';
                                        sqlValue += row.RT + ',';
                                        sqlValue += '\'' + row.ED + '\',';
                                        sqlValue += row.DB + ',';
                                        sqlValue += '\'' + Utils.dateFormat(new Date().getTime(), Utils.yyyyMMddhhmmss) + '\',';
                                        sqlValue += companyID;
                                        sqlValue += ')';
                                        if (rows[i + 1]) {
                                            sqlValue += ',';
                                        }
                                    }
                                    if (!sqlValue) {
                                        message.flag = -1;
                                        message.message = '没有获取到数据';
                                        res.send(message);
                                        return;
                                    }
                                    sqlPoints += ' values ' + sqlValue;
                                    logger.debug('批量插入关系库sql为:' + sqlPoints);
                                    query(sqlPoints, function(perr, result, columns) {
                                        if (perr) {
                                            logger.error('插入测点到关系库错误：' + perr);
                                            message.flag = -1;
                                            message.message = '插入点信息失败';
                                            message.data = null;
                                            res.send(message);
                                            return;
                                        }
                                        callback(null, pointMTreeTags, result.insertId);
                                    });
                                },
                                function(pointMTreeTags, insertId, callback) {
                                    var sqlTag = 'insert into sys_mtree_tags (`uuid`, `TAG_ID`, `MTREE_ID`)';
                                    var sqlValue = '';
                                    var size = pointMTreeTags.length;
                                    for (var i = 0; i < size; i++) {
                                        var row = pointMTreeTags[i];
                                        var idtemp = insertId + i; //批量插入的时候，insertId只是最前面的一个
                                        sqlValue += '(';
                                        sqlValue += '\'' + row.UUID + '\',';
                                        sqlValue += idtemp + ',';
                                        sqlValue += row.MTREE_ID;
                                        sqlValue += ')';
                                        if (rows[i + 1]) {
                                            sqlValue += ',';
                                        }
                                    }
                                    if (!sqlValue) {
                                        message.flag = -1;
                                        message.message = '没有获取到数据';
                                        res.send(message);
                                        return;
                                    }
                                    sqlTag += ' values ' + sqlValue;
                                    logger.debug('批量插入关系库sql为：' + sqlTag);
                                    query(sqlTag, function(cerr, result) {
                                        if (cerr) {
                                            logger.error('复制节点测点信息到关系库错误：' + cerr);
                                            message.flag = -1;
                                            message.message = '复制节点失败';
                                            message.data = null;
                                            res.send(message);
                                            return;
                                        } else {
                                            message.flag = 0
                                            message.message = 'OK';
                                            message.data = null;
                                            res.send(message);
                                            return;
                                        }
                                    });

                                }
                            ],
                            function(err, rows) {
                                if (err) {
                                    logger.error('复制节点信息错误：' + err);
                                    message.flag = -1;
                                    message.message = '复制出错';
                                    message.data = null;
                                    res.json(message);
                                } else {
                                    message.flag = 0;
                                    message.message = 'OK';
                                    message.data = null;
                                    res.json(message);
                                }
                            });
                    }
                })
            } catch (e) {
                console.error(e)
                return;
            }
        } else if (pasteType == "cut") {
            try {
                transaction(function(err, connection) {
                    if (err) {
                        logger.error("transaction ERROR" + err);
                    } else {
                        async.waterfall([
                            function(callback) {
                                var sql = "SELECT URI FROM sys_mtree  WHERE ID IN (SELECT pid FROM sys_mtree  WHERE ID = " + sourceID + ")";
                                connection.query(sql, function(err, result) {
                                    if (result.length > 0) {
                                        callback(null, result[0].URI);
                                    }
                                });
                            },
                            function(sourceURI, callback) {
                                var sql = sqlQuery.select().from('sys_mtree').select("ID", "URI").where({ ID: targetID }).limit(1).build();
                                connection.query(sql, function(err, result) {
                                    if (result.length > 0) {
                                        callback(null, sourceURI, result[0].URI);
                                    }
                                });
                            },
                            function(sourceURI, targetURI, callback) {
                                var sql = "SELECT ID FROM sys_mtree WHERE URI LIKE (SELECT CONCAT(URI,'%') FROM sys_mtree  WHERE ID = " + sourceID + ")";
                                connection.query(sql, [sourceURI, targetURI], function(err, rows) {
                                    var ids = new Array();
                                    rows.forEach(function(row) {
                                        ids.push(row.ID);
                                    })
                                    callback(null, sourceURI, targetURI, ids);
                                });
                            },
                            function(sourceURI, targetURI, ids, callback) {
                                var sql = "UPDATE SYS_MTREE SET URI=REPLACE(URI,?,?) WHERE ID in (?)";
                                connection.query(sql, [sourceURI, targetURI, ids], function(err, result) {
                                    if (err) {
                                        console.error(err)
                                        callback(err);
                                    } else {
                                        callback(null);
                                    }
                                });
                            },
                            function(callback) {
                                var sql = sqlQuery.update()
                                    .into('sys_mtree')
                                    .set({ PID: targetID }).where({ ID: sourceID })
                                    .build();

                                connection.query(sql, function(err, result) {
                                    if (err == null) {
                                        message.msg = 'success';
                                    } else {
                                        message.msg = 'fail';
                                    }
                                    callback(null, result);
                                });
                            }
                        ], function(err) {
                            if (err) {
                                console.error(err)
                                message.msg = 'fail';
                            }
                            res.write(JSON.stringify(message));
                            res.end();
                        })
                    }
                })
            } catch (e) {
                console.error(e)
                message.msg = 'fail';
                res.write(JSON.stringify(message));
                res.end();
                return;
            }
        }
    },
    _refactorMtreeURI: function() {

    },
    //保存树
    saveTreeAction: function(req, res, action) {
        var rows = req.body.rows;
        rows = JSON.parse(rows);
        var message = {};
        try {
            transaction(function(err, connection) {
                if (err) {
                    console.error("transaction ERROR" + err);
                } else {
                    var URIcache = new Object();

                    function buildSQL(row, PID, URI) {
                        var sqlUpdate = sqlQuery.update()
                        var sql;
                        if (URI) {
                            sql = sqlUpdate.into('sys_mtree').set({ PID: PID, URI: URI, LAYER: row.level }).where({ ID: row.id, NAME: row.label }).build();
                        } else {
                            sql = sqlUpdate.into('sys_mtree').set({ PID: PID, LAYER: row.level }).where({ ID: row.id, NAME: row.label }).build();
                        }
                        return sql;
                    }
                    rows.forEach(function(row) {
                        var PID = row.parentId && row.parentId > 0 ? row.parentId : null;
                        //TODO URI重新生成
                        var sql;
                        if (PID == null) {
                            URIcache[row.id] = "/";
                            sql = buildSQL(row, PID, URIcache[row.id]);
                        } else if (URIcache[PID]) {
                            URIcache[row.id] = URIUtils(URIcache[PID], row.label);
                            sql = buildSQL(row, PID, URIcache[row.id]);
                        }
                        try {
                            connection.query({ sql: sql, timeout: 1000 * 5 }, function(err, result) {
                                if (err) {
                                    if (err.code === 'PROTOCOL_SEQUENCE_TIMEOUT') {
                                        throw new Error('执行语句超时! SQL:' + sql);
                                    } else {
                                        console.error('执行语句错误! SQL:' + sql);
                                        console.error(err)
                                    }
                                }
                                if (err) {
                                    throw err;
                                }
                            });
                        } catch (err) {
                            throw err;
                        }
                    })
                    message.msg = 'success';
                    res.write(JSON.stringify(message));
                    res.end();
                }
            })
        } catch (e) {
            console.error(e)
            message.msg = 'fail';
            res.write(JSON.stringify(message));
            res.end();
            return;
        }
    },
    //删除数据库记录
    deleteAction: function(req, res, action) {
        var message = {};
        var id = req.body.ID;
        if (id != undefined && id != null && id != "") {
            var sql = "DELETE  FROM sys_mtree  WHERE id = " + id
            query(sql, function(err, result) {
                if (err == null) {
                    message.msg = 'success';
                } else {
                    message.msg = 'fail';
                }
                res.write(JSON.stringify(message));
                res.end();
            });
        } else {
            message.msg = 'fail';
            res.write(JSON.stringify(message));
            res.end();
        }
    },
    //批量数据库操作
    batchDeleteAction: function(req, res, action) {

    },
    //下载文件
    downloadAction: function(req, res, action) {

    },
    //后端验证
    validatorAction: function(req, res, action) {

    },
    //管理页面
    MTreeManageAction: function(req, res, action) {
        var method = req.params.method;
        var list = {
            pageName: "测点管理",
            treeDataURL: "/domain/projectPoint/MtreeJson",
            key: "ID"
        }
        res.render(moduleName + "/projectPoint/" + action, list);
    },
    MtreeJson: function(req, res) {
        var id = req.body.id;
        var pid = "IS NULL"
        if (id) {
            pid = "=" + id;
        } else {
            pid = "IS NULL"
        }
        var companyId = req.session.user.ENTERPRISE_ID;
        var sql = " SELECT tree.ID as id , tree.PID AS value, tree.PID as parentid ,CASE WHEN tree.PID " + pid + " THEN tree.NAME ELSE 'Loading...' END AS NAME," +
            "  TYPE_ID,tree_type.TYPE_NAME, LINK_ID, URI,  LAYER, CREATE_DATE, ZORDER, tree.DESCRIPTION, tree.IS_SYSTEM, IS_LEAF, IS_DELETED FROM sys_mtree  tree " +
            "  LEFT JOIN sys_tree_type tree_type ON tree_type.ID = tree.TYPE_ID " +
            "  WHERE (tree.COMPANY_ID = " + companyId + " and (tree.PID " + pid + " OR tree.ID IN ( SELECT MAX(ID) FROM sys_mtree WHERE PID IN (SELECT ID FROM sys_mtree WHERE PID " + pid + ") GROUP BY PID  )) )"

        if (req.session.user.IS_SYSTEM == 1 || id) {
            var sql = " SELECT tree.ID as id , tree.PID AS value, tree.PID as parentid ,CASE WHEN tree.PID " + pid + " THEN tree.NAME ELSE 'Loading...' END AS NAME," +
                "  TYPE_ID,tree_type.TYPE_NAME, LINK_ID, URI,  LAYER, CREATE_DATE, ZORDER, tree.DESCRIPTION, tree.IS_SYSTEM, IS_LEAF, IS_DELETED FROM sys_mtree  tree " +
                "  LEFT JOIN sys_tree_type tree_type ON tree_type.ID = tree.TYPE_ID " +
                "  WHERE (tree.PID " + pid + " OR tree.ID IN ( SELECT MAX(ID) FROM sys_mtree WHERE PID IN (SELECT ID FROM sys_mtree  WHERE PID " + pid + ") GROUP BY PID  )) ";
        }
        logger.debug('获取用户Mtree资源sql:' + sql);
        query(sql, function(err, rows, columns) {
            if (err == null) {
                res.json(rows);
            } else {
                logger.error('获取用户Mtree资源错误：' + err);
            }
        });
    },
    pointList: function(req, res) {
        var search = req.query.search || +req.body.search,
            offset = +req.query.offset || +req.query.pagenum || +req.body.offset || +req.body.pagenum || 0,
            limit = +req.query.limit || +req.query.pagesize || +req.body.limit || +req.body.pagesize || 25,
            result = {
                total: +req.query.total || 0,
                rows: []
            };
        var treeID = req.body.treeID;
        if (treeID == "" || treeID == undefined) {
            treeID = 1;
        }
        var companyId = req.session.user.ENTERPRISE_ID;
        var sql = 'select ID,UUID,POINT_ID,POINT_NAME,UNIT,POINT_TYPE,DESCRIPTION,COMPRESS_TYPE from sys_point where UUID in(select UUID from sys_mtree_tags where mtree_id in(SELECT ID FROM sys_mtree WHERE URI LIKE (SELECT CONCAT(URI,"%") FROM sys_mtree  WHERE ID = ' + treeID + '))) and ENTERPRISE_ID = ' + companyId;
        logger.debug('查询点list sql：' + sql);
        query(sql, function(err, rows, columns) {
            if (rows.length != 0 && err == null) {
                result.total = rows.length;
                if (err == null) {
                    query(sql + " limit " + offset + "," + limit, function(err, rows, columns) {
                        if (err == null) {
                            result.rows = rows;
                            res.json(result);
                        }
                    });
                }
            } else {
                result.total = 0;
                res.json(result);
            }
        });
    },
    //数据库添加点信息
    addProjectPoint: function(req, res, cation) {
        var mtreeId = req.body.mtreeId;
        var company_ID = req.session.user.ENTERPRISE_ID;
        //通过mtreeId获取URI从而生成uuid
        if (mtreeId) {
            var sql = 'SELECT URI FROM sys_mtree WHERE ID = ' + mtreeId;
            logger.debug('获取URI的sql:' + sql);
            query(sql, function(err, rows, columns) {
                if (rows.length != 0 && err == null) {
                    //为实时库插入准备列名和行值
                    var cols = new Array();
                    var row = new Array();
                    var pointPN = req.body.pointPN.toUpperCase();
                    cols.push(["ID", OPAPI.TYPE.INT32]);
                    row.push(configUtils.getPointIDNext());
                    cols.push(["ND", OPAPI.TYPE.INT32]);
                    row.push(1);
                    cols.push(["UD", OPAPI.TYPE.INT64]);
                    var pointURI = rows[0].URI + '/' + pointPN;
                    var uuid = opPool.makeUUID(pointURI);
                    row.push(uuid);
                    cols.push(["PN", OPAPI.TYPE.STRING]);
                    row.push(uuid.toString());
                    var pointTN = pointPN;
                    cols.push(["TN", OPAPI.TYPE.STRING]);
                    row.push(pointTN);
                    var pointRT = req.body.pointRT;
                    cols.push(["RT", OPAPI.TYPE.INT8]);
                    row.push(pointRT);
                    cols.push(["KR", OPAPI.TYPE.STRING]);
                    row.push(company_ID);
                    var pointAN = req.body.pointAN;
                    if (pointAN) {
                        cols.push(["AN", OPAPI.TYPE.STRING]);
                        row.push(pointAN);
                    }
                    var pointFQ = req.body.pointFQ;
                    if (pointFQ) {
                        cols.push(["FQ", OPAPI.TYPE.INT16]);
                        row.push(pointFQ);
                    }
                    var pointED = req.body.pointED;
                    if (pointED) {
                        cols.push(["ED", OPAPI.TYPE.STRING]);
                        row.push(pointED);
                    } else {
                        cols.push(["ED", OPAPI.TYPE.STRING]);
                        row.push('');
                    }
                    var pointTV = req.body.pointTV;
                    if (pointTV) {
                        cols.push(["TV", OPAPI.TYPE.FLOAT]);
                        row.push(pointTV);
                    }
                    var pointBV = req.body.pointBV;
                    if (pointBV) {
                        cols.push(["BV", OPAPI.TYPE.FLOAT]);
                        row.push(pointBV);
                    }
                    var pointEU = req.body.pointEU;
                    if (pointEU) {
                        cols.push(["EU", OPAPI.TYPE.STRING]);
                        row.push(pointEU);
                    } else {
                        cols.push(["EU", OPAPI.TYPE.STRING]);
                        row.push('');
                    }
                    var pointDB = req.body.pointDB;
                    if (pointDB) {
                        cols.push(["DB", OPAPI.TYPE.FLOAT]);
                        row.push(pointDB);
                    }
                    var pointFM = req.body.pointFM;
                    if (pointFM) {
                        cols.push(["FM", OPAPI.TYPE.INT8]);
                        row.push(pointFM);
                    }
                    var pointPT = req.body.pointPT;
                    if (pointPT) {
                        cols.push(["PT", OPAPI.TYPE.INT8]);
                        row.push(pointPT);
                    }
                    var pointKT = req.body.pointKT;
                    if (pointKT) {
                        cols.push(["KT", OPAPI.TYPE.INT8]);
                        row.push(pointKT);
                    }
                    var pointEX = req.body.pointEX;
                    if (pointEX) {
                        cols.push(["EX", OPAPI.TYPE.STRING]);
                        row.push(pointEX);
                    } else {
                        cols.push(["EX", OPAPI.TYPE.STRING]);
                        row.push('');
                    }
                    var pointAP = req.body.pointAP;
                    cols.push(["AP", OPAPI.TYPE.INT8]);
                    row.push(pointAP);
                    var pointLC = req.body.pointLC;
                    if (pointLC) {
                        cols.push(["LC", OPAPI.TYPE.INT8]);
                        row.push(pointLC);
                    }
                    if (pointRT != 1) {
                        var pointH4 = req.body.pointH4;
                        if (pointH4) {
                            cols.push(["H4", OPAPI.TYPE.FLOAT]);
                            row.push(pointH4);
                        }
                        var pointH3 = req.body.pointH3;
                        if (pointH3) {
                            cols.push(["H3", OPAPI.TYPE.FLOAT]);
                            row.push(pointH3);
                        }
                        var pointZH = req.body.pointZH;
                        if (pointZH) {
                            cols.push(["ZH", OPAPI.TYPE.FLOAT]);
                            row.push(pointZH);
                        }
                        var pointHL = req.body.pointHL;
                        if (pointHL) {
                            cols.push(["HL", OPAPI.TYPE.FLOAT]);
                            row.push(pointHL);
                        }
                        var pointLL = req.body.pointLL;
                        if (pointLL) {
                            cols.push(["LL", OPAPI.TYPE.FLOAT]);
                            row.push(pointLL);
                        }
                        var pointZL = req.body.pointZL;
                        if (pointZL) {
                            cols.push(["ZL", OPAPI.TYPE.FLOAT]);
                            row.push(pointZL);
                        }
                        var pointL3 = req.body.pointL3;
                        if (pointL3) {
                            cols.push(["L3", OPAPI.TYPE.FLOAT]);
                            row.push(pointL3);
                        }
                        var pointL4 = req.body.pointL4;
                        if (pointL4) {
                            cols.push(["L4", OPAPI.TYPE.FLOAT]);
                            row.push(pointL4);
                        }

                        var C1 = req.body.C1;
                        if (C1) {
                            cols.push(["C1", OPAPI.TYPE.INT32]);
                            row.push(C1);
                        }
                        var C2 = req.body.C2;
                        if (C2) {
                            cols.push(["C2", OPAPI.TYPE.INT32]);
                            row.push(C2);
                        }
                        var C3 = req.body.C3;
                        if (C3) {
                            cols.push(["C3", OPAPI.TYPE.INT32]);
                            row.push(C3);
                        }
                        var C4 = req.body.C4;
                        if (C4) {
                            cols.push(["C4", OPAPI.TYPE.INT32]);
                            row.push(C4);
                        }
                        var C5 = req.body.C5;
                        if (C5) {
                            cols.push(["C5", OPAPI.TYPE.INT32]);
                            row.push(C5);
                        }
                        var C6 = req.body.C6;
                        if (pointFQ) {
                            cols.push(["C6", OPAPI.TYPE.INT32]);
                            row.push(C6);
                        }
                        var C7 = req.body.C7;
                        if (C7) {
                            cols.push(["C7", OPAPI.TYPE.INT32]);
                            row.push(C7);
                        }
                        var C8 = req.body.C8;
                        if (C8) {
                            cols.push(["C8", OPAPI.TYPE.INT32]);
                            row.push(C8);
                        }
                    }
                    var rows = new Array();
                    rows.push(row);
                    async.waterfall(
                        [
                            function(callback) {
                                var sql = 'select count(ID) as count from Point where PN = "' + uuid + '"';
                                logger.debug('查询点名是否存在sql:' + sql);
                                opPool.query(sql, function(err, rows) {
                                    if ((err && err.code) || rows[0].count > 0) {
                                        logger.error('获取测点信息失败：' + (JSON.stringify(err) || rows[0].count));
                                        message.flag = -1;
                                        message.message = '当前节点下，测点名已存在';
                                        res.json(message);
                                        return;
                                    } else {
                                        callback(null);
                                    }
                                });
                            },
                            function(callback) {
                                opPool.insert('Point', rows, cols, function(err, rows, columns) {
                                    logger.error(err);
                                    logger.error(rows);
                                    if (err && err.code || rows[0].EC != 0) {
                                        logger.error('插入测点错误:' + (JSON.stringify(err) || rows[0].EC));
                                        message.flag = -1;
                                        message.message = '编辑点失败';
                                        res.send(message);
                                        return;
                                    } else {
                                        console.log(rows);
                                        var pointID = rows[0].ID;
                                        callback(null, pointID);
                                    }
                                });
                            },
                            function(pointID, callback) {
                                var sqlPoint = sqlQuery.insert().into('sys_point').set({
                                    POINT_ID: pointID,
                                    UUID: uuid,
                                    POINT_NAME: pointTN,
                                    URI: pointURI,
                                    POINT_TYPE: pointRT,
                                    UNIT: pointEU,
                                    DESCRIPTION: pointED,
                                    ENTERPRISE_ID: company_ID,
                                    COMPRESS_TYPE: pointDB,
                                    CREATE_DATE: Utils.dateFormat(new Date().getTime(), Utils.yyyyMMddhhmmss)
                                }).build();
                                logger.debug('插入测点信息sql：' + sqlPoint);
                                query(sqlPoint, function(err, result) {
                                    if (err) {
                                        logger.error('插入点到关系数据库：' + err);
                                        message.flag = -1;
                                        message.message = '插入关系库点信息数据失败';
                                        res.send(message);
                                        return;
                                    } else {
                                        callback(null, result.insertId);
                                    }
                                });
                            },
                            function(insertId, callback) {
                                var sqlTag = sqlQuery.insert().into('sys_mtree_tags').set({
                                    UUID: uuid,
                                    TAG_ID: insertId,
                                    MTREE_ID: mtreeId
                                }).build();
                                logger.debug('插入测点结构信息sql：' + sqlTag);
                                query(sqlTag, function(err, result) {
                                    if (err) {
                                        message.flag = -1;
                                        message.message = '插入关系数据失败';
                                        res.send(message);
                                        return;
                                    } else {
                                        message.flag = 0
                                        res.send(message);
                                        return;
                                    }
                                });
                            }
                        ],
                        function(err) {
                            if (err) {
                                message.flag = -1;
                                mesage.message = '插入测点失败';
                                res.json(message);
                                return;
                            } else {
                                message.flag = 0;
                                res.json(message);
                                return;
                            }
                        });
                } else {
                    logger.error("uuid生成失败");
                    message.flag = -1;
                    message.message = 'uuid生成失败';
                    res.send(message);
                    return;
                }
            });
        } else {
            logger.error("mtreeId不存在");
            message.flag = -1;
            message.message = '请选择父节点';
            res.send(message);
            return;
        }
    },
    /*更新点信息*/
    updateProjectPoint: function(req, res, action) {
        var cols = new Array();
        var row = new Array();
        var pointID = req.body.pointID;
        cols.push(["ID", OPAPI.TYPE.INT32]);
        row.push(pointID);
        var pointAN = req.body.pointAN;
        if (pointAN) {
            cols.push(["AN", OPAPI.TYPE.STRING]);
            row.push(pointAN);
        }
        var pointFQ = req.body.pointFQ;
        if (pointFQ) {
            cols.push(["FQ", OPAPI.TYPE.INT16]);
            row.push(pointFQ);
        }
        var pointED = req.body.pointED;
        if (pointED) {
            cols.push(["ED", OPAPI.TYPE.STRING]);
            row.push(pointED);
        } else {
            cols.push(["ED", OPAPI.TYPE.STRING]);
            row.push('');
        }
        var pointTV = req.body.pointTV;
        if (pointTV) {
            cols.push(["TV", OPAPI.TYPE.FLOAT]);
            row.push(pointTV);
        }
        var pointBV = req.body.pointBV;
        if (pointBV) {
            cols.push(["BV", OPAPI.TYPE.FLOAT]);
            row.push(pointBV);
        }
        var pointEU = req.body.pointEU;
        if (pointEU) {
            cols.push(["EU", OPAPI.TYPE.STRING]);
            row.push(pointEU);
        } else {
            cols.push(["EU", OPAPI.TYPE.STRING]);
            row.push('');
        }
        var pointDB = req.body.pointDB;
        if (pointDB) {
            cols.push(["DB", OPAPI.TYPE.FLOAT]);
            row.push(pointDB);
        }
        var pointFM = req.body.pointFM;
        if (pointFM) {
            cols.push(["FM", OPAPI.TYPE.INT8]);
            row.push(pointFM);
        }
        var pointPT = req.body.pointPT;
        if (pointPT) {
            cols.push(["PT", OPAPI.TYPE.INT8]);
            row.push(pointPT);
        }
        var pointKT = req.body.pointKT;
        if (pointKT) {
            cols.push(["KT", OPAPI.TYPE.INT8]);
            row.push(pointKT);
        }
        var pointEX = req.body.pointEX;
        if (pointEX) {
            cols.push(["EX", OPAPI.TYPE.STRING]);
            row.push(pointEX);
        } else {
            cols.push(["EX", OPAPI.TYPE.STRING]);
            row.push('');
        }
        var pointAP = req.body.pointAP;
        if (pointAP) {
            cols.push(["AP", OPAPI.TYPE.INT8]);
            row.push(pointAP);
        }
        var pointLC = req.body.pointLC;
        if (pointLC) {
            cols.push(["LC", OPAPI.TYPE.INT8]);
            row.push(pointLC);
        }
        var pointRT = req.body.pointRT;
        if (pointRT != 1) {
            var pointH4 = req.body.pointH4;
            if (pointH4) {
                cols.push(["H4", OPAPI.TYPE.FLOAT]);
                row.push(pointH4);
            }
            var pointH3 = req.body.pointH3;
            if (pointH3) {
                cols.push(["H3", OPAPI.TYPE.FLOAT]);
                row.push(pointH3);
            }
            var pointZH = req.body.pointZH;
            if (pointZH) {
                cols.push(["ZH", OPAPI.TYPE.FLOAT]);
                row.push(pointZH);
            }
            var pointHL = req.body.pointHL;
            if (pointHL) {
                cols.push(["HL", OPAPI.TYPE.FLOAT]);
                row.push(pointHL);
            }
            var pointLL = req.body.pointLL;
            if (pointLL) {
                cols.push(["LL", OPAPI.TYPE.FLOAT]);
                row.push(pointLL);
            }
            var pointZL = req.body.pointZL;
            if (pointZL) {
                cols.push(["ZL", OPAPI.TYPE.FLOAT]);
                row.push(pointZL);
            }
            var pointL3 = req.body.pointL3;
            if (pointL3) {
                cols.push(["L3", OPAPI.TYPE.FLOAT]);
                row.push(pointL3);
            }
            var pointL4 = req.body.pointL4;
            if (pointL4) {
                cols.push(["L4", OPAPI.TYPE.FLOAT]);
                row.push(pointL4);
            }

            var C1 = req.body.C1;
            if (C1) {
                cols.push(["C1", OPAPI.TYPE.INT32]);
                row.push(C1);
            }
            var C2 = req.body.C2;
            if (C2) {
                cols.push(["C2", OPAPI.TYPE.INT32]);
                row.push(C2);
            }
            var C3 = req.body.C3;
            if (C3) {
                cols.push(["C3", OPAPI.TYPE.INT32]);
                row.push(C3);
            }
            var C4 = req.body.C4;
            if (C4) {
                cols.push(["C4", OPAPI.TYPE.INT32]);
                row.push(C4);
            }
            var C5 = req.body.C5;
            if (C5) {
                cols.push(["C5", OPAPI.TYPE.INT32]);
                row.push(C5);
            }
            var C6 = req.body.C6;
            if (pointFQ) {
                cols.push(["C6", OPAPI.TYPE.INT32]);
                row.push(C6);
            }
            var C7 = req.body.C7;
            if (C7) {
                cols.push(["C7", OPAPI.TYPE.INT32]);
                row.push(C7);
            }
            var C8 = req.body.C8;
            if (C8) {
                cols.push(["C8", OPAPI.TYPE.INT32]);
                row.push(C8);
            }
        }
        var uuid = req.body.UUID;
        var rows = new Array();
        rows.push(row);
        async.waterfall(
            [
                function(callback) {
                    opPool.update('Point', rows, cols, function(error, rows, columns) {
                        if ((error && error.code) || rows[0].EC != 0) {
                            logger.error('编辑测点信息错误：' + JSON.stringify(error));
                            message.flag = -1;
                            message.message = '编辑点失败';
                            res.send(message);
                            return;
                        } else {
                            callback(null);
                        }
                    });
                },
                function(callback) {
                    var sqlPoint = sqlQuery.update().into('sys_point').set({
                        DESCRIPTION: pointED,
                        COMPRESS_TYPE: pointRT,
                        UPDATE_DATE: Utils.dateFormat(new Date().getTime(), Utils.yyyyMMddhhmmss)
                    }).where({ UUID: uuid }).build();
                    query(sqlPoint, function(perr, result) {
                        logger.debug('更新point表sql:' + sqlPoint);
                        if (perr) {
                            message.flag = -1;
                            message.message = '插入数据失败';
                            res.send(message);
                            return;
                        } else {
                            message.flag = 0;
                            res.send(message);
                            return;
                        }
                    });
                }

            ],
            function(err) {
                if (err) {
                    message.flag = -1;
                    mesage.message = '更新测点失败';
                    res.json(message);
                    return;
                } else {
                    message.flag = 0;
                    res.json(message);
                    return;
                }
            });

    },
    //根据ID获取点信息
    getPointInfo: function(req, res, action) {
        var pointID = req.body.pointID;
        var sql = 'select ID,UD,TN,RT,ED,FQ,FM,TV,BV,EU,DB,EX,PT,KT,AP,LC,H4,H3,ZH,HL,LL,ZL,L3,L4,CT from Point where ID = \'' + pointID + '\'';
        logger.debug('获取测点信息sql：' + sql);
        opPool.query(sql, function(error, rows, columns) {
            if (error && error.code) {
                logger.error('获取测点信息失败：' + JSON.stringify(error))
                message.flag = -1;
                message.message = '编辑点失败';
                res.send(message);
                return;
            } else {
                message.flag = 0;
                message.data = rows;
                res.send(message);
                return;
            }
        });
    },
    //删除点
    removePoint: function(req, res, action) {
        var id = req.body.id;
        var UUID = req.body.UUID;
        var pointID = req.body.pointID;
        if (id && pointID) {
            var names = new Array();
            names.push(parseInt(pointID));
            async.waterfall(
                [
                    function(callback) {
                        opPool.remove('Point', 'ID', names, function(error, rows) {
                            if (error && error.code) {
                                logger.error('删除实时库测点错误:' + JSON.stringify(error));
                                message.flag = -1;
                                message.message = '删除点失败';
                                res.send(message);
                                return;
                            } else {
                                callback(null);
                            }
                        });
                    },
                    function(callback) {
                        var deleteTag = sqlQuery.remove().from('sys_mtree_tags').where({ UUID: UUID }).build();
                        logger.debug('删除sql:' + deleteTag);
                        query(deleteTag, function(perr, result) {
                            if (perr) {
                                logger.error('删除实时库测点错误:' + perr);
                                message.flag = -1;
                                message.message = '删除点失败';
                                res.send(message);
                            } else {
                                callback(null);
                            }
                        });
                    },
                    function(callback) {
                        var sql = sqlQuery.remove().from('sys_point').where({ UUID: UUID }).build();
                        logger.debug('删除sql:' + sql);
                        query(sql, function(cerr, result) {
                            if (cerr) {
                                logger.error('删除实时库测点错误:' + cerr);
                                message.flag = -1;
                                message.message = '删除点失败';
                                res.send(message);
                            } else {
                                message.flag = 0;
                                res.send(message);
                                return;
                            }
                        });
                    }
                ],
                function(err) {
                    if (err) {
                        message.flag = -1;
                        mesage.message = '删除点失败';
                        message.data = null;
                        res.json(message);
                        return;
                    } else {
                        message.flag = 0;
                        message.message = 'OK';
                        message.data = null;
                        res.json(message);
                        return;
                    }
                });

        } else {
            message.flag = -1;
            message.message = '请选择点';
            res.send(message);
        }
    },
    //批量删除点
    batchRemove_point: function(req, res, action) {
        var ids = req.body.ids;
        var UUIDs = req.body.UUIDs;
        if (ids) {
            //idsRemove 需要为整型数组，如[1008,1009]
            var idsRemoveStrArr = ids.split(','); //分割成字符串数组
            var idsRemoveIntArr = []; //保存转换后的整型字符串
            idsRemoveStrArr.forEach(function(data, index, arr) {
                idsRemoveIntArr.push(+data);
            });
            UUIDs = UUIDs.split(',');
            async.waterfall(
                [
                    function(callback) {
                        opPool.remove('Point', 'ID', idsRemoveIntArr, function(error, rows) {
                            if (error) {
                                message.flag = -1;
                                message.message = '删除点失败';
                                res.send(message);
                                return;
                            } else {
                                callback(null);
                            }
                        });
                    },
                    function(callback) {
                        var deleteTag = sqlQuery.remove().from('sys_mtree_tags').where({ UUID: UUIDs }).build();
                        logger.debug('删除Mtree  中测信息:' + deleteTag);
                        query(deleteTag, function(perr, result) {
                            if (perr) {
                                message.flag = -1;
                                message.message = '删除点失败';
                                res.send(message);
                            } else {
                                callback(null);
                            }
                        });
                    },
                    function(callback) {
                        var sql = sqlQuery.remove().from('sys_point').where({ UUID: UUIDs }).build();
                        query(sql, function(cerr, result) {
                            if (cerr) {
                                message.flag = -1;
                                message.message = '删除点失败';
                                res.send(message);
                            } else {
                                message.flag = 0;
                                res.send(message);
                                return;
                            }
                        });
                    }
                ],
                function(err) {
                    if (err) {
                        message.flag = -1;
                        mesage.message = '删除点失败';
                        res.json(message);
                        return;
                    } else {
                        message.flag = 0;
                        res.json(message);
                        return;
                    }
                });
        } else {
            message.flag = -1;
            message.message = '请选择点';
            res.send(message);
        }
    },
    /*通过文件导入进行批量插入*/
    importFile: function(req, res, action) {
        var form = new formidable.IncomingForm(); //创建上传表单
        form.encoding = 'utf-8'; //设置编辑
        form.uploadDir = './public/upload/'; //设置上传目录
        form.keepExtensions = true; //保留后缀
        form.maxFieldsSize = 2 * 1024 * 1024; //文件大小
        form.parse(req, function(err, fields, files) {
            if (err) {
                logger.error(err);
            }
            var filename = files.resource.name;
            var mtreeId = fields.mtreeId;
            // 对文件名进行处理，以应对上传同名文件的情况
            var nameArray = filename.split('.');
            var type = nameArray[nameArray.length - 1];
            var name = '';
            for (var i = 0; i < nameArray.length - 1; i++) {
                name = name + nameArray[i];
            }
            var rand = Math.random() * 100 + 900;
            var num = parseInt(rand, 10);

            var avatarName = name + num + '.' + type;
            var newPath = form.uploadDir + avatarName;
            fs.renameSync(files.resource.path, newPath); //重命名
            var data = xlsx.parse("./" + newPath);
            /*
             *TODO   解析json到对应数据库表里的字段
             */
            var data = data[0]['data'];
            var sheetNum = data.length;
            var titles = data[0];
            var titleSize = titles.length;
            var cols = new Array();
            var containID = false;
            var company_ID = req.session.user.ENTERPRISE_ID;
            var pnIndex = -1;
            cols.push(["KR", OPAPI.TYPE.STRING]);
            for (var i = 0; i < titleSize; i++) {
                var title = titles[i];
                switch (title) {
                    case 'ID':
                        cols.push(["ID", OPAPI.TYPE.INT32]);
                        containID = true;
                        break;
                    case 'PN':
                        cols.push(["PN", OPAPI.TYPE.STRING]);
                        cols.push(["TN", OPAPI.TYPE.STRING]);
                        pnIndex = i;
                        break;
                    case 'AN':
                        cols.push(["AN", OPAPI.TYPE.STRING]);
                        break;
                    case 'RT':
                        cols.push(["RT", OPAPI.TYPE.INT8]);
                        break;
                    case 'FQ':
                        cols.push(["FQ", OPAPI.TYPE.INT16]);
                        break;
                    case 'ED':
                        cols.push(["ED", OPAPI.TYPE.STRING]);
                        break;
                    case 'TV':
                        cols.push(["TV", OPAPI.TYPE.FLOAT]);
                        break;
                    case 'BV':
                        cols.push(["BV", OPAPI.TYPE.FLOAT]);
                        break;
                    case 'EU':
                        cols.push(["EU", OPAPI.TYPE.STRING]);
                        break;
                    case 'DB':
                        cols.push(["DB", OPAPI.TYPE.FLOAT]);
                        break;
                    case 'FM':
                        cols.push(["FM", OPAPI.TYPE.INT16]);
                        break;
                    case 'PT':
                        cols.push(["PT", OPAPI.TYPE.INT8]);
                        break;
                    case 'KT':
                        cols.push(["KT", OPAPI.TYPE.INT8]);
                        break;
                    case 'EX':
                        cols.push(["EX", OPAPI.TYPE.STRING]);
                        break;
                    case 'AP':
                        cols.push(["AP", OPAPI.TYPE.INT8]);
                        break;
                    case 'LC':
                        cols.push(["LC", OPAPI.TYPE.INT8]);
                        break;
                    case 'H4':
                        cols.push(["H4", OPAPI.TYPE.FLOAT]);
                        break;
                    case 'H3':
                        cols.push(["H3", OPAPI.TYPE.FLOAT]);
                        break;
                    case 'ZH':
                        cols.push(["ZH", OPAPI.TYPE.FLOAT]);
                        break;
                    case 'HL':
                        cols.push(["HL", OPAPI.TYPE.FLOAT]);
                        break;
                    case 'LL':
                        cols.push(["LL", OPAPI.TYPE.FLOAT]);
                        break;
                    case 'ZL':
                        cols.push(["ZL", OPAPI.TYPE.FLOAT]);
                        break;
                    case 'L3':
                        cols.push(["L3", OPAPI.TYPE.FLOAT]);
                        break;
                    case 'L4':
                        cols.push(["L4", OPAPI.TYPE.FLOAT]);
                        break;
                    case 'C1':
                        cols.push(["C1", OPAPI.TYPE.INT32]);
                        break;
                    case 'C2':
                        cols.push(["C2", OPAPI.TYPE.INT32]);
                        break;
                    case 'C3':
                        cols.push(["C3", OPAPI.TYPE.INT32]);
                        break;
                    case 'C4':
                        cols.push(["C4", OPAPI.TYPE.INT32]);
                        break;
                    case 'C5':
                        cols.push(["C5", OPAPI.TYPE.INT32]);
                        break;
                    case 'C6':
                        cols.push(["C6", OPAPI.TYPE.INT32]);
                        break;
                    case 'C7':
                        cols.push(["C7", OPAPI.TYPE.INT32]);
                        break;
                    case 'C8':
                        cols.push(["C8", OPAPI.TYPE.INT32]);
                        break;
                }
            }

            var rows = new Array();
            var pointID = configUtils.getPointIDNext(sheetNum - 1);
            //准备uuid列表
            cols.unshift(["UD", OPAPI.TYPE.INT64]);
            var uuids = new Array(); //记录uuid列表，为后续关系库插入所准备
            var tns = new Array(); //记录pointName为插入关系表sys_point准备
            var uris = new Array(); //记录pointURI为插入关系表sys_point准备
            //通过mtreeId获取URI从而生成uuid
            if (pnIndex < 0) {
                message.flag = -1;
                message.message = '缺少PN关键字段';
                res.send(message);
                return;
            }
            if (mtreeId) {
                async.waterfall([
                    function(callback) {
                        var sql = 'SELECT URI FROM sys_mtree WHERE ID = ' + mtreeId;
                        query(sql, function(merr, mRows, mColumns) {
                            if (mRows.length != 0 && err == null) {
                                if (!containID) {
                                    cols.unshift(["ID", OPAPI.TYPE.INT32]);
                                }
                                for (var j = 1; j < sheetNum; j++) {
                                    uris.push(mRows[0].URI + '/' + data[j][pnIndex]);
                                    var uuid = opPool.makeUUID(mRows[0].URI + '/' + data[j][pnIndex]);
                                    uuids.push(uuid);
                                    var row = new Array();
                                    for (var t = 0; t < titleSize; t++) {
                                        if (pnIndex == t) {
                                            row.push(uuid); //pn
                                            tns.push(data[j][t]); //记录pointName为插入关系表sys_point准备
                                        }
                                        row.push(data[j][t]);
                                    }
                                    row.unshift(company_ID);
                                    row.unshift(uuid);
                                    if (!containID) {
                                        row.unshift(pointID + j - 1);
                                    }
                                    rows.push(row);
                                }
                                callback(null, rows, cols);
                            }
                        });
                    },
                    function(rows, cols, callback) {
                        opPool.insert('Point', rows, cols, function(error, rows, columns) {
                            if (error) {
                                message.flag = -1;
                                message.message = '插入点失败';
                                res.send(message);
                                return;
                            } else {
                                callback(null, rows);
                            }
                        });
                    },
                    function(rows, callback) {
                        var idStart = -1;
                        var idEnd = -1;
                        var size = rows.length;
                        if (size) {
                            idStart = rows[0].ID;
                            idEnd = rows[size - 1].ID;
                        }
                        var sqlPoint = 'select ID,PN,ED,EU,RT,DB from point where ID >= ' + idStart + ' and ID <= ' + idEnd;
                        logger.debug('查询实时库point表sql为：' + sqlPoint);
                        opPool.query(sqlPoint, function(perr, rows, columns) {
                            if (perr) {
                                message.flag = -1;
                                message.message = '获取数据实时数据失败';
                                res.send(message);
                                return;
                            } else {
                                callback(null, rows);
                            }
                        });
                    },
                    function(rows, callback) {
                        var sqlPoints = 'insert into sys_point (`POINT_ID`, `UUID`, `URI`, `DB_ID`, `POINT_NAME`, `UNIT`, `POINT_TYPE`,`DESCRIPTION`,`COMPRESS_TYPE`,`CREATE_DATE`,`ENTERPRISE_ID`)';
                        var sqlValue = '';
                        var size = rows.length;
                        for (var i = 0; i < size; i++) {
                            var row = rows[i];
                            row.MTREEID = mtreeId;
                            sqlValue += '(';
                            sqlValue += row.ID + ',';
                            sqlValue += '\'' + uuids[i] + '\',';
                            sqlValue += '\'' + uris[i] + '\',';
                            sqlValue += 1 + ',';
                            sqlValue += '\'' + tns[i] + '\',';
                            sqlValue += '\'' + row.EU + '\',';
                            sqlValue += row.RT + ',';
                            sqlValue += '\'' + row.ED + '\',';
                            sqlValue += row.DB + ',';
                            sqlValue += '\'' + Utils.dateFormat(new Date().getTime(), Utils.yyyyMMddhhmmss) + '\',';
                            sqlValue += company_ID;
                            sqlValue += ')';
                            if (rows[i + 1]) {
                                sqlValue += ',';
                            }
                        }
                        if (!sqlValue) {
                            message.flag = -1;
                            message.message = '没有获取到数据';
                            res.send(message);
                            return;
                        }
                        sqlPoints += ' values ' + sqlValue;
                        logger.debug('批量插入关系库sql为:' + sqlPoints);
                        query(sqlPoints, function(perr, result, columns) {
                            if (perr) {
                                logger.error('插入测点到关系库错误：' + perr);
                                message.flag = -1;
                                message.message = '插入点信息失败';
                                res.send(message);
                                return;
                            }
                            callback(null, rows, result);
                        });
                    },
                    function(rows, result, callback) {
                        var sqlTag = 'insert into sys_mtree_tags (`uuid`, `TAG_ID`, `MTREE_ID`)';
                        var sqlValue = '';
                        var size = rows.length;
                        for (var i = 0; i < size; i++) {
                            var row = rows[i];
                            var idtemp = result.insertId + i; //批量插入的时候，insertId只是最前面的一个
                            sqlValue += '(';
                            sqlValue += '\'' + uuids[i] + '\',';
                            sqlValue += idtemp + ',';
                            sqlValue += row.MTREEID;
                            sqlValue += ')';
                            if (rows[i + 1]) {
                                sqlValue += ',';
                            }
                        }
                        if (!sqlValue) {
                            message.flag = -1;
                            message.message = '没有获取到数据';
                            res.send(message);
                            return;
                        }
                        sqlTag += ' values ' + sqlValue;
                        logger.debug('批量插入关系库sql为：' + sqlTag);
                        query(sqlTag, function(cerr, result) {
                            if (cerr) {
                                message.flag = -1;
                                message.message = '插入数据';
                                res.send(message);
                                return;
                            } else {
                                message.flag = 0
                                res.send(message);
                                return;
                            }
                        });
                    }
                ], function(err, result) {
                    if (err) {
                        message.flag = -1;
                        mesage.message = '批量插入点失败';
                        res.json(message);
                        return;
                    } else {
                        message.flag = 0;
                        res.json(message);
                        return;
                    }
                });

            } else {
                logger.error("mtreeId不存在");
                message.flag = -1;
                message.message = '请选择父节点';
                res.send(message);
                return;
            }

        });
    },

    //获取点组信息
    pointGroupList: function(req, res, action) {
        var companyId = req.session.user.ENTERPRISE_ID;
        var sql = 'select ID, GROUP_NAME from sys_point_group where COMPANY_ID = ' + companyId;
        query(sql, function(err, rows, columns) {
            if (err) {
                message.flag = -1;
                message.message = '获取点组信息失败';
                message.data = null;
                res.send(message);
                return;
            } else {
                message.flag = 0;
                message.message = '获取点组信息成功';
                message.data = rows;
                res.send(message);
                return;
            }
        });
    },
    //添加到点组
    addPointToGroup: function(req, res, action) {
        var pointId = req.body.pointId;
        var pointName = req.body.pointName;
        var groupId = req.body.groupId;
        var groupName = req.body.groupName;

        async.waterfall([
            //检查是否已经添加到该组
            function(callback) {
                var sqlCount = 'select count(GROUP_ID) tempSum from sys_group_point where GROUP_ID = ' + groupId + ' and POINT_ID = ' + pointId;
                console.log(sqlCount);
                query(sqlCount, function(err, rows, columns) {
                    if (err) {
                        message.flag = -1;
                        message.message = '查询是否存在该点失败';
                        message.data = null;
                        res.send(message);
                        return;
                    } else {
                        if (rows[0].tempSum == 0) {
                            callback(null);
                        } else {
                            callback('测点在' + groupName + '中已经存在');
                        }
                    }
                });
            },
            //上一步通过，不存在，进行添加
            function(callback) {
                var sql = 'insert into sys_group_point (GROUP_ID,POINT_ID,POINT_NAME,CREATE_DATE)' +
                    ' values (' + groupId + ',' + pointId + ',"' + pointName + '","' + Utils.dateFormat(new Date().getTime(), Utils.yyyyMMddhhmmss) + '")';
                query(sql, function(err, rows, columns) {
                    if (err || (rows.affectedRows <= 0)) {
                        message.flag = -1;
                        message.message = '添加失败';
                        message.data = null;
                        res.send(message);
                        return;
                    } else {
                        message.flag = 0;
                        message.message = '添加成功';
                        message.data = rows;
                        res.send(message);
                        return;
                    }
                });
            }
        ], function(err) {
            message.flag = -1;
            message.message = err;
            res.json(message);
            return;
        });
    }
};

module.exports = domain_manage;

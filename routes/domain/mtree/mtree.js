var actionUtil = require("../../framework/action/actionUtils")();
var transaction = actionUtil.transaction;
var query = actionUtil.query;
var async = require("async");
var Utils = require('../../utils/tools/utils');
var configUtils = require('../../utils/tools/configUtils');
var OPAPI = require('opapi');
var opPool = require('../../openplant/openPlantPool');
var xlsx = require("node-xlsx");
var formidable = require('formidable');
var fs = require('fs');
var GlobalAgent = require('../../message/GlobalAgent');
var querystring = require('querystring');

var UUID = require('node-uuid');

var sql = require('sql-query');
var sqlQuery = sql.Query();
var logger = require('log4js').getLogger('system');

function URIUtils(URI, Name) {
    return (URI == "/" ? "" : URI) + "/" + Name;
};

var message = {
    flag: 0,
    message: '成功',
    data: null
}

var domainManage = {
    canAdd: function (req, res) {
        var userId = req.session.user.USER_ID;
        var id = req.body.id;
        if (!id) {
            message.flag = -1;
            message.message = '请选择节点';
            message.data = null;
            res.json(message);
            return;
        }
        var sql = 'select DOMAIN_ID from sys_mtree where IS_DELETED = 0 and ID =' + id;
        logger.debug('创建节点获取节点信息sql：' + sql);
        query(sql, function (err, rows) {
            if (err) {
                logger.debug('获取MTree信息错误：' + err);
                message.flag = -1;
                message.message = '获取节点信息失败';
                message.data = null;
                res.json(message);
                return;
            } else if (rows && rows.length < 1) {
                message.flag = -1;
                message.message = '当前节点不存在';
                message.data = null;
                res.json(message);
                return;
            } else {
                var domainId = GlobalAgent.getUserDomain(userId);
                if (domainId.indexOf(rows[0].DOMAIN_ID) > -1) {
                    message.flag = 0;
                    message.message = 'OK';
                    message.data = null;
                    res.json(message);
                    return;
                } else {
                    message.flag = -1;
                    message.message = '该节点你没有操作权限';
                    message.data = null;
                    res.json(message);
                    return;
                }
            }
        });
    },
    //创建对象
    createMTree: function (req, res, action) {
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
            COMPANY_ID: companyId,
            MTREE_SOURCE: 2,
            CREATE_DATE: Utils.dateFormat(new Date().getTime(), Utils.yyyyMMddhhmmss)
        };
        var userId = req.session.user.USER_ID;
        if (NAME != undefined && NAME != null && NAME != "") {
            var URL = "";
            if (PID != null) {
                async.waterfall(
                    [
                        function (callback) {
                            var sql = 'select count(ID) as count from sys_mtree where PID  = ' + PID + ' and name ="' + NAME + '"';
                            logger.debug('获取当前节点下是否有相同名称的节点sql:' + sql);
                            query(sql, function (err, rows) {
                                if (err) {
                                    logger.error('统计节点信息错误：' + err);
                                    message.flag = -1;
                                    message.data = null;
                                    message.message = '创建出错';
                                    res.json(message);
                                    return;
                                } else {
                                    if (rows[0].count > 0) {
                                        message.flag = -1;
                                        message.data = null;
                                        message.message = '父节点下存在同名节点';
                                        res.json(message);
                                        return;
                                    }
                                    callback(null);
                                }
                            });
                        },
                        function (callback) {
                            var sql = sqlQuery.select().from('sys_mtree').select("ID", "URI", "DOMAIN_ID", "MTREE_SOURCE").where({
                                ID: PID
                            }).limit(1).build();
                            logger.debug('查询上级节点信息sql:' + sql);
                            query(sql, function (err, rows) {
                                if (err) {
                                    logger.error('查询上级节点错误：' + err);
                                    message.flag = -1;
                                    message.message = '查询上级节点失败';
                                    message.data = null;
                                    res.json(message);
                                    return;
                                } else {
                                    var domainId = rows[0].DOMAIN_ID;
                                    if (GlobalAgent.getUserDomain(userId).indexOf(domainId) < 0) {
                                        message.flag = -1;
                                        message.message = '您没有在该节点下创建节点的权限';
                                        message.data = null;
                                        res.json(message);
                                        return;
                                    }

                                    data.URI = URIUtils(rows[0].URI, NAME);
                                    data.DOMAIN_ID = domainId;
                                    callback(null, rows[0]);
                                }
                            });
                        },
                        function (row, callback) {
                            if (row.MTREE_SOURCE != 1) {
                                callback(null);
                            } else {
                                var sql = 'select count(DOMAIN_ID) as count from sys_domain where is_deleted =0 and pre_domain_id = ' + row.DOMAIN_ID + ' and name ="' + NAME + '"';
                                logger.debug('获取当前节点所属域下的子域信息sql:' + sql);
                                query(sql, function (err, rows) {
                                    if (err) {
                                        logger.error('当前节点所属域下的子域信息错误：' + err);
                                        message.flag = -1;
                                        message.data = null;
                                        message.message = '查询子域出错';
                                        res.json(message);
                                        return;
                                    } else {
                                        if (rows[0].count > 0) {
                                            message.flag = -1;
                                            message.data = null;
                                            message.message = '当前节点所属域下存在同名的子域';
                                            res.json(message);
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
                                    message.message = 'OK';
                                    message.data = result.insertId;
                                    res.json(message);
                                    return;
                                } else {
                                    logger.error('创建节点错误：' + err);
                                    message.flag = -1;
                                    message.message = '创建节点出错';
                                    message.data = null;
                                    res.json(message);
                                    return;
                                }
                            });
                        }
                    ],
                    function (err, rows) {
                        if (err) {
                            logger.error('统计节点信息错误：' + err);
                            message.flag = -1;
                            message.data = null;
                            message.message = '创建出错';
                            res.json(message);
                            return;
                        } else {
                            message.flag = 0;
                            message.data = null;
                            message.message = 'OK';
                            res.json(message);
                            return;
                        }
                    }
                )
            }
        } else {
            return res.redirect("/");
        }
    }
    ,
//获取MTREE信息
    getMTree: function (req, res, action) {
        var mtreeID = req.body.mtreeID;
        var sql = 'select id,name ,description from sys_mtree where id = ' + mtreeID;
        logger.debug('获取MTree信息sql:' + sql);
        query(sql, function (err, rows) {
            if (err) {
                logger.error('获取MTree数据信息错误：' + err);
                message.flag = -1;
                message.message = '获取MTree数据信息失败';
                message.data = null;
                res.json(message);
            } else if (rows.length < 1) {
                message.flag = -1;
                message.message = '不存在该节点';
                message.data = null;
                res.json(message);
            } else {
                message.flag = 0;
                message.message = 'OK';
                message.data = rows[0];
                res.json(message);
            }
        });
    },
    //更新MTree信息
    updateMTree: function (req, res, action) {
        var mtreeID = req.body.mtreeID;
        var mtreeDesc = req.body.mtreeDesc;
        var sql = 'update sys_mtree set description = "' + mtreeDesc + '" where id = ' + mtreeID;
        logger.debug('更新MTree信息sql:' + sql);
        query(sql, function (err, rows) {
            if (err) {
                logger.error('更新MTree数据信息错误：' + err);
                message.flag = -1;
                message.message = '更新MTree数据信息失败';
                message.data = null;
                res.json(message);
            } else {
                message.flag = 0;
                message.message = 'OK';
                res.json(message);
            }
        });
    },
    //删除节点
    removeMTree: function (req, res, action) {
        var treeID = req.body.treeId;
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
                                var sql = 'select PID,MTREE_SOURCE from sys_mtree where ID =' + treeID;
                                logger.debug('获取是否是域节点 sql:' + sql)
                                conn.query(sql, function (err, rows) {
                                    if (err) {
                                        logger.error('获取是否是域节点错误：' + err);
                                        message.flag = -1;
                                        message.message = '获取是否是域节点失败';
                                        message.data = null;
                                        res.json(message);
                                        return;
                                    } else if (rows && rows.length == 1) {
                                        if (rows[0].MTREE_SOURCE == 1) {
                                            message.flag = -1;
                                            message.message = '域节点不允许删除';
                                            message.data = null;
                                            res.json(message);
                                            return;
                                        }
                                        if (rows[0].MTREE_SOURCE == 3 || rows[0].MTREE_SOURCE == 4) {
                                            message.flag = -1;
                                            message.message = '盒子和采集节点不允许删除';
                                            message.data = null;
                                            res.json(message);
                                            return;
                                        }
                                        if (!rows[0].PID) {
                                            message.flag = -1;
                                            message.message = '根节点不允许删除';
                                            message.data = null;
                                            res.json(message);
                                            return;
                                        }
                                        callback(null);
                                    } else {
                                        message.flag = -1;
                                        message.message = '请选择节点';
                                        message.data = null;
                                        res.json(message);
                                        return;
                                    }
                                });
                            },
                            function (callback) {
                                var sqlIds = 'select UUID as uuid,POINT_ID as id from sys_point where URI LIKE (SELECT CONCAT(URI,"/%") FROM sys_mtree  WHERE ID = ' + treeID + ')';
                                logger.debug('获取对应MTree下面的点ID sql:' + sqlIds)
                                conn.query(sqlIds, function (err, rows) {
                                    if (err) {
                                        logger.error('获取对应Mtree下面的点ID错误：' + (err || rows.length));
                                        message.flag = -1;
                                        message.message = '获取点数据信息失败';
                                        message.data = null;
                                        res.json(message);
                                        return;
                                    } else {
                                        var size = rows.length;
                                        var ids = [];
                                        var uuids = [];
                                        for (var i = 0; i < size; i++) {
                                            ids.push(rows[i].id);
                                            uuids.push(rows[i].uuid);
                                        }
                                        callback(null, ids, uuids);
                                    }
                                });
                            },
                            function (ids, uuids, callback) {
                                if (ids && ids.length > 0) {
                                    opPool.remove('Point', 'ID', ids, function (error, rows) {
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
                            function (uuids, callback) {
                                if (uuids && uuids.length > 0) {
                                    var sql = sqlQuery.remove().from('sys_point').where({
                                        UUID: uuids
                                    }).build();
                                    logger.debug('删除关系库中点信息sql:' + sql);
                                    conn.query(sql, function (cerr, result) {
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
                            function (callback) {
                                var sql = 'DELETE FROM sys_mtree WHERE ID = ' + treeID + ' or ID IN (select ID from (SELECT ID FROM sys_mtree WHERE URI LIKE (SELECT CONCAT(URI, "/%") FROM sys_mtree WHERE ID = ' + treeID + '))t)'
                                logger.debug('删除MTree sql :' + sql);
                                conn.query(sql, function (cerr, result) {
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
                        function (err, rows) {
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
        } catch (e) {
            logger.error('重命名节点出现异常：' + e);
            message.flag = -1;
            message.message = "操作失败";
            res.json(message);
        }
    }
    ,
    /**
     * 拖拽节点
     */
    dragMTree: function (req, res, action) {
        var sourceID = req.body.sourceID;
        var targetID = req.body.targetID;
        var dropPosition = req.body.dropPosition;
        var orderId = req.body.orderId;
        var user = req.session.user;
        if (sourceID == targetID) {
            message.flag = -1;
            message.data = null;
            message.message = '目标节点不能是自己及其子节点';
            res.json(message);
            return;
        }
        try {
            transaction(function (err, connection) {
                if (err) {
                    logger.error('拖拽节点失败：' + err);
                    message.flag = -1;
                    message.message = "操作失败";
                    res.json(message);
                    return;
                } else {
                    var sql = 'select ID,URI,PID,NAME,DOMAIN_ID from sys_mtree where ID in (' + sourceID + ',' + targetID + ')';
                    logger.debug('获取源节点和目标节点数据sql:' + sql);
                    connection.query(sql, function (err, rows) {
                        if (err) {
                            logger.error('获取源节点和目标节点数据错误：' + err);
                            message.flag = -1;
                            message.data = null;
                            message.message = '拖拽错误';
                            res.json(message);
                            return;
                        } else {
                            if (!rows || rows.length != 2) {
                                logger.error('获取源节点和目标节点数据错误：' + (err || rows.length));
                                message.flag = -1;
                                message.data = null;
                                message.message = '拖拽错误';
                                res.json(message);
                                return;
                            } else {
                                var sourceRow, targetRow;
                                if (rows[0].ID == sourceID) {
                                    sourceRow = rows[0];
                                    targetRow = rows[1];
                                } else {
                                    sourceRow = rows[1];
                                    targetRow = rows[0];
                                }
                                var domainIds = GlobalAgent.getUserDomain(user.USER_ID);
                                if (domainIds.indexOf(sourceRow.DOMAIN_ID) < 0 || domainIds.indexOf(targetRow.DOMAIN_ID) < 0) {
                                    message.flag = -1;
                                    message.data = null;
                                    message.message = '节点拖拽需要在两个有权限的节点';
                                    res.json(message);
                                    return;
                                }
                                var adminDomainIds = GlobalAgent.getAdminUserDomain(user.USER_ID);
                                if (sourceRow.DOMAIN_ID != targetRow.DOMAIN_ID && (adminDomainIds.indexOf(sourceRow.DOMAIN_ID) < 0 || adminDomainIds.indexOf(targetRow.DOMAIN_ID) < 0)) {
                                    message.flag = -1;
                                    message.data = null;
                                    message.message = '您不具有此两个节点的管理员权限';
                                    res.json(message);
                                    return;
                                }
                                var newName = sourceRow.NAME;
                                //如果拖动的节点只是位置移动，更新orderCode就可以了，如果不是则类似于剪切功能，需要判断重名信息
                                if (sourceRow.PID == targetRow.ID) {
                                    async.waterfall([
                                        function (callback) {
                                            var sql = 'select ID,URI,PID,NAME,ORDER_CODE from sys_mtree where PID =' + targetID + ' order by ORDER_CODE,ID';
                                            logger.debug('获取对应目标节点下面的所有节点信息sql:' + sql);
                                            connection.query(sql, function (err, rows) {
                                                if (err || rows.length < 0) {
                                                    logger.error('拖动节点错误：' + (err || rows.length));
                                                    message.flag = -1;
                                                    message.data = null;
                                                    message.message = '拖拽错误';
                                                    res.json(message);
                                                    return;
                                                }
                                                callback(null, rows);
                                            });
                                        },
                                        function (rows, callback) {
                                            var orderIndex = 0;
                                            var preIndex = 0;
                                            var size = rows.length;
                                            if (size == 1) {
                                                message.flag = 0;
                                                message.data = null;
                                                message.message = 'OK';
                                                res.json(message);
                                                return;
                                            }
                                            //找到目标位置
                                            var s_Row = {};
                                            for (var i = 0; i < size; i++) {
                                                var row = rows[i];
                                                if (row.ID == orderId) {
                                                    orderIndex = i;
                                                }
                                                if (row.ID == sourceID) {
                                                    s_Row = row;
                                                }
                                            }
                                            //获取需要更新的节点
                                            var rrs = [];
                                            if (dropPosition == 'before') {
                                                preIndex = orderIndex - 1;
                                                rrs = rows.slice(orderIndex);
                                            } else {
                                                preIndex = orderIndex;
                                                rrs = rows.slice(orderIndex + 1);
                                            }
                                            //移除移动节点
                                            var rs = [];
                                            for (var i in rrs) {
                                                var row = rrs[i];
                                                if (row.ID != sourceID) {
                                                    rs.push(row);
                                                }
                                            }
                                            //加上移动节点
                                            rs.unshift(s_Row);
                                            var beginCode = 0;
                                            if (preIndex > -1) {
                                                beginCode = rows[preIndex].ORDER_CODE + 1;
                                            }
                                            //设置节点 orderCode
                                            for (var j in rs) {
                                                var row = rs[j];
                                                row.ORDER_CODE = beginCode++;
                                                rs[j] = row;
                                            }
                                            callback(null, rs);
                                        },
                                        function (rows, callback) {
                                            var sqlOrderCode = '',
                                                sqlIDs = '';
                                            var size = rows.length;
                                            for (var i = 0; i < size; i++) {
                                                var row = rows[i];
                                                sqlOrderCode += ' when ' + row.ID + ' then ' + row.ORDER_CODE;
                                                sqlIDs += '"' + row.ID + '"';
                                                if (rows[i + 1]) {
                                                    sqlIDs += ',';
                                                }
                                            }
                                            var sql = 'update sys_mtree set ORDER_CODE = case ID ' + sqlOrderCode + ' end  where ID in( ' + sqlIDs + ')';
                                            logger.debug('拖拽节点更新ORDERCODE sql:' + sql);
                                            connection.query(sql, function (err, rows) {
                                                if (err) {
                                                    logger.error('拖动节点错误：' + err);
                                                    message.flag = -1;
                                                    message.data = null;
                                                    message.message = '拖拽错误';
                                                    res.json(message);
                                                    return;
                                                }
                                                message.flag = 0;
                                                message.data = null;
                                                message.message = 'OK';
                                                res.json(message);
                                                return;
                                            });
                                        }
                                    ], function (err, rows) {
                                        if (err) {
                                            message.flag = -1;
                                            message.message = '拖拽节点失败';
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
                                else {
                                    async.waterfall([
                                            function (callback) {
                                                if ((targetRow.URI).indexOf(sourceRow.URI + '/') > -1 || targetRow.URI == sourceRow.URI) {
                                                    logger.error('目标节点不能是自己及其子节点');
                                                    message.flag = -1;
                                                    message.data = null;
                                                    message.message = '目标节点不能是自己及其子节点';
                                                    res.json(message);
                                                    return;
                                                }
                                                callback(null, sourceRow, targetRow);
                                            },
                                            function (sourceRow, targetRow, callback) {
                                                var sql = 'SELECT count(ID) as count from sys_mtree c WHERE ID != ' + sourceID + ' and PID = ' + targetID + ' and NAME = "' + newName + '"';
                                                logger.debug('获取当前节点下的同名数据sql:' + sql);
                                                connection.query(sql, function (err, rows) {
                                                    if (err) {
                                                        logger.error('获取目标节点相同名称节点错误：' + err);
                                                        message.flag = -1;
                                                        message.data = null;
                                                        message.message = '获取信息错误';
                                                        res.json(message);
                                                        return;
                                                    } else if (rows[0].count > 0) {
                                                        logger.error('目标节点下存在同名节点：' + rows[0].count);
                                                        message.flag = -1;
                                                        message.data = null;
                                                        message.message = '目标节点下存在同名节点：';
                                                        res.json(message);
                                                        return;
                                                    } else {
                                                        callback(null, sourceRow, targetRow);
                                                    }
                                                });
                                            },
                                            function (sourceRow, targetRow, callback) {
                                                var URI = targetRow.URI + '/' + newName;
                                                var sql = 'update sys_mtree set name = "' + newName + '", PID =' + targetRow.ID + ',DOMAIN_ID=' + targetRow.DOMAIN_ID + ' where ID = ' + sourceRow.ID;
                                                logger.debug('更新节点信息sql：' + sql);
                                                connection.query(sql, function (err, row) {
                                                    if (err) {
                                                        logger.error('更新节点信息错误：' + err);
                                                        message.flag = -1;
                                                        message.data = null;
                                                        message.message = '剪切失败';
                                                        res.json(message);
                                                        return;
                                                    }
                                                    callback(null, sourceRow, targetRow);
                                                });
                                            },
                                            function (sourceRow, targetRow, callback) {
                                                var sql = 'SELECT ID,PID,NAME,DESCRIPTION,COMPANY_ID,URI FROM sys_mtree c  WHERE c.URI LIKE (SELECT CONCAT(uri,"/%") FROM sys_mtree c WHERE c.ID = ' + sourceID + ')  order by URI'
                                                logger.debug('获取源节点信息sql:' + sql);
                                                connection.query(sql, function (err, rows) {
                                                    if (err) {
                                                        logger.error('获取源节点信息错误：' + err);
                                                        message.flag = -1;
                                                        message.data = null;
                                                        message.message = '目标节点下面存在相同名称的点';
                                                        res.json(message);
                                                        return;
                                                    }
                                                    var targetURI = targetRow.URI + '/' + newName;
                                                    var sourceURI = sourceRow.URI
                                                    var ids = [];
                                                    rows.forEach(function (row) {
                                                        ids.push(row.ID);
                                                    });
                                                    ids.push(sourceID);
                                                    callback(null, sourceURI, targetURI, ids, targetRow);
                                                });
                                            },
                                            function (sourceURI, targetURI, ids, targetRow, callback) {
                                                var sql = "UPDATE SYS_MTREE SET URI=INSERT(URI,1,?,?),DOMAIN_ID =" + targetRow.DOMAIN_ID + " WHERE ID in (?)";
                                                logger.debug('更新mtree的URI sql：' + sql);
                                                connection.query(sql, [sourceURI.length, targetURI, ids], function (err, result) {
                                                    if (err) {
                                                        logger.error('更新剪切MTree URI错误：' + err);
                                                        message.flag = -1;
                                                        message.data = null;
                                                        message.message = '更新MTreeURI错误';
                                                        res.json(message);
                                                        return;
                                                    } else {
                                                        ids.push(sourceID);
                                                        callback(null, ids, targetRow);
                                                    }
                                                });
                                            },
                                            function (ids, targetRow, callback) {
                                                var sql = 'SELECT point.POINT_ID,point.UUID,point.POINT_NAME,mtree.URI from sys_point point ';
                                                sql += ' left join sys_mtree mtree on point.mtree_id = mtree.Id';
                                                sql += ' where point.MTREE_ID in (' + ids + ')';
                                                logger.debug('获取节点下面的测信息sql：' + sql);
                                                connection.query(sql, function (err, rows) {
                                                    if (err) {
                                                        logger.error('获取节点下面测点信息错误：' + err);
                                                        message.flag = -1;
                                                        message.data = null;
                                                        message.message = '获取节点信息失败';
                                                        res.json(message);
                                                        return;
                                                    }
                                                    callback(null, rows, targetRow);
                                                });
                                            },
                                            function (rows, targetRow, callback) {
                                                if (!rows || rows.length < 1) {
                                                    message.flag = 0;
                                                    message.message = 'OK';
                                                    message.data = null;
                                                    res.json(message);
                                                    return;
                                                }
                                                var cols = [];
                                                var rrs = [];
                                                cols.push(["ID", OPAPI.TYPE.INT32]);
                                                cols.push(["PN", OPAPI.TYPE.STRING]);
                                                cols.push(["UD", OPAPI.TYPE.INT64]);
                                                cols.push(["KR", OPAPI.TYPE.STRING]);

                                                var sqlPoints = '',
                                                    sqlPointsUUID = '',
                                                    sqlPointURI = '',
                                                    sqlPointIds = [];
                                                var size = rows.length;

                                                for (var i = 0; i < size; i++) {
                                                    var row = rows[i];
                                                    var rr = [];
                                                    rr.push(row.POINT_ID);
                                                    var pointURI = row.URI + '/' + row.POINT_NAME;
                                                    var UUID = opPool.makeUUID(pointURI);
                                                    rr.push(UUID);
                                                    UUID = '0x' + UUID;
                                                    rr.push(UUID);
                                                    rr.push(targetRow.DOMAIN_ID);
                                                    rrs.push(rr);
                                                    sqlPointsUUID += 'when ' + row.POINT_ID + ' then "' + UUID + '" ';
                                                    sqlPointURI += 'when ' + row.POINT_ID + ' then "' + pointURI + '" ';

                                                    sqlPointIds.push(row.POINT_ID);
                                                }
                                                sqlPoints = 'update sys_point set UUID = case POINT_ID ' + sqlPointsUUID + ' end,URI= case POINT_ID ' + sqlPointURI + ' end ,DOMAIN_ID = ' + targetRow.DOMAIN_ID + ' where point_ID in( ' + sqlPointIds.toString() + ')';
                                                opPool.update('Point', rrs, cols, function (error, rows, columns) {
                                                    if ((error != 0 && error && error.code) || rows[0].EC != 0) {
                                                        logger.error('编辑测点信息错误：' + JSON.stringify(error));
                                                        message.flag = -1;
                                                        message.message = '更新测点信息失败';
                                                        message.data = null;
                                                        res.send(message);
                                                        return;
                                                    } else {
                                                        callback(null, sqlPoints);
                                                    }
                                                });
                                            },
                                            function (sqlPoints, callback) {
                                                logger.debug('剪切时更新测点信息sql:' + sqlPoints);
                                                connection.query(sqlPoints, function (err, result) {
                                                    if (err) {
                                                        logger.error('更新关系库测点信息错误：' + err);
                                                        message.flag = -1;
                                                        message.data = null;
                                                        message.message = '更新数据库信息错误';
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
                                        ],
                                        function (err, rows) {
                                            if (err) {
                                                message.flag = -1;
                                                mesage.message = '拖拽节点失败';
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
                                        }
                                    )
                                    ;
                                }
                            }
                        }
                    });
                }
            });
        } catch (e) {
            logger.error('try拖拽节点异常：' + e);
            message.flag = -1;
            message.message = "操作失败";
            res.json(message);
        }
    }
    ,
//重命名树结构
    renameMTree: function (req, res, action) {
        var id = req.body.id;
        var newName = req.body.newName;
        if (id && newName) {
            transaction(function (err, connection) {
                if (err) {
                    logger.error("transaction ERROR" + err);
                } else {
                    async.waterfall([
                        function (callback) {
                            var sql = 'select PID,MTREE_SOURCE from sys_mtree where ID=' + id;
                            logger.debug('获取是否是域节点 sql:' + sql)
                            connection.query(sql, function (err, rows) {
                                if (err) {
                                    logger.error('获取是否是域节点错误：' + err);
                                    message.flag = -1;
                                    message.message = '获取是否是域节点失败';
                                    message.data = null;
                                    res.json(message);
                                    return;
                                } else if (rows && rows.length == 1) {
                                    if (rows[0].MTREE_SOURCE == 1) {
                                        message.flag = -1;
                                        message.message = '域节点不允许重命名';
                                        message.data = null;
                                        res.json(message);
                                        return;
                                    }
                                    if (!rows[0].PID) {
                                        message.flag = -1;
                                        message.message = '根节点不允许重命名';
                                        message.data = null;
                                        res.json(message);
                                        return;
                                    } else {
                                        callback(null);
                                    }
                                } else {
                                    message.flag = -1;
                                    message.message = '请选择节点';
                                    message.data = null;
                                    res.json(message);
                                    return;
                                }
                            });
                        },
                        function (callback) {
                            var sql = 'select count(ID) as count from sys_mtree where PID  in ( select PID from sys_mtree where ID = ' + id + ') and name ="' + newName + '"';
                            logger.debug('获取当前节点下是否有相同名称的节点sql:' + sql);
                            connection.query(sql, function (err, rows) {
                                if (err) {
                                    logger.error('统计节点信息错误：' + err);
                                    message.flag = -1;
                                    message.data = null;
                                    message.message = '重命名出错';
                                    res.json(message);
                                    return;
                                } else {
                                    if (rows[0].count > 0) {
                                        message.flag = -1;
                                        message.data = null;
                                        message.message = '父节点下存在同名节点';
                                        res.json(message);
                                        return;
                                    }
                                    callback(null);
                                }
                            });
                        },
                        function (callback) {
                            var sql = 'select ID,PID,URI from sys_mtree where ID  in ( select PID from sys_mtree where ID = ' + id + ')';
                            logger.debug('获取源节点和目标节点数据sql:' + sql);
                            connection.query(sql, function (err, rows) {
                                if (err) {
                                    logger.error('获取父节点' + (err || rows.length));
                                    message.flag = -1;
                                    message.data = null;
                                    message.message = '重命名错误';
                                    res.json(message);
                                    return;
                                } else if (rows.length < 1 || rows.length != 1) {
                                    message.flag = -1;
                                    message.data = null;
                                    message.message = '根节点不允许重命名';
                                    res.json(message);
                                    return;
                                } else {
                                    callback(null, rows[0]);
                                }
                            });
                        },
                        function (rr, callback) {
                            var URI = rr.URI + '/' + newName;
                            var sql = 'update sys_mtree set name = "' + newName + '"  where ID = ' + id;
                            logger.debug('更新节点信息sql：' + sql);
                            connection.query(sql, function (err, row) {
                                if (err) {
                                    logger.error('重命名节点信息错误：' + err);
                                    message.flag = -1;
                                    message.data = null;
                                    message.message = '重命名节点信息失败';
                                    res.json(message);
                                    return;
                                }
                                callback(null, URI);
                            });
                        },
                        function (URI, callback) {
                            var sql = 'SELECT ID,PID,NAME,DESCRIPTION,COMPANY_ID,URI FROM sys_mtree c WHERE c.ID = ' + id;
                            sql += ' UNION all ';
                            sql += 'SELECT ID,PID,NAME,DESCRIPTION,COMPANY_ID,URI FROM sys_mtree c  WHERE c.URI LIKE (SELECT CONCAT(uri,"/%") FROM sys_mtree c WHERE c.ID = ' + id + ')  order by URI';
                            logger.debug('获取源节点信息sql:' + sql);
                            connection.query(sql, function (err, rows) {
                                if (err) {
                                    logger.error('获取节点信息错误：' + err);
                                    message.flag = -1;
                                    message.data = null;
                                    message.message = '获取节点信息错误';
                                    res.json(message);
                                    return;
                                }
                                var targetURI = URI;
                                var sourceURI;
                                var ids = [];
                                rows.forEach(function (row) {
                                    ids.push(row.ID);
                                    if (row.ID == id) {
                                        sourceURI = row.URI;
                                    }
                                });
                                callback(null, sourceURI, targetURI, ids);
                            });
                        },
                        function (sourceURI, targetURI, ids, callback) {
                            var sql = "UPDATE SYS_MTREE SET URI=INSERT(URI,1,?,?) WHERE ID in (?)";
                            logger.debug('更新mtree的URI sql:' + sql);
                            connection.query(sql, [sourceURI.length, targetURI, ids], function (err, result) {
                                if (err) {
                                    logger.error('重命名剪切MTree URI错误：' + err);
                                    message.flag = -1;
                                    message.data = null;
                                    message.message = '更新MTreeURI错误';
                                    res.json(message);
                                    return;
                                } else {
                                    callback(null, ids);
                                }
                            });
                        },
                        function (ids, callback) {
                            var sql = 'SELECT point.POINT_ID,point.UUID,point.POINT_NAME,mtree.URI from sys_point point ';
                            sql += ' left join sys_mtree mtree on point.mtree_id = mtree.Id';
                            sql += ' where point.MTREE_ID in (' + ids + ')';
                            logger.error('获取节点下面的测信息sql：' + sql);
                            connection.query(sql, function (err, rows) {
                                if (err) {
                                    logger.error('获取节点下面测点信息错误：' + err);
                                    message.flag = -1;
                                    message.data = null;
                                    message.message = '获取节点信息失败';
                                    res.json(message);
                                    return;
                                }
                                callback(null, rows);
                            });
                        },
                        function (rows, callback) {
                            if (!rows || rows.length < 1) {
                                message.flag = 0;
                                message.message = 'OK';
                                message.data = null;
                                res.json(message);
                                return;
                            }
                            var cols = [];
                            var rrs = [];
                            cols.push(["ID", OPAPI.TYPE.INT32]);
                            cols.push(["PN", OPAPI.TYPE.STRING]);
                            cols.push(["UD", OPAPI.TYPE.INT64]);

                            var sqlPoints = '',
                                sqlPointsUUID = '',
                                sqlPointURI = '',
                                sqlPointIds = [];
                            var size = rows.length;

                            for (var i = 0; i < size; i++) {
                                var row = rows[i];
                                var rr = [];
                                rr.push(row.POINT_ID);
                                var pointURI = row.URI + '/' + row.POINT_NAME;
                                var UUID = opPool.makeUUID(pointURI);
                                rr.push(UUID);
                                UUID = '0x' + UUID;
                                rr.push(UUID);
                                rrs.push(rr);
                                sqlPointsUUID += 'when ' + row.POINT_ID + ' then "' + UUID + '" ';
                                sqlPointURI += 'when ' + row.POINT_ID + ' then "' + pointURI + '" ';
                                sqlPointIds.push(row.POINT_ID);
                            }

                            sqlPoints = 'update sys_point set UUID = case POINT_ID ' + sqlPointsUUID + ' end,URI= case POINT_ID ' + sqlPointURI + ' end  where point_ID in( ' + sqlPointIds.toString() + ')';
                            opPool.update('Point', rrs, cols, function (error, rows, columns) {
                                if ((error != 0 && error && error.code) || rows[0].EC != 0) {
                                    logger.error('编辑测点信息错误：' + JSON.stringify(error));
                                    message.flag = -1;
                                    message.message = '更新测点信息失败';
                                    message.data = null;
                                    res.send(message);
                                    return;
                                } else {
                                    callback(null, sqlPoints);
                                }
                            });
                        },
                        function (sqlPoints, callback) {
                            logger.debug('重命名时更新测点信息sql:' + sqlPoints);
                            connection.query(sqlPoints, function (err, result) {
                                if (err) {
                                    logger.error('更新关系库测点信息错误：' + err);
                                    message.flag = -1;
                                    message.data = null;
                                    message.message = '更新数据库信息错误';
                                    res.json(message);
                                    return;
                                } else {
                                    message.flag = 0
                                    message.data = null;
                                    message.message = 'OK';
                                    res.json(message);
                                    return;
                                }
                            });
                        }
                    ], function (err) {
                        if (err) {
                            logger.error('重命名节点错误：' + err);
                            message.flag = -1;
                            message.data = null;
                            message.message = '重命名节点错误';
                            res.json(message);
                            return;
                        } else {
                            message.flag = 0
                            message.data = null;
                            message.message = 'OK';
                            res.json(message);
                            return;
                        }

                    });
                }
            });
        } else {
            message.flag = -1;
            message.data = null;
            message.message = '请选择节点';
            res.json(message);
            return;
        }
    }
    ,
//获取链接节点信息
    linkMTreeInfo: function (req, res, action) {
        var id = req.body.id;
        if (!id) {
            message.flag = -1;
            message.data = null;
            message.message = '请选择节点';
            return;
        }
        var companyId = req.session.user.ENTERPRISE_ID;
        var sql = 'SELECT ID as id,PID as parent,URI,NAME as text FROM sys_mtree WHERE COMPANY_ID = ' + companyId;
        logger.debug('获取Link Mtree资源sql:' + sql);
        query(sql, function (err, rows, columns) {
            if (err) {
                logger.error('获取用户Mtree资源错误：' + err);
                message.flag = -1;
                message.data = null;
                message.message = '获取MTree节点出错';
                res.json(message);
                return;
            } else {
                if (rows && rows.length < 1) {
                    message.flag = -1;
                    message.data = null;
                    message.message = '没有可以链接的节点';
                    res.json(message);
                    return;
                }
                var rrs = [];
                var currentRow;
                var rowsObject = {};
                for (var i in rows) {
                    if (rows[i].id == id) {
                        currentRow = rows[i];
                        break;
                    }
                }
                for (var j in rows) {
                    var row = rows[j]
                    if (row.URI.indexOf(currentRow.URI) < 0 && currentRow.URI.indexOf(row.URI) < 0) {
                        rrs.push(row);
                        rowsObject[row.id] = row;
                    }
                }
                for (var t in rrs) {
                    var rs = rrs[t];
                    if (!rowsObject[rs.parent]) {
                        rs.parent = '#';
                        rrs[t] = rs;
                    }
                }
                if (rrs && rrs.length < 1) {
                    message.flag = -1;
                    message.data = null;
                    message.message = '没有可以链接的节点';
                    res.json(message);
                    return;
                }
                message.flag = 0;
                message.message = 'OK';
                message.data = rrs;
                res.json(message);
                return;
            }
        });
    }
    ,
//链接节点
    linkMTree: function (req, res, action) {
        var sourceID = req.body.sourceID;
        var targetID = req.body.targetID;
        var linkName = req.body.linkName;
        async.waterfall(
            [
                function (callback) {
                    var sql = 'select count(ID) as count from sys_mtree where PID  = ' + targetID + ' and name ="' + linkName + '"';
                    logger.debug('获取当前节点下是否有相同名称的节点sql:' + sql);
                    query(sql, function (err, rows) {
                        if (err) {
                            logger.error('统计节点信息错误：' + err);
                            message.flag = -1;
                            message.data = null;
                            message.message = '链接出错';
                            res.json(message);
                            return;
                        } else {
                            if (rows[0].count > 0) {
                                message.flag = -1;
                                message.data = null;
                                message.message = '当前节点下存在同名节点';
                                res.json(message);
                                return;
                            }
                            callback(null);
                        }
                    });
                },
                function (callback) {
                    var sql = 'select count(ID) as count from sys_mtree where PID  = ' + targetID + ' and LINK_ID = ' + sourceID;
                    logger.debug('获取当前节点下是否有相同的链接:' + sql);
                    query(sql, function (err, rows) {
                        if (err) {
                            logger.error('统计是否链接过该节点错误：' + err);
                            message.flag = -1;
                            message.data = null;
                            message.message = '链接出错';
                            res.json(message);
                            return;
                        } else {
                            if (rows[0].count > 0) {
                                message.flag = -1;
                                message.data = null;
                                message.message = '节点已经被链接过了';
                                res.json(message);
                                return;
                            }
                            callback(null);
                        }
                    });
                },
                function (callback) {
                    if (sourceID == targetID) {
                        message.flag = -1;
                        message.data = null;
                        message.message = '链接节点不能是自己';
                        res.json(message);
                        return;
                    }
                    var sql = 'select ID,PID,TYPE_ID,LINK_ID,URI,NAME,LAYER,CREATE_DATE,ZORDER,DESCRIPTION,IS_SYSTEM,IS_LEAF,IS_DELETED,COUNT,UUID,COMPANY_ID from sys_mtree where ID in (' + sourceID + ',' + targetID + ')';
                    logger.debug('获取源节点和目标节点数据sql:' + sql);
                    query(sql, function (err, rows) {
                        if (err) {
                            logger.error('获取源节点和目标节点数据错误：' + err);
                            message.flag = -1;
                            message.data = null;
                            message.message = '剪切错误';
                            res.json(message);
                            return;
                        } else {
                            if (rows && rows.length == 2) {
                                var sourceRow, targetRow;
                                if (rows[0].ID == sourceID) {
                                    sourceRow = rows[0];
                                    targetRow = rows[1];
                                } else {
                                    sourceRow = rows[1];
                                    targetRow = rows[0];
                                }
                                if (targetRow.URI.indexOf(sourceRow.URI) > -1) {
                                    logger.error('链接节点不能是自己及其子节点');
                                    message.flag = -1;
                                    message.data = null;
                                    message.message = '目标节点不能是自己及其子节点';
                                    res.json(message);
                                    return;
                                }
                                if (sourceRow.URI.indexOf(targetRow.URI) > -1) {
                                    logger.error('链接节点不能是自己及其父级节点');
                                    message.flag = -1;
                                    message.data = null;
                                    message.message = '链接节点不能是自己及其父级节点';
                                    res.json(message);
                                    return;
                                }
                                callback(null, sourceRow, targetRow);
                            } else {
                                logger.error('获取源节点和目标节点数据错误：' + (err || rows.length));
                                message.flag = -1;
                                message.data = null;
                                message.message = '剪切错误';
                                res.json(message);
                                return;
                            }
                        }
                    });
                },
                function (sourceRow, targetRow) {
                    sourceRow.LINK_ID = sourceRow.ID;
                    sourceRow.PID = targetRow.ID;
                    sourceRow.CREATE_DATE = Utils.dateFormat(new Date().getTime(), Utils.yyyyMMddhhmmss);
                    sourceRow.NAME = linkName;
                    sourceRow.S_URI = sourceRow.URI;
                    sourceRow.URI = targetRow.URI + '/' + linkName;
                    delete sourceRow.ID;
                    var sql = sqlQuery.insert().into('sys_mtree').set(sourceRow).build();
                    logger.debug('插入链接节点信息sql：' + sql);
                    query(sql, function (err, rows) {
                        if (err) {
                            logger.error('链接节点出错' + err);
                            message.flag = -1;
                            message.data = null;
                            message.message = '链接错误';
                            res.json(message);
                            return;
                        } else {
                            message.flag = 0;
                            message.data = null;
                            message.message = rows.insertId;
                            res.json(message);
                            return;
                        }
                    });
                }
            ],
            function (err, rows) {
                if (err) {
                    logger.error('链接节点错误：' + err);
                    message.flag = -1;
                    message.data = null;
                    message.message = '链接节点错误';
                    res.json(message);
                    return;
                } else {
                    message.flag = 0
                    message.data = null;
                    message.message = 'OK';
                    res.json(message);
                    return;
                }
            }
        )

    }
    ,
//拷贝树
    copyMTree: function (req, res, action) {
        var sourceID = req.body.sourceID;
        var newName = req.body.newName;
        var targetID = req.body.targetID;
        var pasteType = req.body.pasteType;
        var companyId = req.session.user.ENTERPRISE_ID;
        var mtreeRowsGlobal = [];
        var treeIDMap = {};
        var domainId = 0;
        var user = req.session.user;
        if (pasteType == "copy") {
            try {
                transaction(function (err, connection) {
                    if (err) {
                        logger.error("transaction ERROR" + err);
                    } else {
                        async.waterfall(
                            [
                                function (callback) {
                                    var sql = 'select PID,URI,MTREE_SOURCE,DOMAIN_ID from sys_mtree where ID = ' + sourceID;
                                    logger.debug('获取是否是域节点 sql:' + sql)
                                    connection.query(sql, function (err, rows) {
                                        if (err) {
                                            logger.error('获取节点信息错误：' + err);
                                            message.flag = -1;
                                            message.message = '获取节点信息失败';
                                            message.data = null;
                                            res.json(message);
                                            return;
                                        } else if (rows && rows.length == 1) {
                                            if (rows[0].MTREE_SOURCE == 1) {
                                                message.flag = -1;
                                                message.message = '域节点不允许复制';
                                                message.data = null;
                                                res.json(message);
                                                return;
                                            }
                                            if (GlobalAgent.getUserDomain(user.USER_ID).indexOf(rows[0].DOMAIN_ID) < 0) {
                                                message.flag = -1;
                                                message.message = '您没有复制' + rows[0].URI + '节点的权限';
                                                message.data = null;
                                                res.json(message);
                                                return;
                                            }
                                            if (!rows[0].PID) {
                                                message.flag = -1;
                                                message.message = '根节点不允许复制';
                                                message.data = null;
                                                res.json(message);
                                                return;
                                            } else {
                                                callback(null);
                                            }
                                        } else {
                                            message.flag = -1;
                                            message.message = '请选择节点';
                                            message.data = null;
                                            res.json(message);
                                            return;
                                        }
                                    });
                                },
                                function (callback) {
                                    var sql = 'SELECT count(ID) as count from sys_mtree c WHERE PID = ' + targetID + ' and NAME = "' + newName + '"';
                                    logger.debug('获取当前节点下的同名数据sql:' + sql);
                                    connection.query(sql, function (err, rows) {
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
                                function (callback) {
                                    var sql = 'SELECT ID,PID,NAME,DESCRIPTION,COMPANY_ID,URI FROM sys_mtree c WHERE c.ID = ' + sourceID;
                                    sql += ' UNION all ';
                                    sql += 'SELECT ID,PID,NAME,DESCRIPTION,COMPANY_ID,URI FROM sys_mtree c  WHERE c.URI LIKE (SELECT CONCAT(uri,"/%") FROM sys_mtree c WHERE c.ID = ' + sourceID + ')  order by URI';
                                    logger.debug('获取节点及子节点sql：' + sql);
                                    connection.query(sql, function (err, result) {
                                        var rows = result;
                                        if (err == null && rows && rows.length > 0) {
                                            callback(null, rows);
                                        } else {
                                            message.data = null;
                                            message.flag = -1;
                                            message.message = '获取节点失败';
                                            logger.error('获取节点及子节点错误：' + err);
                                            res.json(message);
                                            return;
                                        }
                                    });
                                },
                                function (mtreeRows, callback) {
                                    var targetSQL = "SELECT ID,PID,URI,COMPANY_ID,DOMAIN_ID FROM sys_mtree c WHERE ID = " + targetID;
                                    logger.debug('获取目标节点sql：' + targetSQL);
                                    connection.query(targetSQL, function (err, result) {
                                        var URI = result[0].URI;
                                        domainId = result[0].DOMAIN_ID;
                                        if (GlobalAgent.getUserDomain(user.USER_ID).indexOf(domainId) < 0) {
                                            message.flag = -1;
                                            message.message = '您没有复制到' + result[0].URI + '节点下的权限';
                                            message.data = null;
                                            res.json(message);
                                            return;
                                        }
                                        async.eachSeries(mtreeRows, function (row, callbackMTree) {
                                            var treeCatch = treeIDMap[row.PID];
                                            if (row.ID == sourceID) {
                                                row.PID = targetID;
                                                row.URI = URIUtils(URI, (newName ? newName : row.NAME));
                                                row.NAME = newName;
                                                row.DOMAIN_ID = domainId;
                                            } else if (treeCatch) {
                                                var treeCatch = treeIDMap[row.PID];
                                                row.PID = treeCatch.ID;
                                                row.URI = URIUtils(treeCatch.URI, row.NAME);
                                                row.DOMAIN_ID = domainId;
                                            } else {
                                                row.PID = targetID;
                                                row.URI = URIUtils(URI, row.Name);
                                                row.DOMAIN_ID = domainId;
                                                callbackMTree(null);
                                            }
                                            var id = row.ID;
                                            mtreeRowsGlobal.push(id);
                                            //采用自增ID
                                            delete row.ID;
                                            row.CREATE_DATE = Utils.dateFormat(new Date().getTime(), Utils.yyyyMMddhhmmss);
                                            var sql = sqlQuery.insert().into('sys_mtree').set(row).build();
                                            connection.query(sql, function (err, insertResult) {
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
                                        }, function (err) {
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
                                function (callback) {
                                    var tagId = mtreeRowsGlobal.toString();
                                    var sql = 'SELECT ID,UUID,MTREE_ID from sys_point where MTREE_ID in (' + tagId + ')';
                                    logger.debug('获取对应节点下面的测点UD sql：' + sql);
                                    connection.query(sql, function (err, rows) {
                                        if (err) {
                                            logger.error('获取测点信息错误：' + err);
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
                                function (pointRows, callback) {
                                    var pointUDs = [];
                                    for (var i = 0; i < pointRows.length; i++) {
                                        pointUDs.push(pointRows[i].UUID);
                                    }
                                    if (pointUDs.length < 1) {
                                        message.flag = 0;
                                        message.message = 'OK';
                                        message.data = null;
                                        res.json(message);
                                        return;
                                    }
                                    var sql = 'select ID,PN,UD,KR,HW,AN,TN,RT,ED,FQ,FM,TV,BV,EU,KZ,EX,PT,KT,AP,LC,H4,H3,ZH,HL,LL,ZL,L3,L4,C1,C2,C3,C4,C5,C6,C7,C8 from Point where UD in (' + pointUDs + ')';
                                    logger.debug('获取数据库测点信息sql：' + sql);
                                    opPool.query(sql, function (error, rows, columns) {
                                        if (error && error != 0 && error.code) {
                                            logger.error('获取测点信息失败：' + JSON.stringify(error));
                                            message.flag = -1;
                                            message.message = '获取测点信息失败';
                                            message.data = null;
                                            res.send(message);
                                            return;
                                        } else {
                                            callback(null, pointRows, rows);
                                        }
                                    });
                                },
                                function (pointTagRows, pointRows, callback) {
                                    var pointMTrees = [];
                                    for (var i in pointTagRows) {
                                        var pointTag = pointTagRows[i];
                                        var mtree = treeIDMap[pointTag.MTREE_ID];
                                        for (var j in pointRows) {
                                            var pointRow = pointRows[j];
                                            if (pointTag.UUID == ('0x' + pointRow.PN)) {
                                                pointRow.ID = configUtils.getPointIDNext();
                                                var pointURI = mtree.URI + '/' + pointRow.TN;
                                                var uuid = opPool.makeUUID(pointURI).toString();
                                                pointRow.GN = 'W3.NODE.' + uuid;
                                                pointRow.KR = domainId;
                                                uuid = '0x' + uuid;
                                                pointRow.UD = uuid;
                                                pointRows[j] = pointRow;
                                                var pointMTree = {};
                                                var tagID = UUID.v1();
                                                pointMTree.ID = tagID;
                                                pointMTree.POINT_ID = pointRow.ID;
                                                pointMTree.UD = uuid;
                                                pointMTree.TN = pointRow.TN;
                                                pointMTree.URI = pointURI;
                                                pointMTree.MTREE_ID = mtree.ID;
                                                pointMTree.RT = pointRow.RT;
                                                pointMTree.EU = pointRow.EU;
                                                pointMTree.ED = pointRow.ED;
                                                pointMTree.KZ = pointRow.KZ;
                                                pointMTrees.push(pointMTree);
                                            }
                                        }
                                    }
                                    callback(null, pointRows, pointMTrees);
                                },
                                function (pointRows, pointMTrees, callback) {
                                    var cols = [];
                                    cols.push(["ID", OPAPI.TYPE.INT32]);
                                    cols.push(["UD", OPAPI.TYPE.INT64]);
                                    cols.push(["GN", OPAPI.TYPE.STRING]);
                                    cols.push(["TN", OPAPI.TYPE.STRING]);
                                    cols.push(["RT", OPAPI.TYPE.INT8]);
                                    cols.push(["KR", OPAPI.TYPE.STRING]);
                                    cols.push(["HW", OPAPI.TYPE.INT32]);
                                    cols.push(["AN", OPAPI.TYPE.STRING]);
                                    cols.push(["FQ", OPAPI.TYPE.INT16]);
                                    cols.push(["ED", OPAPI.TYPE.STRING]);
                                    cols.push(["TV", OPAPI.TYPE.FLOAT]);
                                    cols.push(["BV", OPAPI.TYPE.FLOAT]);
                                    cols.push(["EU", OPAPI.TYPE.STRING]);
                                    cols.push(["KZ", OPAPI.TYPE.INT8]);
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
                                    var rows = [];
                                    for (var i in pointRows) {
                                        var row = [];
                                        var pointRow = pointRows[i];
                                        row.push(pointRow.ID);
                                        row.push(pointRow.UD);
                                        row.push(pointRow.GN);
                                        row.push(pointRow.TN);
                                        row.push(pointRow.RT);
                                        row.push(pointRow.KR);
                                        row.push(pointRow.HW);
                                        row.push(pointRow.AN);
                                        row.push(pointRow.FQ);
                                        row.push(pointRow.ED);
                                        row.push(pointRow.TV);
                                        row.push(pointRow.BV);
                                        row.push(pointRow.EU);
                                        row.push(pointRow.KZ);
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
                                    opPool.insert('Point', rows, cols, function (err, rows, columns) {
                                        if ((err && err != 0 && err.code) || rows[0].EC != 0) {
                                            logger.error('插入测点错误:' + (JSON.stringify(err) || rows[0].EC));
                                            message.flag = -1;
                                            message.message = '编辑点失败';
                                            res.send(message);
                                            return;
                                        } else {
                                            callback(null, pointMTrees);
                                        }
                                    });
                                },
                                function (pointMTrees, callback) {
                                    var sqlPoints = 'insert into sys_point (`ID`,`POINT_ID`, `UUID`, `URI`, `MTREE_ID`, `POINT_NAME`, `UNIT`, `POINT_TYPE`,`DESCRIPTION`,`COMPRESS_TYPE`,`CREATE_DATE`,`ENTERPRISE_ID`,`DOMAIN_ID`)';
                                    var sqlValue = '';
                                    var size = pointMTrees.length;
                                    for (var i = 0; i < size; i++) {
                                        var row = pointMTrees[i];
                                        sqlValue += '(';
                                        sqlValue += '\'' + row.ID + '\',';
                                        sqlValue += row.POINT_ID + ',';
                                        sqlValue += '\'' + row.UD + '\',';
                                        sqlValue += '\'' + row.URI + '\',';
                                        sqlValue += row.MTREE_ID + ',';
                                        sqlValue += '\'' + row.TN + '\',';
                                        sqlValue += '\'' + row.EU + '\',';
                                        sqlValue += row.RT + ',';
                                        sqlValue += '\'' + row.ED + '\',';
                                        sqlValue += row.KZ + ',';
                                        sqlValue += '\'' + Utils.dateFormat(new Date().getTime(), Utils.yyyyMMddhhmmss) + '\',';
                                        sqlValue += companyId + ',';
                                        sqlValue += domainId;
                                        sqlValue += ')';
                                        if (pointMTrees[i + 1]) {
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
                                    query(sqlPoints, function (perr, result, columns) {
                                        if (perr) {
                                            logger.error('插入测点到关系库错误：' + perr);
                                            message.flag = -1;
                                            message.message = '插入点信息失败';
                                            message.data = null;
                                            res.send(message);
                                            return;
                                        }
                                        message.flag = 0
                                        message.message = 'OK';
                                        message.data = null;
                                        res.send(message);
                                        return;
                                    });
                                }
                            ],
                            function (err, rows) {
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
                logger.error(e);
                return;
            }
        }
        else if (pasteType == "cut") {
            try {
                transaction(function (err, connection) {
                    if (err) {
                        logger.error("transaction ERROR" + err);
                    } else {
                        async.waterfall([
                            function (callback) {
                                if (sourceID == targetID) {
                                    message.flag = -1;
                                    message.data = null;
                                    message.message = '目标节点不能是自己及其子节点';
                                    res.json(message);
                                    return;
                                }
                                var sql = 'select ID,URI,PID,NAME,DOMAIN_ID from sys_mtree where ID in (' + sourceID + ',' + targetID + ')';
                                logger.debug('获取源节点和目标节点数据sql:' + sql);
                                connection.query(sql, function (err, rows) {
                                    if (err) {
                                        logger.error('获取源节点和目标节点数据错误：' + err);
                                        message.flag = -1;
                                        message.data = null;
                                        message.message = '剪切错误';
                                        res.json(message);
                                        return;
                                    } else {
                                        if (rows && rows.length == 2) {
                                            var sourceRow, targetRow;
                                            if (rows[0].ID == sourceID) {
                                                sourceRow = rows[0];
                                                targetRow = rows[1];
                                            } else {
                                                sourceRow = rows[1];
                                                targetRow = rows[0];
                                            }
                                            var adminDomainIds = GlobalAgent.getAdminUserDomain(user.USER_ID);
                                            if (sourceRow.DOMAIN_ID != targetRow.DOMAIN_ID && (adminDomainIds.indexOf(sourceRow.DOMAIN_ID) < 0 || adminDomainIds.indexOf(targetRow.DOMAIN_ID) < 0)) {
                                                message.flag = -1;
                                                message.data = null;
                                                message.message = '您不具有此两个节点的管理员权限';
                                                res.json(message);
                                                return;
                                            }
                                            if ((targetRow.URI).indexOf(sourceRow.URI + '/') > -1 || targetRow.URI == sourceRow.URI) {
                                                logger.error('目标节点不能是自己及其子节点');
                                                message.flag = -1;
                                                message.data = null;
                                                message.message = '目标节点不能是自己及其子节点';
                                                res.json(message);
                                                return;
                                            }
                                            if (sourceRow.PID == targetRow.ID) {
                                                message.flag = -1;
                                                message.data = null;
                                                message.message = '不能剪切到同一节点下';
                                                res.json(message);
                                                return;
                                            }
                                            callback(null, sourceRow, targetRow);
                                        } else {
                                            logger.error('获取源节点和目标节点数据错误：' + (err || rows.length));
                                            message.flag = -1;
                                            message.data = null;
                                            message.message = '剪切错误';
                                            res.json(message);
                                            return;
                                        }
                                    }
                                });
                            },
                            function (sourceRow, targetRow, callback) {
                                var sql = 'SELECT count(ID) as count from sys_mtree c WHERE ID != ' + sourceID + ' and PID = ' + targetID + ' and NAME = "' + newName + '"';
                                logger.debug('获取当前节点下的同名数据sql:' + sql);
                                connection.query(sql, function (err, rows) {
                                    if (err || rows[0].count > 0) {
                                        logger.error('获取目标节点相同名称节点错误：' + (err || rows[0].count));
                                        message.flag = -1;
                                        message.data = null;
                                        message.message = '获取信息错误';
                                        res.json(message);
                                        return;
                                    } else {
                                        callback(null, sourceRow, targetRow);
                                    }
                                });
                            },
                            function (sourceRow, targetRow, callback) {
                                var URI = targetRow.URI + '/' + newName;
                                var sql = 'update sys_mtree set name = "' + newName + '", PID =' + targetRow.ID + ',DOMAIN_ID=' + targetRow.DOMAIN_ID + ' where ID = ' + sourceRow.ID;
                                logger.debug('更新节点信息sql：' + sql);
                                connection.query(sql, function (err, row) {
                                    if (err) {
                                        logger.error('更新节点信息错误：' + err);
                                        message.flag = -1;
                                        message.data = null;
                                        message.message = '剪切失败';
                                        res.json(message);
                                        return;
                                    }
                                    callback(null, sourceRow, targetRow);
                                });
                            },
                            function (sourceRow, targetRow, callback) {
                                var sql = 'SELECT ID,PID,NAME,DESCRIPTION,COMPANY_ID,URI FROM sys_mtree c  WHERE c.URI LIKE (SELECT CONCAT(uri,"/%") FROM sys_mtree c WHERE c.ID = ' + sourceID + ')  order by URI'
                                logger.debug('获取源节点信息sql:' + sql);
                                connection.query(sql, function (err, rows) {
                                    if (err) {
                                        logger.error('获取源节点信息错误：' + err);
                                        message.flag = -1;
                                        message.data = null;
                                        message.message = '目标节点下面存在相同名称的点';
                                        res.json(message);
                                        return;
                                    }
                                    var targetURI = targetRow.URI + '/' + newName;
                                    var sourceURI = sourceRow.URI
                                    var ids = [];
                                    rows.forEach(function (row) {
                                        ids.push(row.ID);
                                    });
                                    ids.push(sourceID);
                                    callback(null, sourceURI, targetURI, ids, targetRow);
                                });
                            },
                            function (sourceURI, targetURI, ids, targetRow, callback) {
                                var sql = "UPDATE SYS_MTREE SET URI=INSERT(URI,1,?,?) ,DOMAIN_ID=" + targetRow.DOMAIN_ID + " WHERE ID in (?)";
                                logger.debug('更新mtree的URI sql：' + sql);
                                connection.query(sql, [sourceURI.length, targetURI, ids], function (err, result) {
                                    if (err) {
                                        logger.error('更新剪切MTree URI错误：' + err);
                                        message.flag = -1;
                                        message.data = null;
                                        message.message = '更新MTreeURI错误';
                                        res.json(message);
                                        return;
                                    } else {
                                        ids.push(sourceID);
                                        callback(null, ids, targetRow);
                                    }
                                });
                            },
                            function (ids, targetRow, callback) {
                                var sql = 'SELECT point.POINT_ID,point.UUID,point.POINT_NAME,mtree.URI from sys_point point ';
                                sql += ' left join sys_mtree mtree on point.mtree_id = mtree.Id';
                                sql += ' where point.MTREE_ID in (' + ids + ')';
                                logger.error('获取节点下面的测信息sql：' + sql);
                                connection.query(sql, function (err, rows) {
                                    if (err) {
                                        logger.error('获取节点下面测点信息错误：' + err);
                                        message.flag = -1;
                                        message.data = null;
                                        message.message = '获取节点信息失败';
                                        res.json(message);
                                        return;
                                    }
                                    callback(null, rows, targetRow);
                                });
                            },
                            function (rows, targetRow, callback) {
                                if (!rows || rows.length < 1) {
                                    message.flag = 0;
                                    message.message = 'OK';
                                    message.data = null;
                                    res.json(message);
                                    return;
                                }
                                var cols = [];
                                var rrs = [];
                                cols.push(["ID", OPAPI.TYPE.INT32]);
                                cols.push(["PN", OPAPI.TYPE.STRING]);
                                cols.push(["UD", OPAPI.TYPE.INT64]);
                                cols.push(["KR", OPAPI.TYPE.STRING]);
                                var sqlPoints = '',
                                    sqlPointsUUID = '',
                                    sqlPointURI = '',
                                    sqlPointIds = [];
                                var size = rows.length;
                                for (var i = 0; i < size; i++) {
                                    var row = rows[i];
                                    var rr = [];
                                    rr.push(row.POINT_ID);
                                    var pointURI = row.URI + '/' + row.POINT_NAME;
                                    var UUID = opPool.makeUUID(pointURI);
                                    rr.push(UUID);
                                    UUID = '0x' + UUID;
                                    rr.push(UUID);
                                    rr.push(targetRow.DOMAIN_ID);
                                    rrs.push(rr);

                                    sqlPointsUUID += 'when ' + row.POINT_ID + ' then "' + UUID + '" ';
                                    sqlPointURI += 'when ' + row.POINT_ID + ' then "' + pointURI + '" ';

                                    sqlPointIds.push(row.POINT_ID)
                                }
                                sqlPoints = 'update sys_point set UUID = case POINT_ID ' + sqlPointsUUID + ' end,URI= case POINT_ID ' + sqlPointURI + ' end,DOMAIN_ID=' + targetRow.DOMAIN_ID + ' where point_ID in( ' + sqlPointIds.toString() + ')';
                                opPool.update('Point', rrs, cols, function (error, rows, columns) {
                                    if ((error != 0 && error && error.code) || rows[0].EC != 0) {
                                        logger.error(JSON.stringify(error));
                                        logger.error(rows);
                                        logger.error('编辑测点信息错误：' + JSON.stringify(error));
                                        message.flag = -1;
                                        message.message = '更新测点信息失败';
                                        message.data = null;
                                        res.send(message);
                                        return;
                                    } else {
                                        callback(null, sqlPoints);
                                    }
                                });
                            },
                            function (sqlPoints, callback) {
                                logger.debug('剪切时更新测点信息sql:' + sqlPoints);
                                connection.query(sqlPoints, function (err, result) {
                                    if (err) {
                                        logger.error('更新关系库测点信息错误：' + err);
                                        message.flag = -1;
                                        message.data = null;
                                        message.message = '更新数据库信息错误';
                                        res.json(message);
                                        return;
                                    } else {
                                        message.flag = 0
                                        message.data = null;
                                        message.message = 'OK';
                                        res.json(message);
                                        return;
                                    }
                                });
                            }
                        ], function (err) {
                            if (err) {
                                logger.error('剪切节点错误：' + err);
                                message.flag = -1;
                                message.data = null;
                                message.message = '剪切节点错误';
                                res.json(message);
                                return;
                            } else {
                                message.flag = 0
                                message.data = null;
                                message.message = 'OK';
                                res.json(message);
                                return;
                            }

                        });
                    }
                })
            } catch (e) {
                logger.error(e)
                message.msg = 'fail';
                res.write(JSON.stringify(message));
                res.end();
                return;
            }
        }
    }
    ,
//删除数据库记录
    deleteAction: function (req, res, action) {
        var message = {};
        var id = req.body.ID;
        if (id != undefined && id != null && id != "") {
            var sql = "DELETE  FROM sys_mtree  WHERE id = " + id
            query(sql, function (err, result) {
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
    }
    ,
//批量数据库操作
    batchDeleteAction: function (req, res, action) {

    }
    ,
//下载文件
    downloadAction: function (req, res, action) {
    }
    ,
    /**
     * 加载MTree
     */
    MtreeJson: function (req, res) {
        var user = req.session.user;
        var domainIds = GlobalAgent.getUserDomain(user.USER_ID);
        // if (user.IS_SYSTEM != 1 && (!domainIds || domainIds.length < 1)) {
        //     logger.error('用户ID:' + user.USER_ID + '， 名称:' + user.USER_NAME + ' 不属于任何一个域')
        //     res.json([]);
        //     return;
        // }
        var id = req.body.id;
        var pid = "IS NULL"
        if (id) {
            pid = "=" + id;
        } else {
            pid = "IS NULL"
        }
        var companyId = req.session.user.ENTERPRISE_ID;
        var sql = " SELECT tree.ID as id , tree.MTREE_SOURCE AS value, tree.PID as parentid ,CASE WHEN tree.PID " + pid + " THEN tree.NAME ELSE 'Loading...' END AS NAME," +
            "  LINK_ID, URI, tree.DESCRIPTION FROM sys_mtree tree  WHERE tree.COMPANY_ID = " +
            companyId + " and (tree.PID " + pid + " OR tree.ID IN ( SELECT MAX(ID) FROM sys_mtree WHERE PID IN (SELECT ID FROM sys_mtree WHERE COMPANY_ID =" + companyId + " and PID " + pid + ") GROUP BY PID  )) ORDER BY ORDER_CODE,ID";
        var sqlDomain;
        // var sqlLink =" SELECT tree.ID as id , tree.PID AS value, tree.PID as parentid ,CASE WHEN tree.PID " + pid + " THEN tree.NAME ELSE 'Loading...' END AS NAME," +
        //     "  LINK_ID, URI, tree.DESCRIPTION, tree.IS_SYSTEM, IS_LEAF, IS_DELETED FROM sys_mtree  tree " +
        //     "  WHERE COMPANY_ID = " + companyId + "  and ID IN (SELECT MAX(ID) FROM sys_mtree WHERE PID IN (SELECT LINK_ID FROM  sys_mtree WHERE PID " + pid + ")) "
        if (user.IS_SYSTEM == 1 || id) {
            sql = " SELECT tree.ID as id ,tree.MTREE_SOURCE AS value, tree.PID as parentid ,CASE WHEN tree.PID " + pid + " THEN tree.NAME ELSE 'Loading...' END AS NAME," +
                "  LINK_ID, URI, tree.DESCRIPTION FROM sys_mtree tree  WHERE  tree.PID " +
                pid + " OR tree.ID IN ( SELECT MAX(ID) FROM sys_mtree WHERE PID IN (SELECT ID FROM sys_mtree  WHERE PID " + pid + ") GROUP BY PID ) ORDER BY ORDER_CODE,ID";
            // sqlLink = " SELECT tree.ID as id , tree.PID AS value, tree.PID as parentid ,CASE WHEN tree.PID " + pid + " THEN tree.NAME ELSE 'Loading...' END AS NAME," +
            //     "  LINK_ID, URI, tree.DESCRIPTION, tree.IS_SYSTEM, IS_LEAF, IS_DELETED FROM sys_mtree  tree " +
            //     "  WHERE ID IN (SELECT MAX(ID) FROM sys_mtree WHERE PID IN (SELECT LINK_ID FROM  sys_mtree WHERE PID " + pid + ")) ";
        }
        // sql =sql +' UNION ALL ' + sqlLink;
        logger.debug('获取用户Mtree资源sql:' + sql);
        async.waterfall(
            [
                function (callback) {
                    logger.debug('获取用户Mtree资源sql:' + sql);
                    query(sql, function (err, rows, columns) {
                        if (err) {
                            logger.error('获取用户Mtree资源错误：' + err);
                            res.json([]);
                            return;
                        } else {
                            for (var i in rows) {
                                var row = rows[i];
                                if (row.value == 1) {
                                    row.icon = '/images/domain.png';
                                } else {
                                    row.icon = '/images/mtree.png';
                                }
                                rows[i] = row;
                            }

                            if (user.IS_SYSTEM != 1) {
                                callback(null, rows);
                            } else {
                                res.json(rows);
                                return;
                            }
                        }
                    });
                },
                function (drr, callback) {
                    if (!domainIds || domainIds.length < 1) {
                        for (var i in drr) {
                            var row = drr[i];
                            row.disabled = true;
                            drr[i] = row;
                            res.json(drr);
                            return;
                        }
                    }
                    sqlDomain = "select id,URI from sys_mtree where DOMAIN_ID in (" + domainIds.toString() + ")"
                    logger.debug('获取用户Mtree 域资源sql:' + sqlDomain);
                    query(sqlDomain, function (err, rows, columns) {
                        if (err) {
                            logger.error('获取用户Mtree 域资源错误：' + err);
                            res.json([]);
                            return;
                        } else {
                            for (var i in drr) {
                                var row = drr[i];
                                row.disabled = true;
                                for (var j in rows) {
                                    if (rows[j].URI.indexOf(row.URI + '/') > -1 || rows[j].URI == row.URI) {
                                        row.disabled = false;
                                        break;
                                    }
                                }
                                drr[i] = row;
                            }
                        }
                        res.json(drr);
                        return;
                    });
                }
            ],
            function (err) {
                if (err) {
                    logger.error('获取用户Mtree资源错误：' + err);
                    res.json([]);
                    return;
                }
            }
        )

    }
    ,
    pointList: function (req, res) {
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
        var sql = 'select ID,UUID,POINT_ID,POINT_NAME,UNIT,POINT_TYPE,DESCRIPTION,COMPRESS_TYPE from sys_point where mtree_id in(SELECT ID FROM sys_mtree WHERE URI LIKE (SELECT CONCAT(URI,"%") FROM sys_mtree  WHERE ID = ' + treeID + ')) and ENTERPRISE_ID = ' + companyId;
        logger.debug('查询点list sql：' + sql);
        query(sql, function (err, rows, columns) {
            if (rows.length != 0 && err == null) {
                result.total = rows.length;
                if (err == null) {
                    query(sql + " limit " + offset + "," + limit, function (err, rows, columns) {
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
    /**
     * 数据库添加点信息
     */
    addProjectPoint: function (req, res, cation) {
        var mtreeId = req.body.mtreeId;
        var user = req.session.user;
        var company_ID = user.ENTERPRISE_ID;
        //通过mtreeId获取URI从而生成uuid
        if (!mtreeId) {
            logger.error("mtreeId不存在");
            message.flag = -1;
            message.message = '请选择父节点';
            res.send(message);
            return;
        }
        var sql = 'SELECT URI FROM sys_mtree WHERE ID = ' + mtreeId;
        logger.debug('获取URI的sql:' + sql);
        query(sql, function (err, rows, columns) {
            if (rows.length != 0 && err == null) {
                //为实时库插入准备列名和行值
                var cols = [];
                var row = [];
                var pointPN = req.body.pointPN.toUpperCase();
                var pattern = /^[A-Za-z0-9_\u4e00-\u9fa5]+$/;
                var result = pointPN.match(pattern);
                if (result == null || result.length != 1) {
                    message.flag = -1;
                    message.message = '点名只能是数字、字母和下划线';
                    res.json(message);
                    return;
                }
                cols.push(["ID", OPAPI.TYPE.INT32]);
                row.push(configUtils.getPointIDNext());
                // cols.push(["ND", OPAPI.TYPE.INT32]);
                // row.push(1);
                cols.push(["UD", OPAPI.TYPE.INT64]);
                var pointURI = rows[0].URI + '/' + pointPN;
                var uuid = opPool.makeUUID(pointURI);
                row.push('0x' + uuid);
                cols.push(["GN", OPAPI.TYPE.STRING]);
                row.push('W3.NODE.' + uuid.toString());
                uuid = '0x' + uuid
                var pointTN = pointPN;
                cols.push(["TN", OPAPI.TYPE.STRING]);
                row.push(pointTN);
                var pointRT = req.body.pointRT;
                cols.push(["RT", OPAPI.TYPE.INT8]);
                row.push(pointRT);
                var pointAN = req.body.pointAN;
                if (pointAN) {
                    cols.push(["AN", OPAPI.TYPE.STRING]);
                    row.push(pointAN);
                } else {
                    cols.push(["AN", OPAPI.TYPE.STRING]);
                    row.push('');
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
                var pointKZ = req.body.pointKZ;
                if (pointKZ) {
                    cols.push(["KZ", OPAPI.TYPE.INT8]);
                    row.push(pointKZ);
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
                var pointRows = [];
                async.waterfall(
                    [
                        function (callback) {
                            var sql = 'select count(ID) as count from Point where UD = ' + uuid;
                            logger.debug('查询点名是否存在sql:' + sql);
                            opPool.query(sql, function (err, rows) {
                                if ((err && err.code)) {
                                    logger.error('获取测点信息失败：' + JSON.stringify(err));
                                    message.flag = -1;
                                    message.message = '查询点信息错误';
                                    res.json(message);
                                    return;
                                } else if (rows[0] && rows[0].count > 0) {
                                    message.flag = -1;
                                    message.message = '当前节点下，测点名已存在';
                                    res.json(message);
                                    return;
                                } else {
                                    callback(null);
                                }
                            });
                        },
                        function (callback) {
                            var sql = 'select DOMAIN_ID from sys_mtree where ID=' + mtreeId;
                            logger.debug('获取当前节点所属的域sql：' + sql);
                            query(sql, function (err, rows) {
                                if (err) {
                                    logger.error('获取当前节点所属域信息错误：' + err);
                                    message.flag = -1;
                                    message.message = '获取域信息错误';
                                    res.json(message);
                                    return;
                                } else if (rows && rows.length < 1) {
                                    message.flag = -1;
                                    message.message = '当前节点不属于任何域，请确认';
                                    res.json(message);
                                    return;
                                } else {

                                    var domainId = GlobalAgent.getUserDomain(user.USER_ID);
                                    if (domainId.indexOf(rows[0].DOMAIN_ID) < 0) {
                                        message.flag = -1;
                                        message.message = '不具有在该节点下添加测点的权限';
                                        res.send(message);
                                        return;
                                    }
                                    //将测点对应的KR字段设置为对应节点所属的域
                                    cols.push(["KR", OPAPI.TYPE.STRING]);
                                    row.push(rows[0].DOMAIN_ID);
                                    cols.push(["HW", OPAPI.TYPE.INT32]);
                                    row.push(company_ID);
                                    pointRows.push(row);
                                    callback(null, rows[0].DOMAIN_ID);
                                }
                            });
                        },
                        function (domainId, callback) {
                            opPool.insert('Point', pointRows, cols, function (err, rows, columns) {
                                if (err && err.code || rows[0].EC != 0) {
                                    logger.error('插入测点错误:' + (JSON.stringify(err) || rows[0].EC));
                                    message.flag = -1;
                                    message.message = '编辑点失败';
                                    res.send(message);
                                    return;
                                } else {
                                    var pointID = rows[0].ID;
                                    callback(null, pointID, domainId);
                                }
                            });
                        },
                        function (pointID, domainId, callback) {
                            var tagID = UUID.v1();
                            var sqlPoint = sqlQuery.insert().into('sys_point').set({
                                ID: tagID,
                                POINT_ID: pointID,
                                UUID: uuid,
                                POINT_NAME: pointTN,
                                URI: pointURI,
                                MTREE_ID: mtreeId,
                                POINT_TYPE: pointRT,
                                UNIT: pointEU,
                                DESCRIPTION: pointED,
                                ENTERPRISE_ID: company_ID,
                                DOMAIN_ID: domainId,
                                COMPRESS_TYPE: pointKZ,
                                CREATE_DATE: Utils.dateFormat(new Date().getTime(), Utils.yyyyMMddhhmmss)
                            }).build();

                            logger.debug('插入测点信息sql：' + sqlPoint);
                            query(sqlPoint, function (err, result) {
                                if (err) {
                                    logger.error('插入点到关系数据库：' + err);
                                    message.flag = -1;
                                    message.message = '插入关系库点信息数据失败';
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
                    function (err) {
                        if (err) {
                            message.flag = -1;
                            message.message = '插入测点失败';
                            res.json(message);
                            return;
                        } else {
                            message.flag = 0;
                            res.json(message);
                            return;
                        }
                    });
            }
            else {
                logger.error("uuid生成失败");
                message.flag = -1;
                message.message = 'uuid生成失败';
                res.send(message);
                return;
            }
        });
    }
    ,
    /*更新点信息*/
    updateProjectPoint: function (req, res, action) {
        var cols = [];
        var row = [];
        var pointID = req.body.pointID;
        cols.push(["ID", OPAPI.TYPE.INT32]);
        row.push(pointID);
        var pointAN = req.body.pointAN;
        if (pointAN) {
            cols.push(["AN", OPAPI.TYPE.STRING]);
            row.push(pointAN);
        } else {
            cols.push(["AN", OPAPI.TYPE.STRING]);
            row.push('');
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
        var pointKZ = req.body.pointKZ;
        if (pointKZ) {
            cols.push(["KZ", OPAPI.TYPE.INT8]);
            row.push(pointKZ);
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
        var rows = [];
        rows.push(row);
        async.waterfall(
            [
                function (callback) {
                    opPool.update('Point', rows, cols, function (error, rows, columns) {
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
                function (callback) {
                    var sqlPoint = sqlQuery.update().into('sys_point').set({
                        DESCRIPTION: pointED,
                        COMPRESS_TYPE: pointRT,
                        UPDATE_DATE: Utils.dateFormat(new Date().getTime(), Utils.yyyyMMddhhmmss)
                    }).where({
                        UUID: uuid
                    }).build();
                    query(sqlPoint, function (perr, result) {
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
            function (err) {
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

    }
    ,
    /**
     * 根据ID获取点信息
     * @param req
     * @param res
     * @param action
     */
    getPointInfo: function (req, res, action) {
        var pointID = req.body.pointID;
        var sql = 'select ID,UD,TN,RT,ED,FQ,FM,TV,BV,EU,KZ,EX,PT,AN,KT,AP,LC,H4,H3,ZH,HL,LL,ZL,L3,L4,CT,C1,C2,C3,C4,C5,C6,C7,C8 from Point where ID = ' + pointID;
        logger.debug('获取测点信息sql：' + sql);
        opPool.query(sql, function (error, rows, columns) {
            if (error && error.code) {
                logger.error('获取测点信息失败：' + JSON.stringify(error))
                message.flag = -1;
                message.message = '编辑点失败';
                message.data = null;
                res.send(message);
                return;
            } else {
                message.flag = 0;
                message.message = 'OK';
                message.data = rows;
                res.send(message);
                return;
            }
        });
    }
    ,
    /**
     * 删除点
     * @param req
     * @param res
     * @param action
     */
    removePoint: function (req, res, action) {
        var id = req.body.id;
        var UUID = req.body.UUID.toUpperCase();
        var pointID = req.body.pointID;
        if (id && pointID) {
            var ids = [];
            ids.push(parseInt(pointID));
            async.waterfall(
                [
                    function (callback) {
                        opPool.remove('Point', 'ID', ids, function (error, rows) {
                            if (error && error.code) {
                                logger.error('删除实时库测点错误:' + JSON.stringify(error));
                                message.flag = -1;
                                message.message = '删除点失败';
                                message.data = null;
                                res.send(message);
                                return;
                            } else {
                                callback(null);
                            }
                        });
                    },
                    function (callback) {
                        var sql = sqlQuery.remove().from('sys_point').where({
                            UUID: UUID
                        }).build();
                        logger.debug('删除测点sql:' + sql);
                        query(sql, function (cerr, result) {
                            if (cerr) {
                                logger.error('删除关系库测点错误:' + cerr);
                                message.flag = -1;
                                message.data = null;
                                message.message = '删除点失败';
                                res.send(message);
                            } else {
                                callback(null);
                            }
                        });
                    },
                    function (callback) {
                        var sql = sqlQuery.remove().from('sys_group_point').where({
                            POINT_ID: parseInt(pointID)
                        }).build();
                        logger.debug('删除点组sql:' + sql);
                        query(sql, function (err, result) {
                            message.flag = 0;
                            message.message = 'OK';
                            message.data = null;
                            res.send(message);
                            return;
                        });
                    }
                ],
                function (err) {
                    if (err) {
                        message.flag = -1;
                        message.message = '删除点失败';
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
    /**
     * 批量删除点
     * @param req
     * @param res
     * @param action
     */
    batchRemove_point: function (req, res, action) {
        var ids = req.body.ids;
        var UUIDs = req.body.UUIDs;
        if (ids) {
            //idsRemove 需要为整型数组，如[1008,1009]
            var idsRemoveStrArr = ids.split(','); //分割成字符串数组
            var idsRemoveIntArr = []; //保存转换后的整型字符串
            idsRemoveStrArr.forEach(function (data, index, arr) {
                idsRemoveIntArr.push(+data);
            });
            UUIDs = UUIDs.toUpperCase().split(',');
            async.waterfall(
                [
                    function (callback) {
                        opPool.remove('Point', 'ID', idsRemoveIntArr, function (error, rows) {
                            if (error) {
                                message.flag = -1;
                                message.data = null;
                                message.message = '删除点失败';
                                res.send(message);
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
                        query(sql, function (cerr, result) {
                            if (cerr) {
                                message.flag = -1;
                                message.data = null;
                                message.message = '删除点失败';
                                res.send(message);
                            } else {
                                callback(null);
                            }
                        });
                    },
                    function (callback) {
                        var sql = sqlQuery.remove().from('sys_group_point').where({
                            POINT_ID: idsRemoveIntArr
                        }).build();
                        logger.debug('删除点组sql:' + sql);
                        query(sql, function (err, result) {
                            message.flag = 0;
                            message.message = 'OK';
                            message.data = null;
                            res.send(message);
                            return;
                        });
                    }
                ],
                function (err) {
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
    importFile: function (req, res, action) {
        var form = new formidable.IncomingForm(); //创建上传表单
        form.encoding = 'utf-8'; //设置编辑
        form.uploadDir = './public/upload/'; //设置上传目录
        form.keepExtensions = true; //保留后缀
        form.maxFieldsSize = 2 * 1024 * 1024; //文件大小
        form.parse(req, function (err, fields, files) {
            if (err) {
                logger.error('导入文件错误：' + err);
                message.flag = -1;
                message.message = '导入文件出错，请再次导入';
                res.send(message);
                return;
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
            try {
                var data = xlsx.parse("./" + newPath);
            } catch (e) {
                logger.error('读取文件错误：' + e);
                message.flag = -1;
                message.data = null;
                message.message = '解析文件错误';
                res.send(message);
                return;
            }
            /*
             *TODO   解析json到对应数据库表里的字段
             */
            var data = data[0]['data'];
            var sheetNum = data.length;
            var titles = data[0];
            var titleSize = titles.length;
            var cols = [];
            var containID = false;
            var user = req.session.user;
            var company_ID = user.ENTERPRISE_ID;
            var pnIndex = -1;
            cols.push(["KR", OPAPI.TYPE.STRING]);
            cols.push(["HW", OPAPI.TYPE.INT32]);
            for (var i = 0; i < titleSize; i++) {
                var title = titles[i];
                switch (title) {
                    case 'ID':
                        cols.push(["ID", OPAPI.TYPE.INT32]);
                        containID = true;
                        break;
                    case 'PN':
                        cols.push(["GN", OPAPI.TYPE.STRING]);
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
                    case 'KZ':
                        cols.push(["KZ", OPAPI.TYPE.INT8]);
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
            if (cols.length < 2) {
                message.flag = -1;
                message.message = '模板错误，请检查模板';
                res.send(message);
                return;
            }
            var rows = [];
            var pointID = configUtils.getPointIDNext(sheetNum - 1);
            //准备uuid列表
            cols.unshift(["UD", OPAPI.TYPE.INT64]);
            var uuids = []; //记录uuid列表，为后续关系库插入所准备
            var tns = []; //记录pointName为插入关系表sys_point准备
            var uris = []; //记录pointURI为插入关系表sys_point准备
            //通过mtreeId获取URI从而生成uuid
            if (pnIndex < 0) {
                message.flag = -1;
                message.data = null;
                message.message = '缺少PN关键字段';
                res.send(message);
                return;
            }
            if (!mtreeId) {
                logger.error("mtreeId不存在");
                message.flag = -1;
                message.data = null;
                message.message = '请选择父节点';
                res.send(message);
                return;
            }
            async.waterfall([
                    function (callback) {
                        var sql = 'SELECT ID,URI,DOMAIN_ID FROM sys_mtree WHERE ID = ' + mtreeId;
                        query(sql, function (merr, mRows, mColumns) {
                            if (mRows.length != 0 && err == null) {
                                if (!containID) {
                                    cols.unshift(["ID", OPAPI.TYPE.INT32]);
                                }
                                for (var j = 1; j < sheetNum; j++) {
                                    var pnn = data[j][pnIndex];
                                    if (!pnn) {
                                        message.flag = -1;
                                        message.message = '第' + (j + 1) + '行PN字段不能为空';
                                        res.json(message);
                                        return;
                                    }
                                    var pattern = /^[A-Za-z0-9_\u4e00-\u9fa5]+$/;
                                    var result = pnn.match(pattern);
                                    if (result == null || result.length != 1) {
                                        message.flag = -1;
                                        message.message = '点名:' + pnn + '不符合要求，只能是数字、字母和下划线';
                                        res.json(message);
                                        return;
                                    }
                                    uris.push(mRows[0].URI + '/' + data[j][pnIndex]);
                                    var uuid = opPool.makeUUID(mRows[0].URI + '/' + data[j][pnIndex]);
                                    if (uuids.indexOf('0x' + uuid) > -1) {
                                        message.flag = -1;
                                        message.data = null;
                                        message.message = '点名：' + data[j][pnIndex] + '重复';
                                        res.send(message);
                                        return;
                                    }
                                    uuids.push('0x' + uuid);
                                    var row = [];
                                    for (var t = 0; t < titleSize; t++) {
                                        if (pnIndex == t) {
                                            row.push('W3.NODE.' + uuid); //pn
                                            tns.push(data[j][t]); //记录pointName为插入关系表sys_point准备
                                            continue;
                                        }
                                        row.push(data[j][t]);
                                    }
                                    row.unshift(company_ID);
                                    row.unshift(mRows[0].DOMAIN_ID);
                                    row.unshift('0x' + uuid);
                                    if (!containID) {
                                        row.unshift(pointID + j - 1);
                                    }
                                    rows.push(row);
                                }
                                if (rows.length < 1) {
                                    message.flag = -1;
                                    message.data = null;
                                    message.message = '文件中没有数据，请确认';
                                    res.send(message);
                                    return;
                                }
                                var domainId = GlobalAgent.getUserDomain(user.USER_ID);
                                if (domainId.indexOf(mRows[0].DOMAIN_ID) < 0) {
                                    message.flag = -1;
                                    message.message = '不具有在该节点下导入文件的权限';
                                    res.send(message);
                                    return;
                                }
                                callback(null, rows, cols, mRows[0]);
                            } else {
                                message.flag = -1;
                                message.data = null;
                                message.message = '没找到对应的节点';
                                res.send(message);
                                return;
                            }
                        });
                    },
                    function (rr, cols, tt, callback) {
                        var sql = sqlQuery.select().from('sys_point').select('ID', 'POINT_NAME').where({URI: uris}).build();
                        logger.debug('查询点名是否存在sql:' + sql);
                        query(sql, function (error, rows) {
                            if (error) {
                                logger.error('获取测点信息失败：' + error);
                                message.flag = -1;
                                message.message = '查询点信息失败';
                                message.data = null;
                                res.send(message);
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
                                message.data = null;
                                message.message = '点名为：' + pns + '的点存在于当前节点下';
                                res.send(message);
                                return;
                            } else {
                                callback(null, rr, cols, tt);
                            }
                        });
                    },
                    function (rr, cols, tt, callback) {
                        opPool.insert('Point', rr, cols, function (error, rows, columns) {
                            if (error) {
                                message.flag = -1;
                                message.data = null;
                                message.message = '插入点失败';
                                res.send(message);
                                return;
                            } else {
                                callback(null, rows, tt);
                            }
                        });
                    },
                    function (rows, tt, callback) {
                        var idStart = -1;
                        var idEnd = -1;
                        var size = rows.length;
                        if (size) {
                            idStart = rows[0].ID;
                            idEnd = rows[size - 1].ID;
                        }
                        var sqlPoint = 'select ID,PN,ED,EU,RT,KZ from point where ID >= ' + idStart + ' and ID <= ' + idEnd;
                        logger.debug('查询实时库point表sql为：' + sqlPoint);
                        opPool.query(sqlPoint, function (perr, rows, columns) {
                            if (perr) {
                                message.flag = -1;
                                message.data = null;
                                message.message = '获取数据实时数据失败';
                                res.send(message);
                                return;
                            } else {
                                callback(null, rows, tt);
                            }
                        });
                    },
                    function (rows, tt, callback) {
                        var sqlPoints = 'insert into sys_point (`ID`,`POINT_ID`, `UUID`, `URI`, `MTREE_ID`, `POINT_NAME`, `UNIT`, `POINT_TYPE`,`DESCRIPTION`,`COMPRESS_TYPE`,`CREATE_DATE`,`DOMAIN_ID`,`ENTERPRISE_ID`)';
                        var sqlValue = '';
                        var size = rows.length;
                        for (var i = 0; i < size; i++) {
                            var tagID = UUID.v1();
                            var row = rows[i];
                            sqlValue += '(';
                            sqlValue += '\'' + tagID + '\',';
                            sqlValue += row.ID + ',';
                            sqlValue += '\'' + uuids[i] + '\',';
                            sqlValue += '\'' + uris[i] + '\',';
                            sqlValue += mtreeId + ',';
                            sqlValue += '\'' + tns[i] + '\',';
                            sqlValue += '\'' + row.EU + '\',';
                            sqlValue += row.RT + ',';
                            sqlValue += '\'' + row.ED + '\',';
                            sqlValue += row.KZ + ',';
                            sqlValue += '\'' + Utils.dateFormat(new Date().getTime(), Utils.yyyyMMddhhmmss) + '\',';
                            sqlValue += tt.DOMAIN_ID + ',';
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
                        query(sqlPoints, function (perr, result, columns) {
                            if (perr) {
                                logger.error('插入测点到关系库错误：' + perr);
                                message.flag = -1;
                                message.data = null;
                                message.message = '插入点信息失败';
                                res.send(message);
                                return;
                            }
                            message.flag = 0
                            message.data = null;
                            message.message = 'OK';
                            res.send(message);
                            return;
                        });
                    }
                ],
                function (err) {
                    if (err) {
                        message.flag = -1;
                        message.data = null;
                        message.message = '批量插入点失败';
                        res.json(message);
                        return;
                    } else {
                        message.flag = 0;
                        message.data = null;
                        message.message = 'OK';
                        res.json(message);
                        return;
                    }
                });
        });
    },

    /**
     * 获取点组信息
     * @param req
     * @param res
     * @param action
     */
    pointGroupList: function (req, res, action) {
        var userId = req.session.user.USER_ID;
        var sql = 'select ID, GROUP_NAME from sys_point_group where USER_ID = ' + userId;
        query(sql, function (err, rows, columns) {
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
    /**
     * 添加到点组
     * @param req
     * @param res
     * @param action
     */
    addPointToGroup: function (req, res, action) {
        var pointId = req.body.pointId;
        var pointName = req.body.pointName;
        var groupId = req.body.groupId;
        var groupName = req.body.groupName;

        async.waterfall([
            //检查是否已经添加到该组
            function (callback) {
                var sqlCount = 'select count(GROUP_ID) tempSum from sys_group_point where GROUP_ID = ' + groupId + ' and POINT_ID = ' + pointId;
                logger.debug('添加点到点组检查是否存在sql:' + sqlCount)
                query(sqlCount, function (err, rows, columns) {
                    if (err) {
                        logger.error('查询点个数错误：' + err);
                        message.flag = -1;
                        message.message = '查询是否存在该点失败';
                        message.data = null;
                        res.send(message);
                        return;
                    } else {
                        if (rows[0].tempSum == 0) {
                            callback(null);
                        } else {
                            message.flag = -1;
                            message.message = '测点在' + groupName + '中已经存在';
                            message.data = null;
                            res.send(message);
                            return;
                        }
                    }
                });
            },
            //上一步通过，不存在，进行添加
            function (callback) {
                var sql = 'insert into sys_group_point (GROUP_ID,POINT_ID,POINT_NAME,CREATE_DATE)' +
                    ' values (' + groupId + ',' + pointId + ',"' + pointName + '","' + Utils.dateFormat(new Date().getTime(), Utils.yyyyMMddhhmmss) + '")';
                query(sql, function (err, rows, columns) {
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
        ], function (err) {
            message.flag = -1;
            message.message = err;
            res.json(message);
            return;
        });
    },
    /**
     * 批量添加测点到点组
     * @param req
     * @param res
     */
    batchAddPointToGroup: function (req, res) {
        var pointIds = req.body.pointIds;
        var pns = req.body.pns;
        var groupName = req.body.groupName;
        if (pointIds) {
            pointIds = pointIds.split(',');
        }
        if (!pointIds || pointIds.length < 1) {
            message.flag = -1;
            message.message = '请选择点';
            message.data = null;
            res.send(message);
            return;
        }
        pns = pns.split(',');
        var groupId = req.body.groupId;
        async.waterfall([
            //检查是否已经添加到该组
            function (callback) {
                var sqlCount = 'select distinct POINT_ID from sys_group_point where GROUP_ID = ' + groupId + ' and POINT_ID in (' + pointIds.toString() + ')';
                logger.debug('添加点到点组检查是否存在sql:' + sqlCount);
                query(sqlCount, function (err, rows, columns) {
                    if (err) {
                        logger.error('查询点个数错误：' + err);
                        message.flag = -1;
                        message.message = '查询是否存在该点失败';
                        message.data = null;
                        res.send(message);
                        return;
                    } else {
                        if (rows && rows.length < 1) {
                            callback(null);
                        } else {
                            var GNS = [];
                            for (var i in rows) {
                                var index = pointIds.indexOf(rows[i].POINT_ID.toString());
                                GNS.push(pns[index]);
                            }
                            message.flag = -1;
                            message.message = '测点:' + GNS.toString() + '在点组:' + groupName + '中已经存在';
                            message.data = null;
                            res.send(message);
                            return;
                        }
                    }
                });
            },
            //上一步通过，不存在，进行添加
            function (callback) {
                var sql = 'insert into sys_group_point (GROUP_ID,POINT_ID,CREATE_DATE) values ';
                var size = pointIds.length;
                for (var i = 0; i < size; i++) {
                    var sqlTemp = ' (' + groupId + ',' + pointIds[i] + ',"' + Utils.dateFormat(new Date().getTime(), Utils.yyyyMMddhhmmss) + '")';
                    sql += sqlTemp;
                    if (pointIds[i + 1]) {
                        sql += ',';
                    }
                }
                logger.debug('向点组中添加测点sql:' + sql);
                query(sql, function (err, rows, columns) {
                    if (err || (rows.affectedRows <= 0)) {
                        logger.debug('批量添加到点组错误：' + err);
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
        ], function (err) {
            message.flag = -1;
            message.message = err;
            res.json(message);
            return;
        });
    }
};

module.exports = domainManage;
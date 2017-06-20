var fs = require('fs');
var actionUtil = require("../../framework/action/actionUtils")();
var Utils = require('../../utils/tools/utils');
var GlobalAgent = require('../../message/GlobalAgent');
var transaction = actionUtil.transaction;
var fileUtils = require("../../utils/tools/fileUtils");
var configConst = require('../../utils/tools/configConst');
var async = require("async");
var query = actionUtil.query;
var logger = require('log4js').getLogger('system');
var sql = require('sql-query');
var sqlQuery = sql.Query();
var uuid = require('node-uuid');
var OPAPI = require('opapi');
var opPool = require('../../openplant/openPlantPool');
var message = {
    flag: 0,
    message: 'OK',
    data: null
}
domain_manage = {
    //ajax 访问数据方式，主要用于数据分页
    getDomainList: function (req, res) {
        var user = req.session.user;
        var isSystem = user.IS_SYSTEM;
        var sql = '';
        if (isSystem == 1) {
            sql = 'SELECT DOMAIN_ID,PRE_DOMAIN_ID,URI,NAME,IS_ENABLE,DESCRIPTION,ADMIN_USER,1 as EDIT,1 as canAdd FROM sys_domain WHERE IS_DELETED =0 ';
            logger.debug('查询超级管理员Domian信息sql:' + sql);
            query(sql, function (err, rows, columns) {
                if (err) {
                    logger.error('查询超级管理员Domain信息错误：' + err);
                    res.json([]);
                } else {
                    res.json(rows);
                }
            });
        } else {
            var companyId = user.ENTERPRISE_ID;
            var userId = user.USER_ID;
            sql = 'SELECT DOMAIN_ID,PRE_DOMAIN_ID,URI,NAME,IS_ENABLE,DESCRIPTION,ADMIN_USER,0 as EDIT FROM sys_domain WHERE IS_DELETED =0 and (URI LIKE (select CONCAT(URI,"/%") from sys_domain where DOMAIN_ID in (SELECT DOMAIN_ID from sys_enterprise where ENTERPRISE_ID = ' + companyId + ')) or ' +
                'URI in (select URI from sys_domain where DOMAIN_ID in (SELECT DOMAIN_ID from sys_enterprise where ENTERPRISE_ID = ' + companyId + ')))'
            logger.debug('查询非超级管理员的Domain信息sql:' + sql);
            query(sql, function (err, rows, columns) {
                if (err) {
                    logger.error('获取domain信息错误：' + err);
                    res.json([]);
                } else {
                    var adminArray = new Array();
                    for (var i in rows) {
                        var row = rows[i];
                        row.canAdd = 0;
                        if (row.ADMIN_USER == userId) {
                            adminArray.push(row);
                            row.canAdd = 1
                            rows[i] = row;
                        }
                    }
                    if (adminArray.length < 1) {
                        res.json(rows);
                        return;
                    }
                    //管理员只能修改 该域子域的信息
                    for (var i  in rows) {
                        var row = rows[i];
                        for (var j in adminArray) {
                            var admin = adminArray[j];
                            if (row.URI.indexOf(admin.URI + '/') > -1) {
                                row.EDIT = 1;
                                if (admin.canAdd == 1) {
                                    row.canAdd = 1;
                                }
                                rows[i] = row;
                            }
                        }
                    }
                    res.json(rows);
                }
            });

        }
    },
    //创建对象
    addDomain: function (req, res) {
        var user = req.session.user;
        var path = configConst.filePath + '/' + user.ENTERPRISE_ID + '/resources';
        var preId = req.body.preId;
        if (!preId) {
            message.flag = -1;
            message.message = '上级域ID不能为空';
            message.data = null;
            res.json(message);
            return;
        }
        var addName = req.body.addName;
        if (!addName) {
            message.flag = -1;
            message.message = '域名称不能为空';
            message.data = null;
            res.json(message);
            return;
        }
        var isEnable = req.body.isEnable;
        if (isEnable.toString().toLowerCase() == 'true') {
            isEnable = 1;
        } else {
            isEnable = 0;
        }
        var userId = req.body.userId;
        if (!userId) {
            message.flag = -1;
            message.message = '管理员不能为空';
            message.data = null;
            res.json(message);
            return;
        }
        var addDesc = req.body.addDesc;
        var canEdit = userId == user.USER_ID ? 1 : 0;
        transaction(function (err, conn) {
            if (err) {
                logger.error("transaction ERROR" + err);
                message.flag = -1;
                message.message = '创建域失败';
                message.data = null;
                res.json(message);
                return;
            } else {
                async.waterfall([
                    function (callback) {
                        var sql = 'select count(domain_id) as count from sys_domain where IS_DELETED =0 and pre_domain_id = ' + preId + ' and name = "' + addName + '"';
                        logger.debug('获取相同节点下是否有同名节点sql:' + sql);
                        conn.query(sql, function (err, rows) {
                            if (err) {
                                message.flag = -1;
                                message.message = '查询同名域出错';
                                message.data = null;
                                res.json(message);
                                return;
                            } else if (rows.length > 0 && rows[0].count > 0) {
                                logger.debug(rows);
                                message.flag = -1;
                                message.message = '当前域下已存在该名称的子域';
                                message.data = null;
                                res.json(message);
                                return;
                            } else {
                                callback(null);
                            }
                        });
                    },
                    function (callback) {
                        var sql = sqlQuery.select().from('sys_domain').select('DOMAIN_ID', 'URI', 'IS_ENABLE').where({domain_id: preId}).build();
                        logger.debug('获取上级域的基本信息sql：' + sql);
                        conn.query(sql, function (err, rows, columns) {
                            if (err) {
                                logger.debug('获取上级域信息错误：' + err);
                                message.flag = -1;
                                message.message = '获取上级域信息失败';
                                message.data = null;
                                res.json(message);
                            } else {
                                callback(null, rows[0]);
                            }
                        });
                    },
                    function (row, callback) {
                        var sql = 'SELECT count(ID) as count from sys_mtree where MTREE_SOURCE !=1  and name = "' + addName + '" and PID in (SELECT ID from sys_mtree where URI ="' + row.URI + '")';
                        logger.debug('获取该域下面是否有同名的节点:' + sql);
                        conn.query(sql, function (err, rows) {
                            if (err) {
                                message.flag = -1;
                                message.message = '查询同名节点出错';
                                message.data = null;
                                res.json(message);
                                return;
                            } else if (rows.length > 0 && rows[0].count > 0) {
                                message.flag = -1;
                                message.message = '当前域下已存在同名的节点';
                                message.data = null;
                                res.json(message);
                                return;
                            } else {
                                callback(null, row);
                            }
                        });
                    },
                    function (row, callback) {
                        var sql = sqlQuery.select().from('sys_mtree').select('ID').where({URI: row.URI}).build();
                        logger.debug('获取上级节点信息sql:' + sql);
                        conn.query(sql, function (err, rows, cloumns) {
                            if (err) {
                                logger.error('获取上级节点信息错误：' + err);
                                message.flag = -1;
                                message.message = '获取上级节点信息失败';
                                message.data = null;
                                res.json(message);
                                return;
                            } else if (rows.length < 1 || !rows[0].ID) {
                                message.flag = -1;
                                message.message = '上级节点不存在，请检查';
                                message.data = null;
                                res.json(message);
                                return;
                            } else {
                                callback(null, row, rows[0].ID);
                            }
                        });
                    },
                    function (row, PID, callback) {
                        if (row.IS_ENABLE == 0) {
                            isEnable = 0;
                        }
                        var sql = sqlQuery.insert().into('sys_domain').set({
                            PRE_DOMAIN_ID: preId,
                            name: addName,
                            URI: row.URI + '/' + addName,
                            DOMAIN_CODE: uuid.v1(),
                            IS_ENABLE: isEnable,
                            PRE_ENABLE: isEnable,
                            DESCRIPTION: addDesc,
                            ADMIN_USER: userId,
                            COMPANY_ID: user.ENTERPRISE_ID,
                            CREATE_USER: user.USER_ID,
                            CREATE_DATE: Utils.dateFormat(new Date().getTime(), Utils.yyyyMMddhhmmss)
                        }).build();
                        logger.debug('创建域sql:' + sql);
                        conn.query(sql, function (err, rows) {
                            if (err) {
                                logger.error('创建域错误：' + err);
                                message.flag = -1;
                                message.message = '创建域出错';
                                message.data = null;
                                res.json(message);
                                return;
                            } else {
                                callback(null, rows.insertId, row, PID);
                            }
                        });
                    },
                    function (domainId, row, PID, callback) {
                        var sql = sqlQuery.insert().into('sys_user_domain').set({
                            DOMAIN_ID: domainId,
                            USER_ID: userId,
                            CREATE_USER: user.USER_ID,
                            IS_ADMIN: 1,
                            CREATE_DATE: Utils.dateFormat(new Date().getTime(), Utils.yyyyMMddhhmmss)
                        }).build();
                        logger.debug('创建用户与域关联sql:' + sql);
                        conn.query(sql, function (err, rows) {
                            if (err) {
                                logger.error('创建用户与域关联错误：' + err);
                                message.flag = -1;
                                message.message = '创建用户与域关联出错';
                                message.data = null;
                                res.json(message);
                                return;
                            } else {
                                callback(null, domainId, row, PID);
                            }
                        });
                    },
                    function (domainId, row, PID, callback) {
                        var sql = sqlQuery.insert().into('sys_mtree').set({
                            PID: PID,
                            MTREE_SOURCE: 1,
                            DOMAIN_ID: domainId,
                            NAME: addName,
                            URI: row.URI + '/' + addName,
                            DESCRIPTION: addDesc,
                            COMPANY_ID: user.ENTERPRISE_ID,
                            CREATE_DATE: Utils.dateFormat(new Date().getTime(), Utils.yyyyMMddhhmmss)
                        }).build();
                        logger.debug('创建域时创建节点sql:' + sql);
                        conn.query(sql, function (err, rows) {
                            if (err) {
                                logger.error('创建域时创建节点错误：' + err);
                                message.flag = -1;
                                message.message = '创建域时创建节点出错';
                                message.data = null;
                                res.json(message);
                                return;
                            } else {
                                var domainFileURI = path + row.URI + '/' + addName;
                                fs.exists(domainFileURI, function (exists) {
                                    if (exists) {
                                        fileUtils.rmdirSync(domainFileURI);
                                        fs.mkdirSync(domainFileURI);
                                    }
                                    if (!exists) {
                                        fs.mkdirSync(domainFileURI);
                                    }
                                    message.flag = 0;
                                    message.message = 'OK';
                                    message.data = domainId;
                                    message.canEdit = canEdit;
                                    GlobalAgent.refreshUserDomain(user);
                                    res.json(message);
                                    delete  message.canEdit;
                                    return;
                                });

                            }
                        });
                    }
                ], function (err) {
                    if (err) {
                        message.flag = -1;
                        message.message = '添加域失败';
                        message.data = null;
                        res.json(message);
                        return;
                    }
                });
            }
        });
    },
    //修改数据库表
    updateDomain: function (req, res) {
        var id = req.body.id;
        if (!id) {
            message.flag = -1;
            message.message = '域ID不能为空';
            message.data = null;
            res.json(message);
            return;
        }
        var editEnable = req.body.editEnable;
        if (editEnable.toString().toLowerCase() == 'true') {
            editEnable = 1
        } else {
            editEnable = 0;
        }
        var editUserId = req.body.editUserId;
        if (!editUserId) {
            message.flag = -1;
            message.message = '管理员不能为空';
            message.data = null;
            res.json(message);
            return;
        }
        var user = req.session.user;
        var editDesc = req.body.editDesc;
        var time = Utils.dateFormat(new Date().getTime(), Utils.yyyyMMddhhmmss);
        var canEdit = editUserId == user.USER_ID ? 1 : 0;
        async.waterfall(
            [
                function (callback) {
                    var sql = 'select DOMAIN_ID,URI from sys_domain where DOMAIN_ID = ' + id;
                    logger.debug('获取对应的域信息sql:' + sql);
                    query(sql, function (error, rows) {
                        if (error) {
                            logger.error('获取域信息错误：' + error);
                            message.flag = -1;
                            message.data = null;
                            message.message = '获取域信息失败';
                            res.json(message);
                            return;
                        } else if (rows.length > 0) {
                            callback(null, rows[0]);
                        } else {
                            message.flag = -1;
                            message.data = null;
                            message.message = '没有对应的域信息';
                            res.json(message);
                            return;
                        }
                    });
                },
                function (row, callback) {
                    if (row.IS_ENABLE == 0) {
                        editEnable = 0;
                    }
                    var sql = sqlQuery.update().into('sys_domain').set({
                        IS_ENABLE: editEnable,
                        PRE_ENABLE: editEnable,
                        ADMIN_USER: editUserId,
                        description: editDesc,
                        UPDATE_DATE: time
                    }).where({domain_id: id}).build();
                    logger.debug('更新Domain信息sql:' + sql);
                    query(sql, function (err, result) {
                        if (err) {
                            logger.error('更新域信息错误：' + err);
                            message.flag = -1;
                            message.message = '更新域信息失败';
                            message.data = null;
                            res.json(message);
                            return;
                        } else {
                            callback(null, row);
                        }
                    });
                },
                function (row, callback) {
                    var sql = '';
                    if (editEnable == 0) {
                        sql = 'update sys_domain set PRE_ENABLE = IS_ENABLE,IS_ENABLE = 0 where IS_DELETED =0 and URI like "' + row.URI + '/%"';
                    } else {
                        sql = 'update sys_domain set IS_ENABLE = PRE_ENABLE where is_DELETED =0 and URI like "' + row.URI + '/%"';
                    }
                    logger.debug('更新该域对应的下属域信息sql：' + sql);
                    query(sql, function (error, rows) {
                        if (error) {
                            logger.error('更新域信息错误：' + error);
                            message.flag = -1;
                            message.message = '更新域信息失败';
                            message.data = null;
                            res.json(message);
                            return;
                        } else {
                            callback(null);
                        }
                    });
                },
                function (callback) {
                    var sql = sqlQuery.update().into('sys_user_domain').set({
                        USER_ID: editUserId,
                        UPDATE_DATE: time
                    }).where({domain_id: id, IS_ADMIN: 1}).build();
                    logger.debug('更新用户关联域信息sql:' + sql);
                    query(sql, function (err, result) {
                        if (err) {
                            logger.error('更新用户关联域信息错误：' + err);
                            message.flag = -1;
                            message.message = '更新用户关联域失败';
                            message.data = null;
                            res.json(message);
                            return;
                        } else {
                            callback(null);
                        }
                    });
                },
                function (callback) {
                    var sql = 'SELECT DOMAIN_ID,URI, NAME, IS_ENABLE FROM sys_domain WHERE IS_DELETED = 0 AND URI LIKE (SELECT CONCAT(URI, "/%") FROM sys_domain WHERE DOMAIN_ID = ' + id + ') ';
                    logger.debug('获取对应的子域信息sql:' + sql);
                    query(sql, function (error, rows) {
                        if (error) {
                            logger.error('获取对应的子域信息错误：' + error);
                            message.flag = -1;
                            message.message = '获取对应的子域信息失败';
                            message.data = null;
                            res.json(message);
                            return;
                        } else {
                            message.flag = 0;
                            message.message = 'OK';
                            message.data = rows;
                            res.json(message);
                            GlobalAgent.refreshUserDomain(user);
                            delete message.canEdit;
                            return;
                        }
                    });
                }
            ],
            function (err) {
                logger.error('更新域信息错误：' + err);
                message.flag = -1;
                message.message = '更新域信息失败';
                message.data = null;
                res.json(message);
                return;
            }
        )

    },
//删除数据库记录
    deleteDomain: function (req, res) {
        var id = req.body.id;
        if (!id) {
            message.flag = -1;
            message.message = '域ID不能为空';
            message.data = null;
            res.json(message);
            return;
        }
        var user = req.session.user;
        var path = configConst.filePath + '/' + user.ENTERPRISE_ID + '/resources';
        transaction(function (err, conn) {
            if (err) {
                logger.error("transaction ERROR" + err);
                message.flag = -1;
                message.message = '删除域失败';
                message.data = null;
                res.json(message);
                return;
            } else {
                async.waterfall([
                    function (callback) {
                        var sql = 'select count(domain_id) as count from sys_domain where IS_DELETED =0 and PRE_DOMAIN_ID = ' + id;
                        logger.debug('获取当前域上面的子域数量sql:' + sql);
                        conn.query(sql, function (err, rows) {
                            if (err) {
                                message.flag = -1;
                                message.message = '查询子域出错';
                                message.data = null;
                                res.json(message);
                                return;
                            } else if (rows.length > 0 && rows[0].count > 0) {
                                message.flag = -1;
                                message.message = '当前域下存在子域，请先删除子域';
                                message.data = null;
                                res.json(message);
                                return;
                            } else {
                                callback(null);
                            }
                        });
                    },
                    function (callback) {
                        var sql = 'select count(id) as count from sys_mtree where MTREE_SOURCE !=1 and domain_id = ' + id;
                        logger.debug('获取Mtree节点及子节点数量sql:' + sql);
                        conn.query(sql, function (err, rows, columns) {
                            if (err) {
                                logger.debug('获取Mtree节点数量错误：' + err);
                                message.flag = -1;
                                message.message = '获取Mtree节点数量失败';
                                message.data = null;
                                res.json(message);
                            } else if (rows.length > 0 && rows[0].count > 0) {
                                message.flag = -1;
                                message.message = '当前域下存在MTree子节点，请先删除子节点';
                                message.data = null;
                                res.json(message);
                                return;
                            } else {
                                callback(null, rows[0]);
                            }
                        });
                    },
                    function (row, callback) {
                        var sql = 'SELECT count(ID) as count from sys_point where DOMAIN_ID = ' + id;
                        logger.debug('获取该域节点下是否存在测点sql:' + sql);
                        conn.query(sql, function (err, rows) {
                            if (err) {
                                message.flag = -1;
                                message.message = '查询该域节点下测点出错';
                                message.data = null;
                                res.json(message);
                                return;
                            } else if (rows.length > 0 && rows[0].count > 0) {
                                message.flag = -1;
                                message.message = '当前域节点下存在测点，请先删除测点';
                                message.data = null;
                                res.json(message);
                                return;
                            } else {
                                callback(null);
                            }
                        });
                    },
                    function (callback) {
                        var sql = sqlQuery.update().into('sys_domain').set({
                            UPDATE_DATE: Utils.dateFormat(new Date().getTime(), Utils.yyyyMMddhhmmss),
                            IS_DELETED: 1
                        }).where({DOMAIN_ID: id}).build();
                        logger.debug('删除域信息sql:' + sql);
                        conn.query(sql, function (err, rows, cloumns) {
                            if (err) {
                                logger.error('删除域信息错误：' + err);
                                message.flag = -1;
                                message.message = '删除域信息失败';
                                message.data = null;
                                res.json(message);
                                return;
                            } else {
                                callback(null);
                            }
                        });
                    },
                    function (callback) {
                        var sql = 'SELECT DOMAIN_ID,URI from sys_domain where DOMAIN_ID = ' + id;
                        logger.debug('获取域信息sql:' + sql);
                        conn.query(sql, function (err, rows, cloumns) {
                            if (err) {
                                logger.error('获取域信息错误：' + err);
                                message.flag = -1;
                                message.message = '获取域信息失败';
                                message.data = null;
                                res.json(message);
                                return;
                            } else if (!rows || rows.length < 1) {
                                logger.error('获取域信息错误：' + err);
                                message.flag = -1;
                                message.message = '域不存在';
                                message.data = null;
                                res.json(message);
                                return;
                            } else {
                                callback(null, rows[0]);
                            }
                        });
                    },
                    function (row, callback) {
                        var sql = sqlQuery.remove().from('sys_user_domain').where({
                            DOMAIN_ID: id
                        }).build();
                        logger.debug('删除用户关联域信息sql:' + sql);
                        conn.query(sql, function (err, rows, cloumns) {
                            if (err) {
                                logger.error('删除用户关联域错误：' + err);
                                message.flag = -1;
                                message.message = '删除用户关联域失败';
                                message.data = null;
                                res.json(message);
                                return;
                            } else {
                                callback(null, row);
                            }
                        });
                    },
                    function (row, callback) {
                        var sql = sqlQuery.remove().from('sys_mtree').where({
                            DOMAIN_ID: id
                        }).build();
                        logger.debug('删除域节点sql:' + sql);
                        conn.query(sql, function (err, rows) {
                            if (err) {
                                logger.error('删除域节点信息错误：' + err);
                                message.flag = -1;
                                message.message = '删除域节点信息失败';
                                message.data = null;
                                res.json(message);
                                return;
                            } else {
                                var domainFileURI = path + row.URI;
                                fs.exists(domainFileURI, function (exists) {
                                    if (exists) {
                                        fileUtils.rmdirSync(domainFileURI);
                                    }
                                    message.flag = 0;
                                    message.message = 'OK';
                                    message.data = null;
                                    res.json(message);
                                    GlobalAgent.refreshUserDomain(user);
                                    return;
                                });
                            }
                        });
                    }
                ], function (err) {
                    if (err) {
                        message.flag = -1;
                        message.message = '删除域失败';
                        message.data = null;
                        res.json(message);
                        return;
                    }
                });
            }
        });
    },
    /**
     * 获取
     * @param req
     * @param res
     * @param action
     */
    getDoMainById: function (req, res) {
        var id = req.body.id;
        var sql = 'SELECT d.DOMAIN_ID,d.PRE_DOMAIN_ID, d.NAME, d.IS_ENABLE, d.DESCRIPTION, u.USER_ID, USER_NAME,dd.IS_ENABLE as preEnable FROM sys_domain d left join sys_domain dd on d.PRE_DOMAIN_ID = dd.DOMAIN_ID ' +
            ' LEFT JOIN sys_user u ON d.ADMIN_USER = u.USER_ID WHERE d.IS_DELETED = 0 and d.DOMAIN_ID=' + id;
        logger.debug('获取Domain信息sql:' + sql);
        query(sql, function (err, rows, columns) {
            if (err) {
                logger.error('获取Domain信息错误：' + err);
                message.flag = -1;
                message.message = '获取域信息失败';
                message.data = null;
                res.json(message);
                return;
            } else {
                message.flag = 0;
                message.message = 'OK';
                message.data = rows[0];
                res.json(message);
            }
        });
    },
    renameDomain: function (req, res) {
        var id = req.body.id;
        var user = req.session.user;
        var path = configConst.filePath + '/' + user.ENTERPRISE_ID + '/resources';
        if (!id) {
            message.flag = -1;
            message.message = '请选择操作的域';
            message.data = null;
            res.json(message);
            return;
        }
        var newName = req.body.newName;
        if (!newName) {
            message.flag = -1;
            message.message = '请输入新名称';
            message.data = null;
            res.json(message);
            return;
        }

        transaction(function (err, conn) {
            if (err) {
                logger.error("rename domain transaction ERROR" + err);
                message.flag = -1;
                message.message = '删除域失败';
                message.data = null;
                res.json(message);
                return;
            } else {
                async.waterfall([
                    function (callback) {
                        var sql = 'select count(DOMAIN_ID) as count from sys_domain where PRE_DOMAIN_ID  in ( select PRE_DOMAIN_ID from sys_domain where DOMAIN_ID = ' + id + ') and name ="' + newName + '"';
                        logger.debug('获取当前上级域下是否有相同名称的子域sql:' + sql);
                        conn.query(sql, function (err, rows) {
                            if (err) {
                                logger.error('统计子域信息错误：' + err);
                                message.flag = -1;
                                message.data = null;
                                message.message = '统计子域信息失败';
                                res.json(message);
                                return;
                            } else {
                                if (rows[0].count > 0) {
                                    message.flag = -1;
                                    message.data = null;
                                    message.message = '上级域下存在同名子域';
                                    res.json(message);
                                    return;
                                }
                                callback(null);
                            }
                        });
                    },
                    function (callback) {
                        var sql = 'SELECT DOMAIN_ID,URI from sys_domain where DOMAIN_ID in (SELECT pre_domain_id from sys_domain where DOMAIN_ID = ' + id + ') ';
                        logger.debug('获取上级域信息sql:' + sql);
                        conn.query(sql, function (err, rows) {
                            if (err) {
                                logger.error('统计上级域信息错误：' + err);
                                message.flag = -1;
                                message.data = null;
                                message.message = '统计上级域信息失败';
                                res.json(message);
                                return;
                            } else {
                                if (rows.length < 1) {
                                    message.flag = -1;
                                    message.data = null;
                                    message.message = '没有找到对应的上级域';
                                    res.json(message);
                                    return;
                                }
                                callback(null, rows[0]);
                            }
                        });
                    },
                    function (preDomain, callback) {
                        var sql = 'SELECT count(ID) as count from sys_mtree where MTREE_SOURCE != 1 and name = "' + newName + '" and PID in (SELECT ID from sys_mtree where URI ="' + preDomain.URI + '")';
                        logger.debug('获取该域下面是否有同名的节点:' + sql);
                        conn.query(sql, function (err, rows) {
                            if (err) {
                                message.flag = -1;
                                message.message = '查询同名节点出错';
                                message.data = null;
                                res.json(message);
                                return;
                            } else if (rows.length > 0 && rows[0].count > 0) {
                                message.flag = -1;
                                message.message = '当前域下已存在同名的节点';
                                message.data = null;
                                res.json(message);
                                return;
                            } else {
                                callback(null, preDomain);
                            }
                        });
                    },
                    function (preDomain, callback) {
                        var sql = 'SELECT DOMAIN_ID,URI,NAME from sys_domain where DOMAIN_ID  = ' + id;
                        logger.debug('获取本级域信息sql：' + sql);
                        conn.query(sql, function (err, rows) {
                            if (err) {
                                logger.error('获取本级域信息错误：' + err);
                                message.flag = -1;
                                message.data = null;
                                message.message = '获取本级域失败';
                                res.json(message);
                                return;
                            }
                            if (rows.length > 0 && rows[0].NAME == newName) {
                                message.flag = -1;
                                message.data = null;
                                message.message = '域名称没有变化';
                                res.json(message);
                                return;
                            }
                            callback(null, preDomain, rows[0]);
                        });
                    },
                    function (preDomain, domain, callback) {
                        var sql = 'update sys_domain set name = "' + newName + '"  where DOMAIN_ID = ' + id;
                        logger.debug('更新节点信息sql：' + sql);
                        conn.query(sql, function (err, row) {
                            if (err) {
                                logger.error('重命名域信息错误：' + err);
                                message.flag = -1;
                                message.data = null;
                                message.message = '重命名域失败';
                                res.json(message);
                                return;
                            }
                            callback(null, preDomain, domain);
                        });
                    },
                    function (preDomain, domain, callback) {
                        var sql = 'SELECT DOMAIN_ID,PRE_DOMAIN_ID,URI FROM sys_domain c WHERE c.DOMAIN_ID = ' + id;
                        sql += ' UNION all ';
                        sql += 'SELECT DOMAIN_ID,PRE_DOMAIN_ID,URI FROM sys_domain c  WHERE c.URI LIKE (SELECT CONCAT(uri,"/%") FROM sys_domain c WHERE c.DOMAIN_ID = ' + id + ')  order by URI';
                        logger.debug('获取域及子域信息sql:' + sql);
                        conn.query(sql, function (err, rows) {
                            if (err) {
                                logger.error('获取域及子域信息错误：' + err);
                                message.flag = -1;
                                message.data = null;
                                message.message = '获取域及子域信息失败';
                                res.json(message);
                                return;
                            }
                            var sourceURI;
                            var ids = new Array();
                            rows.forEach(function (row) {
                                ids.push(row.DOMAIN_ID);
                                if (row.DOMAIN_ID == id) {
                                    sourceURI = row.URI;
                                }
                            });
                            callback(null, sourceURI, ids, preDomain, domain);
                        });
                    },

                    function (sourceURI, ids, preDomain, domain, callback) {
                        var targetURI = preDomain.URI + '/' + newName;
                        var sql = "UPDATE SYS_DOMAIN SET URI=INSERT(URI,1,?,?) WHERE DOMAIN_ID in (?)";
                        logger.debug('更新mtree的URI sql:' + sql);
                        conn.query(sql, [sourceURI.length, targetURI, ids], function (err, result) {
                            if (err) {
                                logger.error('重命名域 URI错误：' + err);
                                message.flag = -1;
                                message.data = null;
                                message.message = '重命名域错误';
                                res.json(message);
                                return;
                            } else {
                                callback(null, preDomain, domain);
                            }
                        });
                    },

                    function (preDomain, domain, callback) {
                        var sql = 'update sys_mtree set name = "' + newName + '"  where URI = "' + domain.URI + '"';
                        logger.debug('更新节点信息sql：' + sql);
                        conn.query(sql, function (err, rows) {
                            if (err) {
                                logger.error('重命名节点信息错误：' + err);
                                message.flag = -1;
                                message.data = null;
                                message.message = '重命名节点信息失败';
                                res.json(message);
                                return;
                            }
                            callback(null, preDomain, domain);
                        });
                    },
                    function (preDomain, domain, callback) {
                        var sql = 'SELECT ID,DOMAIN_ID,MTREE_SOURCE,PID,URI FROM sys_mtree c WHERE c.URI = "' + domain.URI + '"';
                        sql += ' UNION all ';
                        sql += 'SELECT ID,DOMAIN_ID,MTREE_SOURCE,PID,URI FROM sys_mtree c  WHERE c.URI LIKE "' + domain.URI + '/%"  order by URI';
                        logger.debug('获取源节点信息sql:' + sql);
                        conn.query(sql, function (err, rows) {
                            if (err) {
                                logger.error('获取节点信息错误：' + err);
                                message.flag = -1;
                                message.data = null;
                                message.message = '获取节点信息错误';
                                res.json(message);
                                return;
                            }
                            var sourceURI;
                            var ids = new Array();
                            rows.forEach(function (row) {
                                ids.push(row.ID);
                                if (row.DOMAIN_ID == id && row.MTREE_SOURCE == 1) {
                                    sourceURI = row.URI;
                                }
                            });
                            if (!sourceURI) {
                                message.flag = -1;
                                message.data = null;
                                message.message = '没有查询到节点信息';
                                res.json(message);
                                return;
                            }
                            callback(null, sourceURI, ids, preDomain);
                        });
                    },
                    function (sourceURI, ids, preDomain, callback) {
                        var targetURI = preDomain.URI + '/' + newName;
                        var sql = "UPDATE SYS_MTREE SET URI=INSERT(URI,1,?,?) WHERE ID in (?)";
                        logger.debug('更新mtree的URI sql:' + sql);
                        conn.query(sql, [sourceURI.length, targetURI, ids], function (err, result) {
                            if (err) {
                                logger.error('重命名MTree URI错误：' + err);
                                message.flag = -1;
                                message.data = null;
                                message.message = '重命名MTreeURI错误';
                                res.json(message);
                                return;
                            } else {
                                callback(null, ids, sourceURI, targetURI);
                            }
                        });
                    },
                    function (ids, sourceURI, targetURI, callback) {
                        sourceURI = path + sourceURI;
                        targetURI = path + targetURI;
                        var sql = 'SELECT point.POINT_ID,point.UUID,point.POINT_NAME,mtree.URI from sys_point point ';
                        sql += ' left join sys_mtree mtree on point.mtree_id = mtree.Id';
                        sql += ' where point.MTREE_ID in (' + ids + ')';
                        logger.debug('获取节点下面的测信息sql：' + sql);
                        conn.query(sql, function (err, rows) {
                            if (err) {
                                logger.error('获取节点下面测点信息错误：' + err);
                                message.flag = -1;
                                message.data = null;
                                message.message = '获取节点信息失败';
                                res.json(message);
                                return;
                            }
                            if (!rows || rows.length < 1) {
                                try {
                                    fs.renameSync(sourceURI, targetURI);
                                } catch (e) {
                                    message.flag = -1;
                                    message.message = '重命名域文件出错';
                                    message.data = rows;
                                    res.json(message);
                                    return;
                                }
                                message.flag = 0;
                                message.message = 'OK';
                                message.data = null;
                                res.json(message);
                                return;
                            }
                            callback(null, rows, sourceURI, targetURI);
                        });
                    },
                    function (rows, sourceURI, targetURI, callback) {
                        var cols = new Array();
                        var rrs = new Array();
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
                            var rr = new Array();
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
                                callback(null, sqlPoints, sourceURI, targetURI);
                            }
                        });
                    },
                    function (sqlPoints, sourceURI, targetURI, callback) {
                        logger.debug('重命名时更新测点信息sql:' + sqlPoints);
                        conn.query(sqlPoints, function (err, result) {
                            if (err) {
                                logger.error('更新关系库测点信息错误：' + err);
                                message.flag = -1;
                                message.data = null;
                                message.message = '更新数据库信息错误';
                                res.json(message);
                                return;
                            } else {
                                callback(null, sourceURI, targetURI);
                            }
                        });
                    },
                    function (sourceURI, targetURI, callback) {
                        var sql = 'SELECT DOMAIN_ID,URI, NAME, IS_ENABLE FROM sys_domain WHERE IS_DELETED = 0 AND URI LIKE (SELECT CONCAT(URI, "/%") FROM sys_domain WHERE DOMAIN_ID = ' + id + ') ';
                        logger.debug('获取对应的子域信息sql:' + sql);
                        query(sql, function (error, rows) {
                            if (error) {
                                logger.error('获取对应的子域信息错误：' + error);
                                message.flag = -1;
                                message.message = '获取对应的子域信息失败';
                                message.data = null;
                                res.json(message);
                                return;
                            } else {
                                try {
                                    fs.renameSync(sourceURI, targetURI);
                                } catch (e) {
                                    message.flag = -1;
                                    message.message = '重命名域文件出错';
                                    message.data = rows;
                                    res.json(message);
                                    return;
                                }
                                message.flag = 0;
                                message.message = 'OK';
                                message.data = rows;
                                res.json(message);
                                return;
                            }
                        });
                    }
                ], function (err) {
                    if (err) {
                        logger.error('重命名域错误：' + err);
                        message.flag = -1;
                        message.data = null;
                        message.message = '重命名域错误';
                        res.json(message);
                        return;
                    } else {
                        message.flag = -0
                        message.data = null;
                        message.message = 'OK';
                        res.json(message);
                        return;
                    }

                });
            }
        });

    },
    /**
     * 获取用户对应的域信息
     * @param req
     * @param res
     */
    getUserDomain: function (req, res) {
        var userId = req.body.userId;
        var user = req.session.user;
        var currentUserId = user.USER_ID;
        var isSystem = user.IS_SYSTEM;
        var companyId = user.ENTERPRISE_ID;
        async.waterfall(
            [
                function (callback) {
                    var sql = '';
                    if (isSystem == 1) {
                        sql = 'SELECT DOMAIN_ID as domainId,PRE_DOMAIN_ID as preDomainId,ADMIN_USER as adminUser, NAME as name FROM sys_domain WHERE IS_DELETED = 0 ';
                    } else {
                        sql = 'SELECT DOMAIN_ID as domainId,PRE_DOMAIN_ID as preDomainId,ADMIN_USER as adminUser, NAME as name FROM  sys_domain WHERE IS_DELETED = 0 AND COMPANY_ID = ' + companyId + ' order by URI';
                    }
                    logger.debug('获取域信息数据sql：' + sql);
                    query(sql, function (err, rows, columns) {
                        if (err) {
                            logger.error('获取域信息错误：' + err);
                            message.flag = -1;
                            message.message = '获取域信息失败';
                            message.data = null;
                            res.json(message);
                            return;
                        } else {
                            callback(null, rows);
                        }
                    });
                },
                function (rr, callback) {
                    if (isSystem) {
                        for (var i in rr) {
                            var r = rr[i];
                            if (r.domainId == 1) {
                                r.disabled = true;
                                r.expanded = true;
                            } else {
                                r.expanded = false;
                                r.disabled = false;
                            }
                            rr[i] = r;
                        }
                    } else {
                        var adminURI = new Array();
                        //默认不可编辑，只能选择自己是管理员的域及子域
                        for (var i in rr) {
                            var r = rr[i];
                            r.disabled = true;
                            r.expanded = true;
                            if (r.adminUser == currentUserId) {
                                adminURI.push(r.URI);
                            }
                            rr[i] = r;
                        }
                        for (var j in rr) {
                            var r = rr[j];
                            for (var i in adminURI) {
                                //如果当前域没有启用，则不可编辑
                                if (r.isEnable == 0) {
                                    r.disabled = true;
                                    break;
                                }
                                var uri = adminURI[i];
                                if (r.URI == uri) {
                                    r.disabled = false;
                                    r.expanded = false;
                                    break;
                                }
                                uri += '/';
                                if (r.URI.indexOf(uri) > -1) {
                                    r.disabled = false;
                                    r.expanded = false;
                                    break;
                                }
                            }
                            rr[j] = r;
                        }
                    }

                    var sql = 'SELECT ID,USER_ID,DOMAIN_ID from sys_user_domain where IS_DELETED =0 and USER_ID = ' + userId;
                    logger.debug('获取用户域数据sql：' + sql);
                    query(sql, function (err, rows, columns) {
                        if (err) {
                            logger.error('获取用户域数据错误：' + err);
                            message.flag = -1;
                            message.message = '获取用户域信息失败';
                            message.data = null;
                            res.json(message);
                            return;
                            rename
                        } else {
                            if (rows.length < 1) {
                                message.flag = 0;
                                message.message = 'OK';
                                message.data = rr;
                                res.json(message);
                                return;
                            } else {
                                var domainIds = new Array();
                                for (var i in rows) {
                                    domainIds.push(rows[i].DOMAIN_ID);
                                }
                                for (var j in rr) {
                                    var r = rr[j];
                                    if (domainIds.indexOf(r.domainId) > -1) {
                                        r.checked = true;
                                    } else {
                                        r.checked = false;
                                    }
                                    rr[j] = r;
                                }
                                message.flag = 0;
                                message.message = 'OK';
                                message.data = rr;
                                res.json(message);
                                return;
                            }
                        }
                    });
                }
            ],
            function (err) {
                if (err) {
                    message.flag = -1;
                    message.message = '获取域信息出错';
                    message.data = null;
                    res.json(message);
                }
            });
    },
    updateUserDomain: function (req, res) {
        var domainIds = req.body.domainIds;
        var user = req.session.user;
        var currentUserId = user.USER_ID;
        var userId = req.body.userId;
        var time = Utils.dateFormat(new Date().getTime(), Utils.yyyyMMddhhmmss);
        async.waterfall(
            [
                function (callback) {
                    var sql = sqlQuery.update().into('sys_user_domain').set({
                        UPDATE_DATE: time,
                        IS_DELETED: 1
                    }).where({user_Id: userId, IS_ADMIN: 0, IS_DELETED: 0,}).build();
                    logger.debug('更新用户域信息先将以前的数据数据删除sql：' + sql);
                    query(sql, function (err, rows, columns) {
                        if (err) {
                            logger.error('删除以前绑定信息错误：' + err);
                            message.flag = -1;
                            message.message = '删除以前绑定信息失败';
                            message.data = null;
                            res.json(message);
                            return;
                        } else {
                            callback(null);
                        }
                    });
                },
                function (callback) {
                    if (!domainIds) {
                        message.flag = 0;
                        message.message = 'OK';
                        message.data = null;
                        res.json(message);
                        GlobalAgent.refreshUserDomain(user);
                        return;
                    }
                    var ids = domainIds.split(',');
                    var sql = 'insert into sys_user_domain (USER_ID,DOMAIN_ID,CREATE_USER,CREATE_DATE) values ';
                    var size = ids.length;
                    for (var i = 0; i < size; i++) {
                        var val = '';
                        val += '(' + userId + ',' + ids[i] + ',' + currentUserId + ',"' + time + '")'
                        if (ids[i + 1]) {
                            val += ','
                        }
                        sql += val;
                    }
                    logger.debug('创建用户域信息sql：' + sql);
                    query(sql, function (err, rows, columns) {
                        if (err) {
                            logger.error('编辑用户域信息错误：' + err);
                            message.flag = -1;
                            message.message = '编辑用户域信息失败';
                            message.data = null;
                            res.json(message);
                            return;
                        } else {
                            message.flag = 0;
                            message.message = 'OK';
                            message.data = null;
                            GlobalAgent.refreshUserDomain(user);
                            res.json(message);
                        }
                    });
                }
            ],
            function (err) {
                if (err) {
                    message.flag = -1;
                    message.message = '获取域信息出错';
                    message.data = null;
                    res.json(message);
                }
            });
    },
    getDataDomain: function (req, res) {
        var user = req.session.user;
        var userId = user.USER_ID;
        var isSystem = user.IS_SYSTEM;
        var companyId = user.ENTERPRISE_ID;
        async.waterfall(
            [
                function (callback) {
                    var sql;
                    if (isSystem == 1) {
                        sql = 'SELECT DOMAIN_ID as domainId,PRE_DOMAIN_ID as preDomainId,ADMIN_USER as adminUser, NAME as name , URI as URI,URI as value FROM sys_domain WHERE IS_DELETED = 0 ';
                    } else {
                        sql = 'SELECT DOMAIN_ID as domainId,PRE_DOMAIN_ID as preDomainId,ADMIN_USER as adminUser, NAME as name , URI as URI,URI as value FROM  sys_domain WHERE IS_DELETED = 0 AND COMPANY_ID = ' + companyId + ' order by URI';
                    }
                    logger.debug('获取域信息数据sql：' + sql);
                    query(sql, function (err, rows, columns) {
                        if (err) {
                            logger.error('获取域信息错误：' + err);
                            message.flag = -1;
                            message.message = '获取域信息失败';
                            message.data = null;
                            res.json(message);
                            return;
                        } else {
                            callback(null, rows);
                        }
                    });
                },
                function (rr, callback) {
                    if (isSystem == 1) {
                        for (var i in rr) {
                            var r = rr[i];
                            if (r.domainId == 1) {
                                r.disabled = true;
                                r.expanded = true;
                            } else {
                                r.expanded = false;
                                r.disabled = false;
                            }
                            rr[i] = r;
                        }
                    } else {
                        for (var i in rr) {
                            var r = rr[i];
                            r.disabled = true;
                            r.expanded = true;
                            rr[i] = r;
                        }
                    }
                    var sql = 'SELECT ID,USER_ID,DOMAIN_ID from sys_user_domain where IS_DELETED =0 and USER_ID = ' + userId;
                    logger.debug('获取用户域数据sql：' + sql);
                    query(sql, function (err, rows, columns) {
                        if (err) {
                            logger.error('获取用户域数据错误：' + err);
                            message.flag = -1;
                            message.message = '获取用户域信息失败';
                            message.data = null;
                            res.json(message);
                            return;
                        } else {
                            if (rows.length < 1) {
                                message.flag = 0;
                                message.message = 'OK';
                                message.data = rr;
                                res.json(message);
                                return;
                            } else {
                                var domainIds = [];
                                for (var i in rows) {
                                    domainIds.push(rows[i].DOMAIN_ID);
                                }
                                var uris = [];
                                for (var j in rr) {
                                    var r = rr[j];
                                    if (domainIds.indexOf(r.domainId) > -1) {
                                        uris.push(r.URI);
                                        r.disabled = false;
                                        r.expanded = true;
                                    }
                                    for (var t in uris) {
                                        var uri = uris[t];
                                        if (r.URI.indexOf(uri) == 0) {
                                            r.disabled = false;
                                            r.expanded = true;
                                        }
                                    }
                                    rr[j] = r;
                                }
                                message.flag = 0;
                                message.message = 'OK';
                                message.data = rr;
                                res.json(message);
                                return;
                            }
                        }
                    });
                }
            ],
            function (err) {
                if (err) {
                    message.flag = -1;
                    message.message = '获取域信息出错';
                    message.data = null;
                    res.json(message);
                }
            });
    },
}
module.exports = domain_manage;
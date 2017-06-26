var actionUtil = require("../../framework/action/actionUtils")();
var transaction = actionUtil.transaction;
var async = require("async");
var query = actionUtil.query;
var fs = require('fs');
var Utils = require('../../utils/tools/utils');
var logger = require('log4js').getLogger('Ibox');
var GlobalAgent = require('../../message/GlobalAgent');
var fileUtils = require("../../utils/tools/fileUtils");
var opPool = require('../../openplant/openPlantPool');
var sqlQuery = require('sql-query').Query();
var SMS = require('../../utils/sms/sms');
var uuid = require('node-uuid');
var message = {
    Status: 0,
    message: '成功',
    Data: null
}

var boxInfo = {
    /**
     * 添加用户和盒子关联信息
     * @param req
     * @param res
     */
    bindBox: function (req, res) {
        var userId = req.body.userId;
        var devCode = req.body.devCode;
        var verCode = req.body.verCode;
        if (!userId) {
            message.Status = false;
            message.message = '用户ID不能为空';
            message.Data = null;
            res.json(message);
            return;
        }
        if (!devCode || !verCode) {
            message.Status = false;
            message.message = '设备码和验证码都不能为空';
            message.Data = null;
            res.json(message);
            return;
        }
        var date = Utils.dateFormat(new Date().getTime(), Utils.yyyyMMddhhmmss);
        transaction(function (err, conn) {
            if (err) {
                logger.error('绑定盒子 transaction ERROR：' + err);
                message.Status = false;
                message.message = "操作失败";
                message.Data = null;
                res.json(message);
                return;
            } else {
                async.waterfall(
                    [
                        function (callback) {
                            var sql = sqlQuery.select().from('box_box_info').select(['id']).where({dev_code: devCode, ver_code: verCode}).build();
                            logger.debug('获取当前盒子是否存在sql:' + sql);
                            conn.query(sql, function (error, rows) {
                                if (error) {
                                    logger.error('获取盒子信息错误：' + error);
                                    message.Status = false;
                                    message.message = '验证盒子信息出错';
                                    message.Data = null;
                                    callback(error, message);
                                } else {
                                    if (rows.length != 1) {
                                        message.Status = false;
                                        message.message = '盒子不存在';
                                        message.Data = null;
                                        callback(new Error({msg: '盒子不存在'}), message);
                                    } else {
                                        callback(null);
                                    }
                                }
                            })
                        },
                        function (callback) {
                            var sql = sqlQuery.select().from('box_user_box').select(['id']).where({dev_code: devCode, status: [2, 3]}).build();
                            logger.debug('获取当前盒子是否绑定sql:' + sql);
                            conn.query(sql, function (error, rows) {
                                if (error) {
                                    logger.error('获取盒子绑定信息错误：' + error);
                                    message.Status = false;
                                    message.message = '验证盒子绑定信息出错';
                                    message.Data = null;
                                    callback(error, message);
                                } else {
                                    if (rows.length > 0) {
                                        message.Status = false;
                                        message.message = '盒子已经绑定过';
                                        message.Data = null;
                                        callback(new Error('盒子已经绑定过'), message);
                                    } else {
                                        callback(null);
                                    }
                                }
                            })
                        },
                        function (callback) {
                            var sql = 'select user_id as userId,job_no as jobNo,enterprise_id as companyId,enterprise_name as companyName,source from sys_user where user_id = ' + userId;
                            logger.debug('获取用户信息sql:', sql);
                            conn.query(sql, function (error, rows) {
                                if (error) {
                                    logger.error('获取用户信息错误:', error);
                                    message.Status = false;
                                    message.message = '获取用户信息错误';
                                    message.Data = null;
                                    callback(new Error('获取用户信息错误'), message);
                                } else {
                                    if (rows.length != 1) {
                                        message.Status = false;
                                        message.message = '用户不存在';
                                        message.Data = null;
                                        callback(new Error('用户不存在'), message);
                                    } else {
                                        callback(null, rows[0]);
                                    }
                                }
                            });
                        },
                        function (user, callback) {
                            var sql = sqlQuery.insert().into('box_user_box').set({
                                user_id: userId,
                                dev_code: devCode,
                                Status: 2,
                                CREATE_DATE: date
                            }).build();
                            logger.debug('用户盒子关联信息sql：' + sql);
                            conn.query(sql, function (error, rows) {
                                if (error) {
                                    message.Status = false;
                                    message.message = '用户盒子关联';
                                    message.Data = null;
                                    callback(error, message);
                                } else {
                                    callback(null, user);
                                }
                            });
                        },
                        function (user, callback) {
                            if (user.source == 2) {
                                var URI = '/' + user.companyName + '/' + user.jobNo;
                                callback(null, URI, user);
                            } else {
                                var sql = 'SELECT user_id as userId,job_no as jobNo,enterprise_id as companyId,enterprise_name as companyName from sys_user where SOURCE =2 and MOBILE_PHONE in (SELECT MOBILE_PHONE from sys_user where USER_ID = ' + userId + ' )';
                                logger.debug('获取上级用户sql:', sql);
                                conn.query(sql, function (error, rows) {
                                    if (error) {
                                        logger.error('获取上级用户错误:', error);
                                        message.Status = false;
                                        message.message = '获取上级用户错误';
                                        message.Data = null;
                                        callback(new Error('获取上级用户错误'), message);
                                    } else {
                                        var URI;
                                        if (rows.length == 1) {
                                            URI = '/' + rows[0].companyName + '/' + rows[0].jobNo + '/' + user.jobNo;
                                        } else {
                                            URI = '/' + user.jobNo;
                                        }
                                        callback(null, URI, user);
                                    }
                                });
                            }
                        },
                        function (URI, user, callback) {
                            var sql = 'select domain_id as domainId,URI,company_id as companyId from sys_domain where type = 3 and name = "' + devCode + '"';
                            logger.debug('获取是否绑定过信息sql:', sql);
                            conn.query(sql, function (error, rows) {
                                if (error) {
                                    logger.error('获取是否绑定过信息错误:', error);
                                    message.Status = false;
                                    message.message = '获取绑定信息错误'
                                    message.Data = null;
                                    callback(new Error('获取绑定信息错误'), message);
                                } else {
                                    if (rows.length == 1) {
                                        callback(null, rows[0], URI, user);
                                    } else {
                                        callback(null, null, URI, user);
                                    }
                                }
                            });
                        },
                        function (domain, URI, user, callback) {
                            var sql = 'select domain_id as domainId,URI,company_id as companyId from sys_domain where URI ="' + URI + '"';
                            logger.debug('获取上级域信息sql:', sql);
                            conn.query(sql, function (error, rows) {
                                if (error) {
                                    logger.error('获取上级域信息错误:', error);
                                    message.Status = false;
                                    message.message = '获取上级域信息错误'
                                    message.Data = null;
                                    callback(new Error('获取上级域信息错误'), message);
                                } else {
                                    if (rows.length == 1) {
                                        callback(null, rows[0], domain, URI, user);
                                    } else {
                                        message.Status = false;
                                        message.message = '没有对应的上级域'
                                        message.Data = null;
                                        callback(new Error('没有对应的上级域'), message);
                                    }
                                }
                            });
                        },
                        function (preDomain, domain, URI, user, callback) {
                            var sql;
                            if (domain) {
                                sql = sqlQuery.update().into('sys_domain').set({
                                    PRE_DOMAIN_ID: preDomain.domainId,
                                    URI: URI + '/' + devCode,
                                    COMPANY_ID: user.companyId,
                                    IS_ACTIVE: 1,
                                    update_date: date
                                }).where({
                                    domain_id: domain.domainId
                                }).build();
                            } else {
                                sql = sqlQuery.insert().into('sys_domain').set({
                                    PRE_DOMAIN_ID: preDomain.domainId,
                                    COMPANY_ID: user.companyId,
                                    NAME: devCode,
                                    URI: URI + '/' + devCode,
                                    CREATE_USER: user.userId,
                                    ADMIN_USER: user.userId,
                                    DOMAIN_CODE: uuid.v1(),
                                    DESCRIPTION: '绑定box时创建',
                                    TYPE: 3,
                                    CREATE_DATE: date
                                }).build();
                            }
                            logger.debug('更新或添加信息sql:', sql);
                            conn.query(sql, function (error, rows) {
                                if (error) {
                                    logger.error('更新或添加信息错误:', error);
                                    message.Status = false;
                                    message.message = '更新或添加信息错误'
                                    message.Data = null;
                                    callback(new Error('更新或添加信息错误'), message);
                                } else {
                                    if (domain) {
                                        callback(null, domain, URI, user, domain.domainId);
                                    } else {
                                        callback(null, domain, URI, user, rows.insertId);
                                    }

                                }
                            });
                        },
                        function (domain, URI, user, domainId, callback) {
                            var sql = sqlQuery.insert().into('sys_user_domain').set({
                                USER_ID: user.userId,
                                DOMAIN_ID: domainId,
                                IS_ADMIN: 1,
                                CREATE_USER: 1,
                                CREATE_DATE: date
                            }).build();
                            logger.debug('添加用户和Domain关联信息sql：' + sql);
                            conn.query(sql, function (err, rows) {
                                if (err) {
                                    logger.error('添加用户和Domain关联信息错误：' + err);
                                    message.Status = false;
                                    message.message = "加用户和Domain关联信息错失败";
                                    message.Data = null;
                                    callback(new Error('加用户和Domain关联信息错失败', message));
                                } else {
                                    callback(null, domain, URI, user, domainId);
                                }
                            });
                        },
                        function (domain, URI, user, domainId, callback) {
                            var sql = 'select id as Id,URI from sys_mtree where URI ="' + URI + '"';
                            logger.debug('获取上级MTree信息sql:', sql);
                            conn.query(sql, function (error, rows) {
                                if (error) {
                                    logger.error('获取上级MTree信息错误:', error);
                                    message.Status = false;
                                    message.message = '获取上级MTree信息错误'
                                    message.Data = null;
                                    callback(new Error('获取上级MTree信息错误'), message);
                                } else {
                                    if (rows.length == 1) {
                                        callback(null, rows[0], domain, URI, user, domainId);
                                    } else {
                                        message.Status = false;
                                        message.message = '没有对应的上级MTree'
                                        message.Data = null;
                                        callback(new Error('没有对应的上级MTree'), message);
                                    }
                                }
                            });
                        },
                        function (preMtree, domain, URI, user, domainId, callback) {
                            var sql;
                            if (domain) {
                                sql = sqlQuery.update().into('sys_mtree').set({
                                    PID: preMtree.Id,
                                    DOMAIN_ID: domainId,
                                    URI: URI + '/' + devCode,
                                    COMPANY_ID: user.companyId,
                                    IS_ACTIVE: 1,
                                    update_date: date
                                }).where({
                                    URI: domain.URI
                                }).build();
                            } else {
                                sql = sqlQuery.insert().into('sys_mtree').set({
                                    PID: preMtree.Id,
                                    DOMAIN_ID: domainId,
                                    URI: URI + '/' + devCode,
                                    NAME: devCode,
                                    LAYER: 0,
                                    MTREE_SOURCE: 3,
                                    DESCRIPTION: 'Box用戶审核创建',
                                    COMPANY_ID: user.companyId,
                                    CREATE_DATE: date
                                }).build();
                            }
                            logger.debug('更新或添加信息sql:', sql);
                            conn.query(sql, function (error, rows) {
                                if (error) {
                                    logger.error('更新或添加信息错误:', error);
                                    message.Status = false;
                                    message.message = '更新或添加信息错误'
                                    message.Data = null;
                                    callback(new Error('更新或添加信息错误'), message);
                                } else {
                                    if (domain) {
                                        callback(null, domain, URI, user, domainId);
                                    } else {
                                        callback(null, domain, URI, user, domainId);
                                    }
                                }
                            });
                        },
                        function (domain, URI, user, domainId, callback) {
                            if (domain) {
                                var sql = 'SELECT point.POINT_ID,point.UUID,point.POINT_NAME,point.URI from sys_point point where URI like "/' + URI + '/%"';
                                logger.debug('获取节点下面的测信息sql：' + sql);
                                conn.query(sql, function (err, rows) {
                                    if (err) {
                                        logger.error('获取节点下面测点信息错误：' + err);
                                        message.Status = false;
                                        message.message = '获取节点信息失败';
                                        message.Data = null;
                                        callback(err, message);
                                    } else {
                                        callback(null, domain, rows, URI, user, domainId);
                                    }
                                });
                            } else {
                                callback(null, domain, [], URI, user, domainId);
                            }
                        },
                        function (domain, points, URI, user, domainId, callback) {
                            if (points.length < 1) {
                                callback(null, domain, false, URI, user, domainId, null);
                            } else {
                                var cols = [];
                                var rrs = [];
                                cols.push(["ID", OPAPI.TYPE.INT32]);
                                cols.push(["PN", OPAPI.TYPE.STRING]);
                                cols.push(["UD", OPAPI.TYPE.INT64]);
                                var sqlPoints = '',
                                    sqlPointsUUID = '',
                                    sqlPointURI = '',
                                    sqlPointIds = [];
                                var size = points.length;
                                for (var i = 0; i < size; i++) {
                                    var row = points[i];
                                    var rr = [];
                                    rr.push(row.POINT_ID);
                                    var pointURI = URI + '/' + row.POINT_NAME;
                                    var UUID = opPool.makeUUID(pointURI);
                                    rr.push(UUID);
                                    UUID = '0x' + UUID;
                                    rr.push(UUID);
                                    rrs.push(rr);
                                    sqlPointsUUID += 'when ' + row.POINT_ID + ' then "' + UUID + '" ';
                                    sqlPointURI += 'when ' + row.POINT_ID + ' then "' + pointURI + '" ';
                                    sqlPointIds.push(row.POINT_ID);
                                }
                                sqlPoints = 'update sys_point set UUID = case POINT_ID ' + sqlPointsUUID + ' end,URI= case POINT_ID ' + sqlPointURI + ' end ,DOMAIN_ID = ' + domainId + ' where point_ID in( ' + sqlPointIds.toString() + ')';
                                opPool.update('Point', rrs, cols, function (error, rows, columns) {
                                    if ((error != 0 && error && error.code) || rows[0].EC != 0) {
                                        logger.error('编辑测点信息错误：' + JSON.stringify(error));
                                        message.Status = false;
                                        message.message = '更新测点信息失败';
                                        message.Data = null;
                                        callback(new Error('更新测点信息错误'), message);
                                    } else {
                                        callback(null, domain, true, URI, user, domainId, sqlPoints);
                                    }
                                });
                            }
                        },
                        function (domain, points, URI, user, domainId, sqlPoints, callback) {
                            if (points) {
                                logger.debug('box用户审核更新测点信息sql:' + sqlPoints);
                                conn.query(sqlPoints, function (err, rows) {
                                    if (err) {
                                        logger.error('更新关系库测点信息错误：' + err);
                                        message.Status = false;
                                        message.message = '更新数据库信息错误';
                                        message.Data = null;
                                        callback(new Error('更新测点信息错误'), message);
                                    } else {
                                        callback(null, domain, URI, user);
                                    }
                                });
                            } else {
                                callback(null, domain, URI, user);
                            }
                        },
                        function (domain, URI, user, callback) {
                            var path = './public/userfile/';
                            message.Status = true;
                            message.message = 'OK';
                            message.Data = null;
                            if (domain) {
                                var sourceURI = path + domain.companyId + '/resources' + domain.URI;
                                var targetURI = path + user.companyId + '/resources' + URI + '/' + devCode;
                                if (sourceURI != targetURI) {
                                    fileUtils.copyFileSync(sourceURI, targetURI);
                                    fileUtils.rmdirSync(sourceURI);
                                }
                                callback(null, message);
                            } else {
                                path += user.companyId + '/resources' + URI + '/' + devCode;
                                fs.exists(path, function (exists) {
                                    if (exists) {
                                        fileUtils.rmdirSync(path);
                                        fs.mkdirSync(path);
                                    }
                                    if (!exists) {
                                        fs.mkdirSync(path);
                                    }
                                    callback(null, message);
                                });
                            }
                        }
                    ],
                    function (error, message) {
                        res.json(message);
                    }
                );
            }
        });
    },
    /**
     * 解除和盒子关联信息
     * @param req
     * @param res
     */
    unBindBox: function (req, res) {
        var userId = req.body.userId;
        var devCode = req.body.devCode;
        var smsCode = req.body.smsCode;
        var phone = req.body.phone;
        var UUID = req.body.UUID;
        var obj = SMS.getSms(UUID);
        if (!obj) {
            message.Status = -1;
            message.message = '验证码为空';
            message.Data = null;
            res.json(message);
            return;
        }
        var smsOnlineCode = obj.smsCode;
        var onlinePhone = obj.phone;
        if (smsOnlineCode != smsCode || onlinePhone != phone) {
            message.Status = -1;
            message.message = '验证码不正确';
            message.Data = null;
            res.json(message);
            return;
        }
        SMS.deleteSms(UUID);
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
        var date = Utils.dateFormat(new Date().getTime(), Utils.yyyyMMddhhmmss);
        transaction(function (err, conn) {
            if (err) {
                logger.error('解绑盒子 transaction ERROR：' + err);
                message.Status = false;
                message.message = "操作失败";
                message.Data = null;
                res.json(message);
                return;
            } else {
                async.waterfall(
                    [
                        function (callback) {
                            var sql = sqlQuery.select().from('box_user_box').select(['user_id', 'from_user_id', 'to_user_id', 'dev_code', 'status']).where({
                                user_id: userId,
                                dev_code: devCode
                            }).build();
                            logger.debug('获取盒子绑定/分享信息sql:' + sql);
                            conn.query(sql, function (error, rows) {
                                if (error) {
                                    logger.error('获取盒子绑定/分享信息错误：' + error);
                                    message.Status = false;
                                    message.message = '获取盒子绑定/分享信息失败';
                                    message.Data = null;
                                    callback(error, message);
                                } else {
                                    if (rows.length != 1) {
                                        message.Status = false;
                                        message.message = '没有对应的绑定/分享信息';
                                        message.Data = null;
                                        callback(new Error('没有对应的绑定/分享信息'), message);
                                    } else {
                                        callback(null, rows[0]);
                                    }
                                }
                            });
                        },
                        function (row, callback) {
                            var sql = sqlQuery.remove().from('box_user_box').where({user_id: userId, dev_code: devCode}).build();
                            logger.debug('移除绑定/分享信息sql:' + sql);
                            conn.query(sql, function (error, rows) {
                                if (error) {
                                    logger.error('移除绑定/分享信息错误：' + error);
                                    message.Status = false;
                                    message.message = '移除绑定/分享信息失败';
                                    message.Data = null;
                                    callback(error, message);
                                } else {
                                    callback(null, row);
                                }
                            });
                        },
                        function (row, callback) {
                            //判断是绑定还是分享过来的
                            if (row.from_user_id) {
                                var sql = sqlQuery.remove().from('box_user_box').where({
                                    from_user_id: row.from_user_id,
                                    dev_code: devCode
                                }).build();
                                logger.debug('删除当前盒子分享信息sql:' + sql);
                                conn.query(sql, function (error, rows) {
                                    if (error) {
                                        logger.error('删除当前盒子分享信息错误：' + error);
                                        message.Status = false;
                                        message.message = '解绑盒子失败';
                                        message.Data = null;
                                        callback(error, message);
                                    } else {
                                        var sql = 'select count(id) as id from box_user_box where from_user_id = ' + row.from_user_id;
                                        logger.debug('获取是否还有盒子分享信息sql:' + sql);
                                        conn.query(sql, function (error, rows) {
                                            if (error) {
                                                logger.error('获取是否还有盒子分享信息错误：' + error);
                                                message.Status = false;
                                                message.message = '获取是否还有盒子分享失败';
                                                message.Data = null;
                                                callback(error, message);
                                            } else {
                                                if (rows[0].count > 0) {
                                                    message.Status = true;
                                                    message.message = 'OK';
                                                    message.Data = null;
                                                    callback(new Error('解除对应分享信息成功'), message);
                                                } else {
                                                    sql = sqlQuery.update().into('box_user_box').set({
                                                        status: 2,
                                                        update_date: date
                                                    }).where({user_id: userId, dev_code: devCode}).build();
                                                    logger.debug('修改盒子状态信息sql:' + sql);
                                                    conn.query(sql, function (error, rows) {
                                                        if (error) {
                                                            logger.error('修改盒子状态信息错误：' + error);
                                                            message.Status = false;
                                                            message.message = '修改盒子状态失败';
                                                            message.Data = null;
                                                            callback(error, message);
                                                        } else {
                                                            message.Status = true;
                                                            message.message = 'OK';
                                                            message.Data = null;
                                                            callback(new Error('解除对应分享信息成功'), message);
                                                        }
                                                    });
                                                }
                                            }
                                        });
                                    }
                                });
                            } else {
                                var sql = sqlQuery.remove().from('box_user_box').where({
                                    from_user_id: row.user_id,
                                    dev_code: devCode
                                }).build();
                                logger.debug('删除盒子分享信息sql:' + sql);
                                conn.query(sql, function (error, rows) {
                                    if (error) {
                                        logger.error('删除盒子分享信息错误：' + error);
                                        message.Status = false;
                                        message.message = '删除盒子分享信息失败';
                                        message.Data = null;
                                        callback(error, message);
                                    } else {
                                        callback(null);
                                    }
                                });
                            }
                        },
                        function (callback) {
                            var sql = sqlQuery.update().into('sys_domain').set({
                                IS_ACTIVE: 0,
                                UPDATE_DATE: date
                            }).where({
                                name: devCode,
                                type: 3
                            }).build();
                            logger.debug('更新box域信息sql:', sql);
                            conn.query(sql, function (error, rows) {
                                if (error) {
                                    logger.error('更新box域信息错误:', error);
                                    message.Status = false;
                                    message.message = '更新box域错误'
                                    message.Data = null;
                                    callback(new Error('更新box域错误'), message);
                                } else {
                                    callback(null);
                                }
                            });
                        },
                        function (callback) {
                            var sql = 'delete from sys_user_domain where user_id =' + userId + ' and domain_id in (SELECT domain_id from sys_domain where type=3 and name = "' + devCode + '")';
                            logger.debug('删除用户box域关联信息sql:', sql);
                            conn.query(sql, function (error, rows) {
                                if (error) {
                                    logger.error('删除用户box域关联信息错误:', error);
                                    message.Status = false;
                                    message.message = '删除用户box域关联错误'
                                    message.Data = null;
                                    callback(new Error('删除用户box域关联错误'), message);
                                } else {
                                    callback(null);
                                }
                            });
                        },
                        function (callback) {
                            var sql = sqlQuery.update().into('sys_mtree').set({
                                IS_ACTIVE: 0,
                                UPDATE_DATE: date
                            }).where({
                                name: devCode,
                                MTREE_SOURCE: 3
                            }).build();
                            logger.debug('更新box MTree信息sql:', sql);
                            conn.query(sql, function (error, rows) {
                                if (error) {
                                    logger.error('更新box MTree信息错误:', error);
                                    message.Status = false;
                                    message.message = '更新box MTree错误'
                                    message.Data = null;
                                    callback(new Error('更新box MTree错误'), message);
                                } else {
                                    message.Status = true;
                                    message.message = 'OK';
                                    message.Data = null;
                                    callback(null, message);
                                }
                            });
                        }
                    ],
                    function (error, message) {
                        res.json(message);
                    });
            }
        });
    },
    /**
     * 获取用户盒子列表
     * @param req
     * @param res
     */
    getBoxList: function (req, res) {
        var userId = req.body.userId || req.query.userId;
        if (!userId) {
            message.Status = false;
            message.message = '用户ID不能为空';
            message.Data = null;
            res.json(message);
            return;
        }

        async.waterfall(
            [
                function (callback) {
                    var sql = sqlQuery.select().from('sys_user').select(['mobile_phone', 'source']).where({user_id: userId}).build();
                    logger.debug('获取用户类型sql:', sql);
                    query(sql, function (error, rows) {
                        if (error) {
                            logger.error('获取用户类型错误：' + error);
                            message.Status = false;
                            message.message = '验证用户类型出错';
                            message.Data = null;
                            callback(new Error('获取用户类型出错'), message);
                        } else {
                            if (rows.length != 1) {
                                message.Status = false;
                                message.message = '没有对应的用户';
                                message.Data = null;
                                callback(new Error('没有对应的用户'), message);
                            } else {
                                callback(null, rows[0]);
                            }
                        }
                    });
                },
                function (user, callback) {
                    var sql = ''
                    if (user.source == 2) {
                        sql = 'SELECT u.user_id AS userId,u.dev_code,u.STATUS AS shareStatus,i.NAME,i.dev_desc,i.time,i.out_count,i.version_num,i.longitude,i.latitude,g.group_id AS groupId,g.group_name AS groupName,i.serial_no,i.STATUS as status' +
                            ' FROM box_box_info i ' +
                            ' LEFT JOIN box_user_box u ON i.dev_Code = u.dev_code' +
                            ' LEFT JOIN box_box_group g ON i.groupId = g.group_id' +
                            ' WHERE u.user_id IN (SELECT user_id FROM sys_user WHERE mobile_phone = "' + user.mobile_phone + '")'
                    } else {
                        sql = 'SELECT u.user_Id as userId,u.dev_code ,u.status as shareStatus,i.name ,i.dev_desc,i.time,i.out_count,i.version_num,i.longitude,i.latitude,g.group_id AS groupId,g.group_name AS groupName,i.serial_no,i.status from box_box_info i ' +
                            ' LEFT JOIN  box_user_box u on i.dev_Code = u.dev_code ' +
                            ' LEFT JOIN box_box_group g ON i.groupId = g.group_id ' +
                            ' where u.user_id = ' + userId;
                    }
                    logger.debug('获取用户盒子信息sql:' + sql);
                    query(sql, function (error, rows) {
                        if (error) {
                            logger.error('获取盒子信息错误：' + error);
                            message.Status = false;
                            message.message = '验证盒子信息出错';
                            message.Data = null;
                            res.json(message);
                        } else {
                            var obj = {};
                            for (var i in rows) {
                                var row = rows[i];
                                var oo = obj[row.dev_code];
                                if (oo) {
                                    if (oo.status == 4) {
                                        obj[row.dev_code] = row;
                                    }
                                } else {
                                    obj[row.dev_code] = row;
                                }
                            }
                            var rs = [];
                            for (var i in obj) {
                                var o = obj[i];
                                if (o.userId == userId) {
                                    rs.push(o)
                                } else {
                                    o.status = 5;
                                    rs.push(o);
                                }
                            }
                            message.Status = true;
                            message.message = 'OK';
                            message.Data = rs;
                            res.json(message);
                        }
                    });
                }
            ],
            function (error, message) {
                res.json(message);
            }
        )
    },
    /**
     * 获取盒子信息
     * @param req
     * @param res
     */
    getBoxInfo: function (req, res) {
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
        var sql = 'SELECT u.dev_code ,u.status,i.name,i.dev_desc,i.address,i.longitude,i.latitude from box_user_box u LEFT JOIN box_box_info i on u.dev_Code = i.dev_code where u.user_id = ' + userId + ' and u.dev_code = "' + devCode + '"';
        logger.debug('获取盒子信息sql:' + sql);
        query(sql, function (error, rows) {
            if (error) {
                logger.error('获取盒子信息错误：' + error);
                message.Status = false;
                message.message = '验证盒子信息出错';
                message.Data = null;
                callback(error, message);
            } else {
                if (rows.length != 1) {
                    message.Status = false;
                    message.message = '盒子不存在';
                    message.Data = null;
                    res.json(message);
                } else {
                    message.Status = true;
                    message.message = 'OK';
                    message.Data = rows[0];
                    res.json(message);
                }
            }
        });

    },
    /**
     * 获取盒子信息
     * @param req
     * @param res
     */
    editBoxInfo: function (req, res) {
        var userId = req.body.userId;
        var devCode = req.body.devCode;
        var devName = req.body.devName;
        var devDesc = req.body.devDesc;
        var address = req.body.address;
        var longitude = req.body.longitude;
        var latitude = req.body.latitude;
        if (!userId) {
            message.Status = false;
            message.message = '用户ID不能为空';
            message.Data = null;
            res.json(message);
            return;
        }
        if (!devCode || !devName) {
            message.Status = false;
            message.message = '设备码和设备名称不能为空';
            message.Data = null;
            res.json(message);
            return;
        }

        var obj = {};
        obj.name = devName;
        obj.dev_desc = devDesc;
        obj.address = address;
        if (longitude && typeof(longitude) == 'number') {
            obj.longitude = longitude;
        }
        if (latitude && typeof(latitude) == 'number') {
            obj.latitude = latitude;
        }
        async.waterfall(
            [
                function (callback) {
                    var sql = sqlQuery.select().from('box_user_box').select(['id']).where({dev_code: devCode, user_id: userId}).build();
                    logger.debug('获取当前盒子是否存在sql:' + sql);
                    query(sql, function (error, rows) {
                        if (error) {
                            logger.error('获取盒子信息错误：' + error);
                            message.Status = false;
                            message.message = '验证盒子信息出错';
                            message.Data = null;
                            callback(error, message);
                        } else {
                            if (rows.length != 1) {
                                message.Status = false;
                                message.message = '盒子不存在';
                                message.Data = null;
                                callback(new Error({msg: '盒子不存在'}), message);
                            } else {
                                callback(null);
                            }
                        }
                    })
                },
                function (callback) {
                    var sql = sqlQuery.update().into('box_box_info').set(obj).where({dev_code: devCode}).build();
                    logger.debug('更新盒子信息sql：' + sql);
                    query(sql, function (error, rows) {
                        if (error) {
                            logger.error('更新盒子信息错误：' + error);
                            message.Status = false;
                            message.message = '更新盒子关联错误';
                            message.Data = null;
                            callback(error, message);
                        } else {
                            message.Status = true;
                            message.message = 'OK';
                            message.Data = null;
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
     * 分享盒子
     * @param req
     * @param res
     */
    shareBox: function (req, res) {
        var fromUserId = req.body.fromUserId;
        var toUserId = req.body.toUserId;
        var devCode = req.body.devCode;
        if (!fromUserId || !toUserId) {
            message.Status = false;
            message.message = '分享人和被分享人都不能为空';
            message.Data = null;
            res.json(message);
            return;
        }
        if (fromUserId == toUserId) {
            message.Status = false;
            message.message = '分享人和被分享人不能为同一人';
            message.Data = null;
            res.json(message);
            return;
        }

        async.waterfall(
            [
                function (callback) {
                    var sql = 'select count(user_id) as count from sys_user where user_id =' + fromUserId + ' or user_id =' + toUserId;
                    logger.debug('获取用户信息是否存在sql:' + sql);
                    query(sql, function (error, rows) {
                        if (error) {
                            logger.error('获取用户信息错误：' + error);
                            message.Status = false;
                            message.message = '获取用户信息失败';
                            message.Data = null;
                            callback(error, message);
                        }
                        if (rows[0].count != 2) {
                            message.Status = false;
                            message.message = '用户不存在';
                            message.Data = null;
                            callback(new Error('用户不存在'), message);
                        } else {
                            callback(null);
                        }
                    });
                },
                function (callback) {
                    var sql = sqlQuery.select().from('box_user_box').select(['id']).where({dev_code: devCode, user_id: fromUserId, status: [2, 3]}).build();
                    logger.debug('获取当前用户是否拥有盒子sql:' + sql);
                    query(sql, function (error, rows) {
                        if (error) {
                            logger.error('获取当前用户是否拥有该盒子错误：' + error);
                            message.Status = false;
                            message.message = '获取当前用户是否拥有该盒子出错';
                            message.Data = null;
                            callback(error, message);
                        }
                        if (rows.length != 1) {
                            message.Status = false;
                            message.message = '盒子不存在';
                            message.Data = null;
                            callback(new Error({msg: '盒子不存在'}), message);
                        } else {
                            callback(null);
                        }
                    })
                },
                function (callback) {
                    var sql = sqlQuery.select().from('box_user_box').select(['id']).where({dev_code: devCode, user_id: toUserId}).build();
                    logger.debug('获取被分享用户是否拥有该盒子sql:' + sql);
                    query(sql, function (error, rows) {
                        if (error) {
                            logger.error('获取被分享用户是否拥有该盒子错误:' + error);
                            message.Status = false;
                            message.message = '获取被分享用户是否拥有该盒子出错';
                            message.Data = null;
                            callback(error, message);
                        }
                        if (rows.length > 0) {
                            message.Status = false;
                            message.message = '当前用户已被分享过该盒子';
                            message.Data = null;
                            callback(new Error('盒子不存在'), message);
                        } else {
                            callback(null);
                        }
                    })
                },
                function (callback) {
                    var sql = sqlQuery.insert().into('box_user_box').set({
                        user_id: toUserId,
                        from_user_id: fromUserId,
                        to_user_id: toUserId,
                        status: 4,
                        dev_code: devCode,
                        create_date: Utils.dateFormat(new Date().getTime(), Utils.yyyyMMddhhmmss)
                    }).build();
                    logger.debug('插入盒子分享信息sql：' + sql);
                    query(sql, function (error, rows) {
                        if (error) {
                            logger.error('插入盒子分享信息错误：' + error);
                            message.Status = false;
                            message.message = '插入盒子分享信息错误';
                            message.Data = null;
                            callback(error, message);
                        } else {
                            callback(null);
                        }
                    });
                },
                function (callback) {
                    var sql = sqlQuery.update().into('box_user_box').set({
                        status: 3,
                        update_date: Utils.dateFormat(new Date().getTime(), Utils.yyyyMMddhhmmss)
                    }).where({user_id: fromUserId, dev_code: devCode}).build();
                    logger.debug('更新盒子分享信息sql：' + sql);
                    query(sql, function (error, rows) {
                        if (error) {
                            logger.error('更新盒子分享信息错误：' + error);
                            message.Status = false;
                            message.message = '更新盒子分享信息出错';
                            message.Data = null;
                            callback(error, message);
                        } else {
                            message.Status = true;
                            message.message = 'OK';
                            message.Data = null;
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
     * 取消分享盒子
     * @param req
     * @param res
     */
    cancelShareBox: function (req, res) {
        var fromUserId = req.body.fromUserId;
        var toUserId = req.body.toUserId
        var devCode = req.body.devCode;
        if (!fromUserId || !toUserId) {
            message.Status = false;
            message.message = '分享人和被分享人都不能为空';
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
                    var sql = sqlQuery.remove().from('box_user_box').where({from_user_id: fromUserId, to_user_id: toUserId, dev_code: devCode}).build();
                    logger.debug('移除分享信息sql:' + sql);
                    query(sql, function (error, rows) {
                        if (error) {
                            logger.error('移除分享信息错误：' + error);
                            message.Status = false;
                            message.message = '移除分享信息失败';
                            message.Data = null;
                            callback(error, message);
                        } else {
                            callback(null);
                        }
                    });
                },
                function (callback) {
                    var sql = sqlQuery.select().from('box_user_box').select(['id']).where({
                        from_user_id: fromUserId,
                        dev_code: devCode
                    }).build();
                    logger.debug('查询当前用户的当前盒子是否还有分享sql:' + sql);
                    query(sql, function (error, rows) {
                        if (error) {
                            logger.error('查询当前用户的当前盒子是否还有分享错误：' + error);
                            message.Status = false;
                            message.message = '移除分享信息失败';
                            message.Data = null;
                            callback(error, message);
                        } else {
                            callback(null, rows.length);
                        }
                    });
                },
                function (count, callback) {
                    var sql = sqlQuery.update().into('box_user_box').set({
                        update_date: Utils.dateFormat(new Date().getTime(), Utils.yyyyMMddhhmmss)
                    }).where({user_id: fromUserId, dev_code: devCode}).build();
                    if (count == 0) {
                        sql = sqlQuery.update().into('box_user_box').set({
                            status: 2,
                            update_date: Utils.dateFormat(new Date().getTime(), Utils.yyyyMMddhhmmss)
                        }).where({user_id: fromUserId, dev_code: devCode}).build();
                    }
                    logger.debug('更新盒子分享信息sql：' + sql);
                    query(sql, function (error, rows) {
                        if (error) {
                            logger.error('更新盒子分享信息错误：' + error);
                            message.Status = false;
                            message.message = '更新盒子分享信息出错';
                            message.Data = null;
                            callback(error, message);
                        } else {
                            message.Status = true;
                            message.message = 'OK';
                            message.Data = null;
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
    getShareBox: function (req, res) {
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
        var sql = 'SELECT u.dev_code,u.to_user_id as userId,su.user_name as userName,su.job_no as jobNo, i.NAME as name, i.dev_desc, u.create_date FROM box_user_box u '
            + ' LEFT JOIN box_box_info i ON u.dev_Code = i.dev_code '
            + ' LEFT JOIN sys_user su on u.to_user_id = su.USER_ID '
            + ' where u.status = 4 and u.from_user_id = ' + userId + ' and u.dev_code = "' + devCode + '"';
        logger.debug('获取盒子分享信息sql:' + sql);
        query(sql, function (error, rows) {
            if (error) {
                logger.error('获取盒子分享信息错误：' + error);
                message.Status = false;
                message.message = '获取盒子分享信息出错';
                message.Data = null;
                res.json(message);
            } else {
                message.Status = true;
                message.message = 'OK';
                message.Data = rows;
                res.json(message);
            }
        });
    },
    getBoxStatus: function (req, res) {
        var userId = req.body.userId || req.query.userId;
        if (!userId) {
            message.Status = false;
            message.message = '用户ID不能为空';
            message.Data = null;
            res.json(message);
            return;
        }
        async.waterfall(
            [
                function (callback) {
                    var sql = 'SELECT bi.dev_code as devCode,bi.name as name,bi.status from box_user_box ub LEFT join box_box_info bi on ub.dev_Code = bi.dev_code where bi.is_push = 0 and user_id = ' + userId;
                    logger.debug('获取盒子上下线信息sql:' + sql);
                    query(sql, function (error, rows) {
                        if (error) {
                            logger.error('获取盒子分享信息错误：' + error);
                            message.Status = false;
                            message.message = '获取盒子分享信息出错';
                            message.Data = [];
                            callback(new Error('获取信息错误'), message);
                        } else {
                            if (rows.length < 1) {
                                message.Status = true;
                                message.message = 'OK';
                                message.Data = [];
                                callback(new Error('没有盒子上下线信息'), message);
                            } else {
                                callback(null, rows);
                            }
                        }
                    });
                },
                function (data, callback) {
                    var sql = 'update box_box_info set is_push  = 1 where is_push = 0 and dev_code in (SELECT dev_code from box_user_box where user_id = ' + userId + ' )';
                    logger.debug('更新盒子是否推送过信息sql:' + sql);
                    query(sql, function (error, rows) {
                        if (error) {
                            logger.error('更新盒子是否推送过信息错误：' + error);
                            message.Status = false;
                            message.message = '更新盒子是否推送过信息出错';
                            message.Data = [];
                            callback(new Error('更新盒子是否推送过信息出错'), message);
                        } else {
                            message.Status = true;
                            message.message = 'OK';
                            message.Data = data;
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
    setSubscribeBoxAlarm: function (req, res) {
        var userId = req.body.userId;
        var devCode = req.body.devCode;
        var flag = req.body.flag;
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
                    var sql = sqlQuery.select().from('box_user_box').select(['id']).where({dev_code: devCode, user_id: userId}).build();
                    logger.debug('获取当前盒子是否存在sql:' + sql);
                    query(sql, function (error, rows) {
                        if (error) {
                            logger.error('获取盒子信息错误：' + error);
                            message.Status = false;
                            message.message = '验证盒子信息出错';
                            message.Data = null;
                            callback(error, message);
                        }
                        if (rows.length != 1) {
                            message.Status = false;
                            message.message = '盒子不存在';
                            message.Data = null;
                            callback(new Error('盒子不存在'), message);
                        } else {
                            callback(null);
                        }
                    });
                },
                function (callback) {
                    var sql = sqlQuery.update().into('box_user_box').set({
                        is_subscribe: flag == 'true' ? 1 : 0
                    }).where({user_id: userId, dev_code: devCode}).build();
                    logger.debug('更新盒子报警订阅状态sql:' + sql);
                    query(sql, function (error, rows) {
                        if (error) {
                            logger.error('更新盒子报警订阅状态错误：' + error);
                            message.Status = false;
                            message.message = '更新盒子报警订阅状态出错';
                            message.Data = null;
                            callback(error, message);
                        } else {
                            message.Status = true;
                            message.message = 'OK';
                            message.Data = null;
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
    boxProjectTransfer: function (req, res) {
        var userId = req.body.userId;
        var toPhoneNum = req.body.toPhoneNum;
        var jobNo = req.body.toJobNo;
        var smsCode = req.body.smsCode;
        var UUID = req.body.UUID;
        if (!userId) {
            message.Status = false;
            message.message = '用户ID不能为空';
            message.Data = null;
            res.json(message);
            return;
        }
        if (!toPhoneNum) {
            message.Status = false;
            message.message = '被移交方手机号不能为空';
            message.Data = null;
            res.json(message);
            return;
        }
        var obj = SMS.getSms(UUID);
        if (!obj) {
            message.Status = -1;
            message.message = '验证码为空';
            message.Data = null;
            res.json(message);
            return;
        }
        var smsOnlineCode = obj.smsCode;
        var onlinePhone = obj.phone;
        if (smsOnlineCode != smsCode || onlinePhone != toPhoneNum) {
            message.Status = -1;
            message.message = '验证码不正确';
            message.Data = null;
            res.json(message);
            return;
        }
        SMS.deleteSms(UUID);
        var date = Utils.dateFormat(new Date().getTime(), Utils.yyyyMMddhhmmss);
        transaction(function (err, conn) {
            if (err) {
                logger.error('工程移交盒子 transaction ERROR：' + err);
                message.Status = false;
                message.message = "操作失败";
                message.Data = null;
                res.json(message);
                return;
            } else {
                async.waterfall(
                    [
                        function (callback) {
                            var sql = 'SELECT user_Id as userId ,job_no as jobNo, source,mobile_phone,enterprise_id as companyId,enterprise_name as companyName from sys_user where user_id  = ' + userId + ' or (MOBILE_PHONE = "' + toPhoneNum + '" and JOB_NO = "' + jobNo + '" )';
                            logger.debug('获取移交方和被移交方信息sql:' + sql);
                            conn.query(sql, function (error, rows) {
                                if (error) {
                                    logger.error('获取移交方和被移交方信息错误：' + error);
                                    message.Status = false;
                                    message.message = '获取移交方和被移交方信息出错';
                                    message.Data = null;
                                    callback(error, message);
                                }
                                if (rows.length != 2) {
                                    message.Status = false;
                                    message.message = '移交方和被移交方不存在';
                                    message.Data = null;
                                    callback(new Error('移交方和被移交方不存在'), message);
                                } else {
                                    if (rows[0].userId == userId) {
                                        callback(null, rows[0], rows[1]);
                                    } else {
                                        callback(null, rows[1], rows[0]);
                                    }
                                }
                            });
                        },
                        function (fromUser, toUser, callback) {
                            var sql = '';
                            if (fromUser.source == 2) {
                                sql = 'SELECT USER_ID,dev_code from box_user_box where USER_ID in (SELECT USER_ID from sys_user where MOBILE_PHONE ="' + fromUser.mobile_phone + '")';
                            } else {
                                sql = sqlQuery.select().from('box_user_box').select(['user_id', 'dev_code']).where({user_id: userId}).build();
                            }
                            logger.debug('获取当前用户下属盒子信息sql:' + sql);
                            conn.query(sql, function (error, rows) {
                                if (error) {
                                    logger.error('获取当前用户下属盒子信息错误：' + error);
                                    message.Status = false;
                                    message.message = '获取当前用户下属盒子信息出错';
                                    message.Data = null;
                                    callback(error, message);
                                } else {
                                    if (rows.length < 1) {
                                        message.Status = true;
                                        message.message = 'OK';
                                        message.Data = null;
                                        callback(new Error('当前用户没有盒子'), message);
                                    } else {
                                        callback(null, fromUser, toUser, rows);
                                    }
                                }
                            });
                        },
                        function (fromUser, toUser, rs, callback) {
                            var date = Utils.dateFormat(new Date().getTime(), Utils.yyyyMMddhhmmss);
                            var devCodes = [];
                            for (var i in rs) {
                                devCodes.push(rs[i].dev_code);
                            }
                            var sql = sqlQuery.update().into('box_user_box').set({user_id: toUser.userId, update_date: date}).where({
                                dev_code: devCodes,
                                status: [2, 3]
                            }).build();
                            logger.debug('更新盒子归属信息sql:' + sql);
                            conn.query(sql, function (error, rows) {
                                if (error) {
                                    logger.error('更新盒子归属错误：' + error);
                                    message.Status = false;
                                    message.message = '更新盒子归属出错';
                                    message.Data = null;
                                    callback(error, message);
                                } else {
                                    callback(null, fromUser, toUser, devCodes, date);
                                }
                            });
                        },
                        function (fromUser, toUser, devCodes, date, callback) {
                            var sql = sqlQuery.update().into('box_user_box').set({from_user_id: toUser.userId, update_date: date}).where({
                                dev_code: devCodes,
                                status: 4
                            }).build();
                            logger.debug('更新盒子归属分享信息sql:' + sql);
                            conn.query(sql, function (error, rows) {
                                if (error) {
                                    logger.error('更新盒子归属分享错误：' + error);
                                    message.Status = false;
                                    message.message = '更新盒子归属分享出错';
                                    message.Data = null;
                                    callback(error, message);
                                } else {
                                    callback(null, fromUser, toUser, devCodes);
                                }
                            });
                        },
                        function (fromUser, toUser, devCodes, callback) {
                            var sql = 'select dev_code from box_user_box where user_id = from_user_id ';
                            logger.debug('获取分享信息sql:' + sql);
                            conn.query(sql, function (error, rows) {
                                if (error) {
                                    logger.error('获取分享错误：' + error);
                                    message.Status = false;
                                    message.message = '获取分享出错';
                                    message.Data = null;
                                    callback(error, message);
                                } else {
                                    callback(null, rows, fromUser, toUser, devCodes);
                                }
                            });
                        },
                        function (rs, fromUser, toUser, devCodes, callback) {
                            if (rs.length > 0) {
                                var devCodes = [];
                                for (var i in  rs) {
                                    devCodes.push(rs[i].dev_code);
                                }
                                var sql = sqlQuery.update().into('box_user_box').set({status: 2}).where({dev_code: devCodes}).build();
                                logger.debug('更新分享信息sql:' + sql);
                                conn.query(sql, function (error, rows) {
                                    if (error) {
                                        logger.error('更新分享错误：' + error);
                                        message.Status = false;
                                        message.message = '更新分享出错';
                                        message.Data = null;
                                        callback(error, message);
                                    } else {
                                        callback(null, fromUser, toUser, devCodes);
                                    }
                                });
                            } else {
                                callback(null, fromUser, toUser, devCodes);
                            }
                        },
                        function (fromUser, toUser, devCodes, callback) {
                            var sql = 'delete from box_user_box where user_id = from_user_id ';
                            logger.debug('删除分享信息sql:' + sql);
                            conn.query(sql, function (error, rows) {
                                if (error) {
                                    logger.error('删除分享错误：' + error);
                                    message.Status = false;
                                    message.message = '删除分享分享出错';
                                    message.Data = null;
                                    callback(error, message);
                                } else {
                                    callback(null, fromUser, toUser, devCodes);
                                }
                            });
                        },
                        function (fromUser, toUser, devCodes, callback) {
                            var targetURI;
                            if (toUser.source == 2) {
                                targetURI = '/' + toUser.companyName + '/' + toUser.jobNo;
                                callback(null, targetURI, toUser);
                            } else {
                                var sql = 'SELECT user_id as userId,job_no as jobNo,enterprise_id as companyId,enterprise_name as companyName from sys_user where SOURCE =2 and MOBILE_PHONE in (SELECT MOBILE_PHONE from sys_user where USER_ID = ' + toUser.userId + ' )';
                                logger.debug('获取上级用户sql:', sql);
                                conn.query(sql, function (error, rows) {
                                    if (error) {
                                        logger.error('获取上级用户错误:', error);
                                        message.Status = false;
                                        message.message = '获取上级用户错误';
                                        message.Data = null;
                                        callback(new Error('获取上级用户错误'), message);
                                    } else {
                                        if (rows.length == 1) {
                                            targetURI = '/' + rows[0].companyName + '/' + rows[0].jobNo + '/' + toUser.jobNo;
                                        } else {
                                            targetURI = '/' + toUser.jobNo;
                                        }
                                        callback(null, targetURI, fromUser, toUser, devCodes);
                                    }
                                });
                            }
                        },
                        function (targetURI, fromUser, toUser, devCodes, callback) {
                            var sourceURI;
                            if (fromUser.source == 2) {
                                sourceURI = '/' + fromUser.companyName + '/' + fromUser.jobNo;
                                callback(null, sourceURI, toUser);
                            } else {
                                var sql = 'SELECT user_id as userId,job_no as jobNo,enterprise_id as companyId,enterprise_name as companyName from sys_user where SOURCE =2 and MOBILE_PHONE in (SELECT MOBILE_PHONE from sys_user where USER_ID = ' + fromUser.userId + ' )';
                                logger.debug('获取上级用户sql:', sql);
                                conn.query(sql, function (error, rows) {
                                    if (error) {
                                        logger.error('获取上级用户错误:', error);
                                        message.Status = false;
                                        message.message = '获取上级用户错误';
                                        message.Data = null;
                                        callback(new Error('获取上级用户错误'), message);
                                    } else {
                                        if (rows.length == 1) {
                                            sourceURI = '/' + rows[0].companyName + '/' + rows[0].jobNo + '/' + fromUser.jobNo;
                                        } else {
                                            sourceURI = '/' + fromUser.jobNo;
                                        }
                                        callback(null, sourceURI, targetURI, fromUser, toUser, devCodes);
                                    }
                                });
                            }
                        },
                        function (sourceURI, targetURI, fromUser, toUser, devCodes, callback) {
                            var sql = 'select domain_id as domainId,URI,company_id as companyId from sys_domain where URI ="' + targetURI + '"';
                            logger.debug('获取上级域 sql:', sql);
                            conn.query(sql, function (error, rows) {
                                if (error) {
                                    logger.error('获取上级域错误:', error);
                                    message.Status = false;
                                    message.message = '获取上级域错误';
                                    message.Data = null;
                                    callback(new Error('获取上级域错误'), message);
                                } else {
                                    if (rows.length == 1) {
                                        callback(null, sourceURI, targetURI, fromUser, toUser, devCodes, rows[0].domainId);
                                    } else {
                                        message.Status = false;
                                        message.message = '没有对应的上级域';
                                        message.Data = null;
                                        callback(new Error('没有对应的上级域'), message);
                                    }
                                }
                            });
                        },
                        function (sourceURI, targetURI, fromUser, toUser, devCodes, domainId, callback) {
                            var sql = 'select id as id,URI from sys_mtree where URI ="' + targetURI + '"';
                            logger.debug('获取上级MTree sql:', sql);
                            conn.query(sql, function (error, rows) {
                                if (error) {
                                    logger.error('获取上级MTree 错误:', error);
                                    message.Status = false;
                                    message.message = '获取上级MTree 错误';
                                    message.Data = null;
                                    callback(new Error('获取上级MTree 错误'), message);
                                } else {
                                    if (rows.length == 1) {
                                        callback(null, sourceURI, targetURI, fromUser, toUser, devCodes, domainId, rows[0].id);
                                    } else {
                                        message.Status = false;
                                        message.message = '没有对应的上级MTree';
                                        message.Data = null;
                                        callback(new Error('没有对应的上级MTree'), message);
                                    }
                                }
                            });
                        },
                        function (sourceURI, targetURI, fromUser, toUser, devCodes, domainId, mtreeId, callback) {
                            var date = Utils.dateFormat(new Date().getTime(), Utils.yyyyMMddhhmmss);
                            async.eachSeries(devCodes, function (devCode, callbackSeries) {
                                async.waterfall(
                                    [
                                        function (callbackWater) {
                                            var sql = 'select domain_id as domainId,URI,company_id as companyId from sys_domain where type = 3 and name = "' + devCode + '"';
                                            logger.debug('获取是否绑定过信息sql:', sql);
                                            conn.query(sql, function (error, rows) {
                                                if (error) {
                                                    logger.error('获取是否绑定过信息错误:', error);
                                                    message.Status = false;
                                                    message.message = '获取绑定信息错误'
                                                    message.Data = null;
                                                    callbackWater(new Error('获取绑定信息错误'), message);
                                                } else {
                                                    callbackWater(null, rows[0].URI);
                                                }
                                            });
                                        },
                                        function (URI, callbackWater) {
                                            var sql = 'update sys_user_domain set USER_ID = ' + toUser.userId + ',update_date = "' + date + '" where DOMAIN_ID in (select DOMAIN_ID from sys_domain where URI = "' + URI + '")'
                                            logger.debug('更新对应的域所属sql:', sql);
                                            conn.query(sql, function (error, rows) {
                                                if (error) {
                                                    logger.error('更新对应的域所属错误：', error);
                                                    message.Status = false;
                                                    message.message = '更新对应的域所属错误';
                                                    message.Data = null;
                                                    callbackWater(new Error('更新对应的域所属错误'), message);
                                                } else {
                                                    callbackWater(null, URI);
                                                }
                                            });
                                        },
                                        function (URI, callbackWater) {
                                            var sql = sqlQuery.update().into('sys_domain').set({
                                                pre_domain_Id: domainId,
                                                URI: targetURI + '/' + devCode,
                                                COMPANY_ID: toUser.companyId,
                                                TYPE: 3,
                                                update_date: date
                                            }).where({
                                                URI: URI
                                            }).build();
                                            logger.debug('更新对应的用户顶级域sql:', sql);
                                            conn.query(sql, function (error, rows) {
                                                if (error) {
                                                    logger.error('更新对应的用户顶级域错误：', error);
                                                    message.Status = false;
                                                    message.message = '更新顶级域错误';
                                                    message.Data = null;
                                                    callbackWater(new Error('更新顶级域错误'), message);
                                                } else {
                                                    callbackWater(null, URI);
                                                }
                                            });
                                        },
                                        function (URI, callbackWater) {
                                            var sql = sqlQuery.update().into('sys_mtree').set({
                                                PID: mtreeId,
                                                URI: targetURI + '/' + devCode,
                                                COMPANY_ID: toUser.companyId,
                                                update_date: date
                                            }).where({
                                                URI: URI
                                            }).build();
                                            logger.debug('更新对应的用户顶级MTree sql:', sql);
                                            conn.query(sql, function (error, rows) {
                                                if (error) {
                                                    logger.error('更新对应的用户顶级MTree错误：', error);
                                                    message.Status = false;
                                                    message.message = '更新顶级MTree错误';
                                                    message.Data = null;
                                                    callbackWater(new Error('更新顶级MTree 错误'), message);
                                                } else {
                                                    callbackWater(null, URI);
                                                }
                                            });
                                        },
                                        function (URI, callbackWater) {
                                            var sql = 'update sys_domain set URI=INSERT(URI,1,' + URI.length + ',"' + targetURI + '/' + devCode + '"),company_id = ' + toUser.companyId +
                                                ',update_date="' + date + '" where URI like "' + URI + '/%"';
                                            logger.debug('更新对应的下属域信息sql:', sql);
                                            conn.query(sql, function (error, rows) {
                                                if (error) {
                                                    logger.error('更新对应的下属域错误：', error);
                                                    message.Status = false;
                                                    message.message = '更新对应的下属域错误';
                                                    message.Data = null;
                                                    callbackWater(new Error('更新对应的下属域错误'), message);
                                                } else {
                                                    callbackWater(null, URI);
                                                }
                                            });
                                        },
                                        function (URI, callbackWater) {
                                            var sql = 'update sys_mtree set URI=INSERT(URI,1,' + URI.length + ',"' + targetURI + '/' + devCode + '"),company_id = ' + toUser.companyId +
                                                ',update_date="' + date + '" where URI like "' + URI + '/%"';
                                            logger.debug('更新对应的下属MTree信息sql:', sql);
                                            conn.query(sql, function (error, rows) {
                                                if (error) {
                                                    logger.error('更新对应的下属MTree错误：', error);
                                                    message.Status = false;
                                                    message.message = '更新对应的下属MTree错误';
                                                    message.Data = null;
                                                    callbackWater(new Error('更新对应的下属MTree错误'), message);
                                                } else {
                                                    callbackWater(null, URI);
                                                }
                                            });
                                        },
                                        function (URI, callbackWater) {
                                            var sql = 'SELECT point.POINT_ID,point.UUID,point.POINT_NAME,point.URI from sys_point point where URI like "' + URI + '/%"';
                                            logger.debug('获取节点下面的测信息sql：' + sql);
                                            conn.query(sql, function (err, rows) {
                                                if (err) {
                                                    logger.error('获取节点下面测点信息错误：' + err);
                                                    message.Status = false;
                                                    message.Data = null;
                                                    message.message = '获取节点信息失败';
                                                    callbackWater(err, message);
                                                } else {
                                                    callbackWater(null, rows, URI);
                                                }
                                            });
                                        },
                                        function (rows, URI, callbackWater) {
                                            if (!rows || rows.length < 1) {
                                                callbackWater(null, false, null);
                                            } else {
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
                                                    var pointURI = row.URI.indexOf(URI + '/', targetURI + '/');
                                                    var UUID = opPool.makeUUID(pointURI);
                                                    rr.push(UUID);
                                                    UUID = '0x' + UUID;
                                                    rr.push(UUID);
                                                    rrs.push(rr);
                                                    sqlPointsUUID += 'when ' + row.POINT_ID + ' then "' + UUID + '" ';
                                                    sqlPointURI += 'when ' + row.POINT_ID + ' then "' + pointURI + '" ';
                                                    sqlPointIds.push(row.POINT_ID);
                                                }
                                                sqlPoints = 'update sys_point set UUID = case POINT_ID ' + sqlPointsUUID + ' end,URI= case POINT_ID ' + sqlPointURI + ' end ,DOMAIN_ID = ' + domainId + ' where point_ID in( ' + sqlPointIds.toString() + ')';
                                                opPool.update('Point', rrs, cols, function (error, rows, columns) {
                                                    if ((error != 0 && error && error.code) || rows[0].EC != 0) {
                                                        logger.error('编辑测点信息错误：' + JSON.stringify(error));
                                                        message.Status = false;
                                                        message.message = '更新测点信息失败';
                                                        message.Data = null;
                                                        callbackWater(new Error('更新测点信息错误'), message);
                                                    } else {
                                                        callbackWater(null, true, sqlPoints);
                                                    }
                                                });
                                            }
                                        },
                                        function (points, sqlPoints, callbackWater) {
                                            if (points) {
                                                logger.debug('box用户审核更新测点信息sql:' + sqlPoints);
                                                conn.query(sqlPoints, function (err, rows) {
                                                    if (err) {
                                                        logger.error('更新关系库测点信息错误：' + err);
                                                        message.Status = false;
                                                        message.Data = null;
                                                        message.message = '更新数据库信息错误';
                                                        callbackWater(new Error('更新测点信息错误'), message);
                                                    } else {
                                                        callbackWater(null);
                                                    }
                                                });
                                            } else {
                                                callbackWater(null);
                                            }
                                        },
                                        function (callbackWater) {
                                            var path = './public/userfile/';
                                            sourceURI = path + fromUser.companyId + '/resources' + sourceURI + '/' + devCode;
                                            targetURI = path + toUser.companyId + '/resources' + targetURI + '/' + devCode;
                                            fs.exists(targetURI, function (exists) {
                                                if (exists) {
                                                    fileUtils.rmdirSync(targetURI);
                                                    fs.mkdirSync(targetURI);
                                                }
                                                if (!exists) {
                                                    fs.mkdirSync(targetURI);
                                                }
                                                fileUtils.copyFileSync(sourceURI, targetURI);
                                                fileUtils.rmdirSync(sourceURI);
                                                message.Status = true;
                                                message.message = 'OK';
                                                message.Data = null;
                                                callbackWater(null, message);
                                            });

                                        }
                                    ],
                                    function (error, message) {
                                        if (error) {
                                            callback(error, message);
                                        } else {
                                            callbackSeries(null, message);
                                        }
                                    });
                            }, function (err) {
                                if (err) {
                                    message.Status = false;
                                    message.message = '操作失败';
                                    message.Data = null;
                                } else {
                                    message.Status = true;
                                    message.message = 'OK';
                                    message.Data = null;
                                }
                                callback(err, message);
                            });
                        }
                    ],
                    function (error, message) {
                        res.json(message);
                    });
            }
        });
    }
};
module.exports = boxInfo;
var actionUtil = require("../../framework/action/actionUtils")();
var async = require("async");
var query = actionUtil.query;
var Utils = require('../../utils/tools/utils');
var logger = require('log4js').getLogger('Ibox');
var GlobalAgent = require('../../message/GlobalAgent');
var sqlQuery = require('sql-query').Query();
var SMS = require('../../utils/sms/sms');
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
        async.waterfall(
            [
                function (callback) {
                    var sql = sqlQuery.select().from('box_box_info').select(['id']).where({dev_code: devCode, ver_code: verCode}).build();
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
                    var sql = sqlQuery.select().from('box_user_box').select(['id']).where({dev_code: devCode, status: [2, 3]}).build();
                    logger.debug('获取当前盒子是否绑定sql:' + sql);
                    query(sql, function (error, rows) {
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
                    var sql = sqlQuery.insert().into('box_user_box').set({
                        user_id: userId,
                        dev_code: devCode,
                        Status: 2,
                        CREATE_DATE: Utils.dateFormat(new Date().getTime(), Utils.yyyyMMddhhmmss)
                    }).build();
                    logger.debug('用户盒子关联信息sql：' + sql);
                    query(sql, function (error, rows) {
                        if (error) {
                            message.Status = false;
                            message.message = '用户盒子关联';
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
        async.waterfall(
            [
                function (callback) {
                    var sql = sqlQuery.select().from('box_user_box').select(['user_id', 'from_user_id', 'to_user_id', 'dev_code', 'status']).where({
                        user_id: userId,
                        dev_code: devCode
                    }).build();
                    logger.debug('获取盒子绑定/分享信息sql:' + sql);
                    query(sql, function (error, rows) {
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
                    query(sql, function (error, rows) {
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
                    if (!row.from_user_id) {
                        var sql = sqlQuery.remove().from('box_user_box').where({
                            from_user_id: row.from_user_id,
                            dev_code: devCode
                        }).build();
                        logger.debug('删除当前盒子分享信息sql:' + sql);
                        query(sql, function (error, rows) {
                            if (error) {
                                logger.error('删除当前盒子分享信息错误：' + error);
                                message.Status = false;
                                message.message = '解绑盒子失败';
                                message.Data = null;
                                callback(error, message);
                            } else {
                                message.Status = true;
                                message.message = 'OK';
                                message.Data = null;
                                callback(new Error('解除对应分享信息成功'), message);
                            }
                        });
                    } else {
                        var sql = sqlQuery.select().from('box_user_box').select(['id']).where({
                            from_user_id: row.from_user_id,
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
                                callback(null, rows.length, row);
                            }
                        });
                    }
                },
                function (count, row, callback) {
                    var sql = sqlQuery.update().into('box_user_box').set({
                        update_date: Utils.dateFormat(new Date().getTime(), Utils.yyyyMMddhhmmss)
                    }).where({user_id: row.from_user_id, dev_code: devCode}).build();
                    if (count == 0) {
                        sql = sqlQuery.update().into('box_user_box').set({
                            status: 2,
                            update_date: Utils.dateFormat(new Date().getTime(), Utils.yyyyMMddhhmmss)
                        }).where({user_id: row.from_user_id, dev_code: devCode}).build();
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

        async.waterfall(
            [
                function (callback) {
                    var sql = 'SELECT user_Id , source,mobile_phone  from sys_user where user_id  = ' + userId + ' or (MOBILE_PHONE = "' + toPhoneNum + '" and JOB_NO = "' + jobNo + '" )';
                    logger.debug('获取移交方和被移交方信息sql:' + sql);
                    query(sql, function (error, rows) {
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
                            if (rows[0].user_Id == userId) {
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
                    query(sql, function (error, rows) {
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
                                callback(null, toUser, rows);
                            }
                        }
                    });
                },
                function (toUser, rs, callback) {
                    var date = Utils.dateFormat(new Date().getTime(), Utils.yyyyMMddhhmmss);
                    var devCodes = [];
                    for (var i in rs) {
                        devCodes.push(rs[i].dev_code);
                    }
                    var sql = sqlQuery.update().into('box_user_box').set({user_id: toUser.user_Id, update_date: date}).where({
                        dev_code: devCodes,
                        status: [2, 3]
                    }).build();
                    logger.debug('更新盒子归属信息sql:' + sql);
                    query(sql, function (error, rows) {
                        if (error) {
                            logger.error('更新盒子归属错误：' + error);
                            message.Status = false;
                            message.message = '更新盒子归属出错';
                            message.Data = null;
                            callback(error, message);
                        } else {
                            callback(null, toUser, devCodes, date);
                        }
                    });
                },
                function (toUser, devCodes, date, callback) {
                    var sql = sqlQuery.update().into('box_user_box').set({from_user_id: toUser.user_Id, update_date: date}).where({
                        dev_code: devCodes,
                        status: 4
                    }).build();
                    logger.debug('更新盒子归属分享信息sql:' + sql);
                    query(sql, function (error, rows) {
                        if (error) {
                            logger.error('更新盒子归属分享错误：' + error);
                            message.Status = false;
                            message.message = '更新盒子归属分享出错';
                            message.Data = null;
                            callback(error, message);
                        } else {
                            callback(null);
                        }
                    });
                },
                function (callback) {
                    var sql = 'select dev_code from box_user_box where user_id = from_user_id ';
                    logger.debug('获取分享信息sql:' + sql);
                    query(sql, function (error, rows) {
                        if (error) {
                            logger.error('获取分享错误：' + error);
                            message.Status = false;
                            message.message = '获取分享出错';
                            message.Data = null;
                            callback(error, message);
                        } else {
                            callback(null, rows);
                        }
                    });
                },
                function (rs, callback) {
                    if (rs.length > 0) {
                        var devCodes = [];
                        for (var i in  rs) {
                            devCodes.push(rs[i].dev_code);
                        }
                        var sql = sqlQuery.update().into('box_user_box').set({status: 2}).where({dev_code: devCodes}).build();
                        logger.debug('更新分享信息sql:' + sql);
                        query(sql, function (error, rows) {
                            if (error) {
                                logger.error('更新分享错误：' + error);
                                message.Status = false;
                                message.message = '更新分享出错';
                                message.Data = null;
                                callback(error, message);
                            } else {
                                callback(null);
                            }
                        });
                    } else {
                        callback(null);
                    }
                },
                function (callback) {
                    var sql = 'delete from box_user_box where user_id = from_user_id ';
                    logger.debug('删除分享信息sql:' + sql);
                    query(sql, function (error, rows) {
                        if (error) {
                            logger.error('删除分享错误：' + error);
                            message.Status = false;
                            message.message = '删除分享分享出错';
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
    }
};
module.exports = boxInfo;
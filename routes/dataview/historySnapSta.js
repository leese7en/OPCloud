var actionUtil = require("../framework/action/actionUtils")();
var logger = require('log4js').getLogger('system');
var Utils = require('../utils/tools/utils');
var sql = require('sql-query'),
    sqlQuery = sql.Query();
var async = require('async');
var query = actionUtil.query;
var message = {
    flag: 0,
    message: '成功',
    data: null
}
var historySnapSta = {
    /**
     添加点组
     */
    addPointGroup: function (req, res, action) {
        var userId = req.session.user.USER_ID;
        var groupName = req.body.groupName;
        var description = req.body.description;
        async.waterfall(
            [
                function (callback) {
                    var sql = 'select count(ID) as count from sys_point_group where user_id = ' + userId + ' and GROUP_NAME = "' + groupName + '"';
                    logger.debug('获取当前公司下的点组sql:' + sql);
                    query(sql, function (err, rows) {
                        if (err || rows[0].count > 0) {
                            logger.error('已经存在相同名称的点组:' + (err || rows[0].count));
                            message.flag = -1;
                            message.message = '已经存在相同名称的点组';
                            res.json(message);
                            return;
                        } else {
                            callback(null);
                        }
                    });
                },
                function (callback) {
                    var sql = sqlQuery.insert().into('sys_point_group').set({
                        GROUP_NAME: groupName,
                        DESCRIPTION: description,
                        USER_ID: userId,
                        create_date: Utils.dateFormat(new Date().getTime(), Utils.yyyyMMddhhmmss)
                    }).build();
                    logger.debug('插入点组信息sql：' + sql);
                    query(sql, function (err, rows) {
                        if (err) {
                            logger.error('添加点组信息失败：' + err);
                            message.flag = -1;
                            message.message = '添加点组信息失败';
                            res.json(message);
                            return;
                        } else {
                            message.flag = 0;
                            message.data = rows.insertId;
                            message.message = 'OK';
                            res.json(message);
                            return;
                        }
                    });
                }
            ],
            function (err, result) {
                if (err) {
                    logger.error('添加点组信息失败：' + err);
                    message.flag = -1;
                    message.message = '添加点组信息失败';
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
    },
    //根据ID获取点组信息
    getPointGroupById: function (req, res, action) {
        var groupId = req.body.updatePointGroupId;
        var sql = 'select GROUP_NAME, DESCRIPTION from sys_point_group where id = ' + groupId;
        query(sql, function (err, rows) {
            if (err) {
                logger.error('根据ID获取点组信息失败:' + err);
                message.flag = -1;
                message.message = '根据ID获取点组信息失败';
                res.json(message);
                return;
            } else {
                message.flag = 0;
                message.message = '根据ID获取点组信息成功';
                message.data = rows[0];
                res.json(message);
                return;
            }
        });
    },
    /**
     更新点组
     */
    updatePointGroup: function (req, res, action) {
        var userId = req.session.user.USER_ID;
        var groupId = req.body.updatePointGroupId;
        var groupName = req.body.pointGroupName;
        var description = req.body.pointGroupDesc;
        async.waterfall(
            [
                function (callback) {
                    var sql = 'select count(ID) as count from sys_point_group where user_id = ' + userId + ' and GROUP_NAME = "' + groupName + '" and Id != ' + groupId;
                    logger.debug('获取当前公司下的点组是否存在相同名称点组sql:' + sql);
                    query(sql, function (err, rows) {
                        if (err || rows[0].count > 0) {
                            logger.error('已经存在相同名称的点组:' + (err || rows[0].count));
                            message.flag = -1;
                            message.message = '已经存在相同名称的点组';
                            res.json(message);
                            return;
                        } else {
                            callback(null);
                        }
                    });
                },
                function (callback) {
                    var sql = sqlQuery.update().into('sys_point_group').set({
                        GROUP_NAME: groupName,
                        DESCRIPTION: description,
                        USER_ID: userId,
                        UPDATE_DATE: Utils.dateFormat(new Date().getTime(), Utils.yyyyMMddhhmmss)
                    }).where({ID: groupId}).build();
                    logger.debug('更新点组信息sql：' + sql);
                    query(sql, function (err, rows) {
                        if (err) {
                            logger.error('更新点组信息失败：' + err);
                            message.flag = -1;
                            message.message = '更新点组信息失败';
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
                }
            ],
            function (err, result) {
                if (err) {
                    logger.error('更新点组信息失败：' + err);
                    message.flag = -1;
                    message.message = '更新点组信息失败';
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
    },
    /**
     删除点组
     */
    deletePointGroup: function (req, res) {
        var groupId = req.body.groupId;
        async.waterfall(
            [
                function (callback) {
                    var sql = 'delete from sys_group_point where GROUP_ID = ' + groupId;
                    logger.debug('删除点组下面测点sql:' + sql);
                    query(sql, function (err, rows) {
                        if (err) {
                            logger.error('删除点组下面测点错误:' + err);
                            message.flag = -1;
                            message.message = '删除点组下面测点错误';
                            res.json(message);
                            return;
                        } else {
                            callback(null);
                        }
                    });

                },
                function (callback) {
                    var sql = 'delete from sys_point_group where ID = ' + groupId;
                    logger.debug('删除点组sql：' + sql);
                    query(sql, function (err, rows) {
                        if (err) {
                            logger.error('删除点组错误：' + err);
                            message.flag = -1;
                            message.message = '删除点组错误';
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
                }
            ],
            function (err, result) {
                if (err) {
                    logger.error('删除点组错误：' + err);
                    message.flag = -1;
                    message.message = '删除点组错误：';
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
    },
    //删除点组中点
    deleteGroupPoint: function (req, res) {
        var groupId = req.body.groupId;
        var pointId = req.body.pointId;
        var sql = 'delete from sys_group_point where GROUP_ID = ' + groupId + ' and POINT_ID = ' + pointId;
        logger.debug('删除点组下面测点sql:' + sql);
        query(sql, function (err, rows) {
            if (err) {
                logger.error('删除点组下面测点错误:' + err);
                message.flag = -1;
                message.message = '删除点组下面测点错误';
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
    },
    /**
     验证点组名称是否已经存在
     */
    validatePointGroup: function (req, res, action) {
        var userId = req.session.user.USER_ID;
        var groupName = req.body.groupName;
        var sql = 'select count(ID) as count from sys_point_group where user_id = ' + userId + ' and GROUP_NAME = ' + groupName;
        logger.debug('获取当前公司下的点组sql:' + sql);
        query(sql, function (err, rows) {
            if (err || rows[0].count > 0) {
                logger.error('已经存在相同名称的点组:' + (err || rows[0].count));
                message.flag = -1;
                message.message = '已经存在相同名称的点组';
                res.json(message);
                return;
            } else {
                message.flag = 0;
                res.json(message);
                return;
            }
        });
    },
    /**
     点组中添加点
     */
    addGroupPoint: function (req, res) {
        var groupId = req.body.groupId;
        var pointIds = req.body.pointIds.toString().split(',');
        if (!groupId) {
            message.flag = -1;
            message.message = '请选择点组';
            res.json(message);
            return;
        }
        if (pointIds.length < 1) {
            message.flag = -1;
            message.message = '请选择点';
            res.json(message);
            return;
        }
        var pointsId = '';
        for (var i = 0; i < pointIds.length; i++) {
            pointsId += pointIds[i];
            if (pointIds[i + 1]) {
                pointsId += ',';
            }
        }
        async.waterfall(
            [
                function (callback) {
                    var sql = 'select count(ID) as count from sys_point_group where ID = ' + groupId;
                    logger.debug('获取点组sql:' + sql);
                    query(sql, function (err, rows) {
                        if (err || rows[0].count < 1) {
                            logger.error('ID没有对应的点组:' + (err || rows[0].count));
                            message.flag = -1;
                            message.message = '请选择点组';
                            res.json(message);
                            return;
                        } else {
                            callback(null);
                        }
                    });
                },
                function (callback) {
                    var sql = 'select distinct POINT_ID as pointID from sys_group_point where POINT_ID  in (' + pointsId + ') and GROUP_ID = ' + groupId;
                    logger.debug('当前点组是否存该点sql:' + sql);
                    query(sql, function (err, rows) {
                        if (err) {
                            logger.error('获取点组中存在测点失败:' + err);
                            message.flag = -1;
                            message.message = '请选择点组';
                            res.json(message);
                            return;
                        } else {
                            var IDs = [];
                            var exitsIds = [];
                            for (var i in pointIds) {
                                //默认不存在
                                var flag = true;
                                //如果当前测点存在于点组
                                for (var j in rows) {
                                    if (pointIds[i] == rows[j].pointID) {
                                        exitsIds.push(pointIds[i]);
                                        flag = false;
                                        break;
                                    }
                                }
                                if (flag) {
                                    IDs.push(pointIds[i]);
                                }
                            }

                            if (IDs.length < 1) {
                                message.flag = -1;
                                message.message = '所选测点已经存在于改点组';
                                res.json(message);
                                return;
                            }
                            callback(null, IDs, exitsIds);
                        }
                    });
                },
                function (IDs, exitsIds, callback) {
                    var sqlBatch = '';
                    for (var i in IDs) {
                        var sql = sqlQuery.insert().into('sys_group_point').set({
                            GROUP_ID: groupId,
                            POINT_ID: IDs[i],
                            create_date: Utils.dateFormat(new Date().getTime(), Utils.yyyyMMddhhmmss)
                        }).build();
                        sqlBatch += sql + ';';
                    }
                    logger.debug('插入点组信息sql：' + sql);
                    query(sqlBatch, function (err, rows) {
                        if (err) {
                            logger.error('添加测点到点组失败：' + err);
                            message.flag = -1;
                            message.message = '添加测点到点组失败';
                            res.json(message);
                            return;
                        } else {
                            message.flag = 0;
                            res.json(message);
                            return;
                        }
                    });
                }
            ],
            function (err, result) {
                if (err) {
                    logger.error('添加测点到点组失败：' + err);
                    message.flag = -1;
                    message.message = '添加测点到点组失败：';
                    res.json(message);
                    return;
                } else {
                    message.flag = 0;
                    res.json(message);
                    return;
                }

            });
    }
}

module.exports = historySnapSta;

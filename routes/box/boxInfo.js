var actionUtil = require("../framework/action/actionUtils")();
var query = actionUtil.query;
var devSocket = require("../api/devSocket");
var moment = require("moment");
var fs = require('fs');
var async = require('async');
var csv = require('csv');
var logger = require('log4js').getLogger('system');
var OPAPI = require('opapi');
var opPool = require('../openplant/openPlantPool');
var sqlQuery = require('sql-query').Query();
const COMMAND_FLAG = 0x33 //指令flag
const EDM_BOOT_DAS = 0xd  //启动das
const EDM_STOP_DAS = 0xe  //停止das
const EDM_SYS_UP = 0x13 //主程序升级
const EDM_ALL_DRIVER = 0x06  //查询所有驱动信息
const EDM_DRIVER_UP = 0x07  // 升级驱动
const EDM_QUERY_TIME = 0x14 //查询dasserver时间
const EDM_MOD_TIME = 0x15 //修改dasserver时间

var message = {
    flag: 0,
    message: 'OK',
    data: null
}
var dev_info = {
    onlineDevice: function (req, res) {
        var offset = req.body.offset || 0;
        var limit = req.body.limit || 10;
        var name = req.body.name;
        var code = req.body.code;
        var desc = req.body.desc;
        var anttention = req.body.anttention;
        var groupId = req.body.groupId;
        var user = req.session.user;
        async.waterfall(
            [
                function (callback) {
                    var sqlCount = '', sql = '';
                    if (user.IS_SYSTEM == 1) {
                        sqlCount = 'SELECT count(t.ID) as count FROM box_box_info t WHERE STATUS="on" ';
                        sql = 'SELECT t.ID,t.NAME,t.DEV_CODE,t.STATUS,t.IP,t.VERSION_NUM,t.SERIAL_NO,t.DEV_DESC,t.TIME,t.OUT_COUNT,t.anttention as anttention,bg.group_name as groupName FROM box_box_info t ' +
                            ' LEFT JOIN box_box_group bg on t.groupId = bg.group_id ' +
                            ' WHERE STATUS="on" ';
                    } else {
                        if (user.SOURCE == 1) {
                            sqlCount = 'SELECT count(t.ID) as count FROM box_box_info t WHERE STATUS="on" and ub.user_id=' + user.USER_ID;
                            sql = 'SELECT ub.user_id as userId,t.ID,t.NAME,t.DEV_CODE,t.STATUS,t.IP,t.VERSION_NUM,t.SERIAL_NO,t.DEV_DESC,t.TIME,t.OUT_COUNT,t.anttention as anttention,bg.group_name as groupName FROM box_box_info t ' +
                                ' LEFT JOIN box_box_group bg on t.groupId = bg.group_id ' +
                                ' LEFT JOIN box_user_box ub on t.dev_code = ub.dev_Code' +
                                ' WHERE STATUS="on" and ub.status!=4 and ub.user_id=' + user.USER_ID;
                        } else {
                            sqlCount = 'SELECT count(t.ID) as count FROM box_box_info t left join box_user_box ub on t.dev_code = ub.dev_code WHERE ub.user_id in (select USER_ID from sys_user where MOBILE_PHONE in (select MOBILE_PHONE from sys_user where user_id = ' + user.USER_ID + ')) and STATUS="on"';
                            sql = 'SELECT ub.user_id as userId, t.ID,t.NAME,t.DEV_CODE,t.STATUS,ub.Status as shareStatus,t.IP,t.VERSION_NUM,t.SERIAL_NO,t.DEV_DESC,t.TIME,t.OUT_COUNT,t.anttention as anttention,bg.group_name as groupName FROM box_box_info t ' +
                                ' LEFT JOIN box_box_group bg on t.groupId = bg.group_id ' +
                                ' LEFT JOIN box_user_box ub on t.dev_code = ub.dev_Code' +
                                ' WHERE ub.user_id in (select USER_ID from sys_user where MOBILE_PHONE in (select MOBILE_PHONE from sys_user where user_id = ' + user.USER_ID + ')) and ub.status!=4 and STATUS="on"';
                        }
                    }
                    if (groupId != -1) {
                        sqlCount += ' and groupId = ' + groupId;
                        sql += ' and groupId = ' + groupId;
                    }
                    if (anttention == 1) {
                        sqlCount += ' and anttention = 1';
                        sql += ' and anttention = 1';
                    }
                    if (name) {
                        sqlCount += ' and name like "%' + name + '%"';
                        sql += ' and name like "%' + name + '%"';
                    }
                    if (code) {
                        sqlCount += ' and dev_code like "%' + code + '%"';
                        sql += ' and dev_code like "%' + code + '%"';
                    }
                    if (desc) {
                        sqlCount += ' and dev_desc like "%' + desc + '%"';
                        sql += ' and dev_desc like "%' + desc + '%"';
                    }
                    sql += " limit " + offset + "," + limit;

                    logger.debug('查询满足添加条件的总个数sql：' + sqlCount);
                    query(sqlCount, function (error, rows, columns) {
                        if (error) {
                            logger.error('查询满足添加条件的总个数错误:' + error);
                            message.error = '获取数据失败';
                            message.rows = [];
                            message.total = 0;
                            res.json(message);
                            return;
                        } else {
                            if (!rows || rows.length < 1 || rows[0].count < 1) {
                                message.error = 'OK';
                                message.rows = [];
                                message.total = 0;
                                res.json(message);
                                return;
                            }
                            callback(null, sql, rows[0].count);
                        }
                    });
                },
                function (sql, count, callback) {
                    logger.debug('查询满足条件的数据sql：' + sql);
                    query(sql, function (err, rows, columns) {
                        if (err) {
                            logger.error('查询满足条件的数据错误：' + err)
                            message.error = '获取数据失败';
                            message.rows = [];
                            message.total = 0;
                            res.json(message);
                            return;
                        }
                        else {
                            var rs = [];
                            for (var i in rows) {
                                var o = rows[i];
                                if (o.userId == user.USER_ID) {
                                    o.canEdit = 1;
                                    rs.push(o);
                                } else {
                                    o.canEdit = 0;
                                    rs.push(o);
                                }
                            }
                            message.error = 'OK';
                            message.rows = rs;
                            message.total = count;
                            res.json(message);
                        }
                    });
                }
            ],
            function (error) {
                if (error) {
                    message.error = '查询数据错误';
                    message.rows = rows;
                    message.total = count;
                    res.json(message);
                }
            });

    },
    offlineDevice: function (req, res) {
        var offset = req.body.offset || 0;
        var limit = req.body.limit || 10;
        var name = req.body.name;
        var code = req.body.code;
        var desc = req.body.desc;
        var anttention = req.body.anttention;
        var groupId = req.body.groupId;
        var user = req.session.user;
        async.waterfall(
            [
                function (callback) {
                    var sqlCount = '', sql = '';
                    if (user.IS_SYSTEM == 1) {
                        sqlCount = 'SELECT count(t.ID) as count FROM box_box_info t WHERE STATUS="off" ';
                        sql = 'SELECT t.ID,t.NAME,t.DEV_CODE,t.STATUS,t.IP,t.VERSION_NUM,t.SERIAL_NO,t.DEV_DESC,t.TIME,t.OUT_COUNT,t.anttention as anttention,bg.group_name as groupName FROM box_box_info t ' +
                            ' LEFT JOIN box_box_group bg on t.groupId = bg.group_id ' +
                            ' WHERE STATUS="off" ';
                    } else {
                        if (user.SOURCE == 1) {
                            sqlCount = 'SELECT count(t.ID) as count FROM box_box_info t WHERE STATUS="off" and ub.user_id=' + user.USER_ID;
                            sql = 'SELECT ub.user_id as userId,t.ID,t.NAME,t.DEV_CODE,t.STATUS,t.IP,t.VERSION_NUM,t.SERIAL_NO,t.DEV_DESC,t.TIME,t.OUT_COUNT,t.anttention as anttention,bg.group_name as groupName FROM box_box_info t ' +
                                ' LEFT JOIN box_box_group bg on t.groupId = bg.group_id ' +
                                ' LEFT JOIN box_user_box ub on t.dev_code = ub.dev_Code' +
                                ' WHERE STATUS="off" and ub.status!=4 and ub.user_id=' + user.USER_ID;
                        } else {
                            sqlCount = 'SELECT count(t.ID) as count FROM box_box_info t left join box_user_box ub on t.dev_code = ub.dev_code WHERE ub.user_id in (select USER_ID from sys_user where MOBILE_PHONE in (select MOBILE_PHONE from sys_user where user_id = ' + user.USER_ID + ')) and STATUS="off"';
                            sql = 'SELECT ub.user_id as userId, t.ID,t.NAME,t.DEV_CODE,t.STATUS,ub.Status as shareStatus,t.IP,t.VERSION_NUM,t.SERIAL_NO,t.DEV_DESC,t.TIME,t.OUT_COUNT,t.anttention as anttention,bg.group_name as groupName FROM box_box_info t ' +
                                ' LEFT JOIN box_box_group bg on t.groupId = bg.group_id ' +
                                ' LEFT JOIN box_user_box ub on t.dev_code = ub.dev_Code' +
                                ' WHERE ub.user_id in (select USER_ID from sys_user where MOBILE_PHONE in (select MOBILE_PHONE from sys_user where user_id = ' + user.USER_ID + ')) and ub.status!=4 and STATUS="off"';
                        }
                    }
                    if (groupId != -1) {
                        sqlCount += ' and groupId = ' + groupId;
                        sql += ' and groupId = ' + groupId;
                    }
                    if (anttention == 1) {
                        sqlCount += ' and anttention = 1';
                        sql += ' and anttention = 1';
                    }
                    if (name) {
                        sqlCount += ' and name like "%' + name + '%"';
                        sql += ' and name like "%' + name + '%"';
                    }
                    if (code) {
                        sqlCount += ' and dev_code like "%' + code + '%"';
                        sql += ' and dev_code like "%' + code + '%"';
                    }
                    if (desc) {
                        sqlCount += ' and dev_desc like "%' + desc + '%"';
                        sql += ' and dev_desc like "%' + desc + '%"';
                    }
                    sql += " limit " + offset + "," + limit;
                    logger.debug('查询满足添加条件的总个数sql：' + sqlCount);
                    query(sqlCount, function (error, rows, columns) {
                        if (error) {
                            logger.error('查询满足添加条件的总个数错误:' + error);
                            message.error = '获取数据失败';
                            message.rows = [];
                            message.total = 0;
                            res.json(message);
                            return;
                        } else {
                            if (!rows || rows.length < 1 || rows[0].count < 1) {
                                message.error = 'OK';
                                message.rows = [];
                                message.total = 0;
                                res.json(message);
                                return;
                            }
                            callback(null, sql, rows[0].count);
                        }
                    });
                },
                function (sql, count, callback) {
                    logger.debug('查询满足条件的数据sql：' + sql);
                    query(sql, function (err, rows, columns) {
                        if (err) {
                            logger.error('查询满足条件的数据错误：' + err)
                            message.error = '获取数据失败';
                            message.rows = [];
                            message.total = 0;
                            res.json(message);
                            return;
                        }
                        else {
                            var rs = [];
                            for (var i in rows) {
                                var o = rows[i];
                                if (o.userId == user.USER_ID) {
                                    o.canEdit = 1;
                                    rs.push(o);
                                } else {
                                    o.canEdit = 0;
                                    rs.push(o);
                                }
                            }
                            message.error = 'OK';
                            message.rows = rs;
                            message.total = count;
                            res.json(message);
                        }
                    });
                }
            ],
            function (error) {
                if (error) {
                    message.error = '查询数据错误';
                    message.rows = rows;
                    message.total = count;
                    res.json(message);
                }
            });

    },
    anttentionBox: function (req, res) {
        var devCode = req.body.devCode;

        if (!devCode) {
            message.flag = -1;
            message.message = '设备不能为空';
            message.data = null;
            res.json(message);
            return;
        }
        var sql = sqlQuery.update().into('box_box_info').set({
            anttention: 1
        }).where({dev_code: devCode}).build();
        logger.debug('关注盒子sql:', sql);
        query(sql, function (error, rows) {
            if (error) {
                logger.error('关注盒子错误：', error);
                message.flag = -1;
                message.message = '关注失败';
                message.data = null;
            } else {
                message.flag = 0;
                message.message = 'OK';
                message.data = null;
            }
            res.json(message);
        });

    },
    cancelAnttentionBox: function (req, res) {
        var devCode = req.body.devCode;

        if (!devCode) {
            message.flag = -1;
            message.message = '设备不能为空';
            message.data = null;
            res.json(message);
            return;
        }
        var sql = sqlQuery.update().into('box_box_info').set({
            anttention: 0
        }).where({dev_code: devCode}).build();
        logger.debug('取消关注盒子sql:', sql);
        query(sql, function (error, rows) {
            if (error) {
                logger.error('取消关注盒子错误：', error);
                message.flag = -1;
                message.message = '取消关注失败';
                message.data = null;
            } else {
                message.flag = 0;
                message.message = 'OK';
                message.data = null;
            }
            res.json(message);
        });
    },
    getBoxLog: function (req, res) {
        var offset = req.body.offset || 0;
        var limit = req.body.limit || 10;
        var devCode = req.body.devCode;
        async.waterfall(
            [
                function (callback) {
                    var sqlCount = 'SELECT count(ID) as count FROM box_online_log t WHERE dev_code="' + devCode + '"';
                    var sql = 'SELECT id,dev_code as devCode,content,time,heartbeat_time FROM box_online_log t WHERE dev_code="' + devCode + '" ORDER by heartbeat_time limit ' + offset + ',' + limit;
                    logger.debug('查询满足条件的总个数sql：' + sqlCount);
                    query(sqlCount, function (error, rows, columns) {
                        if (error) {
                            logger.error('查询满足添加条件的总个数错误:' + error);
                            message.error = '获取数据失败';
                            message.rows = [];
                            message.total = 0;
                            callback(error, message);
                        } else {
                            if (!rows || rows.length < 1 || rows[0].count < 1) {
                                message.error = 'OK';
                                message.rows = [];
                                message.total = 0;
                                callback(new Error('没有数据'), message);
                            } else {
                                callback(null, sql, rows[0].count);
                            }
                        }
                    });
                },
                function (sql, count, callback) {
                    logger.debug('查询满足条件的数据sql：' + sql);
                    query(sql, function (err, rows, columns) {
                        if (err) {
                            logger.error('查询满足条件的数据错误：' + err)
                            message.error = '获取数据失败';
                            message.rows = [];
                            message.total = 0;
                            callback(err, message);
                        }
                        else {
                            message.error = 'OK';
                            message.rows = rows;
                            message.total = count;
                            res.json(message);
                        }
                    });
                }
            ],
            function (error, message) {
                res.json(message);
            }
        );
    },
    deviceById: function (req, res) {
        var id = req.body.id;
        if (!id) {
            message.flag = -1;
            message.message = '设备不能为空';
            message.data = null;
            res.json(message);
            return;
        }
        var sql = "SELECT dev_code,name,dev_desc,groupId FROM box_box_info  where id = " + id;
        logger.debug('获取设备信息sql:', sql);
        query(sql, function (error, rows, columns) {
            if (error) {
                logger.error('获取设备信息错误：', error);
                message.flag = -1;
                message.message = '获取设备信息出错';
                message.data = null;
                res.json(message);
                return;
            } else {
                if (rows.length != 1) {
                    message.flag = -1;
                    message.message = '没有对应的设备信息';
                    message.data = null;
                } else {
                    message.flag = 0;
                    message.message = 'OK';
                    message.data = rows[0];
                }
                res.json(message);
            }
        });
    },
    getBoxGroup: function (req, res) {
        var userId = req.session.user.USER_ID;
        var sql = "SELECT group_id as id,group_name as name ,descs FROM box_box_group where user_id = " + userId;
        logger.debug('获取盒子组信息sql:', sql);
        query(sql, function (err, rows) {
            if (err) {
                logger.error('查询满足条件的数据错误：' + err)
                message.flag = 0;
                message.message = '获取数据失败';
                message.data = [];
                res.json(message);
                return;
            }
            else {
                message.flag = 0;
                message.message = 'OK';
                message.data = rows;
                res.json(message);
            }
        });
    },
    addBoxGroup: function (req, res) {
        var userId = req.session.user.USER_ID;
        var name = req.body.name;
        if (!name) {
            message.flag = -1;
            message.message = '组名称不能为空';
            message.data = null;
            res.json(message);
            return;
        }
        var desc = req.body.desc;
        async.waterfall(
            [
                function (callback) {
                    var sql = 'select count(group_id) as count from box_box_group where group_name ="' + name + '" and user_id = ' + userId;
                    logger.debug('获取同名组名称sql:', sql);
                    query(sql, function (error, rows) {
                        if (error) {
                            logger.error('获取同名名称错误：', error);
                            message.flag = -1;
                            message.message = '获取同名名称失败';
                            message.data = null;
                            callback(new Error('获取同名名称失败'));
                        } else {
                            if (rows[0].count > 0) {
                                message.flag = -1;
                                message.message = '存在同名组名称';
                                message.data = null;
                                callback(new Error('存在同名组名称'));
                            } else {
                                callback(null);
                            }
                        }
                    });
                },
                function (callback) {
                    var sql = sqlQuery.insert().into('box_box_group').set({
                        group_name: name,
                        descs: desc,
                        user_id: userId
                    }).build();
                    logger.debug('创建组sql:', sql);
                    query(sql, function (error, rows) {
                        if (error) {
                            logger.error('创建组错误：', error);
                            message.flag = -1;
                            message.message = '创建失败';
                            message.data = null;
                            callback(new Error('创建失败'));
                        } else {
                            message.flag = 0;
                            message.message = 'OK';
                            message.data = null;
                            callback(null, message);
                        }
                    });
                }
            ],
            function (error, message) {
                res.json(message);
            }
        )
    },
    updateBoxGroup: function (req, res) {
        var userId = req.session.user.USER_ID;
        var id = req.body.id;
        var name = req.body.name;
        if (!name) {
            message.flag = -1;
            message.message = '组名称不能为空';
            message.data = null;
            res.json(message);
            return;
        }
        var desc = req.body.desc;
        async.waterfall(
            [
                function (callback) {
                    var sql = 'select count(group_id) as count from box_box_group where group_name ="' + name + '" and group_id != ' + id + ' and user_id = ' + userId;
                    logger.debug('获取同名组名称sql:', sql);
                    query(sql, function (error, rows) {
                        if (error) {
                            message.flag = -1;
                            message.message = '组名称不能为空';
                            message.data = null;
                            res.json(message);
                            return;
                        } else {
                            if (rows[0].count > 0) {
                                message.flag = -1;
                                message.message = '存在同名组名称';
                                message.data = null;
                                callback(new Error('存在同名组名称'));
                            } else {
                                callback(null);
                            }
                        }
                    });
                },
                function (callback) {
                    var sql = sqlQuery.update().into('box_box_group').set({
                        group_name: name,
                        descs: desc,
                    }).where({
                        group_id: id
                    }).build();
                    logger.debug('更新组sql:', sql);
                    query(sql, function (error, rows) {
                        if (error) {
                            logger.error('更新组错误：', error);
                            message.flag = -1;
                            message.message = '更新失败';
                            message.data = null;
                            callback(new Error('更新失败'));
                        } else {
                            message.flag = 0;
                            message.message = 'OK';
                            message.data = null;
                            callback(null, message);
                        }
                    });
                }
            ],
            function (error, message) {
                res.json(message);
            }
        )
    },
    deleteBoxGroup: function (req, res) {
        var id = req.body.id;
        if (!id) {
            message.flag = -1;
            message.message = '组不能为空';
            message.data = null;
            res.json(message);
            return;
        }
        var sql = sqlQuery.remove().from('box_box_group').where({
            group_id: id
        }).build();
        logger.debug('删除组sql:', sql);
        query(sql, function (error, rows) {
            if (error) {
                logger.error('删除组错误：', error);
                message.flag = -1;
                message.message = '删除失败';
                message.data = null;
            } else {
                message.flag = 0;
                message.message = 'OK';
                message.data = null;
            }
            res.json(message);
        });

    },
    updateBox: function (req, res, action) {
        var devCode = req.body.devcode;
        var name = req.body.name;
        var groupId = req.body.groupId;
        var desc = req.body.desc;
        if (!devCode) {
            message.flag = -1;
            message.message = '删除失败';
            message.data = null;
            res.json(message);
            return;
        }
        if (!name) {
            message.flag = -1;
            message.message = '删除失败';
            message.data = null;
            res.json(message);
            return;
        }
        var sql = sqlQuery.update().into('box_box_info').set({
            name: name,
            groupId: groupId,
            dev_desc: desc,
            update_date: moment(new Date()).format('YYYY-MM-DD HH:mm:ss')
        }).where({dev_code: devCode}).build();
        logger.debug('更新盒子信息sql:', sql);
        query(sql, function (error, rows) {
            if (error) {
                logger.error('更新盒子信息错误：', error);
                message.flag = -1;
                message.message = '更新盒子信息出错';
                message.data = null;
            } else {
                message.flag = 0;
                message.message = 'OK';
                message.data = null;
            }
            res.json(message);
        });
    }
}
module.exports = dev_info;
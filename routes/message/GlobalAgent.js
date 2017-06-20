/**
 * 全局 触发消息代理
 * @constructor
 */

var actionUtil = require("../framework/action/actionUtils")();
var query = actionUtil.query;
var opPool = require('../openplant/openPlantPool');
var log = require('log4js');
var logger = log.getLogger('model');
var loggerSystem = log.getLogger('system');
var GlobalConsumer = require('./GlobalConsumer');
var GlobalProducer = require('./GlobalProducer');
var async = require('async');

//API用户缓存
var GlobalAPIUser = new Object();
//用户所在域缓存
var GlobalUserDomain = new Object();
//全局订阅实时信息
var GlobalSubRealtime = new Object();
//全局订阅报警
var GlobalSubAlarm = new Object();

var message = {
    flag: 0,
    message: 'OK',
    data: null
}
var GlobalAgent = {
    sparkSocket: null,
    DEFAULT_MESSAGE: 0,
    START_TASK: 1,
    START_MESSAGE: 2,
    TASK_STATUS: 3,
    STATUS_MESSAGE: 4,
    TASK_STOP: 5,
    STOP_MESSAGE: 6,
    /**
     * 创建用户 socket 缓存
     * @param socket
     */
    createConsumer: function (socket) {
        GlobalConsumer.createConsumer(socket);
    },
    /**
     * 用户退出登录 或 关闭浏览器的时候 销毁 socket
     * @param socket
     */
    destoryConsumer: function (socket) {
        var user = socket.handshake.session.user;
        var sql = 'update sys_user set IS_ONLINE = 0 where USER_ID = ' + user.USER_ID;
        logger.debug('修改用户是否在线状态sql:' + sql);
        query(sql, function (err, rows, cloumns) {
            if (err) {
                logger.error('退出登录，更改用户登录状态错误：' + err);
            } else {
                GlobalConsumer.destoryConsumer(socket);
            }
        });
    },

    /**
     * 代理任务状态改变
     */
    agentTaskStatus: function (task) {
        var sql = '';
        if (task.taskType == 1) {
            sql = 'select user_id from model_task where id = "' + task.mainTaskId + '"';
        } else {
            sql = 'select user_id from model_timer_task where id = "' + task.mainTaskId + '"';
        }
        logger.debug('获取任务所属用户sql:' + sql);
        query(sql, function (err, rows, columns) {
            if (err) {
                logger.error('获任务所属用户失败');
            } else if (rows.length > 0) {
                var userId = rows[0].user_id;
                var sockets = GlobalConsumer.getSockets(userId);
                for (var i in sockets) {
                    GlobalProducer.emitTaskStatus(sockets[i], task);
                }
            }
        });
    },
    /**创建全局API使用者*/
    createGlobalAPIUser: function (socket) {
        var SID = socket.id;
        var token = socket.handshake.query.token;
        var size = token.length % 4;
        while (size > 0) {
            token += '=';
            size--;
        }
        var obj = JSON.parse(opPool.decrypt(token));
        if (!obj || !obj.UD) {
            loggerSystem.error('没有该token，请检查，token:' + token);
            return;
        }
        GlobalAPIUser[SID] = obj;
        async.waterfall(
            [
                function (callback) {
                    var sql = 'select IS_DELETE from sys_token where uuid = "' + obj.UD + '"';
                    logger.debug('获取token是否删除sql:' + sql);
                    query(sql, function (error, rows) {
                        if (error) {
                            loggerSystem.error('获取token错误：' + error);
                            return;
                        } else if (!rows || rows.length < 1) {
                            loggerSystem.error('没有找到证书：' + obj);
                            return;
                        } else {
                            if (rows[0].IS_DELETE == 1) {
                                obj.temp = 2;
                                GlobalAPIUser[SID] = obj;
                                return;
                            } else {
                                callback(null);
                            }
                        }
                    });
                },
                function (callback) {
                    //  如果是超级管理员
                    if (obj.userType == 1) {
                        var sql = 'select DOMAIN_ID,URI from sys_domain where IS_ENABLE = 1 and IS_DELETED = 0 ';
                        loggerSystem.debug('获取超级管理员信息sql:' + sql);
                        query(sql, function (err, rows) {
                            if (err) {
                                loggerSystem.error('获取用户domain信息错误:' + err);
                                return;
                            }
                            if (rows && rows.length < 1) {
                                loggerSystem.warn('用户ID：' + obj.userId + ' 没有域');
                                return;
                            }
                            var userDomainIds = new Array();
                            for (var t in rows) {
                                userDomainIds.push(rows[t].DOMAIN_ID);
                            }
                            obj.domainId = userDomainIds;
                            GlobalAPIUser[SID] = obj;
                            return;
                        });
                    } else {
                        callback(null);
                    }
                },
                function (callback) {
                    var sql = 'select USER_ID,DOMAIN_ID,IS_ADMIN from sys_user_domain where IS_DELETED = 0 and USER_ID =' + obj.userId;
                    loggerSystem.debug('获取用户对应的Domain信息sql:' + sql);
                    query(sql, function (err, rows) {
                        if (err) {
                            loggerSystem.error('获取用户domain信息错误:' + err);
                            return;
                        }
                        if (rows && rows.length < 1) {
                            loggerSystem.warn('用户ID：' + obj.userId + ' 没有对应的域');
                            return;
                        }
                        callback(null, rows);
                    });
                },
                function (userDomain, callback) {
                    var sql = 'select DOMAIN_ID,URI from sys_domain where IS_ENABLE = 1 and IS_DELETED = 0 and COMPANY_ID = ' + obj.companyID;
                    loggerSystem.debug('获取用户对应的Domain信息sql:' + sql);
                    query(sql, function (err, rows) {
                        if (err) {
                            loggerSystem.error('获取用户domain信息错误:' + err);
                            return;
                        }
                        if (rows && rows.length < 1) {
                            loggerSystem.warn('用户ID：' + obj.userId + ' 所属公司没有域');
                            return;
                        }
                        var userDomainIds = new Array();
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
                        for (var i in rows) {
                            var row = rows[i];
                            for (var j in userDomain) {
                                var ud = userDomain[j];
                                if (row.DOMAIN_ID == ud.DOMAIN_ID) {
                                    userDomainIds.push(row.DOMAIN_ID);
                                    break;
                                }
                                if (row.URI.indexOf(ud.URI + '/') > -1) {
                                    var domainId = row.DOMAIN_ID;
                                    if (userDomainIds.indexOf(domainId) < 0) {
                                        userDomainIds.push(domainId);
                                        break;
                                    }
                                }
                            }
                        }
                        obj.domainId = userDomainIds;
                        logger.warn(obj);
                        GlobalAPIUser[SID] = obj;
                    });
                }
            ],
            function (err) {
                if (err) {
                    loggerSystem.error('刷新用户Domain缓存错误，用户ID:' + user.USER_NAME);
                }
            });
    },
    /**
     * 更具用户连接判断当前请求是否可以试用
     * @param SID
     */
    getAPInfo: function (SID, APICODE) {
        var obj = GlobalAPIUser[SID];
        if (!obj) {
            message.flag = -1;
            message.message = '该连接没有找到对应的证书';
            message.data = null;
            return message;
        }
        var temp = obj.temp;
        if (temp == 2) {
            message.flag = -1;
            message.message = '证书已废弃';
            message.data = null;
            return message;
        }
        if (temp == 1) {
            var nowTime = new Date().getTime();
            var ct = new Date(obj.createDate).getTime();
            if ((nowTime - ct) / 1000 >= parseInt(obj.aging) * 86400) {
                message.flag = -1;
                message.message = '证书过期';
                message.data = null;
                return message;
            }
        }

        if (obj.API.indexOf(APICODE) < 0) {
            message.flag = -1;
            message.message = '没有该接口权限';
            message.data = null;
            return message;
        }
        message.flag = 0;
        message.message = 'OK';
        message.data = obj;
        return message;
    },
    /**
     * 销毁全局API使用者
     * @param token
     */
    SubRealtime: function (socket, rs, emit) {
        var ids = new Array();
        for (var i in rs) {
            ids.push(rs[i].POINT_ID);
        }
        var message = {
            flag: 0,
            message: 'OK',
            total: 0,
            data: []
        };
        var agentHandler = opPool.subscribe(ids);
        var arr = [agentHandler, ids];

        GlobalSubRealtime[socket.id] = arr;
        opPool.startSub(function (data) {
            for (var i  in data) {
                for (var j in rs) {
                    if (data[i].ID == rs[j].POINT_ID) {
                        data[i].GN = rs[j].URI;
                        break;
                    }
                }
            }
            message.total = data.length;
            message.data = data;
            socket.emit(emit, message);
        });
    },
    destoryGlobalAPIUser: function (socket) {
        var SID = socket.id;
        //取消实时订阅
        if (GlobalSubRealtime[SID]) {
            var arr = GlobalSubRealtime[SID];
            opPool.unsubscribe(arr[0], arr[1]);
            delete GlobalSubRealtime[SID];
        }
        delete GlobalAPIUser[SID];
    },
    /**
     *刷新用户 对应的Domain信息
     * @param userId
     */
    refreshUserDomain: function (user) {
        if (!user) {
            loggerSystem.error('没有用户，请检查');
            return;
        }
        var userId = user.USER_ID;
        var companyId = user.ENTERPRISE_ID;
        if (user.IS_SYSTEM == 1) {
            loggerSystem.debug('超级管理员：' + user.USER_NAME + ' 没有域');
            return;
        }
        async.waterfall(
            [
                function (callback) {
                    var sql = 'select u.USER_ID,u.DOMAIN_ID,u.IS_ADMIN,s.URI from sys_user_domain u left join sys_domain s on u.DOMAIN_ID= s.DOMAIN_ID  where u.IS_DELETED = 0 and  USER_ID = ' + userId;
                    loggerSystem.debug('获取用户对应的Domain信息sql:' + sql);
                    query(sql, function (err, rows) {
                        if (err) {
                            loggerSystem.error('获取用户domain信息错误:' + err);
                            return;
                        }
                        if (rows && rows.length < 1) {
                            loggerSystem.debug('用户：' + user.USER_NAME + ' 没有对应的域');
                            return;
                        }
                        callback(null, rows);
                    });
                },
                function (userDomain, callback) {
                    var sql = 'select DOMAIN_ID,URI from sys_domain where IS_ENABLE = 1 and IS_DELETED = 0 and COMPANY_ID = ' + companyId;
                    loggerSystem.debug('获取用户对应的Domain信息sql:' + sql);
                    query(sql, function (err, rows) {
                        if (err) {
                            loggerSystem.error('获取用户domain信息错误:' + err);
                            return;
                        }
                        if (rows && rows.length < 1) {
                            loggerSystem.debug('用户：' + user.USER_NAME + ' 所属公司没有域');
                            return;
                        }
                        var userDomainIds = new Array();
                        var userAdminDomainIds = new Array();
                        for (var i in rows) {
                            var row = rows[i];
                            for (var j in userDomain) {
                                var ud = userDomain[j];
                                if (row.DOMAIN_ID == ud.DOMAIN_ID) {
                                    userDomainIds.push(row.DOMAIN_ID);
                                    /**
                                     * 创建管理员节点缓存
                                     */
                                    if (ud.IS_ADMIN == 1) {
                                        userAdminDomainIds.push(row.DOMAIN_ID);
                                    }
                                    break;
                                }
                                if (row.URI.indexOf(ud.URI + '/') > -1) {
                                    var domainId = row.DOMAIN_ID;
                                    if (userDomainIds.indexOf(domainId) < 0) {
                                        userDomainIds.push(domainId);
                                    }
                                    if (ud.IS_ADMIN == 1 && userAdminDomainIds.indexOf(domainId) < 0) {
                                        userAdminDomainIds.push(domainId);
                                        break;
                                    }
                                }
                            }
                        }
                        GlobalUserDomain[userId] = userDomainIds;
                        GlobalUserDomain[userId + '_' + userId] = userAdminDomainIds;
                    });
                }
            ],
            function (err) {
                if (err) {
                    loggerSystem.error('刷新用户Domain缓存错误，用户ID:' + user.USER_NAME);
                }
            });
    },

    /**
     * 通过userId 获取对应domain列表
     * @param userId
     */
    getUserDomain: function (userId) {
        return GlobalUserDomain[userId];
    },
    /**
     * 通过userId 获取对应管理员域列表
     * @param userId
     */
    getAdminUserDomain: function (userId) {
        return GlobalUserDomain[userId + '_' + userId];
    },
    /**
     * 退出登录时刷新 domain信息
     * @param userId
     */
    destoryUserDomain: function (userId) {
        delete GlobalUserDomain[userId];
    }

}
module.exports = GlobalAgent;

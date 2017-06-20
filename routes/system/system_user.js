var actionUtil = require("../framework/action/actionUtils")();
var mailUtil = require("../utils/email/mailUtil");
var async = require("async");
var query = actionUtil.query;
var moduleName = "system";
var md5 = require('md5');
var moment = require("moment");
var logger = require('log4js').getLogger('system');
var GlobalAgent = require('../message/GlobalAgent');
var uuid = require('node-uuid');
var transaction = actionUtil.transaction;
var Utils = require('../utils/tools/utils');
var APIUtils = require('../utils/tools/APIUtils');
var configConst = require('../utils/tools/configConst');
var formidable = require('formidable');
var opPool = require('../openplant/openPlantPool')
var fs = require('fs');
var sql = require('sql-query');
var sqlQuery = sql.Query();
var message = {
    flag: 0,
    message: 'OK',
    data: null
}
var fields = [{
    field: 'state',
    checkbox: true
}, {
    field: 'USER_ID',
    title: 'ID',
    align: 'center',
    valign: 'middle',
    visible: false,
    sortable: true,
}, {
    field: 'USER_NAME',
    title: '姓名',
    align: 'center',
    valign: 'middle',
    sortable: true,
}, {
    field: 'DUTY_NAME',
    title: '职务',
    align: 'left',
    valign: 'top',
    sortable: true,
}, {
    field: 'CREATE_DATE',
    title: '注册日期',
    align: 'left',
    formatter: 'timeFormatter',
    valign: 'top',
    visible: false,
    sortable: true
}, {
    field: 'JOB_NO',
    title: '用户名',
    align: 'middle',
    valign: 'top',
    sortable: true
}, {
    field: 'DESCRIPTION',
    title: '描述',
    align: 'middle',
    valign: 'top',
    sortable: true
}, {
    field: 'IS_SYSTEM',
    title: '用户类别',
    align: 'middle',
    valign: 'top',
    formatter: 'userTypeFormatter',
    sortable: true
}, {
    field: 'MOBILE_PHONE',
    title: '手机号码',
    align: 'left',
    valign: 'top',
    sortable: true
}, {
    field: 'operate',
    title: '操作',
    align: 'center',
    valign: 'middle',
    formatter: 'operateFormatter',
    events: 'operateEvents'
}];

var system_user = {
        loginAction: function (req, res, action) {
            var host = req.connection.remoteAddress.substring(7);
            var userName = req.body.userName;
            var password = req.body.password;
            if (userName != undefined && typeof(userName) == "string" && userName != "") {
                var sql = 'select USER_ID as USER_ID, PASSWORD,JOB_NO,USER_NAME, ENTERPRISE_ID, ICON, DESCRIPTION, IS_SYSTEM, IS_UNVILIABLE,CREATE_DATE,IS_ONLINE ,HOST,SOURCE ';
                sql += 'from sys_user where JOB_NO="' + userName + '" and PASSWORD = "' + md5(password) + '"';
                logger.debug('用戶登录sql:' + sql);
                async.waterfall([
                    function (callback) {
                        //验证用户用户名密码是否正确
                        query(sql, function (err, rows, columns) {
                            if (rows && rows.length == 1) {
                                var user = rows[0];
                                callback(null, user);
                            } else {
                                callback(null, null);
                            }
                        });
                    },
                    function (user, callback) {
                        var message = {};
                        if (user != null) {
                            if (user.IS_UNVILIABLE == 1) {
                                message.msg = '账号已被禁用!';
                                callback(null, message);
                            } else if (user.IS_ONLINE > 0) {
                                if (user.HOST == host) {
                                    req.session.user = user;
                                    message.msg = 'success';
                                } else {
                                    message.msg = '账号已在别处登录';
                                }
                                callback(null, message);
                            } else {
                                var time = moment(new Date()).format('YYYY-MM-DD HH:mm:ss');
                                var sql = 'update sys_user set IS_ONLINE = 1,HOST = "' + host + '",UPDATE_DATE="' + time + '" where JOB_NO ="' + userName + '"';
                                logger.debug('更新用户登录信息sql:' + sql);
                                query(sql, function (err, rows, columns) {
                                    if (err) {
                                        logger.error('更新用户登录信息错误:' + err);
                                        message.msg = '账户或密码错误';
                                    } else {
                                        var sqlStyle = 'SELECT USER_ID ,full_name as fullName,short_name as shortName,logo_path as logoPath,skin from sys_user_style where User_ID = ' + user.USER_ID
                                            + ' or USER_ID in (select USER_ID from sys_user where IS_SYSTEM = 2 and enterprise_id  =' + user.ENTERPRISE_ID + ')';
                                        logger.debug('获取用户个性化信息sql:' + sqlStyle);
                                        query(sqlStyle, function (err, rr, columns) {
                                            if (err) {
                                                logger.error('获取用户个性化信息错误:' + err);
                                                message.msg = '个性化信息错误';
                                            } else {
                                                var rs;
                                                if (rr && rr.length > 0) {
                                                    for (var i in rr) {
                                                        var r = rr[i];
                                                        if (r.USER_ID == user.USER_ID) {
                                                            rs = r;
                                                            break;
                                                        }
                                                    }
                                                    if (!rs) {
                                                        rs = rr[0];
                                                    }
                                                }
                                                if (rs) {
                                                    user.fullName = rs.fullName;
                                                    user.shortName = rs.shortName;
                                                    user.logoPath = rs.logoPath;
                                                    user.skin = rs.skin;
                                                }
                                                req.session.user = user;
                                                message.msg = 'success';
                                            }
                                            GlobalAgent.refreshUserDomain(user);
                                            callback(null, message);
                                        });
                                    }
                                });

                                var obj = {
                                    user_id: user.USER_ID,
                                    user_name: user.USER_NAME,
                                    time: time,
                                    ip: host,
                                    device_name: req.body.deviceName,
                                    desc: '云登录'
                                };
                                var sql = sqlQuery.insert().into('sys_login_log').set(obj).build();
                                query(sql, function (error, rows) {
                                });
                            }
                        } else {
                            message.msg = '账户或密码错误！';
                            callback(null, message);
                        }
                    }
                ], function (err, message) {
                    res.writeHead(200, {
                        "Content-Type": 'text/plain',
                        'charset': 'utf-8',
                        'Access-Control-Allow-Origin': '*',
                        'Access-Control-Allow-Methods': 'PUT,POST,GET,DELETE,OPTIONS'
                    });
                    res.write(JSON.stringify(message));
                    res.end();
                });
            } else {
                return res.redirect("/");
            }
        },
        //未登录，忘记密码
        forgetPwd: function (req, res, action) {
            var jobNo = req.body.jobNo;
            var phone = req.body.phone;
            var smsCode = req.body.smsCode;
            var sessionInfo = req.session[phone];
            if (!smsCode) {
                logger.debug('验证码为空');
                message.flag = -1;
                message.message = "验证码不能为空";
                res.json(message);
                return;
            }
            if (!sessionInfo) {
                logger.debug('验证码过期');
                message.flag = -1;
                message.message = "验证码过期,请刷新页面";
                res.json(message);
                return;
            }
            if (sessionInfo.phone != phone || sessionInfo.smsCode != smsCode) {
                logger.error('输入验证码和session验证码不对应');
                message.flag = -1;
                message.message = "验证码不正确";
                res.json(message);
                return;
            }
            //将验证码清空，避免重复提交
            var newPass1 = req.body.password;
            var newPass2 = req.body.password2;
            if (md5(newPass1) != md5(newPass2)) {
                logger.debug('两次密码不一样');
                message.flag = -1;
                message.message = '两次密码不一样';
                res.json(message);
                return;
            }
            req.session[phone] = null;
            async.waterfall(
                [
                    function (callback) {
                        var sql = "SELECT JOB_NO as jobNo,mobile_phone as phone FROM sys_user where JOB_NO = '" + jobNo + "'";
                        logger.debug('获取对应的用户信息：' + sql);
                        query(sql, function (err, rows, columns) {
                            if (err) {
                                message.flag = -1;
                                logger.error('获取用户信息错误：' + error);
                                message.message = '获取用户信息失败';
                                message.data = null;
                                res.json(message);
                                return;
                            } else if (!rows || rows.length < 1) {
                                message.flag = -1;
                                message.message = '当前用户名不可用';
                                message.data = null;
                                res.json(message);
                                return;
                            } else if (rows[0].phone != phone) {
                                message.flag = -1;
                                message.message = '登录名和手机号不对应';
                                message.data = null;
                                res.json(message);
                                return;
                            } else {
                                callback(null);
                            }
                        });
                    },
                    function (callback) {
                        var updateSql = 'update sys_user set UPDATE_DATE = "' + Utils.dateFormat(new Date().getTime(), Utils.yyyyMMddhhmmss) + '", password = "' + md5(newPass1) + '" where JOB_NO = "' + jobNo + '"';
                        logger.debug('更新数据库激活码：' + updateSql);
                        query(updateSql, function (err, rows) {
                            if (err) {
                                logger.error('更新用户失败：' + err);
                                message.flag = -1;
                                message.message = "操作失败";
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
                ],
                function (err, message) {
                    req.json(message);
                });
        },
        //登录以后修改密码
        changePassword: function (req, res) {
            var pass = req.body.pass;
            var passNew = req.body.passNew;
            var passAgain = req.body.passAgain;
            var userID = req.session.user.USER_ID;
            if (md5(passNew) == md5(passAgain)) {
                async.waterfall([
                        function (callback) {
                            var sql = sqlQuery.select().from("sys_user").select("USER_ID", "PASSWORD").where({
                                USER_ID: userID
                            }).build();
                            logger.debug('获取用户信息sql：' + sql);
                            query(sql, function (error, rows) {
                                if (error || rows.length < 1) {
                                    logger.error('获取用户密码错误:' + (error || rows.length));
                                    message.flag = -1;
                                    message.message = '获取用户信息错误';
                                    message.data = null;
                                    res.json(message);
                                    return;
                                } else if (rows[0].PASSWORD != md5(pass)) {
                                    message.flag = -1;
                                    message.message = '原密码不正确';
                                    message.data = null;
                                    res.json(message);
                                    return;
                                } else {
                                    callback(null);
                                }
                            });
                        },
                        function (callback) {
                            var sql = sqlQuery.update().into('sys_user').set({
                                PASSWORD: md5(passNew)
                            }).where({
                                USER_ID: userID
                            }).build();
                            logger.debug('更新用户密码sql：' + sql);
                            query(sql, function (error, rows) {
                                if (error || rows.length < 1) {
                                    logger.error('更新用户密码错误:' + (error || rows.length));
                                    message.flag = -1;
                                    message.message = '更新用户密码错误';
                                    message.data = null;
                                    res.json(message);
                                    return;
                                } else {
                                    message.flag = 0;
                                    message.message = '密码修改成功';
                                    message.data = null;
                                    res.json(message);
                                    return;
                                }
                            });
                        }
                    ],
                    function (error, rows) {
                        logger.error('更新用户密码错误:' + error);
                        message.flag = -1;
                        message.message = '更新用户密码错误';
                        message.data = null;
                        res.json(message);
                        return;
                    });
            } else {
                message.flag = -1;
                message.message = '两次密码不一样';
                message.data = null;
                res.json(message);
            }
        },
        userManageAction: function (req, res, action) {
            var method = req.params.method;
            var userType = req.session.user.IS_SYSTEM;
            var userList = {
                pageName: "用户管理",
                key: "USER_ID",
                columns: fields,
                userType: userType
            }
            res.render(moduleName + "/" + action, userList);
        },
        //主要用于数据分页数据封装，并构建SQL 语句
        userJsonList: function (req, res) {
            var description = req.body.description;
            var userName = req.body.userName;
            var companyId = req.session.user.ENTERPRISE_ID;
            var userId = req.session.user.USER_ID;
            var userType = req.session.user.IS_SYSTEM;
            var sqlSelect;
            if (userType != 1) {
                sqlSelect = sqlQuery.select().from('sys_user')
                    .select("USER_ID", "USER_NAME", "CREATE_DATE", "JOB_NO", "EMAIL", "MOBILE_PHONE", "IS_SYSTEM", "IS_UNVILIABLE", "DESCRIPTION", "ENTERPRISE_ID")
                    .from('sys_duty', 'DUTY_ID', "sys_user", 'DUTY_ID', {
                        joinType: 'left'
                    })
                    .select("DUTY_NAME").where({
                        ENTERPRISE_ID: companyId
                    }).where({
                        IS_SYSTEM: 3
                    }).where({
                        USER_ID: sql.ne(userId)
                    });
            } else {
                sqlSelect = sqlQuery.select().from('sys_user')
                    .select("USER_ID", "USER_NAME", "CREATE_DATE", "JOB_NO", "EMAIL", "MOBILE_PHONE", "IS_SYSTEM", "IS_UNVILIABLE", "DESCRIPTION", "ENTERPRISE_ID")
                    .from('sys_duty', 'DUTY_ID', "sys_user", 'DUTY_ID', {
                        joinType: 'left'
                    })
                    .select("DUTY_NAME").where({
                        IS_SYSTEM: [2, 4]
                    }).where({
                        USER_ID: sql.ne(userId)
                    });
            }
            if (description) {
                sqlSelect.where({
                    DESCRIPTION: sql.like("%" + description + "%")
                });
            }
            if (userName) {
                sqlSelect.where({
                    USER_NAME: sql.like("%" + userName + "%")
                });
            }
            logger.debug('查看获取用户信息sql:' + sqlSelect.build());
            actionUtil.pageList(req, res, sqlSelect.build());
        },
        //主要用于数据分页数据封装，并构建SQL 语句
        getUser: function (req, res) {
            var companyId = req.session.user.ENTERPRISE_ID;
            var userId = req.session.user.USER_ID;
            var userType = req.session.user.IS_SYSTEM;
            var sqlSelect;
            if (userType != 1) {
                sqlSelect = sqlQuery.select().from('sys_user')
                    .select("USER_ID", "USER_NAME", "CREATE_DATE", "EMAIL")
                    .where({
                        ENTERPRISE_ID: companyId
                    }).where({
                        IS_SYSTEM: 3
                    }).where({
                        USER_ID: sql.ne(userId)
                    }).build();
            } else {
                sqlSelect = sqlQuery.select().from('sys_user')
                    .select("USER_ID", "USER_NAME", "CREATE_DATE", "EMAIL")
                    .where({
                        IS_SYSTEM: [2, 4]
                    }).where({
                        USER_ID: sql.ne(userId)
                    }).build();
            }
            logger.debug('查看获取用户信息sql:' + sqlSelect);
            query(sqlSelect, function (err, rows, columns) {
                if (err) {
                    res.json([]);
                    return;
                } else {
                    res.json(rows);
                }
            });
        },
        // 编辑domain信息时获取的
        getDomainUser: function (req, res) {
            var companyId = req.session.user.ENTERPRISE_ID;
            var userId = req.session.user.USER_ID;
            var userType = req.session.user.IS_SYSTEM;
            var sqlSelect;
            if (userType != 1) {
                sqlSelect = sqlQuery.select().from('sys_user').select("USER_ID", "USER_NAME", "CREATE_DATE", "EMAIL").where({
                    ENTERPRISE_ID: companyId
                }).build();
            } else {
                sqlSelect = sqlQuery.select().from('sys_user').select("USER_ID", "USER_NAME", "CREATE_DATE", "EMAIL").where({
                    IS_SYSTEM: [2, 4]
                }).build();
            }
            logger.debug('查看获取用户信息sql:' + sqlSelect);
            query(sqlSelect, function (err, rows, columns) {
                if (err) {
                    res.json([]);
                    return;
                } else {
                    res.json(rows);
                }
            });
        },
        userById: function (req, res) {
            var id = req.body.id;
            var sql = "SELECT * FROM sys_user where user_id = " + id;
            query(sql, function (err, rows, columns) {
                if (err == null) {
                    res.json(rows);
                } else {
                    console.log(err)
                }
            });
        },
        /**
         * 获取用户信息
         * @param req
         * @param res
         */
        getUserInfo: function (req, res) {
            var userId = req.session.user.USER_ID;
            var sql = 'SELECT USER_NAME,JOB_NO,EMAIL,MOBILE_PHONE,DESCRIPTION FROM sys_user where user_id = ' + userId;
            logger.debug('获取用户对应的信息sql:' + sql);
            query(sql, function (err, rows, columns) {
                if (err) {
                    message.flag = -1;
                    message.message = '获取用户信息出错';
                    message.data = null;
                    res.json(message);
                    return;
                } else if (!rows || rows.length < 1) {
                    message.flag = -1;
                    message.message = '没有对应的用户';
                    message.data = null;
                    res.json(message);
                    return;
                } else {
                    message.flag = 0;
                    message.message = 'OK';
                    message.data = rows[0];
                    res.json(message);
                    return;
                }
            });
        },
        updateUserInfo: function (req, res, action) {
            var user = req.session.user;
            var userName = req.body.userName;
            if (!userName) {
                logger.debug('用户名不能为空');
                message.flag = -1;
                message.message = '用户名不能为空';
                res.json(message);
                return;
            }
            var phone = req.body.phone;
            if (!phone) {
                logger.debug('联系方式为空');
                message.flag = -1;
                message.message = '联系方式不能为空';
                res.json(message);
                return;
            } else {
                var isPhone = Utils.telReg;
                var isMob = Utils.mobileReg;
                flag = isPhone.test(phone) || isMob.test(phone);
                if (!flag) {
                    logger.debug('电话号码格式不正确');
                    message.flag = -1;
                    message.message = '电话号码格式不正确';
                    res.json(message);
                    return;
                }
            }
            var userDesc = req.body.userDesc;
            async.waterfall(
                [
                    function (callback) {
                        var sql = 'select count(USER_ID) as countNum from sys_user where MOBILE_PHONE = "' + phone + '" and USER_ID <> ' + user.USER_ID;
                        logger.debug('验证手机是否被注册过:' + sql);
                        query(sql, function (err, rows, columns) {
                            if (err) {
                                logger.error('验证手机是否被注册过失败：' + err);
                                message.flag = -1;
                                message.message = '电话号码验证失败';
                                res.json(message);
                                return;
                            }
                            if (rows[0].countNum > 0) {
                                message.flag = -1;
                                message.message = '电话号码已经被注册过，请更换号码';
                                res.json(message);
                                return;
                            } else {
                                callback(null);
                            }
                        });
                    },
                    function (callback) {
                        var sql = "update sys_user set USER_NAME = '" + userName + "', MOBILE_PHONE = '" + phone + "', DESCRIPTION = '" + userDesc + "'  where USER_ID = " + user.USER_ID;
                        logger.debug('更新用户信息sql：' + sql);
                        query(sql, function (err, rows, columns) {
                            if (err) {
                                logger.error('更新用戶信息失败：' + err);
                                message.flag = -1;
                                message.message = "操作失败";
                                message.data = null;
                                res.json(message);
                                return;
                            } else {
                                message.flag = 0;
                                message.message = "操作成功";
                                message.data = null;
                                user.USER_NAME = userName;
                                user.DESCRIPTION = userDesc;
                                req.session.user = user;
                                res.json(message);
                                return;
                            }
                        });
                    }
                ],
                function (err, result) {
                    logger.error('更新用户信息失败：' + err);
                });
        },
        /**
         * 查询token
         * @param req
         * @param res
         */
        queryToken: function (req, res) {
            var userId = req.session.user.USER_ID;
            var sql = 'SELECT t.id ,t.user_name as userName,t.temp,u.USER_NAME ,t.value ,t.temp ,t.aging ,t.type ,t.create_date from sys_token t left join sys_user u on t.user_id = u.user_id where t.is_delete = 0 and t.create_user = ' + userId;
            logger.debug('查询证书sql:' + sql);
            query(sql, function (err, rows, columns) {
                if (err) {
                    logger.error('获取证书错误:' + err);
                    res.json([]);
                } else {
                    res.json(rows);
                }
            });
        },
        /**
         * 获取开发者证书
         * @param req
         * @param res
         */
        createToken: function (req, res) {
            var user = req.session.user;
            var temp = req.body.temp;
            var userId = req.body.userId;
            var userName = req.body.userName;
            var description = req.body.description;
            var isSystem = 3;
            var type = req.body.type;
            if (type == 1 && !userId) {
                message.flag = -1;
                message.message = '请选择用户';
                message.data = null;
                res.json(message);
                return;
            }
            if (user.IS_SYSTEM == 1 && userId == user.USER_ID) {
                isSystem = 1;
            }
            if (type == 2 || type == 3) {
                userId = user.USER_ID;
                isSystem = user.IS_SYSTEM;
            }
            if (type == 3 && !userName) {
                message.flag = -1;
                message.message = '请输入用户名';
                message.data = null;
                res.json(message);
                return;
            }
            var companyID = user.ENTERPRISE_ID;
            var aging = req.body.aging;
            var readRealTime = req.body.readRealTime;
            var readArchive = req.body.readArchive;
            var readAlarm = req.body.readAlarm;
            var readAAlarm = req.body.readAAlarm;
            var addPoint = req.body.addPoint;
            var updatePoint = req.body.updatePoint;
            var deletePoint = req.body.deletePoint;
            var queryPoint = req.body.queryPoint;
            var writeRealTime = req.body.writeRealTime;
            var writeArchive = req.body.writeArchive;
            var runSQL = req.body.runSQL;
            var addMTree = req.body.addMTree;
            var deleteMTree = req.body.deleteMTree;
            var readMTree = req.body.readMTree;
            var subRealtime = req.body.subRealtime;
            var subAlarm = req.body.subAlarm;
            var APIAuthority = '';
            if (readRealTime && readRealTime.toString().toLowerCase() == 'true') {
                APIAuthority += APIUtils.READ_REALTIME;
            }
            if (readArchive && readArchive.toString().toLowerCase() == 'true') {
                APIAuthority += APIUtils.READ_ARCHVIE;
            }
            if (readAlarm && readAlarm.toString().toLowerCase() == 'true') {
                APIAuthority += APIUtils.READ_ALARM;
            }
            if (readAAlarm && readAAlarm.toString().toLowerCase() == 'true') {
                APIAuthority += APIUtils.READ_AALARM;
            }
            if (addPoint && addPoint.toString().toLowerCase() == 'true') {
                APIAuthority += APIUtils.ADD_POINT;
            }
            if (updatePoint && updatePoint.toString().toLowerCase() == 'true') {
                APIAuthority += APIUtils.UPDATE_POINT;
            }
            if (deletePoint && deletePoint.toString().toLowerCase() == 'true') {
                APIAuthority += APIUtils.DELETE_POINT;
            }
            if (queryPoint && queryPoint.toString().toLowerCase() == 'true') {
                APIAuthority += APIUtils.QUERY_POINT;
            }
            if (writeRealTime && writeRealTime.toString().toLowerCase() == 'true') {
                APIAuthority += APIUtils.WRITE_REALTIME;
            }
            if (writeArchive && writeArchive.toString().toLowerCase() == 'true') {
                APIAuthority += APIUtils.WRITH_ARCHIVE;
            }
            if (runSQL && runSQL.toString().toLowerCase() == 'true') {
                APIAuthority += APIUtils.RUN_SQL;
            }
            if (addMTree && addMTree.toString().toLowerCase() == 'true') {
                APIAuthority += APIUtils.ADD_MTREE;
            }
            if (deleteMTree && deleteMTree.toString().toLowerCase() == 'true') {
                APIAuthority += APIUtils.DELETE_MTREE;
            }
            if (readMTree && readMTree.toString().toLowerCase() == 'true') {
                APIAuthority += APIUtils.READ_MTREE;
            }
            if (subRealtime && subRealtime.toString().toLowerCase() == 'true') {
                APIAuthority += APIUtils.SUB_REALTIME;
            }
            if (subAlarm && subAlarm.toString().toLowerCase() == 'true') {
                APIAuthority += APIUtils.SUB_ALARM;
            }
            if (!APIAuthority) {
                message.flag = -1;
                message.message = '证书只要有一种权限';
                message.data = null;
                res.json(message);
                return;
            }
            var obj = new Object();
            var tt = new Object();
            var UUID = opPool.makeUUID(uuid.v1());
            obj.userId = userId;
            obj.companyID = companyID;
            obj.createUserID = user.USER_ID;
            obj.userType = isSystem;
            obj.type = type;
            obj.userName = userName ? userName : '';
            obj.API = APIAuthority;
            obj.UD = UUID;
            obj.randow = parseInt(Math.random() * 1000);
            if (temp.toString().toLowerCase() == 'true') {
                if (parseInt(aging) == 'NaN' || parseInt(aging) < 0) {
                    message.flag = -1;
                    message.message = '临时证书有效期不合法';
                    message.data = null;
                    res.json(message);
                    return;
                }
                tt.temp = 1;
                tt.aging = aging;
                obj.aging = aging;
                obj.temp = 1;
            } else {
                obj.temp = 0;
                obj.aging = 0;
                tt.temp = 0;
                tt.aging = 0;
            }
            obj.createDate = Utils.dateFormat(new Date().getTime(), Utils.yyyyMMddhhmmss);
            var data = opPool.encrypt(JSON.stringify(obj));
            tt.user_id = userId;
            if (type == 3) {
                tt.user_name = userName;
                tt.description = description;
            }
            tt.value = data;
            tt.uuid = UUID;
            tt.API = APIAuthority;
            tt.userType = isSystem;
            tt.type = type;
            tt.create_user = user.USER_ID;
            tt.create_date = obj.createDate;
            var sql = sqlQuery.insert().into('sys_token').set(tt).build();
            logger.debug('添加用户证书sql：' + sql);
            query(sql, function (err, rows, columns) {
                if (err) {
                    logger.error('生成token证书错误：' + err);
                    message.flag = -1;
                    message.message = '生成证书失败';
                    message.data = null;
                    res.json(message);
                    return;
                } else {
                    message.flag = 0;
                    message.message = 'OK';
                    message.data = tt;
                    res.json(message);
                }
            });
        },
        /**
         * 刪除 token
         * @param req
         * @param res
         */
        deleteToken: function (req, res) {
            var id = req.body.id;
            if (!id) {
                message.flag = -1;
                message.message = '请选择证书';
                message.data = null;
                res.json(message);
            }

            var sql = 'update sys_token set is_delete = 1 where id = ' + id;
            logger.debug('刪除证书sql：' + sql);
            query(sql, function (err, rows, columns) {
                if (err) {
                    logger.error('删除证书错误：' + err);
                    message.flag = -1;
                    message.message = '删除证书失败';
                    message.data = null;
                    res.json(message);
                    return;
                } else {
                    message.flag = 0;
                    message.message = 'OK';
                    message.data = null;
                    res.json(message);
                }
            });
        },
        /**
         * 获取用户对应的
         * @param req
         * @param res
         */
        getUserToken: function (req, res) {
            var userId = req.session.user.USER_ID;
            var sql = 'SELECT value from sys_token where is_delete =0 and user_id =' + userId + ' and type in(1,2)  ORDER BY create_date';
            logger.debug('获取个人证书sql：' + sql);
            query(sql, function (err, rows, columns) {
                if (err) {
                    logger.error('获取个人证书错误：' + err);
                    message.flag = -1;
                    message.message = '获取证书失败';
                    message.data = null;
                    res.json(message);
                    return;
                } else {
                    message.flag = 0;
                    message.message = 'OK';
                    if (rows.length < 1) {
                        message.value = '你还没有证书，请向管理员申请证书'
                        message.data = null;
                    }
                    if (rows.length == 1) {
                        message.data = rows[0].value;
                    } else {
                        message.value = '你共有' + rows.length + '个证书，最新的一个为';
                        message.data = rows[0].value;
                    }
                    res.json(message);
                }
            });
        },
        /*验证登录名是否存在*/
        validateJobNo: function (req, res) {
            var jobNo = req.body.jobNo;
            var sql = "SELECT count(USER_ID) as count FROM sys_user where JOB_NO = '" + jobNo + "'";
            var message = {};
            query(sql, function (err, rows, columns) {
                if (rows[0].count > 0) {
                    message.msg = 'true';
                } else {
                    message.msg = 'false';
                }
                res.json(message);
            });
        },
        removeUser: function (req, res, action) {
            var id = req.body.id;
            if (!id) {
                message.flag = -1;
                message.message = '请选择用户';
                message.data = null;
                res.json(message);
                return;
            }
            transaction(function (err, conn) {
                if (err) {
                    logger.error('删除用户域 ERROR：' + err);
                    message.flag = -1;
                    message.message = "操作失败";
                    res.json(message);
                    return;
                } else {
                    async.waterfall(
                        [
                            function (callback) {
                                var sql = 'select NAME,DOMAIN_ID from sys_domain d where d.ADMIN_USER = ' + id;
                                logger.debug('查询是否是域管理员sql:' + sql);
                                conn.query(sql, function (err, rows, columns) {
                                    if (err) {
                                        logger.error('查询是否是域管理员错误：' + err);
                                        message.flag = -1;
                                        message.message = '删除人员错误';
                                        message.data = null;
                                        res.json(message);
                                        return;
                                    } else if (rows && rows.length > 0) {
                                        var ms = [];
                                        for (var i in rows) {
                                            ms.push(rows[i].NAME);
                                        }
                                        message.flag = -1;
                                        message.message = '该用户是域:' + ms.toString() + '的管理员';
                                        message.data = null;
                                        res.json(message);
                                        return;
                                    } else {
                                        callback(null);
                                    }
                                });
                            },
                            function (callback) {
                                var sql = 'DELETE from sys_user_role where USER_ID = ' + id;
                                logger.debug('删除用户关联角色sql:' + sql);
                                conn.query(sql, function (err, rows, columns) {
                                    if (err) {
                                        logger.error('删除用户关联角色错误：' + err);
                                        message.flag = -1;
                                        message.message = '删除用户失败';
                                        message.data = null;
                                        res.json(message);
                                        return;
                                    }
                                    callback(null);
                                });
                            },
                            function (callback) {
                                var sql = 'DELETE from sys_user_page where USER_ID =' + id;
                                logger.debug('删除用户关联菜单sql:' + sql);
                                conn.query(sql, function (err, rows, columns) {
                                    if (err) {
                                        logger.error('删除用户关联菜单错误：' + err);
                                        message.flag = -1;
                                        message.message = '删除用户失败';
                                        message.data = null;
                                        res.json(message);
                                        return;
                                    }
                                    callback(null);
                                });
                            },
                            function (callback) {
                                var sql = 'DELETE from sys_user_domain where USER_ID =' + id
                                logger.debug('删除用户关联角域sql:' + sql);
                                conn.query(sql, function (err, rows, columns) {
                                    if (err) {
                                        logger.error('删除用户关联域错误：' + err);
                                        message.flag = -1;
                                        message.message = '删除用户失败';
                                        message.data = null;
                                        res.json(message);
                                        return;
                                    }
                                    callback(null);
                                });
                            },
                            function (callback) {
                                var sql = 'DELETE from sys_user where USER_ID =' + id;
                                logger.debug('删除用户sql:' + sql);
                                conn.query(sql, function (err, rows, columns) {
                                    if (err) {
                                        logger.error('删除用户错误：' + err);
                                        message.flag = -1;
                                        message.message = '删除用户失败';
                                        message.data = null;
                                        res.json(message);
                                        return;
                                    }
                                    message.flag = 0;
                                    message.message = 'OK';
                                    message.data = null;
                                    res.json(message);
                                    return;
                                });
                            }
                        ],
                        function (err) {
                            if (err) {
                                message.flag = -1;
                                message.message = '删除用户失败';
                                message.data = null;
                                res.json(message);
                            }
                        });
                }
            });
        },
        editUser: function (req, res, action) {
            var id = req.body.id;
            var userName = req.body.userName;
            if (!userName) {
                logger.debug('用户名不能为空');
                message.flag = -1;
                message.message = '用户名不能为空';
                res.json(message);
                return;
            }
            var jobNo = req.body.jobNo;
            var mail = req.body.mail;
            if (!mail) {
                logger.debug('邮箱为空');
                message.flag = -1;
                message.message = '邮箱不能为空';
                res.json(message);
                return;
            } else {
                var reg = Utils.emailReg;
                var flag = reg.test(mail);
                if (!flag) {
                    logger.debug('邮箱格式不正确');
                    message.flag = -1;
                    message.message = '邮箱格式不正确';
                    res.json(message);
                    return;
                }
            }
            var phone = req.body.phone;
            if (!phone) {
                logger.debug('联系方式为空');
                message.flag = -1;
                message.message = '联系方式不能为空';
                res.json(message);
                return;
            } else {
                var flag = false;
                var isPhone = Utils.telReg;
                var isMob = Utils.mobileReg;
                flag = isPhone.test(phone) || isMob.test(phone);
                if (!flag) {
                    logger.debug('电话号码格式不正确');
                    message.flag = -1;
                    message.message = '电话号码格式不正确';
                    res.json(message);
                    return;
                }
            }
            var sex = req.body.sex;
            var duty = req.body.duty;
            if (duty == '0') {
                logger.debug('职务没有选择');
                message.flag = -1;
                message.message = '职务名称不能为空';
                res.json(message);
                return;
            }
            var userDesc = req.body.userDesc;
            if (id) {
                async.waterfall(
                    [
                        function (callback) {
                            var sql = 'select count(USER_ID) as countNum from sys_user where EMAIL = "' + mail + '" and USER_ID <> ' + id;
                            logger.debug('验证邮箱是否被注册过:' + sql);
                            query(sql, function (err, rows, columns) {
                                if (err) {
                                    logger.error('验证邮箱是否被注册过失败：' + err);
                                    message.flag = -1;
                                    message.message = '邮箱验证失败';
                                    res.json(message);
                                    return;
                                }
                                if (rows[0].countNum > 0) {
                                    message.flag = -1;
                                    message.message = '邮箱已经被注册过，请更换邮箱账号';
                                    res.json(message);
                                    return;
                                } else {
                                    callback(null);
                                }
                            });
                        },
                        function (callback) {
                            var sql = 'select count(USER_ID) as countNum from sys_user where MOBILE_PHONE = "' + phone + '" and USER_ID <> ' + id;
                            logger.debug('验证手机是否被注册过:' + sql);
                            query(sql, function (err, rows, columns) {
                                if (err) {
                                    logger.error('验证手机是否被注册过失败：' + err);
                                    message.flag = -1;
                                    message.message = '电话号码验证失败';
                                    res.json(message);
                                    return;
                                }
                                if (rows[0].countNum > 0) {
                                    message.flag = -1;
                                    message.message = '电话号码已经被注册过，请更换号码';
                                    res.json(message);
                                    return;
                                } else {
                                    callback(null);
                                }
                            });
                        },
                        function (callback) {
                            var sql = "update sys_user set USER_NAME = '" + userName + "', EMAIL = '" + mail +
                                "', MOBILE_PHONE = '" + phone + "', GENDER = '" + sex + "', DESCRIPTION = '" + userDesc + "',  DUTY_ID = '" + duty + "' where USER_ID = " + id;
                            logger.debug('更新用户信息sql：' + sql);
                            query(sql, function (err, rows, columns) {
                                if (err) {
                                    logger.error('更新用戶信息失败：' + err);
                                    message.flag = -1;
                                    message.message = "操作失败";
                                    res.json(message);
                                    return;
                                } else {
                                    message.flag = 0;
                                    message.message = "操作成功";
                                    message.data = "";
                                    res.json(message);
                                }
                            });
                        }
                    ],
                    function (err, result) {
                        logger.error('更新用户信息失败：' + err);
                    });
            } else {
                return res.redirect("/");
            }
        },
        /**
         * 添加用户信息
         * @param req
         * @param res
         */
        addUser: function (req, res) {
            var userType = req.session.user.IS_SYSTEM;
            if (userType == 1) {
                logger.debug('超级管理员不能添加用户');
                message.flag = -1;
                message.message = '超级管理员不能添加用户';
                res.json(message);
                return;
            }
            var userName = req.body.userName;

            if (!userName) {
                logger.debug('用户名不能为空');
                message.flag = -1;
                message.message = '用户名不能为空';
                res.json(message);
                return;
            }

            var jobNo = req.body.jobNo;
            if (!jobNo) {
                logger.debug('登录名不能为空');
                message.flag = -1;
                message.message = '登录名不能为空';
                res.json(message);
                return;
            }

            if (jobNo.length < 3 || jobNo.length > 12) {
                logger.debug('登录名格式不对，需要在3到12位之间');
                message.flag = -1;
                message.message = '登录名格式不对，需要在3到12位之间';
                res.json(message);
                return;
            }

            var reg = /^[a-zA-Z0-9_]*$/;
            if (!reg.test(jobNo)) {
                logger.debug('登录名格式不对');
                message.flag = -1;
                message.message = '登录名格式不对';
                res.json(message);
                return;
            }

            var password = req.body.password;
            if (!password) {
                logger.debug('密码为空');
                message.flag = -1;
                message.message = '密码不能为空';
                res.json(message);
                return;
            }
            var password2 = req.body.password2;
            if (!password2) {
                logger.debug('确认密码为空');
                message.flag = -1;
                message.message = '确认密码不能为空';
                res.json(message);
                return;
            }
            if (md5(password) != md5(password2)) {
                logger.debug('两次密码不一样');
                message.flag = -1;
                message.message = '两次密码不一样';
                res.json(message);
                return;
            }
            var email = req.body.email;
            if (!email) {
                logger.debug('邮箱为空');
                message.flag = -1;
                message.message = '邮箱不能为空';
                res.json(message);
                return;
            } else {
                var reg = Utils.emailReg;
                var flag = reg.test(email);
                if (!flag) {
                    logger.debug('邮箱格式不正确');
                    message.flag = -1;
                    message.message = '邮箱格式不正确';
                    res.json(message);
                    return;
                }
            }
            var mobilePhone = req.body.mobilePhone;
            if (!mobilePhone) {
                logger.debug('联系方式为空');
                message.flag = -1;
                message.message = '联系方式不能为空';
                res.json(message);
                return;
            } else {
                var flag = false;
                var isPhone = Utils.telReg;
                var isMob = Utils.mobileReg;
                flag = isPhone.test(mobilePhone) || isMob.test(mobilePhone);
                if (!flag) {
                    logger.debug('电话号码格式不正确');
                    message.flag = -1;
                    message.message = '电话号码格式不正确';
                    res.json(message);
                    return;
                }
            }
            var sex = req.body.sex;
            var dutyId = req.body.dutyId;
            if (dutyId == '0') {
                logger.debug('职务没有选择');
                message.flag = -1;
                message.message = '职务名称不能为空';
                res.json(message);
                return;
            }
            var userDesc = req.body.userDesc;
            transaction(function (err, conn) {
                if (err) {
                    logger.error('添加公有用户的时候transaction ERROR：' + err);
                    message.flag = -1;
                    message.message = "操作失败";
                    res.json(message);
                    return;
                } else {
                    async.waterfall(
                        [
                            function (callback) {
                                var sql = sqlQuery.select().from('sys_user').count('USER_ID', 'count').where({
                                    JOB_NO: jobNo
                                }).build();
                                logger.debug('验证登录名是否存在sql:' + sql);
                                conn.query(sql, function (err, rows, columns) {
                                    if (err) {
                                        logger.error('验证用户名是否存在失败：' + err);
                                        message.flag = -1;
                                        message.message = '验证失败';
                                        res.json(message);
                                        return;
                                    }
                                    if (rows[0].count > 0) {
                                        message.flag = -1;
                                        message.message = '登录名已存在';
                                        res.json(message);
                                        return;
                                    } else {
                                        callback(null);
                                    }
                                });
                            },
                            function (callback) {
                                var sql = sqlQuery.select().from('sys_user').count('EMAIL', 'count').where({
                                    EMAIL: email
                                }).build();
                                logger.debug('验证邮箱是否被注册过:' + sql);
                                conn.query(sql, function (err, rows, columns) {
                                    if (err) {
                                        logger.error('验证邮箱是否被注册过失败：' + err);
                                        message.flag = -1;
                                        message.message = '邮箱验证失败';
                                        res.json(message);
                                        return;
                                    }
                                    if (rows[0].count > 0) {
                                        message.flag = -1;
                                        message.message = '邮箱已经被注册过，请更换邮箱账号';
                                        res.json(message);
                                        return;
                                    } else {
                                        callback(null);
                                    }
                                });
                            },
                            function (callback) {
                                var sql = sqlQuery.select().from('sys_user').count('MOBILE_PHONE', 'count').where({
                                    MOBILE_PHONE: mobilePhone
                                }).build();
                                logger.debug('验证手机是否被注册过:' + sql);
                                conn.query(sql, function (err, rows, columns) {
                                    if (err) {
                                        logger.error('验证手机是否被注册过失败：' + err);
                                        message.flag = -1;
                                        message.message = '电话号码验证失败';
                                        res.json(message);
                                        return;
                                    }
                                    if (rows[0].count > 0) {
                                        message.flag = -1;
                                        message.message = '电话号码已经被注册过，请更换号码';
                                        res.json(message);
                                        return;
                                    } else {
                                        callback(null);
                                    }
                                });
                            },
                            function (callback) {
                                var sqlCustomer = sqlQuery.insert().into('sys_user').set({
                                    USER_NAME: userName,
                                    JOB_NO: jobNo,
                                    GENDER: sex,
                                    password: md5(password),
                                    DESCRIPTION: userDesc,
                                    IS_SYSTEM: 3, //企业用户
                                    EMAIL: email,
                                    MOBILE_PHONE: mobilePhone,
                                    DUTY_ID: dutyId,
                                    ENTERPRISE_ID: req.session.user.ENTERPRISE_ID,
                                    CREATE_DATE: Utils.dateFormat(new Date().getTime(), Utils.yyyyMMddhhmmss)
                                }).build();
                                logger.debug('插入用戶信息sql:' + sqlCustomer);
                                conn.query(sqlCustomer, function (cerr, rows) {
                                    if (cerr) {
                                        logger.error('插入公有用戶信息失败：' + cerr);
                                        message.flag = -1;
                                        message.message = "操作失败";
                                        res.json(message);
                                        return;
                                    } else {
                                        message.flag = 0;
                                        message.message = "操作成功";
                                        message.data = null;
                                        res.json(message);
                                    }
                                });
                            }
                        ],
                        function (err, result) {
                            logger.error('添加公有用户失败：' + err);
                        });
                }
            });
        },
        //用户头像上传
        userHeadImg: function (req, res) {
            var user = req.session.user;
            var path = configConst.filePath + '/' + user.ENTERPRISE_ID;
            var form = new formidable.IncomingForm(); //创建上传表单
            form.encoding = 'utf-8'; //设置编辑
            form.uploadDir = path; //设置上传目录
            form.keepExtensions = true; //保留后缀
            form.maxFieldsSize = 2 * 1024 * 1024; //文件大小
            form.parse(req, function (err, fields, files) {
                if (err) {
                    logger.error('上传文件错误：' + err);
                    message.flag = -1;
                    message.message = err;
                    res.json(message);
                    return;
                }
                var filename = new Date().getTime() + parseInt(Math.random() * 1000) + files.resource.name;
                var newPath = form.uploadDir + '/' + filename;
                async.waterfall(
                    [
                        function (callback) {
                            var sql = 'select count(USER_ID) as count from sys_user where IS_DELETED = 0 and ICON = "' + newPath + '"';
                            logger.debug('检查是否存在相同名称的图像文件sql：' + sql);
                            query(sql, function (err, rows) {
                                if (rows && rows[0].count > 0) {
                                    if (fs.existsSync(files.resource.path)) {
                                        fs.unlinkSync(files.resource.path);
                                    }
                                    logger.error('当前目录下存在相同名称的图像文件：' + (err || rows[0].count));
                                    message.flag = -1;
                                    message.message = '已有相同图片名称，请重命名';
                                    res.json(message);
                                    return;
                                } else {
                                    callback(null);
                                }
                            });
                        },
                        function (callback) {
                            var sql = sqlQuery.update().into('sys_user').set({
                                ICON: newPath.substring(8)
                            }).where({
                                USER_ID: user.USER_ID
                            }).build();
                            logger.debug('上传文件同步信息sql：' + sql);
                            query(sql, function (err, rows) {
                                if (err) {
                                    logger.error('插入数据失败：' + err);
                                    message.flag = -1;
                                    message.message = '插入数据失败';
                                    res.json(message);
                                    return;
                                } else {
                                    fs.renameSync(files.resource.path, newPath); //重命名
                                    user.ICON = newPath.substring(8);
                                    req.session.user = user;
                                    logger.info('上传文件成功');
                                    message.flag = 0;
                                    message.data = newPath.substring(8);
                                    res.json(message);
                                    return;
                                }
                            });
                        }
                    ],
                    function (err, rows) {
                        if (err) {
                            logger.error('上传文件错误：' + err);
                            message.flag = -1;
                            message.message = '上传文件错误';
                            res.json(message);
                            return;
                        } else {
                            message.flag = 0;
                            res.json(message);
                            return;
                        }
                    });
            });
        },
        /**
         * 更新用户个性化信息
         * @param req
         * @param res
         */
        personaliseLogo: function (req, res) {
            var user = req.session.user;
            var path = configConst.filePath + '/' + user.ENTERPRISE_ID;
            var form = new formidable.IncomingForm(); //创建上传表单
            form.encoding = 'utf-8'; //设置编辑
            form.uploadDir = path; //设置上传目录
            form.keepExtensions = true; //保留后缀
            form.maxFieldsSize = 2 * 1024 * 1024; //文件大小
            form.parse(req, function (err, fields, files) {
                if (err) {
                    logger.error('上传文件错误：' + err);
                    message.flag = -1;
                    message.message = err;
                    res.json(message);
                    return;
                }
                var filename = new Date().getTime() + parseInt(Math.random() * 1000) + files.resource.name;
                var newPath = form.uploadDir + '/' + filename;
                async.waterfall(
                    [
                        function (callback) {
                            var sql = 'select user_id,logo_path from sys_user_style where user_id =' + user.USER_ID;
                            logger.debug('获取以前的风格sql：' + sql);
                            query(sql, function (err, rows) {
                                if (err) {
                                    logger.error('获取以前的风格错误：' + (err || rows[0].count));
                                    message.flag = -1;
                                    message.message = '个性化失败';
                                    res.json(message);
                                    return;
                                } else {
                                    if (rows && rows.length > 0) {
                                        callback(null, rows[0]);
                                    } else {
                                        callback(null, null);
                                    }
                                }
                            });
                        },
                        function (row, callback) {
                            var sql = ''
                            if (row) {
                                sql = sqlQuery.update().into('sys_user_style').set({
                                    logo_path: newPath.substring(8),
                                    update_date: Utils.dateFormat(new Date().getTime(), Utils.yyyyMMddhhmmss)
                                }).where({
                                    user_id: user.USER_ID
                                }).build();
                            } else {
                                sql = sqlQuery.insert().into('sys_user_style').set({
                                    user_id: user.USER_ID,
                                    logo_path: newPath.substring(8),
                                    create_date: Utils.dateFormat(new Date().getTime(), Utils.yyyyMMddhhmmss)
                                }).build();
                            }
                            logger.debug('同步个性化Logo sql：' + sql);
                            query(sql, function (err, rows) {
                                if (err) {
                                    logger.error('同步个性化错误：' + err);
                                    message.flag = -1;
                                    message.message = '个性化失败';
                                    res.json(message);
                                    return;
                                } else {
                                    fs.renameSync(files.resource.path, newPath); //重命名
                                    logger.info('上传文件成功');
                                    message.flag = 0;
                                    message.data = newPath.substring(8);
                                    user.logoPath = newPath.substring(8);
                                    req.session.user = user;
                                    res.json(message);
                                    return;
                                }
                            });
                        }
                    ],
                    function (err, rows) {
                        if (err) {
                            logger.error('上传文件错误：' + err);
                            message.flag = -1;
                            message.message = '个性化失败';
                            res.json(message);
                            return;
                        } else {
                            message.flag = 0;
                            res.json(message);
                            return;
                        }
                    });
            });
        },
        /**
         * 删除logo信息
         * @param req
         * @param res
         */
        deleteUserPersonaliseLogo: function (req, res) {
            var user = req.session.user;
            async.waterfall(
                [
                    function (callback) {
                        var sql = sqlQuery.update().into('sys_user_style').set({
                            logo_path: null,
                            update_date: Utils.dateFormat(new Date().getTime(), Utils.yyyyMMddhhmmss)
                        }).where({
                            user_id: user.USER_ID
                        }).build();
                        logger.debug('删除logo信息sql：' + sql);
                        query(sql, function (err, rows) {
                            if (err) {
                                logger.error('删除logo错误：' + err);
                                message.flag = -1;
                                message.message = '删除logo失败';
                                res.json(message);
                                return;
                            } else {
                                logger.info('删除logo成功');
                                message.flag = 0;
                                message.data = null;
                                user.logoPath = null;
                                req.session.user = user;
                                res.json(message);
                                return;
                            }
                        });
                    }
                ],
                function (err) {
                    if (err) {
                        logger.error('删除logo错误：' + err);
                        message.flag = -1;
                        message.message = '删除logo失败';
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
         * 修改密码
         * @param req
         * @param res
         */
        resetPassword: function (req, res) {
            var userId = req.body.userId;
            var password = req.body.password;
            var password2 = req.body.password2;
            if (md5(password) != md5(password2)) {
                message.flag = -1;
                message.message = '两次密码不一样';
                message.data = null;
                res.json(message);
                return;
            }
            var sql = sqlQuery.update().into('sys_user').set({
                PASSWORD: md5(password)
            }).where({
                USER_ID: userId
            }).build();
            logger.debug('更新用户密码sql：' + sql);
            query(sql, function (error, rows) {
                if (error || rows.length < 1) {
                    logger.error('更新用户密码错误:' + (error || rows.length));
                    message.flag = -1;
                    message.message = '更新用户密码错误';
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
        },
        personaliseInfo: function (req, res) {
            var user = req.session.user;
            var fullName = req.body.fullName;
            var shortName = req.body.shortName;
            async.waterfall(
                [
                    function (callback) {
                        var sql = 'select user_id,full_name,short_name from sys_user_style where user_id =' + user.USER_ID;
                        logger.debug('获取以前的风格sql：' + sql);
                        query(sql, function (err, rows) {
                            if (err) {
                                logger.error('获取以前的风格错误：' + (err || rows[0].count));
                                message.flag = -1;
                                message.message = '个性化失败';
                                res.json(message);
                                return;
                            } else {
                                if (rows && rows.length > 0) {
                                    callback(null, rows[0]);
                                } else {
                                    callback(null, null);
                                }
                            }
                        });
                    },
                    function (row, callback) {
                        var sql = ''
                        if (row) {
                            sql = sqlQuery.update().into('sys_user_style').set({
                                full_name: fullName,
                                short_name: shortName,
                                update_date: Utils.dateFormat(new Date().getTime(), Utils.yyyyMMddhhmmss)
                            }).where({
                                user_id: user.USER_ID
                            }).build();
                        } else {
                            sql = sqlQuery.insert().into('sys_user_style').set({
                                user_id: user.USER_ID,
                                full_name: fullName,
                                short_name: shortName,
                                create_date: Utils.dateFormat(new Date().getTime(), Utils.yyyyMMddhhmmss)
                            }).build();
                        }
                        logger.debug('同步个性化信息sql：' + sql);
                        query(sql, function (err, rows) {
                            if (err) {
                                logger.error('同步个性化错误：' + err);
                                message.flag = -1;
                                message.message = '同步个性化失败';
                                res.json(message);
                                return;
                            } else {
                                logger.info('个性化成功');
                                message.flag = 0;
                                message.data = null;
                                user.fullName = fullName;
                                user.shortName = shortName;
                                req.session.user = user;
                                res.json(message);
                                return;
                            }
                        });
                    }
                ],
                function (err, rows) {
                    if (err) {
                        logger.error('上传文件错误：' + err);
                        message.flag = -1;
                        message.message = '个性化失败';
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
        personaliseSkin: function (req, res) {
            var user = req.session.user;
            var skin = req.body.skin;
            async.waterfall(
                [
                    function (callback) {
                        var sql = 'select user_id,skin from sys_user_style where user_id =' + user.USER_ID;
                        logger.debug('获取以前的风格sql：' + sql);
                        query(sql, function (err, rows) {
                            if (err) {
                                logger.error('获取以前的风格错误：' + (err || rows[0].count));
                                message.flag = -1;
                                message.message = '获取风格失败';
                                res.json(message);
                                return;
                            } else {
                                if (rows && rows.length > 0) {
                                    callback(null, rows[0]);
                                } else {
                                    callback(null, null);
                                }
                            }
                        });
                    },
                    function (row, callback) {
                        var sql = ''
                        if (row) {
                            sql = sqlQuery.update().into('sys_user_style').set({
                                skin: skin,
                                update_date: Utils.dateFormat(new Date().getTime(), Utils.yyyyMMddhhmmss)
                            }).where({
                                user_id: user.USER_ID
                            }).build();
                        } else {
                            sql = sqlQuery.insert().into('sys_user_style').set({
                                user_id: user.USER_ID,
                                skin: skin,
                                create_date: Utils.dateFormat(new Date().getTime(), Utils.yyyyMMddhhmmss)
                            }).build();
                        }
                        logger.debug('同步风格信息sql：' + sql);
                        query(sql, function (err, rows) {
                            if (err) {
                                logger.error('同步风格错误：' + err);
                                message.flag = -1;
                                message.message = '同步风格失败';
                                res.json(message);
                                return;
                            } else {
                                message.flag = 0;
                                message.data = null;
                                user.skin = skin;
                                req.session.user = user;
                                res.json(message);
                                return;
                            }
                        });
                    }
                ],
                function (err, rows) {
                    if (err) {
                        logger.error('同步个性化信息错误：' + err);
                        message.flag = -1;
                        message.message = '个性化失败';
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
         * 获取用户个性化信息
         * @param req
         * @param res
         */
        getPersonalise: function (req, res) {
            var userId = req.session.user.USER_ID;
            var sql = 'select full_name as fullName ,short_name as shortName ,logo_path as logoPath from sys_user_style where user_id = ' + userId;
            logger.debug('获取个性化信息sql:' + sql);
            query(sql, function (err, rows) {
                if (err) {
                    logger.error('获取用户个性化信息错误');
                    message.flag = -1;
                    message.message = '获取用户个性化信息失败';
                    message.data = null;
                    res.json(message);
                } else {
                    message.flag = 0;
                    message.message = 'OK';
                    if (rows && rows.length > 0) {
                        message.data = rows[0];
                    } else {
                        message.data = null;
                    }
                    res.json(message);
                }
            });
        }
    }
;
module.exports = system_user;
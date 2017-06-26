var actionUtil = require("../../framework/action/actionUtils")();
var transaction = actionUtil.transaction;
var async = require("async");
var fs = require('fs');
var query = actionUtil.query;
var moment = require("moment");
var Utils = require('../../utils/tools/utils');
var SMS = require('../../utils/sms/sms');
var md5 = require('md5');
var logger = require('log4js').getLogger('Ibox');
var fileUtils = require("../../utils/tools/fileUtils");
var GlobalAgent = require('../../message/GlobalAgent');
var uuid = require('node-uuid');
var opPool = require('../../openplant/openPlantPool');
var sqlQuery = require('sql-query').Query();
var message = {
    flag: 0,
    message: '成功',
    data: null
}

var boxUser = {
        /**
         * 用户注册
         * @param req
         * @param res
         */
        register: function (req, res) {
            var registerPhone = req.body.registerPhone;
            var userName = req.body.userName;
            var password = req.body.password;
            var smsCode = req.body.smsCode;
            var UUID = req.body.UUID;
            var obj = SMS.getSms(UUID);
            if (!obj) {
                message.flag = -1;
                message.message = '验证码为空';
                message.data = null;
                res.json(message);
                return;
            }
            var smsOnlineCode = obj.smsCode;
            var onlinePhone = obj.phone;
            if (!userName) {
                message.flag = -1;
                message.message = '用户名不能为空';
                message.data = null;
                res.json(message);
                return;
            }
            if (smsOnlineCode != smsCode || onlinePhone != registerPhone) {
                message.flag = -1;
                message.message = '验证码不正确';
                message.data = null;
                res.json(message);
                return;
            }
            SMS.deleteSms(UUID);
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
                                var sql = sqlQuery.select().from('sys_user').select(['user_id']).where({JOB_NO: userName}).build();
                                logger.debug('获取当前用户是否有同名的名称用户存在sql:' + sql);
                                query(sql, function (error, rows) {
                                    if (error) {
                                        logger.error('获取用户信息错误：' + error);
                                        message.flag = -1;
                                        message.message = '验证用户信息出错';
                                        message.data = null;
                                        callback(error, message);
                                    } else {
                                        if (rows.length > 0) {
                                            message.flag = -1;
                                            message.message = '用户名已存在';
                                            message.data = null;
                                            callback(new Error('用户名已存在'), message);
                                        } else {
                                            callback(null);
                                        }
                                    }
                                })
                            },
                            function (callback) {
                                var sql = sqlQuery.insert().into('sys_user').set({
                                    user_Name: userName,
                                    JOB_NO: userName,
                                    IS_SYSTEM: 3,
                                    password: md5(password),
                                    mobile_phone: registerPhone,
                                    PHONE_MOBILE: registerPhone,
                                    description: '盒子普通用户注册',
                                    SOURCE: 1,
                                    CREATE_DATE: Utils.dateFormat(new Date().getTime(), Utils.yyyyMMddhhmmss)
                                }).build();
                                logger.debug('插入用户信息sql：' + sql);
                                query(sql, function (error, rows) {
                                    if (error) {
                                        message.flag = -1;
                                        message.message = '创建用户错误';
                                        message.data = null;
                                        callback(error, message);
                                    } else {
                                        var row = {
                                            USER_ID: rows.insertId,
                                            jobNo: userName,
                                            USER_NAME: userName,
                                            Box: registerPhone
                                        }
                                        message.data = row;
                                        callback(null, row);
                                    }
                                });
                            },
                            function (user, callback) {
                                var sql = 'SELECT se.ENTERPRISE_ID as companyId ,se.ENTERPRISE_ID as groupId,se.ENTERPRISE_NAME as companyName,su.job_no as jobNo from sys_user su left join sys_enterprise se on su.ENTERPRISE_ID = se.ENTERPRISE_ID where su.source =2 and su.MOBILE_PHONE = "' + registerPhone + '"';
                                logger.debug('获取上级用户信息：', sql);
                                conn.query(sql, function (err, rows) {
                                    if (err) {
                                        logger.error('获取上级用户失败：' + err);
                                        message.flag = -1;
                                        message.message = "获取上级用户失败";
                                        message.data = null;
                                        callback(new Error('获取上级用户失败', message));
                                    } else {
                                        callback(null, rows, user);
                                    }
                                });
                            },
                            function (rs, user, callback) {
                                if (rs.length > 0) {
                                    callback(null, rs[0], rs[0], user);
                                } else {
                                    var sql = 'SELECT ENTERPRISE_ID as groupId from sys_enterprise where TYPE =3 and PHONE = "' + registerPhone + '"';
                                    logger.debug('获取是否有同级用户注册过信息：', sql);
                                    conn.query(sql, function (err, rows) {
                                        if (err) {
                                            logger.error('获取是否有同级用户注册过信息失败：' + err);
                                            message.flag = -1;
                                            message.message = "获取是否有同级用户注册过信息失败";
                                            message.data = null;
                                            callback(new Error('获取是否有同级用户注册过信息', message));
                                        } else {
                                            if (rows.length == 1) {
                                                callback(null, null, rows[0], user);
                                            } else {
                                                callback(null, null, null, user);
                                            }
                                        }
                                    });
                                }
                            },
                            function (companyFlag, company, user, callback) {
                                if (companyFlag || company) {
                                    callback(null, companyFlag, company, user);
                                } else {
                                    var sqlCompany = sqlQuery.insert().into('sys_enterprise').set({
                                        ENTERPRISE_NAME: user.jobNo,
                                        TYPE: 3,
                                        DESCRIPTION: 'box个人用户注册,域分组',
                                        LINK_MAN: user.jobNo,
                                        PHONE: registerPhone,
                                        CREATE_DATE: Utils.dateFormat(new Date().getTime(), Utils.yyyyMMddhhmmss)
                                    }).build();
                                    logger.debug('添加个人开发者企业基本信息sql：' + sqlCompany);
                                    conn.query(sqlCompany, function (err, rows) {
                                        if (err) {
                                            logger.error('插入私有用戶企业信息失败：' + err);
                                            message.flag = -1;
                                            message.message = "操作失败";
                                            message.data = null;
                                            callback(new Error('操作失败', message));
                                        } else {
                                            var rs = {
                                                groupId: rows.insertId,
                                                jobNo: user.jobNo
                                            };
                                            callback(null, null, rs, user);
                                        }
                                    });
                                }
                            },
                            function (companyFlag, company, user, callback) {
                                if (companyFlag) {
                                    callback(null, companyFlag, company, user);
                                } else {
                                    var sqlCompany = sqlQuery.insert().into('sys_enterprise').set({
                                        ENTERPRISE_NAME: user.jobNo,
                                        TYPE: 2,
                                        DESCRIPTION: 'box个人用户注册',
                                        LINK_MAN: user.jobNo,
                                        PHONE: registerPhone,
                                        CREATE_DATE: Utils.dateFormat(new Date().getTime(), Utils.yyyyMMddhhmmss)
                                    }).build();
                                    logger.debug('添加个人开发者企业基本信息sql：' + sqlCompany);
                                    conn.query(sqlCompany, function (err, rows) {
                                        if (err) {
                                            logger.error('插入私有用戶企业信息失败：' + err);
                                            message.flag = -1;
                                            message.message = "操作失败";
                                            message.data = null;
                                            callback(new Error('操作失败', message));
                                        } else {
                                            company.companyId = rows.insertId;
                                            company.companyName = user.jobNo;
                                            company.jobNo = user.jobNo;
                                            callback(null, null, company, user);
                                        }
                                    });
                                }
                            },
                            function (companyFlag, company, user, callback) {
                                if (companyFlag) {
                                    var sql = 'select domain_id as domainId,URI,company_ID as companyId from sys_domain where URI = "/' + companyFlag.companyName + '/' + companyFlag.jobNo + '"';
                                    logger.debug('获取上级域信息sql:' + sql);
                                    conn.query(sql, function (error, rows) {
                                        if (error) {
                                            logger.error('获取上级域信息失败：' + error);
                                            message.flag = -1;
                                            message.message = "获取上级域信息失败";
                                            message.data = null;
                                            callback(new Error('获取上级域信息失败', message));
                                        } else {
                                            callback(null, companyFlag, rows[0], company, user);
                                        }
                                    });
                                } else {
                                    callback(null, companyFlag, null, company, user);
                                }
                            },
                            function (companyFlag, domain, company, user, callback) {
                                var sql, URI;
                                if (companyFlag) {
                                    URI = domain.URI + '/' + user.jobNo;
                                    sql = sqlQuery.insert().into('sys_domain').set({
                                        PRE_DOMAIN_ID: domain.domainId,
                                        COMPANY_ID: company.companyId,
                                        NAME: user.jobNo,
                                        URI: URI,
                                        CREATE_USER: 1,
                                        ADMIN_USER: user.USER_ID,
                                        DOMAIN_CODE: uuid.v1(),
                                        DESCRIPTION: 'box个人用户注册时创建',
                                        TYPE: 2,
                                        CREATE_DATE: Utils.dateFormat(new Date().getTime(), Utils.yyyyMMddhhmmss)
                                    }).build();
                                } else {
                                    URI = '/' + user.jobNo
                                    sql = sqlQuery.insert().into('sys_domain').set({
                                        PRE_DOMAIN_ID: 1,
                                        COMPANY_ID: company.companyId,
                                        NAME: user.jobNo,
                                        URI: URI,
                                        CREATE_USER: 1,
                                        ADMIN_USER: user.USER_ID,
                                        DOMAIN_CODE: uuid.v1(),
                                        DESCRIPTION: 'bxo个人用户注册时创建',
                                        CREATE_DATE: Utils.dateFormat(new Date().getTime(), Utils.yyyyMMddhhmmss)
                                    }).build();
                                }
                                logger.debug('添加box个人用户的时候初始化Domain信息sql：' + sql);
                                conn.query(sql, function (err, rows) {
                                    if (err) {
                                        logger.error('插入个人用户Domain信息失败：' + err);
                                        message.flag = -1;
                                        message.message = "插入个人用户Domain失败";
                                        message.data = null;
                                        callback(new Error('插入个人用户Domain失败', message));
                                    } else {
                                        domain = {
                                            domainId: rows.insertId
                                        };
                                        callback(null, companyFlag, domain, company, user);
                                    }
                                });
                            }
                            ,
                            function (companyFlag, domain, company, user, callback) {
                                var sqlDomain = sqlQuery.insert().into('sys_user_domain').set({
                                    USER_ID: user.USER_ID,
                                    DOMAIN_ID: domain.domainId,
                                    IS_ADMIN: 1,
                                    CREATE_USER: 1,
                                    CREATE_DATE: Utils.dateFormat(new Date().getTime(), Utils.yyyyMMddhhmmss)
                                }).build();
                                logger.debug('添加用户和Domain关联信息sql：' + sqlDomain);
                                conn.query(sqlDomain, function (err, rows) {
                                    if (err) {
                                        logger.error('添加用户和Domain关联信息错误：' + err);
                                        message.flag = -1;
                                        message.message = "操作失败";
                                        message.data = null;
                                        callback(new Error('操作失败', message));
                                    } else {
                                        callback(null, companyFlag, domain, company, user);
                                    }
                                });
                            },
                            function (companyFlag, domain, company, user, callback) {
                                if (companyFlag) {
                                    var sql = 'select ID as ID,URI,company_ID as companyId from sys_mtree where URI = "/' + companyFlag.companyName + '/' + companyFlag.jobNo + '"';
                                    logger.debug('更新用戶信息sql:' + sql);
                                    conn.query(sql, function (cerr, rows) {
                                        if (cerr) {
                                            logger.error('获取上级域信息失败：' + cerr);
                                            message.flag = -1;
                                            message.message = "获取上级域信息失败";
                                            message.data = null;
                                            callback(new Error('获取上级域信息失败', message));
                                        } else {
                                            callback(null, companyFlag, domain, company, rows[0], user);
                                        }
                                    });
                                } else {
                                    callback(null, companyFlag, domain, company, null, user);
                                }
                            },
                            function (companyFlag, domain, company, mtree, user, callback) {
                                var sql, URI;
                                if (companyFlag) {
                                    URI = mtree.URI + '/' + user.jobNo;
                                    sql = sqlQuery.insert().into('sys_mtree').set({
                                        PID: mtree.ID,
                                        DOMAIN_ID: domain.domainId,
                                        URI: URI,
                                        NAME: user.jobNo,
                                        LAYER: 0,
                                        MTREE_SOURCE: 1,
                                        DESCRIPTION: 'Box个人用戶注册创建',
                                        COMPANY_ID: company.companyId,
                                        CREATE_DATE: Utils.dateFormat(new Date().getTime(), Utils.yyyyMMddhhmmss)
                                    }).build();
                                } else {
                                    URI = '/' + user.jobNo;
                                    sql = sqlQuery.insert().into('sys_mtree').set({
                                        DOMAIN_ID: domain.domainId,
                                        URI: URI,
                                        NAME: user.jobNo,
                                        LAYER: 0,
                                        MTREE_SOURCE: 1,
                                        DESCRIPTION: 'Box个人用戶注册创建',
                                        COMPANY_ID: domain.companyId,
                                        CREATE_DATE: Utils.dateFormat(new Date().getTime(), Utils.yyyyMMddhhmmss)
                                    }).build();
                                }
                                logger.debug('插入box个人用戶Mtree资源sql:' + sql);
                                conn.query(sql, function (err, rows) {
                                    if (err) {
                                        logger.error('插入个人用戶Mtree资源失败：' + err);
                                        message.flag = -1;
                                        message.message = "操作失败";
                                        message.data = null;
                                        callback(new Error('操作失败', message));
                                    } else {
                                        callback(null, companyFlag, company, user);
                                    }
                                });
                            },
                            function (companyFlag, company, user, callback) {
                                var sqlCustomer = sqlQuery.update().into('sys_user').set({
                                    ENTERPRISE_ID: company.companyId,
                                    OPGROUP_ID: company.groupId,
                                    UPDATE_DATE: Utils.dateFormat(new Date().getTime(), Utils.yyyyMMddhhmmss)
                                }).where({
                                    USER_ID: user.USER_ID
                                }).build();
                                logger.debug('更新用戶信息sql:' + sqlCustomer);
                                conn.query(sqlCustomer, function (cerr, rows) {
                                    if (cerr) {
                                        logger.error('更新个人用戶信息失败：' + cerr);
                                        message.flag = -1;
                                        message.message = "操作失败";
                                        message.data = null;
                                        callback(new Error('操作失败', message));
                                    } else {
                                        callback(null, companyFlag, company, user);
                                    }
                                });
                            },
                            function (companyFlag, company, user, callback) {
                                var sqlRole = sqlQuery.insert().into('sys_user_role').set({
                                    USER_ID: user.USER_ID,
                                    ROLE_ID: 5
                                }).build();
                                logger.debug('插入用戶基本权限sql:' + sqlRole);
                                conn.query(sqlRole, function (ccerr, rows) {
                                    if (ccerr) {
                                        logger.error('插入个人开发者基础权限失败：' + ccerr);
                                        message.flag = -1;
                                        message.message = "操作失败";
                                        message.data = null;
                                        callback(new Error('操作失败', message));
                                    } else {
                                        callback(null, companyFlag, company, user);
                                    }
                                });
                            },
                            function (companyFlag, company, user, callback) {
                                //数据库sys_user保存mailTokenKey
                                message.flag = 0;
                                message.message = "OK";
                                //创建对应的文件夹
                                var path = './public/userfile/';
                                if (companyFlag) {
                                    path += company.companyId + '/' + 'resources/' + company.companyName + '/' + company.jobNo + '/' + user.jobNo;
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
                                } else {
                                    path += company.companyId;
                                    fs.exists(path, function (exists) {
                                        if (exists) {
                                            fileUtils.rmdirSync(path);
                                            //创建用户资源目录
                                            fs.mkdirSync(path);
                                            fs.mkdirSync(path + '/resources');
                                            fs.mkdirSync(path + '/resources/' + user.jobNo);
                                            fs.mkdirSync(path + '/model');
                                            fs.mkdirSync(path + '/model' + '/file');
                                            fs.mkdirSync(path + '/model' + '/jar');
                                        }
                                        if (!exists) {
                                            //创建用户资源目录
                                            fs.mkdirSync(path);
                                            fs.mkdirSync(path + '/resources');
                                            fs.mkdirSync(path + '/resources/' + user.jobNo);
                                            fs.mkdirSync(path + '/model');
                                            fs.mkdirSync(path + '/model' + '/file');
                                            fs.mkdirSync(path + '/model' + '/jar');
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
         * 企业用户注册
         * @param req
         * @param res
         */
        registerEnter: function (req, res) {
            var registerPhone = req.body.registerPhone;
            var userName = req.body.userName;
            var password = req.body.password;
            var enterName = req.body.enterName;
            var smsCode = req.body.smsCode;
            var UUID = req.body.UUID;
            var obj = SMS.getSms(UUID);
            if (!obj) {
                message.flag = -1;
                message.message = '验证码为空';
                message.data = null;
                res.json(message);
                return;
            }
            var smsOnlineCode = obj.smsCode;
            var onlinePhone = obj.phone;
            if (!userName) {
                message.flag = -1;
                message.message = '用户名不能为空';
                message.data = null;
                res.json(message);
                return;
            }
            if (smsOnlineCode != smsCode || onlinePhone != registerPhone) {
                message.flag = -1;
                message.message = '验证码不正确';
                message.data = null;
                res.json(message);
                return;
            }
            SMS.deleteSms(UUID);
            async.waterfall(
                [
                    function (callback) {
                        var sql = sqlQuery.select().from('sys_user').select(['user_id']).where({JOB_NO: userName}).build();
                        logger.debug('获取当前用户是否有同名的名称用户存在sql:' + sql);
                        query(sql, function (error, rows) {
                            if (error) {
                                logger.error('获取用户信息错误：' + error);
                                message.flag = -1;
                                message.message = '验证用户信息出错';
                                message.data = null;
                                callback(error, message);
                            }
                            if (rows.length > 0) {
                                message.flag = -1;
                                message.message = '用户名已存在';
                                message.data = null;
                                callback(new Error('用户名已存在'), message);
                            } else {
                                callback(null);
                            }
                        })
                    },
                    function (callback) {
                        var sql = sqlQuery.select().from('sys_user').select(['user_id']).where({MOBILE_PHONE: registerPhone, SOURCE: 2}).build();
                        logger.debug('获取当前用户是否有相同手机号的盒子管理员sql:' + sql);
                        query(sql, function (error, rows) {
                            if (error) {
                                logger.error('获取用户信息错误：' + error);
                                message.flag = -1;
                                message.message = '验证用户信息出错';
                                message.data = null;
                                callback(error, message);
                            }
                            if (rows.length > 0) {
                                message.flag = -1;
                                message.message = '该手机号已存在企业账户';
                                message.data = null;
                                callback(new Error('该手机号已存在企业账户'), message);
                            } else {
                                callback(null);
                            }
                        });
                    },
                    function (callback) {
                        var sql = sqlQuery.insert().into('sys_user').set({
                            user_Name: userName,
                            JOB_NO: userName,
                            password: md5(password),
                            mobile_phone: registerPhone,
                            PHONE_MOBILE: registerPhone,
                            description: '盒子企业用户注册',
                            SOURCE: 2,
                            IS_SYSTEM: 3,
                            IS_ACTIVE: 0,
                            REVIEW: '未审核',
                            ENTERPRISE_NAME: enterName,
                            CREATE_DATE: Utils.dateFormat(new Date().getTime(), Utils.yyyyMMddhhmmss)
                        }).build();
                        logger.debug('插入用户信息sql：' + sql);
                        query(sql, function (error, rows) {
                            if (error) {
                                message.flag = -1;
                                message.message = '创建用户错误';
                                message.data = null;
                                callback(error, message);
                            } else {
                                SMS.deleteSms(UUID);
                                message.flag = 0;
                                message.message = 'OK';
                                var user = {
                                    userId: rows.insertId,
                                    userName: userName,
                                    jobNo: userName,
                                    userType: 1,
                                    ENTERPRISE_NAME: 1,
                                    IS_ACTIVE: 0,
                                    REVIEW: '未审核',
                                    registerPhone: registerPhone
                                }
                                message.data = user;
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
         * 用户登录
         * @param req
         * @param res
         */
        login: function (req, res) {
            var host = req.connection.remoteAddress.substring(7);
            var userName = req.body.userName;
            var password = req.body.password;
            if (userName != undefined && typeof(userName) == "string" && userName != "") {
                var sql = 'select USER_ID as userid ,JOB_NO as jobNo,GENDER as gender,USER_NAME as userName, mobile_phone as registerPhone,ENTERPRISE_ID as enterpriseId, ICON, DESCRIPTION as descritpion, source,IS_SYSTEM, IS_UNVILIABLE,IS_ACTIVE,REVIEW,IS_ONLINE ,HOST,CREATE_DATE as createTime,UPDATE_DATE as lastUpdateTime ';
                sql += 'from sys_user where JOB_NO="' + userName + '" and PASSWORD = "' + md5(password) + '"';
                logger.debug('用戶登录sql:' + sql);
                async.waterfall([
                    function (callback) {
                        query(sql, function (err, rows) {
                            if (rows && rows.length == 1) {
                                var user = rows[0];
                                callback(null, user);
                            } else {
                                callback(null, null);
                            }
                        });
                    },
                    function (user, callback) {
                        if (user != null) {
                            if (user.IS_UNVILIABLE == 1) {
                                message.flag = -1;
                                message.message = '账号已被禁用';
                                message.data = null;
                                callback(null, message);
                            } else {
                                var time = moment(new Date()).format('YYYY-MM-DD HH:mm:ss');
                                var sql = 'update sys_user set IS_ONLINE = 1,HOST = "' + host + '",UPDATE_DATE="' + time + '" where IS_ACTIVE != 2 and JOB_NO ="' + userName + '"';
                                logger.debug('更新用户登录信息sql:' + sql);
                                query(sql, function (err, rows, columns) {
                                    var obj = {
                                        user_id: user.userid,
                                        user_name: userName,
                                        time: time,
                                        ip: host,
                                        device_name: req.body.deviceName,
                                        descs: 'APP和网站接口接口'
                                    };
                                    var sql = sqlQuery.insert().into('sys_login_log').set(obj).build();
                                    query(sql, function (error, rows) {
                                    });
                                    if (err) {
                                        logger.error('更新用户登录信息错误:' + err);
                                        message.flag = -1;
                                        message.message = '账户或密码错误';
                                        message.data = null;
                                    } else {
                                        var token = {
                                            userId: user.userId,
                                            date: parseInt(new Date().getTime() / 1000),
                                            UD: opPool.makeUUID(uuid.v1()),
                                            randow: parseInt(Math.random() * 1000)
                                        }
                                        user.token = opPool.encrypt(JSON.stringify(token));
                                        message.flag = 0;
                                        message.message = 'OK';
                                        message.data = user;
                                        user.USER_ID = user.userId;
                                        // GlobalAgent.refreshUserDomain(user);
                                        callback(null, message);
                                    }
                                });
                            }
                        } else {
                            message.flag = -1;
                            message.message = '账户或密码错误';
                            message.data = null;
                            callback(null, message);
                        }
                    }
                ], function (err, message) {
                    res.json(message);
                });
            } else {
                message.flag = -1;
                message.message = '用户名为空';
                message.data = null;
                res.json(message);
            }
        },
        /**
         * 审核
         * @param req
         * @param res
         */
        review: function (req, res) {
            var userId = req.body.userId;
            if (!userId) {
                message.flag = -1;
                message.message = '用户为空';
                message.data = null;
                res.json(message);
                return;
            }
            var isActive = req.body.isActive;
            if (!isActive) {
                message.flag = -1;
                message.message = '审核类型为空';
                message.data = null;
                res.json(message);
                return;
            }
            var review = req.body.review;
            if (isActive == 1) {
                review = '审核通过';
            } else {
                if (!review) {
                    message.flag = -1;
                    message.message = '审核内容不能为空';
                    message.data = null;
                    res.json(message);
                    return;
                }
                isActive = 0;
            }
            transaction(function (err, conn) {
                if (err) {
                    logger.error('用户审核transaction ERROR：' + err);
                    message.flag = -1;
                    message.message = "操作失败";
                    message.data = null;
                    res.json(message);
                    return;
                } else {
                    async.waterfall(
                        [
                            function (callback) {
                                var sql = 'SELECT USER_ID as userId,job_no as jobNo,mobile_phone as phone,enterprise_name as companyName,is_active as isActive from sys_user where user_id = ' + userId;
                                logger.debug('获取用户信息sql:', sql);
                                query(sql, function (error, rows) {
                                    if (error) {
                                        logger.error('获取用户信息错误:', error);
                                        message.flag = -1;
                                        message.message = '获取用户信息错误';
                                        message.data = null;
                                        callback(new Error('获取用户信息出错'), message);
                                    } else {
                                        if (rows.length != 1) {
                                            message.flag = -1;
                                            message.message = '用户不存在';
                                            message.data = null;
                                            callback(new Error('用户不存在'), message);
                                        } else {
                                            if (rows[0].isActive == 1) {
                                                message.flag = -1;
                                                message.message = '用户已审核';
                                                message.data = null;
                                                callback(new Error('用户已审核'), message);
                                            } else {
                                                callback(null, rows[0]);
                                            }
                                        }
                                    }
                                });
                            },
                            function (user, callback) {
                                var sql = sqlQuery.update().into('sys_user').set({
                                    is_active: isActive,
                                    review: review,
                                    update_date: moment(new Date()).format('YYYY-MM-DD HH:mm:ss')
                                }).where({user_id: userId, source: 2}).build();
                                logger.debug('用户审核sql:', sql);
                                query(sql, function (error, rows) {
                                    if (error) {
                                        logger.error('用户审核错误:', error);
                                        message.flag = -1;
                                        message.message = '用户审核错误';
                                        message.data = null;
                                        callback(new Error('审核出错出错'), message);
                                    } else {
                                        if (isActive == 1) {
                                            callback(null, user);
                                        } else {
                                            message.flag = 0;
                                            message.message = 'OK';
                                            message.data = null;
                                            callback(new Error('审核没有通过'), message);
                                        }
                                    }
                                });
                            },
                            function (user, callback) {
                                var sql = 'SELECT ENTERPRISE_ID as companyId from sys_enterprise where type =1 and ENTERPRISE_NAME = "' + user.companyName + '"';
                                logger.debug('获取用户所属企业信息sql:', sql);
                                conn.query(sql, function (error, rows) {
                                    if (error) {
                                        logger.error('获取用户所属企业信息错误：', error);
                                        message.flag = -1;
                                        message.message = '获取用户所属企业信息失败';
                                        message.data = null;
                                        callback(new Error('获取用户所属企业信息错误'), message);
                                    } else {
                                        if (rows.length > 0) {
                                            callback(null, rows[0], user);
                                        } else {
                                            callback(null, null, user);
                                        }
                                    }
                                });
                            },
                            function (company, user, callback) {
                                if (company) {
                                    callback(null, company, company.companyId, user);
                                } else {
                                    var sqlCompany = sqlQuery.insert().into('sys_enterprise').set({
                                        ENTERPRISE_NAME: user.companyName,
                                        TYPE: 1,
                                        DESCRIPTION: 'box用户审核',
                                        LINK_MAN: user.jobNo,
                                        PHONE: user.phone,
                                        CREATE_DATE: Utils.dateFormat(new Date().getTime(), Utils.yyyyMMddhhmmss)
                                    }).build();
                                    logger.debug('添加个人开发者企业基本信息sql：' + sqlCompany);
                                    conn.query(sqlCompany, function (err, rows) {
                                        if (err) {
                                            logger.error('插入私有用戶企业信息失败：' + err);
                                            message.flag = -1;
                                            message.message = "操作失败";
                                            message.data = null;
                                            callback(new Error('操作失败', message));
                                        } else {
                                            callback(null, null, rows.insertId, user);
                                        }
                                    });
                                }
                            },
                            function (company, companyId, user, callback) {
                                if (company) {
                                    callback(null, company, companyId, user);
                                } else {
                                    var sqlDomain = sqlQuery.insert().into('sys_domain').set({
                                        COMPANY_ID: companyId,
                                        PRE_DOMAIN_ID: 1,
                                        NAME: user.companyName,
                                        URI: '/' + user.companyName,
                                        CREATE_USER: 1,
                                        ADMIN_USER: user.userId,
                                        DOMAIN_CODE: uuid.v1(),
                                        DESCRIPTION: 'box用户审核时创建',
                                        CREATE_DATE: Utils.dateFormat(new Date().getTime(), Utils.yyyyMMddhhmmss)
                                    }).build();
                                    logger.debug('添加box用户审核的时候初始化Domain信息sql：' + sqlDomain);
                                    conn.query(sqlDomain, function (err, rows) {
                                        if (err) {
                                            logger.error('插入box用户Domain信息失败：' + err);
                                            message.flag = -1;
                                            message.message = "操作失败";
                                            message.data = null;
                                            callback(new Error('操作失败', message));
                                        } else {
                                            callback(null, null, companyId, rows.insertId, user);
                                        }
                                    });
                                }
                            },
                            function (company, companyId, domainId, user, callback) {
                                if (company) {
                                    callback(null, company, companyId, domainId, user);
                                } else {
                                    var sqlDomain = sqlQuery.insert().into('sys_user_domain').set({
                                        USER_ID: user.userId,
                                        DOMAIN_ID: domainId,
                                        IS_ADMIN: 1,
                                        CREATE_USER: 1,
                                        CREATE_DATE: Utils.dateFormat(new Date().getTime(), Utils.yyyyMMddhhmmss)
                                    }).build();
                                    logger.debug('添加用户和Domain关联信息sql：' + sqlDomain);
                                    conn.query(sqlDomain, function (err, rows) {
                                        if (err) {
                                            logger.error('添加用户和Domain关联信息错误：' + err);
                                            message.flag = -1;
                                            message.message = "操作失败";
                                            message.data = null;
                                            callback(new Error('操作失败', message));
                                        } else {
                                            callback(null, null, companyId, domainId, user);
                                        }
                                    });
                                }
                            },
                            function (company, companyId, domainId, user, callback) {
                                if (company) {
                                    callback(null, company, domainId, companyId, user);
                                } else {
                                    var sqlMtree = sqlQuery.insert().into('sys_mtree').set({
                                        DOMAIN_ID: domainId,
                                        URI: '/' + user.companyName,
                                        NAME: user.companyName,
                                        LAYER: 0,
                                        MTREE_SOURCE: 1,
                                        DESCRIPTION: 'Box用戶审核创建',
                                        COMPANY_ID: companyId,
                                        CREATE_DATE: Utils.dateFormat(new Date().getTime(), Utils.yyyyMMddhhmmss)
                                    }).build();
                                    logger.debug('插入个人用戶Mtree资源sql:' + sqlMtree);
                                    conn.query(sqlMtree, function (err, rows) {
                                        if (err) {
                                            logger.error('插入box用戶审核Mtree资源失败：' + err);
                                            message.flag = -1;
                                            message.message = "操作失败";
                                            message.data = null;
                                            callback(new Error('操作失败', message));
                                        } else {
                                            callback(null, company, companyId, domainId, rows.insertId, user);
                                        }
                                    });
                                }
                            },
                            function (company, companyId, domainId, mtreeId, user, callback) {
                                if (company) {
                                    var sql = 'select domain_id as domainId,URI from sys_domain where URI ="/' + user.companyName + '"';
                                    logger.debug('获取对应用户公司所属顶级域信息sql:', sql);
                                    query(sql, function (error, rows) {
                                        if (error) {
                                            logger.error('获取对应用户公司所属顶级域信息错误:', error);
                                            message.flag = -1;
                                            message.message = '获取上级域信息错误';
                                            message.data = null;
                                            callback(new Error('获取上级域信息错误'), message);
                                        } else {
                                            callback(null, company, companyId, rows[0].domainId, mtreeId, user);
                                        }
                                    });
                                } else {
                                    callback(null, company, companyId, domainId, mtreeId, user);
                                }
                            },
                            function (company, companyId, domainId, mtreeId, user, callback) {
                                var sqlDomain = sqlQuery.insert().into('sys_domain').set({
                                    PRE_DOMAIN_ID: domainId,
                                    NAME: user.jobNo,
                                    URI: '/' + user.companyName + '/' + user.jobNo,
                                    CREATE_USER: 1,
                                    ADMIN_USER: user.userId,
                                    DOMAIN_CODE: uuid.v1(),
                                    COMPANY_ID: companyId,
                                    DESCRIPTION: 'box用户审核时创建',
                                    TYPE: 2,
                                    CREATE_DATE: Utils.dateFormat(new Date().getTime(), Utils.yyyyMMddhhmmss)
                                }).build();
                                logger.debug('添加box用户审核的时候初始化Domain信息sql：' + sqlDomain);
                                conn.query(sqlDomain, function (err, rows) {
                                    if (err) {
                                        logger.error('插入box用户Domain信息失败：' + err);
                                        message.flag = -1;
                                        message.message = "操作失败";
                                        message.data = null;
                                        callback(new Error('操作失败', message));
                                    } else {
                                        callback(null, company, companyId, rows.insertId, mtreeId, user);
                                    }
                                });
                            },
                            function (company, companyId, domainId, mtreeId, user, callback) {
                                var sqlDomain = sqlQuery.insert().into('sys_user_domain').set({
                                    USER_ID: user.userId,
                                    DOMAIN_ID: domainId,
                                    IS_ADMIN: 1,
                                    CREATE_USER: 1,
                                    CREATE_DATE: Utils.dateFormat(new Date().getTime(), Utils.yyyyMMddhhmmss)
                                }).build();
                                logger.debug('添加用户和Domain关联信息sql：' + sqlDomain);
                                conn.query(sqlDomain, function (err, rows) {
                                    if (err) {
                                        logger.error('添加用户和Domain关联信息错误：' + err);
                                        message.flag = -1;
                                        message.message = "操作失败";
                                        message.data = null;
                                        callback(new Error('操作失败', message));
                                    } else {
                                        callback(null, company, companyId, domainId, mtreeId, user);
                                    }
                                });
                            },
                            function (company, companyId, domainId, mtreeId, user, callback) {
                                if (company) {
                                    var sql = 'select ID ,URI from sys_mtree where URI ="/' + user.companyName + '"';
                                    logger.debug('获取对应用户公司所属顶级MTree信息sql:', sql);
                                    query(sql, function (error, rows) {
                                        if (error) {
                                            logger.error('获取对应用户公司所属顶级域信息错误:', error);
                                            message.flag = -1;
                                            message.message = '获取上级域信息错误';
                                            message.data = null;
                                            callback(new Error('获取上级域信息错误'), message);
                                        } else {
                                            callback(null, company, companyId, domainId, rows[0].ID, user);
                                        }
                                    });
                                } else {
                                    callback(null, company, companyId, domainId, mtreeId, user);
                                }
                            },

                            function (company, companyId, domainId, mtreeId, user, callback) {
                                var sqlMtree = sqlQuery.insert().into('sys_mtree').set({
                                    DOMAIN_ID: domainId,
                                    PID: mtreeId,
                                    URI: '/' + user.companyName + '/' + user.jobNo,
                                    NAME: user.jobNo,
                                    LAYER: 0,
                                    MTREE_SOURCE: 1,
                                    DESCRIPTION: 'Box用戶审核创建',
                                    COMPANY_ID: companyId,
                                    CREATE_DATE: Utils.dateFormat(new Date().getTime(), Utils.yyyyMMddhhmmss)
                                }).build();
                                logger.debug('插入个人用戶Mtree资源sql:' + sqlMtree);
                                conn.query(sqlMtree, function (err, rows) {
                                    if (err) {
                                        logger.error('插入box用戶审核Mtree资源失败：' + err);
                                        message.flag = -1;
                                        message.message = "操作失败";
                                        message.data = null;
                                        callback(new Error('操作失败', message));
                                    } else {
                                        callback(null, company, companyId, user);
                                    }
                                });
                            },
                            function (company, companyId, user, callback) {
                                var sqlCustomer = sqlQuery.update().into('sys_user').set({
                                    ENTERPRISE_ID: companyId,
                                    OPGROUP_ID: companyId,
                                    UPDATE_DATE: Utils.dateFormat(new Date().getTime(), Utils.yyyyMMddhhmmss)
                                }).where({
                                    USER_ID: user.userId
                                }).build();
                                logger.debug('更新用戶信息sql:' + sqlCustomer);
                                conn.query(sqlCustomer, function (cerr, rows) {
                                    if (cerr) {
                                        logger.error('更新个人用戶信息失败：' + cerr);
                                        message.flag = -1;
                                        message.message = "操作失败";
                                        message.data = null;
                                        callback(new Error('操作失败', message));
                                    } else {
                                        callback(null, company, companyId, user);
                                    }
                                });
                            },
                            function (company, companyId, user, callback) {
                                var sqlRole = sqlQuery.insert().into('sys_user_role').set({
                                    USER_ID: user.userId,
                                    ROLE_ID: 5
                                }).build();
                                logger.debug('插入用戶基本权限sql:' + sqlRole);
                                conn.query(sqlRole, function (error, rows) {
                                    if (error) {
                                        logger.error('插入个人开发者基础权限失败：' + error);
                                        message.flag = -1;
                                        message.message = "操作失败";
                                        message.data = null;
                                        callback(new Error('操作失败', message));
                                    } else {
                                        callback(null, company, companyId, user);
                                    }
                                });
                            },
                            function (company, companyId, user, callback) {
                                var path = './public/userfile/' + companyId;
                                if (company) {
                                    fs.mkdirSync(path + '/resources/' + user.companyName + '/' + user.jobNo);
                                    callback(null, company, user);
                                } else {
                                    fs.exists(path, function (exists) {
                                        if (exists) {
                                            fileUtils.rmdirSync(path);
                                            //创建用户资源目录
                                            fs.mkdirSync(path);
                                            fs.mkdirSync(path + '/resources');
                                            fs.mkdirSync(path + '/resources/' + user.companyName);
                                            fs.mkdirSync(path + '/resources/' + user.companyName + '/' + user.jobNo);
                                            fs.mkdirSync(path + '/model');
                                            fs.mkdirSync(path + '/model' + '/file');
                                            fs.mkdirSync(path + '/model' + '/jar');
                                        }
                                        if (!exists) {
                                            //创建用户资源目录
                                            fs.mkdirSync(path);
                                            fs.mkdirSync(path + '/resources');
                                            fs.mkdirSync(path + '/resources/' + user.companyName);
                                            fs.mkdirSync(path + '/resources/' + user.companyName + '/' + user.jobNo);
                                            fs.mkdirSync(path + '/model');
                                            fs.mkdirSync(path + '/model' + '/file');
                                            fs.mkdirSync(path + '/model' + '/jar');
                                        }
                                        company = {
                                            companyId: companyId,
                                            companyName: user.companyName
                                        }
                                        callback(null, company, user);
                                    });
                                }
                            },
                            function (company, user, callback) {
                                var sql = 'select user_id as userId,job_no as jobNo,enterprise_id as companyId from sys_user where source = 1 and mobile_phone = "' + user.phone + '"'
                                logger.debug('获取当前手机号下面的用户sql:', sql);
                                conn.query(sql, function (error, rows) {
                                    if (error) {
                                        logger.error('获取下属用户信息错误：', error);
                                        message.flag = -1;
                                        message.message = '获取下属用户信息失败';
                                        message.data = null;
                                        callback(new Error('获取下属用户信息错误'), message);
                                    } else {
                                        if (rows.length < 1) {
                                            message.flag = 0;
                                            message.message = 'OK';
                                            message.data = null;
                                            callback(new Error('当前手机号没有对应的下属用户'), message);
                                        } else {
                                            callback(null, rows, company, user);
                                        }
                                    }
                                });
                            },
                            function (rs, company, user, callback) {
                                var sql = 'select DOMAIN_ID as domainId,name,URI,company_ID as companyId from sys_domain where URI = "/' + company.companyName + '/' + user.jobNo + '"';
                                logger.debug('获取公司所属域信息sql:', sql);
                                conn.query(sql, function (error, rows) {
                                    if (error) {
                                        logger.error('获取域信息错误：', error);
                                        message.flag = -1;
                                        message.message = '获取域信息失败';
                                        message.data = null;
                                        callback(new Error('获取域信息错误'), message);
                                    } else {
                                        if (rows.length != 1) {
                                            message.flag = -1;
                                            message.message = '域不存在';
                                            message.data = null;
                                            callback(new Error('域不存在'), message);
                                        } else {
                                            callback(null, rows[0], rs, company, user);
                                        }
                                    }
                                });
                            },
                            function (domain, rs, company, user, callback) {
                                var sql = 'select ID as ID,name,URI from sys_mtree where URI = "/' + company.companyName + '/' + user.jobNo + '"';
                                logger.debug('获取当前用户所属MTree信息sql:', sql);
                                conn.query(sql, function (error, rows) {
                                    if (error) {
                                        logger.error('获取当前用户所属MTree错误：', error);
                                        message.flag = -1;
                                        message.message = '获取当前用户所属MTree失败';
                                        message.data = null;
                                        callback(new Error('获取MTree信息错误'), message);
                                    } else {
                                        if (rows.length != 1) {
                                            message.flag = -1;
                                            message.message = 'MTree不存在';
                                            message.data = null;
                                            callback(new Error('MTree不存在'), message);
                                        } else {
                                            callback(null, rows[0], domain, rs, company, user);
                                        }
                                    }
                                });
                            },
                            function (mtree, domain, rs, company, user, callback) {
                                var date = Utils.dateFormat(new Date().getTime(), Utils.yyyyMMddhhmmss);
                                async.eachSeries(rs, function (rr, callbackSeries) {
                                    async.waterfall(
                                        [
                                            function (callbackWater) {
                                                var sql = sqlQuery.update().into('sys_user').set({
                                                    ENTERPRISE_ID: domain.companyId,
                                                    update_date: date
                                                }).where({
                                                    user_ID: rr.userId
                                                }).build();
                                                logger.debug('更新对应的用户顶级域sql:', sql);
                                                conn.query(sql, function (error, rows) {
                                                    if (error) {
                                                        logger.error('更新对应的用户顶级域错误：', error);
                                                        message.flag = -1;
                                                        message.message = '更新顶级域错误';
                                                        message.data = null;
                                                        callbackWater(new Error('更新顶级域错误'), message);
                                                    } else {
                                                        callbackWater(null);
                                                    }
                                                });
                                            },
                                            function (callbackWater) {
                                                var sql = sqlQuery.update().into('sys_domain').set({
                                                    pre_domain_Id: domain.domainId,
                                                    URI: '/' + user.companyName + '/' + user.jobNo + '/' + rr.jobNo,
                                                    COMPANY_ID: domain.companyId,
                                                    TYPE: 2,
                                                    update_date: date
                                                }).where({
                                                    URI: '/' + rr.jobNo
                                                }).build();
                                                logger.debug('更新对应的用户顶级域sql:', sql);
                                                conn.query(sql, function (error, rows) {
                                                    if (error) {
                                                        logger.error('更新对应的用户顶级域错误：', error);
                                                        message.flag = -1;
                                                        message.message = '更新顶级域错误';
                                                        message.data = null;
                                                        callbackWater(new Error('更新顶级域错误'), message);
                                                    } else {
                                                        callbackWater(null);
                                                    }
                                                });
                                            },
                                            function (callbackWater) {
                                                var sql = sqlQuery.update().into('sys_mtree').set({
                                                    PID: mtree.ID,
                                                    URI: '/' + user.companyName + '/' + user.jobNo + '/' + rr.jobNo,
                                                    COMPANY_ID: domain.companyId,
                                                    update_date: date
                                                }).where({
                                                    URI: '/' + rr.jobNo
                                                }).build();
                                                logger.debug('更新对应的用户顶级MTree sql:', sql);
                                                conn.query(sql, function (error, rows) {
                                                    if (error) {
                                                        logger.error('更新对应的用户顶级MTree错误：', error);
                                                        message.flag = -1;
                                                        message.message = '更新顶级MTree错误';
                                                        message.data = null;
                                                        callbackWater(new Error('更新顶级MTree 错误'), message);
                                                    } else {
                                                        callbackWater(null);
                                                    }
                                                });
                                            },
                                            function (callbackWater) {
                                                var sql = 'update sys_domain set URI ="/' + user.companyName + '/' + user.jobNo + '"+URI,company_id = ' + domain.companyId +
                                                    ',update_date="' + date + '" where URI like "/' + rr.jobNo + '/%"';
                                                logger.debug('更新对应的下属域信息sql:', sql);
                                                conn.query(sql, function (error, rows) {
                                                    if (error) {
                                                        logger.error('更新对应的下属域错误：', error);
                                                        message.flag = -1;
                                                        message.message = '更新对应的下属域错误';
                                                        message.data = null;
                                                        callbackWater(new Error('更新对应的下属域错误'), message);
                                                    } else {
                                                        callbackWater(null);
                                                    }
                                                });
                                            },
                                            function (callbackWater) {
                                                var sql = 'update sys_mtree set URI ="/' + user.companyName + '/' + user.jobNo + '"+URI,company_id = ' + domain.companyId +
                                                    ',update_date="' + date + '" where URI like "/' + rr.jobNo + '/%"';
                                                logger.debug('更新对应的下属MTree信息sql:', sql);
                                                conn.query(sql, function (error, rows) {
                                                    if (error) {
                                                        logger.error('更新对应的下属MTree错误：', error);
                                                        message.flag = -1;
                                                        message.message = '更新对应的下属MTree错误';
                                                        message.data = null;
                                                        callbackWater(new Error('更新对应的下属MTree错误'), message);
                                                    } else {
                                                        callbackWater(null);
                                                    }
                                                });
                                            },
                                            function (callbackWater) {
                                                var sql = 'SELECT point.POINT_ID,point.UUID,point.POINT_NAME,point.URI from sys_point point where URI like "/' + rr.jobNo + '/%"';
                                                logger.debug('获取节点下面的测信息sql：' + sql);
                                                conn.query(sql, function (err, rows) {
                                                    if (err) {
                                                        logger.error('获取节点下面测点信息错误：' + err);
                                                        message.flag = -1;
                                                        message.data = null;
                                                        message.message = '获取节点信息失败';
                                                        callbackWater(err, message);
                                                    } else {
                                                        callbackWater(null, rows);
                                                    }
                                                });
                                            },
                                            function (rows, callbackWater) {
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
                                                        var pointURI = '/' + user.companyName + '/' + user.jobNo + '/' + row.POINT_NAME;
                                                        var UUID = opPool.makeUUID(pointURI);
                                                        rr.push(UUID);
                                                        UUID = '0x' + UUID;
                                                        rr.push(UUID);
                                                        rrs.push(rr);
                                                        sqlPointsUUID += 'when ' + row.POINT_ID + ' then "' + UUID + '" ';
                                                        sqlPointURI += 'when ' + row.POINT_ID + ' then "' + pointURI + '" ';
                                                        sqlPointIds.push(row.POINT_ID);
                                                    }
                                                    sqlPoints = 'update sys_point set UUID = case POINT_ID ' + sqlPointsUUID + ' end,URI= case POINT_ID ' + sqlPointURI + ' end ,DOMAIN_ID = ' + domain.domainId + ' where point_ID in( ' + sqlPointIds.toString() + ')';
                                                    opPool.update('Point', rrs, cols, function (error, rows, columns) {
                                                        if ((error != 0 && error && error.code) || rows[0].EC != 0) {
                                                            logger.error('编辑测点信息错误：' + JSON.stringify(error));
                                                            message.flag = -1;
                                                            message.message = '更新测点信息失败';
                                                            message.data = null;
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
                                                            message.flag = -1;
                                                            message.data = null;
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
                                                var sourceURI = path + rr.companyId + '/resources';
                                                var targetURI = path + domain.companyId + '/resources/' + user.companyName + '/' + user.jobNo;
                                                fileUtils.copyFileSync(sourceURI, targetURI);
                                                fileUtils.copyFileSync(path + rr.userId + '/model', path + domain.companyId + '/model');
                                                fileUtils.rmdirSync(path + rr.companyId);
                                                message.flag = 0;
                                                message.message = 'OK';
                                                message.data = null;
                                                callbackWater(null, message);
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
                                        message.flag = -1;
                                        message.message = '操作失败';
                                        message.data = null;
                                    } else {
                                        message.flag = 0;
                                        message.message = 'OK';
                                        message.data = null;
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
        },
        /**
         * 升级
         * @param req
         * @param res
         */
        upgrade: function (req, res) {
            var userId = req.body.userId;
            if (!userId) {
                message.flag = -1;
                message.message = '用户为空';
                message.data = null;
                res.json(message);
                return;
            }
            var enterName = req.body.enterName;
            if (!enterName) {
                message.flag = -1;
                message.message = '企业名称不能为空';
                message.data = null;
                res.json(message);
                return;
            }
            async.waterfall(
                [
                    function (callback) {
                        var sql = 'SELECT count(USER_ID) as count from sys_user where SOURCE =2 and MOBILE_PHONE in (SELECT MOBILE_PHONE from sys_user where USER_ID = ' + userId + ' )';
                        logger.debug('获取手机号是否有管理员存在sql:', sql);
                        query(sql, function (error, rows) {
                            if (error) {
                                logger.error('获取手机号是否有管理员存在错误:', error);
                                message.flag = -1;
                                message.message = '获取手机号是否有管理员存在错误';
                                message.data = null;
                                callback(new Error('获取手机号是否有管理员存在错误'), message);
                            } else {
                                if (rows[0].count > 0) {
                                    message.flag = -1;
                                    message.message = '该用户手机号下已存在企业用户';
                                    message.data = null;
                                    callback(new Error('该用户手机号下已存在企业用户'), message);
                                } else {
                                    callback(null);
                                }
                            }
                        });
                    },
                    function (callback) {
                        var sql = sqlQuery.update().into('sys_user').set({
                            SOURCE: 2,
                            IS_ACTIVE: 0,
                            REVIEW: '未审核',
                            ENTERPRISE_NAME: enterName,
                            update_date: moment(new Date()).format('YYYY-MM-DD HH:mm:ss')
                        }).where({user_id: userId, source: 1}).build();
                        logger.debug('用户升级sql:', sql);
                        query(sql, function (error, rows) {
                            if (error) {
                                logger.error('用户升级错误:', error);
                                message.flag = -1;
                                message.message = '用户升级出错';
                                message.data = null;
                                callback(new Error('用户升级出错'), message);
                            } else {
                                message.flag = 0;
                                message.message = 'OK';
                                message.data = null;
                                callback(null, message);
                            }
                        });
                    }
                ], function (error, messsage) {
                    res.json(message);
                }
            )

        },
        /**
         * 修改密码
         * @param req
         * @param res
         */
        modifyPassword: function (req, res) {
            var userId = req.body.userId;
            var password = req.body.password;
            var phone = req.body.phone;
            var newPassword = req.body.newPassword;
            var smsCode = req.body.smsCode;
            var UUID = req.body.UUID;
            var obj = SMS.getSms(UUID);
            var smsOnlineCode = obj.smsCode;
            var onlinePhone = obj.phone;
            if (smsOnlineCode != smsCode || onlinePhone != phone) {
                message.flag = -1;
                message.message = '手机号和验证码不匹配';
                message.data = null;
                res.json(message);
                return;
            }
            if (!userId) {
                message.flag = -1;
                message.message = '用户名为空';
                message.data = null;
                res.json(message);
                return;
            }
            if (!password || !newPassword) {
                message.flag = -1;
                message.message = '原密码和新密码都不能为空';
                message.data = null;
                res.json(message);
                return;
            }
            async.waterfall(
                [
                    function (callback) {
                        var sql = sqlQuery.select().from('sys_user').select(['user_id']).where({user_id: userId, password: md5(password)}).build();
                        logger.debug('获取当前用户ID和密码是否有满足条件的信息sql:' + sql);
                        query(sql, function (error, rows) {
                            if (error) {
                                logger.error('获取用户信息错误：' + error);
                                message.flag = -1;
                                message.message = '验证用户信息出错';
                                message.data = null;
                                callback(error, message);
                            }
                            if (rows.length < 1) {
                                message.flag = -1;
                                message.message = '用户名和密码不对应';
                                message.data = null;
                                callback(new Error('用户名和密码不对应'), message);
                            } else {
                                callback(null);
                            }
                        });
                    },
                    function (callback) {
                        var sql = sqlQuery.update().into('sys_user').set({
                            password: md5(newPassword),
                            UPDATE_DATE: Utils.dateFormat(new Date().getTime(), Utils.yyyyMMddhhmmss)
                        }).where({
                            user_id: userId
                        }).build();
                        logger.debug('更新用户密码sql：' + sql);
                        query(sql, function (error, rows) {
                            if (error) {
                                message.flag = -1;
                                message.message = '更新密码错误';
                                message.data = null;
                                callback(error, message);
                            } else {
                                SMS.deleteSms(UUID);
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
            );
        },
        /**
         * 忘记密码
         * @param req
         * @param res
         */
        forgetPassword: function (req, res) {
            var userName = req.body.userName;
            var phone = req.body.phone;
            var smsCode = req.body.smsCode;
            var password = req.body.password;
            var UUID = req.body.UUID;
            var obj = SMS.getSms(UUID);
            var smsOnlineCode = obj.smsCode;
            var onlinePhone = obj.phone;
            if (smsOnlineCode != smsCode || onlinePhone != phone) {
                message.flag = -1;
                message.message = '手机号和验证码不匹配';
                message.data = null;
                res.json(message);
                return;
            }
            async.waterfall(
                [
                    function (callback) {
                        var sql = sqlQuery.select().from('sys_user').select(['user_id']).where({JOB_NO: userName, mobile_phone: phone}).build();
                        logger.debug('获取当前用户登录名和密码是否有满足条件的信息sql:' + sql);
                        query(sql, function (error, rows) {
                            if (error) {
                                logger.error('获取用户信息错误：' + error);
                                message.flag = -1;
                                message.message = '验证用户信息出错';
                                message.data = null;
                                callback(error, message);
                            }
                            if (rows.length < 1) {
                                message.flag = -1;
                                message.message = '用户登录名和密码不对应';
                                message.data = null;
                                callback(new Error('用户登录名和密码不对应'), message);
                            }
                            callback(null);
                        })
                    },
                    function (callback) {
                        var sql = sqlQuery.update().into('sys_user').set({
                            password: md5(password),
                            UPDATE_DATE: Utils.dateFormat(new Date().getTime(), Utils.yyyyMMddhhmmss)
                        }).where({
                            JOB_NO: userName,
                            mobile_phone: phone
                        }).build();
                        logger.debug('更新用户密码sql：' + sql);
                        query(sql, function (error, rows) {
                            if (error) {
                                message.flag = -1;
                                message.message = '更新密码错误';
                                message.data = null;
                                callback(error, message);
                            }
                            SMS.deleteSms(UUID);
                            message.flag = 0;
                            message.message = 'OK';
                            message.data = null;
                            callback(null, message);
                        });
                    }
                ],
                function (error, message) {
                    res.json(message);
                }
            );
        },
        /**
         * 模糊查询用户信息
         * @param req
         * @param res
         */
        blurryUser: function (req, res) {
            var userName = req.body.userName || req.query.userName;
            var sql = 'select user_id as userId,user_name as userName from sys_user where user_name like "%' + userName + '%"';
            logger.debug('模糊查询用户信息sql:' + sql);
            query(sql, function (error, rows) {
                if (error) {
                    logger.error('模糊查询用户信息错误：' + error);
                    message.flag = -1;
                    message.message = '查询出错';
                    message.data = null;
                    res.json(message);
                } else {
                    message.flag = 0;
                    message.message = 'OK';
                    message.data = rows;
                    res.json(message);
                }
            });
        },
        /**
         * 获取用户信息
         * @param req
         * @param res
         */
        getUserInfo: function (req, res) {
            var userId = req.body.userId || req.query.userId;
            if (!userId) {
                message.flag = -1;
                message.message = '用户名为空';
                message.data = null;
                res.json(message);
                return;
            }
            var sql = 'SELECT USER_ID AS userid,JOB_NO AS jobNo,GENDER AS gender,USER_NAME AS userName,mobile_phone AS registerPhone,PHONE_MOBILE as phoneMobile,DESCRIPTION AS descritpion FROM sys_user WHERE user_id = ' + userId;
            logger.debug('查询用户信息sql:' + sql);
            query(sql, function (error, rows) {
                if (error) {
                    logger.error('查询用户信息错误：' + error);
                    message.flag = -1;
                    message.message = '查询用户信息出错';
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
        /**
         * 更新用户信息
         * @param req
         * @param res
         */
        updateUserInfo: function (req, res) {
            var userId = req.body.userId;
            if (!userId) {
                message.flag = -1;
                message.message = '用户名为空';
                message.data = null;
                res.json(message);
                return;
            }
            var obj = {};
            var userName = req.body.userName;
            if (userName) {
                obj.user_name = userName;
            }
            var phoneMobile = req.body.phoneMobile;
            if (phoneMobile) {
                obj.PHONE_MOBILE = phoneMobile;
            }
            var desc = req.body.desc;
            if (userName) {
                obj.DESCRIPTION = desc;
            }
            var gender = req.body.gender;
            if (gender) {
                obj.gender = gender;
            }
            var email = req.body.email;
            if (email) {
                obj.email = email;
            }
            var sql = sqlQuery.update().into('sys_user').set(obj).where({user_id: userId}).build();
            logger.debug('更新用户信息sql:' + sql);
            query(sql, function (error, rows) {
                if (error) {
                    logger.error('更新用户错误：' + error);
                    message.flag = -1;
                    message.message = '更新用户出错';
                    message.data = null;
                    res.json(message);
                } else {
                    message.flag = 0;
                    message.message = 'OK';
                    message.data = null;
                    res.json(message);
                }
            });
        },
        /**
         * 获取登录日志的接口
         * @param req
         * @param res
         */
        getUserLoginLog: function (req, res) {
            var userId = req.body.userId || req.query.userId;
            if (!userId) {
                message.flag = -1;
                message.message = '用户为空';
                message.data = null;
                res.json(message);
                return;
            }
            var sql = 'select user_id as userId,user_name as userName,device_name as deviceName,time as time,descs as "desc",ip from sys_login_log where user_id = ' + userId + ' limit 0,20';
            logger.debug('模糊查询用户登录信息sql:' + sql);
            query(sql, function (error, rows) {
                if (error) {
                    logger.error('模糊查询用户登录错误：' + error);
                    message.flag = -1;
                    message.message = '模糊查询用户登录出错';
                    message.data = null;
                    res.json(message);
                } else {
                    message.flag = 0;
                    message.message = 'OK';
                    message.data = rows;
                    res.json(message);
                }
            });
        },
        /**
         * 验证手机号和密码是否匹配
         * @param req
         * @param res
         */
        verificationSmsCode: function (req, res) {
            var userId = req.body.userId;
            if (!userId) {
                message.flag = -1;
                message.message = '用户名为空';
                message.data = null;
                res.json(message);
                return;
            }
            var phone = req.body.phone;
            var smsCode = req.body.smsCode;
            var UUID = req.body.UUID;
            var obj = SMS.getSms(UUID);
            if (!obj) {
                message.flag = -1;
                message.message = '验证码为空';
                message.data = null;
                res.json(message);
                return;
            }
            var smsOnlineCode = obj.smsCode;
            var onlinePhone = obj.phone;
            if (smsOnlineCode != smsCode || onlinePhone != phone) {
                message.flag = -1;
                message.message = '验证码不正确';
                message.data = null;
                res.json(message);
                return;
            }
            SMS.deleteSms(UUID);
            var sql = 'select user_id as userId,source from sys_user where user_id = ' + userId + ' and mobile_phone ="' + phone + '"';
            logger.debug('验证用户和手机号是否对应信息sql:' + sql);
            query(sql, function (error, rows) {
                if (error) {
                    logger.error('验证用户和手机号是否对应错误：' + error);
                    message.flag = -1;
                    message.message = '验证用户和手机号是否对应出错';
                    message.data = null;
                    res.json(message);
                } else {
                    if (rows.length != 1) {
                        message.flag = -1;
                        message.message = '没有对应的用户';
                        message.data = null;
                    } else {
                        if (rows[0].source != 2) {
                            message.flag = -1;
                            message.message = '非企业用户不能变更手机号';
                            message.data = null;
                        } else {
                            message.flag = 0;
                            message.message = 'OK';
                            message.data = null;
                        }
                    }
                    res.json(message);
                }
            });
        },
        /**
         * 变更手机号
         * @param req
         * @param res
         */
        changeMobilePhone: function (req, res) {
            var userId = req.body.userId;
            if (!userId) {
                message.flag = -1;
                message.message = '用户名为空';
                message.data = null;
                res.json(message);
                return;
            }
            var phone = req.body.phone;
            var smsCode = req.body.smsCode;
            var UUID = req.body.UUID;
            var obj = SMS.getSms(UUID);
            if (!obj) {
                message.flag = -1;
                message.message = '验证码为空';
                message.data = null;
                res.json(message);
                return;
            }
            var smsOnlineCode = obj.smsCode;
            var onlinePhone = obj.phone;
            if (smsOnlineCode != smsCode || onlinePhone != phone) {
                message.flag = -1;
                message.message = '验证码不正确';
                message.data = null;
                res.json(message);
                return;
            }
            SMS.deleteSms(UUID);
            async.waterfall(
                [
                    function (callback) {
                        var sql = 'select user_id as userId,source from sys_user where user_id = ' + userId;
                        logger.debug('验证用户和手机号是否对应信息sql:' + sql);
                        query(sql, function (error, rows) {
                            if (error) {
                                logger.error('验证用户和手机号是否对应错误：' + error);
                                message.flag = -1;
                                message.message = '验证用户和手机号是否对应出错';
                                message.data = null;
                                callback(new Error('验证用户和手机号是否对应出错'), message);
                            } else {
                                if (rows.length != 1) {
                                    message.flag = -1;
                                    message.message = '没有对应的用户';
                                    message.data = null;
                                    callback(new Error('没有对应的用户'), message);
                                } else {
                                    if (rows[0].source != 2) {
                                        message.flag = -1;
                                        message.message = '非企业用户不能变更手机号';
                                        message.data = null;
                                        callback(new Error('非企业用户不能变更手机号'), message);
                                    } else {
                                        callback(null);
                                    }
                                }
                            }
                        });
                    },
                    function (callback) {
                        var sql = 'SELECT count(USER_ID) as count from sys_user where MOBILE_PHONE ="' + phone + '"';
                        logger.debug('获取手机号是否存在sql:', sql);
                        query(sql, function (error, rows) {
                            if (error) {
                                logger.error('获取手机号是否存在错误:', error);
                                message.flag = -1;
                                message.message = '获取手机号是否存在错误';
                                message.data = null;
                                callback(new Error('获取手机号是否存在错误'), message);
                            } else {
                                if (rows[0].count > 0) {
                                    message.flag = -1;
                                    message.message = '该手机号已存在';
                                    message.data = null;
                                    callback(new Error('该手机号已存在'), message);
                                } else {
                                    callback(null);
                                }
                            }
                        });
                    },
                    function (callback) {
                        var sql = sqlQuery.update().into('sys_user').set({
                            mobile_phone: phone,
                            update_date: moment(new Date()).format('YYYY-MM-DD HH:mm:ss')
                        }).where({mobile_phone: phone}).build();
                        logger.debug('变更手机号信息sql:' + sql);
                        query(sql, function (error, rows) {
                            if (error) {
                                logger.error('变更手机号信息错误：' + error);
                                message.flag = -1;
                                message.message = '变更手机号信息出错';
                                message.data = null;
                                callback(new Error('变更手机号出错'), message);
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
        /**
         * 用户进入云页面
         * @param req
         * @param res
         */
        loginCloud: function (req, res) {
            var host = req.connection.remoteAddress.substring(7);
            var userName = req.body.userName;
            var userId = req.body.userId;
            if (userName != undefined && typeof(userName) == "string" && userName != "") {
                var sql = 'select USER_ID as userid ,JOB_NO as jobNo,GENDER as gender,USER_NAME as userName, mobile_phone as registerPhone,ENTERPRISE_ID as enterpriseId, ICON, DESCRIPTION as descritpion, source,IS_SYSTEM, IS_UNVILIABLE,IS_ACTIVE,REVIEW,IS_ONLINE ,HOST,CREATE_DATE as createTime,UPDATE_DATE as lastUpdateTime ';
                sql += 'from sys_user where  JOB_NO="' + userName + '" and user_id = ' + userId;
                logger.debug('用戶登录sql:' + sql);
                async.waterfall([
                    function (callback) {
                        query(sql, function (err, rows) {
                            if (rows && rows.length == 1) {
                                var user = rows[0];
                                callback(null, user);
                            } else {
                                callback(null, null);
                            }
                        });
                    },
                    function (user, callback) {
                        if (user != null) {
                            if (user.IS_UNVILIABLE == 1) {
                                message.flag = -1;
                                message.message = '账号已被禁用';
                                message.data = null;
                                callback(null, message);
                            } else {
                                var time = moment(new Date()).format('YYYY-MM-DD HH:mm:ss');
                                var sql = 'update sys_user set IS_ONLINE = 1,HOST = "' + host + '",UPDATE_DATE="' + time + '" where IS_ACTIVE != 2 and JOB_NO ="' + userName + '"';
                                logger.debug('更新用户登录信息sql:' + sql);
                                query(sql, function (err, rows, columns) {
                                    var obj = {
                                        user_id: user.userid,
                                        user_name: userName,
                                        time: time,
                                        ip: host,
                                        device_name: req.body.deviceName,
                                        descs: 'APP和网站接口接口'
                                    };
                                    var sql = sqlQuery.insert().into('sys_login_log').set(obj).build();
                                    query(sql, function (error, rows) {
                                    });
                                    if (err) {
                                        logger.error('更新用户登录信息错误:' + err);
                                        message.flag = -1;
                                        message.message = '账户或密码错误';
                                        message.data = null;
                                    } else {
                                        message.flag = 0;
                                        message.message = 'OK';
                                        message.data = user;
                                        user.USER_ID = user.userId;
                                        GlobalAgent.refreshUserDomain(user);
                                        callback(null, message);
                                    }
                                });
                            }
                        } else {
                            message.flag = -1;
                            message.message = '账户或密码错误';
                            message.data = null;
                            callback(null, message);
                        }
                    }
                ], function (err, message) {
                    if (err) {
                        res.json(message);
                    } else {
                        return res.redirect('/system/manage');
                    }
                });
            } else {
                message.flag = -1;
                message.message = '用户名为空';
                message.data = null;
                res.json(message);
            }
        }
    }
;
module.exports = boxUser;
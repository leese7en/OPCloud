var fs = require('fs');
var actionUtil = require("../framework/action/actionUtils")();
var transaction = actionUtil.transaction;
var async = require("async");
var md5 = require('md5');
var query = actionUtil.query;
var logger = require('log4js').getLogger('system');
var Utils = require('../utils/tools/utils');
var configConst = require('../utils/tools/configConst');
var fileUtils = require("../utils/tools/fileUtils");
var uuid = require('node-uuid');
var sql = require('sql-query'),
    sqlQuery = sql.Query();
var message = {
    flag: 0,
    message: '成功',
    data: null
};
var customer = {
    /**
     * 注册企业用户信息
     * @param req
     * @param res
     */
    addPublicCustomer: function (req, res) {
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
        var companyName = req.body.companyName;
        if (companyName == '0') {
            logger.debug('企业名称没有输入');
            message.flag = -1;
            message.message = '企业名称不能为空';
            res.json(message);
            return;
        }
        var smsCode = req.body.smsCode;
        var sessionInfo = req.session[mobilePhone];
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
        if (sessionInfo.phone != mobilePhone || sessionInfo.smsCode != smsCode) {
            logger.error('输入验证码和session验证码不对应');
            message.flag = -1;
            message.message = "验证码不正确";
            res.json(message);
            return;
        }
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
                            var sql = 'select CREATE_DATE,count(USER_ID) AS count from sys_user where JOB_NO = "' + jobNo + '"';
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
                            var sql = 'select CREATE_DATE,count(EMAIL) AS count from sys_user where EMAIL = "' + email + '" ';
                            logger.debug('验证邮箱是否被注册过:' + sql);
                            conn.query(sql, function (err, rows, columns) {
                                if (err) {
                                    logger.error('验证邮箱是否被注册过失败：' + err);
                                    message.flag = -1;
                                    message.message = '邮箱验证失败';
                                    message.data = null;
                                    res.json(message);
                                    return;
                                }
                                if (rows[0].count > 0) {
                                    message.flag = -1;
                                    message.data = null;
                                    message.message = '邮箱已经被注册过，请更换邮箱账号';
                                    res.json(message);
                                    return;
                                } else {
                                    callback(null);
                                }
                            });
                        },
                        function (callback) {
                            var sql = 'select CREATE_DATE,count(MOBILE_PHONE) AS count from sys_user where MOBILE_PHONE = "' + mobilePhone + '" and IS_SYSTEM = 2';
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
                                    message.message = '手机号已经被注册过，请更换手机号码';
                                    res.json(message);
                                    return;
                                } else {
                                    callback(null);
                                }
                            });
                        },
                        function (callback) {
                            var sqlCustomer = sqlQuery.insert().into('sys_user').set({
                                USER_NAME: jobNo,
                                JOB_NO: jobNo,
                                password: md5(password),
                                IS_SYSTEM: 2, //企业用户管理员为2
                                EMAIL: email,
                                MOBILE_PHONE: mobilePhone,
                                PHONE_MOBILE: mobilePhone,
                                DESCRIPTION: '企业管理员',
                                ENTERPRISE_NAME: companyName,
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
                                    var row = {
                                        USER_ID: rows.insertId,
                                        jobNo: jobNo,
                                        USER_NAME: jobNo,
                                        phone: mobilePhone,
                                        ENTERPRISE_NAME: companyName
                                    }
                                    callback(null, row);
                                }
                            });
                        },
                        function (row, callback) {
                            var sqlDomain = sqlQuery.insert().into('sys_domain').set({
                                PRE_DOMAIN_ID: 1,
                                NAME: row.ENTERPRISE_NAME,
                                URI: '/' + row.ENTERPRISE_NAME,
                                CREATE_USER: 1,
                                ADMIN_USER: row.USER_ID,
                                COMPANY_ID: row.USER_ID,
                                DOMAIN_CODE: uuid.v1(),
                                DESCRIPTION: '用户注册时创建',
                                CREATE_DATE: Utils.dateFormat(new Date().getTime(), Utils.yyyyMMddhhmmss)
                            }).build();
                            logger.debug('添加公有用户的时候初始化Domain信息sql：' + sqlDomain);
                            conn.query(sqlDomain, function (err, rows) {
                                if (err) {
                                    logger.error('插入公有用户Domain信息失败：' + err);
                                    message.flag = -1;
                                    message.message = "操作失败";
                                    message.data = null;
                                    res.json(message);
                                    return;
                                } else {
                                    callback(null, rows.insertId, row);
                                }
                            });
                        },
                        function (domainId, row, callback) {
                            var sqlDomain = sqlQuery.insert().into('sys_user_domain').set({
                                USER_ID: row.USER_ID,
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
                                    res.json(message);
                                    return;
                                } else {
                                    callback(null, domainId, row);
                                }
                            });
                        },
                        function (domainId, row, callback) {
                            var sqlCompany = sqlQuery.insert().into('sys_enterprise').set({
                                DOMAIN_ID: domainId,
                                ENTERPRISE_NAME: row.ENTERPRISE_NAME,
                                TYPE: 1,
                                DESCRIPTION: '企业注册',
                                LINK_MAN: row.USER_NAME,
                                PHONE: row.phone,
                                CREATE_DATE: Utils.dateFormat(new Date().getTime(), Utils.yyyyMMddhhmmss)
                            }).build();
                            logger.debug('添加公有用户的时候初始化企业基本信息sql：' + sqlCompany);
                            conn.query(sqlCompany, function (err, rows) {
                                if (err) {
                                    logger.error('插入私有用戶企业信息失败：' + err);
                                    message.flag = -1;
                                    message.message = "操作失败";
                                    message.data = null;
                                    res.json(message);
                                    return;
                                } else {
                                    callback(null, domainId, rows.insertId, row);
                                }
                            });
                        },
                        function (domainId, companyId, row, callback) {
                            var sqlCustomer = sqlQuery.update().into('sys_user').set({
                                ENTERPRISE_ID: companyId,
                                OPGROUP_ID: companyId,
                                UPDATE_DATE: Utils.dateFormat(new Date().getTime(), Utils.yyyyMMddhhmmss)
                            }).where({
                                USER_ID: row.USER_ID
                            }).build();
                            logger.debug('更新用戶信息sql:' + sqlCustomer);
                            conn.query(sqlCustomer, function (cerr, rows) {
                                if (cerr) {
                                    logger.error('插入公有用戶信息失败：' + cerr);
                                    message.flag = -1;
                                    message.message = "操作失败";
                                    message.data = null;
                                    res.json(message);
                                    return;
                                } else {
                                    callback(null, domainId, companyId, row);
                                }
                            });
                        },
                        function (domainId, companyId, row, callback) {
                            var sqlRole = sqlQuery.insert().into('sys_user_role').set({
                                USER_ID: row.USER_ID,
                                ROLE_ID: 3
                            }).build();
                            logger.debug('插入用戶基本权限sql:' + sqlRole);
                            conn.query(sqlRole, function (ccerr, rows) {
                                if (ccerr) {
                                    logger.error('插入公有用戶基础权限失败：' + ccerr);
                                    message.flag = -1;
                                    message.message = "操作失败";
                                    res.json(message);
                                    return;
                                } else {
                                    callback(null, domainId, companyId, row);
                                }
                            });
                        },
                        function (domainId, companyId, row, callback) {
                            var sqlMtree = sqlQuery.insert().into('sys_mtree').set({
                                URI: '/' + row.ENTERPRISE_NAME,
                                NAME: row.ENTERPRISE_NAME,
                                DOMAIN_ID: domainId,
                                LAYER: 0,
                                MTREE_SOURCE: 1,
                                DESCRIPTION: '添加公有用戶创建',
                                COMPANY_ID: companyId,
                                CREATE_DATE: Utils.dateFormat(new Date().getTime(), Utils.yyyyMMddhhmmss)
                            }).build();
                            logger.debug('插入公有用戶Mtree资源sql:' + sqlMtree);
                            conn.query(sqlMtree, function (cccerr, rows) {
                                if (cccerr) {
                                    logger.error('插入公有用戶Mtree资源失败：' + cccerr);
                                    message.flag = -1;
                                    message.message = "操作失败";
                                    res.json(message);
                                    return;
                                } else {
                                    callback(null, domainId, companyId, row.ENTERPRISE_NAME);
                                }
                            });
                        },
                        function (domainId, companyId, companyName, callback) {
                            var sql = sqlQuery.update().into('sys_domain').set({
                                COMPANY_ID: companyId
                            }).where({
                                DOMAIN_ID: domainId
                            }).build();
                            logger.debug('更新域企业ID字段sql:' + sql);
                            conn.query(sql, function (err, rows) {
                                if (err) {
                                    logger.error('更新域企业ID字段错误：' + err);
                                    message.flag = -1;
                                    message.message = "操作失败";
                                    res.json(message);
                                    return;
                                } else {
                                    callback(null, companyId, companyName);
                                }
                            });
                        },
                        function (companyId, companyName, callback) {
                            message.flag = 0;
                            message.message = "OK";
                            message.data = null;
                            //创建对应的文件夹
                            var path = './public/userfile/' + companyId;
                            fs.exists(path, function (exists) {
                                if (exists) {
                                    fileUtils.rmdirSync(path);
                                    //创建用户资源目录
                                    fs.mkdirSync(path);
                                    fs.mkdirSync(path + '/resources');
                                    fs.mkdirSync(path + '/resources/' + companyName);
                                    fs.mkdirSync(path + '/model');
                                    fs.mkdirSync(path + '/model' + '/file');
                                    fs.mkdirSync(path + '/model' + '/jar');
                                    res.json(message);
                                }
                                if (!exists) {
                                    //创建用户资源目录
                                    fs.mkdirSync(path);
                                    fs.mkdirSync(path + '/resources');
                                    fs.mkdirSync(path + '/resources/' + companyName);
                                    fs.mkdirSync(path + '/model');
                                    fs.mkdirSync(path + '/model' + '/file');
                                    fs.mkdirSync(path + '/model' + '/jar');
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


    /**
     * 注册个人用户信息
     * @param req
     * @param res
     */
    addCustomerIndividual: function (req, res) {
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
        var smsCode = req.body.smsCode;
        var sessionInfo = req.session[mobilePhone];
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
        if (sessionInfo.phone != mobilePhone || sessionInfo.smsCode != smsCode) {
            logger.error('输入验证码和session验证码不对应');
            message.flag = -1;
            message.message = "验证码不正确";
            res.json(message);
            return;
        }
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
                            var sql = 'select CREATE_DATE,count(USER_ID) AS count from sys_user where JOB_NO = "' + jobNo + '"';
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
                            var sql = 'select CREATE_DATE,count(EMAIL) AS count from sys_user where EMAIL = "' + email + '"';
                            logger.debug('验证邮箱是否被注册过:' + sql);
                            conn.query(sql, function (err, rows, columns) {
                                if (err) {
                                    logger.error('验证邮箱是否被注册过失败：' + err);
                                    message.flag = -1;
                                    message.message = '邮箱验证失败';
                                    message.data = null;
                                    res.json(message);
                                    return;
                                }
                                if (rows[0].count > 0) {
                                    message.flag = -1;
                                    message.data = null;
                                    message.message = '邮箱已经被注册过，请更换邮箱账号';
                                    res.json(message);
                                    return;
                                } else {
                                    callback(null);
                                }
                            });
                        },
                        function (callback) {
                            var sql = sqlQuery.insert().into('sys_user').set({
                                USER_NAME: jobNo,
                                JOB_NO: jobNo,
                                password: md5(password),
                                IS_SYSTEM: 4, //个人用户为4
                                EMAIL: email,
                                MOBILE_PHONE: mobilePhone,
                                PHONE_MOBILE: mobilePhone,
                                DESCRIPTION: '个人开发者',
                                CREATE_DATE: Utils.dateFormat(new Date().getTime(), Utils.yyyyMMddhhmmss)
                            }).build();
                            logger.debug('插入用戶信息sql:' + sql);
                            conn.query(sql, function (error, rows) {
                                if (error) {
                                    logger.error('插入个人用戶信息失败：' + error);
                                    message.flag = -1;
                                    message.message = "操作失败";
                                    res.json(message);
                                    return;
                                } else {
                                    var row = {
                                        USER_ID: rows.insertId,
                                        jobNo: jobNo,
                                        USER_NAME: jobNo,
                                        phone: mobilePhone
                                    }
                                    callback(null, row);
                                }
                            });
                        },
                        function (row, callback) {
                            var sqlDomain = sqlQuery.insert().into('sys_domain').set({
                                PRE_DOMAIN_ID: 1,
                                NAME: row.jobNo,
                                URI: '/' + row.jobNo,
                                CREATE_USER: 1,
                                ADMIN_USER: row.USER_ID,
                                COMPANY_ID: row.USER_ID,
                                DOMAIN_CODE: uuid.v1(),
                                DESCRIPTION: '个人用户注册时创建',
                                CREATE_DATE: Utils.dateFormat(new Date().getTime(), Utils.yyyyMMddhhmmss)
                            }).build();
                            logger.debug('添加个人用户的时候初始化Domain信息sql：' + sqlDomain);
                            conn.query(sqlDomain, function (err, rows) {
                                if (err) {
                                    logger.error('插入个人用户Domain信息失败：' + err);
                                    message.flag = -1;
                                    message.message = "操作失败";
                                    message.data = null;
                                    res.json(message);
                                    return;
                                } else {
                                    callback(null, rows.insertId, row);
                                }
                            });
                        },
                        function (domainId, row, callback) {
                            var sqlDomain = sqlQuery.insert().into('sys_user_domain').set({
                                USER_ID: row.USER_ID,
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
                                    res.json(message);
                                    return;
                                } else {
                                    callback(null, domainId, row);
                                }
                            });
                        },
                        function (domainId, row, callback) {
                            var sqlCompany = sqlQuery.insert().into('sys_enterprise').set({
                                DOMAIN_ID: domainId,
                                ENTERPRISE_NAME: row.jobNo,
                                TYPE: 2,
                                DESCRIPTION: '个人用户注册',
                                LINK_MAN: row.jobNo,
                                PHONE: row.phone,
                                CREATE_DATE: Utils.dateFormat(new Date().getTime(), Utils.yyyyMMddhhmmss)
                            }).build();
                            logger.debug('添加个人开发者企业基本信息sql：' + sqlCompany);
                            conn.query(sqlCompany, function (err, rows) {
                                if (err) {
                                    logger.error('插入私有用戶企业信息失败：' + err);
                                    message.flag = -1;
                                    message.message = "操作失败";
                                    message.data = null;
                                    res.json(message);
                                    return;
                                } else {
                                    callback(null, domainId, rows.insertId, row);
                                }
                            });
                        },
                        function (domainId, companyId, row, callback) {
                            var sqlCustomer = sqlQuery.update().into('sys_user').set({
                                ENTERPRISE_ID: companyId,
                                OPGROUP_ID: companyId,
                                UPDATE_DATE: Utils.dateFormat(new Date().getTime(), Utils.yyyyMMddhhmmss)
                            }).where({
                                USER_ID: row.USER_ID
                            }).build();
                            logger.debug('更新用戶信息sql:' + sqlCustomer);
                            conn.query(sqlCustomer, function (cerr, rows) {
                                if (cerr) {
                                    logger.error('更新个人用戶信息失败：' + cerr);
                                    message.flag = -1;
                                    message.message = "操作失败";
                                    res.json(message);
                                    return;
                                } else {
                                    callback(null, domainId, companyId, row);
                                }
                            });
                        },
                        function (domainId, companyId, row, callback) {
                            var sqlRole = sqlQuery.insert().into('sys_user_role').set({
                                USER_ID: row.USER_ID,
                                ROLE_ID: 5
                            }).build();
                            logger.debug('插入用戶基本权限sql:' + sqlRole);
                            conn.query(sqlRole, function (ccerr, rows) {
                                if (ccerr) {
                                    logger.error('插入个人开发者基础权限失败：' + ccerr);
                                    message.flag = -1;
                                    message.message = "操作失败";
                                    res.json(message);
                                    return;
                                } else {
                                    callback(null, domainId, companyId, row);
                                }
                            });
                        },
                        function (domainId, companyId, row, callback) {
                            var sqlMtree = sqlQuery.insert().into('sys_mtree').set({
                                DOMAIN_ID: domainId,
                                URI: '/' + row.jobNo,
                                NAME: row.jobNo,
                                LAYER: 0,
                                MTREE_SOURCE: 1,
                                DESCRIPTION: '添加个人用戶创建',
                                COMPANY_ID: companyId,
                                CREATE_DATE: Utils.dateFormat(new Date().getTime(), Utils.yyyyMMddhhmmss)
                            }).build();
                            logger.debug('插入个人用戶Mtree资源sql:' + sqlMtree);
                            conn.query(sqlMtree, function (err, rows) {
                                if (err) {
                                    logger.error('插入个人用戶Mtree资源失败：' + err);
                                    message.flag = -1;
                                    message.message = "操作失败";
                                    res.json(message);
                                    return;
                                } else {
                                    callback(null, domainId, companyId, row.jobNo);
                                }
                            });
                        },
                        function (domainId, companyId, companyName, callback) {
                            var sql = sqlQuery.update().into('sys_domain').set({
                                COMPANY_ID: companyId
                            }).where({
                                DOMAIN_ID: domainId
                            }).build();
                            logger.debug('更新域企业ID字段sql:' + sql);
                            conn.query(sql, function (err, rows) {
                                if (err) {
                                    logger.error('更新域企业ID字段错误：' + err);
                                    message.flag = -1;
                                    message.message = "操作失败";
                                    res.json(message);
                                    return;
                                } else {
                                    callback(null, companyId, companyName);
                                }
                            });
                        },
                        function (companyId, companyName, callback) {
                            //数据库sys_user保存mailTokenKey
                            message.flag = 0;
                            message.message = "OK";
                            message.data = null;
                            //创建对应的文件夹
                            var path = './public/userfile/' + companyId;
                            fs.exists(path, function (exists) {
                                if (exists) {
                                    fileUtils.rmdirSync(path);
                                    //创建用户资源目录
                                    fs.mkdirSync(path);
                                    fs.mkdirSync(path + '/resources');
                                    fs.mkdirSync(path + '/resources/' + companyName);
                                    fs.mkdirSync(path + '/model');
                                    fs.mkdirSync(path + '/model' + '/file');
                                    fs.mkdirSync(path + '/model' + '/jar');
                                    res.json(message);
                                }
                                if (!exists) {
                                    //创建用户资源目录
                                    fs.mkdirSync(path);
                                    fs.mkdirSync(path + '/resources');
                                    fs.mkdirSync(path + '/resources/' + companyName);
                                    fs.mkdirSync(path + '/model');
                                    fs.mkdirSync(path + '/model' + '/file');
                                    fs.mkdirSync(path + '/model' + '/jar');
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

    /**
     * 验证登录名是否存在
     * @param req
     * @param res
     */
    validateJobNo: function (req, res) {
        var jobNo = req.body.jobNo;
        var sql = 'select CREATE_DATE,count(JOB_NO) AS count from sys_user where JOB_NO = "' + jobNo + '" ';
        logger.debug('验证登录名是否存在sql:' + sql);
        query(sql, function (err, rows, columns) {
            if (err) {
                logger.error('验证用户名是否存在失败：' + err);
                message.flag = -1;
                message.message = '验证失败';
                res.json(message);
                return;
            }
            if (rows[0].count > 0) {
                message.flag = -1;
                message.data = null;
                message.message = '登录名已存在';
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
     * 验证企业名称
     * @param req
     * @param res
     */
    validateCompanyName: function (req, res) {
        var companyName = req.body.companyName;
        var sql = sqlQuery.select().from('sys_enterprise').count('enterprise_id', 'count').where({
            enterprise_name: companyName,
            type: 1
        }).build();
        logger.debug('验证企业名称是否存在sql:' + sql);
        query(sql, function (err, rows, columns) {
            if (err) {
                logger.error('验证企业名称是否存在失败：' + err);
                message.flag = -1;
                message.message = '验证失败';
                res.json(message);
                return;
            }
            if (rows[0].count > 0) {
                message.flag = -1;
                message.message = '企业名称已存在';
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
     * 验证验证码
     * @param req
     * @param res
     */
    validateCCAP: function (req, res) {
        var ccap = req.body.ccap;
        var ccapText = req.session.ccaptext.text
        if (ccap && ccapText && (ccap.toUpperCase() == ccapText.toUpperCase())) {
            message.flag = 0;
            message.data = null;
            message.message = 'OK';
            res.json(message);
            return;
        } else {
            message.flag = -1;
            message.data = null;
            message.message = '验证码不正确';
            res.json(message);
            return;
        }
    },
    /**
     * 获取行业列表
     * @param req
     * @param res
     */
    industryList: function (req, res) {
        //DESC是sql的关键字，需要加上``
        var sql = 'select INDUSTRY_ID, INDUSTRY_NAME, `DESC` from sys_industry where IS_DELETED = 0';
        logger.debug('查询行业列表：' + sql);
        query(sql, function (err, rows, columns) {
            if (err) {
                logger.error('查询行业列表失败：' + err);
                message.flag = -1;
                message.message = '查询行业列表失败';
                res.json(message);
                return;
            }
            message.flag = 0;
            message.data = rows;
            res.json(message);
            return;
        });
    },
    /**
     * 获取企业列表信息
     * @param req
     * @param res
     */
    blurryEnterprise: function (req, res) {
        var enterpriseName = req.body.enterpriseName;
        var enterpriseDesc = req.body.enterpriseDesc;
        var industryId = +req.body.industryId || 0;
        var pageNumber = +req.body.pageNumber || 1;
        var pageSize = +req.body.pageSize || 10;
        var sql = 'select e.ENTERPRISE_ID, e.DOMAIN_ID, e.ENTERPRISE_NAME, e.DESCRIPTION, e.LINK_MAN, ' +
            'e.PHONE, e.INDUSTRY_ID, e.CREATE_DATE, e.UPDATE_DATE, i.INDUSTRY_NAME, e.IS_ENABLED ' +
            'from sys_enterprise e left join sys_industry i ' +
            'on e.INDUSTRY_ID = i.INDUSTRY_ID ' +
            'where e.type=1 and e.IS_DELETED = 0 and i.IS_DELETED = 0';
        if (enterpriseName) {
            sql += ' and e.ENTERPRISE_NAME like "%' + enterpriseName + '%"';
        }
        if (enterpriseDesc) {
            sql += ' and e.DESCRIPTION like "%' + enterpriseDesc + '%"';
        }
        if (industryId != 0) {
            sql += ' and e.INDUSTRY_ID = ' + industryId;
        }
        logger.debug('查询企业列表：' + sql);
        query(sql, function (err, rows, columns) {
            if (err) {
                logger.error('查询企业列表失败：' + err);
                message.flag = -1;
                message.message = '查询企业列表失败';
                res.json(message);
                return;
            }
            var result = {
                total: rows.length,
                rows: []
            };
            sql += ' limit ' + (pageNumber - 1) * pageSize + ', ' + pageSize;
            logger.debug('查询企业列表分页：' + sql);
            query(sql, function (err, rows, columns) {
                if (err) {
                    logger.error('查询企业列表失败：' + err);
                    message.flag = -1;
                    message.message = '查询企业列表失败';
                    res.json(message);
                    return;
                }
                message.flag = 0;
                result.rows = rows;
                message.data = result;
                res.json(message);
                return;
            });
        });
    },
    /**
     * 禁用或启用企业
     * @param req
     * @param res
     */
    disableOrEnableEnterprise: function (req, res) {
        var enterpriseID = req.body.enterpriseID;
        var flag = req.body.flag;
        async.waterfall([
            //禁用或启用企业，使得is_enabled==1或0
            function (callback) {
                var sql = 'update sys_enterprise set IS_ENABLED = ' + flag + ' where ENTERPRISE_ID = ' + enterpriseID;
                logger.debug('禁用或启用企业：' + sql);
                query(sql, function (err, rows, columns) {
                    if (err || rows.affectedRows == 0) {
                        logger.error('禁用或启用企业失败：' + err);
                        message.flag = -1;
                        message.message = '禁用或启用企业失败';
                        res.json(message);
                        return;
                    }
                    callback(null);
                });
            },
            //禁用或启用企业用户和普通用户IS_SYSTEM = 2、3，但是需要去除个人开发者，可能会有ENTERPRISE_ID重复
            function (callback) {
                var sql = 'update sys_user set IS_UNVILIABLE = ' + flag + ' ,UNVILEABLE_DATE = "' + Utils.dateFormat(new Date().getTime(), Utils.yyyyMMddhhmmss) + '"' +
                    ' where IS_SYSTEM in (2,3) and ENTERPRISE_ID = ' + enterpriseID;
                logger.debug('禁用或启用企业普通用户：' + sql);
                query(sql, function (err, rows, columns) {
                    if (err || rows.affectedRows == 0) {
                        logger.error('禁用或启用企业普通用户失败：' + err);
                        message.flag = -1;
                        message.message = '禁用或启用企业普通用户失败';
                        res.json(message);
                        return;
                    }
                    message.flag = 0;
                    message.data = null;
                    res.json(message);
                    return;
                });
            }
        ], function (err) {
            logger.error('禁用企业失败：' + err);
        });
    },
    /**
     * 禁用或启用用户，从用户管理页面进来
     * @param req
     * @param res
     */
    disableOrEnableUser: function (req, res) {
        var userID = req.body.userID;
        var systemID = req.body.systemID;
        var flag = req.body.flag;
        async.waterfall([
            //禁用或启用用户，IS_UNVILIABLE==1或0
            function (callback) {
                var sql = 'update sys_user set IS_UNVILIABLE = ' + flag + ' ,UNVILEABLE_DATE = "' + Utils.dateFormat(new Date().getTime(), Utils.yyyyMMddhhmmss) + '"' +
                    ' where IS_SYSTEM = ' + systemID + ' and USER_ID = ' + userID;
                logger.debug('禁用或启用用户：' + sql);
                query(sql, function (err, rows, columns) {
                    if (err || rows.affectedRows == 0) {
                        logger.error('禁用或启用用户失败：' + err);
                        message.flag = -1;
                        message.message = '禁用或启用用户失败';
                        res.json(message);
                        return;
                    }
                    message.flag = 0;
                    message.data = null;
                    res.json(message);
                    return;
                });
            }
        ], function (err) {
            logger.error('禁用或启用用户失败：' + err);
        });
    }
};

module.exports = customer;
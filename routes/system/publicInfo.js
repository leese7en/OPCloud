var actionUtil = require("../framework/action/actionUtils")();
var query = actionUtil.query;
var Utils = require('../utils/tools/utils');
var SMS = require('../utils/sms/sms');
var log4js = require('log4js');
var logger = log4js.getLogger('system');
var message = {
    flag: 0,
    message: 'OK',
    data: null
}
var publicInfo = {
    /**
     * 获取用户菜单信息
     * @param req
     * @param res
     */
    getIndustry: function (req, res) {
        var sql = 'select INDUSTRY_ID as id,INDUSTRY_NAME as name from sys_industry';
        logger.debug('查询行业信息：' + sql);
        query(sql, function (err, rows, columns) {
            if (err == null) {
                message.flag = 0;
                message.data = rows;
                res.json(message);
            } else {
                logger.error('查询行业信息失败：' + error);
                message.flag = -1;
                message.message = "获取数据失败";
                res.json(message);
            }
        });
    },
    /**
     * 模糊查询数据
     * @param req
     * @param res
     */
    getDuties: function (req, res) {
        var sql = 'select DUTY_ID as id,DUTY_NAME as name from sys_duty';
        logger.debug('查询职务信息：' + sql);
        query(sql, function (err, rows, columns) {
            if (err == null) {
                message.flag = 0;
                message.data = rows;
                res.json(message);
            } else {
                logger.error('查询职务信息失败：' + error);
                message.flag = -1;
                message.message = "获取数据失败";
                res.json(message);
            }
        });
    },
    /**
     * 查询domain 信息
     * @param req
     * @param res
     */
    getDomains: function (req, res) {
        var sql = 'select DOMAIN_ID  as id,name as name from sys_domain where PRE_DOMAIN_ID = 1';
        logger.debug('查询domain信息：' + sql);
        query(sql, function (err, rows, columns) {
            if (err == null) {
                message.flag = 0;
                message.data = rows;
                res.json(message);
            } else {
                logger.error('查询domain信息失败：' + error);
                message.flag = -1;
                message.message = "获取数据失败";
                res.json(message);
            }
        });
    },
    /**
     * 验证邮箱是否注册过
     * @param req
     * @param res
     */
    validateEmail: function (req, res) {
        var email = req.body.email;
        var sql = 'select CREATE_DATE,count(EMAIL) AS count from sys_user where EMAIL = "' + email + '"';
        logger.debug('验证邮箱是否被注册过:' + sql);
        query(sql, function (err, rows, columns) {
            if (err) {
                logger.error('验证邮箱是否被注册过失败：' + err);
                message.flag = -1;
                message.message = '邮箱验证失败';
                message.data = null;
                res.json(message);
                return;
            }
            if (rows[0].count > 0) {
                message.flag = 0;
                message.flag = -1;
                message.message = '邮箱已经被注册过，请更换邮箱';
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
     * 验证手机是否注册过
     * @param req
     * @param res
     */
    validatePhone: function (req, res) {
        var phone = req.body.phone;
        var sql = 'select CREATE_DATE,count(MOBILE_PHONE) AS count from sys_user where MOBILE_PHONE = "' + phone + '"  and IS_system = 2 ';
        logger.debug('验证手机是否被注册过:' + sql);
        query(sql, function (err, rows, columns) {
            if (err) {
                logger.error('验证手机是否被注册过：' + err);
                message.flag = -1;
                message.message = '手机验证失败';
                message.data = null;
                res.json(message);
                return;
            }
            if (rows[0].count > 0) {
                message.flag = -1;
                message.message = '手机号码已经被注册过，请更换手机号码';
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
     *
     * @param req
     * @param res
     */
    sendSmsCode: function (req, res) {
        var token = req.body.token;
        var UUID = req.body.UUID;
        if (!UUID) {
            message.flag = -1;
            message.message = '验证为空';
            res.json(message);
            return;
        }
        if (!token) {
            message.flag = -1;
            message.message = '非法的操作';
            res.json(message);
            return;
        }
        var phone = req.body.phone;
        if (!phone) {
            logger.debug('联系方式为空');
            message.flag = -1;
            message.message = '手机号为空';
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
                message.message = '号码格式不正确';
                res.json(message);
                return;
            }
        }
        SMS.sendSms(UUID, phone, res);
    }
    ,
    /**
     *
     * @param req
     * @param res
     */
    sendCloudSmsCode: function (req, res) {
        var phone = req.body.phone;
        if (!phone) {
            logger.debug('联系方式为空');
            message.flag = -1;
            message.message = '手机号为空';
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
                message.message = '号码格式不正确';
                res.json(message);
                return;
            }
        }
        SMS.sendCloudSms(phone, req, res);
    }
}

module.exports = publicInfo;

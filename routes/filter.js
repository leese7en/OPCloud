/**
 * Created by tp on 2016/7/4.
 */
var index = "/index";
var API = "/api";
var APITest = "/test";
var moment = require("moment");
var opPool = require('./openplant/openPlantPool');
var log4js = require('log4js');
var logger = log4js.getLogger('system');

var actionUtil = require("./framework/action/actionUtils")();
var query = actionUtil.query;
var sqlQuery = require('sql-query').Query()
var async = require('async');

var ccapUrl = "/system/ccap";
var loginUrl = "/system/admin/login";
var loginOutUrl = "/system/admin/loginOut";
var registerAdminUrl = "/system/admin/register";
var registerUrl = "/system/customer/register";
var registerIndividualUrl = "/system/customer/registerIndividual";
var validateJobNo = "/system/customer/validateJobNo";
var addPublicCustomer = "/system/customer/addPublicCustomer";
var addCustomerIndividual = "/system/customer/addCustomerIndividual";
var validateCompanyName = "/system/customer/validateCompanyName";
var getDuties = "/system/publicInfo/getDuties";
var getIndustry = "/system/publicInfo/getIndustry";
var validateCCAP = "/system/customer/validateCCAP";
//忘记密码
var forgotPwdUrl = "/system/forgetPwd";
var forgotPwd = "/system/user/forgetPwd";
//修改密码
var modifyPwdUrl = "/system/modifyPwd";
var modifyPwd = "/system/user/modifyPassword";

var validateEmail = "/system/publicInfo/validateEmail";
var validatePhone = "/system/publicInfo/validatePhone";
//发送短信
var sendSms = "/system/publicInfo/sendSmsCode";
var sendCloudSms = "/system/publicInfo/sendCloudSmsCode";
var login = "/system/user/login";
var addUser = "/system/user/addUser";

var urls = [];
urls["/"] = 1;
urls[index] = 1;
urls[ccapUrl] = 1;
urls[API] = 1;
urls[APITest] = 1;
urls[loginUrl] = 1;
urls[loginOutUrl] = 1;
urls[registerAdminUrl] = 1;
urls[registerUrl] = 1;
urls[registerIndividualUrl] = 1;
urls[validateJobNo] = 1;
urls[addPublicCustomer] = 1;
urls[addCustomerIndividual] = 1;
urls[validateCompanyName] = 1;
urls[getDuties] = 1;
urls[getIndustry] = 1;
urls[validateCCAP] = 1;
urls[forgotPwdUrl] = 1;
urls[forgotPwd] = 1;
urls[modifyPwdUrl] = 1;
urls[modifyPwd] = 1;

urls[validateEmail] = 1;
urls[validatePhone] = 1;
urls[sendCloudSms] = 1;
urls[login] = 1;
urls[addUser] = 1;

//box 接口用户
urls[sendSms] = 1;


var IboxUrl = ['/Ibox/user/login', '/Ibox/user/register', '/Ibox/user/registerEnter', '/Ibox/user/forgetPassword'];

var appFilter = {
    "urls": urls,
    checkLogin: function (req, res, next) {
        var url = req.originalUrl;
        if (url.length > 0 && url.substring(0, 1) != "/") {
            url = "/" + url;
        }
        if (url.indexOf("?") != -1) {
            url = url.substring(0, url.indexOf("?"))
        }
        if (url.lastIndexOf(".") > 0) {
            var reqType = url.substring(url.lastIndexOf("."));
            if (reqType.toLowerCase() == ".html") {
                var err = new Error('Not Found');
                err.status = 404;
                err.message = url + "没有找到";
                return res.redirect("/error");
            }
        }
        var user = req.session.user;
        if ((urls[url] != undefined && urls[url] == 1) || user != undefined || url.indexOf('Ibox') > -1) {
            var time = moment(new Date()).format('YYYY-MM-DD HH:mm:ss');
            var obj = {
                url: url,
                time: time,
                ip: req.connection.remoteAddress.substring(7)
            };
            if (user) {
                obj.user_id = user.USER_ID;
            } else {
                obj.user_id = req.body.userId || req.query.userId;
            }
            var sql = sqlQuery.insert().into('sys_log').set(obj).build();
            query(sql, function (error, rows) {
            });
            if (url.indexOf('Ibox') > -1) {
                if (IboxUrl.indexOf(url) > -1) {
                    next();
                } else {
                    var token = req.headers.token;
                    if (token) {
                        next();
                        // try {
                        //     var size = token.length % 4;
                        //     while (size > 0) {
                        //         token += '=';
                        //         size--;
                        //     }
                        //     var obj = JSON.parse(opPool.decrypt(token));
                        //     if (!obj || !obj.UD) {
                        //         res.json({
                        //             Status: false,
                        //             message: '非法的认证',
                        //             data: null
                        //         });
                        //     } else {
                        //         var userId = req.body.userId || req.query.userId;
                        //         if (obj.userId != userId || (new Date().getTime() - obj.date) > 60 * 60) {
                        //             next();
                        //         } else {
                        //             next();
                        //         }
                        //     }
                        // } catch (e) {
                        //     res.json({
                        //         Status: false,
                        //         message: '非法的认证',
                        //         data: null
                        //     });
                        // }
                    } else {
                        res.json({
                            Status: false,
                            message: '非法的认证',
                            data: null
                        });
                    }
                }
            } else {
                next();
            }
        } else {
            if (url.indexOf('Ibox') > -1) {
                res.json({
                    flag: -1,
                    message: '登录超时',
                    data: null
                });
            } else {
                logger.warn("session :" + req.sessionID + " REQ_URL >>>>>>>" + url);
                return res.redirect(loginUrl);
            }

        }
    }
}
module.exports = appFilter;

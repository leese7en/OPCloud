/**
 * Created by tp on 2016/7/4.
 */
var express = require('express');
var router = express.Router();
var system_user = require("./system_user");
var publicInfo = require("./publicInfo");
var openplant = require("./openplant");
var system_role = require("./system_role");
var system_page = require("./system_page");
var system_user_role = require("./system_user_role");
var system_user_page = require("./system_user_page");
var system_role_page = require("./system_role_page");
var system_log = require("./system_log");
var fileManage = require("./fileManage");
var customer = require("./customer");
var jwt = require('jsonwebtoken');
var jwtSecret = Buffer('magustek.com', 'base64');
var ccap = require('ccap')();
var moduleName = "system";

function check(value) {
    if (value != undefined && typeof(value) == "string" && value != "") {
        return true;
    } else {
        return false;
    }
}

/**
 * 用户操作
 * @param req
 * @param res
 * @param next
 */
var userAction = function (req, res, next) {
    if (req.params.action) {
        var action = req.params.action;
        if ("login" == action) {
            system_user.loginAction(req, res, action);
        } else if ("user" == action) {
            system_user.userManageAction(req, res, action);
        } else if ("role" == action) {
            system_role.roleManageAction(req, res, action);
        } else if ("loginOut" == action) {
            if (res.session && res.session.user) {
                res.session.user = undefined;
            }
            return res.redirect("/");
        } else {
            system_user[action](req, res);
        }
    } else {
        return res.redirect("/");
    }
}
/**
 * 角色操作
 * @param req
 * @param res
 * @param next
 */
var roleAction = function (req, res, next) {
    if (req.params.action) {
        var action = req.params.action;
        if ("role" == action) {
            system_role.roleManageAction(req, res, action);
        } else {
            system_role[action](req, res);
        }
    } else {
        return res.redirect("/");
    }
}

/**
 * 角色菜单操作
 * @param req
 * @param res
 * @param next
 */
var rolePageAction = function (req, res, next) {
    if (req.params.action) {
        var action = req.params.action;
        system_role_page[action](req, res);
    } else {
        return res.redirect("/");
    }
}
/**
 * 用户菜单操作
 * @param req
 * @param res
 * @param next
 */
var userPageAction = function (req, res, next) {
    if (req.params.action) {
        var action = req.params.action;
        system_user_page[action](req, res);
    } else {
        return res.redirect("/");
    }
}
/**
 * 用户角色操作
 * @param req
 * @param res
 * @param next
 */
var userRoleAction = function (req, res, next) {
    if (req.params.action) {
        var action = req.params.action;
        system_user_role[action](req, res);
    } else {
        return res.redirect("/");
    }
}
/**
 * 页面操作
 * @param req
 * @param res
 * @param next
 */
var pageAction = function (req, res, next) {
    if (req.params.action) {
        var action = req.params.action;
        if (action == "page") {
            res.render(moduleName + "/" + action);
        } else {
            system_page[action](req, res);
        }
    } else {
        return res.redirect("/");
    }
}

var defaultAction = function (req, res, next) {
    return res.redirect("/");
}

var publicInfoAction = function (req, res, next) {
    if (req.params.action) {
        var action = req.params.action;
        publicInfo[action](req, res);
    } else {
        return res.redirect("/");
    }
}

var openplantAction = function (req, res, next) {
    if (req.params.action) {
        var action = req.params.action;
        openplant[action](req, res);
    } else {
        return res.redirect("/");
    }
}

var customerAction = function (req, res, next) {
    if (req.params.action) {
        var action = req.params.action;
        customer[action](req, res);
    } else {
        return res.redirect("/");
    }
}
var fileManageAction = function (req, res, next) {
    if (req.params.action) {
        var action = req.params.action;
        fileManage[action](req, res);
    } else {
        return res.redirect("/");
    }
}

var sysLogAction = function (req, res, next) {
    if (req.params.action) {
        var action = req.params.action;
        system_log[action](req, res);
    } else {
        return res.redirect("/");
    }
}
var manageAction = function (req, res, next) {
    var token = "";
    if (req.session && req.session.user) {
        var user = req.session.user;
        var obj = {
            ID: user.USER_ID,
            SID: req.sessionID,
            PWD: user.PASSWORD,
            name: user.USER_NAME,
            JNO: user.JOB_NO
        }
        token = jwt.sign(obj, jwtSecret, {expiresIn: 60 * 5});
    }
    res.render(moduleName + "/manage", {token: token});
}

router.get('/ccap', function (req, res, next) {
    var ary = ccap.get();
    var txt = ary[0];
    req.session.ccaptext = {
        text: txt
    };
    var buf = ary[1];
    res.end(buf);
});

router.get('/', defaultAction);
router.post('/', defaultAction);

router.get('/admin', defaultAction);
router.post('/admin', defaultAction);
router.get('/admin/:action', defaultAction);
router.post('/admin/:action', defaultAction);
router.get('/admin/:action/:method', defaultAction);
router.post('/admin/:action/:method', defaultAction);


router.get('/manage', manageAction)
router.post('/manage', manageAction)

router.get('/publicInfo', publicInfoAction);
router.post('/publicInfo', publicInfoAction);
router.get('/publicInfo/:action', publicInfoAction);
router.post('/publicInfo/:action', publicInfoAction);
router.get('/publicInfo/:action/:method', publicInfoAction);
router.post('/publicInfo/:action/:method', publicInfoAction);

router.get('/openplant', openplantAction);
router.post('/openplant', openplantAction);
router.get('/openplant/:action', openplantAction);
router.post('/openplant/:action', openplantAction);
router.get('/openplant/:action/:method', openplantAction);
router.post('/openplant/:action/:method', openplantAction);

router.get('/customer', customerAction);
router.post('/customer', customerAction);
router.get('/customer/:action', customerAction);
router.post('/customer/:action', customerAction);
router.get('/customer/:action/:method', customerAction);
router.post('/customer/:action/:method', customerAction);

router.get('/user', userAction);
router.post('/user', userAction);
router.get('/user/:action', userAction);
router.post('/user/:action', userAction);
router.get('/user/:action/:method', userAction);
router.post('/user/:action/:method', userAction);


router.get('/userPage', userPageAction);
router.post('/userPage', userPageAction);
router.get('/userPage/:action', userPageAction);
router.post('/userPage/:action', userPageAction);
router.get('/userPage/:action/:method', userPageAction);
router.post('/userPage/:action/:method', userPageAction);

router.get('/userRole', userRoleAction);
router.post('/userRole', userRoleAction);
router.get('/userRole/:action', userRoleAction);
router.post('/userRole/:action', userRoleAction);
router.get('/userRole/:action/:method', userRoleAction);
router.post('/userRole/:action/:method', userRoleAction);

router.get('/role', roleAction);
router.post('/role', roleAction);
router.get('/role/:action', roleAction);
router.post('/role/:action', roleAction);
router.get('/role/:action/:method', roleAction);
router.post('/role/:action/:method', roleAction);

router.get('/rolePage', rolePageAction);
router.post('/rolePage', rolePageAction);
router.get('/rolePage/:action', rolePageAction);
router.post('/rolePage/:action', rolePageAction);
router.get('/rolePage/:action/:method', rolePageAction);
router.post('/rolePage/:action/:method', rolePageAction);

router.get('/page', pageAction);
router.post('/page', pageAction);
router.get('/page/:action', pageAction);
router.post('/page/:action', pageAction);
router.get('/page/:action/:method', pageAction);
router.post('/page/:action/:method', pageAction);

router.get('/fileManage', fileManageAction);
router.post('/fileManage', fileManageAction);
router.get('/fileManage/:action', fileManageAction);
router.post('/fileManage/:action', fileManageAction);
router.get('/fileManage/:action/:method', fileManageAction);
router.post('/fileManage/:action/:method', fileManageAction);

router.get('/sysLog', sysLogAction);
router.post('/sysLog', sysLogAction);
router.get('/sysLog/:action', sysLogAction);
router.post('/sysLog/:action', sysLogAction);
router.get('/sysLog/:action/:method', sysLogAction);
router.post('/sysLog/:action/:method', sysLogAction);

module.exports = router;

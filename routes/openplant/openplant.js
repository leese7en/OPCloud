/**
 * Created by tp on 2016/7/4.
 */
var express = require('express');
var router = express.Router();
var trend = require("./op");
var socketioJwt;
socketioJwt = require('socketio-jwt');
var moduleName = "openplant";

function check(value) {
    if (value != undefined && typeof (value) == "string" && value != "") {
        return true;
    } else {
        return false;
    }
}

/**
 * 趋势操作
 * @param req
 * @param res
 * @param next
 */
var openplantAction = function (req, res, next) {
    if (req.params.action) {
        var action = req.params.action;
        trend[action](req, res);
    }
    else {
        return res.redirect("/");
    }
}
var defaultAction = function (req, res, next) {
    return res.redirect("/");
}

router.get('/', openplantAction);
router.post('/', openplantAction);
router.get('/openplant', openplantAction);
router.post('/openplant', openplantAction);
router.get('/openplant/:action', openplantAction);
router.post('/openplant/:action', openplantAction);
router.get('/openplant/:action/:method', openplantAction);
router.post('/openplant/:action/:method', openplantAction);

module.exports = router;

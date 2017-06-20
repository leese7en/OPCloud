/**
 * Created by tp on 2016/7/4.
 */
var express = require('express');
var router = express.Router();
var trend = require("./dataTrend");
var socketioJwt;
socketioJwt = require('socketio-jwt');
var moduleName = "trend";

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
var trendAction = function (req, res, next) {
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

router.get('/', trendAction);
router.post('/', trendAction);
router.get('/trend', trendAction);
router.post('/trend', trendAction);
router.get('/trend/:action', trendAction);
router.post('/trend/:action', trendAction);
router.get('/trend/:action/:method', trendAction);
router.post('/trend/:action/:method', trendAction);

module.exports = router;

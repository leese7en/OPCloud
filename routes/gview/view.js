/**
 * Created by tp on 2016/7/4.
 */
var express = require('express');
var router = express.Router();
var gview = require("./gview");
var socketioJwt;
socketioJwt = require('socketio-jwt');
var moduleName = "gview";
var Producer = require("../OPMQ/Producer");
var Consumer = require("../OPMQ/Consumer");

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
var gviewAction = function (req, res, next) {
    if (req.params.action) {
        var action = req.params.action;
        gview[action](req, res);
    }
    else {
        return res.redirect("/");
    }
}
var defaultAction = function (req, res, next) {
    return res.redirect("/");
}

router.get('/', gviewAction);
router.post('/', gviewAction);
router.get('/gview', gviewAction);
router.post('/gview', gviewAction);
router.get('/gview/:action', gviewAction);
router.post('/gview/:action', gviewAction);
router.get('/gview/:action/:method', gviewAction);
router.post('/gview/:action/:method', gviewAction);

module.exports = router;

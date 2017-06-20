/**
 * Created by Administrator on 2016/8/8.
 */
var express = require('express');
var router = express.Router();
var historySnapSta = require("./historySnapSta");
var moduleName = "dataview";

var historySnapStaAction = function (req, res, next) {
    if (req.params.action) {
        var action = req.params.action;
        historySnapSta[action](req, res, action);
    } else {
        return res.redirect("/");
    }
}
var defaultAction = function (req, res, next) {
    return res.redirect("/");
}

router.get('/', defaultAction);
router.post('/', defaultAction);

router.get('/historySnapSta', historySnapStaAction);
router.post('/historySnapSta', historySnapStaAction);
router.get('/historySnapSta/:action', historySnapStaAction);
router.post('/historySnapSta/:action', historySnapStaAction);
router.get('/historySnapSta/:action/:method', historySnapStaAction);
router.post('/historySnapSta/:action/:method', historySnapStaAction);

module.exports = router;

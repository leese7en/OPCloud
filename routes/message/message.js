/**
 * Created by tp on 2016/7/4.
 */
var express = require('express');
var router = express.Router();
var message = require("./messageRoute");
var moduleName = "message";
/**
 * 消息订阅操作
 * @param req
 * @param res
 * @param next
 */
var messageAction = function(req, res, next) {
    if (req.params.action) {
        var action = req.params.action;
        message[action](req, res);
    } else {
        return res.redirect("/");
    }
}

var defaultAction = function(req, res, next) {
    return res.redirect("/");
}


router.get('/', defaultAction);
router.post('/', defaultAction);

router.get('/message', messageAction);
router.post('/message', messageAction);
router.get('/message/:action', messageAction);
router.post('/message/:action', messageAction);
router.get('/message/:action/:method', messageAction);
router.post('/message/:action/:method', messageAction);

module.exports = router;

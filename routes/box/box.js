/**
 * Created by tp on 2016/7/25.
 */

var express = require('express');
var router = express.Router();

var device = require("./boxInfo");

var defaultAction = function (req, res, next) {
    return res.redirect("/");
}


var pointManagerAction = function (req, res, next) {
    if (req.params.action) {
        var action = req.params.action;
        if (action == "pointList") {
            point_manage.pointManagerAction(req, res, action);
        } else if (action == "validateName") {
            point_manage.findPointByDevcodeAndSnAndPn(req, res, action);
        } else {
            point_manage[action](req, res, action);
        }
    } else {
        return res.redirect("/");
    }
}


/**
 * @param req
 * @param res
 * @param next
 */
var deviceAction = function (req, res, next) {
    if (req.params.action) {
        var action = req.params.action;
        //device[action](req, res);
        if (action) {
            device[action](req, res, action);
        } else {
            return res.redirect("/");
        }
    } else {
        return res.redirect("/");
    }
}


router.get('/', defaultAction);

router.post('/', defaultAction);

router.get('/device', deviceAction);
router.post('/device', deviceAction);
router.get('/device/:action', deviceAction);
router.post('/device/:action', deviceAction);
router.get('/device/:action/:method', deviceAction);
router.post('/device/:action/:method', deviceAction);

module.exports = router;

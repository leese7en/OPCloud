/**
 * Created by tp on 2016/7/4.
 */
var express = require('express');
var router = express.Router();
var boxUser = require("./boxUser");
var boxInfo = require("./boxInfo");
var boxService = require("./boxService");
var boxData = require("./boxData");


/**
 * 盒子用户接口
 * @param req
 * @param res
 * @param next
 */
var boxUserAction = function (req, res, next) {
    if (req.params.action) {
        var action = req.params.action;
        boxUser[action](req, res);
    } else {
        res.json({
            flag: -1,
            message: '非法的参数',
            data: null
        })
    }
}
/**
 * 盒子信息
 * @param req
 * @param res
 * @param next
 */
var boxInfoAction = function (req, res, next) {
    if (req.params.action) {
        var action = req.params.action;
        boxInfo[action](req, res);
    } else {
        res.json({
            flag: -1,
            message: '非法的参数',
            data: null
        })
    }
}
/**
 * 盒子采集和测点信息
 * @param req
 * @param res
 * @param next
 */
var boxServiceAction = function (req, res, next) {
    if (req.params.action) {
        var action = req.params.action;
        boxService[action](req, res);
    } else {
        res.json({
            flag: -1,
            message: '非法的参数',
            data: null
        })
    }
}
/**
 * 盒子采集和测点信息
 * @param req
 * @param res
 * @param next
 */
var boxDataAction = function (req, res, next) {
    if (req.params.action) {
        var action = req.params.action;
        boxData[action](req, res);
    } else {
        res.json({
            flag: -1,
            message: '非法的参数',
            data: null
        })
    }
}
/**
 * 默认返回
 * @param req
 * @param res
 * @param next
 */
var defaultAction = function (req, res, next) {
    res.json({
        flag: -1,
        message: '非法的参数',
        data: null
    });
}

router.get('/', defaultAction);
router.post('/', defaultAction);

router.get('/user', boxUserAction);
router.post('/user', boxUserAction);
router.get('/user/:action', boxUserAction);
router.post('/user/:action', boxUserAction);
router.get('/user/:action/:method', boxUserAction);
router.post('/user/:action/:method', boxUserAction);


router.get('/box', boxInfoAction);
router.post('/box', boxInfoAction);
router.get('/box/:action', boxInfoAction);
router.post('/box/:action', boxInfoAction);
router.get('/box/:action/:method', boxInfoAction);
router.post('/box/:action/:method', boxInfoAction);

router.get('/service', boxServiceAction);
router.post('/service', boxServiceAction);
router.get('/service/:action', boxServiceAction);
router.post('/service/:action', boxServiceAction);
router.get('/service/:action/:method', boxServiceAction);
router.post('/service/:action/:method', boxServiceAction);

router.get('/data', boxDataAction);
router.post('/data', boxDataAction);
router.get('/data/:action', boxDataAction);
router.post('/data/:action', boxDataAction);
router.get('/data/:action/:method', boxDataAction);
router.post('/data/:action/:method', boxDataAction);


module.exports = router;

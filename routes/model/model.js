/**
 * Created by tp on 2016/7/4.
 */
var express = require('express');
var router = express.Router();
var taskManagement = require("./task");

var taskManagementAction = function(req, res, next) {
    if (req.params.action) {
        var action = req.params.action;
        taskManagement[action](req, res);
    } else {
        return res.redirect("/");
    }
};

var defaultAction = function(req, res, next) {
    return res.redirect("/");
};


router.get('/', defaultAction);
router.post('/', defaultAction);

router.get('/task', taskManagementAction);
router.post('/task', taskManagementAction);
router.get('/task/:action', taskManagementAction);
router.post('/task/:action', taskManagementAction);
router.get('/task/:action/:method', taskManagementAction);
router.post('/task/:action/:method', taskManagementAction);



module.exports = router;

/**
 * Created by tp on 2016/7/25.
 */

var express = require('express');
var router = express.Router();
var domainManage = require("./domain/domain");
var projectManage = require("./project/project");
var mtree = require("./mtree/mtree");

var moduleName = "domain";

var defaultAction = function (req, res, next) {
    return res.redirect("/");
}

var domainAction = function (req, res, next) {
    if (req.params.action) {
        var action = req.params.action;
        domainManage[action](req, res, action);
    } else {
        return res.redirect("/");
    }
}


var projectAction = function (req, res, next) {
    if (req.params.action) {
        var action = req.params.action;
        if (action == "project") {
            projectManage.projectManageAction(req, res, action);
        } else if (action == "JsonList") {
            projectManage.projectList(req, res, action);
        } else if (action == "add_project") {
            projectManage.createAction(req, res, action);
        } else if (action == "edit_project") {
            projectManage.updateAction(req, res, action);
        } else if (action == "remove_project") {
            projectManage.deleteAction(req, res, action);
        } else {
            res.render(moduleName + "/project/" + action);
        }
    } else {
        return res.redirect("/");
    }
}


var mtreeAction = function (req, res, next) {
    if (req.params.action) {
        var action = req.params.action;
        mtree[action](req, res, action);
    } else {
        return res.redirect("/");
    }
}


router.get('/', defaultAction);

router.post('/', defaultAction);


router.get('/project/:action', projectAction);

router.post('/project/:action', projectAction);

router.get('/project/:action/:method', projectAction);

router.post('/project/:action/:method', projectAction);

router.get('/mtree', mtreeAction);

router.post('/mtree', mtreeAction);

router.get('/mtree/:action', mtreeAction);

router.post('/mtree/:action', mtreeAction);

router.get('/mtree/:action/:method', mtreeAction);

router.post('/mtree/:action/:method', mtreeAction);


router.get('/domain', defaultAction);

router.post('/domain', defaultAction);


router.get('/domain/:action', domainAction);

router.post('/domain/:action', domainAction);

router.get('/domain/:action/:method', domainAction);

router.post('/domain/:action/:method', domainAction);

//edmÉè±¸¹ÜÀíÏµÍ³
//router.get('/device/:action', deviceAction);
//
//router.post('/device/:action', deviceAction);
//
//router.get('/device/:action/:method', deviceAction);
//
//router.post('/device/:action/:method', deviceAction);
//dasManager
/*router.get('/das/:action', dasManagerAction);

 router.post('/das/:action', dasManagerAction);

 router.get('/das/:action/:method', dasManagerAction);

 router.post('/das/:action/:method', dasManagerAction);*/
//pointManage

module.exports = router;

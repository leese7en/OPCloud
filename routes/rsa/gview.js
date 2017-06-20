/**
 * Created by tp on 2016/7/4.
 */
var express = require('express');
var router = express.Router();
var moduleName = "rsa";
var token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJJRCI6MSwiU0lEIjoiY25QLWk5aXdhNG9aeU9adGU0cjZKc0YteUZoSTBwMDEiLCJQV0QiOiJkMDdhNWQzNzFiY2JkYTE4N2RiNmJkZDFiNzVlMzRiYSIsIm5hbWUiOiJhZG1pbiIsIkpOTyI6IjEiLCJpYXQiOjE0NjgyODYzMDcsImV4cCI6MTQ5OTgyMjMwN30.dg7JmsvUBo_bG8PHOn7-n6YQTS5moVggEkmcURtfOyY"

var gviewAction = function (req, res, next) {
    if (req.params.action) {
        var action = req.params.action;
        console.log(moduleName + " >>>" + action);
        if ("view" == action) {
            res.render("view", {token: token});
        } else {
            return res.redirect("/");
        }
    }
    else {
        return res.redirect("/");
    }
}
var defaultAction = function (req, res, next) {
    return res.redirect("/");
}
router.get('/', defaultAction);

router.post('/', defaultAction);

router.get('/:action', gviewAction);

router.post('/:action', gviewAction);

router.get('/:action/:method', gviewAction);

router.post('/:action/:method', gviewAction);

module.exports = router;

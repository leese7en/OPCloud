var actionUtil = require("../framework/action/actionUtils")();
var query = actionUtil.query;
var moduleName = "system";
var async = require("async");

var logger = require('log4js').getLogger('system');
var sql = require('sql-query'),
    sqlQuery = sql.Query();
var sys_user_role = {
    getAllRoleByUser: function(req, res, action) {
        var userId = req.body.userId;
        var company_ID = req.session.user.ENTERPRISE_ID;
        var isSystem = req.session.user.IS_SYSTEM;
        var condition = '';
        if (isSystem == 1) {
            condition = ' where is_system = 1';
        } else {
            condition = ' where ENTERPRISE_ID = ' + company_ID;
        }
        var userSql = "select * from sys_user_role where user_id = " + userId;
        var roleSql = "select * from sys_role " + condition;
        logger.debug('获取当前用户绑定的角色信息sql：' + userSql);
        logger.debug('获取当前企业拥有的角色信息sql：' + roleSql);
        query(roleSql, function(err, rows) {
            var roleData = rows;
            for (var i = 0; i < roleData.length; i++) {
                roleData[i].isBind = 0;
            }
            query(userSql, function(err, rows) {
                var userData = rows;
                for (var i = 0; i < roleData.length; i++) {
                    for (var j = 0; j < userData.length; j++) {
                        if (roleData[i].ROLE_ID == userData[j].ROLE_ID) {
                            roleData[i].isBind = 1;
                        }
                    }
                }
                res.json(roleData);
            });
        });
    },
    bindRole: function(req, res, action) {
        var userId = req.body.userId;
        var roleId = req.body.roleId;
        var sql = "insert into sys_user_role (USER_ID,ROLE_ID) " +
            "values ('" + userId + "','" + roleId + "')";
        query(sql, function(qerr, result) {
            var message = {};
            if (result != undefined && result != null) {
                message.msg = 'success';
            } else {
                message.msg = 'fail';
            }
            res.write(JSON.stringify(message));
            res.end();
        });
    },
    unBindRole: function(req, res, action) {
        var userId = req.body.userId;
        var roleId = req.body.roleId;
        var sql = "delete from sys_user_role where USER_ID = " + userId + " and ROLE_ID = " + roleId;
        query(sql, function(qerr, result) {
            var message = {};
            if (result != undefined && result != null) {
                message.msg = 'success';
            } else {
                message.msg = 'fail';
            }
            res.write(JSON.stringify(message));
            res.end();
        });
    }
}
module.exports = sys_user_role;

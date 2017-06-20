var actionUtil = require("../framework/action/actionUtils")();
var query = actionUtil.query;
var sql = require('sql-query'),
    sqlQuery = sql.Query();
var async = require("async");
var logger = require('log4js').getLogger('system');

var message = {
    flag: 0,
    message: '成功',
    data: null
}

var system_role = {
    roleJsonList: function (req, res) {
        var offset = +req.query.offset || 0,
            limit = +req.query.limit || 20,
            name = req.query.sort,
            order = req.query.order || 'asc',
            i,
            max = offset + limit,
            result = {
                total: +req.query.total || 0,
                rows: []
            };
        var roleName = req.body.roleName;
        var companyId = req.session.user.ENTERPRISE_ID;
        var companyIdSql = '';
        if (companyId) {
            companyIdSql = 'ENTERPRISE_ID = ' + companyId;
        } else {
            companyIdSql = 'ENTERPRISE_ID is null'
        }
        var sql = "SELECT * FROM sys_role where " + companyIdSql;
        if (roleName != undefined && roleName != null && roleName != "") {
            sql += "  and role_name like '%" + roleName + "%'";
        }
        if (name != undefined && name != null && name != "") {
            sql += " order by " + name;
            if (order != undefined && order != null && order != "") {
                sql += " " + order;
            }
        }
        logger.debug('查询角色列表' + sql);
        query("SELECT COUNT(*) as SIZE FROM ( " + sql + ") tmp_count_t", function (err, rows, columns) {
            var size = rows[0].SIZE;
            sql += " limit " + offset + "," + limit;
            query(sql, function (err, rows, columns) {
                if (err == null) {
                    result.total = size;
                    result.rows = rows;
                    res.json(result);
                } else {
                    console.log(err)
                }
            });
        });
    },
    roleById: function (req, res) {
        var id = req.body.id;
        var sql = "SELECT * FROM sys_role where role_id = " + id;
        query(sql, function (err, rows, columns) {
            if (err == null) {
                res.json(rows);
            } else {
                console.log(err)
            }
        });
    },
    addRole: function (req, res, action) {
        var roleName = req.body.roleName;
        var desc = req.body.desc;
        var companyId = req.session.user.ENTERPRISE_ID;
        if (roleName != undefined && roleName != null && roleName != "") {
            var sql = "insert into sys_role (ROLE_NAME,DESCRIPTION,ENTERPRISE_ID) " +
                " values ('" + roleName + "','" + desc + "'," + companyId + ")";
            logger.debug('添加角色' + sql);
            query(sql, function (qerr, result) {
                var message = {};
                if (result != undefined && result != null) {
                    message.msg = 'success';
                } else {
                    message.msg = 'fail';
                }
                res.write(JSON.stringify(message));
                res.end();
            });
        } else {
            return res.redirect("/");
        }
    },
    removeRole: function (req, res, action) {
        var id = req.body.id;
        if (id != undefined && id != null && id != "") {
            async.waterfall([
                function (callback) {
                    var sql = "SELECT count(*) as count from sys_user_role where ROLE_ID = " + id;
                    logger.debug('获取用户绑定角色sql：' + sql);
                    query(sql, function (err, rows) {
                        if (err) {
                            logger.error('删除角色获取用户绑定的角色信息错误:' + err);
                            message.flag = -1;
                            message.message = '删除角色错误';
                            message.data = null;
                            res.json(message);
                            return;
                        }
                        if (rows[0] && rows[0].count > 0) {
                            message.flag = -1;
                            message.message = '该角色正在使用中';
                            message.data = null;
                            res.json(message);
                            return;
                        } else {
                            callback(null);
                        }
                    });
                },
                function (callback) {
                    var sql = "delete from sys_role_page where role_id = " + id;
                    logger.debug('删除角色绑定菜单sql：' + sql);
                    query(sql, function (err, rows) {
                        if (err) {
                            logger.error('删除角色删除角色绑定菜单信息错误:' + err);
                            message.flag = -1;
                            message.message = '删除角色错误';
                            message.data = null;
                            res.json(message);
                            return;
                        } else {
                            callback(null);
                        }
                    });
                },
                function (callback) {
                    var sql = "delete from sys_role where role_id = " + id;
                    logger.debug('删除角色sql：' + sql);
                    query(sql, function (err, rows) {
                        if (err) {
                            logger.error('删除角色信息错误' + err);
                            message.flag = -1;
                            message.message = '删除角色错误';
                            message.data = null;
                            res.json(message);
                        } else {
                            message.flag = 0;
                            message.message = 'OK';
                            message.data = null;
                            res.json(message);
                            return;
                        }
                    });
                }
            ], function (err) {
                if (err) {
                    message.flag = -1;
                    message.message = '删除角色错误';
                    message.data = null;
                    res.json(message);
                } else {
                    message.flag = 0;
                    message.message = 'OK';
                    message.data = null;
                    res.json(message);
                }

            });
        } else {
            return res.redirect("/");
        }
    },
    editRole: function (req, res, action) {
        var id = req.body.id;
        var roleName = req.body.roleName;
        var desc = req.body.desc;
        if (id != undefined && id != null && id != "") {
            var sql = "update sys_role set ROLE_NAME = '" + roleName + "', DESCRIPTION = '" + desc + "' where role_id = " + id;
            query(sql, function (qerr, result) {

                var message = {};
                if (result != undefined && result != null) {
                    message.msg = 'success';
                } else {
                    message.msg = 'fail';
                }
                res.write(JSON.stringify(message));
                res.end();

            });

        } else {
            return res.redirect("/");
        }

    },
    validateRoleName: function (req, res) {
        var roleName = req.body.roleName;
        var companyId = req.session.user.ENTERPRISE_ID;
        var companyIdSql = '';
        if (companyId) {
            companyIdSql = 'ENTERPRISE_ID = ' + companyId;
        } else {
            companyIdSql = 'ENTERPRISE_ID is null'
        }
        var sql = "SELECT count(ROLE_ID) as count FROM sys_role where ROLE_NAME = '" + roleName + "'" + " and " + companyIdSql;
        var message = {};
        logger.debug('验证角色名是否重复' + sql);
        query(sql, function (err, rows, columns) {
            if (rows[0].count > 1) {
                message.msg = 'true';
            } else {
                message.msg = 'false';
            }
            res.json(message);
        });
    }
}

module.exports = system_role;
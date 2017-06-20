var actionUtil = require("../framework/action/actionUtils")();
var query = actionUtil.query;
var moduleName = "system";
var async = require("async");
var sql = require('sql-query'),
    sqlQuery = sql.Query();
var log4js = require('log4js');
var logger = log4js.getLogger('system');
var message = {
    flag: 0,
    message: '成功',
    data: null
}

var sys_role_page = {
    getAllPageByRole: function(req, res, action) {
        var roleId = req.body.roleId;
        async.waterfall(
            [
                function(callback) {
                    var sql = 'SELECT page_ID as pageId,PRE_PAGE_ID as prePageId,page_NAME as pageName,url as url,level_Code as levelCode FROM sys_page WHERE IS_DELETED = 0 and PAGE_TYPE_ID <> 3 or PAGE_TYPE_ID is null';
                    logger.debug('获取菜单数据sql：' + sql);
                    query(sql, function(err, rows) {
                        if (err) {
                            logger.error('获取角色信息失败');
                            message.flag = -1;
                            mesage.message = '获取角色信息失败';
                            message.data = null;
                            res.json(message);
                            return;
                        }
                        callback(null, rows);
                    });
                },
                function(pageRows, callback) {
                    var levelCodeArray = new Array();
                    var levelCodes = '';
                    for (var i in pageRows) {
                        var obj = pageRows[i];
                        var levelCode = obj.levelCode;
                        if (!levelCode) {
                            continue;
                        }
                        var length = levelCode.length;
                        while (length) {
                            var code = levelCode.substring(0, length);
                            if (levelCodeArray.indexOf(code) == -1) {
                                levelCodeArray.push(code);
                                levelCodes += '"' + code + '",';
                            }
                            length -= 2;
                        }
                    }
                    if (!levelCodes) {
                        message.flag = 0;
                        message.data = null;
                        message.message = 'OK';
                        res.json(message);
                        return;
                    } else {
                        levelCodes = levelCodes.substring(0, levelCodes.length - 1);
                        var sql = 'SELECT page_ID as pageId,PRE_PAGE_ID as prePageId,page_NAME as pageName,url as url FROM sys_page WHERE IS_DELETED = 0 and level_Code in (' + levelCodes + ')';
                        logger.debug('查询角色菜单信息sql:' + sql);
                        query(sql, function(err, rows) {
                            if (err) {
                                logger.error('获取角色信息失败');
                                message.flag = -1;
                                mesage.message = '获取角色信息失败';
                                res.json(message);
                                return;
                            } else {
                                for (var i = 0; i < rows.length; i++) {
                                    rows[i].isBind = 0;
                                }
                                callback(null, rows);
                            }
                        });
                    }
                },
                function(pageData, callback) {
                    var roleSql = "select page_ID as pageId from sys_role_page where role_id = " + roleId;
                    logger.debug('获取角色菜单信息sql:' + roleSql);
                    query(roleSql, function(err, rows) {
                        if (err) {
                            logger.error('获取角色菜单信息失败');
                            message.flag = -1;
                            mesage.message = '获取角色菜单信息失败';
                            res.json(message);
                            return;
                        }
                        var userData = rows;
                        for (var i = 0; i < pageData.length; i++) {
                            for (var j = 0; j < userData.length; j++) {
                                if (pageData[i].pageId == userData[j].pageId) {
                                    pageData[i].isBind = 1;
                                    break;
                                }
                            }
                        }
                        message.flag = 0;
                        message.message = 'OK';
                        message.data = pageData;
                        res.json(message);
                        return;
                    });
                }
            ],
            function(err, result) {
                if (err) {
                    logger.error('获取角色菜单信息失败');
                    message.flag = -1;
                    message.message('获取角色菜单信息失败');
                    message.json(message);
                    return;
                }
                logger.info('获取角色菜单信息成功');
            });
    },
    bindPage: function(req, res, action) {
        var roleId = req.body.roleId;
        var pageId = req.body.pageId;
        var sql = "insert into sys_role_page (ROLE_ID,PAGE_ID) " +
            "values ('" + roleId + "','" + pageId + "')";
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
    unBindPage: function(req, res, action) {
        var roleId = req.body.roleId;
        var pageId = req.body.pageId;
        var sql = "delete from sys_role_page where ROLE_ID = " + roleId + " and PAGE_ID = " + pageId;
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
module.exports = sys_role_page;
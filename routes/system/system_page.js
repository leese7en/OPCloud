var actionUtil = require("../framework/action/actionUtils")();
var query = actionUtil.query;
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
var system_page = {
    /**
     * 获取用户菜单信息
     * @param req
     * @param res
     */
    getMenuPage: function (req, res) {
        var userId = req.session.user.USER_ID;
        async.waterfall(
            [
                function (callback) {
                    var sqlUserPage = 'SELECT p.page_ID AS pageId, p.page_Name AS pageName, p.icon AS icon, p.PRE_PAGE_ID AS prePageId, p.LEVEL_CODE AS levelCode, orderCode AS orderCode, p.url AS url,  p.DESCRIPTION AS description, p.PAGE_TYPE_ID AS pageTypeId FROM sys_user_page up  LEFT JOIN sys_page p ON up.PAGE_ID = p.PAGE_ID WHERE USER_ID = ' + userId;
                    logger.debug('查询用户直接绑定的菜单sql：' + sqlUserPage);
                    query(sqlUserPage, function (err, rows) {
                        if (err) {
                            logger.error('获取用户绑定的菜单信息失败：' + err);
                            message.flag = -1;
                            message.message = '获取用户菜单信息是失败';
                            res.json(message);
                            return;
                        } else {
                            callback(null, rows);
                        }
                    });
                },
                function (rowsPages, callback) {
                    var sqlUserRole = 'SELECT p.page_ID AS pageId, p.page_Name AS pageName, p.icon AS icon, p.PRE_PAGE_ID AS prePageId, p.LEVEL_CODE AS levelCode, orderCode AS orderCode, p.url AS url, p.DESCRIPTION AS description, p.PAGE_TYPE_ID AS pageTypeId FROM sys_user_role ur LEFT JOIN sys_role_page rp ON ur.ROLE_ID = rp.ROLE_ID LEFT JOIN sys_page p ON rp.PAGE_ID = p.PAGE_ID WHERE ur.USER_ID =' + userId;
                    logger.debug('查询用户直接绑定的角色菜单sql：' + sqlUserRole);
                    query(sqlUserRole, function (err, rows) {
                        if (err) {
                            logger.error('查询用户直接绑定的角色菜单信息失败：' + err);
                            message.flag = -1;
                            message.message = '获取用户角色菜单信息是失败';
                            res.json(message);
                            return;
                        } else {
                            callback(null, rowsPages, rows);
                        }
                    });
                },
                function (userPages, userRoles, callback) {
                    var levelCodes = new Array();
                    for (var i in userPages) {
                        var obj = userPages[i];
                        var levelCode = obj.levelCode;
                        if (!levelCode) {
                            continue;
                        }
                        var length = levelCode.length;
                        while (length) {
                            var code = levelCode.substring(0, length);
                            if (levelCodes.indexOf(code) == -1) {
                                levelCodes.push(code);
                            }
                            length -= 2;
                        }
                    }
                    for (var i in userRoles) {
                        var obj = userRoles[i];
                        var levelCode = obj.levelCode;
                        if (!levelCode) {
                            continue;
                        }
                        var length = levelCode.length;
                        while (length) {
                            var code = levelCode.substring(0, length);
                            if (levelCodes.indexOf(code) == -1) {
                                levelCodes.push(code);
                            }
                            length -= 2;
                        }
                    }
                    callback(null, levelCodes);
                },
                function (levelCodes, callback) {
                    var sqlPage = sqlQuery.select().from('sys_page').select('page_ID').as('pageId').select('page_Name').as('pageName').select('icon').as('icon').select('PRE_PAGE_ID').as('prePageId').select('LEVEL_CODE').as('levelCode').select('url').as('url').select('DESCRIPTION').as('description').select('PAGE_TYPE_ID').as('pageTypeId').where({LEVEL_CODE: levelCodes}).build();
                    logger.debug('查询用户用户绑定的菜单sql：' + sqlPage);
                    query(sqlPage, function (err, rows) {
                        if (err) {
                            logger.error('获取使用菜单失败：' + err);
                            message.flag = -1;
                            message.message = "获取数据失败";
                            res.json(message);
                            return;
                        } else {
                            message.flag = 0;
                            message.data = rows;
                            res.json(message);
                        }
                    });
                }
            ],
            function (err, result) {
                if (err) {
                    logger.debug('查询用户绑定的菜单信息错误：' + err);
                } else {
                    logger.debug('获取用户菜单信息');
                }
            }
        )
    },
    /**
     * 模糊查询数据
     * @param req
     * @param res
     */
    blurryPage: function (req, res) {
        var pageName = req.body.pageName,
            pageDesc = req.body.pageDesc;

        var sql = "SELECT PAGE_ID AS pageId, PRE_PAGE_ID AS prePageId,orderCode AS orderCode,page_name AS pageName, URL AS url,DESCRIPTION AS description,IS_DELETED AS isDeleted,";
        sql += 'icon as icon,PAGE_TYPE_ID AS pageTypeId,IS_ENABLE AS isEnable FROM sys_page  where IS_DELETED = 0 ';
        if (pageName) {
            sql += ' and  page_name like "%' + pageName + '%"';
        }
        if (pageDesc) {
            sql += ' and  description like "%' + pageDesc + '%"';
        }

        query(sql, function (err, rows, columns) {
            if (err == null) {
                message.flag = 0;
                message.data = rows;
                res.json(message);
            } else {
                message.flag = -1;
                message.message = "获取数据失败";
                res.json(message);
            }
        });
    },
    getPageById: function (req, res) {
        var pageId = req.body.pageId;
        var sql = "SELECT PAGE_ID AS pageId, PRE_PAGE_ID AS prePageId,orderCode AS orderCode,page_name AS pageName, URL AS url,DESCRIPTION AS description," +
            "IS_DELETED AS isDeleted,icon as icon,PAGE_TYPE_ID AS pageTypeId,IS_ENABLE AS isEnable FROM sys_page  where IS_DELETED = 0 and page_id = " + pageId;
        if (pageId != undefined && pageId != null && pageId != "") {
            query(sql, function (err, rows, columns) {
                if (err != null) {
                    message.flag = -1;
                    message.message = '获取数据异常';
                    res.json(message);
                } else if (rows.length < 1) {
                    message.flag = -1;
                    message.message = '当前对应编码没有获取到数据';
                    res.json(message);
                } else {
                    message.flag = 0;
                    message.data = rows[0];
                    res.json(message);
                }
            });
        } else {
            return res.redirect("/");
        }
    },
    addPage: function (req, res, action) {
        var body = req.body;
        var prePageId = body.prePageId,
            pageName = body.pageName,
            url = body.pageUrl,
            pageIcon = body.pageIcon,
            orderCode = body.orderCode,
            pageDesc = body.pageDesc;
        if (pageName) {
            async.waterfall(
                [
                    function (callback) {
                        var sqlCon = "select count(1) as count from sys_page where is_deleted = 0 and " +
                            "pre_page_id = " + "'" + prePageId + "'" + " and page_Name = " + "'" + pageName + "'";
                        logger.debug('查看是否存在同名菜单 sql:' + sqlCon);
                        query(sqlCon, function (err, rows, columns) {
                            if (rows[0].count > 0) {
                                logger.warning('当前目录下存在同名菜单');
                                message.flag = -1;
                                message.message = '当前级别下存在相同名称的菜单';
                                res.json(message);
                                return;
                            } else {
                                callback(null);
                            }
                        });
                    },
                    function (callback) {
                        var sqlLevelCode = 'select max(LEVEL_CODE) as code from sys_page where PRE_PAGE_ID = ' + prePageId;
                        logger.debug('获取菜单levelcode sql:' + sqlLevelCode);
                        query(sqlLevelCode, function (err, result) {
                            if (err) {
                                logger.debug('获取同级目录下的菜单LEVELCODE失败');
                                message.flag = -1;
                                message.message = '获取同级目录下的菜单LEVELCODE失败';
                                res.json(message);
                                return;
                            } else {
                                var levelCode = result[0].code;
                                if (levelCode) {
                                    levelCode = parseInt(levelCode) + 1;
                                    callback(null, levelCode);
                                } else {
                                    var sqlPrePageLevelCode = 'select LEVEL_CODE as code from sys_page where PAGE_ID = ' + prePageId;
                                    logger.error('当父菜单不存在子菜单时sql:' + sqlPrePageLevelCode);
                                    query(sqlPrePageLevelCode, function (err, rows) {
                                        if (err) {
                                            logger.debug('获取父菜单LEVELCODE失败');
                                            message.flag = -1;
                                            message.message = '获取父菜单LEVELCODE失败';
                                            res.json(message);
                                            return;
                                        } else {
                                            var levelCode = rows[0].code;
                                            levelCode += '10';
                                            callback(null, levelCode);
                                        }
                                    });
                                }
                            }
                        });
                    },
                    function (levelCode, callback) {
                        var sql = "insert into sys_page (pre_page_id,level_code,page_name,url,description,icon,orderCode) " +
                            "values ('" + prePageId + "','" + levelCode + "','" + pageName + "','" + url + "','" + pageDesc + "','" + pageIcon + "','" + orderCode + "')";
                        query(sql, function (err, result) {
                            if (result != undefined && result != null) {
                                message.flag = 0;
                                res.json(message);
                            } else {
                                message.flag = -1;
                                message.message = '添加菜单失败';
                                res.json(message);
                            }
                        });
                    }
                ],
                function (err, result) {
                    if (err) {
                        logger.error('插入菜单失败');
                        message.flag = -1;
                        message.message = '添加菜单失败';
                        res.json(message);
                    } else {
                        logger.warn('插入菜单');
                    }
                });
        } else {
            return res.redirect("/");
        }
    },
    /**
     * 删除 页面
     * @param req
     * @param res
     * @param action
     */
    deletePage: function (req, res, action) {
        var pageId = req.body.pageId;
        if (pageId != undefined && pageId != null && pageId != "") {
            var sql = "update sys_page set is_deleted = 1 where page_id = " + pageId;
            query(sql, function (err, result) {
                if (result != undefined && result != null) {
                    message.flag = 0;
                    message.message = '删除成功';
                    res.json(message);
                } else {
                    message.flag = -1;
                    message.message = '删除数据失败';
                    res.json(message);
                }
            });
        } else {
            return res.redirect("/");
        }
    },
    /**
     * 更新菜单信息
     * @param req
     * @param res
     * @param action
     */
    updatePage: function (req, res, action) {
        var body = req.body;
        var pageId = body.pageId,
            prePageId = body.prePageId,
            pageName = body.pageName,
            pageUrl = body.pageUrl,
            pageIcon = body.pageIcon,
            orderCode = body.orderCode,
            pageDesc = body.pageDesc
        if (pageId) {
            // 更新的时候不能查本身，因此需要id！=自身
            async.waterfall(
                [
                    function (callback) {
                        var sqlCon = "select count(1) as count from sys_page where is_deleted = 0 and " +
                            "pre_page_id = " + "'" + prePageId + "'" + " and page_Name = " + "'" + pageName + "'" + " and page_id != " + "'" + pageId + "'";
                        logger.debug('查看是否存在同名菜单 sql:' + sqlCon);
                        query(sqlCon, function (err, rows, columns) {
                            if (rows[0].count > 0) {
                                logger.warning('当前目录下存在同名菜单');
                                message.flag = -1;
                                message.message = '当前级别下存在相同名称的菜单';
                                res.json(message);
                                return;
                            } else {
                                callback(null);
                            }
                        });
                    },
                    function (callback) {
                        var sqlLevelCode = 'select max(LEVEL_CODE) as code from sys_page where PRE_PAGE_ID = ' + prePageId;
                        logger.debug('获取菜单levelcode sql:' + sqlLevelCode);
                        query(sqlLevelCode, function (err, result) {
                            if (err) {
                                logger.debug('获取同级目录下的菜单LEVELCODE失败');
                                message.flag = -1;
                                message.message = '获取同级目录下的菜单LEVELCODE失败';
                                res.json(message);
                                return;
                            } else {
                                var levelCode = result[0].code;
                                if (levelCode) {
                                    levelCode = parseInt(levelCode) + 1;
                                    callback(null, levelCode);
                                } else {
                                    var sqlPrePageLevelCode = 'select LEVEL_CODE as code from sys_page where PAGE_ID = ' + prePageId;
                                    logger.error('当父菜单不存在子菜单时sql:' + sqlPrePageLevelCode);
                                    query(sqlPrePageLevelCode, function (err, rows) {
                                        if (err) {
                                            logger.debug('获取父菜单LEVELCODE失败');
                                            message.flag = -1;
                                            message.message = '获取父菜单LEVELCODE失败';
                                            res.json(message);
                                            return;
                                        } else {
                                            var levelCode = rows[0].code;
                                            levelCode += '10';
                                            callback(null, levelCode);
                                        }
                                    });
                                }
                            }
                        });
                    },
                    function (levelCode, callback) {
                        var sql = "update sys_page set " + "page_NAME = '" + pageName + "', pre_page_id  = '" + prePageId + "', url  = '" + pageUrl + "', icon  = '" + pageIcon + "', orderCode  = '" + orderCode + "', description  = '" + pageDesc + "', LEVEL_CODE  = '" + levelCode + "' where page_id = " + pageId;
                        logger.debug('更新菜单信息sql:' + sql);
                        query(sql, function (err, result) {
                            if (result != undefined && result != null) {
                                message.flag = 0;
                                message.message = '更新成功';
                                res.json(message);
                                return;
                            } else {
                                message.flag = -1;
                                message.message = '更新数据失败'
                                res.json(message);
                                return;
                            }
                        });
                    }
                ],
                function (err, result) {
                    if (err) {
                        logger.error('插入菜单失败');
                        message.flag = -1;
                        message.message = '添加菜单失败';
                        res.json(message);
                    } else {
                        logger.warn('插入菜单');
                    }
                });
        } else {
            return res.redirect("/");
        }
    },
    /**
     * 获取上级菜单数据
     * @param req
     * @param res
     * @param action
     */
    getAllPrePage: function (req, res, action) {
        var sql = 'SELECT page_ID as pageId,PRE_PAGE_ID as prePageId,page_NAME as pageName FROM sys_page WHERE IS_DELETED = 0';
        logger.debug('获取上级菜单数据sql：' + sql);
        query(sql, function (err, rows, columns) {
            if (err == null) {
                message.flag = 0;
                message.data = rows;
                res.json(message);
            } else {
                logger.error('获取上级菜单数据失败：' + err);
                message.flag = -1;
                message.message = '获取上级菜单数据失败';
                res.json(message);
            }
        });
    }
}

module.exports = system_page;

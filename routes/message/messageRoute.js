var actionUtil = require("../framework/action/actionUtils")();
var async = require("async");
var query = actionUtil.query;
var moduleName = "message";
var logger = require('log4js').getLogger('system');
var opPool = require('../openplant/openPlantPool');
var transaction = actionUtil.transaction;
var Utils = require('../utils/tools/utils');
var sql = require('sql-query'),
    sqlQuery = sql.Query();
var message = {
    flag: 0,
    message: '成功',
    data: null
}

var messageMQ = {
    //ajax 列出设置界面里的面板信息
    indexMessage: function (req, res, action) {
        var userId = req.session.user.USER_ID;
        var isSystem = req.session.user.IS_SYSTEM;
        var sql = "select CONCAT(a.page_id, '|', a.URL) as value,a.PAGE_NAME as name,IF (b.PAGE_NO = 0, 0, 1) AS checked FROM sys_user_page b left join sys_page a on b.PAGE_ID = a.PAGE_ID where a.PAGE_TYPE_ID = '3' and b.USER_ID = " + userId + " order by a.orderCode";
        logger.debug('获取订阅的消息sql:' + sql);
        query(sql, function (err, rows, columns) {
            if (err) {
                logger.error('获取订阅信息错误：' + err);
                message.flag = -1;
                message.message = '获取订阅信息失败';
                message.data = null;
                res.json(message);
                return;
            } else {
                message.flag = 0;
                message.message = 'OK';
                message.data = rows;
                res.json(message);
                return;
            }
        });
    },
    //ajax 用户添加或删除首页面板
    editIndexMessage: function (req, res, action) {
        var userId = req.session.user.USER_ID;
        var panelId = req.body.panelId;
        var isChecked = req.body.isChecked;
        var panelNo = req.body.panelNo;
        //显示首页信息
        if (isChecked == 1) {
            async.waterfall(
                [
                    function (callback) {
                        var sql = 'SELECT ifnull(MAX(PAGE_NO),0)+1 as value FROM sys_user_page WHERE user_id = ' + userId;
                        logger.debug('获取首页布局的最大PAGE_NO sql:' + sql);
                        query(sql, function (err, rows) {
                            if (err || rows.length < 1) {
                                logger.error('获取首页布局的最大PAGE_NO错误：' + err);
                                message.flag = -1;
                                message.message = '更新首页订阅信息PAGE_NO';
                                message.data = null;
                                res.json(message);
                                return;
                            } else {
                                callback(null, rows[0].value);
                            }
                        });
                    },
                    function (maxId, callback) {
                        var sql = 'update sys_user_page set PAGE_NO = ' + maxId + ' where USER_ID = ' + userId + ' and PAGE_ID = ' + panelId;
                        logger.debug('更新首页订阅信息PAGE_NO sql:' + sql);
                        query(sql, function (err, rows) {
                            if (err) {
                                logger.error('更新首页订阅信息PAGE_NO' + err);
                                message.flag = -1;
                                message.message = '更新首页订阅信息PAGE_NO失败';
                                message.data = null;
                                res.json(message);
                                return;
                            } else {
                                message.flag = 0;
                                message.message = 'OK';
                                message.data = null;
                                res.json(message);
                                return;
                            }
                        });
                    }
                ],
                function (err, rows) {
                    if (err) {
                        logger.error('更新首页订阅信息PAGE_NO' + err);
                        message.flag = -1;
                        message.message = '更新首页订阅信息PAGE_NO失败';
                        message.data = null;
                        res.json(message);
                        return;
                    } else {
                        message.flag = 0;
                        message.message = 'OK';
                        message.data = null;
                        res.json(message);
                        return;
                    }
                });
        } else {
            //取消首页信息
            var sql = sqlQuery.update().into('sys_user_page').set({PAGE_NO: 0}).where({USER_ID: userId, PAGE_ID: panelId}).build();
            logger.debug('首页取消显示消息sql：' + sql);
            query(sql, function (err, rows) {
                if (err) {
                    logger.error('首页取消显示消息错误：' + err);
                    message.flag = -1;
                    message.message = '首页取消显示消息失败';
                    message.data = null;
                    res.json(message);
                    return;
                } else {
                    message.flag = 0;
                    message.message = 'OK';
                    message.data = null;
                    res.json(message);
                    return;
                }
            });
        }

        // if (isChecked == 1) { //如果添加，插入该面板和用户关联
        //     tasks = ['insertNewPage'];
        //     sqls = {
        //         'insertNewPage': 'insert into sys_user_page(USER_ID,PAGE_ID,PAGE_NO  ) SELECT ' + userId + ',' + panelId + ',ifnull(MAX(PAGE_NO),0)+1 FROM sys_user_page WHERE user_id = ' + userId
        //     };
        // } else if (isChecked == 2) { //更新
        //     tasks = ['updatePanelNo', 'updatePrePanelNo', 'updateMovedPanelNo'];
        //     sqls = {
        //         'updatePanelNo': 'update sys_user_page set PAGE_NO = (PAGE_NO + 2) where PAGE_NO >= ' + panelNo + ' and PAGE_NO%2 = ' + (panelNo % 2) + ' and USER_ID =' + userId,
        //         'updatePrePanelNo': 'update sys_user_page  a,(SELECT PAGE_NO FROM sys_user_page WHERE PAGE_ID = ' + panelId + ') b SET a.PAGE_NO = (a.PAGE_NO - 2) WHERE a.PAGE_NO > b.PAGE_NO and a.PAGE_NO%2 = b.PAGE_NO%2 and USER_ID =' + userId,
        //         'updateMovedPanelNo': 'update sys_user_page set PAGE_NO = ' + panelNo + ' where PAGE_ID = ' + panelId + ' and USER_ID =' + userId
        //     };
        // } else {
        //     //如果删除，将该面板编号后的面板编号-1，删除该面板和用户关联
        //     tasks = ['updatePages', 'deletePage'];
        //     sqls = {
        //         'updatePages': 'update sys_user_page  a,(SELECT PAGE_NO FROM sys_user_page WHERE PAGE_ID = ' + panelId + ') b SET a.PAGE_NO = (a.PAGE_NO - 2) WHERE a.PAGE_NO > b.PAGE_NO and a.PAGE_NO%2 = b.PAGE_NO%2 and USER_ID =' + userId,
        //         'deletePage': 'delete from sys_user_page where USER_ID =' + userId + ' and PAGE_ID = ' + panelId
        //     };
        // }
    },
    //ajax 列出首页面板
    getIndexMessage: function (req, res, action) {
        var userId = req.session.user.USER_ID;
        var sql = "select b.PAGE_ID as pageId,b.PAGE_NAME,b.URL as pageUrl,a.PAGE_NO as pageNo from sys_user_page a inner join sys_page b on a.PAGE_ID = b.PAGE_ID where b.PAGE_TYPE_ID = 3 and a.USER_ID = " + userId + " order by a.PAGE_NO";
        logger.debug('获取首页显示的信息sql：' + sql);
        query(sql, function (err, rows, columns) {
            if (err) {
                logger.error('获取首页显示的信息错误：' + err);
                message.flag = -1;
                message.message = '获取首页显示的信息失败';
                message.data = null;
                res.json(message);
                return;
            } else {
                message.flag = 0;
                message.message = 'OK';
                message.data = rows;
                res.json(message);
                return;
            }
        });
    }
};
module.exports = messageMQ;

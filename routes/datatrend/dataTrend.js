var log4js = require('log4js');
var async = require('async');
var logger = log4js.getLogger('system');
var actionUtil = require("../framework/action/actionUtils")();
var async = require("async");
var query = actionUtil.query;
var GlobalAgent = require('../message/GlobalAgent');

var message = {
    flag: 0,
    message: '成功',
    data: null
}

var dataTrend = {
    /**
     * 获取用户菜单信息
     * @param req
     * @param res
     */
    getPoint: function (req, res) {
        var user = req.session.user;
        var keyWord = req.query.keyWord;
        if (keyWord) {
            keyWord = keyWord.toUpperCase();
        }
        var domainId = GlobalAgent.getUserDomain(user.USER_ID);
        if (!domainId) {
            message.flag = -1;
            message.data = [];
            message.message = '没有对应的域';
            res.send(message);
            return;
        }
        var sql = "select id as id,UUID as UUID,URI as name from sys_point  where URI like '%" + keyWord.replace(/_/g, '\\_') + "%' and DOMAIN_ID in (" + domainId.toString() + ") limit 0,10";
        logger.debug('获取满足条件的前十个点:' + sql);
        query(sql, function (error, rows) {
            if (error) {
                message.flag = -1;
                message.data = [];
                message.message = '获取数据失败';
            } else {
                message.flag = 0;
                message.data = rows;
            }
            res.send(message);
        });
    },
    /**
     * 查看点是否存在
     * @param req
     * @param res
     */
    pointExist: function (req, res) {
        var user = req.session.user;
        var keyWord = req.query.keyWord;
        if (keyWord) {
            keyWord = keyWord.toUpperCase();
        }
        var domainId = GlobalAgent.getUserDomain(user.USER_ID);
        if (!domainId) {
            message.flag = -1;
            message.data = [];
            message.message = '没有对应的域';
            res.send(message);
            return;
        }
        var sql = "select count(ID) as count from sys_point where URI like '%" + keyWord.replace(/_/g, '\\_') + "%' and DOMAIN_ID in (" + domainId.toString() + ")";
        logger.debug('指定条件的点是否存在:' + sql);
        query(sql, function (error, rows) {
            if (error) {
                logger.error('获取点是否存在错误:' + error);
                message.flag = -1;
                message.data = [];
                message.message = '获取失败';
                res.send(message);
                return;
            }
            else if (rows && rows[0].count > 0) {
                message.flag = 0;
                message.message = 'OK';
                message.data = rows[0].count;
                res.send(message);
                return;
            } else {
                message.flag = -1;
                message.data = [];
                message.message = '没有获取到满足条件的数据';
                res.send(message);
                return;
            }
        });
    }
}

module.exports = dataTrend;

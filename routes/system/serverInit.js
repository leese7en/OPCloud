var actionUtil = require("../framework/action/actionUtils")();
var query = actionUtil.query;
var logger = require('log4js').getLogger('system');
var message = {
    flag: 0,
    message: '成功',
    data: null
};
var serverInit = {
    initUserOnline: function () {
        var sql = 'update sys_user set is_online = 0'
        query(sql, function (err, rows) {
            if (err) {
                logger.error('重启服务修改用户在线状态错误：' + err);
            } else {
                logger.debug('修改用户状态成功');
            }
        });

    }
};
module.exports = serverInit;
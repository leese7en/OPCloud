var opPool = require('../openplant/openPlantPool')
var opapi = require('opapi');
var async = require('async');
var logger = require('log4js').getLogger('api');
var GlobalAgent = require('../message/GlobalAgent')
var APIUtils = require('../utils/tools/APIUtils');
var message = {
    flag: 0,
    message: '成功',
    data: null
}
var querySocket = {
    socketOn: function (socket) {
        /**
         * 添加点信息
         */
        socket.on('api/sql', function (data) {
            var mess = GlobalAgent.getAPInfo(socket.id, APIUtils.RUN_SQL);
            var domainId = mess.domainId;
            if (!domainId || domainId.length < 1) {
                message.flag = -1;
                message.message = '当前用户没有域';
                message.total = 0;
                message.data = [];
                socket.emit('api/sql', message);
                return;
            }

            if (mess.flag < 0) {
                socket.emit('api/sql', {
                    flag: -1,
                    message: mess.message,
                    data: null
                });
                return;
            }
            var sql = data.sql;

            if (sql) {
                logger.debug('API查询sql：' + sql);
                opPool.query(sql, function (error, rows, columns) {
                    if (error) {
                        socket.emit('api/sql', {
                            flag: -1,
                            message: error
                        });
                    } else {
                        socket.emit('api/sql', {
                            flag: 0,
                            data: rows,
                            columns: columns
                        });
                    }
                });
            } else {
                socket.emit('api/sql', {
                    flag: -1,
                    message: "SQL ERROR!"
                });
            }
        });
    }
}
module.exports = querySocket;

var logger = require('log4js').getLogger('model');
var taskSocket = require('../model/taskSocket');
var sparkSocket = require('../model/sparkSocket');
var GlobalAgent = require('../message/GlobalAgent');
var message = {
    flag: 0,
    message: 'OK',
    data: null
};

var wsServer = {
    socketOn: function (ws) {
        var that = this;
        ws.on('request', function (request) {
            var socket = request.accept(null, request.origin);
            logger.warn('spark conn:' + new Date());
            GlobalAgent.sparkSocket = socket;
            // setInterval(function () {
            // }, 10000)
            //刷新任务缓存
            // taskSocket.refreshCache();
            socket.on('message', function (data) {
                if (data.type === 'utf8') {
                    var value = data.utf8Data;
                    if (typeof (value) == 'string') {
                        value = JSON.parse(data.utf8Data)
                    }
                    that.on(value);
                } else {
                    var methodPort = data.utf8Data.methodPort;
                    message.flag = -1;
                    message.message = '编码格式不正确';
                    message.data = null;
                    that.emit(parseInt(methodPort) + 1, message);
                }
            });
            socket.on('close', function (connection) {
                logger.warn('spark disconn:' + new Date());
                GlobalAgent.sparkSocket = null;
            });
        });
    },
    /**
     * 发送数据给spark
     * @param method
     * @param data
     */
    emit: function (methodPort, data) {
        if (GlobalAgent.sparkSocket) {
            data.methodPort = methodPort;
            if (typeof (data) == 'object') {
                GlobalAgent.sparkSocket.sendUTF(JSON.stringify(data));
            } else {
                GlobalAgent.sparkSocket.sendUTF(data);
            }
        }
    },
    /**
     * 监听 spark数据
     * @param method
     * @param data
     */
    on: function (data) {
        var methodPort = data.methodPort;
        delete  data.methodPort;
        switch (methodPort) {
            case GlobalAgent.START_MESSAGE:
                sparkSocket.startMessage(data);
                break;
            case GlobalAgent.TASK_STATUS:
                sparkSocket.taskStatus(data);
                break;
            case GlobalAgent.STOP_MESSAGE:
                sparkSocket.stopMessage(data);
                break;
            default:
                message.flag = -1;
                message.message = '编码格式不正确';
                message.data = null;
                this.emit(GlobalAgent.DEFAULT_MESSAGE, message);
        }
    }
}

module.exports = wsServer;


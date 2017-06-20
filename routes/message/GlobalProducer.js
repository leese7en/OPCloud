/**
 * 全局生产者
 * @constructor
 */


var GlobalProducer = {
    /**
     * 通知任务状态消息
     * @param socket
     */
    emitTaskStatus: function (socket, task) {
        socket.emit('opmq/taskStatus', task);
    }
}
module.exports = GlobalProducer;

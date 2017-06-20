/**
 * Created by tp on 2016/9/20.
 */


var consumerCache = new Object();
var GlobalConsumer = {
    /**
     * 创建用户 socket 缓存
     * @param socket
     */
    createConsumer: function (socket) {
        var user = socket.handshake.session.user;
        var SID = socket.id;
        var key = user.USER_ID + '_' + SID;
        consumerCache[key] = socket;
    },

    /**
     * 通过用户获取用户ID
     * @param userID
     */
    getSockets: function (userID) {
        var sockets = new Array();
        for (var i in consumerCache) {
            var kk = i.split('_');
            if (kk[0] == userID) {
                sockets.push(consumerCache[i]);
            }
        }
        return sockets;
    },

    /**
     * 用户退出登录 或 关闭浏览器的时候 销毁 socket
     * @param socket
     */
    destoryConsumer: function (socket) {
        var user = socket.handshake.session.user;
        var SID = socket.id;
        var key = user.USER_ID + '_' + SID;
        delete consumerCache[key];
    }
}

module.exports = GlobalConsumer;

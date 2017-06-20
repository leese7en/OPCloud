var logger = require('log4js').getLogger('opmq');
var opmqSocket = {
	socketOn: function(socket) {
		/**
		 * 监听获取实时值
		 */
		socket.on('opmq/message', function(data) {
			var userID = socket.handshake.session.user.USER_ID;
			var message = {
				info: parseInt(Math.random() * 100),
				warning: parseInt(Math.random() * 100),
				task: parseInt(Math.random() * 100)
			}
			socket.emit('opmq/message', message);
		});
	}
}

module.exports = opmqSocket;
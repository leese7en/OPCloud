var opPool = require('../openplant/openPlantPool');
var actionUtil = require("../framework/action/actionUtils")();
var query = actionUtil.query;
var logger = require('log4js').getLogger('system');
var serverSocket = {
    socketOn: function (socket) {
        /**
         * 监听启动即时任务
         */
        socket.on('server/serverStatus', function (data) {
            var data = opPool.agengInfo();
            var obj = new Object();
            var value = new Object();
            value.time = data.Time;
            value.agentCPU = data.CPU;
            value.agentMem = data.Memory;
            value.agentHD = data.UsedHardDisk / data.TotalHardDisk * 100;
            value.agentConn = data.ClientCount;
            value.agentFlowUp = data.magustekTrafficReceive;
            value.agentFlowDown = data.magustekTrafficSend;
            value.agentNetworkUp = data.NetUploadRate;
            value.agentNetworkDown = data.NetDownloadRate;
            obj.agent = value;
            for (var i in data) {
                var index = i.indexOf('Group');
                if (index > -1) {
                    var groups = obj.Group;
                    if (!groups) {
                        groups = new Object();
                        obj.Group = groups;
                    }
                    var groupInfo = i.split('.');
                    var group = groups['Group_' + groupInfo[1]];
                    if (!group) {
                        group = new Object();
                        groups['Group_' + groupInfo[1]] = group;
                    }
                    var isRDB = groupInfo[2];
                    if (isRDB != 'RDB') {
                        if (isRDB == 'GroupName' || isRDB == 'ConnectPoolMax' || isRDB == 'ConnectPoolMin' || isRDB == 'SurvivalSize' || isRDB == 'ReplicatorFile') {
                            group[isRDB] = data[i];
                        }
                    } else {
                        var opGroup = group['OP_' + groupInfo[3]];
                        if (!opGroup) {
                            opGroup = new Object();
                            group['OP_' + groupInfo[3]] = opGroup;
                        }
                        var isPoint = groupInfo[4];
                        if (isPoint != 'W3') {
                            if (isPoint == 'Host') {
                                opGroup[isPoint] = data[i];
                            }
                        } else {
                            var filed = groupInfo[6];
                            if (filed == 'LOAD' || filed == 'SESSION' || filed == 'UPTIME' || filed == 'DBMEM' || filed == 'VOLFREE' || filed == 'VOTOTAL' || filed == 'MEMFREE') {
                                opGroup[filed] = data[i];
                            }
                        }
                    }

                } else {
                    continue;
                }
            }
            socket.emit('server/serverStatus', obj);
        });
    },
}

module.exports = serverSocket;

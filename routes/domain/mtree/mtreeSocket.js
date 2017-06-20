var opPool = require('../../openplant/openPlantPool');
var log4js = require('log4js');
var logger = log4js.getLogger('system');
var GlobalAgent = require('../../message/GlobalAgent');
var projectPointSocket = {
    socketOn: function (socket) {
        socket.on('projectPoint/pointInfoRealTime', function (data) {
            var offset = data.offset || 0;
            var limit = data.limit || 25;
            var result = {
                total: 0,
                rows: []
            };
            var treeID = data.treeID;
            if (treeID == "" || treeID == undefined) {
                treeID = 1;
            }
            var user = socket.handshake.session.user;
            var domainId = GlobalAgent.getUserDomain(user.USER_ID).toString();
            if (!domainId) {
                socket.emit('projectPoint/pointInfoRealTime', {
                    value: result
                });
                return;
            }
            var sqlIds = 'select URI,UUID as uuid,POINT_ID as id from sys_point where MTREE_ID in(SELECT ID FROM sys_mtree WHERE ID = ' + treeID + ' or URI LIKE (SELECT CONCAT(REPLACE(URI,"_","\\_"),"/%") FROM sys_mtree  WHERE ID = ' + treeID + ')) and DOMAIN_ID in  ( ' + domainId + ')';
            logger.debug('查询关系库点数据权限SQL：' + sqlIds);
            query(sqlIds, function (error, rows, columns) {
                if (error || rows.length == 0) {
                    logger.error('查询点信息权限：' + error || ('行数：' + rows.length));
                    result.total = 0;
                    socket.emit('projectPoint/pointInfoRealTime', {
                        value: result
                    });
                } else {
                    var size = rows.length;
                    var ids = [];
                    for (var i = 0; i < size; i++) {
                        ids.push(rows[i].id);
                    }
                    if (ids.length < 1) {
                        result.total = 0;
                        result.rows = [];
                        socket.emit('projectPoint/pointInfoRealTime', {
                            value: result
                        });
                        return;
                    }
                    var sql = 'select ID,UD,GN,TN,AV,TM,DS,ED,RT from realtime where ID in (' + ids.toString() + ') and KR in (' + domainId + ') order  by ID limit ' + offset + ',' + limit;
                    logger.debug('查询实时数据SQL：' + sql);
                    opPool.query(sql, function (error, rs, columns) {
                        if (error || rows.length == 0) {
                            logger.error('查询实时库实时信息：' + JSON.stringify(error) || ('行数：' + rows.length));
                            result.total = 0;
                            socket.emit('projectPoint/pointInfoRealTime', {
                                value: result
                            });
                        } else {
                            var tt = [];
                            for (var i in rs) {
                                for (var j in rows) {
                                    if (rs[i].ID == rows[j].id) {
                                        rs[i].GN = rows[j].URI;
                                        tt.push(rs[i]);
                                        break;
                                    }
                                }
                            }
                            result.total = size;
                            result.rows = tt;
                            socket.emit('projectPoint/pointInfoRealTime', {
                                value: result
                            });
                        }
                    });
                }
            });

        });
    }
}

module.exports = projectPointSocket;
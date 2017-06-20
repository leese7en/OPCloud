var opPool = require('../openplant/openPlantPool');
var fs = require('fs');
var graphElementUtils = require("../rsa/givew/graphElementUtils");
var log4js = require('log4js');
var logger = log4js.getLogger('system');
var async = require('async');
var actionUtil = require("../framework/action/actionUtils")();
var query = actionUtil.query;
var GlobalAgent = require('../message/GlobalAgent');
var configConst = require('../utils/tools/configConst');
var path = require('path');
var gviewSocket = {
    socketOn: function (socket, producer, consumer, cachePath, cacheIDs, SID) {
        socket.on('loadDiagram', function (data) {
            var user = socket.handshake.session.user;
            var userId = user.USER_ID;
            var domainDiagram = socket.handshake.session.domainDiagram;
            var userURI = configConst.filePath + '/' + user.ENTERPRISE_ID + '/resources';
            var fileURI = userURI + domainDiagram;
            var value = {
                class: 8,
                zIndex: 1,
                bounds: {
                    x: 23, y: 14, w: 239, h: 53
                },
                text: '读取文件错误'
            }
            var resultData = {
                BackGround: {size: {w: 1024, h: 768}, fill: {type: 1, bg: "rgba(255,255,255,255)"}},
                Elements: [value],
                points: [],
                staticData: {},
                systemTime: new Date().getTime()
            }
            var domainId = GlobalAgent.getUserDomain(userId).toString();
            if (!domainId) {
                logger.error("domain empty");
                value.text = '用户不属于任何域';
                resultData.Elements = [value];
                socket.emit('diagramCB', resultData);
                return;
            }
            var filePath = data.filePath;
            if (filePath) {
                var URI = './' + path.normalize(fileURI + '/' + filePath);
                URI = URI.replace(/\\/g, '/');
                if (!fs.existsSync(URI)) {
                    logger.error("file does not exist");
                    value.text = '文件不存在';
                    resultData.Elements = [value];
                    socket.emit('diagramCB', resultData);
                    return;
                }
                async.waterfall(
                    [
                        function (callback) {
                            var sql = 'select URI from sys_domain where DOMAIN_ID in (' + domainId + ') order by URI';
                            logger.debug('获取domain信息sql:' + sql);
                            query(sql, function (err, rows) {
                                if (err) {
                                    logger.error("get domain error");
                                    socket.emit('diagramCB', {});
                                    return;
                                } else {
                                    var domainURI = '';
                                    for (var i in rows) {
                                        var r = rows[i]
                                        if (URI.indexOf(userURI + r.URI) == 0) {
                                            domainURI = r.URI;
                                        }
                                    }
                                    if (!domainURI) {
                                        logger.error("user have not domain");
                                        value.text = '用户不属于任何域';
                                        resultData.Elements = [value];
                                        socket.emit('diagramCB', resultData);
                                        return;
                                    }
                                    socket.handshake.session.domainDiagram = domainURI;
                                    callback(null);
                                }
                            });
                        },
                        function (callback) {
                            logger.debug(socket.handshake.address + "  loadDiagram>>>>>>" + URI)
                            if (cachePath != URI) {
                                //"图形切换后，移除上次订阅内容";
                                producer.unsubscribe(cacheIDs);
                                //清空消费者缓存
                                consumer.clear();
                                cachePath = URI;
                            }
                            cacheIDs = [];
                            graphElementUtils.get(URI, function (diagramData, pointsMap) {
                                if (!domainId) {
                                    logger.error('当前用户没有域');
                                    diagramData["points"] = [];
                                    diagramData["staticData"] = {};
                                    diagramData["systemTime"] = new Date().getTime();
                                    logger.warn("diagram IS NULL ");
                                    socket.emit('diagramCB', diagramData);
                                    return;
                                }
                                var pointsInfo = [];
                                var pointNames = pointsMap["all"];
                                for (var i = 0; i < pointNames.length; i++) {
                                    var UD = '0x' + opPool.makeUUID(pointNames[i]);
                                    if (pointsInfo.indexOf(UD) == -1) {
                                        pointsInfo.push(UD);
                                    }
                                }
                                var pointPNs = pointNames;
                                var sql = 'select ID,UD,RT,PN,ED,EU,TV,BV from Point  where UD in (' + pointsInfo.toString() + ') and KR in (' + domainId + ')';
                                logger.debug('图形中获取静态信息sql:' + sql);
                                try {
                                    if (pointNames && pointNames.length > 0) {
                                        opPool.query(sql, function (error, rows, columns) {
                                            if (error && error != 0 && error.code) {
                                                diagramData["points"] = [];
                                                diagramData["staticData"] = {};
                                                diagramData["systemTime"] = new Date().getTime();
                                                logger.warn("query point error " + JSON.stringify(error));
                                                socket.emit('diagramCB', diagramData);
                                            } else {
                                                var staticData = {};
                                                var pointNames = [];
                                                rows.forEach(function (row, index) {
                                                    for (var i = 0; i < pointPNs.length; i++) {
                                                        if (parseInt('0x' + opPool.makeUUID(pointPNs[i]), 16) == parseInt(row.UD, 16)) {
                                                            row.GN = pointPNs[i];
                                                            staticData[row.GN] = row;
                                                            break;
                                                        }
                                                    }
                                                    pointNames.push(row.GN);
                                                    var id = row.ID;
                                                    cacheIDs.push(id)
                                                });
                                                //操作前清空移除
                                                consumer.clear();
                                                consumer.idList = cacheIDs;
                                                consumer.nameList = pointNames;
                                                var indexList = producer.subscription(cacheIDs, SID, consumer);
                                                consumer.indexList = indexList;
                                                diagramData["points"] = pointsMap;
                                                diagramData["staticData"] = staticData;
                                                diagramData["systemTime"] = new Date().getTime();
                                                logger.info("diagram success ");
                                                socket.emit('diagramCB', diagramData);
                                            }
                                        });
                                    } else {
                                        diagramData["points"] = [];
                                        diagramData["staticData"] = {};
                                        diagramData["systemTime"] = new Date().getTime();
                                        logger.warn("diagram IS NULL ");
                                        socket.emit('diagramCB', diagramData);
                                    }
                                } catch (e) {
                                    logger.error(e)
                                    logger.error("diagram ERROR ");
                                    value.text = '解析文件出错';
                                    resultData.Elements = [value];
                                    socket.emit('diagramCB', resultData);
                                }
                            });
                        }
                    ],
                    function (err) {
                        logger.error("获取文件信息错误");
                        value.text = '读取文件出错';
                        resultData.Elements = [value];
                        socket.emit('diagramCB', resultData);
                        return;
                    });
            } else {
                logger.error("文件路径为空");
                value.text = '文件路径为空';
                resultData.Elements = [value];
                socket.emit('diagramCB', resultData);
                return;
            }
        });
        socket.on('setValue', function (data) {
            var key = data.key;
            var value = data.value;
            var cols = ["ID", "AS", "AV"]
            var rs = opPool.syncUpdate("Realtime", [
                [key, value, 0]
            ], ["GN", "AV", "AS"]);
            socket.emit('setValueCB', {msg: "控制命令执行成功！"});
        });

        socket.on('loadPoint', function (data) {
            var pointNames = data.pointNames;
            var rs = opPool.syncFind("Realtime", pointNames, ["ID", "AV"]);
            var rs2 = opPool.syncFind("Point", pointNames, ["ID", "GN", "RT"]);
            var pointData = {};
            if (rs.rows.length == rs2.rows.length) {
                pointData.ID = rs.rows[0].ID;
                pointData.AV = rs.rows[0].AV;
                pointData.GN = rs2.rows[0].GN;
                pointData.RT = rs2.rows[0].RT;
            }
            socket.emit('loadPointCB', {pointData: pointData});
        });
        socket.on('loadReplayerDiagram', function (data) {
            var user = socket.handshake.session.user;
            if (data.filePath) {
                var cacheIDs = [];
                graphElementUtils.get(data.filePath, function (diagramData, pointsMap) {
                    var domainId = GlobalAgent.getUserDomain(user.USER_ID).toString();
                    if (!domainId) {
                        logger.error('当前用户没有域');
                        diagramData["points"] = [];
                        diagramData["staticData"] = {};
                        diagramData["systemTime"] = new Date().getTime();
                        logger.warn("diagram IS NULL ");
                        socket.emit('diagramCB', diagramData);
                        return;
                    }
                    var pointsInfo = [];
                    var pointNames = pointsMap["all"];
                    var pointPNs = pointNames;
                    var sql = 'select ID,UD,RT,PN,ED,EU,TV,BV from Point  where UD in (' + pointsInfo.toString() + ') and KR in (' + domainId + ')';
                    logger.debug('图形中获取静态信息sql:' + sql);
                    try {
                        if (pointNames && pointNames.length > 0) {
                            opPool.query(sql, function (error, rows, columns) {
                                var staticData = {};
                                var pointNames = [];
                                rows.forEach(function (row, index) {
                                    for (var i = 0; i < pointPNs.length; i++) {
                                        if ('0x' + opPool.makeUUID(pointPNs[i]) == row.UD) {
                                            row.GN = pointPNs[i];
                                            staticData[row.GN] = row;
                                            break;
                                        }
                                    }
                                    var id = row.ID;
                                    pointNames.push(row.GN);
                                    cacheIDs.push(id)
                                });
                                //如果是回放，则执行历史数据查询
                                var beginTime = data.beginTime;
                                var endTime = data.endTime;
                                var sqlArchive = 'select ID,AV,DS,TM from Archive where TM between "' + beginTime + '" and "' + endTime + '" and ID in (' + cacheIDs.toString() + ') order by ID,TM';
                                logger.debug('历史回放中获取历史数据sql：' + sqlArchive);
                                opPool.query(sqlArchive, function (error, rrs, columns) {
                                    if (error || error.code) {
                                        logger.error('获取历史数据错误：' + JSON.stringify(error));
                                        diagramData["points"] = pointsMap;
                                        diagramData["staticData"] = staticData;
                                        diagramData["systemTime"] = new Date().getTime();
                                        logger.info("diagram success ");
                                        socket.emit('diagramCB', diagramData);
                                    } else {
                                        for (var i in rrs) {
                                            var rr = rrs[i];
                                            for (var j in rows) {
                                                var row = rows[j];
                                                if (row.ID == rr.ID) {
                                                    rr.GN = row.GN;
                                                    rr.RT = row.RT;
                                                    rrs[i] = rr;
                                                    break;
                                                }
                                            }
                                        }
                                        diagramData["points"] = pointsMap;
                                        diagramData["staticData"] = staticData;
                                        diagramData["systemTime"] = new Date().getTime();
                                        diagramData["replayerData"] = rrs;
                                        logger.info("diagram success ");
                                        socket.emit('replayerData', diagramData);
                                    }
                                });
                            });
                        } else {
                            diagramData["points"] = [];
                            diagramData["staticData"] = {};
                            diagramData["systemTime"] = new Date().getTime();
                            logger.warn("diagram IS NULL ");
                            socket.emit('diagramCB', diagramData);
                        }
                    } catch (e) {
                        logger.error(e)
                        logger.error("diagram ERROR ")
                        socket.emit('diagramCB', {});
                    }
                });
            }
        });
    }
}

module.exports = gviewSocket;

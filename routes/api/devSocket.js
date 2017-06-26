var express = require('express');
var router = express.Router();

const REGISTER_FLAG = 0x01 //注册flag
const SUCCESS = 0x0
const UNKNOWDAS = 0xfd
const UNKNOWDEVICE = 0xfe
const DAS_NOT_EXITS = 0x64
const DATA_PARSE = 0x62
const TIMEOUT = 0xff
const OPERATE_FAIL = 0x59
const OPERATE_SUCCESS = 0x60
const DEV_NOT_EXITS = 0x61

const UPDATE_LOCAL_INFO = 0x63

const distince = 120;
const discount = 5;
var fs = require("fs")
var moment = require("moment");
var utils = require('../rsa/rsaUtils');
var actionUtil = require("../framework/action/actionUtils")();
var query = actionUtil.query;
var sqlQuery = require('sql-query').Query()
var async = require('async');

var net = require('net');
var server = net.createServer();
var listenPort = 6677;
var send_host = '127.0.0.1';
var sendport = 7799;
var logger = require('log4js').getLogger('Ibox');
var schedule = require("node-schedule");

server.on('listening', function () {
    //检测设备状态
    checkStatus();
    logger.warn('Box Servcer is listening on port', listenPort);
});
server.on('connection', function (socket) {
    logger.info('Box Server has a new connection');
    socket.on('error', function (err) {
        logger.warn('Error occurred:', err.message);
    });
    socket.setEncoding("utf8");
    socket.on('data', function (data) {
        var buf = new Buffer(data);
        var flag = buf[2];
        var devcode = buf.slice(4, 12).toString();
        //查找设备
        switch (flag) {
            case REGISTER_FLAG:
                var desc = buf.slice(12, 24);
                var sn = buf.slice(24, 40);
                async.waterfall(
                    [
                        function (callback) {
                            var sql = 'select ID ,time ,status,heartbeat_time as hbTime from box_box_info where dev_code= "' + devcode + '"';
                            logger.debug('查询盒子是否已经上线sql:' + sql);
                            query(sql, function (err, rows) {
                                if (err) {
                                    logger.error('查询盒子是否上线错误:' + err);
                                    return;
                                }
                                if (!rows || rows.length != 1) {
                                    callback(null, null);
                                } else {
                                    callback(null, rows[0]);
                                }
                            });

                        },
                        function (row, callback) {
                            //新建
                            var date = moment(new Date()).format('YYYY-MM-DD HH:mm:ss');
                            if (row == null) {
                                var sql = sqlQuery.insert().into('box_box_info').set({
                                    name: "MG_" + devcode,
                                    status: "on",
                                    dev_desc: desc,
                                    ver_code: '123456',
                                    time: date,
                                    heartbeat_time: date,
                                    out_count: 0,
                                    dev_code: devcode,
                                    version_num: "",
                                    serial_no: sn
                                }).build();
                                logger.debug('创建盒子sql:' + sql);
                                query(sql, function (err, rows) {
                                    if (err) {
                                        logger.error('创建盒子错误：' + err);
                                        return;
                                    }
                                    logger.warn('创建盒子成功，机器码：' + devcode);
                                });
                                var onlineSql = sqlQuery.insert().into('box_online_log').set({
                                    dev_code: devcode,
                                    content: '上线',
                                    time: date,
                                    is_push: 0,
                                    heartbeat_time: date
                                }).build();
                                query(onlineSql, function (err, rows) {
                                });
                            } else {
                                var status = row.status;
                                var hbTime = new Date(row.hbTime).getTime() / 1000;
                                var sql = '';
                                var onlineSql
                                if (status == "on" && (new Date().getTime() / 1000 - hbTime) > distince) {
                                    sql = sqlQuery.update().into('box_box_info').set({
                                        status: 'on',
                                        serial_no: sn,
                                        heartbeat_time: date,
                                        out_count: 0
                                    }).where({dev_code: devcode}).build();
                                    onlineSql = sqlQuery.update().into('box_online_log').set({
                                        heartbeat_time: date
                                    }).where({content: '上线', dev_code: devcode}).build();
                                } else if (status == 'off') {
                                    sql = sqlQuery.update().into('box_box_info').set({
                                        status: 'on',
                                        serial_no: sn,
                                        heartbeat_time: date,
                                        is_push: 0,
                                        out_count: 0
                                    }).where({dev_code: devcode}).build();
                                    onlineSql = sqlQuery.insert().into('box_online_log').set({
                                        dev_code: devcode,
                                        content: '上线',
                                        time: date,
                                        heartbeat_time: date
                                    }).build();
                                } else {
                                    return;
                                }
                                logger.debug('更新盒子状态sql:' + sql);
                                query(sql, function (err, rows) {
                                    if (err) {
                                        logger.error('更新盒子状态错误:' + err);
                                        return;
                                    }
                                    logger.warn('更新盒子状态成功，机器码：' + devcode);
                                });
                                query(onlineSql, function (err, rows) {
                                });
                            }
                        }
                    ],
                    function (err) {
                        if (err) {
                            logger.error('查询盒子是否上线错误:' + err);
                            return;
                        }
                    });
                break;
            default:
                break;
        }
    });
});
server.on('close', function () {
    logger.warn('Box Server is now closed');
});

server.on('error', function (err) {
    logger.warn('Error occurred:', err.message);
});

server.listen(listenPort);

function checkStatus() {
    var rule = new schedule.RecurrenceRule();
    var times = [1, 31];
    rule.second = times;
    schedule.scheduleJob(rule, function () {
        async.waterfall(
            [
                function (callback) {
                    var sql = "SELECT dev_code,status,out_count,heartbeat_time as time,is_push FROM box_box_info where status = 'on'";
                    logger.debug('查询所有在线的盒子sql：' + sql);
                    query(sql, function (err, rows, columns) {
                        if (err) {
                            logger.error('查询盒子信息错误:' + err);
                            return;
                        }
                        if (rows.length > 0) {
                            callback(null, rows);
                        } else {
                            logger.warn('没有盒子上线过');
                            return;
                        }
                    });
                },
                function (arrays, callback) {
                    var arrs = [];
                    for (var i in arrays) {
                        var obj = arrays[i];
                        if (obj.status == 'off') {
                            continue;
                        }
                        var nowTime = new Date().getTime() / 1000;
                        var time = new Date(obj.time).getTime() / 1000;
                        if ((nowTime - time) > distince) {
                            obj.out_count = obj.out_count + 1;
                            obj.time = moment(new Date()).format('YYYY-MM-DD HH:mm:ss');
                        } else {
                            continue;
                        }
                        if (obj.out_count > discount) {
                            obj.time = moment(new Date((time - distince * discount) * 1000)).format('YYYY-MM-DD HH:mm:ss');
                            obj.status = 'off';
                            obj.is_push = 0;
                            obj.out_count = 0;
                        }
                        arrs.push(obj);
                    }
                    if (arrs.length < 1) {
                        logger.warn('沒有盒子需要更新状态');
                        return;
                    }
                    callback(null, arrs);
                },
                function (arrs, callback) {
                    var sql = 'update  box_box_info set  ';
                    var countSQL = '', timeSQL = '', statusSQL = '', pushSQL = '';
                    var devCode = '';
                    var size = arrs.length;
                    var boxOff = [];
                    for (var i = 0; i < size; i++) {
                        var obj = arrs[i];
                        if (obj.status == 'off') {
                            boxOff.push(obj);
                        }
                        countSQL += ' when "' + obj.dev_code + '" then ' + obj.out_count;
                        timeSQL += ' when "' + obj.dev_code + '" then "' + obj.time + '"';
                        statusSQL += ' when "' + obj.dev_code + '" then "' + obj.status + '"';
                        pushSQL += ' when "' + obj.dev_code + '" then "' + obj.is_push + '"';
                        devCode += '"' + obj.dev_code + '"';
                        if (arrs[i + 1]) {
                            devCode += ',';
                        }
                    }
                    sql += ' out_count = case dev_code ' + countSQL + ' end,';
                    sql += ' time = case dev_code ' + timeSQL + ' end,';
                    sql += ' status = case dev_code ' + statusSQL + ' end,';
                    sql += ' is_push = case dev_code ' + pushSQL + ' end';
                    sql += ' where dev_code in (' + devCode + ')';
                    logger.debug('更新盒子掉线信息sql:' + sql);
                    query(sql, function (err, rows) {
                        if (err) {
                            logger.error('更新盒子掉线信息错误：' + err);
                            return;
                        }
                        logger.warn('更新盒子掉线信息成功');
                    });
                    if (boxOff.length > 0) {
                        var time = moment(new Date()).format('YYYY-MM-DD HH:mm:ss')
                        var boxOnlineLog = 'insert into box_online_log (dev_code,content,time) values '
                        var size = boxOff.length;
                        for (var i = 0; i < size; i++) {
                            var obj = boxOff[i];
                            var value = '("' + obj.dev_code + '","掉线","' + time + '")'
                            if (obj[i + 1]) {
                                value += ',';
                            }
                            boxOnlineLog += value;
                        }
                        query(boxOnlineLog, function (err, rows) {
                        });
                    }

                }
            ], function (err) {
                if (err) {
                    logger.error('检查盒子掉线信息错误:' + err);
                    return;
                }
            });
    });
}


var dataChan = {};
//将返回值放入datachan
router.DataSignal = function (key, data) {
    if (data != null) {
        dataChan[key] = data;
    }
}
//从channel里获取相应设备的回复，若超过超时时间，则为超时
router.SignalOB = function (devcode, funcode, callback) {
    var returnBufData = null;
    var beginTime = new Date().getTime();
    while (true) {
        var endTime = new Date().getTime();
        if ((endTime - beginTime) > 60 * 1000) {
            callback(new Error('获取数据超时'), null);
            return;
        }
        if (dataChan != null && dataChan.size() > 0) {
            var key = devcode + "_" + funcode;
            returnBufData = dataChan[key];
            delete dataChan[key];
            if (returnBufData != null) {
                callback(returnBufData);
                return;
            } else {
                callback(null);
                return;
            }
        } else {
            callback(null);
            return;
        }
    }
}


var obj = {
    max: 0,
    number: 0,
    data: []
}

var socket;
function init(callback, data) {
    try {
        socket = new net.Socket();
        socket.setEncoding("utf8");
        socket.connect(sendport, send_host, function () {
            logger.warn('连接Box 成功 host:' + send_host, 'port:' + sendport);
            if (callback) {
                callback(null, socket);
            }
            socket.on('data', function (data) {
                var buf = new Buffer(data, 'utf8');
                console.log(buf);
                //     var length = buf.length;
                //     var reciveLength = (parseInt(data[0]) << 8) + parseInt(data[1]);
                //     var devcode = buf.slice(4, 12).toString();
                //     if ((length - 2) == reciveLength) { //接收成功
                //         var number = buf[13];
                //         var max = buf[15];
                //         obj.max = max;
                //         obj.data[number] = buf.slice(16, length);
                //         if (max > 1) {
                //             var len = 11;
                //             var buf = new Buffer(len);
                //             buf.writeUIntBE(func_code, 0, 1);
                //             buf.writeUIntBE(flag, 1, 2)
                //             buf.write(devcode, 2, 10);
                //             buf.write("0", 10, 11);
                //             //两个字节表示包的大小
                //             var nb = new Buffer(2, 'hex');
                //             nb[0] = (len >> 8);
                //             nb[1] = (len % 256);
                //             var sendbuf = Buffer.concat([nb, buf]);
                //             client.write(sendbuf); //成功
                //         }
                //         // console.log(number + "======" + max + "===" + obj.data[number]);
                //         var content = "";
                //         if (number == max) {
                //             if (obj.max > 1) {
                //                 for (var i = 1; i <= obj.max; i++) { //拼接分包数据
                //                     content += obj.data[i];
                //                 }
                //             } else {
                //                 content = buf.slice(16, length);
                //             }
                //             //console.log("content==" + content);
                //             if (content.length == 1) { //返回结果集中不带数据的处理
                //                 router.JudgeReturnValue(content, function (message) {
                //                     console.error("message.stauts===" + message.status + "==" + message.msg);
                //                     router.DataSignal(devcode, func_code.toString(), message);
                //                 });
                //             } else {
                //                 var message = {};
                //                 message.status = true;
                //                 message.msg = content.toString();
                //                 router.DataSignal(devcode, func_code.toString(), message);
                //             }
                //             client.end();
                //         }
                //     } else {
                //         var len = 11;
                //         var buf = new Buffer(len);
                //         buf.writeUIntBE(func_code, 0, 1);
                //         buf.writeUIntBE(flag, 1, 2)
                //         buf.write(devcode, 2, 10);
                //         buf.write("1", 10, 11);
                //         //两个字节表示包的大小
                //         var nb = new Buffer(2, 'hex');
                //         nb[0] = (len >> 8);
                //         nb[1] = (len % 256);
                //         var sendbuf = Buffer.concat([nb, buf]);
                //         client.write(sendbuf);  //失败
                //     }
            });
            socket.on('close', function () {
                socket = null;
                console.log('client Connection is closed');
            });
        });
    }
    catch (e) {
        logger.error('连接盒子错误');
        callback(new Error('代理连接出错'));
    }
}

/**
 * 向slave 发送请求
 */
router.sendMsg = function (func_code, devcode, flag, data) {
    var len = 10;
    if (data != null) {
        var dat = new Buffer(data);
        len += dat.length;
    }
    var buf = new Buffer(len);
    buf.writeUIntBE(func_code, 0, 1);
    buf.writeUIntBE(flag, 1, 2)
    buf.write(devcode, 2, 10);
    if (data != null) {
        var dat = new Buffer(data);
        len += dat.length;
        buf.write(data, 10, len);
    }
    //两个字节表示包的大小
    var nb = new Buffer(2, 'hex');
    nb[0] = (len >> 8);
    nb[1] = (len % 256);
    var sendbuf = Buffer.concat([nb, buf]);
    var callback = function (error, socket) {
        if (error) {
            logger.error('发送数据失败:', error);
        } else {
            socket.write(data);
        }
    }
    if (socket) {
        socket.write(sendbuf);
    } else {
        init(callback);
    }
}


// router.sendMsg = function (func_code, devcode, flag, data, messageCallback) {
//     var len = 10;
//     if (data != null) {
//         var dat = new Buffer(data);
//         len += dat.length;
//     }
//     var buf = new Buffer(len);
//     buf.writeUIntBE(func_code, 0, 1);
//     buf.writeUIntBE(flag, 1, 2)
//     buf.write(devcode, 2, 10);
//     if (data != null) {
//         buf.write(data, 10, len);
//     }
//     //两个字节表示包的大小
//     var nb = new Buffer(2, 'hex');
//     nb[0] = (len >> 8);
//     nb[1] = (len % 256);
//     var sendbuf = Buffer.concat([nb, buf]);
//
//     async.waterfall([
//         function (callback) {
//             //
//             try {
//                 socket.connect(sendport, send_host, function () {
//                     callback(null, socket);
//                 })
//             } catch (e) {
//                 callback(e, null);
//             }
//         },
//         function (client, callback) {
//             if (client) {
//                 client.write(sendbuf);
//
//             } else {
//                 callback("conn error");
//             }
//         }
//     ], function (err) {
//         if (err) {
//             logger.error(err);
//             messageCallback(false);
//         } else {
//             messageCallback(true);
//         }
//     });
// }
//解析返回值
router.JudgeReturnValue = function (data, callback) {
    var message = {}
    switch (data[0]) {
        case OPERATE_SUCCESS:
            message.status = true;
            message.msg = "操作成功"
            callback(message);
            break;
        case OPERATE_FAIL:
            message.status = false;
            message.msg = "操作失败"
            callback(message);
            break;
        case TIMEOUT:
            message.status = false;
            message.msg = "回复超时"
            callback(message);
            break;
        case UPDATE_LOCAL_INFO:
            message.status = false;
            message.msg = "解析本地文件出错"
            callback(message);
            break;
        case DEV_NOT_EXITS:
            message.status = false;
            message.msg = "设备不存在"
            callback(message);
            break;
        default:
            message.status = false;
            message.msg = "未定义的返回值"
            callback(message);
            break;
    }
}

module.exports = router;

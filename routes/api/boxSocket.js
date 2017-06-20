var express = require('express');
var router = express.Router();
var net = require('net');
var async = require('async');
var send_host = '192.168.3.198';
var sendport = 7788;

var logger = require('log4js').getLogger('Ibox');

var dataChan = {};
//将获取到的数据放到数据集合中
router.DataSignal = function (key, data) {
    if (data != null) {
        dataChan[key] = data;
    }
}
// 获取对应的数据发送请求方
router.SignalOB = function (key, callback) {
    var bufData = null;
    var beginTime = new Date().getTime();
    while (true) {
        if (dataChan != null && dataChan.size() > 0) {
            bufData = dataChan[key];
            delete dataChan[key];
            if (bufData != null) {
                callback(null, bufData);
                return;
            } else {
                callback(new Error('没有对应数据'), bufData);
                return;
            }
        } else {
            callback(new Error('没有对应数据'), bufData);
            return;
        }
        var endTime = new Date().getTime();
        if ((endTime - beginTime) > 60 * 1000) {
            callback(new Error('获取数据超时'), null);
            return;
        }
    }
}
function connectMsg(data, callback) {
    var socket = new net.Socket();
    try {
        socket.connect(sendport, send_host, function () {
            logger.warn('连接Box 成功 host:' + send_host, 'port:' + sendport);
            socket.write(data, "utf8");
        });
        socket.on('data', function (data) {
            var buf = new Buffer(data);
            var length = parseInt(buf[0] << 8) + parseInt(buf[1]);
            // console.log('length:', length);
            var commondType = parseInt(buf[2]);
            // console.log('commondType:', commondType);
            var commondFlag = parseInt(buf[3]);
            // console.log('commondFlag:', commondFlag);
            var devCode = buf.slice(4, 12).toString();
            // console.log('devCode:', devCode);
            var totalPackage = parseInt(buf[12] << 8) + parseInt(buf[13]);
            // console.log('totalPackage:', totalPackage);
            var firstPackage = parseInt(buf[14] << 8) + parseInt(buf[15]);
            // console.log('firstPackage:', firstPackage);
            var content = buf.slice(16);
            // console.log(content.toString());
            var value = content.toString();
            callback(null, value);
            socket.end();
        });
        socket.on('close', function () {
            socket = null;
            logger.warn('client Connection is closed');
        });

        socket.on('end', function (err) {
            console.log('服务器断开连接 end');
        });

        socket.on('error', function (err) {
            logger.error('连接盒子错误:', err);
            callback(new Error('代理连接出错'), null);
        });
    } catch (e) {
        logger.error('连接盒子错误:', e);
        callback(new Error('代理连接出错'), null);
    }
}

/**
 * 向slave 发送请求
 */
function sendMsg(func_code, devcode, flag, data, callback) {
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
    connectMsg(sendbuf, callback);
}

const COMMAND_FLAG = 0x33 // 指令标识
const EDM_BOOT_DAS = 0xd  //启动das
const EDM_STOP_DAS = 0xe  //停止das
const EDM_ALL_DAS = 0x22  //获取所有采集
const EDM_ADD_DAS = 0x09  // 创建采集
const EDM_DEL_DAS = 0x05   //删除采集

const EDM_MOD_DAS = 0x05   //更新采集
const EDM_ADD_POINT = 0xa  //添加点
const EDM_MOD_POINT = 0xb  //编辑点
const EDM_DEL_POINT = 0xc  //删除点
const EDM_ALL_POINT = 0x08  //获取所有点

const EDM_ALL_DRIVER = 0x06  //查询所有驱动信息
const EDM_DRIVER_CONF = 0x21  //驱动配置信息
const DRIVER_NAME = 'Modbus_TCP'
const BOX_NAME = '9SMCY6Z1'


// sendMsg(EDM_DRIVER_CONF, BOX_NAME, COMMAND_FLAG, DRIVER_NAME, function (error, data) {
//     console.log(error);
//     if (!error) {
//         console.log(data.slice(2).toString());
//     }
// });

// sendMsg(EDM_STOP_DAS, BOX_NAME, COMMAND_FLAG, 'test2', function (error, data) {
//     if (error) {
//         console.log(error);
//     } else {
//         console.log(data);
//     }
// });
router.sendMsg = function (func_code, devcode, flag, data, callback) {
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
    connectMsg(sendbuf, callback);
}
module.exports = router;
// var str = 'Y'
// console.log(str.charCodeAt());
//
// console.log(0x59 == 89);
// console.log(parseInt("bc", 16));


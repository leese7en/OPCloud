var express = require('express');
var router = express.Router();
var port = 8778;
var fs = require("fs")
var moment = require("moment");
var io = require('socket.io')(port);
var socketioJwt = require('socketio-jwt');
var jwt = require('jsonwebtoken');
var jwtSecret = Buffer('magustek.com', 'base64');
var schedule = require("node-schedule");
var graphElementUtils = require("../rsa/givew/graphElementUtils");
var Producer = require("../OPMQ/Producer");
var Consumer = require("../OPMQ/Consumer");
var GlobalAgent = require('../message/GlobalAgent');
var opPool = require('../openplant/openPlantPool');
var mtreeSocket = require('../domain/mtree/mtreeSocket');
var trendSocket = require('../datatrend/trendSocket');
var gviewSocket = require('../gview/gviewSocket');
var alarmSocket = require('../dataview/alarmSocket');
var rhDataSocket = require('../dataview/rhDataSocket');
var historySnapStaSocket = require('../dataview/historySnapStaSocket');
var devSocket = require('../api/devSocket');
//-----------------------------服务器状态
var serverSocket = require('../system/serverSocket');
var api = io.of("api/v1");

var sharedsession = require("express-socket.io-session");
var session = require('../../session');
var log4js = require('log4js');
var logger = log4js.getLogger('system');
//--------------------------------------------//
var apio = io.of("api/vo1");
var apioPoint = require('../apio/pointAPISocket');
var apioAlarm = require('../apio/dataAPISocket');
var apioData = require('../apio/alarmAPISocket');
var apioSQL = require('../apio/apioSQLSocket');
var apioSub = require('../apio/subAPISocket');

//--------------------------------------------//
var model = io.of("model/v1");
var spark = io.of('spark/v1');
var taskSocket = require('../model/taskSocket');
var sprakSocket = require('../model/sparkSocket')
//--------------------------------------------//apio
var opmqSocket = require('../message/messageSocket');

api.use(socketioJwt.authorize({
    secret: jwtSecret, //公钥
    handshake: true,
    timeout: 5000 //超时时间
}));

var producer = new Producer();

api.use(sharedsession(session, {
    autoSave: true
}));
api.use(function (socket, next) {
    var user = socket.handshake.session.user;
    if (user) {
        return next(null, true);
    } else {
        logger.warn('socket session  超时，需要重新登录!');
        next(new Error('Authentication error'), false);
    }
});

/**
 * 系统应用
 */
api.on('connection', function (socket) {
    var cachePath = "";
    var cacheIDs = [];
    var SID = socket.id;
    var consumer = new Consumer(SID, socket, producer);
    //创建全局用户 一对一缓存
    GlobalAgent.createConsumer(socket);
    /*工程测点数据*/
    mtreeSocket.socketOn(socket);
    /*趋势信息*/
    trendSocket.socketOn(socket);
    /*图形信息*/
    gviewSocket.socketOn(socket, producer, consumer, cachePath, cacheIDs, SID);
    /*报警数据*/
    alarmSocket.socketOn(socket);
    /*实时和历时数据*/
    rhDataSocket.socketOn(socket);
    /*历史区间统计*/
    historySnapStaSocket.socketOn(socket);
    //任务管理
    taskSocket.socketOn(socket);
    /* 服务器状态*/
    serverSocket.socketOn(socket);
    /*消息订阅*/
    opmqSocket.socketOn(socket);
    //连接中断时，移除链接
    socket.on('disconnect', function () {
        // 销毁全局用户一对一缓存
        GlobalAgent.destoryConsumer(socket);
        // 移除该用户订阅内容
        producer.unsubscribe(cacheIDs);
        //移除消费者清单
        producer.eregister(SID);
        consumer.destroy();
    });
    socket.on('query', function (data) {
        if (data != undefined && data != null && data.sql != undefined) {
            logger.error('查询sql：' + data.sql);
            //TODO  拆分结构，确认SQL 操作的内容是什么
            var time = new Date().getTime();
            opPool.query(data.sql, function (error, rows, columns) {
                if (error == 0) {
                    console.log("总耗时：" + (new Date().getTime() - time));
                    socket.emit('queryCB', {
                        error: 0,
                        rows: rows,
                        columns: columns
                    });
                } else {
                    //TODO 有的错误需要关闭 主要为IO ，当前未处理
                    socket.emit('queryCB', {
                        error: error
                    });
                }
            });
        } else {
            socket.emit('queryCB', {
                error: "SQL ERROR!"
            });
        }
    });
});
/**
 API接口
 **/
apio.on('connection', function (socket) {

    GlobalAgent.createGlobalAPIUser(socket);
    /*sql查询数据*/
    apioSQL.socketOn(socket);
    /*工程测点数据*/
    apioPoint.socketOn(socket);
    /*报警信息*/
    apioAlarm.socketOn(socket);
    /*查询信息*/
    apioData.socketOn(socket);
    //连接中断时，移除链接
    socket.on('disconnect', function () {
        GlobalAgent.destoryGlobalAPIUser(socket);
    });
});

spark.on('connection', function (socket) {
    sprakSocket.socketOn(socket);
    logger.warn('spark is connected');
    GlobalAgent.sparkSocket = socket;
    //spark 连接时 刷新信息
    //taskSocket.refreshCache();
    socket.on('disconnect', function () {
        GlobalAgent.sparkSocket = null;
    });
});

module.exports = router;
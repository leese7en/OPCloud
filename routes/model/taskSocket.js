var actionUtil = require("../framework/action/actionUtils")();
var query = actionUtil.query;
var Utils = require('../utils/tools/utils');
var sqlQuery = require('sql-query').Query();
var logger = require('log4js').getLogger('model');
var sparkModule = require('./sparkModule');
var async = require("async");
var message = {
    flag: 0,
    message: '成功',
    data: null
};
var taskSocket = {
    socketOn: function (socket) {
        var thisTemp = this;
        /**
         * 监听启动即时任务
         */
        socket.on('model/startTask', function (data) {
            var taskId = data.id;
            async.waterfall(
                [
                    function (callback) {
                        var sql = 'select id, name ,description,begin_time,end_time,slice_num,file_ids from model_task where id = "' + taskId + '"';
                        logger.debug('启动任务获取即时任务信息sql：' + sql);
                        query(sql, function (error, rows, columns) {
                            if (error) {
                                logger.error('启动获取即时任务信息错误:' + error);
                                message.flag = -1;
                                message.message = '启动任务失败';
                                message.data = null;
                                socket.emit('model/startTask', message);
                                return;
                            } else {
                                callback(null, rows[0]);
                            }
                        });
                    },
                    function (row, callback) {
                        var sql = 'select path as path from sys_file where file_type =3 and id in (' + row.file_ids + ')';
                        logger.debug('获取文件路径列表：' + sql);
                        query(sql, function (err, rows, columns) {
                            if (err) {
                                logger.error('获取文件路径错误：' + err)
                                message.flag = -1
                                message.message = '获取文件路径失败'
                                message.data = null;
                                socket.emit('model/startTask', message);
                                return;
                            }
                            else if (rows.length < 1 || !rows[0].path) {
                                message.flag = -1
                                message.message = '任务文件不存在，请确认'
                                message.data = null;
                                socket.emit('model/startTask', message);
                                return;
                            }
                            else {
                                var path = new Array();
                                for (var i in rows) {
                                    path.push(rows[i].path);
                                }
                                row.modelFiles = path;
                                sparkModule.startTask(socket, row);
                            }
                        });
                    }
                ],
                function (error) {
                    if (error) {
                        logger.error('获取任务列表失败：' + err)
                        message.flag = -1
                        message.message = '获取任务列表失败'
                        message.data = result;
                        socket.emit('model/startTask', message);
                        return
                    }
                });
        });
        /**
         * 监听启动定时任务
         */
        socket.on('model/startTimerTask', function (data) {
            var taskId = data.id;
            async.waterfall(
                [
                    function (callback) {
                        var sql = 'SELECT id ,name ,description,cutoff_time ,durtion,slice_num ,file_ids,task_type,max_num,timer_type,day,hour,minute from model_timer_task  where id = "' + taskId + '"';
                        logger.debug('启动任务获取即时任务信息sql：' + sql);
                        query(sql, function (error, rows, columns) {
                            if (error) {
                                logger.error('启动获取定时任务信息错误:' + error);
                                message.flag = -1;
                                message.message = '启动任务失败';
                                message.data = null;
                                socket.emit('model/startTimerTask', message);
                                return;
                            } else {
                                callback(null, rows[0]);
                            }
                        });
                    },
                    function (row, callback) {
                        var sql = 'select path as path from sys_file where file_type = 3 and id in (' + row.file_ids + ')';
                        logger.debug('获取文件路径列表：' + sql);
                        query(sql, function (err, rows, columns) {
                            if (err) {
                                logger.error('获取文件路径错误：' + err)
                                message.flag = -1
                                message.message = '获取文件路径失败'
                                message.data = null;
                                socket.emit('model/startTimerTask', message);
                                return;
                            }
                            else if (rows.length < 1 || !rows[0].path) {
                                message.flag = -1
                                message.message = '任务文件不存在，请确认'
                                message.data = null;
                                socket.emit('model/startTimerTask', message);
                                return;
                            }
                            else {
                                var path = new Array();
                                for (var i in rows) {
                                    path.push(rows[i].path);
                                }
                                row.modelFiles = path;
                                sparkModule.startTimerTask(socket, row);
                            }
                        });
                    }
                ],
                function (error) {
                    if (error) {
                        logger.error('获取任务列表失败：' + err)
                        message.flag = -1
                        message.message = '获取任务列表失败'
                        message.data = null;
                        socket.emit('model/startTimerTask', message);
                        return;
                    }
                });
        });
        /**
         * 监听任务停止
         */
        socket.on('model/stopTask', function (data) {

        });
        /**
         * 监听定时任务停止
         */
        socket.on('model/stopTimerTask', function (data) {
            var taskId = data.id;
            sparkModule.stopTimerTask(taskId, function (flag) {
                if (flag < 0) {
                    message.flag = -1;
                    message.message = '停止任务失败';
                    message.data = null;
                    socket.emit('model/stopTimerTask', message);
                } else {
                    message.flag = 0;
                    message.message = 'OK';
                    message.data = null;
                    socket.emit('model/stopTimerTask', message);
                }
            });
        });
    },
    /**
     * 监听 云服务重启 刷新 缓存列表和 定时任务情况
     */
    serverRestart: function () {
        async.waterfall(
            [
                function (callback) {
                    //获取任务缓存
                    var sqlCache = sqlQuery.select().from('model_task_cache').select(['id', 'taskId', 'serialCacheId', 'beginTime', 'endTime', 'sliceNum', 'fileIds', 'modelFiles', 'modelStatus', 'jobStatus']).build();
                    logger.debug('服务重启刷新任务缓存列表：重新启动服务sql：' + sqlCache);
                    query(sqlCache, function (error, rows, columns) {
                        if (error) {
                            logger.error('重启服务时，加载任务缓存失败：' + error);
                            return;
                        } else {
                            callback(null, rows);
                        }
                    });
                },
                function (rows, callback) {
                    var timerTaskCache = new Array();
                    var taskCache = new Array();
                    for (var i in  rows) {
                        var row = rows[i];
                        if (row.serialCacheId) {
                            timerTaskCache.push(row);
                        } else {
                            taskCache.push(row)
                        }
                    }
                    callback(null, taskCache, timerTaskCache);
                },
                function (taskCache, timerCache, callback) {
                    //获取定时任务 启动非定时任务 以及缓存串行任务
                    var serialCache = new Array();
                    var sql = 'SELECT id ,name ,description,cutoff_time ,durtion,slice_num ,file_ids,task_type,max_num,timer_type,day,hour,minute,modelStatus,last_modelStatus,last_jobStatus from model_timer_task  where modelStatus = 2';
                    logger.debug('启动任务获取定时任务信息sql：' + sql);
                    query(sql, function (error, rows, columns) {
                        if (error) {
                            logger.error('重启服务获取定时任务错误:' + error);
                            return;
                        } else {
                            for (var i in timerCache) {
                                for (var j in rows) {
                                    if (timerCache[i].taskId == rows[j].id) {
                                        if (rows[i].last_modelStatus != 2 && rows[i].last_jobStatus == 1) {
                                            taskCache.push(timerCache[i]);
                                        } else {
                                            serialCache.push(timerCache[i]);
                                        }
                                    }
                                }
                            }
                            //启动非定时任务 和 缓存串行任务
                            sparkModule.rebootServer(taskCache, serialCache);
                            callback(null, rows);
                        }
                    });
                },
                //启动定时任务
                function (taskArray, callback) {
                    async.eachSeries(taskArray, function (task) {
                        //启动定时任务
                        var sqlFile = 'select path as path from sys_file where file_type =3 and id in (' + task.file_ids + ')';
                        logger.debug('获取定时任务对应的文件信息sql:' + sqlFile);
                        query(sqlFile, function (err, rows, columns) {
                            if (err) {
                                logger.error('获取文件路径错误：' + err)
                                return;
                            }
                            else if (rows.length < 1 || !rows[0].path) {
                                logger.error('任务文件不存在，请确认：' + err)
                                return;
                            }
                            else {
                                var path = new Array();
                                for (var i in rows) {
                                    path.push(rows[i].path);
                                }
                                task.modelFiles = path;
                                sparkModule.rebootTimerTask(task);
                            }
                        });
                    }, function (err) {
                        if (err) {
                            logger.error('重启定时任务：' + err);
                            return;
                        }
                    });
                }
            ],
            function (error) {
                if (error) {
                    logger.error('重启服务刷新缓存任务错误:' + error);
                }
            });
    },
    /**
     * 监控spark 重连 ，重连时刷新缓存
     */
    refreshCache: function () {
        sparkModule.refreshCache();
    }
}
// 50 秒后开启服务重启 任务重启
// setTimeout(function () {
//     taskSocket.serverRestart();
// }, 10000);
module.exports = taskSocket;

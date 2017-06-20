var actionUtil = require("../framework/action/actionUtils")();
var query = actionUtil.query;
var Utils = require('../utils/tools/utils');
var sqlQuery = require('sql-query').Query();
var logger = require('log4js').getLogger('model');
var uuid = require('node-uuid');
var timer = require('./timerModule');
var GlobalAgent = require('../message/GlobalAgent');
var taskCache = new Object();
var serialCache = new Object();
var async = require("async");
var message = {
    flag: 0,
    message: 'OK',
    data: null
};

var sparkModule = {
    /**
     * 开启即时任务
     * @param socket
     * @param data
     */
    startTask: function (socket, data) {
        var taskObj = new Object();
        taskObj.id = uuid.v1();
        taskObj.taskId = data.id;
        taskObj.taskType = 0;
        taskObj.beginTime = data.begin_time;
        taskObj.endTime = data.end_time;
        taskObj.sliceNum = data.slice_num;
        taskObj.fileIds = data.file_ids;
        taskObj.modelStatus = 1;
        taskObj.createTime = Utils.dateFormat(new Date().getTime(), Utils.yyyyMMddhhmmss);
        async.waterfall(
            [
                function (callback) {
                    var sql = sqlQuery.insert().into('model_run_task').set(taskObj).build();
                    logger.debug('创建任务运行记录sql:' + sql);
                    query(sql, function (error, rows, columns) {
                        if (error) {
                            logger.error('启动获取即时任务信息错误:' + error);
                            message.flag = -1;
                            message.message = '启动任务失败';
                            message.data = null;
                            socket.emit('model/startTask', {data: message});
                            return;
                        } else {
                            callback(null);
                        }
                    });
                },
                function (count, callback) {
                    taskObj.modelFiles = data.modelFiles;
                    var sql = sqlQuery.insert().into('model_task_cache').set(taskObj).build();
                    logger.debug('创建任务缓存记录sql:' + sql);
                    query(sql, function (error, rows, columns) {
                        if (error) {
                            logger.error('启动获取即时任务信息错误:' + error);
                            message.flag = -1;
                            message.message = '启动任务失败';
                            message.data = null;
                            socket.emit('model/startTask', {data: message});
                            return;
                        } else {
                            var taskList = new Array();
                            taskObj.mainTaskId = taskObj.taskId;
                            taskObj.taskId = taskObj.id;
                            delete taskObj.id;
                            delete taskObj.create_time;
                            delete taskObj.fileIds;
                            delete taskObj.modelStatus;
                            taskList.push(taskObj);
                            var queryId = uuid.v1();
                            taskCache[taskObj.taskId] = taskObj;
                            message.flag = 0;
                            message.message = 'OK';
                            message.data = null;
                            socket.emit('model/startTask', {data: message});
                            if (GlobalAgent.sparkSocket) {
                                GlobalAgent.sparkSocket.emit('spark/startTask', {queryId: queryId, data: taskList});
                            }
                        }
                    });
                }
            ],
            function (error) {
                if (error) {
                    logger.error('创建任务失败错误：' + err)
                    message.flag = -1;
                    message.message = '创建任务失败';
                    message.data = null;
                    socket.emit('model/startTask', {data: message});
                }
            });
    },
    /**
     * 开启定时任务
     * @param socket
     * @param data
     */
    startTimerTask: function (socket, data) {
        var that = this;
        var taskObj = new Object();
        taskObj.mainTaskId = data.id;
        taskObj.taskType = 1;
        taskObj.cutoffTime = data.cutoff_time;
        taskObj.durtion = data.durtion;
        taskObj.isParalle = data.task_type;
        taskObj.maxNum = data.max_num;
        taskObj.sliceNum = data.slice_num;
        taskObj.timerType = data.timer_type;
        taskObj.day = data.day;
        taskObj.hour = data.hour;
        taskObj.minute = data.minute;
        taskObj.fileIds = data.file_ids;
        taskObj.modelFiles = data.modelFiles;
        async.waterfall(
            [
                function (callback) {
                    var sql = sqlQuery.update().into('model_timer_task').set({
                        modelStatus: 2,
                        update_time: Utils.dateFormat(new Date().getTime(), Utils.yyyyMMddhhmmss)
                    }).where({id: data.id}).build();
                    logger.debug('开启定时任务修改任务状态sql:' + sql);
                    query(sql, function (error, rows, columns) {
                        if (error) {
                            logger.error('开启定时任务修改任务状态错误:' + error);
                            message.flag = -1;
                            message.message = '启动定时任务失败';
                            message.data = null;
                            socket.emit('model/startTask', message);
                            return;
                        } else {
                            callback(null);
                        }
                    });
                },
                function (callback) {
                    message.flag = 0
                    message.message = 'OK'
                    message.data = null;
                    socket.emit('model/startTimerTask', message);
                    timer.startSchedule(taskObj, that.timerTaskCallback);
                }
            ],
            function (error) {
                if (error) {
                    logger.error('创建任务失败错误：' + err)
                    message.flag = -1;
                    message.message = '创建任务失败';
                    message.data = null;
                    socket.emit('model/startTask', {data: message});
                }
            });
    },
    /**
     * 定时任务回调
     * @param task
     */
    timerTaskCallback: function (task) {
        var that = this;
        var taskObj = new Object();
        taskObj.mainTaskId = task.mainTaskId;
        taskObj.taskId = uuid.v1();
        taskObj.taskType = 1;
        taskObj.beginTime = task.beginTime;
        taskObj.endTime = task.endTime;
        taskObj.sliceNum = task.sliceNum;
        taskObj.fileIds = task.fileIds;
        taskObj.modelFiles = task.modelFiles;
        taskObj.modelStatus = 1;
        taskObj.createTime = Utils.dateFormat(new Date().getTime(), Utils.yyyyMMddhhmmss);
        async.waterfall(
            [
                function (callback) {
                    var sql = sqlQuery.select().from('model_timer_task').select('max_num', 'run_num', 'last_modelStatus', 'last_jobStatus').where({id: task.mainTaskId}).build();
                    logger.debug('获取当前任务执行的个数sql:' + sql);
                    query(sql, function (error, rows, columns) {
                        if (error) {
                            logger.error('检查运行次数错误:' + error);
                            callback(null);
                        } else if (rows[0].run_num >= rows[0].max_num && task.maxNum > 0) {
                            logger.warn('定时任务达到最大个数');
                            timer.cancelTimerTask(task.mainTaskId);
                            return;
                        } else {
                            callback(null, rows[0]);
                        }
                    });
                },
                function (row, callback) {
                    //如果任务是串行任务 ，当最后一次任务没有完成时，需要将当前任务缓存起来
                    if (task.isParalle == 2 && !(row.last_modelStatus == 2 || row.last_jobStatus == 0)) {
                        var time = new Date().getTime();
                        var serialCacheId = task.mainTaskId + '_' + time
                        task.serialCacheId = serialCacheId;
                        task.taskId = taskObj.taskId;
                        serialCache[serialCacheId] = task;
                        var sql = sqlQuery.insert().into('model_task_cache').set({
                            id: taskObj.taskId,
                            taskId: task.mainTaskId,
                            taskType: 1,
                            serialCacheId: serialCacheId,
                            beginTime: task.endTime,
                            endTime: task.endTime,
                            sliceNum: task.sliceNum,
                            fileIds: task.fileIds,
                            modelFiles: taskObj.modelFiles,
                            modelStatus: 1,
                            createTime: taskObj.createTime
                        }).build();
                        logger.debug('将当前串行任务加入到缓存列表sql:' + sql);
                        query(sql, function (error, rows, columns) {
                            if (error) {
                                logger.error('当前任务加入缓存列表错误:' + error);
                                return;
                            } else {
                                logger.warn('加入缓存列表成功');
                                return;
                            }
                        });
                    } else {
                        var sql = sqlQuery.insert().into('model_task_cache').set({
                            id: taskObj.taskId,
                            taskId: task.mainTaskId,
                            taskType: 1,
                            beginTime: task.endTime,
                            endTime: task.endTime,
                            sliceNum: task.sliceNum,
                            fileIds: task.fileIds,
                            modelFiles: taskObj.modelFiles,
                            modelStatus: 1,
                            createTime: taskObj.createTime
                        }).build();
                        logger.debug('创建任务缓存记录sql:' + sql);
                        query(sql, function (error, rows, columns) {
                            if (error) {
                                logger.error('启动获取即时任务信息错误:' + error);
                                return;
                            } else {
                                callback(null, row);
                            }
                        });
                    }
                },
                function (row, callback) {
                    var sql = sqlQuery.insert().into('model_run_task').set({
                        id: taskObj.taskId,
                        taskId: task.mainTaskId,
                        taskType: 1,
                        beginTime: task.endTime,
                        endTime: task.endTime,
                        sliceNum: task.sliceNum,
                        fileIds: task.fileIds,
                        modelStatus: 1,
                        createTime: taskObj.createTime
                    }).build();
                    logger.debug('创建任务运行记录sql:' + sql);
                    query(sql, function (error, rows, columns) {
                        if (error) {
                            logger.error('定时任务创建任务运行记录错误:' + error);
                            return;
                        } else {
                            callback(null, row);
                        }
                    });
                },
                function (row, callback) {
                    var sql = 'update model_timer_task set run_num = run_num + 1 where id = "' + task.mainTaskId + '"';
                    logger.debug('更新任务运行次数sql:' + sql);
                    query(sql, function (error, rows, columns) {
                        if (error) {
                            logger.error('更新任务运行次数错误:' + error);
                            return;
                        } else {
                            var taskList = new Array();
                            var obj = new Object();
                            obj.mainTaskId = taskObj.mainTaskId;
                            obj.taskId = taskObj.taskId;
                            obj.taskType = taskObj.taskType;
                            obj.beginTime = taskObj.beginTime;
                            obj.endTime = taskObj.endTime;
                            obj.sliceNum = taskObj.sliceNum;
                            obj.modelFiles = taskObj.modelFiles;
                            obj.createTime = taskObj.createTime;
                            taskList.push(obj);
                            taskCache[taskObj.taskId] = obj;
                            if (GlobalAgent.sparkSocket) {
                                GlobalAgent.sparkSocket.emit('spark/startMessage', {queryId: uuid.v1(), data: taskList});
                            }
                        }
                    });
                }
            ],
            function (error) {
                if (error) {
                    logger.error('创建任务失败错误：' + err)
                    message.flag = -1;
                    message.message = '创建任务失败';
                    message.data = null;
                    socket.emit('model/startTask', {data: message});
                }
            });
    },
    stopTask: function (taskId) {
        if (GlobalAgent.sparkSocket) {
            GlobalAgent.sparkSocket.emit('spark/startMessage', {taskId: taskId});
        }
    },
    /**
     * 停止定时任务
     * @param task
     * @param callback
     */
    stopTimerTask: function (taskId, callback) {
        logger.warn('删除缓存任务');
        var sql = 'delete from model_task_cache where  taskId = "' + taskId + '"';
        logger.debug('停止任务删除缓存sql:' + sql);
        query(sql, function (err, rows, columns) {
            if (err) {
                logger.error('删除缓存任务失败');
                callback(-1);
                return;
            } else {
                timer.stopTimerTask(taskId, callback);
            }
        });

    },
    /**
     * 移除缓存
     * @param taskIds
     */
    removeTaskCache: function (taskIdList) {
        for (var i in taskIdList) {
            delete taskCache[taskIdList[i]];
        }
        var sql = sqlQuery.remove().from('model_task_cache').where({id: taskIdList}).build();
        logger.debug('删除数据库缓存数据sql：' + sql);
        query(sql, function (error, rows, columns) {
            if (error) {
                logger.error('删除数据库缓存错误：' + error);
            } else {
                logger.debug('删除数据缓存成功');
            }
        });
    },
    /**
     * 刷新 串行任务接口
     * @param taskIds
     */
    refreashSerialCache: function (taskIds) {
        var taskArray = new Array();
        for (var i in serialCache) {
            var obj = serialCache[i];
            if (typeof(obj) != 'function') {
                taskArray.push(obj);
            }
        }
        taskArray.sort(function (a, b) {
            var aId = a.serialCacheId;
            var bId = b.serialCacheId;

            var aTime = aId.split('_')[1];
            var bTime = bId.split('_')[1];
            return aTime - bTime;
        });
        var task = taskArray[0];
        var time = Utils.dateFormat(new Date().getTime(), Utils.yyyyMMddhhmmss);
        async.waterfall(
            [
                function (row, callback) {
                    //如果任务是串行任务 ，当最后一次任务没有完成时，需要将当前任务缓存起来
                    var sql = sqlQuery.update().into('model_task_cache').set({
                        serialCacheId: null,
                        updateTime: time
                    }).where({runTaksId: task.taskId}).build();
                    logger.debug('创建任务缓存记录sql:' + sql);
                    query(sql, function (error, rows, columns) {
                        if (error) {
                            logger.error('启动获取即时任务信息错误:' + error);
                            return;
                        } else {
                            callback(null, row);
                        }
                    });
                },
                function (row, callback) {
                    var sql = sqlQuery.insert().into('model_run_task').set({
                        taskId: task.mainTaskId,
                        taskType: 1,
                        beginTime: task.endTime,
                        endTime: task.endTime,
                        sliceNum: task.sliceNum,
                        fileIds: task.fileIds,
                        modelStatus: 1,
                        createTime: time
                    }).build();
                    logger.debug('创建任务运行记录sql:' + sql);
                    query(sql, function (error, rows, columns) {
                        if (error) {
                            logger.error('定时任务创建任务运行记录错误:' + error);
                            return;
                        } else {
                            callback(null, row);
                        }
                    });
                },
                function (row, callback) {
                    var sql = sqlQuery.update().into('model_timer_task').set({run_num: run_num + 1}).where({id: task.mainTaskId}).build();
                    logger.debug('创建任务缓存记录sql:' + sql);
                    query(sql, function (error, rows, columns) {
                        if (error) {
                            logger.error('更新任务运行次数错误:' + error);
                            return;
                        } else {
                            var taskList = new Array();
                            var obj = new Object();
                            obj.mainTaskId = task.mainTaskId;
                            obj.taskId = task.taskId;
                            obj.taskType = task.taskType;
                            obj.beginTime = task.beginTime;
                            obj.endTime = task.endTime;
                            obj.sliceNum = task.sliceNum;
                            obj.modelFiles = task.modelFiles;
                            obj.createTime = time;
                            taskList.push(obj);
                            taskCache[task.taskId] = obj;
                            if (GlobalAgent.sparkSocket) {
                                GlobalAgent.sparkSocket.emit('spark/startMessage', {queryId: uuid.v1(), data: taskList});
                            }
                        }
                    });
                }
            ],
            function (error) {
                if (error) {
                    logger.error('创建任务失败错误：' + err)
                    message.flag = -1;
                    message.message = '创建任务失败';
                    message.data = null;
                    socket.emit('model/startTask', {data: message});
                }
            });
    },
    /**
     * 刷新定时任务列表
     * @param taskRows
     */
    rebootServer: function (taskCache, serialCache) {
        var taskList = new Array();
        var time = Utils.dateFormat(new Date().getTime(), Utils.yyyyMMddhhmmss);
        for (var i in taskCache) {
            var task = taskCache[i];
            var taskObj = new Object();
            taskObj.mainTaskId = task.taskId;
            taskObj.taskId = task.id;
            taskObj.taskType = task.taskType;
            taskObj.sliceNum = task.sliceNum;
            taskObj.beginTime = task.beginTime;
            taskObj.endTime = task.endTime;
            taskObj.modelFiles = task.modelFiles;
            taskObj.createTime = time;
            taskList.push(taskObj);
            taskCache[taskObj.taskId] = taskObj;
        }
        if (taskList.length > 0 && GlobalAgent.sparkSocket) {
            if (GlobalAgent.sparkSocket) {
                GlobalAgent.sparkSocket.emit('spark/startTask', {queryId: uuid.v1(), data: taskList});
            }
        }
        for (var j in serialCache) {
            var task = serialCache[j];
            serialCache[task.serialCacheId] = task;
        }
    },
    /**
     * 重启定时任务
     * @param row
     */
    rebootTimerTask: function (timerTask) {
        var taskObj = new Object();
        taskObj.mainTaskId = timerTask.id;
        taskObj.taskType = 1;
        taskObj.cutoffTime = timerTask.cutoff_time;
        taskObj.durtion = timerTask.durtion;
        taskObj.isParalle = timerTask.task_type;
        taskObj.sliceNum = timerTask.slice_num
        taskObj.maxNum = timerTask.max_num;
        taskObj.timerType = timerTask.timer_type;
        taskObj.day = timerTask.day;
        taskObj.hour = timerTask.hour;
        taskObj.minute = timerTask.minute;
        taskObj.fileIds = timerTask.file_ids;
        taskObj.modelFiles = timerTask.modelFiles;
        timer.startSchedule(taskObj, this.timerTaskCallback)
    },
    /**
     * 刷新 缓存
     * @param GlobalAgent
     */
    refreshCache: function () {
        var taskList = new Array();
        var time = Utils.dateFormat(new Date().getTime(), Utils.yyyyMMddhhmmss);
        for (var i in taskCache) {
            var task = taskCache[i];
            if (typeof (task) != 'function') {
                task.createTime = time;
                taskList.push(task);
            }
        }
        if (taskList.length > 0 && GlobalAgent.sparkSocket) {
            if (GlobalAgent.sparkSocket) {
                GlobalAgent.sparkSocket.emit('spark/startTask', {queryId: uuid.v1(), data: taskList});
            }
        }
    }
}

module.exports = sparkModule;

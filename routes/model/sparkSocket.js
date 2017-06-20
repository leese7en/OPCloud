var actionUtil = require("../framework/action/actionUtils")();
var query = actionUtil.query;
var Utils = require('../utils/tools/utils');
var sqlQuery = require('sql-query').Query();
var logger = require('log4js').getLogger('model');
var GlobalAgent = require('../message/GlobalAgent');
var sparkModule = require('./sparkModule');
var async = require("async");
var message = {
    flag: 0,
    message: '成功',
    data: null
};
var sparkSocket = {
    socketOn: function (socket) {
        socket.on('spark/startMessage', function (data) {
            data = JSON.parse(data);
            logger.debug(data);
            var flag = data.flag;
            if (flag < 0) {
                logger.error('启动任务错误：' + data.message);
            } else {
                var taskIdList = data.taskIdList;
                var queryId = data.queryId;
                logger.warn('taskID  ' + taskIdList + ' is runing');
                sparkModule.removeTaskCache(taskIdList);
            }
        });
        socket.on('spark/stopMessage', function (data) {
            var flag = data.flag;
            if (flag < 0) {
                logger.error('停止任务错误:' + data.message);
            } else {

            }
        });
        socket.on('spark/taskStatus', function (data) {
            data = JSON.parse(data);
            logger.error(data);
            var taskStatus = data.data;
            var sqlRun = '';
            var sqlImTask = '';
            var sqlTimerTask = ''
            var taskRunLog = '';
            var taskStatusIdList = new Array();
            if (!taskStatus || taskStatus.length < 1) {
                logger.warn('消息内容为空:' + taskStatus);
                socket.emit(GlobalAgent.STATUS_MESSAGE, {flag: -1, message: '内容为空', taskStatusIdList: taskStatusIdList});
                return;
            }
            var sqlTask = '';
            // for (var i in taskStatus) {
            //     var task = taskStatus[i];
            //     //通知用户任务运行状态改变
            //     GlobalAgent.agentTaskStatus(task);
            //     taskStatusIdList.push(task.taskStatusId);
            //     var modelStatus = task.modelStatus;
            //     if (modelStatus) {
            //         sqlRun += 'update model_run_task set modelStatus = ' + task.modelStatus + ' where id = "' + task.taskId + '";';
            //         var logSql = sqlQuery.insert().into('model_task_log').set({
            //             taskId: task.taskId,
            //             modelStatus: task.modelStatus,
            //             message: task.message,
            //             logpath: task.logPath,
            //             appId: task.appId,
            //             create_time: task.time
            //         }).build();
            //         taskRunLog += logSql + ';';
            //         var type = task.taskType;
            //         if (type == 0) {
            //             var status = task.modelStatus;
            //             if (status == 2) {
            //                 sqlImTask += 'update model_task set run_num = run_num + 1 ,modelStatus = ' + status + ', update_time="' + Utils.dateFormat(new Date().getTime(), Utils.yyyyMMddhhmmss) + '" where id = "' + task.mainTaskId + '";';
            //             } else {
            //                 sqlImTask += 'update model_task set modelStatus = ' + status + ', update_time="' + Utils.dateFormat(new Date().getTime(), Utils.yyyyMMddhhmmss) + '" where id = "' + task.mainTaskId + '";';
            //             }
            //         } else {
            //             var status = task.modelStatus;
            //             if (status == 2) {
            //                 sqlTimerTask += 'update model_timer_task set run_num = run_num + 1 ,last_modelStatus= 2,update_time="' + Utils.dateFormat(new Date().getTime(), Utils.yyyyMMddhhmmss) + '" where id = "' + task.mainTaskId + '";';
            //             } else {
            //                 sqlTimerTask += 'update model_timer_task set last_modelStatus= ' + task.modelStatus + ',update_time = "' + Utils.dateFormat(new Date().getTime(), Utils.yyyyMMddhhmmss) + '" where id = "' + task.mainTaskId + '";';
            //             }
            //         }
            //     } else {
            //         sqlRun += 'update model_run_task set jobStatus = ' + task.jobStatus + ' where id = "' + task.taskId + '";';
            //         var logSql = sqlQuery.insert().into('model_task_log').set({
            //             taskId: task.taskId,
            //             jobStatus: task.jobStatus,
            //             message: task.message,
            //             logpath: task.logPath,
            //             appId: task.appId,
            //             create_time: task.time
            //         }).build();
            //         taskRunLog += logSql + ';';
            //         var type = task.taskType;
            //         if (type == 0) {
            //             sqlImTask += 'update model_task set jobStatus= ' + task.jobStatus + ', update_time="' + Utils.dateFormat(new Date().getTime(), Utils.yyyyMMddhhmmss) + '" where id = "' + task.mainTaskId + '";';
            //         } else {
            //             sqlTimerTask += 'update model_timer_task set last_jobStatus= 2,update_time="' + Utils.dateFormat(new Date().getTime(), Utils.yyyyMMddhhmmss) + '" where id = "' + task.mainTaskId + '";';
            //         }
            //     }
            // }
            // sqlTask = sqlImTask + sqlTimerTask;
            // async.waterfall(
            //     [
            //         function (callback) {
            //             logger.debug('创建任务运行日志sql：' + taskRunLog);
            //             query(taskRunLog, function (error, row, columns) {
            //                 if (error) {
            //                     logger.error('创建任务运行日志错误：' + error);
            //                     socket.emit(GlobalAgent.STATUS_MESSAGE, {flag: -1, message: '创建任务运行日志', taskStatusIdList: taskStatusIdList});
            //                     return;
            //                 } else {
            //                     callback(null);
            //                 }
            //             });
            //         },
            //         function (callback) {
            //             logger.debug('更新运行任务状态sql:' + sqlRun);
            //             query(sqlRun, function (error, rows, columns) {
            //                 if (error) {
            //                     logger.error('更新运行任务状态错误:' + error);
            //                     socket.emit(GlobalAgent.STATUS_MESSAGE, {flag: -1, message: '更新运行任务状态失败', taskStatusIdList: taskStatusIdList});
            //                     return;
            //                 } else {
            //                     callback(null);
            //                 }
            //             });
            //         },
            //         function (callback) {
            //             logger.debug('更新任务状态sql:' + sqlTask);
            //             query(sqlTask, function (error, rows, columns) {
            //                 if (error) {
            //                     logger.error('更新任务状态错误:' + error);
            //                     socket.emit(GlobalAgent.STATUS_MESSAGE, {flag: -1, message: '更新任务状态失败', taskStatusIdList: taskStatusIdList});
            //                     return;
            //                 } else {
            //                     socket.emit(GlobalAgent.STATUS_MESSAGE, {flag: 0, message: 'OK', taskStatusIdList: taskStatusIdList});
            //                     return;
            //                 }
            //             });
            //         }
            //     ],
            //     function (error) {
            //         if (error) {
            //             logger.error('更新任务状态错误:' + error);
            //             socket.emit(GlobalAgent.STATUS_MESSAGE, {flag: -1, message: '更新任务状态失败', taskStatusIdList: taskStatusIdList});
            //         }
            //     });
        });
    }
}
module.exports = sparkSocket;

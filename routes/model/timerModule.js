/**
 * Created by se7en on 2017/3/3.
 */
var logger = require('log4js').getLogger('model');
var schedule = require("node-schedule");
var scheduleList = new Object();
var Utils = require('../utils/tools/utils');
var cronJob = require("cron").CronJob;
var timerModule = {
    /**
     * 定时任务管理
     */
    startSchedule: function (timerTask, callback) {
        var that = this;
        var timerType = parseInt(timerTask.timerType);
        var rule = new schedule.RecurrenceRule();
        var j;
        switch (timerType) {
            case 1:
                rule.hour = timerTask.hour;
                rule.minute = timerTask.minute;
                var j = schedule.scheduleJob(rule, function () {
                    var time = new Date().getTime();
                    that.runTimerTask(time, timerTask, callback);
                });
                scheduleList[timerTask.mainTaskId] = j;
                break;
            case 2:
                rule.dayOfWeek = timerTask.day;
                rule.hour = timerTask.hour;
                rule.minute = timerTask.minute;
                var j = schedule.scheduleJob(rule, function () {
                    var time = new Date().getTime();
                    that.runTimerTask(time, timerTask, callback);
                });
                scheduleList[timerTask.mainTaskId] = j;
                break;
            case 3:
                rule.month = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
                rule.day = timerTask.day;
                rule.hour = timerTask.hour;
                rule.minute = timerTask.minute;
                var j = schedule.scheduleJob(rule, function () {
                    var time = new Date().getTime();
                    that.runTimerTask(time, timerTask, callback);
                });
                scheduleList[timerTask.mainTaskId] = j;
                break;
            case 4:
                var minute = timerTask.day * 1440 + timerTask.hour * 60 + timerTask.minute;
                var tt = '*/' + minute + ' * * * *';
                var j = schedule.scheduleJob(tt, function () {
                    var time = new Date().getTime();
                    that.runTimerTask(time, timerTask, callback);
                });
                scheduleList[timerTask.mainTaskId] = j;
                break;
            default:
                rule.day = timerTask.day;
                rule.hour = timerTask.hour;
                rule.minute = timerTask.minute;
                var j = schedule.scheduleJob(rule, function () {
                    var time = new Date().getTime();
                    that.runTimerTask(time, timerTask, callback);
                });
                scheduleList[timerTask.mainTaskId] = j;
                break;
        }
    },
    runTimerTask: function (time, timerTask, callback) {
        var endTime = time - timerTask.cutoffTime * 60 * 1000;
        var beginTime = endTime - timerTask.durtion * 60 * 1000;
        var task = new Object();
        task.mainTaskId = timerTask.mainTaskId;
        task.taskType = 1;
        task.beginTime = Utils.dateFormat(beginTime, Utils.yyyyMMddhhmmss);
        task.endTime = Utils.dateFormat(endTime, Utils.yyyyMMddhhmmss);
        task.sliceNum = timerTask.sliceNum;
        task.fileIds = timerTask.file_ids;
        task.modelFiles = timerTask.modelFiles;
        task.isParalle = timerTask.isParalle;
        task.maxNum = timerTask.maxNum;
        task.ceateTime = Utils.dateFormat(time, Utils.yyyyMMddhhmmss);
        callback(task);
    },
    cancelTimerTask: function (taskId) {
        var j = scheduleList[taskId];
        j.cancel();
    },
    stopTimerTask: function (taskId, callback) {
        var j = scheduleList[taskId];
        if (j) {
            j.cancel();
        }
        callback(0);
    }

}
module.exports = timerModule;


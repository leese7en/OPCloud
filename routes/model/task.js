var actionUtil = require("../framework/action/actionUtils")();
var query = actionUtil.query;
var Utils = require('../utils/tools/utils');
var sqlQuery = require('sql-query').Query();
var log4js = require('log4js');
var logger = log4js.getLogger('model');
var http = require('http');
var async = require("async");
var uuid = require('node-uuid');
var message = {
    flag: 0,
    message: '成功',
    data: null
};
var taskManagement = {

    /**
     * 查询任务列表信息
     * @param req
     * @param res
     */
    queryTask: function (req, res) {
        var taskName = req.body.taskName;
        var taskDesc = req.body.taskDesc;
        var status = req.body.taskStatus;
        var statusCon = '';
        if (status != '-1') {
            statusCon = ' and status = ' + status;
        }
        var companyId = req.session.user.ENTERPRISE_ID;
        var result = {
            total: 0,
            rows: []
        };
        var offset = req.body.offset || 0;
        var limit = req.body.limit || 10;
        async.waterfall(
            [
                function (callback) {
                    var sqlCount = 'SELECT count(id) as count  from (select id FROM model_task WHERE is_deleted = 0 and industry_id =  ' + companyId + ' and name like "%' + taskName + '%" and description like "%' + taskDesc + '%" ' + statusCon;
                    sqlCount += ' UNION SELECT id FROM model_timer_task WHERE is_deleted = 0 and  industry_id =  ' + companyId + ' and name like "%' + taskName + '%" and description like "%' + taskDesc + '%"' + statusCon + ')t';
                    logger.debug('获取任务列表总个数sql：' + sqlCount);
                    query(sqlCount, function (err, rows, columns) {
                        if (err) {
                            logger.error('获取任务列表失败：' + err)
                            message.flag = -1
                            message.message = '获取任务列表失败'
                            message.data = result;
                            res.json(message)
                            return;
                        } else {
                            callback(null, rows[0].count);
                        }
                    });
                },
                function (count, callback) {
                    var page = ' limit ' + offset + ',' + limit;
                    var sql = 'SELECT * from (select id, name,description, 0 AS taskType, modelStatus,jobStatus,last_modelStatus,last_jobStatus,run_num,create_time,update_time FROM model_task WHERE is_deleted = 0 and industry_id =  ' + companyId + ' and name like "%' + taskName + '%" and description like "%' + taskDesc + '%" ' + statusCon;
                    sql += ' UNION SELECT id,name , description, 1 AS taskType, modelStatus,jobStatus,last_modelStatus,last_jobStatus,run_num,create_time,update_time FROM model_timer_task WHERE is_deleted = 0 and industry_id =  ' + companyId + ' and name like "%' + taskName + '%" and description like "%' + taskDesc + '%"' + statusCon + ')t order by update_time ' + page;
                    logger.debug('获取任务列表sql：' + sql);
                    query(sql, function (err, rows, columns) {
                        if (err) {
                            logger.error('获取任务列表失败：' + err)
                            message.flag = -1
                            message.message = '获取任务列表失败'
                            message.data = result;
                            res.json(message)
                            return;
                        } else {
                            message.flag = 0
                            message.message = 'OK'
                            result.total = count;
                            result.rows = rows;
                            message.data = result
                            res.json(message)
                            return;
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
                    res.json(message)
                    return
                }
            });
    },

    /**
     * 新增即时任务
     * @param request
     * @param response
     */
    createTask: function (req, res) {
        var taskName = req.body.taskName;
        var taskDesc = req.body.taskDesc;

        if (!taskName) {
            message.flag = -1;
            message.message = '任务名称不能为空';
            message.data = null;
            res.json(message);
            return;
        }
        var taskBeginTime = req.body.taskBeginTime;
        var taskEndTime = req.body.taskEndTime;

        if (!taskBeginTime || !taskEndTime) {
            message.flag = -1;
            message.message = '开始时间结束时间都不能为空';
            message.data = null;
            res.json(message);
            return;
        }
        var taskSlice = req.body.taskSlice;

        if (typeof (taskSlice) == 'number' && taskSlice < 1) {
            message.flag = -1;
            message.message = '分片数量不能小于1';
            message.data = null;
            res.json(message);
            return;
        }
        var taskFiles = req.body.taskFiles;
        if (!taskFiles) {
            message.flag = -1;
            message.message = '任务文件不能为空';
            message.data = null;
            res.json(message);
            return;
        }
        var user = req.session.user;
        var userID = user.USER_ID;
        var companyID = user.ENTERPRISE_ID;

        async.waterfall(
            [
                function (callback) {
                    var sqlName = 'SELECT count(id) as count from model_task where is_deleted =0 and name = "' + taskName + '" and industry_id = ' + companyID;
                    logger.debug('检查是否有同名的任务sql：' + sqlName);
                    query(sqlName, function (err, rows, columns) {
                        if (err) {
                            logger.error('检查同名任务错误：' + err);
                            message.flag = -1;
                            message.message = '创建任务失败';
                            message.data = null;
                            res.send(message);
                            return;
                        } else if (rows[0].count > 0) {
                            message.flag = -1;
                            message.message = '存在同名任务';
                            message.data = null;
                            res.send(message);
                            return;
                        }
                        else {
                            callback(null);
                        }
                    });
                },
                function (callback) {
                    var sql = sqlQuery.insert().into('model_task').set({
                        id: uuid.v1(),
                        name: taskName,
                        description: taskDesc,
                        user_id: userID,
                        industry_id: companyID,
                        begin_time: taskBeginTime,
                        end_time: taskEndTime,
                        slice_num: taskSlice,
                        file_ids: taskFiles,
                        create_time: Utils.dateFormat(new Date().getTime(), Utils.yyyyMMddhhmmss),
                        update_time: Utils.dateFormat(new Date().getTime(), Utils.yyyyMMddhhmmss)
                    }).build();
                    logger.debug('创建即时任务sql：' + sql);
                    query(sql, function (err, result, columns) {
                        if (err) {
                            logger.error('创建即时任务错误：' + err);
                            message.flag = -1;
                            message.message = '创建即时任务失败';
                            message.data = null;
                            res.send(message);
                            return;
                        }
                        else {
                            message.flag = 0;
                            message.message = 'OK';
                            message.data = null;
                            res.send(message);
                            return;
                        }
                    });
                }
            ],
            function (error) {
                if (error) {
                    logger.error('创建即时任务错误：' + err)
                    message.flag = -1
                    message.message = '创建即时任务失败'
                    message.data = result;
                    res.json(message)
                    return
                }
            });
    },
    /**
     * 新增定时任务
     * @param request
     * @param response
     */
    createTimerTask: function (req, res) {
        var taskName = req.body.taskName;
        var taskDesc = req.body.taskDesc;
        if (!taskName) {
            message.flag = -1;
            message.message = '任务名称不能为空';
            message.data = null;
            res.json(message);
            return;
        }
        var cutoffTime = req.body.cutoffTime;
        if (typeof(cutoffTime) == 'number' && cutoffTime < 1) {
            message.flag = -1;
            message.message = '取数截止时间不能小于1';
            message.data = null;
            res.json(message);
            return;
        }

        var durtion = req.body.durtion;
        if (typeof(durtion) == 'number' && durtion < 1) {
            message.flag = -1;
            message.message = '取数时长不能小于1';
            message.data = null;
            res.json(message);
            return;
        }
        var timerSlice = req.body.timerSlice;
        if (typeof (timerSlice) == 'number' && timerSlice < 1) {
            message.flag = -1;
            message.message = '分片数量不能小于1';
            message.data = null;
            res.json(message);
            return;
        }
        var taskType = req.body.taskType;
        var runnum = req.body.runnum;
        var timerType = req.body.timerType;
        var day = req.body.day;
        var hour = req.body.hour;
        var minute = req.body.minute;
        var timerFiles = req.body.timerFiles;
        if (!timerFiles) {
            message.flag = -1;
            message.message = '任务文件不能为空';
            message.data = null;
            res.json(message);
            return;
        }
        if (timerType == 4) {
            if ((day * 1440 + hour * 60 + minute) < 0) {
                message.flag = -1;
                message.message = '时间间隔不能小于30分钟';
                message.data = null;
                res.json(message);
                return;
            }
        }
        var user = req.session.user;
        var userID = user.USER_ID;
        var companyID = user.ENTERPRISE_ID;
        async.waterfall(
            [
                function (callback) {
                    var sqlName = 'SELECT count(id) as count from model_timer_task where is_deleted = 0 and name = "' + taskName + '" and industry_id = ' + companyID;
                    logger.debug('检查是否有同名的任务sql：' + sqlName);
                    query(sqlName, function (err, rows, columns) {
                        if (err) {
                            logger.error('检查同名任务错误：' + err);
                            message.flag = -1;
                            message.message = '创建定时任务失败';
                            message.data = null;
                            res.send(message);
                            return;
                        } else if (rows[0].count > 0) {
                            message.flag = -1;
                            message.message = '存在同名任务';
                            message.data = null;
                            res.send(message);
                            return;
                        }
                        else {
                            callback(null);
                        }
                    });
                },
                function (callback) {
                    var sql = sqlQuery.insert().into('model_timer_task').set({
                        id: uuid.v1(),
                        name: taskName,
                        description: taskDesc,
                        user_id: userID,
                        industry_id: companyID,
                        cutoff_time: cutoffTime,
                        durtion: durtion,
                        slice_num: timerSlice,
                        task_Type: taskType,
                        max_num: runnum,
                        timer_type: timerType,
                        day: day,
                        hour: hour,
                        minute: minute,
                        file_ids: timerFiles,
                        create_time: Utils.dateFormat(new Date().getTime(), Utils.yyyyMMddhhmmss),
                        update_time: Utils.dateFormat(new Date().getTime(), Utils.yyyyMMddhhmmss)
                    }).build();
                    logger.debug('创建定时任务sql：' + sql);
                    query(sql, function (err, result, columns) {
                        if (err) {
                            logger.error('创建定时任务错误：' + err);
                            message.flag = -1;
                            message.message = '创建定时任务失败';
                            message.data = null;
                            res.send(message);
                            return;
                        }
                        else {
                            message.flag = 0;
                            message.message = 'OK';
                            message.data = null;
                            res.send(message);
                            return;
                        }
                    });
                }
            ],
            function (error) {
                if (error) {
                    logger.error('创建定时任务错误：' + err)
                    message.flag = -1
                    message.message = '创建定时任务失败'
                    message.data = result;
                    res.json(message)
                    return
                }
            });
    },
    /**
     * 获取即时任务信息
     * @param req
     * @param res
     */
    getTaskById: function (req, res) {
        var id = req.body.id;
        async.waterfall(
            [
                function (callback) {
                    var sql = 'select id, name ,description,begin_time,end_time,slice_num,file_ids from model_task where id = "' + id + '"';
                    logger.debug('获取即时任务信息sql：' + sql);
                    query(sql, function (error, rows, columns) {
                        if (error) {
                            logger.error('获取即时任务信息错误:' + error);
                            message.flag = -1;
                            message.message = '获取任务信息失败';
                            message.data = null;
                            res.json(message);
                            return;
                        } else {
                            callback(null, rows[0]);
                        }
                    });
                },
                function (row, callback) {
                    var sql = 'select id,name from sys_file where file_type=3 and id in (' + row.file_ids + ')';
                    logger.debug('获取任务文件信息sql：' + sql);
                    query(sql, function (error, rows, columns) {
                        if (error) {
                            logger.error('获取任务文件信息错误:' + error);
                            message.flag = -1;
                            message.message = '获取任务信息失败';
                            message.data = null;
                            res.json(message);
                            return;
                        } else {
                            var length = rows.length;
                            var names = '';
                            for (var i = 0; i < length; i++) {
                                names += rows[i].name;
                                if (rows[i + 1]) {
                                    names += ',';
                                }
                            }
                            row.file_names = names;
                            message.flag = 0;
                            message.message = 'OK';
                            message.data = row;
                            res.json(message);
                        }
                    });
                }
            ],
            function (error) {
                if (error) {
                    logger.error('获取任务信息错误：' + err)
                    message.flag = -1
                    message.message = '获取任务信息失败'
                    message.data = null;
                    res.json(message)
                    return;
                }
            });
    },
    /**
     * 获取定时任务信息
     * @param req
     * @param res
     */
    getTimerTaskById: function (req, res) {
        var id = req.body.id;
        async.waterfall(
            [
                function (callback) {
                    var sql = 'SELECT id ,name ,description,cutoff_time ,durtion,slice_num ,file_ids,task_type,max_num,timer_type,day,hour,minute from model_timer_task  where id = "' + id + '"';
                    logger.debug('获取定时任务信息sql：' + sql);
                    query(sql, function (error, rows, columns) {
                        if (error) {
                            logger.error('获取定时任务信息错误:' + error);
                            message.flag = -1;
                            message.message = '获取任务信息失败';
                            message.data = null;
                            res.json(message);
                            return;
                        } else {
                            callback(null, rows[0]);
                        }
                    });
                },
                function (row, callback) {
                    var sql = 'select id,name from sys_file where file_type=3 and id in (' + row.file_ids + ')';
                    logger.debug('获取任务文件信息sql：' + sql);
                    query(sql, function (error, rows, columns) {
                        if (error) {
                            logger.error('获取任务文件信息错误:' + error);
                            message.flag = -1;
                            message.message = '获取任务信息失败';
                            message.data = null;
                            res.json(message);
                            return;
                        } else {
                            var length = rows.length;
                            var names = '';
                            for (var i = 0; i < length; i++) {
                                names += rows[i].name;
                                if (rows[i + 1]) {
                                    names += ',';
                                }
                            }
                            row.file_names = names;
                            message.flag = 0;
                            message.message = 'OK';
                            message.data = row;
                            res.json(message);
                        }
                    });
                }
            ],
            function (error) {
                if (error) {
                    logger.error('获取任务信息错误：' + err)
                    message.flag = -1
                    message.message = '获取任务信息失败'
                    message.data = null;
                    res.json(message)
                    return;
                }
            });
    },
    /**
     * 更新即时任务
     * @param req
     * @param res
     */
    updateTask: function (req, res) {
        var taskId = req.body.taskId;
        var taskName = req.body.taskName;
        var taskDesc = req.body.taskDesc;
        if (!taskName) {
            message.flag = -1;
            message.message = '任务名称不能为空';
            message.data = null;
            res.json(message);
            return;
        }
        var taskBeginTime = req.body.taskBeginTime;
        var taskEndTime = req.body.taskEndTime;

        if (!taskBeginTime || !taskEndTime) {
            message.flag = -1;
            message.message = '开始时间结束时间都不能为空';
            message.data = null;
            res.json(message);
            return;
        }
        var taskSlice = req.body.taskSlice;

        if (typeof (taskSlice) == 'number' && taskSlice < 1) {
            message.flag = -1;
            message.message = '分片数量不能小于1';
            message.data = null;
            res.json(message);
            return;
        }
        var taskFiles = req.body.taskFiles;
        if (!taskFiles) {
            message.flag = -1;
            message.message = '任务文件不能为空';
            message.data = null;
            res.json(message);
            return;
        }
        var user = req.session.user;
        var companyID = user.ENTERPRISE_ID;
        async.waterfall(
            [
                function (callback) {
                    var sqlName = 'SELECT count(id) as count from model_task where is_deleted =0 and  name = "' + taskName + '" and id != ' + taskId + ' and industry_id = ' + companyID;
                    logger.debug('检查是否有同名的任务sql：' + sqlName);
                    query(sqlName, function (err, rows, columns) {
                        if (err) {
                            logger.error('检查同名任务错误：' + err);
                            message.flag = -1;
                            message.message = '创建任务失败';
                            message.data = null;
                            res.send(message);
                            return;
                        } else if (rows[0].count > 0) {
                            message.flag = -1;
                            message.message = '存在同名任务';
                            message.data = null;
                            res.send(message);
                            return;
                        }
                        else {
                            callback(null);
                        }
                    });
                },
                function (callback) {
                    var sql = sqlQuery.update().into('model_task').set({
                        name: taskName,
                        description: taskDesc,
                        begin_time: taskBeginTime,
                        end_time: taskEndTime,
                        slice_num: taskSlice,
                        file_ids: taskFiles,
                        update_time: Utils.dateFormat(new Date().getTime(), Utils.yyyyMMddhhmmss)
                    }).where({
                        id: taskId
                    }).build();
                    logger.debug('创建即时任务sql：' + sql);
                    query(sql, function (err, result, columns) {
                        if (err) {
                            logger.error('创建即时任务错误：' + err);
                            message.flag = -1;
                            message.message = '创建即时任务失败';
                            message.data = null;
                            res.send(message);
                            return;
                        }
                        else {
                            message.flag = 0;
                            message.message = 'OK';
                            message.data = null;
                            res.send(message);
                            return;
                        }
                    });
                }
            ],
            function (error) {
                if (error) {
                    logger.error('创建即时任务错误：' + err)
                    message.flag = -1
                    message.message = '创建即时任务失败'
                    message.data = result;
                    res.json(message)
                    return
                }
            });
    },
    /**
     * 更新定时任务
     * @param req
     * @param res
     */
    updateTimerTask: function (req, res) {
        var taskId = req.body.taskId;
        var taskName = req.body.taskName;
        var taskDesc = req.body.taskDesc;
        if (!taskName) {
            message.flag = -1;
            message.message = '任务名称不能为空';
            meesage.data = null;
            res.json(message);
            return;
        }
        var cutoffTime = req.body.cutoffTime;
        if (typeof(cutoffTime) == 'number' && cutoffTime < 1) {
            message.flag = -1;
            message.message = '取数截止时间不能小于1';
            message.data = null;
            res.json(message);
            return;
        }

        var durtion = req.body.durtion;
        if (typeof(durtion) == 'number' && durtion < 1) {
            message.flag = -1;
            message.message = '取数时长不能小于1';
            message.data = null;
            res.json(message);
            return;
        }
        var timerSlice = req.body.timerSlice;
        if (typeof (timerSlice) == 'number' && timerSlice < 1) {
            message.flag = -1;
            message.message = '分片数量不能小于1';
            message.data = null;
            res.json(message);
            return;
        }
        var taskType = req.body.taskType;
        var runnum = req.body.runnum;
        var timerType = req.body.timerType;
        var day = req.body.day;
        var hour = req.body.hour;
        var minute = req.body.minute;
        var timerFiles = req.body.timerFiles;
        if (!timerFiles) {
            message.flag = -1;
            message.message = '任务文件不能为空';
            message.data = null;
            res.json(message);
            return;
        }
        if (timerType == 4) {
            if ((day * 1440 + hour * 60 + minute) < 0) {
                message.flag = -1;
                message.message = '时间间隔不能小于30分钟';
                message.data = null;
                res.json(message);
                return;
            }
        }
        var user = req.session.user;
        var companyID = user.ENTERPRISE_ID;
        async.waterfall(
            [
                function (callback) {
                    var sqlName = 'SELECT count(id) as count from model_timer_task where is_deleted =0 and name = "' + taskName + '" and id != ' + taskId + ' and industry_id = ' + companyID;
                    logger.debug('检查是否有同名的任务sql：' + sqlName);
                    query(sqlName, function (err, rows, columns) {
                        if (err) {
                            logger.error('检查同名任务错误：' + err);
                            message.flag = -1;
                            message.message = '创建定时任务失败';
                            message.data = null;
                            res.send(message);
                            return;
                        } else if (rows[0].count > 0) {
                            message.flag = -1;
                            message.message = '存在同名任务';
                            message.data = null;
                            res.send(message);
                            return;
                        }
                        else {
                            callback(null);
                        }
                    });
                },
                function (callback) {
                    var sql = sqlQuery.update().into('model_timer_task').set({
                        name: taskName,
                        description: taskDesc,
                        cutoff_time: cutoffTime,
                        durtion: durtion,
                        slice_num: timerSlice,
                        task_Type: taskType,
                        max_num: runnum,
                        timer_type: timerType,
                        day: day,
                        hour: hour,
                        minute: minute,
                        file_ids: timerFiles,
                        update_time: Utils.dateFormat(new Date().getTime(), Utils.yyyyMMddhhmmss)
                    }).where({
                        id: taskId
                    }).build();
                    logger.debug('创建定时任务sql：' + sql);
                    query(sql, function (err, result, columns) {
                        if (err) {
                            logger.error('创建定时任务错误：' + err);
                            message.flag = -1;
                            message.message = '创建定时任务失败';
                            message.data = null;
                            res.send(message);
                            return;
                        }
                        else {
                            message.flag = 0;
                            message.message = 'OK';
                            message.data = null;
                            res.send(message);
                            return;
                        }
                    });
                }
            ],
            function (error) {
                if (error) {
                    logger.error('创建定时任务错误：' + err)
                    message.flag = -1
                    message.message = '创建定时任务失败'
                    message.data = result;
                    res.json(message)
                    return
                }
            });
    },
    /**
     * 删除即时任务
     * @param req
     * @param res
     */
    deleteTaskById: function (req, res) {
        var id = req.body.id;
        var sql = 'update model_task set is_deleted = 1  where id = ' + id;
        logger.debug('删除任务信息sql：' + sql);
        query(sql, function (error, rows, columns) {
            if (error) {
                logger.error('删除任务信息错误:' + error);
                message.flag = -1;
                message.message = '删除任务信息失败';
                message.data = null;
                res.json(message);
                return;
            } else {
                message.flag = 0;
                message.message = 'OK';
                message.data = null;
                res.json(message);
            }
        });
    },
    /**
     * 删除定时任务
     * @param req
     * @param res
     */
    deleteTimerTaskById: function (req, res) {
        var id = req.body.id;
        var sql = 'update model_timer_task set is_deleted = 1  where id = ' + id;
        logger.debug('删除定时任务信息sql：' + sql);
        query(sql, function (error, rows, columns) {
            if (error) {
                logger.error('删除定时任务信息错误:' + error);
                message.flag = -1;
                message.message = '删除任务信息失败';
                message.data = null;
                res.json(message);
                return;
            } else {
                message.flag = 0;
                message.message = 'OK';
                message.data = null;
                res.json(message);
            }
        });
    },
    /**
     * 获取任务运行数据
     * @param req
     * @param res
     */
    getRunTaskDetail: function (req, res) {
        var taskId = req.body.taskId;
        var result = {
            total: 0,
            rows: []
        };
        var offset = req.body.offset || 0;
        var limit = req.body.limit || 10;
        async.waterfall(
            [
                function (callback) {
                    var sqlCount = 'SELECT count(id) as count from model_run_task where taskId = "' + taskId + '"';
                    logger.debug('获取运行任务总个数sql：' + sqlCount);
                    query(sqlCount, function (err, rows, columns) {
                        if (err) {
                            logger.error('获取运行任务总个数失败错误：' + err)
                            res.json([])
                            return;
                        } else {
                            callback(null, rows[0].count);
                        }
                    });
                },
                function (count, callback) {
                    var page = ' limit ' + offset + ',' + limit;
                    var sql = 'SELECT id,beginTime,endTime,sliceNum,modelStatus,jobStatus,createTime from model_run_task where taskId = "' + taskId + '" ' + page;
                    logger.debug('获取运行任务列表sql：' + sql);
                    query(sql, function (err, rows, columns) {
                        if (err) {
                            logger.error('获取运行任务列表错误：' + err)
                            res.json([])
                            return;
                        } else {
                            result.total = count;
                            result.rows = rows;
                            res.json(result)
                            return;
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
                    res.json(message)
                    return
                }
            });
    },
    /**
     * 获取任务运行日志
     * @param req
     * @param res
     */
    getRunTaskLog: function (req, res) {
        var taskId = req.body.taskId;
        var sqlCount = 'id,modelStatus,jobStatus,message,logpath,create_time as createTime from model_task_log where taskId = "' + taskId + '"';
        logger.debug('获取运行任务日志sql：' + sqlCount);
        query(sqlCount, function (err, rows, columns) {
            if (err) {
                logger.error('获取任务日志错误：' + err)
                res.json([])
                return;
            } else {
                res.json(rows)
                return;
            }
        });
    }
};

module.exports = taskManagement;

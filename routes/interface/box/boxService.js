var actionUtil = require("../../framework/action/actionUtils")();
var async = require("async");
var query = actionUtil.query;
var OPAPI = require('opapi');
var Utils = require('../../utils/tools/utils');
var logger = require('log4js').getLogger('Ibox');
var GlobalAgent = require('../../message/GlobalAgent');
var sqlQuery = require('sql-query').Query();
var boxSocket = require('../../api/boxSocket');
var opPool = require('../../openplant/openPlantPoolBox');

const COMMAND_FLAG = 0x33 // 指令标识

const EDM_BOOT_DAS = 0xd  //启动das
const EDM_STOP_DAS = 0xe  //停止das
const EDM_ALL_DAS = 0x22  //获取所有采集
const EDM_ADD_DAS = 0x09  // 创建采集
const EDM_DEL_DAS = 0x05   //删除采集
const EDM_MOD_DAS = 0x09   //更新采集

const EDM_ADD_POINT = 0xa  //添加点
const EDM_MOD_POINT = 0xb  //编辑点
const EDM_DEL_POINT = 0xc  //删除点
const EDM_ALL_POINT = 0x08  //获取所有点

const EDM_ALL_DRIVER = 0x06  //查询所有驱动信息
const EDM_DRIVER_CONF = 0x21  //驱动配置信息

const UNKNOWDEVICE = 0xce
const TIMEOUT = 0xcf
const OPERATE_FAIL = 0x59
const OPERATE_SUCCESS = 0x60
const DEV_NOT_EXITS = 0x61
const DATA_PARSE = 0x62
const UPDATE_LOCAL_INFO = 0x63
const DAS_NOT_EXITS = 0x64

var message = {
    Status: 0,
    message: '成功',
    Data: null
}

var boxService = {
        /**
         * 获取驱动信息
         * @param req
         * @param res
         */
        getDriver: function (req, res) {
            var userId = req.body.userId || req.query.userId;
            var devCode = req.body.devCode || req.query.devCode;
            var driverType = req.body.driverType || req.query.driverType;
            if (!userId) {
                message.Status = false;
                message.message = '用户ID不能为空';
                message.Data = null;
                res.json(message);
                return;
            }
            if (!devCode) {
                message.Status = false;
                message.message = '设备码不能为空';
                message.Data = null;
                res.json(message);
                return;
            }
            async.waterfall(
                [
                    function (callback) {
                        var sql = sqlQuery.select().from('box_user_box').select(['user_id']).where({
                            user_id: userId,
                            dev_code: devCode,
                            status: [2, 3]
                        }).build();
                        logger.debug('获取盒子绑定信息sql:' + sql);
                        query(sql, function (error, rows) {
                            if (error) {
                                logger.error('获取盒子绑定信息错误：' + error);
                                message.Status = false;
                                message.message = '获取盒子绑定信息失败';
                                message.Data = null;
                                callback(error, message);
                            } else {
                                if (rows.length != 1) {
                                    message.Status = false;
                                    message.message = '没有对应的绑定信息';
                                    message.Data = null;
                                    callback(new Error('没有对应的绑定信息'), message);
                                } else {
                                    callback(null);
                                }
                            }
                        });
                    },
                    function (callback) {
                        boxSocket.sendMsg(EDM_ALL_DRIVER, devCode, COMMAND_FLAG, null, function (error, data) {
                            if (error) {
                                message.Status = false;
                                message.message = error;
                                message.Data = null;
                                callback(error, message);
                            } else {
                                message.Status = true;
                                message.message = 'OK';
                                message.Data = JSON.parse(data);
                                callback(null, message);
                            }
                        });
                    }
                ],
                function (error, message) {
                    res.json(message);
                }
            );
        },
        getDriverConf: function (req, res) {
            var userId = req.body.userId || req.query.userId;
            var devCode = req.body.devCode || req.query.devCode;
            var driverName = req.body.driverName || req.query.driverName;
            var driverType = req.body.driverType || req.query.driverType;
            if (!userId) {
                message.Status = false;
                message.message = '用户ID不能为空';
                message.Data = null;
                res.json(message);
                return;
            }
            if (!devCode) {
                message.Status = false;
                message.message = '设备码不能为空';
                message.Data = null;
                res.json(message);
                return;
            }
            if (!driverName) {
                message.Status = false;
                message.message = '驱动名称不能为空';
                message.Data = null;
                res.json(message);
                return;
            }
            if (!driverType || driverType != 'point') {
                driverType = 'addServer';
            } else {
                driverType = 'addPoint';
            }
            async.waterfall(
                [
                    function (callback) {
                        var sql = sqlQuery.select().from('box_user_box').select(['user_id']).where({
                            user_id: userId,
                            dev_code: devCode,
                            status: [2, 3]
                        }).build();
                        logger.debug('获取盒子绑定信息sql:' + sql);
                        query(sql, function (error, rows) {
                            if (error) {
                                logger.error('获取盒子绑定信息错误：' + error);
                                message.Status = false;
                                message.message = '获取盒子绑定信息失败';
                                message.Data = null;
                                callback(error, message);
                            } else {
                                if (rows.length != 1) {
                                    message.Status = false;
                                    message.message = '没有对应的绑定信息';
                                    message.Data = null;
                                    callback(new Error('没有对应的绑定信息'), message);
                                } else {
                                    callback(null);
                                }
                            }
                        });
                    },
                    function (callback) {
                        var sql = 'select keyId as Id,tips as Tips,descs as "Desc",Scope as Scope,Defaults as "Default",TextType as TextType,TextData as TextData,Validate as Validate from box_driver_conf where dev_code = "' + devCode + '" and driver_Name="' + driverName + '" and Scope ="' + driverType + '"';
                        logger.debug('获取驱动配置信息sql:', sql);
                        query(sql, function (error, rows) {
                            if (error) {
                                logger.error('获取驱动配置信息错误：', error);
                                message.Status = false;
                                message.message = '获取配置信息错误';
                                message.Data = null;
                                callback(error, message);
                            } else {
                                if (rows.length == 0) {
                                    callback(null);
                                } else {
                                    message.Status = true;
                                    message.message = 'OK';
                                    message.Data = rows;
                                    callback(new Error('本地有配置信息'), message);
                                }
                            }
                        });
                    },
                    function (callback) {
                        boxSocket.sendMsg(EDM_DRIVER_CONF, devCode, COMMAND_FLAG, driverName, function (error, data) {
                            if (error) {
                                message.Status = false;
                                message.message = error;
                                message.Data = null;
                                callback(error, message);
                            } else {
                                callback(null, JSON.parse(data));
                            }
                        });
                    },
                    function (confs, callback) {
                        var sql = 'insert into box_das_conf (dev_code,driver_name,KeyId,Descs,Tips,Scope,Defaults,TextType,TextData,Validate,CREATE_DATE) values';
                        var length = confs.length;
                        for (var i = 0; i < length; i++) {
                            var conf = confs[i];
                            var value = '("' + devCode + '","' + driverName + '","' + conf.Id + '","' + conf.Desc + '","' + conf.Tips + '","' + conf.Scope + '","' + conf.Default + '","' + conf.TextType + '","' + conf.TextData + '","' + conf.Validate + '","' + Utils.dateFormat(new Date().getTime(), Utils.yyyyMMddhhmmss) + '")';
                            sql += value;
                            if (confs[i + 1]) {
                                sql += ',';
                            }
                        }
                        logger.debug('将驱动对应信息插入数据库sql:', sql);
                        query(sql, function (error, rows) {
                            if (error) {
                                logger.error('获取驱动配置信息错误：', error);
                                message.Status = false;
                                message.message = '获取配置信息错误';
                                message.Data = null;
                                callback(error, message);
                            } else {
                                if (rows.length == 0) {
                                    callback(null);
                                } else {
                                    message.Status = true;
                                    message.message = 'OK';
                                    message.Data = confs;
                                    callback(null, message);
                                }
                            }
                        });
                    }
                ],
                function (error, message) {
                    res.json(message);
                }
            );
        },
        /**
         * 创建采集服务
         * @param req
         * @param res
         */
        createService: function (req, res) {
            var options = req.body;
            var userId = options.userId;
            var devCode = options.devCode;
            var dasName = options.das_name;
            var type = options.driver_name;
            var desc = options.das_des;
            if (!userId) {
                message.Status = false;
                message.message = '用户ID不能为空';
                message.Data = null;
                res.json(message);
                return;
            }
            if (!devCode) {
                message.Status = false;
                message.message = '设备码不能为空';
                message.Data = null;
                res.json(message);
                return;
            }

            if (!dasName) {
                message.Status = false;
                message.message = '采集名称不能为空';
                message.Data = null;
                res.json(message);
                return;
            }
            if (!type) {
                message.Status = false;
                message.message = '驱动不能为空';
                message.Data = null;
                res.json(message);
                return;
            }
            async.waterfall(
                [
                    function (callback) {
                        var sql = sqlQuery.select().from('box_user_box').select(['user_id']).where({
                            user_id: userId,
                            dev_code: devCode,
                            status: [2, 3]
                        }).build();
                        logger.debug('获取是否有盒子信息sql:' + sql);
                        query(sql, function (error, rows) {
                            if (error) {
                                logger.error('获取是否有盒子信息错误：' + error);
                                message.Status = false;
                                message.message = '获取是否有盒子信息失败';
                                message.Data = null;
                                callback(error, message);
                            } else {
                                if (rows.length != 1) {
                                    message.Status = false;
                                    message.message = '获取是否有盒子信息';
                                    message.Data = null;
                                    callback(new Error('获取是否有盒子信息'), message);
                                } else {
                                    callback(null);
                                }
                            }
                        });
                    },
                    function (callback) {
                        var sql = sqlQuery.select().from('box_das_service').select(['id']).where({
                            dev_code: devCode,
                            name: dasName
                        }).build();
                        logger.debug('相同名称的采集信息sql:' + sql);
                        query(sql, function (error, rows) {
                            if (error) {
                                logger.error('相同名称的采集信息错误：' + error);
                                message.Status = false;
                                message.message = '相同名称的采集信息失败';
                                message.Data = null;
                                callback(error, message);
                            } else {
                                if (rows.length > 0) {
                                    message.Status = false;
                                    message.message = '存在相同名称的采集';
                                    message.Data = null;
                                    callback(new Error('存在相同名称的采集'), message);
                                } else {
                                    callback(null);
                                }
                            }
                        });
                    },
                    function (callback) {
                        var obj = {
                            name: dasName,
                            dev_code: devCode,
                            type: type,
                            descs: desc,
                            status: 'stop',
                            sync_status: 0,
                            sync_action: 'insert',
                            create_date: Utils.dateFormat(new Date().getTime(), Utils.yyyyMMddhhmmss)
                        }
                        var sql = sqlQuery.insert().into('box_das_service').set(obj).build();
                        logger.debug('添加采集信息sql:' + sql);
                        query(sql, function (error, rows) {
                            if (error) {
                                logger.error('添加采集信息错误：' + error);
                                message.Status = false;
                                message.message = '添加采集信息失败';
                                message.Data = null;
                                callback(error, message);
                            } else {
                                var oo = {
                                    Id: rows.insertId,
                                    name: obj.name,
                                    type: obj.type,
                                    port: 0,
                                    desc: obj.descs,
                                    destType: 'openplant',
                                    status: obj.status,
                                    NodeName: '',
                                    isLink: ''
                                };
                                callback(null, oo);
                            }
                        });
                    },
                    function (obj, callback) {
                        var sql = 'select keyId as Id,tips as Tips,descs as "Desc",Scope as Scope,Defaults as "Default",TextType as TextType,TextData as TextData,Validate as Validate from box_driver_conf where Scope ="addServer" and dev_code = "' + devCode + '" and driver_Name="' + type + '"';
                        logger.debug('获取采集配置信息sql:', sql);
                        query(sql, function (error, rows) {
                            if (error) {
                                logger.error('获取采集配置信息错误：', error);
                                message.Status = false;
                                message.message = '获取采集信息错误';
                                message.Data = null;
                                callback(error, message);
                            } else {
                                callback(null, rows, obj);
                            }
                        });
                    },
                    function (rs, obj, callback) {
                        var size = rs.length;
                        if (size > 0) {
                            var date = '"' + Utils.dateFormat(new Date().getTime(), Utils.yyyyMMddhhmmss) + '"';
                            var sql = 'insert box_das_conf (dev_code,das_name,KeyId,Descs,Tips,Scope,Defaults,TextType,TextData,Validate,Create_date) values '
                            for (var i = 0; i < size; i++) {
                                var oo = rs[i];
                                var value = '("' + devCode + '","' + dasName + '","' + oo.Id + '","' + oo.Desc + '","' + oo.Tips + '","' + oo.Scope + '","' + options[oo['Id']] + '","' + oo.TextType + '","' + oo.TextData + '","' + oo.Validate + '",' + date + ')'
                                if (rs[i + 1]) {
                                    value += ',';
                                }
                                sql += value;
                            }
                            logger.debug('添加采集配置信息sql:' + sql);
                            query(sql, function (error, rows) {
                                if (error) {
                                    logger.error('添加采集配置信息错误：' + error);
                                    message.Status = false;
                                    message.message = '添加采集配置信息失败';
                                    message.Data = null;
                                    callback(error, message);
                                } else {
                                    message.Status = true;
                                    message.message = 'OK';
                                    message.Data = obj;
                                    callback(null, message);
                                }
                            });
                        } else {
                            message.Status = true;
                            message.message = 'OK';
                            message.Data = obj;
                            callback(null, message);
                        }
                    }
                ],
                function (error, message) {
                    res.json(message);
                }
            );
        },
        modifyService: function (req, res) {
            var options = req.body;
            var userId = options.userId;
            var devCode = options.devCode;
            var dasName = options.dasName;
            if (!userId) {
                message.Status = false;
                message.message = '用户ID不能为空';
                message.Data = null;
                res.json(message);
                return;
            }
            if (!devCode) {
                message.Status = false;
                message.message = '设备码不能为空';
                message.Data = null;
                res.json(message);
                return;
            }

            if (!dasName) {
                message.Status = false;
                message.message = '采集名称不能为空';
                message.Data = null;
                res.json(message);
                return;
            }
            async.waterfall(
                [
                    function (callback) {
                        var sql = sqlQuery.select().from('box_user_box').select(['user_id']).where({
                            user_id: userId,
                            dev_code: devCode,
                            status: [2, 3]
                        }).build();
                        logger.debug('获取是否有盒子信息sql:' + sql);
                        query(sql, function (error, rows) {
                            if (error) {
                                logger.error('获取是否有盒子信息错误：' + error);
                                message.Status = false;
                                message.message = '获取是否有盒子信息失败';
                                message.Data = null;
                                callback(error, message);
                            } else {
                                if (rows.length != 1) {
                                    message.Status = false;
                                    message.message = '获取是否有盒子信息';
                                    message.Data = null;
                                    callback(new Error('获取是否有盒子信息'), message);
                                } else {
                                    callback(null)
                                    ;
                                }
                            }
                        });
                    },
                    function (callback) {
                        var sql = sqlQuery.update().into('box_das_service').set({
                            sync_status: 0,
                            sync_action: 'update',
                            update_date: Utils.dateFormat(new Date().getTime(), Utils.yyyyMMddhhmmss)
                        }).where({dev_code: devCode, Name: dasName}).build();
                        logger.debug('删除采集信息sql:' + sql);
                        query(sql, function (error, rows) {
                            if (error) {
                                logger.error('删除采集信息错误：' + error);
                                message.Status = false;
                                message.message = '删除采集信息失败';
                                message.Data = null;
                                callback(error, message);
                            } else {
                                callback(null);
                            }
                        });
                    },
                    function (callback) {
                        var sql = 'select keyId as Id,tips as Tips,descs as "Desc",Scope as Scope,Defaults as "Default",TextType as TextType,TextData as TextData,Validate as Validate from box_das_conf where dev_code = "' + devCode + '" and das_Name="' + dasName + '"';
                        logger.debug('获取采集配置信息sql:', sql);
                        query(sql, function (error, rows) {
                            if (error) {
                                logger.error('获取采集配置信息错误：', error);
                                message.Status = false;
                                message.message = '获取采集信息错误';
                                message.Data = null;
                                callback(error, message);
                            } else {
                                callback(null, rows);
                            }
                        });
                    },
                    function (rs, callback) {
                        var size = rs.length;
                        if (size > 0) {
                            var keyIds = '';
                            var sql = 'update box_das_conf set defaults = case KeyId  '
                            for (var i = 0; i < size; i++) {
                                var oo = rs[i];
                                keyIds += '"' + oo.Id + '"';
                                if (rs[i + 1]) {
                                    keyIds += ',';
                                }
                                var value = ' when "' + oo.Id + '" then "' + options[oo.Id] + '" ';
                                sql += value;
                            }
                            sql += ' end where KeyID in (' + keyIds + ') and dev_code = "' + devCode + '" and das_name ="' + dasName + '"';
                            logger.debug('更新采集配置信息sql:' + sql);
                            query(sql, function (error, rows) {
                                if (error) {
                                    logger.error('更新采集配置信息错误：' + error);
                                    message.Status = false;
                                    message.message = '更新采集配置信息失败';
                                    message.Data = null;
                                    callback(error, message);
                                } else {
                                    message.Status = true;
                                    message.message = 'OK';
                                    message.Data = null;
                                    callback(null, message);
                                }
                            });
                        } else {
                            message.Status = true;
                            message.message = 'OK';
                            message.Data = null;
                            callback(null, message);
                        }
                    }
                ],
                function (error, message) {
                    res.json(message);
                }
            );
        },
        /**
         * 创建采集服务
         * @param req
         * @param res
         */
        getServiceConf: function (req, res) {
            var userId = req.body.userId || req.query.userId;
            var devCode = req.body.devCode || req.query.devCode;
            var dasName = req.body.dasName || req.query.dasName;
            if (!userId) {
                message.Status = false;
                message.message = '用户ID不能为空';
                message.Data = null;
                res.json(message);
                return;
            }

            if (!devCode) {
                message.Status = false;
                message.message = '设备码不能为空';
                message.Data = null;
                res.json(message);
                return;
            }

            if (!dasName) {
                message.Status = false;
                message.message = '采集名称不能为空';
                message.Data = null;
                res.json(message);
                return;
            }
            async.waterfall(
                [
                    function (callback) {
                        var sql = sqlQuery.select().from('box_user_box').select(['user_id']).where({
                            user_id: userId,
                            dev_code: devCode,
                            status: [2, 3]
                        }).build();
                        logger.debug('获取是否有盒子信息sql:' + sql);
                        query(sql, function (error, rows) {
                            if (error) {
                                logger.error('获取是否有盒子信息错误：' + error);
                                message.Status = false;
                                message.message = '获取是否有盒子信息失败';
                                message.Data = null;
                                callback(error, message);
                            } else {
                                if (rows.length != 1) {
                                    message.Status = false;
                                    message.message = '获取是否有盒子信息';
                                    message.Data = null;
                                    callback(new Error('获取是否有盒子信息'), message);
                                } else {
                                    callback(null);
                                }
                            }
                        });
                    },
                    function (callback) {
                        var sql = 'select keyId as Id,tips as Tips,descs as "Desc",Scope as Scope,Defaults as "Default",TextType as TextType,TextData as TextData,Validate as Validate from box_das_conf where dev_code = "' + devCode + '" and das_Name="' + dasName + '"';
                        logger.debug('获取采集配置信息sql:', sql);
                        query(sql, function (error, rows) {
                            if (error) {
                                logger.error('获取采集配置信息错误：', error);
                                message.Status = false;
                                message.message = '获取采集信息错误';
                                message.Data = null;
                                callback(error, message);
                            } else {
                                message.Status = true;
                                message.message = 'OK';
                                message.Data = rows;
                                callback(null, message);
                            }
                        });
                    }
                ],
                function (error, message) {
                    res.json(message);
                }
            );
        },
        /**
         * 删除采集
         * @param req
         * @param res
         */
        deleteService: function (req, res) {
            var userId = req.body.userId;
            var devCode = req.body.devCode;
            var dasName = req.body.dasName;
            if (!userId) {
                message.Status = false;
                message.message = '用户ID不能为空';
                message.Data = null;
                res.json(message);
                return;
            }
            if (!devCode) {
                message.Status = false;
                message.message = '设备码不能为空';
                message.Data = null;
                res.json(message);
                return;
            }
            if (!dasName) {
                message.Status = false;
                message.message = '采集不能为空';
                message.Data = null;
                res.json(message);
                return;
            }
            async.waterfall(
                [
                    function (callback) {
                        var sql = sqlQuery.select().from('box_user_box').select(['user_id']).where({
                            user_id: userId,
                            dev_code: devCode,
                            status: [2, 3]
                        }).build();
                        logger.debug('获取是否有盒子信息sql:' + sql);
                        query(sql, function (error, rows) {
                            if (error) {
                                logger.error('获取是否有盒子信息错误：' + error);
                                message.Status = false;
                                message.message = '获取是否有盒子信息失败';
                                message.Data = null;
                                callback(error, message);
                            } else {
                                if (rows.length != 1) {
                                    message.Status = false;
                                    message.message = '获取是否有盒子信息';
                                    message.Data = null;
                                    callback(new Error('获取是否有盒子信息'), message);
                                } else {
                                    callback(null);
                                }
                            }
                        });
                    },
                    function (callback) {
                        var sql = sqlQuery.update().into('box_das_service').set({
                            sync_status: 0,
                            sync_action: 'delete',
                            update_date: Utils.dateFormat(new Date().getTime(), Utils.yyyyMMddhhmmss)
                        }).where({dev_code: devCode, Name: dasName}).build();
                        logger.debug('删除采集信息sql:' + sql);
                        query(sql, function (error, rows) {
                            if (error) {
                                logger.error('删除采集信息错误：' + error);
                                message.Status = false;
                                message.message = '删除采集信息失败';
                                message.Data = null;
                                callback(error, message);
                            } else {
                                callback(null);
                            }
                        });
                    },
                    function (callback) {
                        var sql = sqlQuery.update().into('box_das_point').set({
                            sync_status: 0,
                            sync_action: 'delete',
                            update_date: Utils.dateFormat(new Date().getTime(), Utils.yyyyMMddhhmmss)
                        }).where({dev_code: devCode, sn: dasName}).build();
                        logger.debug('删除测点信息sql:' + sql);
                        query(sql, function (error, rows) {
                            if (error) {
                                logger.error('删除测点信息错误：' + error);
                                message.Status = false;
                                message.message = '删除测点信息失败';
                                message.Data = null;
                                callback(error, message);
                            } else {
                                message.Status = true;
                                message.message = 'OK';
                                message.Data = null;
                                callback(null, message);
                            }
                        });
                    }
                ],
                function (error, message) {
                    res.json(message);
                }
            );
        },
        /**
         * 获取采集列表
         * @param req
         * @param res
         */
        getServiceList: function (req, res) {
            var userId = req.body.userId || req.query.userId;
            var devCode = req.body.devCode || req.query.devCode;
            if (!userId) {
                message.Status = false;
                message.message = '用户ID不能为空';
                message.Data = null;
                res.json(message);
                return;
            }
            if (!devCode) {
                message.Status = false;
                message.message = '设备码不能为空';
                message.Data = null;
                res.json(message);
                return;
            }
            async.waterfall(
                [
                    function (callback) {
                        var sql = sqlQuery.select().from('box_user_box').select(['id']).where({dev_code: devCode, user_id: userId}).build();
                        logger.debug('获取当前盒子是否存在sql:' + sql);
                        query(sql, function (error, rows) {
                            if (error) {
                                logger.error('获取盒子信息错误：' + error);
                                message.Status = false;
                                message.message = '验证盒子信息出错';
                                message.Data = null;
                                callback(error, message);
                            }
                            if (rows.length != 1) {
                                message.Status = false;
                                message.message = '盒子不存在';
                                message.Data = null;
                                callback(new Error('盒子不存在'), message);
                            } else {
                                callback(null);
                            }
                        });
                    },
                    function (callback) {
                        var sql = 'SELECT id,node_name,name,type,port,descs,status,sync_status,create_date,update_date,sync_date,dev_code,sync_action from box_das_service where dev_code ="' + devCode + '" and sync_action!="delete"';
                        logger.debug('获取盒子采集信息sql:' + sql);
                        query(sql, function (error, rows) {
                            if (error) {
                                logger.error('获取盒子采集信息错误：' + error);
                                message.Status = false;
                                message.message = '获取盒子采集信息出错';
                                message.Data = null;
                                callback(error, message);
                            } else {
                                message.Status = true;
                                message.message = 'OK';
                                message.Data = rows;
                                callback(null, message);
                            }
                        });
                    }
                ],
                function (error, message) {
                    res.json(message);
                }
            );

        },
        /**
         * 开始服务
         * @param req
         * @param res
         */
        startService: function (req, res) {
            var userId = req.body.userId;
            var devCode = req.body.devCode;
            var dasName = req.body.dasName;
            if (!dasName) {
                message.Status = false;
                message.message = '服务不能为空';
                message.Data = null;
                res.json(message);
                return;
            }
            if (!userId) {
                message.Status = false;
                message.message = '用户ID不能为空';
                message.Data = null;
                res.json(message);
                return;
            }
            if (!devCode) {
                message.Status = false;
                message.message = '设备码不能为空';
                message.Data = null;
                res.json(message);
                return;
            }
            async.waterfall(
                [
                    function (callback) {
                        var sql = sqlQuery.select().from('box_user_box').select(['user_id']).where({
                            user_id: userId,
                            dev_code: devCode,
                            status: [2, 3]
                        }).build();
                        logger.debug('获取盒子绑定信息sql:' + sql);
                        query(sql, function (error, rows) {
                            if (error) {
                                logger.error('获取盒子绑定信息错误：' + error);
                                message.Status = false;
                                message.message = '获取盒子绑定信息失败';
                                message.Data = null;
                                callback(error, message);
                            } else {
                                if (rows.length != 1) {
                                    message.Status = false;
                                    message.message = '没有对应的绑定信息';
                                    message.Data = null;
                                    callback(new Error('没有对应的绑定信息'), message);
                                } else {
                                    callback(null);
                                }
                            }
                        });
                    },
                    function (callback) {
                        var sql = 'SELECT name,dev_code,status FROM box_das_service where status = "stop" and name = "' + dasName + '"';
                        logger.debug('获取采集信息sql:' + sql);
                        query(sql, function (error, rows, columns) {
                            if (error) {
                                logger.error('获取采集信息错误：', error);
                                message.Status = false;
                                message.message = '获取采集信息出错';
                                message.Data = null;
                                callback(error, message);
                            } else {
                                if (rows.length != 1) {
                                    message.Status = false;
                                    message.message = '没有对应的采集';
                                    message.Data = null;
                                    callback(new Error('没有对应的采集'), message);
                                } else {
                                    callback(null, rows[0]);
                                }
                            }
                        });
                    },
                    function (row, callback) {
                        boxSocket.sendMsg(EDM_BOOT_DAS, row.dev_code, COMMAND_FLAG, row.name, function (error, data) {
                            if (error) {
                                message.Status = false;
                                message.message = error;
                                message.Data = null;
                                callback(error, message);
                            } else {
                                if (data != null) {
                                    if (data.charCodeAt() == OPERATE_SUCCESS) {
                                        callback(null, 'running');
                                    } else {
                                        message.Status = false;
                                        message.message = '启动服务失败';
                                        message.Data = null;
                                        callback(new Error('启动服务失败'), message);
                                    }
                                } else {
                                    message.Status = false;
                                    message.message = '启动服务失败';
                                    message.Data = null;
                                    callback(new Error('启动服务失败'), message);
                                }
                            }
                        });
                    },
                    function (status, callback) {
                        var sql = sqlQuery.update().into('box_das_service').set({
                            status: status,
                            update_date: Utils.dateFormat(new Date().getTime(), Utils.yyyyMMddhhmmss)
                        }).where({name: dasName, dev_code: devCode}).build();
                        logger.debug('更新采集信息sql:' + sql);
                        query(sql, function (error, rows, columns) {
                            if (error) {
                                logger.debug('开始采集错误：', error);
                                message.Status = false;
                                message.message = '更新采集信息出错';
                                message.Data = null;
                                callback(error, message);
                            } else {
                                message.Status = true;
                                message.message = 'OK';
                                message.Data = null;
                                callback(null, message);
                            }
                        });
                    }
                ],
                function (error, message) {
                    res.json(message);
                }
            );
        },
        /**
         * 停止服务
         * @param req
         * @param res
         */
        stopService: function (req, res) {
            var userId = req.body.userId;
            var devCode = req.body.devCode;
            var dasName = req.body.dasName;
            if (!dasName) {
                message.Status = false;
                message.message = '服务不能为空';
                message.Data = null;
                res.json(message);
                return;
            }
            if (!userId) {
                message.Status = false;
                message.message = '用户ID不能为空';
                message.Data = null;
                res.json(message);
                return;
            }
            if (!devCode) {
                message.Status = false;
                message.message = '设备码不能为空';
                message.Data = null;
                res.json(message);
                return;
            }
            async.waterfall(
                [
                    function (callback) {
                        var sql = sqlQuery.select().from('box_user_box').select(['user_id']).where({
                            user_id: userId,
                            dev_code: devCode,
                            status: [2, 3]
                        }).build();
                        logger.debug('获取盒子绑定信息sql:' + sql);
                        query(sql, function (error, rows) {
                            if (error) {
                                logger.error('获取盒子绑定信息错误：' + error);
                                message.Status = false;
                                message.message = '获取盒子绑定信息失败';
                                message.Data = null;
                                callback(error, message);
                            } else {
                                if (rows.length != 1) {
                                    message.Status = false;
                                    message.message = '没有对应的绑定信息';
                                    message.Data = null;
                                    callback(new Error('没有对应的绑定信息'), message);
                                } else {
                                    callback(null);
                                }
                            }
                        });
                    },
                    function (callback) {
                        var sql = 'SELECT name,dev_code,status FROM box_das_service where status = "running" and name = "' + dasName + '"';
                        logger.debug('获取采集信息sql:' + sql);
                        query(sql, function (error, rows, columns) {
                            if (error) {
                                logger.error('获取采集信息错误：' + error);
                                message.Status = false;
                                message.message = '获取采集信息出错';
                                message.Data = null;
                                callback(error, message);
                            } else {
                                if (rows.length != 1) {
                                    message.Status = false;
                                    message.message = '没有对应的采集';
                                    message.Data = null;
                                    callback(new Error('没有对应的采集'), message);
                                } else {
                                    callback(null, rows[0]);
                                }
                            }
                        });
                    },
                    function (row, callback) {
                        boxSocket.sendMsg(EDM_STOP_DAS, row.dev_code, COMMAND_FLAG, row.name, function (error, data) {
                            if (error) {
                                message.Status = false;
                                message.message = error;
                                message.Data = null;
                                callback(error, message);
                            } else {
                                if (data != null) {
                                    if (data.charCodeAt() == OPERATE_SUCCESS) {
                                        callback(null, 'stop');
                                    } else {
                                        message.Status = false;
                                        message.message = '停止服务失败';
                                        message.Data = null;
                                        callback(new Error('停止服务失败'), message);
                                    }
                                } else {
                                    message.Status = false;
                                    message.message = '停止服务失败';
                                    message.Data = null;
                                    callback(new Error('停止服务失败'), message);
                                }
                            }
                        });
                    },
                    function (status, callback) {
                        var sql = sqlQuery.update().into('box_das_service').set({
                            status: status,
                            update_date: Utils.dateFormat(new Date().getTime(), Utils.yyyyMMddhhmmss)
                        }).where({name: dasName, dev_code: devCode}).build();
                        logger.debug('更新采集信息sql:' + sql);
                        query(sql, function (error, rows, columns) {
                            if (error) {
                                logger.debug('开始采集错误：', error);
                                message.Status = false;
                                message.message = '更新采集信息出错';
                                message.Data = null;
                                callback(error, message);
                            } else {
                                message.Status = true;
                                message.message = 'OK';
                                message.Data = null;
                                callback(null, message);
                            }
                        });
                    }
                ],
                function (error, message) {
                    res.json(message);
                }
            );
        },
        /**
         *  获取驱动测点配置类型
         * @param req
         * @param res
         */
        getDriverPointConf: function (req, res) {
            var userId = req.body.userId || req.query.userId;
            var devCode = req.body.devCode || req.query.devCode;
            var driverName = req.body.driverName || req.query.driverName;
            if (!userId) {
                message.Status = false;
                message.message = '用户ID不能为空';
                message.Data = null;
                res.json(message);
                return;
            }
            if (!devCode) {
                message.Status = false;
                message.message = '设备码不能为空';
                message.Data = null;
                res.json(message);
                return;
            }
            if (!driverName) {
                message.Status = false;
                message.message = '驱动名称不能为空';
                message.Data = null;
                res.json(message);
                return;
            }
        },
        /**
         * 添加测点
         * @param req
         * @param res
         */
        addServicePoint: function (req, res) {
            var userId = req.body.userId;
            var devCode = req.body.devCode;
            var dasName = req.body.dasName;
            var ID = req.body.Id;
            var PN = req.body.Pn;
            var RT = req.body.Rt;
            var HW = req.body.Hw;
            var PT = req.body.Pt;
            var ED = req.body.Ed;
            var FK = req.body.Fk;
            var FB = req.body.Fb;
            var TV = req.body.Tv;
            var BV = req.body.Bv;
            var PH = req.body.Ph;
            var PL = req.body.Pl;

            var userId = req.body.userId || req.query.userId;
            var devCode = req.body.devCode || req.query.devCode;
            if (!userId) {
                message.Status = false;
                message.message = '用户ID不能为空';
                message.Data = null;
                res.json(message);
                return;
            }
            if (!devCode) {
                message.Status = false;
                message.message = '设备码不能为空';
                message.Data = null;
                res.json(message);
                return;
            }

            if (!dasName) {
                message.Status = false;
                message.message = '采集名称';
                message.Data = null;
                res.json(message);
                return;
            }
            if (!PN) {
                message.Status = false;
                message.message = '点名不能为空';
                message.Data = null;
                res.json(message);
                return;
            }

            if (!RT) {
                message.Status = false;
                message.message = '类型不能为空';
                message.Data = null;
                res.json(message);
                return;
            }
            async.waterfall(
                [
                    function (callback) {
                        var sql = sqlQuery.select().from('box_user_box').select(['id']).where({dev_code: devCode, user_id: userId}).build();
                        logger.debug('获取当前盒子是否存在sql:' + sql);
                        query(sql, function (error, rows) {
                            if (error) {
                                logger.error('获取盒子信息错误：' + error);
                                message.Status = false;
                                message.message = '验证盒子信息出错';
                                message.Data = null;
                                callback(error, message);
                            }
                            if (rows.length != 1) {
                                message.Status = false;
                                message.message = '盒子不存在';
                                message.Data = null;
                                callback(new Error('盒子不存在'), message);
                            } else {
                                callback(null);
                            }
                        });
                    },
                    function (callback) {
                        var sql = 'SELECT id,node_name,name from box_das_service where name ="' + dasName + '" and  dev_code ="' + devCode + '"';
                        logger.debug('获取盒子采集信息sql:' + sql);
                        query(sql, function (error, rows) {
                            if (error) {
                                logger.error('获取盒子采集信息错误：' + error);
                                message.Status = false;
                                message.message = '获取盒子采集信息出错';
                                message.Data = null;
                                callback(error, message);
                            } else {
                                if (rows.length != 1) {
                                    message.Status = false;
                                    message.message = '采集不存在';
                                    message.Data = null;
                                    callback(new Error('采集不存在'), message);
                                } else {
                                    callback(null);
                                }
                            }
                        });
                    },
                    function (callback) {
                        var GN = ('W3.' + devCode + '.' + dasName + '_' + PN).toUpperCase();
                        var sql = sqlQuery.select().from('box_das_point').select(['id']).where({gn: GN}).build();
                        logger.debug('获取测点sql:' + sql);
                        query(sql, function (err, rows) {
                            if (err) {
                                logger.error('获取测点信息错误：' + err);
                                message.Status = false;
                                message.message = '获取测点信息出错';
                                message.Data = null;
                                callback(error, message);
                            } else {
                                if (rows.length > 0) {
                                    message.Status = false;
                                    message.message = '点名已经存在';
                                    message.Data = null;
                                    callback(new Error('点名存在'), message);
                                } else {
                                    callback(null, GN);
                                }
                            }
                        });
                    },
                    function (GN, callback) {
                        var obj = {
                            gn: GN,
                            pn: dasName + '_' + PN,
                            rt: RT,
                            dev_code: devCode,
                            sn: dasName,
                            sync_status: 0,
                            sync_action: 'insert',
                            create_date: Utils.dateFormat(new Date().getTime(), Utils.yyyyMMddhhmmss)
                        };
                        if (ID) {
                            obj.ID = ID;
                        }
                        if (HW) {
                            obj.HW = HW;
                        }
                        if (PT) {
                            obj.PT = PT;
                        }
                        if (ED) {
                            obj.ED = ED;
                        }
                        if (FK) {
                            obj.FK = FK;
                        }
                        if (FB) {
                            obj.FB = FB;
                        }
                        if (TV) {
                            obj.TV = TV;
                        }
                        if (BV) {
                            obj.BV = BV;
                        }
                        if (PH) {
                            obj.PH = PH;
                        }
                        if (PL) {
                            obj.PL = PL;
                        }
                        var sql = sqlQuery.insert().into('box_das_point').set(obj).build();
                        logger.debug('创建测点sql:' + sql);
                        query(sql, function (err) {
                            if (err) {
                                logger.error('创建盒子信息错误：' + err);
                                message.Status = false;
                                message.message = '创建信息出错';
                                message.Data = null;
                                callback(error, message);
                            } else {
                                message.Status = true;
                                message.message = 'OK';
                                message.Data = obj;
                                callback(null, message);
                            }
                        });
                    }
                ],
                function (error, message) {
                    res.json(message);
                }
            );
        },
        /**
         * 修改测点
         * @param req
         * @param res
         */
        modifyServicePoint: function (req, res) {
            var userId = req.body.userId;
            var devCode = req.body.devCode;
            var ID = req.body.Id;
            var HW = req.body.Hw;
            var PT = req.body.Pt;
            var ED = req.body.Ed;
            var FK = req.body.Fk;
            var FB = req.body.Fb;
            var TV = req.body.Tv;
            var BV = req.body.Bv;
            var PH = req.body.Ph;
            var PL = req.body.Pl;

            if (!userId) {
                message.Status = false;
                message.message = '用户ID不能为空';
                message.Data = null;
                res.json(message);
                return;
            }
            if (!devCode) {
                message.Status = false;
                message.message = '设备码不能为空';
                message.Data = null;
                res.json(message);
                return;
            }
            async.waterfall(
                [
                    function (callback) {
                        var sql = sqlQuery.select().from('box_user_box').select(['id']).where({dev_code: devCode, user_id: userId}).build();
                        logger.debug('获取当前盒子是否存在sql:' + sql);
                        query(sql, function (error, rows) {
                            if (error) {
                                logger.error('获取盒子信息错误：' + error);
                                message.Status = false;
                                message.message = '验证盒子信息出错';
                                message.Data = null;
                                callback(error, message);
                            }
                            if (rows.length != 1) {
                                message.Status = false;
                                message.message = '盒子不存在';
                                message.Data = null;
                                callback(new Error('盒子不存在'), message);
                            } else {
                                callback(null);
                            }
                        });
                    },
                    function (callback) {
                        var sql = 'select p.id as Id,sync_status as status,sync_action as action from box_das_point p where p.dev_code ="' + devCode + '" and p.id =  ' + ID;
                        logger.debug('获取测点信息sql:' + sql);
                        query(sql, function (err, rows) {
                            if (err) {
                                logger.error('获取测点信息错误：' + err);
                                message.Status = false;
                                message.message = '获取测点出错';
                                message.Data = null;
                                callback(err, message);
                            } else {
                                if (rows.length != 1) {
                                    message.Status = false;
                                    message.message = '没有获取到对应的测点信息';
                                    message.Data = null;
                                    callback(new Error('没有获取到对应的测点信息'), message);
                                } else {
                                    callback(null, rows[0]);
                                }
                            }
                        });
                    },
                    function (row, callback) {
                        var obj = {
                            sync_status: 0,
                            sync_action: 'update',
                            update_date: Utils.dateFormat(new Date().getTime(), Utils.yyyyMMddhhmmss)
                        };
                        if (row.status == 0 && row.action == 'insert') {
                            obj.sync_status = 0;
                            obj.sync_action = 'insert';
                        }
                        if (HW) {
                            obj.HW = HW;
                        }
                        if (PT) {
                            obj.PT = PT;
                        }
                        if (ED) {
                            obj.ED = ED;
                        }
                        if (FK) {
                            obj.FK = FK;
                        }
                        if (FB) {
                            obj.FB = FB;
                        }
                        if (TV) {
                            obj.TV = TV;
                        }
                        if (BV) {
                            obj.BV = BV;
                        }
                        if (PH) {
                            obj.PH = PH;
                        }
                        if (PL) {
                            obj.PL = PL;
                        }
                        var sql = sqlQuery.update().into('box_das_point').set(obj).where({id: ID, dev_code: devCode}).build();
                        logger.debug('更新测点sql:' + sql);
                        query(sql, function (err, rows) {
                            if (err) {
                                logger.error('更新测点信息错误：' + err);
                                message.Status = false;
                                message.message = '更新测点出错';
                                message.Data = null;
                                callback(err, message);
                            } else {
                                message.Status = true;
                                message.message = 'OK';
                                message.Data = null;
                                callback(null, message);
                            }
                        });
                    }
                ],
                function (error, message) {
                    res.json(message);
                }
            );
        },
        /**
         * 删除测点
         */
        deleteServicePoint: function (req, res) {
            var userId = req.body.userId;
            var devCode = req.body.devCode;
            var IDs = req.body.Ids;
            if (!IDs) {
                message.Status = false;
                message.message = '点集合为空';
                message.Data = null;
                res.json(message);
                return;
            }
            if (!userId) {
                message.Status = false;
                message.message = '用户ID不能为空';
                message.Data = null;
                res.json(message);
                return;
            }
            if (!devCode) {
                message.Status = false;
                message.message = '设备码不能为空';
                message.Data = null;
                res.json(message);
                return;
            }
            IDs = IDs.split(',');
            async.waterfall(
                [
                    function (callback) {
                        var sql = sqlQuery.select().from('box_user_box').select(['id']).where({dev_code: devCode, user_id: userId}).build();
                        logger.debug('获取当前盒子是否存在sql:' + sql);
                        query(sql, function (error, rows) {
                            if (error) {
                                logger.error('获取盒子信息错误：' + error);
                                message.Status = false;
                                message.message = '验证盒子信息出错';
                                message.Data = null;
                                callback(error, message);
                            }
                            if (rows.length != 1) {
                                message.Status = false;
                                message.message = '盒子不存在';
                                message.Data = null;
                                callback(new Error('盒子不存在'), message);
                            } else {
                                callback(null);
                            }
                        });
                    },
                    function (callback) {
                        var sql = sqlQuery.update().into('box_das_point').set({
                            sync_status: 0,
                            sync_action: 'delete',
                            update_date: Utils.dateFormat(new Date().getTime(), Utils.yyyyMMddhhmmss)
                        }).where({dev_code: devCode, id: IDs}).build();
                        logger.debug('删除测点sql:' + sql);
                        query(sql, function (err, rows) {
                            if (err) {
                                logger.error('删除测点信息错误：' + err);
                                message.Status = false;
                                message.message = '删除测点出错';
                                message.Data = null;
                                callback(err, message);
                            } else {
                                message.Status = true;
                                message.message = 'OK';
                                message.Data = rows.affectedRows;
                                callback(null, message);
                            }
                        });
                    }
                ],
                function (error, message) {
                    res.json(message);
                }
            );
        },
        /**
         * 获取测点信息
         * @param req
         * @param res
         */
        getServicePoint: function (req, res) {
            var userId = req.body.userId || req.query.userId;
            var devCode = req.body.devCode || req.query.devCode;
            var ID = req.body.Id || req.query.Id;
            if (!userId) {
                message.Status = false;
                message.message = '用户ID不能为空';
                message.Data = null;
                res.json(message);
                return;
            }
            if (!devCode) {
                message.Status = false;
                message.message = '设备码不能为空';
                message.Data = null;
                res.json(message);
                return;
            }
            async.waterfall(
                [
                    function (callback) {
                        var sql = sqlQuery.select().from('box_user_box').select(['id']).where({dev_code: devCode, user_id: userId}).build();
                        logger.debug('获取当前盒子是否存在sql:' + sql);
                        query(sql, function (error, rows) {
                            if (error) {
                                logger.error('获取盒子信息错误：' + error);
                                message.Status = false;
                                message.message = '验证盒子信息出错';
                                message.Data = null;
                                callback(error, message);
                            }
                            if (rows.length != 1) {
                                message.Status = false;
                                message.message = '盒子不存在';
                                message.Data = null;
                                callback(new Error('盒子不存在'), message);
                            } else {
                                callback(null);
                            }
                        });
                    },
                    function (callback) {
                        var sql = 'select p.id as Id, uid as Uid,gn as Gn, pn as Pn,rt as Rt, sn as Sn, an as An, pt as Pt, fb as Fb, fk as Fk, hw as Hw, tv as Tv, bv as Bv, ph as Ph, pl as Pl, ed Ed,s.type from box_das_point p left join box_das_service s on p.sn =  s.name where p.dev_code ="' + devCode + '" and p.id =  ' + ID;
                        logger.debug('获取测点信息sql:' + sql);
                        query(sql, function (err, rows) {
                            if (err) {
                                logger.error('获取测点信息错误：' + err);
                                message.Status = false;
                                message.message = '获取测点出错';
                                message.Data = null;
                                callback(err, message);
                            } else {
                                if (rows.length != 1) {
                                    message.Status = false;
                                    message.message = '没有获取到对应的测点信息';
                                    message.Data = null;
                                    callback(new Error('没有获取到对应的测点信息'), message);
                                } else {
                                    var row = rows[0];
                                    row.Pn = row.Pn.replace(row.Sn + '_', '');
                                    callback(null, row);
                                }
                            }
                        });
                    },
                    function (row, callback) {
                        var sql = 'select keyId as Id,tips as Tips,descs as "Desc",Scope as Scope,Defaults as "Default",TextType as TextType,TextData as TextData,Validate as Validate from box_driver_conf where dev_code = "' + devCode + '" and driver_Name="' + row.type + '" and Scope ="addPoint"';
                        logger.debug('获取测点配置信息sql:', sql);
                        query(sql, function (error, rows) {
                            if (error) {
                                logger.error('获取测点配置信息错误：', error);
                                message.Status = false;
                                message.message = '获取测点配置信息错误';
                                message.Data = null;
                                callback(error, message);
                            } else {
                                var size = rows.length;
                                for (var i = 0; i < size; i++) {
                                    var oo = rows[i];
                                    oo['Default'] = row[oo['Id']];
                                    rows[i] = oo;
                                }
                                message.Status = true;
                                message.message = 'OK';
                                message.Data = rows;
                                callback(null, message);
                            }
                        });
                    }
                ],
                function (error, message) {
                    res.json(message);
                }
            );
        },
        /**
         *根据采集获取测点
         * @param req
         * @param res
         */
        getServicePoints: function (req, res) {
            var userId = req.body.userId || req.query.userId;
            var devCode = req.body.devCode || req.query.devCode;
            var dasName = req.body.dasName || req.query.dasName;
            var offset = req.body.currentPage || req.query.currentPage || 1;
            offset = (parseInt(offset) - 1) * 15;
            var limit = 15;
            if (!userId) {
                message.Status = false;
                message.message = '用户ID不能为空';
                message.Data = null;
                res.json(message);
                return;
            }
            if (!devCode) {
                message.Status = false;
                message.message = '设备码不能为空';
                message.Data = null;
                res.json(message);
                return;
            }
            async.waterfall(
                [
                    function (callback) {
                        var sql = sqlQuery.select().from('box_user_box').select(['id']).where({dev_code: devCode, user_id: userId}).build();
                        logger.debug('获取当前盒子是否存在sql:' + sql);
                        query(sql, function (error, rows) {
                            if (error) {
                                logger.error('获取盒子信息错误：' + error);
                                message.Status = false;
                                message.message = '验证盒子信息出错';
                                message.Data = null;
                                callback(error, message);
                            }
                            if (rows.length != 1) {
                                message.Status = false;
                                message.message = '盒子不存在';
                                message.Data = null;
                                callback(new Error('盒子不存在'), message);
                            } else {
                                callback(null);
                            }
                        });
                    },
                    function (callback) {
                        var sql = sqlQuery.select().from('box_das_point').select(['id']).count('id', 'count').where({
                            sn: dasName,
                            dev_Code: devCode
                        }).build();
                        logger.debug('获取采集下面测点数量sql:' + sql);
                        query(sql, function (error, rows) {
                            if (error) {
                                logger.error('获取采集测点数量错误：' + error);
                                message.Status = false;
                                message.message = '获取采集测点数量出错';
                                message.Data = null;
                                callback(error, message);
                            } else {
                                callback(null, rows[0].count);
                            }
                        });
                    },
                    function (count, callback) {
                        var sql = 'select id as Id, uid as Uid,gn as Gn, pn as Pn,rt as Rt, sn as Sn, an as An, pt as Pt, fb as Fb, fk as Fk, hw as Hw, tv as Tv, bv as Bv, ph as Ph, pl as Pl, ed Ed, 0 as Av, "TimeOut" as "As", "2017-05-08 17:00:00" as Tm from box_das_point where sync_action!="delete" and dev_code ="' + devCode + '" and sn = "' + dasName + '" limit ' + offset + ',' + limit;
                        logger.debug('获取测点信息sql:' + sql);
                        query(sql, function (err, rows) {
                            if (err) {
                                logger.error('获取测点信息错误：' + error);
                                message.Status = false;
                                message.message = '获取测点出错';
                                message.Data = null;
                                callback(error, message);
                            } else {
                                message.Status = true;
                                message.message = 'OK';
                                var data = {
                                    Points: rows,
                                    Totalnum: count % 15 == 0 ? parseInt(count / 15) : parseInt(count / 15 + 1)
                                };
                                message.Data = data
                                callback(null, message);
                            }
                        });
                    }
                ],
                function (error, message) {
                    res.json(message);
                }
            );
        },
        /**
         * 同步盒子信息
         * @param req
         * @param res
         */
        syncBox: function (req, res) {
            var userId = req.body.userId;
            var devCode = req.body.devCode;
            if (!userId) {
                message.Status = false;
                message.message = '用户ID不能为空';
                message.Data = null;
                res.json(message);
                return;
            }
            if (!devCode) {
                message.Status = false;
                message.message = '设备码不能为空';
                message.Data = null;
                res.json(message);
                return;
            }
            async.waterfall(
                [
                    function (callback) {
                        var sql = sqlQuery.select().from('box_user_box').select(['id']).where({dev_code: devCode, user_id: userId, status: [2, 3]}).build();
                        logger.debug('获取当前盒子是否存在sql:' + sql);
                        query(sql, function (error, rows) {
                            if (error) {
                                logger.error('获取盒子信息错误：' + error);
                                message.Status = false;
                                message.message = '验证盒子信息出错';
                                message.Data = null;
                                callback(error, message);
                            }
                            if (rows.length != 1) {
                                message.Status = false;
                                message.message = '盒子不存在';
                                message.Data = null;
                                callback(new Error('盒子不存在'), message);
                            } else {
                                callback(null);
                            }
                        });
                    },
                    function (callback) {
                        var sql = 'SELECT id,node_name,name,type,port,descs,status,sync_status,create_date,dev_code,sync_status,sync_action from box_das_service where dev_code ="' + devCode + '"';
                        logger.debug('获取盒子采集信息sql:' + sql);
                        query(sql, function (error, rows) {
                            if (error) {
                                logger.error('获取盒子采集信息错误：' + error);
                                message.Status = false;
                                message.message = '获取盒子采集信息出错';
                                message.Data = null;
                                callback(error, message);
                            } else {
                                callback(null, rows);
                            }
                        });
                    },
                    function (rr, callback) {
                        if (rr.length > 0) {
                            var dasNames = [];
                            var size = rr.length;
                            for (var i = 0; i < size; i++) {
                                dasNames.push(rr[i].name);
                            }
                            var sql = sqlQuery.select().from('box_das_conf').select(['das_name', 'KeyId', 'Defaults']).where({
                                dev_code: devCode,
                                das_name: dasNames
                            }).build();
                            logger.debug('获取采集配置信息');
                            query(sql, function (error, rows) {
                                if (error) {
                                    logger.error('获取采集配置信息错误：', error);
                                    message.Status = false;
                                    message.message = '获取采集配置出错';
                                    message.Data = null;
                                    callback(error, message);
                                } else {
                                    var size = rr.length;
                                    var confSize = rows.length;
                                    for (var i = 0; i < size; i++) {
                                        var das = rr[i];
                                        var confs = {};
                                        for (var j = 0; j < confSize; j++) {
                                            var conf = rows[j];
                                            if (das.name == conf.das_name) {
                                                confs[conf.KeyId] = conf.Defaults;
                                            }
                                        }
                                        var DataSource = {device: das.type, type: das.type};
                                        if (das.type.indexOf('Modbus_Serial') > -1) {
                                            if (confs.serial == 'R232') {
                                                DataSource.add = '/dev/ttyO1,' + confs.baud + ',' + confs.parity + ',' + confs.data_bit + "," + confs.stop_bit + "," + confs.time;
                                            } else if (confs.serial == 'R232') {
                                                DataSource.add = '/dev/ttyO4,' + confs.baud + ',' + confs.parity + ',' + confs.data_bit + "," + confs.stop_bit + "," + confs.time;
                                            } else {
                                                DataSource.add = '/dev/ttyO0,' + confs.baud + ',' + confs.parity + ',' + confs.data_bit + "," + confs.stop_bit + "," + confs.time;
                                            }
                                        } else {
                                            DataSource.add = (confs.das_sourceIP || '') + ':' + (confs.das_sourcePort || '');
                                        }
                                        DataSource.clsid = confs.clsid || '';
                                        DataSource.user = confs.user || '';
                                        DataSource.password = confs.password || '';
                                        DataSource.caption = confs.caption || '';
                                        DataSource.prefix = conf.prefix || '';
                                        DataSource.subfix = confs.subfix || '';
                                        DataSource.delay = confs.rate || '';
                                        DataSource.PL = confs.Pl || '';
                                        das['DataSource'] = DataSource;
                                        das.DataDest = {mode: confs.mode || '', add: DataSource.add, cachesize: confs.cachesize || ''};
                                        das.Web = {ListenAddress: ''};
                                        rr[i] = das;
                                    }
                                    callback(null, rr)
                                }
                            });

                        } else {
                            callback(null, []);
                        }
                    },
                    function (dasServices, callback) {
                        var insertDas = [];
                        var deleteDas = [];
                        var updateDas = [];
                        var length = dasServices.length;
                        for (var i = 0; i < length; i++) {
                            var das = dasServices[i];
                            if (das.sync_status == 1) {
                                continue;
                            }
                            var status = das.sync_action;
                            if (status == 'insert') {
                                insertDas.push(das);
                            } else if (status == 'delete') {
                                deleteDas.push(das);
                            } else if (status == 'update') {
                                updateDas.push(das);
                            }
                        }
                        callback(null, insertDas, deleteDas, updateDas, dasServices);
                    },
                    function (insertDas, deleteDas, updateDas, dasServices, callback) {
                        if (insertDas.length > 0) {
                            var objArray = [];
                            var size = insertDas.length;
                            for (var i = 0; i < size; i++) {
                                var das = insertDas[i];
                                objArray.push({XMLName: {Space: das.descs, Local: das.name}, DataSource: das.DataSource, Web: das.Web, DataDest: das.DataDest});
                            }
                            boxSocket.sendMsg(EDM_ADD_DAS, devCode, COMMAND_FLAG, JSON.stringify(objArray), function (error, data) {
                                if (error) {
                                    message.Status = false;
                                    message.message = error;
                                    message.Data = null;
                                    callback(error, message);
                                } else {
                                    if (data != null) {
                                        if (data.charCodeAt() == OPERATE_SUCCESS) {
                                            callback(null, deleteDas, updateDas, dasServices);
                                        } else {
                                            message.Status = false;
                                            message.message = '同步添加采集失败';
                                            message.Data = null;
                                            callback(new Error('同步添加采集失败'), message);
                                        }
                                    } else {
                                        message.Status = false;
                                        message.message = '同步添加采集失败';
                                        message.Data = null;
                                        callback(new Error('同步添加采集失败'), message);
                                    }
                                }
                            });
                        } else {
                            callback(null, deleteDas, updateDas, dasServices);
                        }
                    },
                    function (deleteDas, updateDas, dasServices, callback) {
                        if (deleteDas.length > 0) {
                            var objArray = [];
                            var size = deleteDas.length;
                            for (var i = 0; i < size; i++) {
                                var das = deleteDas[i];
                                objArray.push(das.name);
                            }
                            boxSocket.sendMsg(EDM_DEL_DAS, devCode, COMMAND_FLAG, JSON.stringify(objArray), function (error, data) {
                                if (error) {
                                    message.Status = false;
                                    message.message = error;
                                    message.Data = null;
                                    callback(error, message);
                                } else {
                                    if (data != null) {
                                        if (data.charCodeAt() == OPERATE_SUCCESS) {
                                            callback(null, updateDas, dasServices, objArray);
                                        } else {
                                            message.Status = false;
                                            message.message = '同步删除采集失败';
                                            message.Data = null;
                                            callback(new Error('同步删除采集失败'), message);
                                        }
                                    } else {
                                        message.Status = false;
                                        message.message = '同步删除采集失败';
                                        message.Data = null;
                                        callback(new Error('同步删除采集失败'), message);
                                    }
                                }
                            });
                        } else {
                            callback(null, updateDas, dasServices, []);
                        }
                    },
                    function (updateDas, dasServices, deleteDas, callback) {
                        if (deleteDas.length > 0) {
                            var sql = sqlQuery.select().from('box_das_point').select(['Id', 'Pid']).where({dev_code: devCode, sn: deleteDas}).build();
                            logger.debug('获取采集下面测点sql:', sql);
                            query(sql, function (error, rows) {
                                if (error) {
                                    logger.error('获取采集测点信息错误：', error);
                                    message.Status = false;
                                    message.message = '获取采集测点信息失败';
                                    message.Data = null;
                                    callback(error, message);
                                } else {
                                    if (rows.length < 1) {
                                        callback(null, updateDas, dasServices);
                                    } else {
                                        var ID = [];
                                        var size = rows.length;
                                        for (var i = 0; i < size; i++) {
                                            ID.push(rows[i]['Pid']);
                                        }
                                        var rs = opPool.syncRemove('Point', 'ID', ID);
                                        logger.warn('删除采集下实时库测点：', JSON.stringify(rs));
                                        var sql = sqlQuery.remove().from('box_das_point').where({dev_code: devCode, sn: deleteDas}).build();
                                        logger.debug('删除采集下面测点sql:', sql);
                                        query(sql, function (error, rows) {
                                            if (error) {
                                                logger.error('删除采集测点信息错误：', error);
                                                message.Status = false;
                                                message.message = '删除采集测点信息失败';
                                                message.Data = null;
                                                callback(error, message);
                                            } else {
                                                callback(null, updateDas, dasServices);
                                            }
                                        });
                                    }
                                }
                            });
                        } else {
                            callback(null, updateDas, dasServices);
                        }
                    },
                    function (updateDas, dasServices, callback) {
                        if (updateDas.length > 0) {
                            var objArray = [];
                            var size = updateDas.length;
                            for (var i = 0; i < size; i++) {
                                var das = updateDas[i];
                                objArray.push({XMLName: {Space: das.descs, Local: das.name}, DataSource: das.DataSource, Web: das.Web, DataDest: das.DataDest});
                            }
                            boxSocket.sendMsg(EDM_MOD_DAS, devCode, COMMAND_FLAG, JSON.stringify(objArray), function (error, data) {
                                if (error) {
                                    message.Status = false;
                                    message.message = error;
                                    message.Data = null;
                                    callback(error, message);
                                } else {
                                    if (data != null) {
                                        if (data.charCodeAt() == OPERATE_SUCCESS) {
                                            callback(null, dasServices);
                                        } else {
                                            message.Status = false;
                                            message.message = '同步更新采集失败';
                                            message.Data = null;
                                            callback(new Error('同步更新采集失败'), message);
                                        }
                                    } else {
                                        message.Status = false;
                                        message.message = '同步更新采集失败';
                                        message.Data = null;
                                        callback(new Error('同步更新采集失败'), message);
                                    }
                                }
                            });
                        } else {
                            callback(null, dasServices);
                        }
                    },
                    function (dasServices, callback) {
                        boxSocket.sendMsg(EDM_ALL_DAS, devCode, COMMAND_FLAG, null, function (error, data) {
                            if (error) {
                                message.Status = false;
                                message.message = error;
                                message.Data = null;
                                callback(error, message);
                            } else {
                                callback(null, JSON.parse(data), dasServices);
                            }
                        });
                    },
                    function (boxDas, cloudDas, callback) {
                        var insertDas = [];
                        var updateDas = [];
                        var deleteDas = [];
                        var boxLength = boxDas.length;
                        var boxDasObj = {};
                        for (var i = 0; i < boxLength; i++) {
                            var p = boxDas[i];
                            var key = p.DasName;
                            boxDasObj[key] = p;
                        }
                        var cloudLength = cloudDas.length;
                        var cloudDasObj = {};
                        for (var i = 0; i < cloudLength; i++) {
                            var p = cloudDas[i];
                            cloudDasObj[p.name] = p;
                        }
                        for (var key in boxDasObj) {
                            var box = boxDasObj[key];
                            if (cloudDasObj[key]) {
                                var cloud = cloudDasObj[key];
                                delete cloudDasObj[key];
                                updateDas.push(box);
                            } else {
                                insertDas.push(box)
                            }
                        }
                        for (var key in cloudDasObj) {
                            var cloud = cloudDasObj[key];
                            deleteDas.push(cloud);
                        }
                        callback(null, insertDas, updateDas, deleteDas);
                    },
                    function (insertDas, updateDas, deleteDas, callback) {
                        if (insertDas.length > 0) {
                            var sql = 'insert into box_das_service (name,dev_code,type,node_name,port,descs,status,dest_type,isLink,create_date,sync_date) values '
                            var sqlConf = 'insert into box_das_conf (dev_code,das_name,keyId,Descs,Tips,Scope,defaults,TextType,TextData,Validate,CREATE_DATE) values '
                            var date = '"' + Utils.dateFormat(new Date().getTime(), Utils.yyyyMMddhhmmss) + '"';
                            var size = insertDas.length;
                            for (var i = 0; i < size; i++) {
                                var v = insertDas[i];
                                var p = v.Das;
                                var value = '("' + p.name + '","' + devCode + '","' + p.type + '","' + p.NodeName + '","' + p.port + '","' + p.desc + '","' + p.status + '","' + p.destType + '","' + p.isLink + '",' + date + ',' + date + ')'
                                sql += value;
                                var dasConf = v.DasConf;
                                var confSize = dasConf.length;
                                for (var j = 0; j < confSize; j++) {
                                    var conf = dasConf[j];
                                    var value = '("' + devCode + '","' + v.DasName + '","' + conf.Id + '","' + conf.Desc + '","' + conf.Tips + '","' + conf.Scope + '","' + conf.Default + '","' + conf.TextType + '","' + conf.TextData + '","' + conf.Validate + '",' + date + ')'
                                    sqlConf += value;
                                    if (dasConf[j + 1]) {
                                        sqlConf += ',';
                                    }
                                }
                                if (insertDas[i + 1]) {
                                    sql += ',';
                                    sqlConf += ',';
                                }
                            }
                            logger.debug('同步添采集信息sql:' + sql);
                            query(sql, function (error, rows) {
                                if (error) {
                                    logger.error('同步添加采集信息错误：' + error);
                                    message.Status = false;
                                    message.message = '同步添加采集出错';
                                    message.Data = null;
                                    callback(error, message);
                                } else {
                                    logger.debug('同步删除盒子采集配置信息sql:', sqlConf);
                                    query(sqlConf, function (error, rows) {
                                        if (error) {
                                            logger.error('同步添加采集配置信息错误：' + error);
                                            message.Status = false;
                                            message.message = '同步添加采集配置出错';
                                            message.Data = null;
                                            callback(error, message);
                                        } else {
                                            callback(null, updateDas, deleteDas);
                                        }
                                    });
                                }
                            });
                        } else {
                            callback(null, updateDas, deleteDas);
                        }
                    },
                    function (updateDas, deleteDas, callback) {
                        if (updateDas.length > 0) {
                            var size = updateDas.length;
                            var sqlDas = 'UPDATE box_das_service SET status = CASE name  ';
                            var sql = 'UPDATE box_das_conf SET defaults = CASE das_name ';
                            var keyIds = '';
                            var dasName = '';
                            for (var i = 0; i < size; i++) {
                                var das = updateDas[i];
                                var dasConf = das.DasConf
                                var confSize = dasConf.length;
                                dasName += '"' + das.DasName + '"';
                                if (updateDas[i + 1]) {
                                    dasName += ','
                                }
                                sqlDas += ' when "' + das.DasName + '" then "' + das.Das.status + '" ';
                                sql += ' when "' + das.DasName + '" then case keyId ';
                                for (var j = 0; j < confSize; j++) {
                                    var conf = dasConf[j];
                                    keyIds += '"' + conf.Id + '"';
                                    var sqlTemp = 'when "' + conf.Id + '" then "' + conf.Default + '" '
                                    sql += sqlTemp;
                                    if (dasConf[j + 1]) {
                                        keyIds += ','
                                    }
                                }
                                sql += ' end';
                            }
                            var date = '"' + Utils.dateFormat(new Date().getTime(), Utils.yyyyMMddhhmmss) + '"';
                            sqlDas += ' end, update_date= ' + date + ',sync_date=' + date + ' where dev_code ="' + devCode + '" and name in (' + dasName + ')';
                            sql += ' end where keyId in (' + keyIds + ') and dev_code ="' + devCode + '" and das_name in (' + dasName + ')';
                            logger.debug('同步更新采集信息sql:' + sqlDas);
                            query(sqlDas, function (err, rows) {
                                if (err) {
                                    logger.error('同步更新采集信息错误：' + err);
                                    message.Status = false;
                                    message.message = '同步更新采集出错';
                                    message.Data = null;
                                    callback(err, message);
                                } else {
                                    logger.debug('同步更新配置信息sql:' + sql);
                                    query(sql, function (err, rows) {
                                        if (err) {
                                            logger.error('同步更新采集配置信息错误：' + err);
                                            message.Status = false;
                                            message.message = '同步更新采集配置出错';
                                            message.Data = null;
                                            callback(err, message);
                                        } else {
                                            callback(null, deleteDas);
                                        }
                                    });
                                }
                            });

                        } else {
                            callback(null, deleteDas);
                        }
                    },
                    function (deleteDas, callback) {
                        if (deleteDas.length > 0) {
                            var size = deleteDas.length;
                            var dasNames = [];
                            for (var i = 0; i < size; i++) {
                                dasNames.push(deleteDas[i].name)
                            }
                            var sql = sqlQuery.remove().from('box_das_service').where({
                                dev_code: devCode,
                                name: dasNames
                            }).build();
                            var sqlConf = sqlQuery.remove().from('box_das_conf').where({
                                dev_code: devCode,
                                name: dasNames
                            }).build();
                            logger.debug('同步删除盒子采集信息sql:', sqlConf);
                            query(sql, function (err) {
                                if (err) {
                                    logger.error('同步删除盒子采集信息错误：', error);
                                    message.Status = false;
                                    message.message = '同步删除盒子采集信息出错';
                                    message.Data = null;
                                    callback(error, message);
                                } else {
                                    logger.debug('同步删除盒子采集配置信息sql:', sqlConf);
                                    query(sqlConf, function (error, rows) {
                                        if (err) {
                                            logger.error('同步删除采集配置信息错误：', error);
                                            message.Status = false;
                                            message.message = '同步删除采集配置出错';
                                            message.Data = null;
                                            callback(error, message);
                                        } else {
                                            callback(null);
                                        }
                                    });
                                }
                            });
                        } else {
                            callback(null);
                        }
                    },
                    function (callback) {
                        var sql = sqlQuery.select().from('box_das_point').select(['id', 'gn', 'pn', 'rt', 'sn', 'an', 'pt', 'fb', 'fk', 'hw', 'cp', 'tv', 'bv', 'ph', 'pl', 'ed', 'sync_status', 'sync_action', 'create_date']).where({
                            dev_code: devCode
                        }).build();
                        logger.debug('获取测点信息sql:' + sql);
                        query(sql, function (error, rows) {
                            if (error) {
                                logger.error('获取测点信息错误：' + error);
                                message.Status = false;
                                message.message = '获取测点出错';
                                message.Data = null;
                                callback(error, message);
                            } else {
                                callback(null, rows);
                            }
                        });
                    },
                    function (dasPoints, callback) {
                        var insertPoint = [];
                        var deletePoint = [];
                        var updatePoint = [];
                        var length = dasPoints.length;
                        for (var i = 0; i < length; i++) {
                            var point = dasPoints[i];
                            if (point.status == 1) {
                                continue;
                            }
                            var status = point.sync_action;
                            if (status == 'insert') {
                                insertPoint.push(point);
                            } else if (status == 'delete') {
                                deletePoint.push(point)
                            } else if (status == 'update') {
                                updatePoint.push(point);
                            }
                        }
                        callback(null, insertPoint, deletePoint, updatePoint, dasPoints);
                    },
                    function (insertPoint, deletePoint, updatePoint, dasPoints, callback) {
                        if (insertPoint.length > 0) {
                            var objArray = [];
                            var size = insertPoint.length;
                            for (var i = 0; i < size; i++) {
                                var point = insertPoint[i];
                                var obj = {
                                    Pn: point.pn.replace(point.sn + '_', ''),
                                    Sn: point.sn,
                                    Rt: point.rt || 0,
                                    An: point.an || '',
                                    Pt: point.pt || '',
                                    Fb: point.fb + '',
                                    Fk: point.fk + '',
                                    Cp: point.cp || '',
                                    Hw: point.hw || '',
                                    Tv: point.tv + '',
                                    Bv: point.bv + '',
                                    Ph: point.ph + '',
                                    Pl: point.pl + '',
                                    Ed: point.ed || ''
                                };
                                objArray.push(obj);
                            }
                            logger.debug('添加测点：', JSON.stringify(objArray));
                            boxSocket.sendMsg(EDM_ADD_POINT, devCode, COMMAND_FLAG, JSON.stringify(objArray), function (error, data) {
                                if (error) {
                                    message.Status = false;
                                    message.message = error;
                                    message.Data = null;
                                    callback(error, message);
                                } else {
                                    if (data != null) {
                                        if (data.charCodeAt() == OPERATE_SUCCESS) {
                                            callback(null, deletePoint, updatePoint, dasPoints);
                                        } else {
                                            message.Status = false;
                                            message.message = '同步添加测点失败';
                                            message.Data = null;
                                            callback(new Error('同步添加测点失败'), message);
                                        }
                                    } else {
                                        message.Status = false;
                                        message.message = '同步添加测点失败';
                                        message.Data = null;
                                        callback(new Error('同步添加测点失败'), message);
                                    }

                                }
                            });
                        } else {
                            callback(null, deletePoint, updatePoint, dasPoints);
                        }
                    },
                    function (deletePoint, updatePoint, dasPoints, callback) {
                        if (deletePoint.length > 0) {
                            var objArray = [];
                            var size = deletePoint.length;
                            for (var i = 0; i < size; i++) {
                                var point = deletePoint[i];
                                var obj = {
                                    Pn: point.pn.replace(point.sn + '_', ''),
                                    Sn: point.sn,
                                    Rt: point.rt || 0,
                                    An: point.an || '',
                                    Pt: point.pt || '',
                                    Fb: point.fb + '',
                                    Fk: point.fk + '',
                                    Cp: point.cp || '',
                                    Hw: point.hw || '',
                                    Tv: point.tv + '',
                                    Bv: point.bv + '',
                                    Ph: point.ph + '',
                                    Pl: point.pl + '',
                                    Ed: point.ed || ''
                                };
                                objArray.push(obj);
                            }
                            boxSocket.sendMsg(EDM_DEL_POINT, devCode, COMMAND_FLAG, JSON.stringify(objArray), function (error, data) {
                                if (error) {
                                    message.Status = false;
                                    message.message = error;
                                    message.Data = null;
                                    callback(error, message);
                                } else {
                                    if (data != null) {
                                        if (data.charCodeAt() == OPERATE_SUCCESS) {
                                            callback(null, updatePoint, dasPoints);
                                        } else {
                                            message.Status = false;
                                            message.message = '同步删除测点失败';
                                            message.Data = null;
                                            callback(new Error('同步删除测点失败'), message);
                                        }
                                    } else {
                                        message.Status = false;
                                        message.message = '同步删除测点失败';
                                        message.Data = null;
                                        callback(new Error('同步删除测点失败'), message);
                                    }
                                }
                            });
                        } else {
                            callback(null, updatePoint, dasPoints);
                        }
                    },
                    function (updatePoint, dasPoints, callback) {
                        if (updatePoint.length > 0) {
                            var objArray = [];
                            var size = updatePoint.length;
                            for (var i = 0; i < size; i++) {
                                var point = updatePoint[i];
                                var obj = {
                                    Pn: point.pn.replace(point.sn + '_', ''),
                                    Sn: point.sn,
                                    Rt: point.rt || 0,
                                    An: point.an || '',
                                    Pt: point.pt || '',
                                    Fb: point.fb + '',
                                    Fk: point.fk + '',
                                    Cp: point.cp || '',
                                    Hw: point.hw || '',
                                    Tv: point.tv + '',
                                    Bv: point.bv + '',
                                    Ph: point.ph + '',
                                    Pl: point.pl + '',
                                    Ed: point.ed || ''
                                };
                                objArray.push(obj);
                            }
                            boxSocket.sendMsg(EDM_MOD_POINT, devCode, COMMAND_FLAG, JSON.stringify(objArray), function (error, data) {
                                if (error) {
                                    message.Status = false;
                                    message.message = error;
                                    message.Data = null;
                                    callback(error, message);
                                } else {
                                    if (data != null) {
                                        if (data.charCodeAt() == OPERATE_SUCCESS) {
                                            callback(null, dasPoints);
                                        } else {
                                            message.Status = false;
                                            message.message = '同步更新测点失败';
                                            message.Data = null;
                                            callback(new Error('同步更新测点失败'), message);
                                        }
                                    } else {
                                        message.Status = false;
                                        message.message = '同步更新测点失败';
                                        message.Data = null;
                                        callback(new Error('同步更新测点失败'), message);
                                    }

                                }
                            });
                        } else {
                            callback(null, dasPoints);
                        }
                    },
                    function (dasPoints, callback) {
                        boxSocket.sendMsg(EDM_ALL_POINT, devCode, COMMAND_FLAG, null, function (error, data) {
                            if (error) {
                                message.Status = false;
                                message.message = error;
                                message.Data = null;
                                callback(error, message);
                            } else {

                                callback(null, JSON.parse(data), dasPoints);
                            }
                        });
                    },
                    function (boxPoints, cloudPoints, callback) {
                        var insertPoint = [];
                        var updatePoint = [];
                        var deletePoint = [];
                        var boxLength = boxPoints.length;
                        var boxPointObj = {};
                        for (var i = 0; i < boxLength; i++) {
                            var p = boxPoints[i];
                            var key = p.Sn + '_' + p.Pn;
                            boxPointObj[key] = p;
                        }
                        var cloudLength = cloudPoints.length;
                        var cloudPointObj = {};
                        for (var i = 0; i < cloudLength; i++) {
                            var p = cloudPoints[i];
                            var key = p.pn;
                            cloudPointObj[key] = p;
                        }
                        for (var key in boxPointObj) {
                            var box = boxPointObj[key];
                            if (cloudPointObj[key]) {
                                var cloud = cloudPointObj[key];
                                delete cloudPointObj[key];
                                if (cloud.sync_action == 'update') {
                                    updatePoint.push(box);
                                }
                                if (cloud.sync_action == 'insert') {
                                    insertPoint.push(box)
                                }
                            } else {
                                insertPoint.push(box)
                            }
                        }
                        for (var key in cloudPointObj) {
                            var cloud = cloudPointObj[key];
                            deletePoint.push(cloud);
                        }
                        callback(null, insertPoint, updatePoint, deletePoint);
                    },
                    function (insertPoint, updatePoint, deletePoint, callback) {
                        if (insertPoint.length > 0) {
                            var nodeCols = [];
                            var nodeRows = [];
                            nodeCols.push(["GN", OPAPI.TYPE.STRING]);
                            nodeCols.push(["ED", OPAPI.TYPE.STRING]);
                            nodeCols.push(["LC", OPAPI.TYPE.INT8]);
                            nodeRows.push([('W3.' + devCode ).toUpperCase(), '盒子节点', 1]);
                            var rs = opPool.syncInsert('Node', nodeRows, nodeCols);
                            logger.warn('添加盒子节点：', JSON.stringify(rs));
                            var cols = [];
                            var rows = [];
                            cols.push(["GN", OPAPI.TYPE.STRING]);
                            cols.push(["RT", OPAPI.TYPE.INT8]);
                            cols.push(["ED", OPAPI.TYPE.STRING]);
                            cols.push(["AN", OPAPI.TYPE.STRING]);
                            cols.push(["PT", OPAPI.TYPE.INT8]);
                            cols.push(["CP", OPAPI.TYPE.INT8]);
                            cols.push(["HW", OPAPI.TYPE.STRING]);
                            cols.push(["TV", OPAPI.TYPE.FLOAT]);
                            cols.push(["BV", OPAPI.TYPE.FLOAT]);
                            var length = insertPoint.length;
                            var insertObj = {};
                            for (var i = 0; i < length; i++) {
                                var point = insertPoint[i];
                                var row = [];
                                point.Gn = ('W3.' + devCode + '.' + point.Sn + '_' + point.Pn).toUpperCase();
                                point.Pn = (point.Sn + '_' + point.Pn).toLowerCase();
                                insertObj[point.Gn] = point;
                                row.push(point.Gn);
                                var rt = point.Rt;
                                var RT = 0;
                                switch (rt) {
                                    case 'AX':
                                        RT = 0;
                                        break;
                                    case 'DX':
                                        RT = 1;
                                        break;
                                    case 'I2':
                                        RT = 2;
                                        break;
                                    case 'I4':
                                        RT = 3;
                                        break;
                                    case 'R8':
                                        RT = 4;
                                        break;
                                    default:
                                        RT = 0;
                                        break;
                                }
                                row.push(RT);
                                row.push(point.Ed);
                                row.push(point.An);
                                row.push(point.Pt);
                                row.push(point.Cp);
                                row.push(point.Hw);
                                row.push(point.Tv);
                                row.push(point.Bv);
                                rows.push(row);
                                insertPoint[i] = point;
                            }
                            opPool.insert('Point', rows, cols, function (error, rrs) {
                                if (error && error != 0 && error.code) {
                                    logger.error('同步添加测点错误：', JSON.stringify(error))
                                    message.Status = false;
                                    message.message = '同步添加测点失败';
                                    message.Data = null;
                                    callback(new Error('添加测点错误'), message);
                                } else {
                                    var size = rrs.length;
                                    var points = [];
                                    for (var i = 0; i < size; i++) {
                                        var rr = rrs[i];
                                        if (rr.EC != 0) {
                                            continue;
                                        }
                                        var point = insertObj[rr.GN];
                                        point.Pid = rr.ID;
                                        points.push(point)
                                    }
                                    if (points.length < 1) {
                                        callback(null, updatePoint, deletePoint);
                                    } else {
                                        var sql = 'insert into box_das_point (uid,pid,gn,pn,rt,sn,an,pt,fb,fk,cp,hw,tv,bv,ph,pl,ed,dev_code,create_date,sync_date) values ';
                                        var date = '"' + Utils.dateFormat(new Date().getTime(), Utils.yyyyMMddhhmmss) + '"';
                                        var pointSize = points.length;
                                        for (var i = 0; i < pointSize; i++) {
                                            var p = points[i];
                                            var value = '(' + p.Uid + ',' + p.Pid + ',"' + p.Gn + '","' + p.Pn + '","' + p.Rt + '","' + p.Sn + '","' + p.An + '","' + p.Pt + '","' + p.Fb + '","' + p.Fk + '","' + p.Cp + '",' +
                                                '"' + p.Hw + '",' + p.Tv + ',' + p.Bv + ',' + p.Ph + ',' + p.Pl + ',"' + p.Ed + '","' + devCode + '",' + date + ',' + date + ')'
                                            sql += value;
                                            if (points[i + 1]) {
                                                sql += ',';
                                            }
                                        }
                                        logger.debug('同步添加测点信息sql:' + sql);
                                        query(sql, function (err, rows) {
                                            if (err) {
                                                logger.error('同步添加测点信息错误：' + err);
                                                message.Status = false;
                                                message.message = '同步添加测点出错';
                                                message.Data = null;
                                                callback(error, message);
                                            } else {
                                                callback(null, updatePoint, deletePoint);
                                            }
                                        });
                                    }
                                }
                            });
                        } else {
                            callback(null, updatePoint, deletePoint);
                        }
                    },
                    function (updatePoint, deletePoint, callback) {
                        if (updatePoint.length > 0) {
                            var cols = [];
                            var rows = [];
                            cols.push(["GN", OPAPI.TYPE.STRING]);
                            cols.push(["ED", OPAPI.TYPE.STRING]);
                            cols.push(["AN", OPAPI.TYPE.STRING]);
                            cols.push(["PT", OPAPI.TYPE.INT8]);
                            cols.push(["CP", OPAPI.TYPE.INT8]);
                            cols.push(["HW", OPAPI.TYPE.STRING]);
                            cols.push(["TV", OPAPI.TYPE.FLOAT]);
                            cols.push(["BV", OPAPI.TYPE.FLOAT]);
                            var length = updatePoint.length;
                            var insertObj = {};
                            for (var i = 0; i < length; i++) {
                                var point = updatePoint[i];
                                var row = [];
                                point.Gn = ('W3.' + devCode + '.' + point.Sn + '_' + point.Pn).toUpperCase();
                                insertObj[point.Gn] = point;
                                row.push(point.Gn);
                                row.push(point.Ed);
                                row.push(point.An);
                                row.push(point.Pt);
                                row.push(point.Cp);
                                row.push(point.Hw);
                                row.push(point.Tv);
                                row.push(point.Bv);
                                rows.push(row);
                                updatePoint[i] = point;
                            }
                            opPool.update('Point', rows, cols, function (error, rrs) {
                                if (error && error != 0 && error.code) {
                                    logger.error('同步更新测点错误：', JSON.stringify(error))
                                    message.Status = false;
                                    message.message = '同步跟新测点失败';
                                    message.Data = null;
                                    callback(error, message);
                                } else {
                                    var size = rrs.length;
                                    var points = [];
                                    for (var i = 0; i < size; i++) {
                                        var rr = rrs[i];
                                        var point = insertObj[rr.GN];
                                        point.Pid = rr.ID;
                                        points.push(point)
                                    }
                                    size = points.length;
                                    var sql = 'update box_das_point set ';
                                    var gns = '';
                                    var anSql = '';
                                    var ptSql = '';
                                    var fbSql = '';
                                    var fkSql = '';
                                    var cpSql = '';
                                    var hwSql = '';
                                    var tvSql = '';
                                    var bvSql = '';
                                    var phSql = '';
                                    var plSql = '';
                                    var edSql = '';
                                    var date = '"' + Utils.dateFormat(new Date().getTime(), Utils.yyyyMMddhhmmss) + '"';
                                    for (var i = 0; i < size; i++) {
                                        var p = points[i];
                                        gns += '"' + p.Gn + '"';
                                        if (points[i + 1]) {
                                            gns += ',';
                                        }
                                        anSql += ' when "' + p.Gn + '" then "' + p.An + '" ';
                                        ptSql += ' when "' + p.Gn + '" then "' + p.Pt + '" ';
                                        fbSql += ' when "' + p.Gn + '" then ' + p.Fb + ' ';
                                        fkSql += ' when "' + p.Gn + '" then ' + p.Fk + ' ';
                                        cpSql += ' when "' + p.Gn + '" then "' + p.Cp + '" ';
                                        hwSql += ' when "' + p.Gn + '" then "' + p.Hw + '" ';
                                        tvSql += ' when "' + p.Gn + '" then ' + p.Tv + ' ';
                                        bvSql += ' when "' + p.Gn + '" then ' + p.Bv + ' ';
                                        phSql += ' when "' + p.Gn + '" then ' + p.Ph + ' ';
                                        plSql += ' when "' + p.Gn + '" then ' + p.Pl + ' ';
                                        edSql += ' when "' + p.Gn + '" then "' + p.Ed + '" ';
                                    }
                                    sql += ' An = case GN ' + anSql + ' end,';
                                    sql += ' Pt = case GN ' + ptSql + ' end,';
                                    sql += ' Fb = case GN ' + fbSql + ' end,';
                                    sql += ' Fk = case GN ' + fkSql + ' end,';
                                    sql += ' Cp = case GN ' + cpSql + ' end,';
                                    sql += ' Hw = case GN ' + hwSql + ' end,';
                                    sql += ' Tv = case GN ' + tvSql + ' end,';
                                    sql += ' Bv = case GN ' + bvSql + ' end,';
                                    sql += ' Ph = case GN ' + phSql + ' end,';
                                    sql += ' Pl = case GN ' + plSql + ' end,';
                                    sql += ' Ed = case GN ' + edSql + ' end,';
                                    sql += ' sync_status = 1,update_date=' + date + ',sync_date=' + date + ' where dev_code="' + devCode + '" and Gn in (' + gns + ')';
                                    logger.debug('同步更新测点信息sql:' + sql);
                                    query(sql, function (error, rows) {
                                        if (error) {
                                            logger.error('同步更新测点信息错误：' + error);
                                            message.Status = false;
                                            message.message = '同步更新测点出错';
                                            message.Data = null;
                                            callback(error, message);
                                        } else {
                                            callback(null, deletePoint);
                                        }
                                    });
                                }
                            });
                        } else {
                            callback(null, deletePoint);
                        }
                    },
                    function (deletePoint, callback) {
                        if (deletePoint.length > 0) {
                            var length = deletePoint.length;
                            var gns = [];
                            for (var i = 0; i < length; i++) {
                                var point = deletePoint[i];
                                gns.push(point.gn);
                            }
                            opPool.remove('Point', 'GN', gns, function (error, rows) {
                                if (error && error != 0 && error.code) {
                                    logger.error('同步删除测点错误：', JSON.stringify(error))
                                    message.Status = false;
                                    message.message = '同步删除测点失败';
                                    message.Data = null;
                                    callback(error, message);
                                } else {
                                    callback(null, gns);
                                }
                            });
                        } else {
                            message.Status = true;
                            message.message = 'OK';
                            message.Data = null;
                            callback(new Error('同步成功'), message);
                        }
                    },
                    function (gns, callback) {
                        var sql = sqlQuery.remove().from('box_das_point').where({
                            dev_code: devCode,
                            gn: gns
                        }).build();
                        logger.debug('同步删除测点信息sql:' + sql);
                        query(sql, function (error, rows) {
                            if (error) {
                                logger.error('同步删除测点信息错误：' + error);
                                message.Status = false;
                                message.message = '同步删除测点出错';
                                message.Data = null;
                                callback(error, message);
                            } else {
                                message.Status = true;
                                message.message = 'OK';
                                message.Data = null;
                                callback(null, message);
                            }
                        });
                    }
                ],
                function (error, message) {
                    res.json(message);
                }
            )
            ;
        }
    }
;
module.exports = boxService;
/**
 * Created by 啬en on 2016/7/11.
 */
var OPAPI = require('opapi');
var async = require("async");
var logger = require('log4js').getLogger('system');
var fs = require("fs");

var path = require('path');
// var dbConfig = JSON.parse(fs.readFileSync("./config.json"));

var dbConfig = null;
var IP = "192.168.3.197";
var PORT = 8902;
var USER = "magustek";
var PWD = "123456";
var TIME = 60;
// var IP = "192.168.2.64";
// var PORT = 8300;
// var USER = "sis";
// var PWD = "openplant";
// var TIME = 60;

// var IP = "127.0.0.1";
// var PORT = 8902;
// var USER = "magustek";
// var PWD = "123456";
// var TIME = 60;
var IP = "127.0.0.1";
var PORT = 8200;
var USER = "sis";
var PWD = "openplant";
var TIME = 60;

if (dbConfig && dbConfig.openplant) {
    var dbCon = dbConfig.openplant;
    if (dbCon.IP) {
        IP = dbCon.IP;
    }
    if (dbCon.TIME) {
        TIME = dbCon.TIME;
    }
    if (dbCon.PORT) {
        PORT = dbCon.PORT;
    }
    if (dbCon.USER) {
        USER = dbCon.USER;
    }
    if (dbCon.PWD) {
        PWD = dbCon.PWD;
    }
}
var clientNumber = 0;

//异步查询模式
function asyncFunction(core, client, callback) {
    try {
        var rs = core(client.client);
        opPool.release(client);
        if (rs != null) {
            if (rs.error) {
                callback(rs.error, null, null);
            } else {
                callback(0, rs.rows, rs.columns);
            }
        } else {
            console.log("result is null");
            throw "result is null";
        }
    } catch (e) {
        logger.error('agent error:' + e);
        throw e;
    }
}

//同步操作模板框架
function syncFunction(core, client) {
    var data;
    try {
        async.waterfall(
            [
                function (callback) {
                    var rs = core(client.client);
                    opPool.release(client);
                    if (rs != null) {
                        if (rs.error) {
                            callback(rs.error, null, null);
                        } else {
                            callback(0, rs.rows, rs.columns);
                        }
                    } else {
                        console.log("result is null");
                        throw "result is null";
                    }
                }
            ],
            function (error, rows, columns) {
                data = {
                    error: error,
                    rows: rows,
                    columns: columns
                };
            });
    } catch (e) {
        throw e;
    }
    return data;
}

//同步操作模板框架
function agentInfo(core, client) {
    var data;
    try {
        data = core(client.client)
        opPool.release(client);
    } catch (e) {
        logger.error('get  agentinfo error:' + e);
        return data;
    }
    return data;
}

//获取系统时间
function systemTime(core, client) {
    var data = 0;
    try {
        data = core(client.client)
        opPool.release(client);
    } catch (e) {
        logger.error('server time error:' + e);
        return data;
    }
    return data;
}
/**
 * 连接池初始化信息
 * @type {{name: string, ip: string, port: number, time: number, username: string, password: string, max: number, min: number, idleTimeoutMillis: number}}
 */

/**
 * 数据库连接
 * @type {{client: null, inuse: number}}
 */
function Client() {
    client = null;
    inuse = 0;
    //异步查询模式
    this.find = function (tableName, keyType, keys, cols, callback) {
        return asyncFunction(function (client) {
            return OPAPI.find(client, tableName, keyType, keys, cols);
        }, this, callback);
    };
    //异步SQL查询模式
    this.query = function (sql, callback) {
        return asyncFunction(function (client) {
            return OPAPI.query(client, sql);
        }, this, callback);
    };

    //异步update
    this.update = function (tableName, keys, cols, callback) {
        return asyncFunction(function (client) {
            return OPAPI.update(client, tableName, keys, cols);
        }, this, callback);
    };

    //异步insert
    this.insert = function (tableName, keys, cols, callback) {
        return asyncFunction(function (client) {
            return OPAPI.insert(client, tableName, keys, cols);
        }, this, callback);
    };

    //异步Remove
    this.remove = function (tableName, keyType, keys, callback) {
        return asyncFunction(function (client) {
            return OPAPI.remove(client, tableName, keyType, keys);
        }, this, callback);
    };
    //同步SQL查询模式
    this.syncQuery = function (sql) {
        return syncFunction(function (client) {
            return OPAPI.query(client, sql);
        }, this);
    };

    //同步find
    this.syncFind = function (tableName, keyType, keys, cols) {
        return syncFunction(function (client) {
            return OPAPI.find(client, tableName, keyType, keys, cols);
        }, this);
    };

    //同步update
    this.syncUpdate = function (tableName, keys, cols) {
        return syncFunction(function (client) {
            return OPAPI.update(client, tableName, keys, cols);
        }, this);
    };

    //同步INSERT
    this.syncInsert = function (tableName, keys, cols) {
        return syncFunction(function (client) {
            return OPAPI.insert(client, tableName, keys, cols);
        }, this);
    };

    //同步Remove
    this.syncRemove = function (tableName, keyType, keys) {
        return syncFunction(function (client) {
            return OPAPI.remove(client, tableName, keyType, keys);
        }, this);
    };
    //获取系统时间
    this.systemTime = function () {
        return systemTime(function (client) {
            return OPAPI.systemTime(client)
        }, this);
    };
    // 订阅
    this.subscribe = function (ids) {
        return syncFunction(function (client) {
            return OPAPI.subscribe(handler, ids);
        }, this);
    };
    //取消订阅
    this.unsubscribe = function (handler, ids) {
        return syncFunction(function (client) {
            return OPAPI.unsubscribe(handler, ids);
        }, this);
    };

    this.agengInfo = function (filter) {
        return agentInfo(function (client) {
            return OPAPI.agentinfo(client, filter);
        }, this);
    }
};

/**
 * 数据库连接池
 * @type {{name: string, ip: string, port: number, time: number, username: string, password: string, max: number, min: number, idleTimeoutMillis: number, clientArray: Array, init: opPool.init, getConnect: opPool.getConnect, getConn: opPool.getConn, release: opPool.release, destroy: opPool.destroy}}
 */
var opPool = {
    name: 'openplant',
    max: 50,
    min: 2,
    maxIdle: 5,
    idleTimeoutMillis: 30 * 1000,
    clientArray: [],
    /**
     * 数据库连接初始化
     */
    init: function () {
        this.min = this.min < 0 ? 2 : this.min;
        this.maxIdle = this.maxIdle < this.min ? this.min : this.maxIdle;
        for (var i = 0; i < this.min; i++) {
            var c = this.getConn();
            c.inuse = 0;
            this.clientArray.push(c);
        }
        clientNumber++;
    },
    /**
     * 获取连接信息
     * @returns {*}
     */
    getConnect: function () {
        /**
         * 当前池中是否有闲置的连接
         * @type {number}
         */
        var i = 0;
        var length = this.clientArray.length;
        for (i = 0; i < length; i++) {
            var c = this.clientArray[i];
            try {
                if (c && c.inuse == 0) {
                    //执行业务活动
                    //1.检查连接是否可用
                    if (c.client) {
                        var rs = OPAPI.status(c.client);
                        if (!rs) {
                            this.destroy(c.client);
                            c.client = null;
                            c = this.getConn();
                            // 检查创建的对象是否为null
                            if (c) {
                                this.clientArray[i] = c;
                            }
                        }
                        c.inuse = 1;
                        return c;
                    } else {
                        //如果当前对象连接不可用
                        c.client = null;
                        c = this.getConn();
                        // 检查创建的对象是否为null
                        if (c) {
                            this.clientArray[i] = c;
                        }
                        c.inuse = 1;
                        return c;
                    }
                }
            } catch (e) {
                logger.error('server error:' + e);
                try {
                    c.client = null;
                    c = this.getConn();
                    this.clientArray[i] = c;
                    c.inuse = 0;
                } catch (e) {
                    throw e;
                }
                throw e;
            }
        }

        //清理缓冲区
        var clients = [];
        for (i = 0; i < length; i++) {
            var c = this.clientArray[i];
            if ((c && c.inuse != undefined && c.client != null )) {
                clients.push(c)
            }
        }
        this.clientArray = clients;
        /**
         * 没有闲置的连接，并且没有达到最大连接个数
         */
        if (i < this.max) {
            var c = this.getConn();
            if (c) {
                this.clientArray.push(c);
            }
            c.inuse = 1;
            return c;
        }
        /**
         * 没有连接空间了
         */
        else {
            throw {
                name: "FullStack",
                message: "conn reaches the maximum"
            }
        }
    },
    /**
     * 获取新的连接
     */
    getConn: function () {
        try {
            var client = OPAPI.init(0xC00, IP, PORT, TIME, USER, PWD);
            var c = new Client();
            c.client = client;
            c.inuse = 0;
            return c;
        } catch (e) {
            logger.error('server error:' + e);
            return null;
        }

    },
    /**
     * 释放当前连接
     * @param client
     */
    release: function (client) {
        var size = 0;
        var clients = [];
        for (var i = 0; i < this.clientArray.length; i++) {
            if (this.clientArray[i].inuse == 0) {
                size++;
            }
            clients[i] = this.clientArray[i];
        }
        if (size > this.maxIdle) {
            clients.remove(client);
            this.destroy(client.client);
        } else {
            if (client.client) {
                client.inuse = 0;
            }
        }
        this.clientArray = clients;

    },
    /**
     * 销毁当前连接
     * @param client
     */
    destroy: function (client) {
        OPAPI.close(client);
    }
}


//异步查询模式
opPool.find = function (tableName, keyType, keys, cols, callback) {
    try {
        var conn = opPool.getConnect();
        return conn.find(tableName, keyType, keys, cols, callback);
    } catch (e) {
        var message = {
            code: '-97',
            message: 'server io error'
        }
        callback(message, null, null);
    }
}

//异步SQL查询模式
opPool.query = function (sql, callback) {
    try {
        var conn = opPool.getConnect();
        return conn.query(sql, callback);
    } catch (e) {
        var message = {
            code: '-97',
            message: 'server io error'
        }
        callback(message, null, null);
    }
}

//异步update
opPool.update = function (tableName, keys, cols, callback) {
    try {
        var conn = opPool.getConnect();
        return conn.update(tableName, keys, cols, callback);
    } catch (e) {
        var message = {
            code: '-97',
            message: 'server io error'
        }
        callback(message, null, null);
    }
}

//异步insert
opPool.insert = function (tableName, keys, cols, callback) {
    try {
        var conn = opPool.getConnect();
        return conn.insert(tableName, keys, cols, callback);
    } catch (e) {
        var message = {
            code: '-97',
            message: 'server io error'
        }
        callback(message, null, null);
    }
}

//异步Remove
opPool.remove = function (tableName, keyType, keys, callback) {
    try {
        var conn = opPool.getConnect();
        return conn.remove(tableName, keyType, keys, callback);
    } catch (e) {
        var message = {
            code: '-97',
            message: 'server io error'
        }
        callback(message, null, null);
    }
}

//同步SQL查询模式
opPool.syncQuery = function (sql) {
    try {
        var conn = opPool.getConnect();
        return conn.syncQuery(sql);
    } catch (e) {
        var message = {
            code: '-97',
            message: 'server io error'
        }
        return {
            error: message,
            rows: null,
            columns: null
        }
    }
}

//同步find
opPool.syncFind = function (tableName, keyType, keys, cols) {
    try {
        var conn = opPool.getConnect();
        return conn.syncFind(tableName, keyType, keys, cols);
    } catch (e) {
        var message = {
            code: '-97',
            message: 'server io error'
        }
        return {
            error: message,
            rows: null,
            columns: null
        }
    }
}

//同步update
opPool.syncUpdate = function (tableName, keys, cols) {
    try {
        var conn = opPool.getConnect();
        return conn.syncUpdate(tableName, keys, cols);
    } catch (e) {
        var message = {
            code: '-97',
            message: 'server io error'
        }
        return {
            error: message,
            rows: null,
            columns: null
        }
    }
}

//同步insert
opPool.syncInsert = function (tableName, keys, cols) {
    try {
        var conn = opPool.getConnect();
        return conn.syncInsert(tableName, keys, cols);
    } catch (e) {
        var message = {
            code: '-97',
            message: 'server io error'
        }
        return {
            error: message,
            rows: null,
            columns: null
        }
    }
}
//同步Remove
opPool.syncRemove = function (tableName, keyType, keys) {
    try {
        var conn = opPool.getConnect();
        return conn.remove(tableName, keyType, keys);
    } catch (e) {
        var message = {
            code: '-97',
            message: 'server io error'
        }
        return {
            error: message,
            rows: null,
            columns: null
        }
    }
}

opPool.subscribe = function (ids) {
    try {
        var conn = opPool.getConnect();
        return conn.subscribe(ids);
    } catch (e) {
        var message = {
            code: '-97',
            message: 'server io error'
        }
        return {
            error: message,
            rows: null,
            columns: null
        }
    }
}
opPool.unsubscribe = function (handler, ids) {
    return OPAPI.unsubscribe(handler, ids);
}
opPool.startSub = function (callback) {
    return OPAPI.startSub(callback);
}
opPool.stopSub = function () {
    return OPAPI.stopSub();
}
opPool.agengInfo = function (filter) {
    try {
        var conn = opPool.getConnect();
        return conn.agengInfo(filter);
    } catch (e) {
        logger.error('agentInfo  error');
        return {};
    }
}
//获取系统时间
opPool.systemTime = function () {
    try {
        var conn = opPool.getConnect();
        return conn.systemTime();
    } catch (e) {
        return 0;
    }
}
opPool.makeUUID = function (key) {
    return OPAPI.makeUUID(key);
}

/**
 * token加密
 * @param value
 */
opPool.encrypt = function (value) {
    var data = OPAPI.aesencrypt(value);
    return data;
}
/**
 * token 解密
 * @param value
 */
opPool.decrypt = function (value) {
    var data = '';
    try {
        data = OPAPI.aesdecrypt(value);
        return data;
    } catch (e) {
        logger.error('密文非法');
        return '';
    }
}

opPool.init();
module.exports = opPool;
// var token = 'dzj7P9jP4A/zURxRTK0Pyb13CuMDfZfIZfXIubC4rug8tKg4yCBGhEnHyoWJg8mXrtV7CAh6y5v0l3eyDLSdv1T2paedby6fO55yUSTlLIFDgxXjjZs+Jd5qiSPZAqHDWaOA44o5Le5KyRVK2HGfxXMQtHZWt1FljnpzNRwq1q7Ut2lgCtLMYzDfmrWknglRC5izKVpX17J7k0Wt7Lwu0eV6jCb05wuxdfoVyFXpC5TbKLr6J2WFwBu21xIKEVaEPYqKyX5F5rIMo1g/ZLaKcw==';
// console.log(opPool.decrypt(token));

//
// var time = new Date().getTime();
// var cols = [
//     ["ID", OPAPI.TYPE.INT32],
//     ["AV", OPAPI.TYPE.FLOAT],
//     ["TM", OPAPI.TYPE.DOUBLE]
// ];
//
// // var time = new Date().getTime() / 1000;
// var op = OPAPI.init(0xC00, "127.0.0.1", 8200, 30, "sis", "openplant");
// // var rows = new Array();
// // for (var i = 0; i < 10; i++) {
// //     //rows.push({ID: 11034+i, AV: i+0.5});
// //     rows.push([115134, Math.random() * 100], time - (10 - i));
// // }
// // // var rs = OPAPI.update(op, "Realtime", rows, cols);
// // // console.log(rs);
// // var rs = OPAPI.insert(op, "Archive", rows, cols);
// // console.log(rs);
// // console.log("update " + (new Date().getTime() / 1000) - time + " ms");
//
//
// var time = new Date().getTime() / 1000;
// console.log(time);
// var cols = [
//     ["ID", OPAPI.TYPE.INT32],
//     ["AV", OPAPI.TYPE.FLOAT],
//     ["TM", OPAPI.TYPE.DOUBLE],
//     ["DS", OPAPI.TYPE.INT32]
// ];
// var rows = new Array();
// var rowsr = new Array();
// for (var i = 0; i < 10; i++) {
//     //rows.push({ID: 11034+i, AV: i+0.5});
//     var row = [115129, Math.random() * 100, time / 1000 - (10 - i)];
//     rows.push(row);
//     rowsr.push(row);
// }

// var cols = new Array();
// cols.push(["ID", OPAPI.TYPE.INT32]);
// cols.push(["ED", OPAPI.TYPE.STRING]);
// cols.push(["EU", OPAPI.TYPE.STRING]);
//
// var rrs = new Array();
// for (var i = 0; i < 10; i++) {
//     var rs = [1549 + i, 'W3.NODE.HW1' + i,'AP'];
//     rrs.push(rs);
// }
// console.log(rrs);
// opPool.update('Point', rrs, cols, function (error, rows, cols) {
//     logger.debug(error);
//     logger.debug(rows);
//     logger.debug(cols);
// });
//
// var cols = new Array();
// cols.push("ID");
// cols.push("GN");
// cols.push("UD");
// cols.push("ED");
// cols.push("EU");
// cols.push("HW");
//
// var rrs = new Array();
// for (var i = 0; i < 10; i++) {
//     rrs.push(1549 + i);
// }
// console.log(rrs);
// opPool.remove('Point', 'ID', rrs, function (error, rows, cols) {
//     logger.debug(error);
//     logger.debug(rows);
//     logger.debug(cols);
// });
// var rs = OPAPI.update(op, "Realtime", rows, cols);
// console.log(rs);
// // var rs = OPAPI.update(op, "Archive", rowsr, cols);
// // console.log(rs);
// console.log("update " + (new Date().getTime() - time) + " ms");
//
// var sql = 'select ID,RT,AL,AC,TM,DS,AV from AAlarm where ID in (116473,116476,116480,116488,116491,116492)  and TM between \'2017-04-26 15:30:09\' and \'2017-04-27 15:30:09\' order by TM desc limit 0,100';
// opPool.query(sql, function (error, rows, columns) {
//     logger.error(error);
//     logger.error(rows);
//     logger.error(columns);
//     // var ud = rows[0].UD;
//     // var buf = new Buffer(ud.toString());
//     // console.log(buf.toString('Hex'));
// });
// var ids = [116458, 116459, 116462, 118459, 118471];
// var cols = ["TM", "DS", "ID", "AV"];
// opPool.find("Realtime", 'ID', ids, cols, function (error, rows, columns) {
//     logger.debug(error);
//     logger.debug(rows);
//     logger.debug(columns);
// });
// var data = "1-123-" + new Date().getTime() + '需要几秒的' + parseInt(Math.random() * 1000);
// console.log("需要加密的数据:", data);
// // var t = new Buffer(data).toString('base64');
// // console.log(t);
// // console.log(new Buffer(t, 'base64').toString());
// try {
//
//     console.log("需要加密的数据:", data);
//     var crypted = opPool.encrypt(data);
//     console.log("数据加密后:", crypted);
//     var val = '123456789101';
//     console.log(val.length);
//     var dec = opPool.decrypt(val);
//     console.log("数据解密后:", dec);
// } catch (e) {
//     console.log('-------------');
//     console.log(e);
// }

// var op = OPAPI.init(0xC00, "192.168.0.194", 8902, 30, "magustek", "123456");
// var ids = [116267, 116268, 116269];
// var cols = ["ID", "GN", "PN", "ED", "FM", "EU", "RT", "TV", "BV"];
// var rs = OPAPI.find(op, 'Point', 'ID', ids, cols);
// console.log(rs);
// var sql = 'select count(ID) from Point ';
// var rs = OPAPI.query(op, sql);
// console.log(rs);
// // console.log('-----------------');
// var cols = [[ "ID", OPAPI.TYPE.INT32 ],[ "ND", OPAPI.TYPE.INT32 ],[ "PN", OPAPI.TYPE.STRING ],[ "UD", OPAPI.TYPE.INT64 ]];
// // // var rows = new Array();
// var rows = [[10007,1,'POINT07113','0x78CC877DA964F020']];
// // // rows.push(row);
// rs = find(op, tablename, OPAPI.TYPE.STRING, "GN", cols);
// console.log(rs);
// var rs =opPool.insert("Point", rows,cols, function(error,col,com){
//       console.log(error);
//       console.log(col);
//       console.log(com);
//       var sql = 'select ID,UD,TN,PN,RT,ED,FQ,FM,TV,BV,EU,DB,EX,PT,KT,AP,LC,H4,H3,ZH,HL,LL,ZL,L3,L4 from Point where PN in ("POINT07113")';
//         opPool.query(sql, function(error, rows, columns) {
//             logger.error(error);
//             logger.error(rows);
//             logger.error(columns);
//         });
// });
//  console.log(rs);

// var ID = [112095, 113099]
// var sql = 'select distinct TM from archive where mode =\'PLOT\' and interval = \'120s\' and  ID in (116510,116512) and TM between \'1493704234\' and \'1493704834\'';
// // var sql = 'select  GN, ID,TM,DS,AV from archive(\'plot\',\'48s\') where TM between 1491946153 and 1491974953 and ID in (116307,116308,116269) order by TM';
// opPool.query(sql, function (error, col, com) {
//     console.log(error);
//     console.log(col);
//     console.log(com);
// });
// var sql = 'select * from Archive where mode =\'SPAN\' and interval = \'1s\' and ID in (116510,116512) and TM between \'1493704234\' and \'1493704834\' order by TM';
// // var sql = 'select  GN, ID,TM,DS,AV from archive(\'plot\',\'48s\') where TM between 1491946153 and 1491974953 and ID in (116307,116308,116269) order by TM';
// opPool.query(sql, function (error, col, com) {
//     console.log(error);
//     console.log(col);
//     console.log(com);
// });
// var sql = "select * from Archive where ID =123 and TM between '2017-05-05 09:30:00' and '2017-05-05 10:00:00' limit 1";
// // var sql = 'select  GN, ID,TM,DS,AV from archive(\'plot\',\'48s\') where TM between 1491946153 and 1491974953 and ID in (116307,116308,116269) order by TM';
// opPool.query(sql, function (error, col, com) {
//     console.log(error);
//     console.log(col);
//     console.log(com);
// });
// // console.log(opPool.systemTime().getTime());

// var sql = 'select ID,UD,GN,TN,AV,TM,DS,ED,RT from realtime where ID in ("1131000") and TM > 1481612633 limit 0,25';
// // // var sql = 'select id as id,GN as name from V_point  where GN like "%W3%" limit 0,10';
// // // var sql = 'select gn as GN,id as ID,tm as TM,ds as DS,av as AV from archive where TM between 1481612633 and 1481613233 and gn in (\'W3.UNIT01.POINT01\',\'W3.UNIT01.POINT02\')';
// // var pointInfo = opPool.syncQuery(sql);
// // console.log(pointInfo);


// var cols = [
//     ["ID", OPAPI.TYPE.INT32],
//     ["ED", OPAPI.TYPE.STRING]
// ];
// // // // var rows = new Array();
//
// var rows = [
//     [116304, 'this is test'], [116303, "this is for test"]
// ];
// // rows.push(row);
// opPool.update("Point", rows, cols, function (error, col, com) {
//     console.log(error);
//     console.log(col);
//     console.log(com);
// // });
// var cols = ['ID', 'UD', 'AN', 'FQ', 'ED', 'TV', 'BV', 'EU', 'DB', 'FM', 'PT', 'KT', 'EX', 'AP', 'LC', 'H4', 'H3', 'ZH', 'HL', 'LL', 'ZL', 'L3', 'L4', 'C1', 'C2', 'C3', 'C4', 'C5', 'C6', 'C7', 'C8'];
// //
// opPool.find('Point', 'ID', [116304, 116303], cols, function (error, rows, columns) {
//     console.log(error);
//     console.log(rows);
//     console.log(columns);
// });


// var cols = ["ID","TM","AV","DS"];
// var ids = [116455, 116431];
// opPool.find('Realtime', 'ID', ids, cols, function (error, rows, columns) {
//     console.log(error);
//     console.log(rows);
//     console.log(columns);
// });
// var ud = parseInt(0x23c88ea3d8c17e97,10)
// var sql = 'select RT,count(RT) as count  from Point  group by RT ';
// opPool.query(sql, function (error, rows, columns) {
//     logger.error(error);
//     logger.error(rows);
//     logger.error(columns);
//     // var ud = rows[0].UD;
//     // var buf = new Buffer(ud.toString());
//     // console.log(buf.toString('Hex'));
// });


// console.log(0==null);
// });
// var UUID = '/上海麦杰科技/POINT123123';
// var ud = opPool.makeUUID(UUID);
// console.log(ud);
// var sql = 'select ID,PN,UD,KR,HW,AN,TN,RT,ED,FQ,FM,TV,BV,EU,KZ,EX,PT,KT,AP,LC,H4,H3,ZH,HL,LL,ZL,L3,L4,C1,C2,C3,C4,C5,C6,C7,C8 from Point where UD in (0x1C54E599EBEA5D1E,0x1C547DEAEBEA65B1,0x5E806ACAB3828680,0x5E806AC9B3828681,0x1C54A5FDEBEA6112)';
// // // var UD = '0x'sum+ud;
// var sql = "select * from AgentInfo ";
// opPool.query(sql, function (error, rows, columns) {
//     // console.log(rows);
// });

// var data = opPool.agengInfo();
//
// var obj = new Object();
// var value = new Object();
// value.time = data.Time;
// value.agentCPU = data.CPU;
// value.agentMem = data.Memory;
// value.agentHD = data.UsedHardDisk / data.TotalHardDisk * 100;
// value.agentConn = data.ClientCount;
// value.agentFlow = data.magustekTrafficReceive + data.magustekTrafficSend;
// value.agentNetworkUp = data.NetUploadRate;
// value.agentNetworkDown = data.NetDownloadRate;
// obj.agent = value;
// for (var i in data) {
//     var index = i.indexOf('Group');
//     if (index > -1) {
//         var groups = obj.Group;
//         if (!groups) {
//             groups = new Object();
//             obj.Group = groups;
//         }
//         var groupInfo = i.split('.');
//         var group = groups['Group_' + groupInfo[1]];
//         if (!group) {
//             group = new Object();
//             groups['Group_' + groupInfo[1]] = group;
//         }
//         var isRDB = groupInfo[2];
//         if (isRDB != 'RDB') {
//             if (isRDB == 'GroupName' || isRDB == 'ConnectPoolMax' || isRDB == 'ConnectPoolMin' || isRDB == 'SurvivalSize' || isRDB == 'ReplicatorFile') {
//                 group[isRDB] = data[i];
//             }
//         } else {
//             var opGroup = group['OP_' + groupInfo[3]];
//             if (!opGroup) {
//                 opGroup = new Object();
//                 group['OP_' + groupInfo[3]] = opGroup;
//             }
//             var isPoint = groupInfo[4];
//             if (isPoint != 'W3') {
//                 if (isPoint == 'Host') {
//                     opGroup[isPoint] = data[i];
//                 }
//             } else {
//                 var filed = groupInfo[6];
//                 if (filed == 'LOAD' || filed == 'SESSION' || filed == 'UPTIME' || filed == 'DBMEM' || filed == 'VOLFREE' || filed == 'VOTOTAL' || filed == 'MEMFREE') {
//                     opGroup[filed] = data[i];
//                 }
//             }
//         }
//     } else {
//         continue;
//     }
// }
// console.log(obj.Group);

//  console.log('--------------------------');
// var ud = 0x7234567890123456;
// var buf = new Buffer(16);
// buf.writeInt32Be(ud.toString());
// console.log(buf.toString());
// console.log('--------------------------');

// console.log(ud);
// // var cols = ["ID", "GN", "TV", "BV", "ED", "EU", "RT"];

// // var date = new Date().getTime();
// // console.log(date/1000);


// // var obj = {};
// // console.log(obj);
// // var names = [110027];
// // opPool.remove('Point','ID',names,function(error, rows) {
// //     console.log(error);
// //     console.log(rows);
// // });

// var ids = [116267, 116268, 116269];
// var cols = ["ID", "GN", "PN", "ED", "FM", "EU", "RT", "TV", "BV"];
// // logger.debug('获取测点静态信息');
// opPool.find("Point", 'ID', ids, cols, function (error, rows, columns) {
//     logger.debug(error);
//     logger.debug(rows);
//     logger.debug(columns);
// });

// var UUID = -1453002720;
// var UD ='0x78CC877DA964F020';
// // // console.log(UUID.toString(16));
// var agentHandler = opPool.subscribe([116435, 116431]);
//  opPool.startSub(test_event_callback);
//
//
// var i = 0;
// function test_event_callback(data) {
//     console.log("----------------------------" + i);
//     i++;
//     if (i > 10) {
//         opPool.stopSub();
//     }
//     if (i == 5) {
//         var flag = opPool.unsubscribe(agentHandler, [1024, 1025]);
//         console.log(flag);
//     }
//     console.log(data);
// }
// setTimeout(function() {1024]);
//     var agentHandler1 = opPool.subscribe([
//     opPool.startSub(test_event_callback);
// }, 5000);

// var sourcePath = 'E:\\work\\magustek\\op-cloud\\trunk\\OPCloud4nodejs\\public\\userfile\\17\\resources\\se7en\\DA\\diagram.zip';
// var targetPath = 'E:\\work\\magustek\\op-cloud\\trunk\\OPCloud4nodejs\\public\\userfile\\17\\resources\\se7en\\DA';
// var unzip = new AdmZip(sourcePath);
// unzip.extractAllTo(targetPath, true);
// var arr = [0x74, 0x74, 0x20, 0x2d, 0x20, 0xb8, 0xb1, 0xb1, 0xbe, 0x2e, 0x7a, 0x78, 0x6d, 0x6c];
//
// str = iconv.decode(new Buffer(arr), 'GBK');
// console.log(str);

// var sql = 'select ID,UD,RT,PN,ED,EU,TV,BV from Point where UD in (0x5734652A55F23CB5,0x4F85AB883A17E488,0x4FC902443A1C56A4,0x150BE6C5B242AC13,0x6023A82488676D3D,0x759543DCDF06B4A9,0x6B98E4289AA5A3B5,0x5098186724E797F4,0x6BC440BD9AAA174E,0x6582A2D79AC878DF,0x49639A6ADB90BDF4,0x511471D191B398BE,0x430B41F4091958C9,0x2CCD5148807F18D4,0x472B7705D7150967,0x70403FD6C9A1EBC0,0x4AFEBD49B17DA493,0x4AB21485B18216AF,0x27F83112795D7614,0x27F83111795D7615,0x27F83091795D7697,0x27F83092795D7698,0x4A261E561BFF3298,0x0C776B39F5C9A9A1,0x529DF3D501BF4EF2,0x1B3935904DC00E08,0x01DEF0B61461D9B5,0x755FE4655D40FAC8,0x43229847E04A2734,0x4AAACC7AE0DC4FAC) and KR in (56,57,58,75,93,94)';
//
// opPool.query(sql, function (err, rows, columse) {
//     console.log(err);
//     console.log(rows);
//     console.log(columse);
// });

// console.log(path.normalize('E:/work/magustek/op-cloud/trunk/OPCloud4nodejs/public/userfile/17/resources/se7en/DA/example.zxml'));
// console.log(path.normalize('E:/work/magustek/op-cloud/trunk/OPCloud4nodejs/public/userfile/17/resources/se7en/../DC/DB/example.zxml'));

// var sql = '';
// console.log(sql.length);

// var keys = ['W3.TEST.AX', 'W3.TEST.DX', 'W3.TEST.I2'];
// var cols = ["ID", "GN", "PN", "ED", "FM", "EU", "RT", "TV", "BV"];
// opPool.find('Point', 'GN', keys, cols, function (error, rows, columns) {
//     logger.debug(error);
//     logger.debug(rows);
//     logger.debug(columns);
// });
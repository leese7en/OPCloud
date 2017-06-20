/**
 * Created by 啬en on 2016/7/11.
 */
var OPAPI = require('opapi');
var async = require("async");
var logger = require('log4js').getLogger('system');
var fs = require("fs");

// var dbConfig = JSON.parse(fs.readFileSync("./config.json"));

var dbConfig = null;
var IP = "192.168.2.64";
var PORT = 8902;
var USER = "magustek";
var PWD = "123456";
var TIME = 60;
// var IP = "192.168.2.64";
// var PORT = 8200;
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
//------------------- 测点
//插入单个
// var sql = 'insert into Point (GN,RT,ED,EU,KR,HW) values("W3.NODE.I2",2,"test","kg",1,1)';
// opPool.query(sql, function (err, rows, columns) {
//     console.log(err);
//     console.log(rows);
//     console.log(columns);
// });
//
// //插入多个
// var sql = 'insert into Point (GN,RT,ED,EU,KR,HW) values("W3.NODE.I2",2,"test","kg",1,1),("W3.NODE.I4",3,"test","kg",1,1),("W3.NODE.R8",4,"test","kg",1,1)';
// opPool.query(sql, function (err, rows, columns) {
//     console.log(err);
//     console.log(rows);
//     console.log(columns);
// });


// //更新 单个
// var sql = 'update Point set ED ="update",EU ="m",KR= 2,HW = 2 where GN ="W3.NODE.AX" ';
// opPool.query(sql, function (err, rows, columns) {
//     console.log(err);
//     console.log(rows);
//     console.log(columns);
// });
// //更新多个
// var sql = 'update Point set ED ="update",EU ="m",KR= 2,HW = 2 where ID in (116225,116226,116228) ';
// opPool.query(sql, function (err, rows, columns) {
//     console.log(err);
//     console.log(rows);
//     console.log(columns);
// });
// //删除单个
// var sql = 'delete from point where ID = 116224;'
// opPool.query(sql, function (err, rows, columns) {
//     console.log(err);
//     console.log(rows);
//     console.log(columns);
// });
// //删除多个
// var sql = 'delete from point where ID in (116225,116226,116228);';
// opPool.query(sql, function (err, rows, columns) {
//     console.log(err);
//     console.log(rows);
//     console.log(columns);
// });

//-------------------------实时

// //单个实时
// var time = new Date().getTime();
// var sql = 'insert into Realtime (GN,TM,AV,DS) values ("W3.NODE.I2",' + time / 1000 + ',100,10)';
// opPool.query(sql, function (err, rows, columns) {
//     console.log(err);
//     console.log(rows);
//     console.log(columns);
// });

//多个实时
// var time = new Date().getTime();
// var sql = 'insert into Realtime (GN,TM,AV,DS) values ("W3.NODE.I2",' + time / 1000 + ',105,10),("W3.NODE.I4",' + time / 1000 + ',-20,0)';
// opPool.query(sql, function (err, rows, columns) {
//     console.log(err);
//     console.log(rows);
//     console.log(columns);
// });

//--------------------------历史

//写单个历史
// var time = new Date().getTime();
// var sql = 'insert into Archive (GN,TM,AV,DS) values ("W3.NODE.I2",' + time / 1000 - 1000 + ',80,10)';
// opPool.query(sql, function (err, rows, columns) {
//     console.log(err);
//     console.log(rows);
//     console.log(columns);
// });


// //写多个历史
// var time = new Date().getTime();
// var sql = 'insert into Archive (GN,TM,AV,DS) values ("W3.NODE.I2",' + time / 1000 - 1000 + ',80,10),("W3.NODE.I4",' + time / 1000 - 1000 + ',-60,0)';
// opPool.query(sql, function (err, rows, columns) {
//     console.log(err);
//     console.log(rows);
//     console.log(columns);
// });

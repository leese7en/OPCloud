/**
 * Created by tp on 2016/7/11.
 */
var poolModule = require('generic-pool');
var OPAPI = require('opapi');
var async = require("async");

var fs = require("fs");


var dbConfig = JSON.parse(fs.readFileSync("./config.json"));

var IP = "127.0.0.1";
var PORT = 8200;
var USER = "sis";
var PWD = "openplant";


if (dbConfig) {
    if (dbConfig.IP) {
        IP = dbConfig.IP;
    }

    if (dbConfig.PORT) {
        PORT = dbConfig.PORT;
    }

    if (dbConfig.USER) {
        USER = dbConfig.USER;
    }

    if (dbConfig.PWD) {
        PWD = dbConfig.PWD;
    }

    console.log(dbConfig)
}


// 创建一个 openplant 连接池
var opPool = poolModule.Pool({
    name: 'openplant',
    //将建 一个 连接的 handler
    create: function (callback) {
        try {
            // var client = OPAPI.init(0xC00, "192.168.2.65", 8200, 60, "sis", "openplant");
            var client = OPAPI.init(0, IP, PORT, 60, USER, PWD);
            if (client != null) {
                callback(null, client);
            } else {
                console.log("conn openPlant is null");
            }
        } catch (e) {
            console.log("conn openPlant error");
            console.log(e);
        }
    },
    // 释放一个连接的 handler
    destroy: function (client) {
        OPAPI.close(client);
    },
    // 连接池中最大连接数量
    max: 500,
    // 连接池中最少连接数量
    min: 20,
    // 如果一个线程30秒钟内没有被使用过的话。那么就释放
    idleTimeoutMillis: 30 * 1000,
    // 如果 设置为 true  打印日志
    log: false
});


function keyCode(keys) {
    if ((keys instanceof Array) && keys.length > 0) {
        var type = typeof keys[0];
        if (type == "string") {
            return "GN"
        } else if (type == "number") {
            return "ID"
        }
    }
    return "";
}

//获取系统时间
function systemTime(core) {
    var data;
    try {
        opPool.acquire(function(err, client) {
            if (err) {
                opPool.release(client);
            } else {
                var rs = core(client)
                if (rs != null) {
                    opPool.release(client);
                    data = rs;
                }
            }
        });
    } catch (e) {
        throw e;
    }
    return data;
}


//异步查询模式
function asyncFunction(core, callback) {
    try {
        opPool.acquire(function (err, client) {
                if (err) {
                    console.log(err);
                    callback(err);
                } else {
                    var time = new Date().getTime();
                    var rs = core(client);
                    if (rs != null) {
                        if (rs.error == null || rs.error == 0) {
                            opPool.release(client);
                            callback(0, rs.rows, rs.columns);
                        } else {
                            opPool.destroy(client);
                            callback(rs.error, [], []);
                        }
                    } else {
                        opPool.destroy(client);
                        console.log("result is null");
                        throw "result is null";
                    }
                }
            }
        );
    } catch (e) {
        throw  e;
    }
}

//异步查询模式
opPool.find = function (tableName, keys, cols, callback) {
    return asyncFunction(function (client) {
        return OPAPI.find(client, tableName, keyCode(keys), keys, cols);
    }, callback);
}

//异步SQL查询模式
opPool.query = function (sql, callback) {
    return asyncFunction(function (client) {
        return OPAPI.query(client, sql);
    }, callback);
}

//异步update
opPool.update = function (tableName, keys, cols, callback) {
    return asyncFunction(function (client) {
        return OPAPI.update(client, tableName, keys, cols);
    }, callback);
}

//异步Remove
opPool.remove = function (tableName, keys, callback) {
    return asyncFunction(function (client) {
        return OPAPI.remove(client, tableName, keyCode(keys), keys);
    }, callback);
}


//同步操作模板框架
function syncFunction(core) {
    var data;
    try {
        async.waterfall([function (callback) {
            opPool.acquire(function (err, client) {
                    if (err) {
                        opPool.release(client);
                        callback(err);
                    } else {
                        var rs = core(client)
                        if (rs != null) {
                            if (rs.error == 0 || rs.error == null) {
                                opPool.release(client);
                                callback(0, rs.rows, rs.columns);
                            } else {
                                opPool.destroy(client);
                                callback(rs.error, [], []);
                            }
                        } else {
                            opPool.destroy(client);
                            console.log("result is null");
                            throw "result is null";
                        }
                    }
                }
            );
        }], function (error, rows, columns) {
            data = {error: error, rows: rows, columns: columns};
        });
    } catch (e) {
        throw  e;
    }
    return data;
}


//同步SQL查询模式
opPool.syncQuery = function (sql) {
    return syncFunction(function (client) {
        return OPAPI.query(client, sql);
    });
}

//同步find
opPool.syncFind = function (tableName, keys, cols) {
    return syncFunction(function (client) {
        return OPAPI.find(client, tableName, keyCode(keys), keys, cols);
    });
}

//同步update
opPool.syncUpdate = function (tableName, keys, cols) {
    return syncFunction(function (client) {
        return OPAPI.update(client, tableName, keys, cols);
    });
}

//同步Remove
opPool.syncRemove = function (tableName, keys) {
    return syncFunction(function (client) {
        return OPAPI.remove(client, tableName, keyCode(keys), keys);
    });
}
//获取系统时间
opPool.systemTime = function() {
    return systemTime(function(client) {
        return OPAPI.systemTime(client);
    });
}


module.exports = opPool;

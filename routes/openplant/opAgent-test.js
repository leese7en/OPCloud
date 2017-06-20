/**
 * Created by tp on 2016/7/11.
 */
var OPAPI = require('opapi');
var async = require("async");
var uuid = require('node-uuid');
var clientNumber = 0;
//异步查询模式
function asyncFunction(core, client, callback) {
    try {
        var rs = core(client.client);
        opPool.release(client);
        if (rs != null) {
            if (rs.error != 0) {
                callback(rs.error, null, null);
            } else {
                callback(0, rs.rows, rs.columns);
            }
        } else {
            console.log("result is null");
            throw "result is null";
        }
    } catch (e) {
        throw e;
    }
}


//同步操作模板框架
function syncFunction(core, client) {
    var data;
    try {
        async.waterfall([function(callback) {
                var rs = core(client.client)
                opPool.release(client);
                callback(rs.error, rs.rows, rs.columns);
            }],
            function(error, rows, columns) {
                data = { error: error, rows: rows, columns: columns };
            }
        );
    } catch (e) {
        throw e;
    }
    return data;
}

//获取系统时间
function systemTime(core, client) {
    var data;
    try {
        data = core(client.client)
        opPool.release(client);
    } catch (e) {
        throw e;
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
    this.find = function(tableName, keys, cols, callback) {
        return asyncFunction(function(client) {
            return OPAPI.find(client, tableName, keys, cols);
        }, this, callback);
    };
    //异步SQL查询模式
    this.query = function(sql, callback) {
        return asyncFunction(function(client) {
            return OPAPI.query(client, sql);
        }, this, callback);
    };

    //异步update
    this.update = function(tableName, keys, cols, callback) {
        return asyncFunction(function(client) {
            return OPAPI.update(client, tableName, keys, cols);
        }, this, callback);
    };

    //异步insert
    this.insert = function(tableName, keys, cols, callback) {
        return asyncFunction(function(client) {
            return OPAPI.insert(client, tableName, keys, cols);
        }, this, callback);
    };

    //异步Remove
    this.remove = function(tableName, keys, callback) {
        return asyncFunction(function(client) {
            return OPAPI.remove(client, tableName, keys);
        }, this, callback);
    };
    //同步SQL查询模式
    this.syncQuery = function(sql) {
        return syncFunction(function(client) {
            return OPAPI.query(client, sql);
        }, this);
    };

    //同步find
    this.syncFind = function(tableName, keys, cols) {
        return syncFunction(function(client) {
            return OPAPI.find(client, tableName, keys, cols);
        }, this);
    };

    //同步update
    this.syncUpdate = function(tableName, keys, cols) {
        return syncFunction(function(client) {
            return OPAPI.update(client, tableName, keys, cols);
        }, this);
    };

    //同步INSERT
    this.syncInsert = function(tableName, keys, cols) {
        return syncFunction(function(client) {
            return OPAPI.insert(client, tableName, keys, cols);
        }, this);
    };

    //同步Remove
    this.syncRemove = function(tableName, keys) {
        return syncFunction(function(client) {
            return OPAPI.remove(client, tableName, keys);
        }, this);
    };
    //获取系统时间
    this.systemTime = function() {
        return systemTime(function(client) {
            return OPAPI.systemTime(client)
        }, this);
    };
};

/**
 * 数据库连接池
 * @type {{name: string, ip: string, port: number, time: number, username: string, password: string, max: number, min: number, idleTimeoutMillis: number, clientArray: Array, init: opPool.init, getConnect: opPool.getConnect, getConn: opPool.getConn, release: opPool.release, destroy: opPool.destroy}}
 */
var opPool = {
    name: 'openplant',
    // ip: '192.168.2.65',
    ip: '192.168.3.151',
    port: 8902,
    time: 60,
    username: 'magustek',
    password: '123456',
    max: 50,
    min: 2,
    maxIdle: 5,
    idleTimeoutMillis: 30 * 1000,
    clientArray: new Array(),
    /**
     * 数据库连接初始化
     */
    init: function() {
        this.min = this.min < 0 ? 2 : this.min;
        this.maxIdle = this.maxIdle < this.min ? this.min : this.maxIdle;
        for (var i = 0; i < this.min; i++) {
            var c = this.getConn();
            c.inuse = 0;
            this.clientArray.push(c);
        }
        clientNumber++;
        // console.log('clientNumber:' + clientNumber);
    },
    /**
     * 获取连接信息
     * @returns {*}
     */
    getConnect: function() {
        /**
         * 当前池中是否有闲置的连接
         * @type {number}
         */
        var i = 0;
        var length = this.clientArray.length;
        for (i = 0; i < length; i++) {
            var c = this.clientArray[i];
            var rs = OPAPI.systemTime(c.client);
            if (rs) {
                if (c.client) {
                    this.destroy(c.client);
                }
                c = this.getConn();
                c.inuse = 1;
                return c;
            }
            if (c && c.inuse == 0) {
                c.inuse = 1;
                return c;
            }
        }
        /**
         * 没有闲置的连接，并且没有达到最大连接个数
         */
        if (i < this.max) {
            var c = this.getConn();
            c.inuse = 1;
            this.clientArray.push(c);
            return c;
        }
        /**
         * 没有连接空间了
         */
        else {

        }

        this.checkConn();
    },
    /**
     * 获取新的连接
     */
    getConn: function() {
        var client = OPAPI.init(0xC00, this.ip, this.port, this.time, this.username, this.password);
        var c = new Client();
        c.client = client;
        c.inuse = 0;
        return c;
    },
    /**
     * 检查连接池信息
     */
    checkConn: function() {
        /**
         * 当前连接个数是否达到最小的空闲个数
         */
        if (this.clientArray.length < this.maxIdle) {
            return;
        }
        /**
         * 定义临时连接集合
         * @type {Array}
         */
        var clients = new Array();
        var t = 0;
        for (var i in this.clientArray) {
            var c = this.clientArray[i];
            /**
             * 当前连接是否在使用中
             */
            if (c && c.inuse == 1) {
                clients.push(c);
            }
            /**
             * 当前连接空闲 并且没有达到最大空闲个数
             */
            else if (c && c.inuse == 0 && t < this.maxIdle) {
                clients.push(c);
                t++;
            }
            /**
             * 当前不在使用中，并且已经达到最大空闲个数
             */
            else {
                if (c) {
                    this.destroy(c.client);
                }
            }
        }
        this.clientArray = clients;
    },
    /**
     * 释放当前连接
     * @param client
     */
    release: function(client) {
        client.inuse = 0;
    },
    /**
     * 销毁当前连接
     * @param client
     */
    destroy: function(client) {
        OPAPI.close(client);
    }
}


//异步查询模式
opPool.find = function(tableName, keys, cols, callback) {
    return opPool.getConnect().find(tableName, keys, cols, callback);
}

//异步SQL查询模式
opPool.query = function(sql, callback) {
    return opPool.getConnect().query(sql, callback);
}

//异步update
opPool.update = function(tableName, keys, cols, callback) {
    return opPool.getConnect().update(tableName, keys, cols, callback);
}

//异步insert
opPool.insert = function(tableName, keys, cols, callback) {
    return opPool.getConnect().insert(tableName, keys, cols, callback);
}

//异步Remove
opPool.remove = function(tableName, keys, callback) {
    return opPool.getConnect().remove(tableName, keys, callback);
}


//同步SQL查询模式
opPool.syncQuery = function(sql) {
    return opPool.getConnect().syncQuery(sql);
}

//同步find
opPool.syncFind = function(tableName, keys, cols) {
    return opPool.getConnect().syncFind(tableName, keys, cols);
}

//同步update
opPool.syncUpdate = function(tableName, keys, cols) {
    return opPool.getConnect().syncUpdate(tableName, keys, cols);
}

//同步insert
opPool.syncInsert = function(tableName, keys, cols) {
        return opPool.getConnect().syncInsert(tableName, keys, cols);
    }
    //同步Remove
opPool.syncRemove = function(tableName, keys) {
    return opPool.getConnect().find(tableName, keys);
}

//获取系统时间
opPool.systemTime = function() {
    return opPool.getConnect().systemTime();

}

opPool.init();


function selectTest(sql){
     opPool.query(sql,function(err,rows,columns){
        console.log('-------------select test begin--------------');
        console.log(err);
        console.log(rows);
        console.log(columns);
        console.log('-------------select test end--------------');
    });
}   

function insertTest(sql){
    opPool.insert(sql,function(err,rows,columns){

    });
}   


function updateTest(sql){
    opPool.update(sql,function(err,rows,columns){

    });
}   

function removeTest(sql){
    opPool.remove(sql,function(err,rows,columns){

    });
}   

function test(){
    var selectSQL = 'select * from node;';
    selectTest(selectSQL);
}

var sql = 'select *  from realtime limit 0,5';
var pointInfo = opPool.syncQuery(sql);
console.log(pointInfo);
setTimeout(function(){
    var pointInfo1 = opPool.syncQuery(sql);
    console.log(pointInfo1);
}, 5000);


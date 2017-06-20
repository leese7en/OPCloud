/**
 * Created by tp on 2016/7/1.
 */
var mysql = require("mysql");
var fs = require("fs");

var dbConfig = JSON.parse(fs.readFileSync("./config.json"));

// var dbConfig = null;
var IP = "127.0.0.1";
var PORT = 3306;
var USER = "root";
var PWD = "725009";

if (dbConfig && dbConfig.mySQL) {
    var dbCon = dbConfig.mySQL;
    if (dbCon.IP) {
        IP = dbCon.IP;
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
var pool = mysql.createPool({
    host: IP,
    user: USER,
    password: PWD,
    database: 'opcloud',
    port: PORT
});

var mysqlPool = {
    query: function(sql, callback) {
        pool.getConnection(function(err, conn) {
            if (err) {
                console.error("query :" + sql + " ERROR");
                console.error(err);
                callback(err, null, null);
            } else {
                conn.query(sql, function(qerr, result, fields) {
                    //释放连接
                    conn.release();
                    //事件驱动回调
                    try {
                        callback(qerr, result, fields);
                    } catch (e) {
                        console.log(e)
                    }
                });
            }
        });
    },
    transaction: function(callback) {
        pool.getConnection(function(err, connection) {
            if (err) {
                console.log("getConnection ERROR :" + err);
                callback(err, null)
            } else {
                connection.beginTransaction(function(err) {
                    if (err) {
                        callback(err, null)
                    } else {
                        try {
                            callback(null, connection);
                            //释放连接
                            connection.release();
                            connection.commit(function(err) {
                                if (err) {
                                    return connection.rollback(function() {
                                        throw err;
                                    });
                                }
                                console.log('success!');
                            });
                        } catch (err) {
                            if (err) {
                                return connection.rollback(function() {
                                    throw err;
                                });
                            }
                        }
                    }
                });
            }
        });
    }
}
module.exports = mysqlPool;

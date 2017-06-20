/**
 * Created by tp on 2016/7/25.
 */
var mysqlPool = require("../../mysql/mysqlQuery.js");
exports.actionUtils = function () {
    this.query = mysqlPool.query;
    this.transaction = mysqlPool.transaction;
    this.pageList = function (req, res, sql) {
        var offset = +req.query.offset || +req.query.pagenum || +req.body.offset ||0,
            limit = +req.query.limit || +req.query.pagesize || +req.body.limit||20,
            result = {
                total: +req.query.total || 0,
                rows: []
            };

        function error() {
            var err = new Error('Not Found');
            err.status = 404;
            err.message = "SQL 错误！SQL:" + sql;
            return res.redirect("/error");
        }
        query("SELECT COUNT(*) as SIZE FROM ( " + sql + ") tmp_count_t", function (err, rows, columns) {
            if (err) {
                return error();
            }
            var size = rows[ 0 ].SIZE;
            sql += " limit " + offset + "," + limit;
            query(sql, function (err, rows, columns) {
                if (err == null) {
                    result.total = size;
                    result.rows = rows;
                    res.json(result);

                } else {
                    return error();
                }
            });
        });
    }

    this.list = function (req, res, sql) {
        var result = {
            total: +req.query.total || 0,
            rows: []
        };
        query("SELECT COUNT(*) as SIZE FROM ( " + sql + ") tmp_count_t", function (err, rows, columns) {
            var size = rows[ 0 ].SIZE;
            query(sql, function (err, rows, columns) {
                if (err == null) {
                    result.total = size;
                    result.rows = rows;
                    try {
                        res.set('Content-Type', 'application/json');
                        res.json(result);
                    } catch (e) {
                        console.log(e)
                    }

                } else {
                    console.log(err)
                }
            });
        });
    }
    return this;
};
module.exports = exports.actionUtils;
var actionUtil = require("../../framework/action/actionUtils")();
var transaction = actionUtil.transaction;
var async = require("async");
var uuidUtil = require('node-uuid');
var xlsx = require("node-xlsx");
var formidable = require('formidable');
var fs = require('fs');  //node.js核心的文件处理模块
var querystring = require('querystring');
var query = actionUtil.query;
var moduleName = "domain";
var sql = require('sql-query'),
    sqlQuery = sql.Query();
var fields = [ {
    field: 'state',
    checkbox: true
}, {
    field: 'DB_ID',
    title: 'UUID',
    align: 'center',
    valign: 'middle',
    sortable: true,
}, {
    field: 'TAG_NAME',
    title: '点名',
    align: 'center',
    valign: 'middle',
    sortable: true,
}, {
    field: 'UNIT',
    title: '单位',
    align: 'center',
    valign: 'top',
    sortable: true,
}, {
    field: 'TYPE_NAME',
    title: '测点类型',
    align: 'center',
    valign: 'top',
    sortable: true
}, {
    field: 'DESCRIPTION',
    title: '描述',
    align: 'center',
    valign: 'top',
    sortable: true
}, {
    field: 'COMPRESS_TYPE',
    title: '压缩类型',
    align: 'center',
    valign: 'top',
    formatter: 'format',
    sortable: true
}, {
    field: 'AV',
    title: '实时值',
    align: 'center',
    valign: 'top',
    sortable: true
}, {
    field: 'CT',
    title: '最后更新时间',
    align: 'center',
    valign: 'top',
    sortable: true
},
    {
        field: 'AS',
        title: '质量',
        align: 'center',
        valign: 'top',
        sortable: true
    }, {
        field: 'operate',
        title: '操作',
        align: 'center',
        valign: 'middle',
        formatter: 'operateFormatter',
        events: 'operateEvents'
    } ];
function URIUtils(URI, Name) {
    return (URI == "/" ? "" : URI ) + "/" + Name;
};
var domain_manage = {
    //创建对象
    createAction: function (req, res, action) {
        var NAME = req.body.NAME;
        var DESCRIPTION = req.body.DESCRIPTION;
        var PID = req.body.PID;
        if (PID == "") {
            PID = null;
        }
        var data = {
            NAME: NAME,
            DESCRIPTION: DESCRIPTION,
            PID: PID,
        };
        if (NAME != undefined && NAME != null && NAME != "") {
            var URL = "";
            if (PID != null) {
                var sql = sqlQuery.select().from('sys_mtree').select("ID", "URI").where({ID: PID}).limit(1).build();
                query(sql, function (err, result) {

                    data.URI = URIUtils(result[ 0 ].URI, NAME)
                    var sql = sqlQuery.insert().into('sys_mtree')
                        .set(data)
                        .build();
                    query(sql, function (err, result) {
                        var insertId = result.insertId;//获取自动生成的id
                        var message = {};
                        if (err == null && result) {
                            message.insertId = result.insertId;
                            message.msg = 'success';
                        } else {
                            message.insertId = -1;
                            message.msg = 'fail';
                        }
                        res.write(JSON.stringify(message));
                        res.end();

                    });
                })
            }
        }
        else {
            return res.redirect("/");
        }
    },
    //修改数据库表
    updateAction: function (req, res, action) {
    },
    renameTreeAction: function (req, res, action) {
        var id = req.body.id;
        var newName = req.body.newName;
        if (id && newName) {
            var sqlUpdate = sqlQuery.update()
            var sql = sqlUpdate
                .into('sys_mtree')
                .set({NAME: newName}).where({ID: id})
                .build();
            query(sql, function (err, result) {
                var message = {};
                if (err == null && result) {
                    message.msg = 'success';
                } else {
                    message.msg = 'fail';
                }
                res.write(JSON.stringify(message));
                res.end();

            });
        } else {
            res.write(JSON.stringify({msg: "fail"}));
            res.end();
        }
    },
    copyTreeAction: function (req, res, action) {
        var sourceID = req.body.sourceID;
        var newName = req.body.newName;
        var targetID = req.body.targetID;
        var pasteType = req.body.pasteType;
        if (pasteType == "copy") {
            try {
                transaction(function (err, connection) {
                    if (err) {
                        console.error("transaction ERROR" + err);
                    } else {
                        var sql = "SELECT * FROM sys_mtree c " +
                            " WHERE c.URI LIKE (SELECT CONCAT(uri,'%') FROM sys_mtree c WHERE c.ID = " + sourceID + ") " +
                            " order by URI";
                        connection.query(sql, function (err, result) {
                            var rows = result;
                            var message = {};
                            if (err == null && rows && rows.length > 0) {
                                var sourceURI = rows[ 0 ].URI;
                                var targetSQL = "SELECT URI FROM sys_mtree c WHERE ID = " + targetID;
                                var treeIDMap = new Object();
                                connection.query(targetSQL, function (err, result) {
                                    var URI = result[ 0 ].URI;
                                    async.eachSeries(rows, function (row, callback) {
                                        var treeCatch = treeIDMap[ row.PID ];
                                        if (row.ID == sourceID) {
                                            row.PID = targetID;
                                            row.URI = URIUtils(URI, ((newName) ? newName : row.NAME));
                                        } else if (treeCatch) {
                                            var treeCatch = treeIDMap[ row.PID ];
                                            row.PID = treeCatch.ID;
                                            row.URI = URIUtils(treeCatch.URI, row.NAME);
                                        } else {
                                            row.PID = targetID;
                                            row.URI = URIUtils(URI, row.Name);
                                        }
                                        var id = row.ID;
                                        //采用自增ID
                                        delete row.ID;
                                        var sql = sqlQuery.insert().into('sys_mtree')
                                            .set(row)
                                            .build();
                                        connection.query(sql, function (err, insertResult) {
                                            if (err) {
                                                callback(err, treeIDMap)
                                            } else {
                                                treeIDMap[ id ] = {
                                                    ID: insertResult.insertId,
                                                    URI: row.URI
                                                }
                                                callback(err, treeIDMap)
                                            }
                                        });
                                    }, function (err) {
                                        if (err) {
                                            throw  err
                                        }
                                    });
                                });
                                message.msg = 'success';
                            } else {
                                console.error(err)
                                message.msg = 'fail';
                            }
                            res.write(JSON.stringify(message));
                            res.end();

                        });
                    }
                })
            } catch (e) {
                console.error(e)
                return;
            }
        } else if (pasteType == "cut") {
            var message = {};
            try {
                transaction(function (err, connection) {
                    if (err) {
                        console.error("transaction ERROR" + err);
                    } else {
                        async.waterfall([
                            function (callback) {
                                var sql = "SELECT URI FROM sys_mtree  WHERE ID IN (SELECT pid FROM sys_mtree  WHERE ID = " + sourceID + ")";
                                connection.query(sql, function (err, result) {
                                    if (result.length > 0) {
                                        callback(null, result[ 0 ].URI);
                                    }
                                });
                            },
                            function (sourceURI, callback) {
                                var sql = sqlQuery.select().from('sys_mtree').select("ID", "URI").where({ID: targetID}).limit(1).build();
                                connection.query(sql, function (err, result) {
                                    if (result.length > 0) {
                                        callback(null, sourceURI, result[ 0 ].URI);
                                    }
                                });
                            },
                            function (sourceURI, targetURI, callback) {
                                var sql = "SELECT ID FROM sys_mtree WHERE URI LIKE (SELECT CONCAT(URI,'%') FROM sys_mtree  WHERE ID = " + sourceID + ")";
                                connection.query(sql, [ sourceURI, targetURI ], function (err, rows) {
                                    var ids = new Array();
                                    rows.forEach(function (row) {
                                        ids.push(row.ID);
                                    })
                                    callback(null, sourceURI, targetURI, ids);
                                });
                            },
                            function (sourceURI, targetURI, ids, callback) {
                                var sql = "UPDATE SYS_MTREE SET URI=REPLACE(URI,?,?) WHERE ID in (?)";
                                connection.query(sql, [ sourceURI, targetURI, ids ], function (err, result) {
                                    if (err) {
                                        console.error(err)
                                        callback(err);
                                    } else {
                                        callback(null);
                                    }
                                });
                            },
                            function (callback) {
                                var sql = sqlQuery.update()
                                    .into('sys_mtree')
                                    .set({PID: targetID}).where({ID: sourceID})
                                    .build();

                                connection.query(sql, function (err, result) {
                                    if (err == null) {
                                        message.msg = 'success';
                                    } else {
                                        message.msg = 'fail';
                                    }
                                    callback(null, result);
                                });
                            }
                        ], function (err) {
                            if (err) {
                                console.error(err)
                                message.msg = 'fail';
                            }
                            res.write(JSON.stringify(message));
                            res.end();
                        })
                    }
                })
            } catch (e) {
                console.error(e)
                message.msg = 'fail';
                res.write(JSON.stringify(message));
                res.end();
                return;
            }
        }
    },
    _refactorMtreeURI: function () {

    },
    saveTreeAction: function (req, res, action) {
        var rows = req.body.rows;
        rows = JSON.parse(rows);
        var message = {};
        try {
            transaction(function (err, connection) {
                if (err) {
                    console.error("transaction ERROR" + err);
                } else {
                    var URIcache = new Object();

                    function buildSQL(row, PID, URI) {
                        var sqlUpdate = sqlQuery.update()
                        var sql;
                        if (URI) {
                            sql = sqlUpdate
                                .into('sys_mtree')
                                .set({PID: PID, URI: URI, LAYER: row.level}).where({ID: row.id, NAME: row.label})
                                .build();

                        } else {
                            sql = sqlUpdate
                                .into('sys_mtree')
                                .set({PID: PID, LAYER: row.level}).where({ID: row.id, NAME: row.label})
                                .build();

                        }
                        return sql;
                    }
                    rows.forEach(function (row) {
                        var PID = row.parentId && row.parentId > 0 ? row.parentId : null;
                        //TODO URI重新生成
                        var sql;
                        if (PID == null) {
                            URIcache[ row.id ] = "/";
                            sql = buildSQL(row, PID, URIcache[ row.id ]);
                        } else if (URIcache[ PID ]) {
                            URIcache[ row.id ] = URIUtils(URIcache[ PID ], row.label);
                            sql = buildSQL(row, PID, URIcache[ row.id ]);
                        }
                        try {
                            connection.query({sql: sql, timeout: 1000 * 5}, function (err, result) {
                                if (err) {
                                    if (err.code === 'PROTOCOL_SEQUENCE_TIMEOUT') {
                                        throw new Error('执行语句超时! SQL:' + sql);
                                    } else {
                                        console.error('执行语句错误! SQL:' + sql);
                                        console.error(err)
                                    }
                                }
                                if (err) {
                                    throw err;
                                }
                            });
                        } catch (err) {
                            throw err;
                        }
                    })
                    message.msg = 'success';
                    res.write(JSON.stringify(message));
                    res.end();
                }
            })
        } catch (e) {
            console.error(e)
            message.msg = 'fail';
            res.write(JSON.stringify(message));
            res.end();
            return;
        }
    },
//删除数据库记录
    deleteAction: function (req, res, action) {
        var message = {};
        var id = req.body.ID;
        if (id != undefined && id != null && id != "") {
            var sql = "DELETE  FROM sys_mtree  WHERE id = " + id
            query(sql, function (err, result) {
                if (err == null) {
                    message.msg = 'success';
                } else {
                    message.msg = 'fail';
                }
                res.write(JSON.stringify(message));
                res.end();
            });
        } else {
            message.msg = 'fail';
            res.write(JSON.stringify(message));
            res.end();
        }
    }
    ,
//批量数据库操作
    batchDeleteAction: function (req, res, action) {
    }
    ,
//下载文件
    downloadAction: function (req, res, action) {
    }
    ,
//后端验证
    validatorAction: function (req, res, action) {
    }
    ,
//管理页面
    MTreeManageAction: function (req, res, action) {
        var method = req.params.method;
        var list = {
            pageName: "测点管理",
            treeDataURL: "/" + moduleName + "/Mtree/MtreeJson",
            key: "ID",
            columns: fields,
        }
        res.render(moduleName + "/Mtree/" + action, list);
    },
    MtreeJson: function (req, res) {
        var id = (req.body.id);
        var pid = "IS NULL"
        if (id) {
            pid = "=" + id;
        } else {
            pid = "IS NULL"
        }
        var sql = " SELECT tree.ID as id , tree.PID AS value, tree.PID as parentid ,CASE WHEN tree.PID " + pid + " THEN tree.NAME ELSE 'Loading...' END AS NAME," +
            "  TYPE_ID,tree_type.TYPE_NAME, LINK_ID, URI,  LAYER, CREATE_DATE, ZORDER, tree.DESCRIPTION, tree.IS_SYSTEM, IS_LEAF, IS_DELETED FROM sys_mtree  tree " +
            "  LEFT JOIN sys_tree_type tree_type ON tree_type.ID = tree.TYPE_ID " +
            "  WHERE (tree.PID " + pid + " OR tree.ID IN ( SELECT MAX(ID) FROM sys_mtree WHERE PID IN (SELECT ID FROM sys_mtree  WHERE PID " + pid + ") GROUP BY PID  )) "
        query(sql, function (err, rows, columns) {
            if (err == null) {
                res.json(rows);
            } else {
                console.error("ERROR SQL :" + sql)
                console.error(err)
            }
        });
    }
    ,
    pintList: function (req, res) {
        var search = req.query.search|| +req.body.search,
            offset = +req.query.offset || +req.query.pagenum || +req.body.offset || +req.body.pagenum || 0,
            limit = +req.query.limit || +req.query.pagesize || +req.body.limit || +req.body.pagesize || 25,
            result = {
                total: +req.query.total || 0,
                rows: []
            };
        var treeID = req.body.treeID;
        if(treeID ==""||treeID ==undefined){
            treeID=1;
        }
            var sql = 'select * from sys_point where id in(select tag_id from sys_mtree_tags where mtree_id in(' +
                'SELECT ID FROM sys_mtree WHERE URI LIKE (SELECT CONCAT(URI,"%") FROM sys_mtree  WHERE ID = '+treeID+')))';
            query(sql, function (err, rows, columns) {
                result.total = rows.length;
                if (err == null) {
                    query(sql+" limit "+offset+","+limit, function (err, rows, columns){
                        if(err == null){
                            result.rows = rows;
                            res.json(result);
                        }
                    });
                } else {
                    console.error("ERROR SQL :" + sql)
                    console.error(err)
                }
            });
    },
    addPoint:function (req, res,action){
        var name = req.body.name;
        var type = req.body.type;
        var unit = req.body.unit;
        var desc = req.body.desc;
        var mtreeId =req.body.mtreeId;
        var sqlPoint = "insert into sys_point (TAG_NAME,COMPRESS_TYPE,UNIT,DESCRIPTION) " +
                "values ('" + name + "','"+type+"','" + unit + "','" + desc +  "')";
        var message = {};
            query(sqlPoint, function (qerr, result) {
                //TODO 获取uuid
                //var uuid = uuidUtil.v4();
                var uuid = "1024";
                //TODO 获取uri
                var uri = "";
                var tagId = result.insertId;
                //TODO 获取gId
                var gId = "11";
                var sqlTag = "insert into sys_mtree_tags(UUID,URI,TAG_ID,MTREE_ID,G_ID) " +
                    "values('" + uuid + "','"+uri+"','" + tagId + "','" + mtreeId + "','" + gId + "')";
                    query(sqlTag, function (qerr, result) {
                        if(result != null && result != undefined){
                            message.msg = 'success';
                        }else{
                            message.msg = 'fail';
                        }
                        res.write(JSON.stringify(message));
                        res.end();
                    });
            });
    },
    editPoint:function(req, res,action){
        var id = req.body.id;
        var name = req.body.name;
        var type = req.body.type;
        var unit = req.body.unit;
        var desc = req.body.desc;
        if (id != undefined && id != null && id != "") {
            var sql = "update sys_point set TAG_NAME='"+name+"',COMPRESS_TYPE='"+type+"',UNIT='"+unit+"',DESCRIPTION='"+desc+
                "'  where ID="+id;
            query(sql, function (qerr, result) {
                var message = {};
                if (result != undefined) {
                    message.msg = 'success';
                } else {
                    message.msg = 'fail';
                }
                res.write(JSON.stringify(message));
                res.end();
            });
        } else {
            return res.redirect("/");
        }
    },
    removePoint:function (req, res, action) {
            var id = req.body.id;
            if (id != undefined && id != null && id != "") {
                var sql = "delete from sys_point where ID = " + id;
                query(sql, function (qerr, result) {
                    var message = {};
                    if (result != undefined && result != null) {
                        message.msg = 'success';
                    } else {
                        message.msg = 'fail';
                    }
                    res.write(JSON.stringify(message));
                    res.end();
                });
            } else {
                return res.redirect("/");
            }
    },
    batchRemove_point:function (req, res, action) {
        var idStr = req.body.ids;
        var ids = new Array();
        var message = {};
         ids = idStr.split(',');
        async.waterfall([
            function(callback){
                for(var i=0;i<ids.length;i++){
                    if((i==ids.length-1)){
                        message.msg = 'success';
                        callback(null);
                    }
                    var id = ids[i];
                    if (id != undefined && id != null && id != "") {
                        var sql = "delete from sys_point where ID = " + id;
                        query(sql, function (qerr, result) {
                            if (result != undefined && result != null) {
                                message.msg = 'success';
                            } else {
                                message.msg = 'fail';
                                callback(null);
                                return;
                            }
                        });
                    }
                }
            },
            function(){
                res.write(JSON.stringify(message));
                res.end();
            }
        ]);
    },
    importFile:function (req, res, action) {
            var mtreeId = req.body.id;
            var form = new formidable.IncomingForm();   //创建上传表单
            form.encoding = 'utf-8';        //设置编辑
            form.uploadDir = 'public/upload/';     //设置上传目录
            form.keepExtensions = true;     //保留后缀
            form.maxFieldsSize = 2 * 1024 * 1024;   //文件大小
            form.parse(req, function(err, fields, files) {
                if (err) {
                    console.log(err);
                }
                var filename = files.resource.name;
                var mtreeId = fields.mtreeId;
                // 对文件名进行处理，以应对上传同名文件的情况
                var nameArray = filename.split('.');
                var type = nameArray[nameArray.length-1];
                var name = '';
                for(var i=0; i<nameArray.length-1; i++){
                    name = name + nameArray[i];
                }
                var rand = Math.random()*100 + 900;
                var num = parseInt(rand, 10);

                var avatarName = name + num +  '.' + type;
                console.log("avatarName:"+avatarName);
                var newPath = form.uploadDir + avatarName ;
                console.log("newPath:"+newPath);
                fs.renameSync(files.resource.path, newPath);  //重命名
                var data = xlsx.parse("./"+newPath);
                console.log(JSON.stringify(data));
                /*
                 *TODO   1、解析文件里的数据，加一层过滤，不满足条件直接  return
                 */
                var sheetNum = data.length;
                var message = {};
                /*
                 *TODO   解析json到对应数据库表里的字段
                 */
                async.waterfall([
                    function(callback){
                        console.log("sheetNum:"+sheetNum);
                        for(var i=0;i<sheetNum;i++){      //sheet页
                                for(var j=1;j<data[i].data.length;j++){
                                    var dataNum = data[i].data.length;
                                    console.log("i:"+i+"j:"+j+"sheetNum:"+sheetNum+"dataNum:"+dataNum);
                                    if((i==sheetNum-1) && j==(dataNum-1)){
                                        message.msg = 'success';
                                        callback(null);
                                    }
                                    if(data[i].data != {} && data[i].data != null && data[i].data != "" && data[i].data != undefined){
                                    var name = data[i].data[j][0];
                                    var type = data[i].data[j][1];
                                    var unit = data[i].data[j][2];
                                    var desc = data[i].data[j][3];
                                    var sql = "insert into sys_point (TAG_NAME,COMPRESS_TYPE,UNIT,DESCRIPTION) " +
                                        "values ('" + name + "','"+type+"','" + unit + "','" + desc +  "')";
                                    console.log(sql);
                                        /*
                                         *TODO   1、值都是给定的，需要处理   2、代码优化
                                         */
                                    query(sql, function (qerr, result) {
                                        if (result != undefined) {
                                            //TODO 获取uuid
                                            //var uuid = uuidUtil.v4();
                                            var uuid = "1024";
                                            //TODO 获取uri
                                            var uri = "";
                                            var tagId = result.insertId;
                                            //TODO 获取gId
                                            var gId = "11";
                                            var sql = "insert into sys_mtree_tags(UUID,URI,TAG_ID,MTREE_ID,G_ID) " +
                                                "values('" + uuid + "','"+uri+"','" + tagId + "','" + mtreeId + "','" + gId + "')";
                                            query(sql, function (qerr, result) {
                                            });
                                            message.msg = 'success';
                                        } else {
                                            message.msg = 'fail';
                                            callback(null);
                                            return;
                                        }
                                    });
                                }
                            }
                        }
                    },
                    function(){
                        console.log(message.msg);
                        res.write(JSON.stringify(message));
                        res.end();
                    }
                ])
            });
}}
/**
 * point表插入
 * @param object
 */
function insertPoint(object){
    var sql = "insert into sys_point (TAG_NAME,COMPRESS_TYPE,UNIT,DESCRIPTION) " +
        "values ('" + object.name + "','"+object.type+"','" + object.unit + "','" + object.desc +  "')";
    console.log(sql);
    query(sql, function (qerr, result) {
        console.log("result:"+result);
        if (result != undefined) {
           return true;
        } else {
            return false;
        }
    });
}
module.exports = domain_manage;
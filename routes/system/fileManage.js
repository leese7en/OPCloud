var actionUtil = require("../framework/action/actionUtils")();
var Utils = require('../utils/tools/utils');
var query = actionUtil.query;
var async = require("async");
var GlobalAgent = require('../message/GlobalAgent');
var formidable = require('formidable');
var configConst = require('../utils/tools/configConst');
var fileUtils = require("../utils/tools/fileUtils");

var fs = require('fs');
var AdmZip = require('adm-zip');
var uuid = require('node-uuid');
var sql = require('sql-query'),
    sqlQuery = sql.Query();
var log4js = require('log4js');
var logger = log4js.getLogger('system');
var message = {
    flag: 0,
    message: '成功',
    data: null
};

var fileManage = {
    /*获取文件类型*/
    getFileType: function (req, res, action) {
        var sql = 'select id as id,name as name from sys_file_type';
        logger.debug('查询文件类型信息：' + sql);
        query(sql, function (err, rows, columns) {
            if (err) {
                logger.error('查询文件类型信息失败：' + err);
                message.flag = -1;
                message.message = "获取数据失败";
                res.json(message);
                return;
            } else {
                message.flag = 0;
                message.data = rows;
                res.json(message);
                return;
            }
        });
    },
    /*模糊查询资源信息*/
    blurryFile: function (req, res, action) {
        var companyId = req.session.user.ENTERPRISE_ID;
        var offset = +req.query.offset || +req.query.pagenum || 0;
        var limit = +req.query.limit || +req.query.pagesize || 20;
        var result = {
            total: +req.query.total || 0,
            rows: []
        };
        var fileName = req.body.fileName;
        var fileType = req.body.fileType;
        async.waterfall(
            [
                function (callback) {
                    var sql = 'select count(f.ID) as count from sys_file f left join sys_file_type ft on f.file_type = ft.id where f.is_deleted = 0 and f.name like "%' + fileName + '%" ';
                    if (companyId) {
                        sql += '  and company_id = ' + companyId;
                    }
                    if (fileType && fileType != '-1') {
                        sql += ' and f.file_type = ' + fileType;
                    }
                    logger.debug('获取滿足条件文件总个数sql：' + sql);
                    query(sql, function (err, rows) {
                        if (err) {
                            logger.error('获取文件总个数错误：' + err);
                            result.total = 0;
                            res.json(result);
                            return;
                        }
                        var count = rows[0].count;
                        if (count == 0) {
                            result.total = 0;
                            res.json(result);
                            return;
                        } else {
                            callback(null, count);
                        }
                    });
                },
                function (count, callback) {
                    var sql = 'select f.id as id,f.name as name ,f.path as path ,ft.ID as fileTypeId,ft.name as fileType,f.jarIds as jarIds,f.create_date as createDate from sys_file f left join sys_file_type ft on f.file_type = ft.id where  f.is_deleted = 0 and f.name like "%' + fileName + '%"';
                    if (companyId) {
                        sql += '  and company_id = ' + companyId;
                    }
                    if (fileType && fileType != '-1') {
                        sql += ' and f.file_type = ' + fileType;
                    }
                    sql += ' limit ' + offset + ',' + limit
                    logger.debug('获取文件列表sql：' + sql);
                    query(sql, function (err, rows) {
                        result.total = count;
                        result.rows = rows;
                        res.json(result);
                    });
                }
            ],
            function (err, rows) {
                if (err) {
                    logger.error('查询文件列表出错：' + err);
                    res.json(result);
                    return;
                }
            });
    },
    /**
     * 获取model file 文件信息
     * @param req
     * @param res
     * @param action
     */
    getModelFile: function (req, res) {
        var companyId = req.session.user.ENTERPRISE_ID;
        var modelFileIds = req.body.modelFileIds;
        var sql = 'select id ,name ,path from sys_file where is_deleted = 0 and  file_type = 3 and company_id = ' + companyId;
        logger.debug('获取ModelFile文件信息sql：' + sql);
        query(sql, function (err, rows) {
            if (err) {
                logger.error('获取ModelFile文件信息错误：' + err);
                res.json([]);
                return;
            }
            if (modelFileIds) {
                var fileIds = modelFileIds.toString().split(',');
                for (var i in rows) {
                    var row = rows[i];
                    if (fileIds.indexOf(row.id.toString()) > -1) {
                        row.state = true;
                        rows[i] = row;
                    }
                }
            }
            res.json(rows);
        });
    },
    /**
     * 获取model file 文件信息
     * @param req
     * @param res
     * @param action
     */
    getJarFile: function (req, res) {
        var jarIds = req.body.jarIds;
        var companyId = req.session.user.ENTERPRISE_ID;
        var sql = 'select id ,name ,path from sys_file where is_deleted = 0 and  file_type = 4 and company_id = ' + companyId;
        logger.debug('获取ModelFile文件信息sql：' + sql);
        query(sql, function (err, rows) {
            if (err) {
                logger.error('获取ModelFile文件信息错误：' + err);
                res.json([]);
                return;
            }
            if (jarIds) {
                var ids = jarIds.toString().split(',');
                for (var i in rows) {
                    var row = rows[i];
                    if (ids.indexOf(row.id.toString()) > -1) {
                        row.state = true;
                        rows[i] = row;
                    }
                }
            }
            res.json(rows);
        });
    },
    /**
     * Model关联jar文件
     * @param req
     * @param res
     */
    associationJar: function (req, res) {
        var modelFileId = req.body.modelFileId;
        var jarIds = req.body.jarIds;
        var sql = sqlQuery.update().into('sys_file').set({jarIds: jarIds}).where({id: modelFileId}).build();
        logger.debug('ModelFile关联Jar文件sql:' + sql);
        query(sql, function (error, rows) {
            if (error) {
                logger.error('关联文件错误：' + error);
                message.flag = -1;
                message.message = '关联失败';
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
    /*删除资源信息*/
    deleteFile: function (req, res) {
        var fileId = req.body.fileId;
        async.waterfall(
            [
                function (callback) {
                    var sql = 'SELECT name,path from sys_file where ID = ' + fileId;
                    logger.debug('获取对应的文件路径sql：' + sql);
                    query(sql, function (err, rows) {
                        if (err) {
                            logger.error('获取文件信息错误：' + err);
                            message.flag = -1;
                            message.message = '删除出错';
                            message.data = null;
                            res.json(message);
                            return;
                        } else if (!rows || rows.length < 1) {
                            message.flag = -1;
                            message.message = '文件不存在';
                            message.data = null;
                            res.json(message);
                            return;
                        }
                        else {
                            callback(null, rows[0]);
                        }
                    });
                },
                function (row, callback) {
                    var sql = sqlQuery.remove().from('sys_file').where({id: fileId}).build();
                    logger.error('删除文件资源：' + sql);
                    query(sql, function (err, rows) {
                        if (err || rows.length < 1) {
                            logger.error('删除文件失败:' + (err || rows.length == 0));
                            message.flag = 0;
                            message.message = '删除文件失败';
                            res.json(message);
                            return;
                        } else {
                            if (!fs.existsSync(row.path)) {
                                logger.error('文件不存在');
                                message.flag = 0;
                                message.message = 'OK';
                                res.json(message);
                                return;
                            } else {
                                fs.unlinkSync(row.path);
                            }
                            logger.warn('删除文件成功');
                            message.flag = 0;
                            res.json(message);
                            return;
                        }
                    });
                }
            ],
            function (err) {
                if (err) {
                    message.flag = -1;
                    message.message = '删除文件出错';
                    message.data = null;
                    res.json(message);
                }
            });
    },
    getZXMLFiles: function (req, res) {
        var user = req.session.user;
        var domainId = GlobalAgent.getUserDomain(user.USER_ID).toString();
        if (!domainId) {
            res.json([]);
            return;
        }
        var path = configConst.filePath + '/' + user.ENTERPRISE_ID + '/resources';
        var files = fileUtils.fileTree(path, null, 1);
        var sql = 'SELECT DOMAIN_ID,URI,NAME from sys_domain where DOMAIN_ID in (' + domainId + ') ';
        logger.debug('查询对应的域信息sql:' + sql);
        query(sql, function (err, rows) {
            if (err) {
                logger.error('查询域信息错误：' + err);
                res.json([]);
            } else {
                var rs = [];
                for (var i in files) {
                    var file = files[i];
                    var flag = false;
                    for (var j in rows) {
                        var row = rows[j];
                        var URI = path + row.URI;
                        if (file.type == 1) {
                            flag = true;
                            if (file.URI == URI) {
                                file.isDomain = 1;
                                break;
                            }
                        } else {
                            if (file.URI.indexOf(URI + '/') == 0) {
                                flag = true;
                                break;
                            }
                        }
                    }
                    if (flag) {
                        rs.push(file);
                    }
                }
                res.json(rs);
            }
        });


    },
    /**
     * 获取用户对应 文件的域信息
     * @param req
     * @param res
     */
    getFileDomain: function (req, res) {
        var user = req.session.user;
        var userId = user.USER_ID;
        var isSystem = user.IS_SYSTEM;
        var companyId = user.ENTERPRISE_ID;
        async.waterfall(
            [
                function (callback) {
                    var sql;
                    if (isSystem == 1) {
                        sql = 'SELECT DOMAIN_ID as domainId,PRE_DOMAIN_ID as preDomainId,ADMIN_USER as adminUser, NAME as name , URI as URI FROM sys_domain WHERE IS_DELETED = 0 ';
                    } else {
                        sql = 'SELECT DOMAIN_ID as domainId,PRE_DOMAIN_ID as preDomainId,ADMIN_USER as adminUser, NAME as name , URI as URI FROM  sys_domain WHERE IS_DELETED = 0 AND COMPANY_ID = ' + companyId + ' order by URI';
                    }
                    logger.debug('获取域信息数据sql：' + sql);
                    query(sql, function (err, rows, columns) {
                        if (err) {
                            logger.error('获取域信息错误：' + err);
                            message.flag = -1;
                            message.message = '获取域信息失败';
                            message.data = null;
                            res.json(message);
                            return;
                        } else {
                            callback(null, rows);
                        }
                    });
                },
                function (rr, callback) {
                    if (isSystem == 1) {
                        for (var i in rr) {
                            var r = rr[i];
                            if (r.domainId == 1) {
                                r.disabled = true;
                                r.expanded = true;
                            } else {
                                r.expanded = false;
                                r.disabled = false;
                            }
                            rr[i] = r;
                        }
                    } else {
                        for (var i in rr) {
                            var r = rr[i];
                            r.disabled = true;
                            r.expanded = true;
                            rr[i] = r;
                        }
                    }
                    var sql = 'SELECT ID,USER_ID,DOMAIN_ID from sys_user_domain where IS_DELETED =0 and USER_ID = ' + userId;
                    logger.debug('获取用户域数据sql：' + sql);
                    query(sql, function (err, rows, columns) {
                        if (err) {
                            logger.error('获取用户域数据错误：' + err);
                            message.flag = -1;
                            message.message = '获取用户域信息失败';
                            message.data = null;
                            res.json(message);
                            return;
                        } else {
                            if (rows.length < 1) {
                                message.flag = 0;
                                message.message = 'OK';
                                message.data = rr;
                                res.json(message);
                                return;
                            } else {
                                var domainIds = [];
                                for (var i in rows) {
                                    domainIds.push(rows[i].DOMAIN_ID);
                                }
                                var uris = [];
                                for (var j in rr) {
                                    var r = rr[j];
                                    if (domainIds.indexOf(r.domainId) > -1) {
                                        uris.push(r.URI);
                                        r.disabled = false;
                                        r.expanded = true;
                                    }
                                    for (var t in uris) {
                                        var uri = uris[t];
                                        if (r.URI.indexOf(uri) == 0) {
                                            r.disabled = false;
                                            r.expanded = true;
                                        }
                                    }
                                    rr[j] = r;
                                }
                                message.flag = 0;
                                message.message = 'OK';
                                message.data = rr;
                                res.json(message);
                                return;
                            }
                        }
                    });
                }
            ],
            function (err) {
                if (err) {
                    message.flag = -1;
                    message.message = '获取域信息出错';
                    message.data = null;
                    res.json(message);
                }
            });
    },
    importZXMLFile: function (req, res, action) {
        var user = req.session.user;
        var path = configConst.filePath + '/' + user.ENTERPRISE_ID + '/resources';
        var form = new formidable.IncomingForm(); //创建上传表单
        form.encoding = 'utf-8'; //设置编辑
        form.uploadDir = path; //设置上传目录
        form.keepExtensions = true; //保留后缀
        form.maxFieldsSize = 2 * 1024 * 1024; //文件大小
        form.parse(req, function (err, fields, files) {
            if (err) {
                logger.error('上传文件错误：' + err);
                message.flag = -1;
                message.message = err;
                res.json(message);
                return;
            }
            var filename = files.resource.name;
            var newPath, tempPath, unzipPath;
            var domainId = fields.domainId;
            var desc = fields.desc;
            if (!domainId) {
                message.flag = -1;
                message.message = '请选择要导入文件所属的域';
                res.json(message);
                return;
            }
            async.waterfall(
                [
                    function (callback) {
                        var sql = 'SELECT DOMAIN_ID,URI,NAME from sys_domain where domain_id = ' + domainId;
                        logger.debug('查询文件所属域信息:' + sql);
                        query(sql, function (err, rows) {
                            if (err) {
                                logger.error('查询域信息错误：' + err);
                                message.flag = -1;
                                message.message = '上传失败';
                                message.data = null;
                                res.json(message);
                                return;
                            } else if (!rows || rows.length < 1) {
                                message.flag = -1;
                                message.message = '没有对应的域，请检查';
                                message.data = null;
                                res.json(message);
                                return;
                            } else {
                                newPath = form.uploadDir + rows[0].URI + '/' + filename;
                                callback(null, rows[0]);
                            }
                        });
                    },
                    function (row, callback) {
                        var sql = 'select count(f.ID) as count from sys_file f  where f.is_deleted = 0 and f.path = "' + newPath + '"';
                        logger.debug('检查是否存在相同名称的文件sql：' + sql);
                        query(sql, function (err, rows) {
                            if (rows && rows[0].count > 0) {
                                if (fs.existsSync(files.resource.path)) {
                                    fs.unlinkSync(files.resource.path);
                                }
                                logger.error('当前目录下存在相同名称的文件：' + (err || rows[0].count));
                                message.flag = -1;
                                message.message = '当前目录下存在相同名称的文件';
                                res.json(message);
                                return;
                            } else {
                                callback(null, row);
                            }
                        });
                    },
                    function (callback) {
                        var sql = sqlQuery.insert().into('sys_file').set({
                            name: filename,
                            path: newPath,
                            user_id: user.USER_ID,
                            company_id: user.ENTERPRISE_ID,
                            domain_id: domainId,
                            file_type: 1,
                            description: desc,
                            create_date: Utils.dateFormat(new Date().getTime(), Utils.yyyyMMddhhmmss)
                        }).build();
                        logger.debug('上传文件同步信息sql：' + sql);
                        query(sql, function (err, rows) {
                            if (err) {
                                logger.error('插入数据失败：' + err);
                                message.flag = -1;
                                message.message = '插入数据失败';
                                res.json(message);
                                return;
                            } else {
                                fs.renameSync(files.resource.path, newPath); //重命名
                                logger.info('上传文件成功');
                                message.flag = 0;
                                res.json(message);
                                return;
                            }
                        });
                    }
                ],
                function (err, rows) {
                    if (err) {
                        logger.error('上传文件错误：' + err);
                        message.flag = -1;
                        message.message = '上传文件错误';
                        res.json(message);
                        return;
                    } else {
                        message.flag = 0;
                        res.json(message);
                        return;
                    }
                });


        });
    },
    importZXMLZIPFile: function (req, res, action) {
        var user = req.session.user;
        var path = configConst.filePath + '/' + user.ENTERPRISE_ID + '/resources';
        var form = new formidable.IncomingForm(); //创建上传表单
        form.encoding = 'utf-8'; //设置编辑
        form.uploadDir = path; //设置上传目录
        form.keepExtensions = true; //保留后缀
        form.maxFieldsSize = 2 * 1024 * 1024; //文件大小
        form.parse(req, function (err, fields, files) {
            if (err) {
                logger.error('上传文件错误：' + err);
                message.flag = -1;
                message.message = err;
                res.json(message);
                return;
            }
            var filename = files.resource.name;
            var newPath, tempPath, unzipPath;
            var domainId = fields.domainId;
            var desc = fields.desc;
            if (!domainId) {
                message.flag = -1;
                message.message = '请选择要导入文件所属的域';
                res.json(message);
                return;
            }
            async.waterfall(
                [
                    function (callback) {
                        var sql = 'SELECT DOMAIN_ID,URI,NAME from sys_domain where domain_id = ' + domainId;
                        logger.debug('查询文件所属域信息:' + sql);
                        query(sql, function (err, rows) {
                            if (err) {
                                logger.error('查询域信息错误：' + err);
                                message.flag = -1;
                                message.message = '上传失败';
                                message.data = null;
                                res.json(message);
                                return;
                            } else if (!rows || rows.length < 1) {
                                message.flag = -1;
                                message.message = '没有对应的域，请检查';
                                message.data = null;
                                res.json(message);
                                return;
                            } else {
                                newPath = form.uploadDir + rows[0].URI + '/' + filename;
                                tempPath = form.uploadDir + rows[0].URI + '/' + uuid.v1() + '_' + filename;
                                unzipPath = form.uploadDir + rows[0].URI;
                                callback(null, rows[0]);
                            }
                        });
                    },
                    function (row, callback) {
                        var sql = 'select count(f.ID) as count from sys_file f  where f.is_deleted = 0 and f.path = "' + newPath + '"';
                        logger.debug('检查是否存在相同名称的文件sql：' + sql);
                        query(sql, function (err, rows) {
                            if (rows && rows[0].count > 0) {
                                if (fs.existsSync(files.resource.path)) {
                                    fs.unlinkSync(files.resource.path);
                                }
                                logger.error('当前目录下存在相同名称的文件：' + (err || rows[0].count));
                                message.flag = -1;
                                message.message = '当前目录下存在相同名称的文件';
                                res.json(message);
                                return;
                            } else {
                                callback(null, row);
                            }
                        });
                    },
                    function (row, callback) {
                        var sourcePath = path + row.URI;
                        var targetPath = path + row.URI + '/' + row.NAME + '_' + uuid.v1();
                        fs.renameSync(files.resource.path, tempPath); //重命名
                        fs.mkdirSync(targetPath);
                        var unzip = new AdmZip(tempPath);
                        try {
                            unzip.extractAllTo(targetPath, true);
                        } catch (e) {
                            fileUtils.rmdirSync(tempPath);
                            fileUtils.rmdirSync(targetPath);
                            message.flag = -1;
                            message.message = '解压文件出错';
                            message.data = null;
                            res.json(message);
                            return;
                        }
                        var existsSame = fileUtils.checkSameFile(sourcePath, targetPath);
                        fileUtils.rmdirSync(targetPath);
                        if (existsSame) {
                            var sql = sqlQuery.insert().into('sys_file_temp').set({
                                name: filename,
                                source_path: newPath,
                                path: tempPath,
                                unzip_path: unzipPath,
                                USER_ID: user.USER_ID,
                                company_id: user.ENTERPRISE_ID,
                                file_type: 5,
                                description: desc,
                                create_date: Utils.dateFormat(new Date().getTime(), Utils.yyyyMMddhhmmss)
                            }).build();
                            logger.debug('保存临时文件sql：' + sql);
                            query(sql, function (err, rows) {
                                if (err) {
                                    logger.error('插入数据失败：' + err);
                                    message.flag = -1;
                                    message.message = '插入数据失败';
                                    res.json(message);
                                    return;
                                } else {
                                    logger.info('上传文件成功,存在同名文件');
                                    message.flag = 1;
                                    message.message = '文件夹下在该域下面存在同名文件'
                                    message.data = rows.insertId;
                                    res.json(message);
                                    return;
                                }
                            });
                        } else {
                            callback(null, targetPath);
                        }
                    },
                    function (targetPath, callback) {
                        fs.renameSync(tempPath, newPath); //重命名
                        var unzip = new AdmZip(newPath);
                        try {
                            unzip.extractAllTo(unzipPath, true);
                        } catch (e) {
                            fileUtils.rmdirSync(newPath);
                            message.flag = -1;
                            message.message = '解压文件出错';
                            message.data = null;
                            res.json(message);
                            return;
                        }
                        var sql = sqlQuery.insert().into('sys_file').set({
                            name: filename,
                            path: newPath,
                            user_id: user.USER_ID,
                            company_id: user.ENTERPRISE_ID,
                            domain_id: domainId,
                            file_type: 5,
                            description: desc,
                            create_date: Utils.dateFormat(new Date().getTime(), Utils.yyyyMMddhhmmss)
                        }).build();
                        logger.debug('上传文件同步信息sql：' + sql);
                        query(sql, function (err, rows) {
                            if (err) {
                                logger.error('插入数据失败：' + err);
                                message.flag = -1;
                                message.message = '插入数据失败';
                                res.json(message);
                                return;
                            } else {
                                logger.info('上传文件成功');
                                message.flag = 0;
                                message.message = 'OK';
                                message.data = null;
                                res.json(message);
                                return;
                            }
                        });
                    }
                ],
                function (err, rows) {
                    if (err) {
                        logger.error('上传文件错误：' + err);
                        message.flag = -1;
                        message.message = '上传文件错误';
                        message.data = null;
                        res.json(message);
                        return;
                    } else {
                        message.flag = 0;
                        message.message = 'OK';
                        message.data = null;
                        res.json(message);
                        return;
                    }
                });


        });
    },
    importImageFile: function (req, res, action) {
        var user = req.session.user;
        var path = configConst.filePath + '/' + user.ENTERPRISE_ID + '/resources';
        var form = new formidable.IncomingForm(); //创建上传表单
        form.encoding = 'utf-8'; //设置编辑
        form.uploadDir = path; //设置上传目录
        form.keepExtensions = true; //保留后缀
        form.maxFieldsSize = 2 * 1024 * 1024; //文件大小
        form.parse(req, function (err, fields, files) {
            if (err) {
                logger.error('上传文件错误：' + err);
                message.flag = -1;
                message.message = err;
                res.json(message);
                return;
            }
            var filename = files.resource.name;
            var newPath, tempPath, unzipPath;
            var domainId = fields.domainId;
            var desc = fields.desc;
            if (!domainId) {
                message.flag = -1;
                message.message = '请选择要导入文件所属的域';
                res.json(message);
                return;
            }
            async.waterfall(
                [
                    function (callback) {
                        var sql = 'SELECT DOMAIN_ID,URI,NAME from sys_domain where domain_id = ' + domainId;
                        logger.debug('查询文件所属域信息:' + sql);
                        query(sql, function (err, rows) {
                            if (err) {
                                logger.error('查询域信息错误：' + err);
                                message.flag = -1;
                                message.message = '上传失败';
                                message.data = null;
                                res.json(message);
                                return;
                            } else if (!rows || rows.length < 1) {
                                message.flag = -1;
                                message.message = '没有对应的域，请检查';
                                message.data = null;
                                res.json(message);
                                return;
                            } else {
                                newPath = form.uploadDir + rows[0].URI + '/imglib';
                                if (!fs.existsSync(newPath)) {
                                    fs.mkdirSync(newPath);
                                }
                                newPath += '/' + filename;
                                callback(null, rows[0]);
                            }
                        });
                    },
                    function (row, callback) {
                        var sql = 'select count(f.ID) as count from sys_file f  where f.is_deleted = 0 and f.path = "' + newPath + '"';
                        logger.debug('检查是否存在相同名称的文件sql：' + sql);
                        query(sql, function (err, rows) {
                            if (rows && rows[0].count > 0) {
                                if (fs.existsSync(files.resource.path)) {
                                    fs.unlinkSync(files.resource.path);
                                }
                                logger.error('当前目录下存在相同名称的文件：' + (err || rows[0].count));
                                message.flag = -1;
                                message.message = '当前目录下存在相同名称的文件';
                                res.json(message);
                                return;
                            } else {
                                callback(null, row);
                            }
                        });
                    },
                    function (callback) {
                        var sql = sqlQuery.insert().into('sys_file').set({
                            name: filename,
                            path: newPath,
                            user_id: user.USER_ID,
                            company_id: user.ENTERPRISE_ID,
                            domain_id: domainId,
                            file_type: 2,
                            description: desc,
                            create_date: Utils.dateFormat(new Date().getTime(), Utils.yyyyMMddhhmmss)
                        }).build();
                        logger.debug('上传文件同步信息sql：' + sql);
                        query(sql, function (err, rows) {
                            if (err) {
                                logger.error('插入数据失败：' + err);
                                message.flag = -1;
                                message.message = '插入数据失败';
                                res.json(message);
                                return;
                            } else {
                                fs.renameSync(files.resource.path, newPath); //重命名
                                logger.info('上传文件成功');
                                message.flag = 0;
                                res.json(message);
                                return;
                            }
                        });
                    }
                ],
                function (err, rows) {
                    if (err) {
                        logger.error('上传文件错误：' + err);
                        message.flag = -1;
                        message.message = '上传文件错误';
                        res.json(message);
                        return;
                    } else {
                        message.flag = 0;
                        res.json(message);
                        return;
                    }
                });
        });
    },
    importModelFile: function (req, res, action) {
        var user = req.session.user;
        var companyId = user.ENTERPRISE_ID;
        var path = configConst.filePath + '/' + user.ENTERPRISE_ID + '/resources';
        var form = new formidable.IncomingForm(); //创建上传表单
        form.encoding = 'utf-8'; //设置编辑
        form.uploadDir = path; //设置上传目录
        form.keepExtensions = true; //保留后缀
        form.maxFieldsSize = 2 * 1024 * 1024; //文件大小
        form.parse(req, function (err, fields, files) {
            if (err) {
                logger.error('上传文件错误：' + err);
                message.flag = -1;
                message.message = err;
                res.json(message);
                return;
            }
            var filename = files.resource.name;
            var newPath, tempPath, unzipPath;
            var domainId = fields.domainId;
            var desc = fields.desc;
            if (!domainId) {
                message.flag = -1;
                message.message = '请选择要导入文件所属的域';
                res.json(message);
                return;
            }
            async.waterfall(
                [
                    function (callback) {
                        var sql = 'SELECT DOMAIN_ID,URI,NAME from sys_domain where domain_id = ' + domainId;
                        logger.debug('查询文件所属域信息:' + sql);
                        query(sql, function (err, rows) {
                            if (err) {
                                logger.error('查询域信息错误：' + err);
                                message.flag = -1;
                                message.message = '上传失败';
                                message.data = null;
                                res.json(message);
                                return;
                            } else if (!rows || rows.length < 1) {
                                message.flag = -1;
                                message.message = '没有对应的域，请检查';
                                message.data = null;
                                res.json(message);
                                return;
                            } else {
                                newPath = form.uploadDir + rows[0].URI + '/' + filename;
                                callback(null, rows[0]);
                            }
                        });
                    },
                    function (row, callback) {
                        var sql = 'select count(f.ID) as count from sys_file f  where f.is_deleted = 0 and f.path = "' + newPath + '"';
                        logger.debug('检查是否存在相同名称的文件sql：' + sql);
                        query(sql, function (err, rows) {
                            if (rows && rows[0].count > 0) {
                                if (fs.existsSync(files.resource.path)) {
                                    fs.unlinkSync(files.resource.path);
                                }
                                logger.error('当前目录下存在相同名称的文件：' + (err || rows[0].count));
                                message.flag = -1;
                                message.message = '当前目录下存在相同名称的文件';
                                res.json(message);
                                return;
                            } else {
                                callback(null, row);
                            }
                        });
                    },
                    function (callback) {
                        var sql = sqlQuery.insert().into('sys_file').set({
                            name: filename,
                            path: newPath,
                            user_id: user.USER_ID,
                            company_id: user.ENTERPRISE_ID,
                            domain_id: domainId,
                            file_type: 3,
                            description: desc,
                            create_date: Utils.dateFormat(new Date().getTime(), Utils.yyyyMMddhhmmss)
                        }).build();
                        logger.debug('上传文件同步信息sql：' + sql);
                        query(sql, function (err, rows) {
                            if (err) {
                                logger.error('插入数据失败：' + err);
                                message.flag = -1;
                                message.message = '插入数据失败';
                                res.json(message);
                                return;
                            } else {
                                fs.renameSync(files.resource.path, newPath); //重命名
                                logger.info('上传文件成功');
                                message.flag = 0;
                                res.json(message);
                                return;
                            }
                        });
                    }
                ],
                function (err, rows) {
                    if (err) {
                        logger.error('上传文件错误：' + err);
                        message.flag = -1;
                        message.message = '上传文件错误';
                        res.json(message);
                        return;
                    } else {
                        message.flag = 0;
                        res.json(message);
                        return;
                    }
                });
        });
    },
    importJarFile: function (req, res, action) {
        var user = req.session.user;
        var companyId = user.ENTERPRISE_ID;
        var path = configConst.filePath + '/' + user.ENTERPRISE_ID + '/model/jar';
        var form = new formidable.IncomingForm(); //创建上传表单
        form.encoding = 'utf-8'; //设置编辑
        form.uploadDir = path; //设置上传目录
        form.keepExtensions = true; //保留后缀
        form.maxFieldsSize = 2 * 1024 * 1024; //文件大小
        form.parse(req, function (err, fields, files) {
            if (err) {
                logger.error('上传文件错误：' + err);
                message.flag = -1;
                message.message = err;
                res.json(message);
                return;
            }
            var filename = files.resource.name;
            var newPath, tempPath, unzipPath;
            var domainId = fields.domainId;
            var desc = fields.desc;
            if (!domainId) {
                message.flag = -1;
                message.message = '请选择要导入文件所属的域';
                res.json(message);
                return;
            }
            async.waterfall(
                [
                    function (callback) {
                        var sql = 'SELECT DOMAIN_ID,URI,NAME from sys_domain where domain_id = ' + domainId;
                        logger.debug('查询文件所属域信息:' + sql);
                        query(sql, function (err, rows) {
                            if (err) {
                                logger.error('查询域信息错误：' + err);
                                message.flag = -1;
                                message.message = '上传失败';
                                message.data = null;
                                res.json(message);
                                return;
                            } else if (!rows || rows.length < 1) {
                                message.flag = -1;
                                message.message = '没有对应的域，请检查';
                                message.data = null;
                                res.json(message);
                                return;
                            } else {
                                newPath = form.uploadDir + rows[0].URI + '/' + filename;
                                callback(null, rows[0]);
                            }
                        });
                    },
                    function (row, callback) {
                        var sql = 'select count(f.ID) as count from sys_file f  where f.is_deleted = 0 and f.path = "' + newPath + '"';
                        logger.debug('检查是否存在相同名称的文件sql：' + sql);
                        query(sql, function (err, rows) {
                            if (rows && rows[0].count > 0) {
                                if (fs.existsSync(files.resource.path)) {
                                    fs.unlinkSync(files.resource.path);
                                }
                                logger.error('当前目录下存在相同名称的文件：' + (err || rows[0].count));
                                message.flag = -1;
                                message.message = '当前目录下存在相同名称的文件';
                                res.json(message);
                                return;
                            } else {
                                callback(null, row);
                            }
                        });
                    },
                    function (callback) {
                        var sql = sqlQuery.insert().into('sys_file').set({
                            name: filename,
                            path: newPath,
                            user_id: user.USER_ID,
                            company_id: user.ENTERPRISE_ID,
                            domain_id: domainId,
                            file_type: 4,
                            description: desc,
                            create_date: Utils.dateFormat(new Date().getTime(), Utils.yyyyMMddhhmmss)
                        }).build();
                        logger.debug('上传文件同步信息sql：' + sql);
                        query(sql, function (err, rows) {
                            if (err) {
                                logger.error('插入数据失败：' + err);
                                message.flag = -1;
                                message.message = '插入数据失败';
                                res.json(message);
                                return;
                            } else {
                                fs.renameSync(files.resource.path, newPath); //重命名
                                logger.info('上传文件成功');
                                message.flag = 0;
                                res.json(message);
                                return;
                            }
                        });
                    }
                ],
                function (err, rows) {
                    if (err) {
                        logger.error('上传文件错误：' + err);
                        message.flag = -1;
                        message.message = '上传文件错误';
                        res.json(message);
                        return;
                    } else {
                        message.flag = 0;
                        res.json(message);
                        return;
                    }
                });
        });
    },
    /**
     * 上传文件确认是否覆盖
     * @param req
     * @param res
     */
    overWriteFile: function (req, res) {
        var insertId = req.body.insertId;
        var flag = req.body.flag;
        async.waterfall(
            [
                function (callback) {
                    var sql = 'SELECT ID,NAME,SOURCE_PATH,PATH,UNZIP_PATH,USER_ID,COMPANY_ID,DOMAIN_ID,FILE_TYPE,jarIds,DESCRIPTION from sys_file_temp where ID = ' + insertId;
                    logger.debug('查询临时文件信息sql:' + sql);
                    query(sql, function (err, rows) {
                        if (err) {
                            logger.error('查询临时文件信息错误：' + err);
                            message.flag = -1;
                            message.message = '上传失败';
                            message.data = null;
                            res.json(message);
                            return;
                        } else if (!rows || rows.length < 1) {
                            message.flag = -1;
                            message.message = '没有找到对应的临时文件，请重新上传';
                            message.data = null;
                            res.json(message);
                            return;
                        } else {
                            var row = rows[0];
                            if (flag == 0) {
                                fs.unlinkSync(row.PATH);
                                message.flag = 0;
                                message.message = '操作成功';
                                res.json(message);
                                return;
                            } else {
                                callback(null, row);
                            }
                        }
                    });
                },
                function (row, callback) {
                    var newPath = row.SOURCE_PATH
                    fs.renameSync(row.PATH, newPath);
                    var unzip = new AdmZip(newPath);
                    try {
                        unzip.extractAllTo(row.UNZIP_PATH, true);
                    } catch (e) {
                        fileUtils.rmdirSync(newPath);
                        message.flag = -1;
                        message.message = '解压文件出错';
                        message.data = null;
                        res.json(message);
                        return;
                    }
                    var sql = sqlQuery.insert().into('sys_file').set({
                        name: row.NAME,
                        path: row.SOURCE_PATH,
                        user_id: row.USER_ID,
                        company_id: row.COMPANY_ID,
                        file_type: row.FILE_TYPE,
                        create_date: Utils.dateFormat(new Date().getTime(), Utils.yyyyMMddhhmmss)
                    }).build();
                    logger.debug('覆盖文件信息sql：' + sql);
                    query(sql, function (err, rows) {
                        if (err) {
                            logger.error('插入数据失败：' + err);
                            message.flag = -1;
                            message.message = '上传文件失败';
                            res.json(message);
                            return;
                        } else {
                            logger.info('上传文件成功');
                            message.flag = 0;
                            message.message = 'OK';
                            message.data = null;
                            res.json(message);
                            return;
                        }
                    });
                }
            ],
            function (err, rows) {
                if (err) {
                    logger.error('上传文件错误：' + err);
                    message.flag = -1;
                    message.message = '上传文件错误';
                    res.json(message);
                    return;
                } else {
                    message.flag = 0;
                    res.json(message);
                    return;
                }
            });
    },
    /**
     * 删除 文件
     * @param req
     * @param res
     */
    deleteFileByPath: function (req, res) {
        var URI = req.body.URI;
        if (!URI) {
            message.flag = -1;
            message.data = null;
            message.message = '请选择文件';
            res.json(message);
            return;
        }

        if (!fs.existsSync(URI)) {
            message.flag = -1;
            message.data = null;
            message.message = '文件路径不存在，请确认';
            res.json(message);
            return;
        }
        var user = req.session.user;
        var domainId = GlobalAgent.getUserDomain(user.USER_ID).toString();
        if (!domainId) {
            res.json([]);
            return;
        }
        var path = configConst.filePath + '/' + user.ENTERPRISE_ID + '/resources';
        var sql = 'SELECT DOMAIN_ID,URI,NAME from sys_domain where DOMAIN_ID in (' + domainId + ') ';
        logger.debug('查询对应的域信息sql:' + sql);
        query(sql, function (err, rows) {
            if (err) {
                logger.error('查询域信息错误：' + err);
                message.flag = -1;
                message.data = null;
                message.message = '删除失败';
                res.json(message);
                return;
            } else {
                var notDomain = true;
                var domainChild = false;
                for (var i in rows) {
                    var fp = path + rows[i].URI;
                    if (URI.indexOf(fp + '/') == 0) {
                        domainChild = true;
                    }
                    if (URI == fp) {
                        notDomain = false;
                    }
                }
                if (notDomain && domainChild) {
                    fileUtils.rmdirSync(URI);
                    message.flag = 0;
                    message.data = null;
                    message.message = 'OK';
                    res.json(message);
                    return;
                } else {
                    message.flag = -1;
                    message.data = null;
                    message.message = '该路径是域路径';
                    res.json(message);
                    return;
                }
            }
        });

    },
    /**
     * 设定文图形文件主页
     * @param req
     * @param res
     */
    indexMenuDiagram: function (req, res) {
        var user = req.session.user;
        var domainId = GlobalAgent.getUserDomain(user.USER_ID).toString();
        if (!domainId) {
            message.flag = -1;
            message.message = '用户没有域';
            message.data = null;
            res.json(message);
            return;
        }
        var URI = req.body.URI;
        var flag = req.body.flag;

        if (!URI) {
            message.flag = -1;
            message.data = null;
            message.message = '请选择文件';
            res.json(message);
            return;
        }
        var path = configConst.filePath + '/' + user.ENTERPRISE_ID + '/resources';
        if (flag == 1) {
            URI = path + URI;
        }
        if (!fs.existsSync(URI)) {
            message.flag = -1;
            message.data = null;
            message.message = '文件路径不存在，请确认';
            res.json(message);
            return;
        }

        URI = URI.replace(path, '');
        async.waterfall(
            [
                function (callback) {
                    var sql = 'select id,user_id from sys_user_style where user_id = ' + user.USER_ID;
                    logger.debug('获取用户style信息数据sql：' + sql);
                    query(sql, function (err, rows, columns) {
                        if (err) {
                            logger.error('获取域信息错误：' + err);
                            message.flag = -1;
                            message.message = '获取域信息失败';
                            message.data = null;
                            res.json(message);
                            return;
                        } else {
                            if (!rows || rows.length < 1) {
                                callback(null, 0);
                            }
                            else {
                                callback(null, 1);
                            }
                        }
                    });
                },
                function (flag, callback) {
                    var sql;
                    if (flag == 0) {
                        sql = sqlQuery.insert().into('sys_user_style').set({user_id: user.USER_ID,});
                        sql = sqlQuery.insert().into('sys_user_style').set({
                            user_id: user.USER_ID,
                            diagram_file: URI,
                            create_date: Utils.dateFormat(new Date().getTime(), Utils.yyyyMMddhhmmss)
                        }).build();
                    } else {
                        sql = sqlQuery.update().into('sys_user_style').set({
                            diagram_file: URI,
                            update_date: Utils.dateFormat(new Date().getTime(), Utils.yyyyMMddhhmmss)
                        }).where({
                            user_id: user.USER_ID
                        }).build();
                    }
                    logger.debug('创建或者更新用户style数据sql：' + sql);
                    query(sql, function (err, rows, columns) {
                        if (err) {
                            logger.error('设定用户图形首页错误：' + err);
                            message.flag = -1;
                            message.message = '设定出错';
                            message.data = null;
                            res.json(message);
                            return;
                        } else {
                            message.flag = 0;
                            message.message = 'OK';
                            message.data = null;
                            res.json(message);
                            return;
                        }
                    });
                }
            ],
            function (err) {
                if (err) {
                    message.flag = -1;
                    message.message = '设定图形主页出错';
                    message.data = null;
                    res.json(message);
                }
            });
    },
    /**
     * 设定趋势文件主页
     * @param req
     * @param res
     */
    indexMenuTrend: function (req, res) {
        var points = req.body.points;
        if (!points) {
            message.flag = -1;
            message.data = null;
            message.message = '测点不能为空';
            res.json(message);
            return;
        }
        var user = req.session.user;
        async.waterfall(
            [
                function (callback) {
                    var sql = 'select id,user_id from sys_user_style where user_id = ' + user.USER_ID;
                    logger.debug('获取用户style信息数据sql：' + sql);
                    query(sql, function (err, rows, columns) {
                        if (err) {
                            logger.error('获取域信息错误：' + err);
                            message.flag = -1;
                            message.message = '获取域信息失败';
                            message.data = null;
                            res.json(message);
                            return;
                        } else {
                            if (!rows || rows.length < 1) {
                                callback(null, 0);
                            }
                            else {
                                callback(null, 1);
                            }
                        }
                    });
                },
                function (flag, callback) {
                    var sql;
                    if (flag == 0) {
                        sql = sqlQuery.insert().into('sys_user_style').set({user_id: user.USER_ID,});
                        sql = sqlQuery.insert().into('sys_user_style').set({
                            user_id: user.USER_ID,
                            trend_point: points,
                            create_date: Utils.dateFormat(new Date().getTime(), Utils.yyyyMMddhhmmss)
                        }).build();
                    } else {
                        sql = sqlQuery.update().into('sys_user_style').set({
                            trend_point: points,
                            update_date: Utils.dateFormat(new Date().getTime(), Utils.yyyyMMddhhmmss)
                        }).where({
                            user_id: user.USER_ID
                        }).build();
                    }
                    logger.debug('创建或者更新用户style数据sql：' + sql);
                    query(sql, function (err, rows, columns) {
                        if (err) {
                            logger.error('设定用户趋势测点错误：' + err);
                            message.flag = -1;
                            message.message = '设定出错';
                            message.data = null;
                            res.json(message);
                            return;
                        } else {
                            message.flag = 0;
                            message.message = 'OK';
                            message.data = null;
                            res.json(message);
                            return;
                        }
                    });
                }
            ],
            function (err) {
                if (err) {
                    message.flag = -1;
                    message.message = '设定趋势测点出错';
                    message.data = null;
                    res.json(message);
                }
            });
    }
}
module.exports = fileManage;

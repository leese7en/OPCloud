var actionUtil = require("../../framework/action/actionUtils")();
var transaction = actionUtil.transaction;
var async = require("async");
var uuidUtil = require('node-uuid');
var Utils = require('../../utils/tools/utils');
var OPAPI = require('opapi');
var xlsx = require("node-xlsx");
var formidable = require('formidable');
var fs = require('fs');
var querystring = require('querystring');
var query = actionUtil.query;
var configUtils = require('../../utils/tools/configUtils');
var opPool = require('../../openplant/openPlantPool')
var moduleName = "domain";
var sql = require('sql-query'),
    sqlQuery = sql.Query();

function URIUtils(URI, Name) {
    return (URI == "/" ? "" : URI) + "/" + Name;
};

var message = {
    flag: 0,
    message: '?ɹ?',
    data: null
}

function exportFile() {
    var data = xlsx.parse("./model974.xls");
    var data = data[0]['data'];
    /*
     *TODO    return
     */
    var sheetNum = data.length;
    var titles = data[0];
    var cols = new Array();
    cols.push(["ID", OPAPI.TYPE.INT32]);
    var containID = false;
    for (var i in titles) {
        var title = titles[i]
        switch (title) {
            case 'ID':
                cols.push(["ID", OPAPI.TYPE.INT32]);
                containID = true;
                break;
            case 'ND':
                cols.push(["ND", OPAPI.TYPE.INT16]);
                break;
            case 'PN':
                cols.push(["PN", OPAPI.TYPE.STRING]);
                break;
            case 'RT':
                cols.push(["RT", OPAPI.TYPE.INT8]);
                break;
            case 'FQ':
                cols.push(["FQ", OPAPI.TYPE.INT16]);
                break;
            case 'ED':
                cols.push(["ED", OPAPI.TYPE.STRING]);
                break;
            case 'TV':
                cols.push(["TV", OPAPI.TYPE.FLOAT]);
                break;
            case 'BV':
                cols.push(["BV", OPAPI.TYPE.FLOAT]);
                break;
            case 'EU':
                cols.push(["EU", OPAPI.TYPE.STRING]);
                break;
            case 'DB':
                cols.push(["DB", OPAPI.TYPE.FLOAT]);
                break;
            case 'FM':
                cols.push(["FM", OPAPI.TYPE.INT16]);
                break;
            case 'PT':
                cols.push(["PT", OPAPI.TYPE.INT8]);
                break;
            case 'KT':
                cols.push(["KT", OPAPI.TYPE.INT8]);
                break;
            case 'EX':
                cols.push(["EX", OPAPI.TYPE.STRING]);
                break;
            case 'AP':
                cols.push(["AP", OPAPI.TYPE.INT8]);
                break;
            case 'LC':
                cols.push(["LC", OPAPI.TYPE.INT8]);
                break;
            case 'H4':
                cols.push(["H4", OPAPI.TYPE.FLOAT]);
                break;
            case 'H3':
                cols.push(["H3", OPAPI.TYPE.FLOAT]);
                break;
            case 'ZH':
                cols.push(["ZH", OPAPI.TYPE.FLOAT]);
                break;
            case 'HL':
                cols.push(["HL", OPAPI.TYPE.FLOAT]);
                break;
            case 'LL':
                cols.push(["LL", OPAPI.TYPE.FLOAT]);
                break;
            case 'ZL':
                cols.push(["ZL", OPAPI.TYPE.FLOAT]);
                break;
            case 'L3':
                cols.push(["L3", OPAPI.TYPE.FLOAT]);
                break;
            case 'L4':
                cols.push(["L4", OPAPI.TYPE.FLOAT]);
                break;
            case 'C1':
                cols.push(["C1", OPAPI.TYPE.INT32]);
                break;
            case 'C2':
                cols.push(["C2", OPAPI.TYPE.INT32]);
                break;
            case 'C3':
                cols.push(["C3", OPAPI.TYPE.INT32]);
                break;
            case 'C4':
                cols.push(["C4", OPAPI.TYPE.INT32]);
                break;
            case 'C5':
                cols.push(["C5", OPAPI.TYPE.INT32]);
                break;
            case 'C6':
                cols.push(["C6", OPAPI.TYPE.INT32]);
                break;
            case 'C7':
                cols.push(["C7", OPAPI.TYPE.INT32]);
                break;
            case 'C8':
                cols.push(["C8", OPAPI.TYPE.INT32]);
                break;
        }
    }

    var rows = new Array();
    var pointID = configUtils.getPointIDNext(sheetNum - 1);
    for (var j = 1; j < sheetNum; j++) {
        if (!containID) {
            data[j].unshift(pointID + j - 1);
        }
        rows.push(data[j]);
    }
    /*
     *TODO   
     */
    opPool.insert('Point', rows, cols, function(error, rows, columns) {
        if (error) {
            message.flag = -1;
            message.message = '插入点失败';
            res.send(message);
            return;
        } else {
            var ids = '';
            var size = rows.length;
            for (var i = 0; i < size; i++) {
                ids += rows[i].ID;
                if (rows[i + 1]) {
                    ids += ',';
                }
            }
            var sqlRealTime = 'select ID,GN,RT,DB,ED,EU from V_point where ID in (' + ids + ')';
            opPool.query(sqlRealTime, function(perr, rows, columns) {
                if (perr) {
                    message.flag = -1;
                    message.message = '获取数据实时数据失败';
                    res.send(message);
                } else {
                    var sqlPoints = 'insert into sys_point (`POINT_ID`, `UUID`, `DB_ID`, `POINT_NAME`, `UNIT`, `POINT_TYPE`,`DESCRIPTION`,`COMPRESS_TYPE`,`CREATE_DATE`)';
                    var sqlValue = '';
                    var size = rows.length;
                    for (var i = 0; i < size; i++) {
                        var row = rows[i];
                        if (typeof(row.ED == 'object')) {
                            row.ED = '';
                        }
                        if (typeof(row.EU) == 'object') {
                            row.EU = '';
                        }
                        var uuid = uuidUtil.v4();
                        row.UUID = uuid;
                        row.MTREEID = 1;
                        sqlValue += '(';
                        sqlValue += row.ID + ',';
                        sqlValue += '\'' + row.UUID + '\',';
                        sqlValue += 1 + ',';
                        sqlValue += '\'' + row.GN + '\',';
                        sqlValue += '\'' + row.EU + '\',';
                        sqlValue += row.RT + ',';
                        sqlValue += '\'' + row.ED + '\',';
                        sqlValue += row.DB + ',';
                        sqlValue += '\'' + Utils.dateFormat(new Date().getTime(), Utils.yyyyMMddhhmmss) + '\'';
                        sqlValue += ')';
                        if (rows[i + 1]) {
                            sqlValue += ',';
                        }
                    }
                    if (!sqlValue) {
                        message.flag = -1;
                        message.message = '没有获取到数据';
                        res.send(message);
                        return;
                    }
                    sqlPoints += ' values ' + sqlValue;
                    query(sqlPoints, function(perr, result, columns) {
                        if (perr) {
                            message.flag = -1;
                            message.message = '插入点信息失败';
                            res.send(message);
                            return;
                        }
                        var sqlTag = 'insert into sys_mtree_tags (`uuid`, `TAG_ID`, `MTREE_ID`)';
                        var sqlValue = '';
                        var size = rows.length;
                        for (var i = 0; i < size; i++) {
                            var row = rows[i];
                            sqlValue += '(';
                            sqlValue += '\'' + row.UUID + '\',';
                            sqlValue += result.insertId + ',';
                            sqlValue += row.MTREEID;
                            sqlValue += ')';
                            if (rows[i + 1]) {
                                sqlValue += ',';
                            }
                        }
                        if (!sqlValue) {
                            message.flag = -1;
                            message.message = '没有获取到数据';
                            res.send(message);
                            return;
                        }
                        sqlTag += ' values ' + sqlValue;
                        query(sqlTag, function(cerr, result) {
                            if (cerr) {
                                message.flag = -1;
                                message.message = '插入数据';
                                res.send(message);
                                return;
                            } else {
                                message.flag = 0
                                res.send(message);
                                return;
                            }
                        });
                    });
                }
            });
        }
    });
}

exportFile();

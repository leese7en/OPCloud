var actionUtil = require("../../framework/action/actionUtils")();
var query = actionUtil.query;
var moduleName = "domain";
var Utils = require('../../utils/tools/utils');
var sql = require('sql-query'),
    sqlQuery = sql.Query();
var logger = require('log4js').getLogger('system');
var fields = [{
    field: 'state',
    checkbox: true
}, {
    field: 'PROJECT_ID',
    title: 'ID',
    align: 'center',
    valign: 'middle',
    sortable: true,
}, {
    field: 'PROJECT_NAME',
    title: '名称',
    align: 'left',
    valign: 'top',
    sortable: true,
}, {
    field: 'PRINCIPAL',
    title: '负责人',
    align: 'left',
    valign: 'top',
    sortable: true,
}, {
    field: 'IS_LOCK',
    title: '是否锁定',
    align: 'left',
    valign: 'top',
    formatter: 'format',
    sortable: true
}, {
    field: 'CREATE_DATE',
    title: '创建时间',
    align: 'middle',
    valign: 'top',
    formatter: 'timeFormatter',
    sortable: true
}, {
    field: 'ADDRESS',
    title: '地址',
    align: 'left',
    valign: 'top',
    sortable: true
}, {
    field: 'LONGITUDE',
    title: '经度',
    align: 'left',
    valign: 'top',
    sortable: true
}, {
    field: 'LATITUDE',
    title: '纬度',
    align: 'left',
    valign: 'top',
    sortable: true
},
    {
        field: 'DESCRIPTION',
        title: '描述',
        align: 'left',
        valign: 'top',
        sortable: true
    }, {
        field: 'operate',
        title: '操作',
        align: 'center',
        valign: 'middle',
        formatter: 'operateFormatter',
        events: 'operateEvents'
    }];

var domain_manage = {
    //创建对象
    createAction: function (req, res, action) {
        var addName = req.body.addName;
        var addPrincipal = req.body.addPrincipal;
        var addLock = req.body.addLock;
        var addAddress = req.body.addAddress;
        var addLongitude = req.body.addLongitude;
        var addLatitude = req.body.addLatitude;
        var addDesc = req.body.addDesc;
        var date = Utils.dateFormat(new Date().getTime(), Utils.yyyyMMddhhmmss);
        console.log(date);
        if (addName != undefined && addName != null && addName != "") {
            var sql = "insert into sys_project ( PROJECT_NAME, PRINCIPAL, IS_LOCK, CREATE_DATE, ADDRESS, LONGITUDE, LATITUDE, DESCRIPTION) " +
                " values ('" + addName + "','" + addPrincipal + "','" + addLock + "','" + date + "','" + addAddress + "','" + addLongitude + "','" + addLatitude + "','" + addDesc + "')";

            console.log("SQL:" + sql);
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
    //修改数据库表
    updateAction: function (req, res, action) {
        var id = req.body.id;
        var editName = req.body.editName;
        var editPrincipal = req.body.editPrincipal;
        var editLock = req.body.editLock;
        var editAddress = req.body.editAddress;
        var editLongitude = req.body.editLongitude;
        var editLatitude = req.body.editLatitude;
        var editDesc = req.body.editDesc;
        if (id != undefined && id != null && id != "") {
            var sql = "update sys_project set PROJECT_NAME = '" + editName + "', PRINCIPAL = '" + editPrincipal + "', IS_LOCK = '" + editLock +
                "', ADDRESS = '" + editAddress + "', LONGITUDE = '" + editLongitude + "', LATITUDE = '" + editLatitude +
                "', DESCRIPTION = '" + editDesc + "' where project_id = " + id;
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
    //删除数据库记录
    deleteAction: function (req, res, action) {
        var id = req.body.id;
        if (id != undefined && id != null && id != "") {
            var sql = "delete from sys_project where project_id = " + id;
            console.log(sql);
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
    //批量数据库操作
    batchDeleteAction: function (req, res, action) {
    },
    //下载文件
    downloadAction: function (req, res, action) {
    },
    //后端验证
    validatorAction: function (req, res, action) {
    },
    //管理页面
    projectManageAction: function (req, res, action) {
        var method = req.params.method;
        var list = {
            pageName: "项目管理",
            key: "DOMAIN_ID",
            columns: fields,
        }
        res.render(moduleName + "/project/" + action, list);
    },
    projectList: function (req, res) {
        var search = req.query.search,
            order = req.query.order || 'asc',
            name = req.query.sort,
            result = {
                total: +req.query.total || 0,
                rows: []
            };
        var projectName = req.body.projectName;
        var principal = req.body.principal;
        var sqlSelect = sqlQuery.select();
        sqlSelect.from('sys_project').select("PROJECT_ID", "PROJECT_NAME", "PRINCIPAL", "IS_LOCK", "CREATE_DATE", "ADDRESS", "LONGITUDE", "LATITUDE", "DESCRIPTION");
        if (projectName) {
            sqlSelect.where({PROJECT_NAME: sql.like("%" + projectName + "%")});
        }
        if (principal) {
            sqlSelect.where({PRINCIPAL: sql.like("%" + principal + "%")});
        }
        if (name) {
            if (order && order == "desc") {
                sqlSelect.order(name, 'Z');
            } else {
                sqlSelect.order(name, 'A');
            }
        }
        actionUtil.pageList(req, res, sqlSelect.build());
    }
}
module.exports = domain_manage;
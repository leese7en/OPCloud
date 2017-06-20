var columns = [{
    field: 'ROLE_ID',
    title: 'ID',
    width: 100,
    align: 'center',
    valign: 'middle',
    visible: false,
    sortable: false
}, {
    field: 'ROLE_NAME',
    title: '角色名称',
    width: 100,
    align: 'center',
    valign: 'middle',
}, {
    field: 'DESCRIPTION',
    title: '描述',
    width: 40,
    align: 'left',
    valign: 'top',
}, {
    field: 'IS_SYSTEM',
    title: '是否为系统角色',
    width: 40,
    align: 'left',
    valign: 'top',
    formatter: 'isSystemFormatter',
}, {
    field: 'IS_DELETED',
    title: '删除标志',
    width: 80,
    align: 'left',
    valign: 'top',
    formatter: 'isDeleteFormatter',
}, {
    field: 'operate',
    title: '操作',
    width: 50,
    align: 'center',
    valign: 'middle',
    formatter: 'operateFormatter',
    events: 'operateEvents'
}];
function operateFormatter(value, row, index) {
    return [
        '<a class="remove" href="javascript:void(0)" title="删除">',
        '<i class="glyphicon glyphicon-remove"></i>',
        '</a>' + "&nbsp;&nbsp;&nbsp;&nbsp;" +
        '<a class="edit" href="javascript:void(0)" title="编辑" style="color:#f0ad4e">',
        '<i class="glyphicon glyphicon-edit"></i>',
        '</a>' + "&nbsp;&nbsp;&nbsp;&nbsp;" +
        '<a class="menu" href="javascript:void(0)" title="菜单" style="color:#f0ad4e">',
        '<i class="glyphicon glyphicon-book"></i>',
        '</a>'
    ].join('');
}

function isSystemFormatter(value, row, index) {
    if (value == 1) {
        return "是";
    } else {
        return "否";
    }
}

function isDeleteFormatter(value, row, index) {
    if (value == 1) {
        return "是";
    } else {
        return "否";
    }
}
/**
 * 绑定事件
 * @type {{[click .remove]: Window.operateEvents.'click .remove', [click .edit]: Window.operateEvents.'click .edit', [click .menu]: Window.operateEvents.'click .menu'}}
 */
window.operateEvents = {
    'click .remove': function (e, value, row, index) {
        swal({
            title: "删除确认?",
            text: "您希望删除当前选择数据?",
            type: "warning",
            showCancelButton: true,
            confirmButtonColor: "#DD6B55",
            confirmButtonText: "确认删除",
            cancelButtonText: "取消",
            closeOnConfirm: false,
            closeOnCancel: true
        }, function (isConfirm) {
            if (isConfirm) {
                var id = row.ROLE_ID;
                if (id != null && id != "") {
                    removeRole(id);
                }
            }
        });
    },
    'click .edit': function (e, value, row, index) {
        var id = row.ROLE_ID;
        if (id != null && id != "") {
            showEditRole(id);
        }
    },
    'click .menu': function (e, value, row, index) {
        var id = (row.ROLE_ID);
        if (id != null && id != "") {
            showMenu(id);
        }
    }

};
/**
 * 显示添加角色对话框
 */
function showAddRole() {
    $('#addRoleModal').modal('show');
}
/**
 * 角色查找
 */

$(document).ready(function () {
    $('#table').on('page-change.bs.table', function (e, number, size) {
        queryHistory();
    });
    $('#table').bootstrapTable('destroy');
    $('#table').bootstrapTable({
        height: getHeight(),
        columns: columns,
        striped: true, //是否显示行间隔色
        cache: false, //是否使用缓存，默认为true，所以一般情况下需要设置一下这个属性（*）
        pagination: true, //是否显示分页（*）
        sortable: true, //是否启用排序
        sortOrder: "asc", //排序方式
        sidePagination: "server", //分页方式：client客户端分页，server服务端分页（*）
        pageNumber: 1, //初始化加载第一页，默认第一页
        pageSize: 10, //每页的记录行数（*）
        pageList: [10, 25, 50, 100, 500], //可供选择的每页的行数（*）
        showColumns: true, //是否显示所有的列
        minimumCountColumns: 2, //最少允许的列数
        clickToSelect: true, //是否启用点击选中行
        idField: "ID", //每一行的唯一标识，一般为主键列
        showToggle: true, //是否显示详细视图和列表视图的切换按钮
        showExport: true, //显示导出按钮
        exportDataType: "basic", //导出类型
        onLoadSuccess: function () {
        },
        onLoadError: function () {
            toastr.error('表格初始化失败');
        }
    });
    queryRole();
});

function queryRole() {
    var roleName = $("#roleName").val();
    $.ajax({
        type: 'POST',
        url: "/system/role/roleJsonList",
        data: {
            roleName: roleName,
        },
        success: function (data) {
            if (data.total == 0) {
                $('#table').bootstrapTable('refreshOptions', {pageNumber: 1});
            }
            $('#table').bootstrapTable('load', data);
        },
        error: function () {
            errorSwal("数据加载失败！");
        },
        dataType: "json"
    });
}
/**
 * 添加角色
 */
function addRole() {
    var roleName = ($("#addRoleName").val().trim());
    $("#addRoleName").val(roleName);
    var desc = ($("#addDesc").val().trim());
    $("#addDesc").val(desc);
    if (roleName == null || roleName == "") {
        errorSwal("角色名不能为空！");
        return;
    } else if (validateRoleName(roleName)) {
        errorSwal("角色名已存在，请修改后继续！");
        return;
    }
    $.ajax({
        type: 'POST',
        url: "/system/role/addRole",
        data: {
            roleName: roleName,
            desc: desc
        },
        async: false,
        success: function (data) {
            if (data.msg == "success") {
                queryRole();
                $('#addRoleModal').modal('hide');
                successSwal("添加成功！");
            } else {
                errorSwal("添加失败！");
            }
        },
        error: function () {
            errorSwal("添加失败！");
        },
        dataType: "json"
    });
}

function reset() {


}
/**
 * 删除角色
 * @param id
 */
function removeRole(id) {
    $.ajax({
        type: "post",
        url: "/system/role/removeRole",
        data: {
            id: id
        },
        async: false,
        dataType: "json",
        success: function (data) {
            if (data.flag < 0) {
                errorSwal(data.message);
            } else {
                queryRole();
                successSwal("删除成功！");
            }
        },
        error: function () {
            errorSwal("删除失败！");
        }
    });
}

/**
 * 验证角色名是否存在
 */
function validateRoleName(roleName) {
    var flag = false;
    $.ajax({
        type: 'POST',
        url: "/system/role/validateRoleName",
        data: {
            roleName: roleName
        },
        async: false,
        success: function (data) {
            console.log(data.msg);
            if (data.msg == "true") {
                flag = true;
            }
        },
        dataType: "json"
    });
    return flag;
}
/**
 * 显示编辑菜单对话框
 * @param id
 */
function showEditRole(id) {
    $.ajax({
        type: 'POST',
        url: "/system/role/roleById",
        data: {
            id: id
        },
        async: false,
        success: function (data) {
            $("#editId").val(id);
            $("#editRoleName").val(data[0].ROLE_NAME);
            $("#editDesc").val(data[0].DESCRIPTION);
        },
        error: function () {

        },
        dataType: "json"
    });
    $('#editRoleModal').modal('show');
}
/**
 * 编辑角色
 */
function editRole() {
    var id = ($("#editId").val());
    var roleName = ($("#editRoleName").val());
    var desc = ($("#editDesc").val());
    if (roleName == null || roleName == "") {
        errorSwal("角色名不能为空！");
        return;
    }
    $.ajax({
        type: 'POST',
        url: "/system/role/editRole",
        data: {
            id: id,
            roleName: roleName,
            desc: desc
        },
        async: false,
        success: function (data) {
            if (data.msg == "success") {
                queryRole();
                successSwal("编辑成功！");
            } else {
                errorSwal("编辑失败！");
            }
        },
        error: function () {
            errorSwal("编辑失败！");
        },
        dataType: "json"
    });
}
/**
 * 显示菜单对话框
 * @param id
 */
function showMenu(id) {
    $("#pageRoleId").val(id);
    getAllPage(id);
    $('#menuModal').modal('show');
}


/**
 * 获取所有菜单
 */
function getAllPage() {
    var roleId = $("#pageRoleId").val();
    $.ajax({
        type: 'POST',
        url: "/system/rolePage/getAllPageByRole",
        data: {
            roleId: roleId
        },
        success: function (data) {
            initPageInfoTable(data.data);
        },
        error: function () {
            errorSwal("数据获取失败！");
        },
        async: true,
        dataType: "json"
    });
}

/*格式化菜单信息*/

function initPageInfoTable(value) {
    var source = {
        dataType: "json",
        dataFields: [{
            name: 'pageId',
            type: 'number'
        }, {
            name: 'pageName',
            type: 'string'
        }, {
            name: 'prePageId',
            type: 'number'
        }, {
            name: 'url',
            type: 'string'
        }, {
            name: 'icon',
            type: 'string'
        }, {
            name: 'isBind',
            type: 'number'
        }],
        hierarchy: {
            keyDataField: {
                name: 'pageId'
            },
            parentDataField: {
                name: 'prePageId'
            }
        },
        id: 'pageId',
        localData: value
    };
    var dataAdapter = new $.jqx.dataAdapter(source);
    $("#menuTable").jqxTreeGrid({
        width: 570,
        height: 300,
        source: dataAdapter,
        sortable: true,
        ready: function () {
            $("#menuTable").jqxTreeGrid('expandRow', '0');
        },
        columns: [{
            text: '名称',
            dataField: 'pageName',
            width: '30%'
        }, {
            text: '路径',
            dataField: 'url',
            width: '35%'
        }, {
            text: '描述',
            dataField: 'description',
            width: '20%'
        }, {
            text: '操作',
            cellsalign: 'left',
            cellsrenderer: operate,
            width: '13%'
        }]
    });
}

/**
 * 显示删除和删除操作
 * @param {Object} value
 * @param {Object} row
 * @param {Object} index
 * @return {TypeName}
 */
function operate(id, value, index, rowData) {
    if (rowData.url) {
        if (rowData.isBind == 1) {
            return '<button id ="page_' + rowData.pageId + '"  onclick="unBindPage(\'' + rowData.pageId + '\')"><font color="red">解绑</font></button>';
        } else {
            return '<button id ="page_' + rowData.pageId + '" onclick="bindPage(\'' + rowData.pageId + '\')"><font color="green">绑定</font></button>';
        }
    } else {
        return '';
    }
}

/**
 * 绑定
 * @param pageId
 */
function bindPage(pageId) {
    var roleId = $("#pageRoleId").val();
    $.ajax({
        type: 'POST',
        url: "/system/rolePage/bindPage",
        data: {
            roleId: roleId,
            pageId: pageId
        },
        success: function (data) {
            if (data.msg == "success") {
                var row = $("#menuTable").jqxTreeGrid('getRow', pageId);
                row.isBind = 1;
                $("#menuTable").jqxTreeGrid('updateRow', pageId, row);
                successSwal("绑定菜单成功！");
            } else {
                errorSwal("绑定菜单失败！");
            }
        },
        error: function () {
            errorSwal("绑定菜单失败！");
        },
        async: true,
        dataType: "json"
    });
}
/**
 * 解绑
 * @param pageId
 */
function unBindPage(pageId) {
    var roleId = $("#pageRoleId").val();
    $.ajax({
        type: 'POST',
        url: "/system/rolePage/unBindPage",
        data: {
            roleId: roleId,
            pageId: pageId
        },
        success: function (data) {
            if (data.msg == "success") {
                var row = $("#menuTable").jqxTreeGrid('getRow', pageId);
                row.isBind = 0;
                $("#menuTable").jqxTreeGrid('updateRow', pageId, row);
                successSwal("解绑菜单成功！");
            } else {
                errorSwal("解绑菜单失败！");
            }
        },
        error: function () {
            errorSwal("解绑菜单失败！");
        },
        async: true,
        dataType: "json"
    });
}
/**
 * 成功
 * @param message
 * @param timer
 */
function successSwal(message, timer) {
    swal({
        title: "提示",
        text: message ? message : "操作成功！",
        // type: "info",
        type: "success",
        timer: timer ? timer : 1500,
        closeOnConfirm: false
    });
}
/**
 * 错误
 * @param message
 */
function errorSwal(message) {
    swal({
        title: "错误",
        text: message ? message : "操作失败！",
        type: "error",
        timer: 2000,
        closeOnConfirm: false
    });
}
var isAdd = true;
var userFields = [{
    field: 'USER_ID',
    title: 'ID',
    align: 'center',
    valign: 'middle',
    visible: false,
}, {
    field: 'USER_NAME',
    title: '用户名',
    align: 'center',
    valign: 'middle',
}, {
    field: 'EMAIL',
    title: '邮箱',
    align: 'center',
    valign: 'middle',
}, {
    field: 'CREATE_DATE',
    title: '创建日期',
    align: 'center',
    valign: 'middle',
}];
toastr.options = {
    "closeButton": true,
    "debug": false,
    "progressBar": false,
    "positionClass": "toast-top-center",
    "onclick": null,
    "showDuration": "300",
    "hideDuration": "2000",
    "timeOut": "2000",
    "extendedTimeOut": "2000",
    "showEasing": "swing",
    "hideEasing": "linear",
    "showMethod": "fadeIn",
    "hideMethod": "fadeOut"
};
var source = {
    dataType: "json",
    dataFields: [
        {name: 'DOMAIN_ID', type: 'number'},
        {name: 'PRE_DOMAIN_ID', type: 'number'},
        {name: 'NAME', type: 'string'},
        {name: 'URI', type: 'string'},
        {name: 'IS_ENABLE', type: 'number'},
        {name: 'DOMAIN_CODE', type: 'string'},
        {name: 'canAdd', type: 'number'},
        {name: 'EDIT', type: 'number'},
        {name: 'DESCRIPTION', type: 'string'}
    ],
    hierarchy: {
        keyDataField: {name: 'DOMAIN_ID'},
        parentDataField: {name: 'PRE_DOMAIN_ID'}
    },
    id: 'DOMAIN_ID',
    timeout: 60 * 1000,
    url: '/domain/domain/getDomainList',
    addRow: function (rowId, rowData, position, parentId, commit) {
        commit(true);
    }
};
var enableFormat = function (row, columnfield, value) {
    if (value == 1 || value == "1" || value == "true") {
        return "已启用";
    }
    return "未启用";
}
function operateFormatter(r, columnfield, value, row, columnproperties) {
    var id = row.DOMAIN_ID;
    var add = row.canAdd;
    var edit = row.EDIT;
    if (id == 1) {
        return ''
    }
    var render = new Array();
    if (add == 1) {
        render.push('<a class="add" href="javascript:void(0)" title="添加" style="color:#008d4c" onclick="showAddDoMain()">');
        render.push('<i class="glyphicon glyphicon-plus"></i></a>');
    }
    if (edit) {
        render.push('&nbsp;&nbsp;<a class="remove" href="javascript:void(0)" style="color:#cc0000"  title="删除" onclick="showRemoveDoMain()">');
        render.push('<i class="glyphicon glyphicon-remove"></i></a>');
        render.push('&nbsp;&nbsp;<a class="edit" href="javascript:void(0)" title="编辑" style="color:#f0ad4e" onclick="showEditDoMain()">');
        render.push('<i class="glyphicon glyphicon-edit"></i></a>');
        render.push('&nbsp;&nbsp;<a class="edit" href="javascript:void(0)" title="重命名" style="color:red" onclick="renameDomain(' + row.DOMAIN_ID + ',\'' + row.NAME + '\')">');
        render.push('<i class="glyphicon glyphicon-flash"></i></a>');
    }
    return render.join('');
}
var filed = [
    {text: "id", datafield: "DOMAIN_ID", align: "left", hidden: true},//隐藏列
    {text: '域名', dataField: 'NAME', cellsalign: 'left', width: '20%',},
    {text: '域ID', dataField: 'DOMAIN_CODE', cellsalign: 'left', width: 280, hidden: true},
    {text: '访问路径', dataField: 'URI', cellsalign: 'left', width: '32%'},
    {text: '描述', dataField: 'DESCRIPTION', cellsalign: 'left', width: '30%',},
    {text: '编辑', dataField: 'EDIT', cellsalign: 'left', hidden: true},
    {text: '是否启用', dataField: 'IS_ENABLE', cellsrenderer: enableFormat, align: "center", cellsalign: 'center', width: '8%'},
    {
        text: '操作', align: "center", cellsalign: 'center', cellsrenderer: operateFormatter,
        events: 'operateEvents', width: '10%'
    }
]
$(document).ready(function () {
    $('#userTable').bootstrapTable('destroy');
    $('#userTable').bootstrapTable({
        height: 250,
        columns: userFields,
        striped: true, //是否显示行间隔色
        cache: false, //是否使用缓存，默认为true，所以一般情况下需要设置一下这个属性（*）
        pagination: false, //是否显示分页（*）
        sortable: true, //是否启用排序
        sortOrder: "asc", //排序方式
        showColumns: false, //是否显示所有的列
        clickToSelect: true, //是否启用点击选中行
        idField: "ID", //每一行的唯一标识，一般为主键列
        showToggle: false, //是否显示详细视图和列表视图的切换按钮
        showExport: false, //显示导出按钮
        onLoadSuccess: function () {
        },
        onLoadError: function () {
            toastr.error('表格初始化失败');
        }
    });
    $('#userTable').on('dbl-click-row.bs.table', function (row, element) {
        if (isAdd) {
            $('#addUserId').val(element.USER_ID);
            $('#addUserName').val(element.USER_NAME);
        } else {
            $('#editUserId').val(element.USER_ID);
            $('#editUserName').val(element.USER_NAME);
        }
        closeUserTableModal();
    });
    getDomain();
});

/**
 * 页面信息
 * @param {Object} pageNumber
 * @param {Object} pageSize
 */
function getDomain(insertID) {
    var dataAdapter = new $.jqx.dataAdapter(source);
    $("#domainGrid").jqxTreeGrid(
        {
            theme: "magus",
            width: '100%',
            height: getHeight(),
            source: dataAdapter,
            pagerMode: 'advanced',
            localization: getLocalization(),
            columnsResize: true,
            sortable: true,
            pageSize: 10000,
            ready: function () {
                if (insertID) {
                    $("#domainGrid").jqxTreeGrid('expandRow', insertID);
                } else {
                    $("#domainGrid").jqxTreeGrid('expandRow', 0);
                }
            },
            columns: filed
        });
    $('#domainGrid').on('rowSelect', function (event) {
        var args = event.args;
        var id = args.key;
        $('#saveId').val(id);
    });
}


$(window).resize(function () {
    $("#domainGrid").height(getHeight());
});

function closeUserTableModal() {
    $('#userTableModal').modal('hide');
}
/**
 * 获取用户
 * @param flag
 */
function getUser(flag) {
    if (flag == 'add') {
        isAdd = true
    } else {
        isAdd = false;
    }
    $.ajax({
        type: 'post',
        url: "/system/user/getDomainUser",
        async: true,
        dataType: "json",
        success: function (data) {
            $('#userTable').bootstrapTable('load', data);
            $('#userTableModal').modal({
                backdrop: 'static'
            });
        },
        error: function () {
            errorSwal("数据获取失败！");
        },

    });
}
var getLocalization = function (culture) {
    var localization = null;
    switch (culture) {
        default:
            localization = {
                pagergotopagestring: " 跳转到:",
                pagershowrowsstring: " 显示条目:",
                pagerrangestring: " 总条数:",
                pagerpreviousbuttonstring: "上一个",
                pagernextbuttonstring: " 下一个",
                pagerfirstbuttonstring: " 开始",
                pagerlastbuttonstring: " 最后",
                filtersearchstring: "搜索",
            }
            break;
    }
    return localization;
}

function getHeight() {
    var neg = $('.main-header').outerHeight() + $('.main-footer').outerHeight();
    return $(window).height() - $('h1').outerHeight(true) - neg - 80;
}
function showAddDoMain() {
    var selectedItem = $('#domainGrid').jqxTreeGrid('getSelection')[0];
    var preId = $("#saveId").val();
    if (preId == null || preId == "") {
        swal({
            title: "提示",
            text: "请选择域信息！",
            type: "info",
            closeOnConfirm: false
        });
        return;
    }
    if (selectedItem.IS_ENABLE == 0) {
        $("#isEnable").attr("disabled", true);
    } else {
        $("#isEnable").attr("disabled", false);
    }
    $('#addDoMainModal').modal('show');
}
/*
 添加域信息
 */
function addDoMain() {
    var preId = $("#saveId").val();
    if (!preId) {
        toastr.warning('请选择上级域');
        return;
    }
    var addName = $("#addName").val();
    if (!addName) {
        toastr.warning('请输入域名称');
        return;
    }
    var addDesc = $("#addDesc").val();
    var isEnable = $('#isEnable').is(':checked');
    var userId = $('#addUserId').val();
    if (!userId) {
        toastr.warning('请选择域管理员,可以为自己');
        return;
    }
    var selectedItem = $('#domainGrid').jqxTreeGrid('getSelection')[0];
    $.ajax({
        type: 'POST',
        url: "/domain/domain/addDomain",
        data: {
            preId: preId,
            addName: addName,
            addDesc: addDesc,
            isEnable: isEnable,
            userId: userId
        },
        success: function (data) {
            var flag = data.flag;
            if (flag < 0) {
                toastr.error(data.message);
                return;
            } else {
                var insertID = parseInt(data.data);
                $('#domainGrid').jqxTreeGrid('addRow', insertID, {
                    DOMAIN_ID: insertID,
                    parentid: preId,
                    NAME: addName,
                    URI: selectedItem.URI + '/' + addName,
                    canAdd: 1,
                    DESCRIPTION: addDesc,
                    IS_ENABLE: isEnable,
                    EDIT: 1
                }, 0, preId);
                successSwal('添加成功');
                closeAddDomainModal();
            }
        },
        error: function () {
            errorSwal('添加失败');
        },
        dataType: "json"
    });
}
/**
 * 关闭添加域窗口
 */
function closeAddDomainModal() {
    $("#saveId").val('');
    $("#addName").val('');
    $("#addDesc").val('');
    $('#userId').val('');
    $('#addUserName').val('');
    $('#isEnable').removeAttr('checked');
    $('#addDoMainModal').modal('hide');
}
/**
 * 关闭编辑域窗口
 */
function closeEditDomainModal() {
    $("#saveId").val('');
    $("#editName").val('');
    $("#editDesc").val('');
    $('#editUserId').val('');
    $('#editUserName').val('');
    $('#editEnable').removeAttr('checked');
    $('#editDoMainModal').modal('hide');
}
function showEditDoMain() {
    var id = $("#saveId").val();
    if (id == null || id == "") {
        swal({
            title: "提示",
            text: "请选择域信息！",
            type: "info",
            closeOnConfirm: false
        });
        return;
    }
    $.ajax({
        type: 'POST',
        url: "/domain/domain/getDoMainById",
        data: {
            id: id
        },
        dataType: "json",
        success: function (data) {
            var flag = data.flag;
            if (flag < 0) {
                toastr.error(data.message);
                return;
            } else {
                var value = data.data;
                $("#editName").val(value.NAME);
                $('#editName').attr('readonly', 'readonly')
                if (value.IS_ENABLE == 1) {
                    $('#editEnable').prop('checked', 'checked');
                } else {
                    $('#editEnable').removeAttr('checked');
                }
                if (value.preEnable == 1) {
                    $('#editEnable').attr('disabled', false);
                } else {
                    $('#editEnable').attr('disabled', true);
                }
                $("#editDesc").val(value.DESCRIPTION);
                $("#editUserId").val(value.USER_ID);
                $("#editUserName").val(value.USER_NAME);
                $('#editDoMainModal').modal('show');
            }
        },
        error: function () {
        }
    });
}

function editDoMain() {
    var selectedItem = $('#domainGrid').jqxTreeGrid('getSelection')[0];
    var id = $("#saveId").val();
    if (!id) {
        toastr.warning('请选择要修改的域');
        return;
    }
    var editEnable = $('#editEnable').is(':checked');
    var editUserId = $('#editUserId').val();
    if (!editUserId) {
        toastr('管理员不能为空');
        return;
    }
    var editDesc = $("#editDesc").val();
    $.ajax({
        type: 'POST',
        url: " /domain/domain/updateDomain",
        data: {
            id: id,
            editEnable: editEnable,
            editUserId: editUserId,
            editDesc: editDesc
        },
        dataType: "json",
        success: function (data) {
            var flag = data.flag;
            if (flag < 0) {
                toastr.warning(data.message);
                return;
            } else {
                selectedItem.IS_ENABLE = editEnable ? 1 : 0;
                selectedItem.DESCRIPTION = editDesc;
                $('#domainGrid').jqxTreeGrid('updateRow', id, selectedItem);
                var data = data.data;
                if (data && data.length > 0) {
                    var rows = $('#domainGrid').jqxTreeGrid('getAllRows');
                    var dsize = data.length;
                    var rsize = rows.length;
                    for (var i = 0; i < dsize; i++) {
                        for (var j = 0; j < rsize; j++) {
                            var row = rows[j];
                            if (data[i].DOMAIN_ID == row.DOMAIN_ID) {
                                row.IS_ENABLE = data[i].IS_ENABLE;
                                $('#domainGrid').jqxTreeGrid('updateRow', row.DOMAIN_ID, row);
                                break;
                            }
                        }
                    }
                }
                $('#domainGrid').jqxTreeGrid('refresh');
                successSwal('编辑成功');
                closeUserTableModal();
            }
        },
        error: function () {
            errorSwal('编辑失败');
        }
    });
}


function showRemoveDoMain() {
    var id = $("#saveId").val();
    if (id == null || id == "" || id == undefined) {
        swal({
            title: "提示",
            text: "请选择域信息！",
            type: "info",
            closeOnConfirm: false
        });
        return;
    }
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
            if (id != null && id != "" && id != undefined) {
                removeDoMain(id);
            }
        }
    });
}

function removeDoMain(id) {
    var selectedItem = $('#domainGrid').jqxTreeGrid('getSelection')[0];
    $.ajax({
        type: "post",
        url: '/domain/domain/deleteDomain',
        data: {
            id: id
        },
        async: false,
        dataType: "json",
        success: function (data) {
            var flag = data.flag;
            if (flag < 0) {
                toastr.error(data.message);
                return;
            } else {
                $("#domainGrid").jqxTreeGrid('deleteRow', selectedItem.DOMAIN_ID);
                successSwal('删除成功');
            }
        },
        error: function () {
            errorSwal('删除失败');
        }
    });
}

/**
 * 重命名 Domain
 */
function renameDomain(id, name) {
    var selectedItem = $('#domainGrid').jqxTreeGrid('getSelection')[0];
    if (!id) {
        toastr.warning('请选择需要操作的节点');
        return;
    }
    swal({
        title: "重命名",
        text: "重命名域名称会修改整体结构，请慎重!",
        type: "input",
        showCancelButton: true,
        closeOnConfirm: false,
        animation: "slide-from-top",
        inputPlaceholder: name
    }, function (inputValue) {
        if (inputValue === false) return false;
        if (inputValue && inputValue.trim() !== "") {
            $.ajax({
                type: 'POST',
                url: "/domain/domain/renameDomain",
                data: {
                    id: id,
                    newName: inputValue
                },
                beforeSend: function () {
                    swal({
                        showCancelButton: false,
                        showConfirmButton: false,
                        title: "更新中...",
                        imageUrl: "/images/file-loader.gif"
                    });
                },
                success: function (data) {
                    if (data.flag < 0) {
                        errorSwal(data.message);
                    } else {
                        var uris = selectedItem.URI.split('/');
                        uris[uris.length - 1] = inputValue;
                        var uri = uris.join('/');
                        selectedItem.URI = uri;
                        selectedItem.NAME = inputValue;
                        $('#domainGrid').jqxTreeGrid('updateRow', id, selectedItem);
                        var data = data.data;
                        if (data && data.length > 0) {
                            var rows = $('#domainGrid').jqxTreeGrid('getAllRows');
                            var dsize = data.length;
                            var rsize = rows.length;
                            for (var i = 0; i < dsize; i++) {
                                for (var j = 0; j < rsize; j++) {
                                    var row = rows[j];
                                    if (data[i].DOMAIN_ID == row.DOMAIN_ID) {
                                        row.URI = data[i].URI;
                                        $('#domainGrid').jqxTreeGrid('updateRow', row.DOMAIN_ID, row);
                                        break;
                                    }
                                }
                            }
                        }
                        $('#domainGrid').jqxTreeGrid('refresh');
                        successSwal();
                        swal.close();
                    }
                },
                error: function (data) {
                    errorSwal();
                },
                dataType: "json"
            });
            return true
        } else {
            swal.showInputError("无效数据!");
            return false
        }
    });
}
var offlineFields = [{
    field: 'ID',
    title: '序号',
    align: 'center',
    valign: 'middle',
    sortable: false,
    visible: false
}, {
    field: 'STATUS',
    title: '设备状态',
    align: 'left',
    valign: 'top',
    sortable: false,
    visible: false,
}, {
    field: 'DEV_CODE',
    title: '机器码',
    align: 'left',
    valign: 'top',
    sortable: false,
    visible: true
}, {
    field: 'NAME',
    title: '设备名称',
    align: 'left',
    valign: 'top',
    sortable: false,
}, {
    field: 'DEV_DESC',
    title: '设备描述',
    align: 'left',
    valign: 'top',
    sortable: false,
}, {
    field: 'groupName',
    title: '设备分组',
    align: 'left',
    valign: 'top',
    sortable: false,
}, {
    field: 'TIME',
    title: '离线时间',
    align: 'left',
    valign: 'top',
    sortable: false
}, {
    field: 'TIME',
    title: '离线时长',
    align: 'left',
    formatter: 'DiffTimeFormatter',
    valign: 'top',
    sortable: false
}, {
    field: 'OUT_COUNT',
    title: '掉线次数',
    align: 'left',
    valign: 'top',
    sortable: false,
}, {
    field: 'VERSION_NUM',
    title: '版本号',
    align: 'left',
    valign: 'top',
    sortable: false,
    visible: false,
}, {
    field: 'SERIAL_NO',
    title: 'SN',
    align: 'left',
    valign: 'top',
    sortable: false,
    visible: false,
}, {
    field: 'anttention',
    title: '关注状态',
    align: 'left',
    valign: 'top',
    sortable: false,
    visible: false,
}, {
    field: 'canEdit',
    title: '是否可编辑',
    align: 'left',
    valign: 'top',
    sortable: false,
    visible: false,
}, {
    field: 'operate',
    title: '操作',
    align: 'center',
    valign: 'middle',
    formatter: 'operateFormatter',
    events: 'operateEvents'
}];
var onlineFields = [{
    field: 'ID',
    title: '序号',
    align: 'center',
    valign: 'middle',
    sortable: false,
    visible: false
}, {
    field: 'STATUS',
    title: '设备状态',
    align: 'left',
    valign: 'top',
    sortable: false,
    visible: false,
}, {
    field: 'DEV_CODE',
    title: '机器码',
    align: 'left',
    valign: 'top',
    sortable: false,
    visible: true
}, {
    field: 'NAME',
    title: '设备名称',
    align: 'left',
    valign: 'top',
    sortable: false,
}, {
    field: 'DEV_DESC',
    title: '设备描述',
    align: 'left',
    valign: 'top',
    sortable: false,
}, {
    field: 'GROUPNAME',
    title: '设备分组',
    align: 'left',
    valign: 'top',
    sortable: false,
}, {
    field: 'TIME',
    title: '上线时间',
    align: 'left',
    valign: 'top',
    sortable: false
}, {
    field: 'TIME',
    title: '在线时长',
    align: 'left',
    formatter: 'DiffTimeFormatter',
    valign: 'top',
    sortable: false
}, {
    field: 'OUT_COUNT',
    title: '掉线次数',
    align: 'left',
    valign: 'top',
    sortable: false,
}, {
    field: 'VERSION_NUM',
    title: '版本号',
    align: 'left',
    valign: 'top',
    sortable: false,
    visible: false,
}, {
    field: 'SERIAL_NO',
    title: 'SN',
    align: 'left',
    valign: 'top',
    sortable: false,
    visible: false,
}, {
    field: 'anttention',
    title: '关注状态',
    align: 'left',
    valign: 'top',
    sortable: false,
    visible: false,
}, {
    field: 'canEdit',
    title: '是否可编辑',
    align: 'left',
    valign: 'top',
    sortable: false,
    visible: false,
}, {
    field: 'operate',
    title: '操作',
    align: 'center',
    valign: 'middle',
    formatter: 'operateFormatter',
    events: 'operateEvents'
}];
var boxGroupFiled = [{
    field: 'id',
    title: '序号',
    align: 'center',
    valign: 'middle',
    sortable: false,
    visible: false
}, {
    field: 'name',
    title: '名称',
    align: 'left',
    valign: 'top',
    sortable: false
}, {
    field: 'descs',
    title: '描述',
    align: 'left',
    valign: 'top',
    sortable: false,
}, {
    field: 'operate',
    title: '操作',
    align: 'center',
    valign: 'middle',
    formatter: 'operateGroupFormatter'
}];

var boxLogFiled = [{
    field: 'id',
    title: '序号',
    align: 'center',
    valign: 'middle',
    sortable: false,
    visible: false
}, {
    field: 'content',
    title: '名称',
    align: 'left',
    valign: 'top',
    sortable: false
}, {
    field: 'time',
    title: '时间',
    align: 'left',
    valign: 'top',
    sortable: false,
}, {
    field: 'heartbeat_time',
    title: '最近心跳时间',
    align: 'center',
    valign: 'middle',
    sortable: false
}];

/**
 * 显示删除和删除操作
 */
function operateGroupFormatter(value, row, index) {
    var opr = [];
    opr.push('&nbsp;&nbsp;&nbsp;&nbsp;<a class="edit" href="javascript:void(0)" onclick="editBoxGroup(' + row.id + ',' + row.name + ',' + row.descs + ')" title="编辑" style="color:#f0ad4e">',
        '<i class="glyphicon glyphicon-edit"></i></a>');
    opr.push('&nbsp;&nbsp;&nbsp;&nbsp;<a class="remove" href="javascript:void(0)" onclick="deleteBoxGroup(' + row.id + ')" title="删除" style="color:red">',
        '<i class="glyphicon glyphicon-trash"></i></a>')
    return opr.join('');
}
$(document).ready(function () {
    $('#onlineTable').on('page-change.bs.table', function (e, number, size) {
        onlineQuery();
    });
    $('#onlineTable').bootstrapTable('destroy');
    $('#onlineTable').bootstrapTable({
        height: getHeight3(),
        columns: onlineFields,
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
    $('#offlineTable').on('page-change.bs.table', function (e, number, size) {
        offlineQuery();
    });
    $('#offlineTable').bootstrapTable('destroy');
    $('#offlineTable').bootstrapTable({
        height: getHeight3(),
        columns: offlineFields,
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

    $('#boxLogTable').on('page-change.bs.table', function (e, number, size) {
        showBoxLog();
    });
    $('#boxLogTable').bootstrapTable('destroy');
    $('#boxLogTable').bootstrapTable({
        height: 400,
        columns: boxLogFiled,
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
        clickToSelect: false, //是否启用点击选中行
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
    $('#boxGroupTable').bootstrapTable({
        columns: boxGroupFiled
    });
    pointGroup(true);
    $('#boxGroupOnline, #boxGroupOffline').val('-1');
    onlineQuery();
    offlineQuery();

});


function showBoxLog() {
    var devCode = $('#boxLogDevCode').val();
    if (!devCode) {
        errorSwal('请选择设备');
        return;
    }
    var opts = $("#boxLogTable").bootstrapTable('getOptions');
    var offset = ((opts.pageNumber - 1) * opts.pageSize);
    var limit = opts.pageSize;
    $.ajax({
        type: 'POST',
        url: "/box/device/getBoxLog",
        data: {
            devCode: devCode,
            offset: offset,
            limit: limit
        },
        success: function (data) {
            if (data.total == 0) {
                $('#boxLogTable').bootstrapTable('refreshOptions', {pageNumber: 1});
            }
            $('#boxLogTable').bootstrapTable('load', data);

        },
        error: function () {
            errorSwal("数据获取失败！");
        },
        async: true,
        dataType: "json"
    });
}
function pointGroup(flag) {
    $.ajax({
        type: 'POST',
        url: "/box/device/getBoxGroup",
        async: true,
        dataType: "json",
        success: function (data) {
            if (!flag) {
                $('#boxGroupTable').bootstrapTable('load', data.data);
                $('#GroupManageModal').modal('show');
            }
            var html = '';
            var value = data.data;
            for (var i in value) {
                var obj = value[i];
                html += '<option value="' + obj.id + '">' + obj.name + '</option>';
            }
            html = '<option value="-1">请选择</option>' + html;
            $('#boxGroupOnline, #boxGroupOffline,#updateGroup').html(html);
        },
        error: function () {
            errorSwal("数据获取失败！");
        }
    });
}
function addPointGroup() {
    $('#addBoxGroupName').val('');
    $('#addBoxGroupDesc').val('');
    $('#addBoxGroupModal').modal('show');
}

function editBoxGroup(id, name, descs) {
    $('#editBoxGroupId').val(id);
    $('#editBoxGroupName').val(name);
    $('#editBoxGroupDesc').val(descs);
    $('#editBoxGroupModal').modal('show');
}

function addBoxGroup() {
    var name = $('#addBoxGroupName').val();
    var desc = $('#addBoxGroupDesc').val();
    $.ajax({
        type: 'POST',
        url: "/box/device/addBoxGroup",
        async: true,
        dataType: "json",
        data: {
            name: name,
            desc: desc
        },
        success: function (data) {
            if (data.flag < 0) {
                errorSwal(data.message);
            } else {
                $('#addBoxGroupModal').modal('hide');
                pointGroup();
            }
        },
        error: function () {
            errorSwal("数据获取失败！");
        }
    });
}
function updateBoxGroup() {
    var id = $('#editBoxGroupId').val();
    var name = $('#editBoxGroupName').val();
    var desc = $('#editBoxGroupDesc').val();
    $.ajax({
        type: 'POST',
        url: "/box/device/updateBoxGroup",
        async: true,
        dataType: "json",
        data: {
            id: id,
            name: name,
            desc: desc
        },
        success: function (data) {
            if (data.flag < 0) {
                errorSwal(data.message);
            } else {
                $('#editBoxGroupModal').modal('hide');
                pointGroup();
            }
        },
        error: function () {
            errorSwal("数据获取失败！");
        }
    });
}

function deleteBoxGroup(id) {
    if (!id) {
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
        closeOnConfirm: true,
        closeOnCancel: true
    }, function (isConfirm) {
        if (isConfirm) {
            $.ajax({
                type: 'POST',
                url: "/box/device/deleteBoxGroup",
                async: true,
                dataType: "json",
                data: {
                    id: id
                },
                success: function (data) {
                    if (data.flag < 0) {
                        errorSwal(data.message);
                    } else {
                        pointGroup();
                    }
                },
                error: function () {
                    errorSwal("数据获取失败！");
                }
            });
        }
    });
}

function operateFormatter(value, row, index) {
    var html = [];
    if (row.canEdit == 1) {
        if (row.STATUS == "off") {
            if (row.anttention == 1) {
                html.push('<a class="cancelAnttention" href="javascript:void(0)" title="取消关注" style="color:#cc0000">');
                html.push('<i class="glyphicon glyphicon-star"></i></a>&nbsp;&nbsp;');
            } else {
                html.push('<a class="anttention" href="javascript:void(0)" title="关注" style="color:#000000">');
                html.push('<i class="glyphicon glyphicon-star"></i></a>&nbsp;&nbsp;');
            }
            html.push('<a class="log" href="javascript:void(0)" title="日志" style="color:#f0ad4e">');
            html.push('<i class="glyphicon glyphicon-eye-open"></i>');
            html.push('</a>&nbsp;&nbsp<a class="edit" href="javascript:void(0)" title="编辑" style="color:#f0ad4e">');
            html.push('<i class="glyphicon glyphicon-edit"></i></a>&nbsp;&nbsp;');
        } else {
            if (row.anttention == 1) {
                html.push('<a class="cancelAnttention" href="javascript:void(0)" title="取消关注" style="color:#cc0000">');
                html.push('<i class="glyphicon glyphicon-star"></i></a>&nbsp;&nbsp;');
            } else {
                html.push('<a class="anttention" href="javascript:void(0)" title="关注" style="color:#000000">');
                html.push('<i class="glyphicon glyphicon-star"></i></a>&nbsp;&nbsp;');
            }
            html.push('<a class="log" href="javascript:void(0)" title="日志" style="color:#f0ad4e">');
            html.push('<i class="glyphicon glyphicon-eye-open"></i></a>&nbsp;&nbsp;');
        }
    } else {
        if (row.anttention == 1) {
            html.push('<a href="#" title="关注" style="color:#cc0000">');
            html.push('<i class="glyphicon glyphicon-star"></i></a>&nbsp;&nbsp;');
        } else {
            html.push('<a  href="#" title="取消关注" style="color:#000000">');
            html.push('<i class="glyphicon glyphicon-star"></i></a>&nbsp;&nbsp;');
        }
        html.push('<a class="log" href="javascript:void(0)" title="日志" style="color:#f0ad4e">');
        html.push('<i class="glyphicon glyphicon-eye-open"></i></a>&nbsp;&nbsp;');
    }
    return html.join('');
}
window.operateEvents = {
    /*
     *编辑用户
     */
    'click .edit': function (e, value, row, index) {
        var id = (row.ID);
        if (id != null && id != "") {
            showEditDevinfo(id);
        }
    },
    /*
     *查看设备日志
     */
    'click .log': function (e, value, row, index) {
        var devCode = row.DEV_CODE;
        if (devCode != null && devCode != "") {
            $('#BoxLogModal').modal('show');
            $('#boxLogDevCode').val(devCode);
            showBoxLog();
        }
    },
    /*
     *查看设备日志
     */
    'click .cancelAnttention': function (e, value, row, index) {
        var devCode = row.DEV_CODE;
        if (devCode != null && devCode != "") {
            cancalAnttention(devCode, row);
        }
    },
    /*
     *查看设备日志
     */
    'click .anttention': function (e, value, row, index) {
        var devCode = row.DEV_CODE;
        if (devCode != null && devCode != "") {
            anttention(devCode, row);
        }
    }
};

function onlineQuery() {
    var groupId = $('#boxGroupOnline').val();
    if (!groupId) {
        groupId = -1;
    }
    var anttention = $('#onlineAttention').is(':checked');
    if (anttention) {
        anttention = 1;
    } else {
        anttention == 0;
    }
    var name = $('#onlineName').val();
    var code = $('#onlineCode').val();
    var desc = $('#onlineDesc').val();
    var opts = $("#onlineTable").bootstrapTable('getOptions');
    var offset = ((opts.pageNumber - 1) * opts.pageSize);
    var limit = opts.pageSize;
    $.ajax({
        type: 'POST',
        url: "/box/device/onlineDevice",
        data: {
            groupId: groupId,
            anttention: anttention,
            name: name,
            code: code,
            desc: desc,
            offset: offset,
            limit: limit
        },
        async: true,
        dataType: "json",
        success: function (data) {
            if (data.total == 0) {
                $('#onlineTable').bootstrapTable('refreshOptions', {pageNumber: 1});
            }
            $('#onlineTable').bootstrapTable('load', data);
        },
        error: function () {
            errorSwal("数据获取失败！");
        }
    });
}

function offlineQuery() {
    var groupId = $('#boxGroupOffline').val();
    if (!groupId) {
        groupId = -1;
    }
    var anttention = $('#offlineAttention').is(':checked');
    if (anttention) {
        anttention = 1;
    } else {
        anttention == 0;
    }
    var name = $('#offlineName').val();
    var code = $('#offlineCode').val();
    var desc = $('#offlineDesc').val();
    var opts = $("#offlineTable").bootstrapTable('getOptions');
    var offset = ((opts.pageNumber - 1) * opts.pageSize);
    var limit = opts.pageSize;
    $.ajax({
        type: 'POST',
        url: "/box/device/offlineDevice",
        data: {
            groupId: groupId,
            anttention: anttention,
            name: name,
            code: code,
            desc: desc,
            offset: offset,
            limit: limit
        },
        async: true,
        dataType: "json",
        success: function (data) {
            if (data.total == 0) {
                $('#offlineTable').bootstrapTable('refreshOptions', {pageNumber: 1});
            }
            $('#offlineTable').bootstrapTable('load', data);
        },
        error: function () {
            errorSwal("数据获取失败！");
        }
    });

}

function showEditDevinfo(id) {
    $.ajax({
        type: 'POST',
        url: "/box/device/deviceById",
        data: {
            id: id
        },
        dataType: "json",
        success: function (data) {
            if (data.flag < 0) {
                errorSwal(data.message);
            } else {
                var obj = data.data;
                $("#devcode").val(obj.dev_code);
                $("#disName").val(obj.name);
                $("#updateGroup").val(obj.groupId);
                $("#desc").val(obj.dev_desc);
                $('#editBoxModal').modal('show');
            }
        },
        error: function () {

        }
    });

}

function updateBox() {
    var devcode = $('#devcode').val();
    var name = $('#disName').val();
    var groupId = $('#updateGroup').val();
    var desc = $('#desc').val();
    if (devcode == null || devcode == "") {
        errorSwal('机器码不能为空');
        return;
    }
    if (name == null || name == "") {
        errorSwal('显示名称不能为空');
        return;
    }
    $.ajax({
        type: 'POST',
        url: "/box/device/updateBox",
        data: {
            devcode: devcode,
            name: name,
            groupId: groupId,
            desc: desc
        },
        dataType: "json",
        async: false,
        success: function (data) {
            if (data.flag < 0) {
                errorSwal(data.message);
            } else {
                successSwal('更新成功');
            }
        },
        error: function () {
            errorSwal('更新失败');
        }

    });

}

function cancalAnttention(devCode, row) {
    $.ajax({
        type: 'POST',
        url: "/box/device/cancelAnttentionBox",
        data: {
            devCode: devCode
        },
        dataType: 'json',
        success: function (data) {
            if (data.flag < -1) {
                errorSwal(data.message);
            } else {
                successSwal('取消关注成功');
                row.anttention = 0;
                $('#offlineTable').bootstrapTable('updateRow', row.ID, row);
                $('#onlineTable').bootstrapTable('updateRow', row.ID, row);
            }
        },
        error: function () {
        }
    });
}

function anttention(devCode, row) {
    $.ajax({
        type: 'POST',
        url: "/box/device/anttentionBox",
        data: {
            devCode: devCode
        },
        dataType: 'json',
        success: function (data) {
            if (data.flag < -1) {
                errorSwal(data.message);
            } else {
                successSwal('关注成功');
                row.anttention = 1;
                $('#offlineTable').bootstrapTable('updateRow', row.ID, row);
                $('#onlineTable').bootstrapTable('updateRow', row.ID, row);
            }
        },
        error: function () {
            errorSwal('关注失败');
        }
    });
}

function DiffTimeFormatter(value, row, index) {
    var date1 = new Date();
    var date2 = new Date(value);
    var diffMill = date1.getTime() - date2.getTime();
    return formatSeconds(diffMill / 1000);
}
//格式化在线时长
function formatSeconds(value) {
    var theTime = parseInt(value);// 秒
    var theTime1 = 0;// 分
    var theTime2 = 0;// 小时
    if (theTime > 60) {
        theTime1 = parseInt(theTime / 60);
        theTime = parseInt(theTime % 60);
        if (theTime1 > 60) {
            theTime2 = parseInt(theTime1 / 60);
            theTime1 = parseInt(theTime1 % 60);
        }
    }
    var result = "" + parseInt(theTime) + "秒";
    if (theTime1 > 0) {
        result = "" + parseInt(theTime1) + "分" + result;
    }
    if (theTime2 > 0) {
        result = "" + parseInt(theTime2) + "小时" + result;
    }
    return result;
}

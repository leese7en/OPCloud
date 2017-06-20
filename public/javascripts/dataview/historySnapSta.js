var columnsSnap = [{
    field: 'TM',
    title: '时间',
    align: 'left',
    valign: 'top',
    width: '25%',
    formatter: 'timeFormatter'
}];

var columnsSta = [{
    field: 'ID',
    title: 'ID',
    align: 'center',
    valign: 'middle',
    visible: false,
}, {
    field: 'GN',
    title: '点名',
    align: 'left',
    valign: 'top',
    width: '20%'
}, {
    field: 'ED',
    title: '描述',
    align: 'left',
    valign: 'top',
    width: '16%'
}, {
    field: 'RT',
    title: '类型',
    align: 'left',
    valign: 'top',
    visible: false,
    formatter: 'pointRT',
    width: '10%'
}, {
    field: 'TM',
    title: '时间',
    align: 'left',
    valign: 'top',
    formatter: 'timeFormatter',
    width: '10%'
}, {
    field: 'MAXV',
    title: '最大值/跳变次数',
    align: 'left',
    valign: 'top',
    formatter: 'toDecimalSta',
    width: '8%'
}, {
    field: 'MAXTIME',
    title: '最大值时间',
    align: 'left',
    valign: 'top',
    formatter: 'timeFormatter',
    width: '10%'
}, {
    field: 'MINV',
    title: '最小值/跳变次数',
    align: 'left',
    valign: 'top',
    formatter: 'toDecimalSta',
    width: '8%'
}, {
    field: 'MINTIME',
    title: '最小值时间',
    align: 'left',
    valign: 'top',
    formatter: 'timeFormatter',
    width: '10%'
}, {
    field: 'AVGV',
    title: '平均值',
    align: 'left',
    valign: 'top',
    formatter: 'toDecimalAvg',
    width: '8%'
}, {
    field: 'FLOW',
    title: '流量值/跳变次数',
    align: 'left',
    valign: 'top',
    sortable: false,
    formatter: 'toDecimalSta',
    width: '8%'
}];
$(document).ready(function () {
    toastr.options.positionClass = 'toast-top-center';
    initDate();
    $('#tableSnap').on('page-change.bs.table', function (e, number, size) {
        queryHistorySta();
    });
    $('#tableSnap').bootstrapTable({
        height: getHeight3(),
        columns: columnsSnap,
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

    $('#tableSta').on('page-change.bs.table', function (e, number, size) {
        queryHistorySta();
    });
    $('#tableSta').bootstrapTable({
        height: getHeight3(),
        columns: columnsSta,
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
    //可拖动控件
    // $("#drag").show().Tdrag({
    //     scope: "body"
    // });


    $("#jqxMenu").on('itemclick', function (event) {
        var item = $.trim($(event.args).text());
        switch (item) {
            case "编辑":
                updatePointGroupModal();
                break;
            case "删除":
                deletePointGroup();
                break;
        }
    });
    // disable the default browser's context menu.

    $(document).on('contextmenu', function (e) {
        if ($(e.target).parents('.jqx-tree').length > 0) {
            return false;
        }
        return true;
    });
    //加载jstree的数据
    queryChoosePointList();
    $('#tableSnap').on('page-change.bs.table', function (e, number, size) {
        queryHistorySnap();
    });
});
function isRightClick(event) {
    var rightclick;
    if (!event) var event = window.event;
    if (event.which) rightclick = (event.which == 3);
    else if (event.button) rightclick = (event.button == 2);
    return rightclick;
}
function attachContextMenu() {
    var contextMenu = $("#jqxMenu").jqxMenu({width: '120px', height: '56px', autoOpenPopup: false, mode: 'popup'});
    // open the context menu when the user presses the mouse right button.
    $("#choosePointSelect li").on('mousedown', function (event) {
        var target = $(event.target).parents('li:first')[0];
        var rightClick = isRightClick(event);
        if (rightClick && target != null) {
            $("#choosePointSelect").jqxTree('selectItem', target);
            var item = $("#choosePointSelect").jqxTree('getSelectedItem');
            var scrollTop = $(window).scrollTop();
            var scrollLeft = $(window).scrollLeft();
            var parentId = item.parentId;
            if (parentId == 0) {
                $('#jqxMenu').find('li').removeAttr('disabled').css('color', '#000000').css('pointer-events', 'auto');
            } else {
                $('#jqxMenu ').find('li:first').attr('disabled', 'disabled').css('pointer-events', 'none').css('color', '#A0A0A0');
            }
            contextMenu.jqxMenu('open', parseInt(event.clientX) + 5 + scrollLeft, parseInt(event.clientY) + 5 + scrollTop);
            return false;
        }
    });

}
function refreshPointGroupData(data) {
    var source = {
        dataType: "json",
        dataFields: [{
            name: 'ID',
            type: 'number'
        }, {
            name: 'NAME',
            type: 'string'
        }, {
            name: 'parentId',
            type: 'number'
        }, {
            name: 'value'
        }],
        id: 'ID',
        localData: data
    };
    //创建data配适器
    var dataAdapter = new $.jqx.dataAdapter(source);
    //perform Data Binding
    dataAdapter.dataBind();
    // 对应记录
    var records = dataAdapter.getRecordsHierarchy('ID', 'parentId', 'items', [{name: 'NAME', map: 'label'}, {name: 'ID', map: 'id'}]);
    $('#choosePointSelect').jqxTree({source: records, width: '400px', height: '300px', checkboxes: true});
    /**
     * 监听 选择事件
     */
    $('#choosePointSelect').on('checkChange', function (event) {
        var element = args.element;
        var checked = args.checked;
        var children = $("#choosePointSelect").jqxTree('getChildrenItems', element);
        if (children.length < 1) {
            return;
        }
        if (checked) {
            for (var i in children) {
                $('#choosePointSelect').jqxTree('checkItem', children[i], true);
            }
        } else {
            for (var i in children) {
                $('#choosePointSelect').jqxTree('checkItem', children[i], false);
            }
        }
    });
    $('.jqx-widget .jqx-checkbox').css('margin-top', '4px');
    attachContextMenu();

}
/**
 * 初始化日期控件
 */
function initDate() {
    var nowtime = new Date().getTime();
    $('#beginDateSnap').find('input').val(utils.dateFormat(nowtime - 3600000 * 1, 'yyyy-MM-dd HH:mm:ss'));
    $('#endDateSnap').find('input').val(utils.dateFormat(nowtime, 'yyyy-MM-dd HH:mm:ss'));
    $('#beginDateSta').find('input').val(utils.dateFormat(nowtime - 3600000 * 1, 'yyyy-MM-dd HH:mm:ss'));
    $('#endDateSta').find('input').val(utils.dateFormat(nowtime, 'yyyy-MM-dd HH:mm:ss'));
    $('.form_datetime').datetimepicker({
        language: 'zh-CN',
        format: 'yyyy-mm-dd hh:ii:ss',
        autoclose: true,
        startView: 'day',
        minView: 'hour',
        todayHighlight: true,
        todayBtn: true,
        forceParse: false,
        allowInputToggle: true,
        minuteStep: 1
    });

    $("#snapDistance").select({
        theme: "classic"
    }).on('changed.bs.select', function (e) {
        var time = e.currentTarget;
        var dis = time.value;
        var endTime = $('#endDateSnap').find('input').val();
        if (!endTime) {
            endTime = utils.dateFormat(new Date(), 'yyyy-MM-dd HH:mm:ss');
        }
        var end = Date.parse(endTime.replace(/-/g, "/")) / 1000;
        var begin = end - dis;
        $('#beginDateSnap').find('input').val(utils.dateFormat(new Date(begin * 1000), 'yyyy-MM-dd HH:mm:ss'));
        $('#endDateSnap').find('input').val(utils.dateFormat(new Date(end * 1000), 'yyyy-MM-dd HH:mm:ss'));
    });

    $("#staDistance").select({
        theme: "classic"
    }).on('changed.bs.select', function (e) {
        var time = e.currentTarget;
        var dis = time.value;
        var endTime = $('#endDateSta').find('input').val();
        if (!endTime) {
            endTime = utils.dateFormat(new Date(), 'yyyy-MM-dd HH:mm:ss');
        }
        var end = Date.parse(endTime.replace(/-/g, "/")) / 1000;
        var begin = end - dis;
        $('#beginDateSta').find('input').val(utils.dateFormat(new Date(begin * 1000), 'yyyy-MM-dd HH:mm:ss'));
        $('#endDateSta').find('input').val(utils.dateFormat(new Date(end * 1000), 'yyyy-MM-dd HH:mm:ss'));
    });
}

/**
 查询快照
 */
function queryHistorySnap() {
    var beginDate = $("#beginDateSnap").find('input').val();
    var endDate = $("#endDateSnap").find('input').val();
    var opts = $("#tableSnap").bootstrapTable('getOptions');
    var interval = $('#interval').val();
    var intervalType = $('#intervalType').selectpicker('val');
    var hisType = $('#hisType').selectpicker('val');
    if (hisType != 'RAW') {
        switch (intervalType) {
            case 's':
                break;
            case 'm':
                interval = interval * 60;
                break;
            case 'h':
                interval = interval * 3600;
                break;
            case 'd':
                interval = interval * 86400;
                break;
            default:
                break;
        }
        interval = parseInt(interval);
        if (hisType != 'SPAN') {
            if (!interval || interval < 2) {
                toastr.warning('非等间距时，间隔时间不能小于2秒');
                return;
            }
        }
    } else if (hisType == 'RAW') {
        $('#interval').val('');
    }
    var ids = getPointGroupSelected();
    if (!ids || ids.length < 1) {
        toastr.warning('请选择点');
        return;
    }
    var pageData = {
        'offset': ((opts.pageNumber - 1) * opts.pageSize),
        'limit': opts.pageSize,
        'beginDate': beginDate,
        'endDate': endDate,
        'pointIds': ids,
        'hisType': hisType,
        'interval': interval
    }
    socket.emit('historySnapshot', pageData);
}

function getFormatter(hisType, RT) {
    switch (RT) {
        case 1:
            if (hisType == 'SPAN') {
                return 'toInteger';
            } else {
                return 'toNotNumber';
            }
        case 2:
        case 3:
            if (hisType == 'FLOW' || hisType == 'AVGV') {
                return 'toDecimal';
            } else {
                return 'toInteger';
            }
        default:
            return 'toDecimal';
    }
}
/*格式化显示动态列*/
function formatterSnapData(value) {
    var data = [];
    var columnsSnap = [{
        field: 'TM',
        title: '时间',
        align: 'left',
        valign: 'top',
        width: '20%',
        formatter: 'timeFormatter', //定义在systemTable.hbs中
    }];

    var columnsKey = [];
    var pointNames = getPointNameGroupSelected();
    var length = pointNames.length
    var hisType = $('#hisType').selectpicker('val');
    var points = value.data;
    for (var i = 0; i < length; i++) {
        var obj = pointNames[i];
        var RT = 0;
        for (var j  in  points) {
            if (points[j].URI == obj[1]) {
                RT = points[j].POINT_TYPE;
                break;
            }
        }
        var formatter = getFormatter(hisType, RT);
        var key = obj[1] + '_' + obj[0];
        if (columnsKey.indexOf(key) < 0) {
            columnsKey.push(key);
            var column = {
                field: key,
                title: obj[1],
                align: 'left',
                valign: 'top',
                sortable: false,
                formatter: formatter,
                width: '15%'
            };
            columnsSnap.push(column);
        }
    }
    var keys = [];
    var rows = value.rows;
    var length = rows.length;
    for (var i = 0; i < length; i++) {
        var obj = rows[i];
        var key = obj.GN + '_' + obj.ID;
        var TM = obj.TM;
        if (keys.indexOf(TM) > -1) {
            for (var j in data) {
                if (data[j].TM == TM) {
                    data[j][key] = obj.AV;
                    break;
                }
            }
        } else {
            var oo = {};
            keys.push(TM);
            oo.TM = TM;
            oo[key] = obj.AV;
            data.push(oo);
        }
    }
    var o = {};
    o.total = value.total;
    o.rows = data;
    $('#tableSnap').bootstrapTable('refreshOptions', {
        columns: columnsSnap,
    });
    $('#tableSnap').bootstrapTable('load', o);

}

/*点组显示框显示收起操作*/
function putAway() {
    var display = $('#dragGroupPoint').css('display');
    if (display == 'none') {
        $('#dragGroupPoint').show();
        $('#putAway').html('收起');
    } else {
        $('#dragGroupPoint').hide();
        $('#putAway').html('展开');
    }
}

/*查询统计信息*/
function queryHistorySta() {
    var beginDate = $("#beginDateSta").find('input').val();
    var endDate = $("#endDateSta").find('input').val();
    var opts = $("#tableSta").bootstrapTable('getOptions');
    var ids = getPointGroupSelected();
    if (!ids || ids.length < 1) {
        toastr.warning('请选择点');
        return;
    }
    var pageData = {
        'offset': ((opts.pageNumber - 1) * opts.pageSize),
        'limit': opts.pageSize,
        'beginDate': beginDate,
        'endDate': endDate,
        'pointIds': ids
    }
    socket.emit('historyStatistics', pageData);
}

//动态加载jstree的数据
function queryChoosePointList() {
    socket.emit('jsTreePointData');
}


/**获取选中选中的节点**/
function getPointGroupSelected() {
    var pointIds = [];
    var nodes = $("#choosePointSelect").jqxTree("getCheckedItems"); //使用get_checked方法
    var size = nodes.length;
    for (var i = 0; i < size; i++) {
        var node = nodes[i];
        if (node.parentId != 0) {
            pointIds.push(parseInt(node.value));
        }
    }
    return pointIds;
}
/** 获取选中点的点名**/
function getPointNameGroupSelected() {
    var pointNames = [];
    var nodes = $("#choosePointSelect").jqxTree("getCheckedItems"); //使用get_checked方法
    var size = nodes.length;
    for (var i = 0; i < size; i++) {
        var node = nodes[i];
        if (node.parentId != 0) {
            pointNames.push([parseInt(node.value), node.label]);
        }
    }
    return pointNames;
}

function addPointGroupModal() {
    // 弹出添加框
    $('#addPointGroupModal').modal({
        backdrop: 'static'
    });
}

function closeAddPointGroupModal() {
    $('#addPointGroupModal').modal('hide');
    $('#addPointGroupName').val('');
    $('#addPointGroupDesc').val('');
}

function addPointGroup() {
    var pointGroupName = $('#addPointGroupName').val();
    if (!pointGroupName) {
        toastr.warning('点组名称不能为空');
        return;
    }
    var pointGroupDesc = $('#addPointGroupDesc').val();
    $.ajax({
        type: 'post',
        url: '/dataview/historySnapSta/addPointGroup',
        data: {
            groupName: pointGroupName,
            description: pointGroupDesc
        },
        dataType: 'json',
        success: function (data) {
            if (data.flag < 0) {
                toastr.error(data.message);
                return;
            } else {
                toastr.success('添加点组成功');
                closeAddPointGroupModal();
                queryChoosePointList();
            }
        },
        error: function () {
            toastr.error('添加点组失败');
        }
    });
}

//跟新点组信息
function updatePointGroupModal() {
    var item = $("#choosePointSelect").jqxTree('getSelectedItem');
    var updatePointGroupId = item.id;
    //加载该点组信息
    $.ajax({
        type: 'post',
        url: '/dataview/historySnapSta/getPointGroupById',
        data: {
            updatePointGroupId: updatePointGroupId
        },
        dataType: 'json',
        success: function (data) {
            if (data.flag < 0) {
                toastr.error(data.message);
                return;
            } else {
                var data = data.data;
                // 弹出添加框
                $('#updatePointGroupModal').modal({
                    backdrop: 'static'
                });
                $('#updatePointGroupName').val(data.GROUP_NAME);
                $('#updatePointGroupDesc').val(data.DESCRIPTION);
            }
        },
        error: function () {
            toastr.error('编辑点组失败');
        }
    });
}

function closeUpdatePointGroupModal() {
    $('#updatePointGroupModal').modal('hide');
    $('#updatePointGroupName').val('');
    $('#updatePointGroupDesc').val('');
}

function updatePointGroup() {
    var item = $("#choosePointSelect").jqxTree('getSelectedItem');
    var updatePointGroupId = item.id;
    var pointGroupName = $('#updatePointGroupName').val();
    if (!pointGroupName) {
        toastr.warning('点组名称不能为空');
        return;
    }
    var pointGroupDesc = $('#updatePointGroupDesc').val();
    $.ajax({
        type: 'post',
        url: '/dataview/historySnapSta/updatePointGroup',
        data: {
            updatePointGroupId: updatePointGroupId,
            pointGroupName: pointGroupName,
            pointGroupDesc: pointGroupDesc
        },
        dataType: 'json',
        success: function (data) {
            if (data.flag < 0) {
                toastr.error(data.message);
                return;
            } else {
                toastr.success('编辑点组成功');
                closeUpdatePointGroupModal();
                $('#choosePointSelect').jqxTree('updateItem', item, {label: pointGroupName});
            }

        },
        error: function () {
            toastr.error('编辑点组失败');
        }
    });
}

function deletePointGroup() {
    var item = $("#choosePointSelect").jqxTree('getSelectedItem');
    var parent = item.parentId;
    var operatorId = item.id;
    var isGroup = 1;
    if (parent != 0) {
        isGroup = 0;
    }
    if (isGroup == 1) {
        swal({
            title: "删除点组?",
            text: "你确定要删除这个点组吗？",
            type: "warning",
            showCancelButton: true,
            confirmButtonColor: '#DD6B55',
            confirmButtonText: '确定删除',
            cancelButtonText: "取消",
            closeOnConfirm: false,
            closeOnCancel: true
        }, function (isConfirm) {
            if (isConfirm) {
                $.ajax({
                    type: 'post',
                    url: '/dataview/historySnapSta/deletePointGroup',
                    data: {
                        groupId: operatorId,
                        isGroup: isGroup
                    },
                    dataType: 'json',
                    success: function (data) {
                        var flag = data.flag;
                        if (flag == 0) {
                            swal('成功', '删除成功', 'success');
                            $('#choosePointSelect').jqxTree('removeItem', item);
                            attachContextMenu();
                        } else {
                            swal('错误', data.message, 'error');
                        }
                    },
                    error: function () {
                        swal('失败', '删除失败', "error");
                    }
                });
            } else {
                swal('取消', '点组没有删除', 'error');
            }
        });
    } else {
        swal({
            title: "删除测点?",
            text: "你确定要删除这个测点吗？",
            type: "warning",
            showCancelButton: true,
            confirmButtonColor: '#DD6B55',
            confirmButtonText: '确定删除',
            cancelButtonText: "取消",
            closeOnConfirm: false,
            closeOnCancel: true
        }, function (isConfirm) {
            if (isConfirm) {
                $.ajax({
                    type: 'post',
                    url: '/dataview/historySnapSta/deleteGroupPoint',
                    data: {
                        groupId: parent,
                        pointId: operatorId
                    },
                    dataType: 'json',
                    success: function (data) {
                        var flag = data.flag;
                        if (flag == 0) {
                            swal('成功', '删除成功', 'success');
                            $('#choosePointSelect').jqxTree('removeItem', item);
                            attachContextMenu();
                        } else {
                            swal('错误', data.message, 'error');
                        }
                    },
                    error: function () {
                        swal('失败', '删除失败', "error");
                    }
                });
            } else {
                swal('取消', '点组没有删除', 'error');
            }
        });
    }
}
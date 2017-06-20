var fields = [{
    field: 'id',
    title: 'ID',
    align: 'center',
    valign: 'middle',
    visible: false,
    sortable: true
}, {
    field: 'name',
    title: '任务名称',
    align: 'center',
    valign: 'middle',
    sortable: true
}, {
    field: 'description',
    title: '任务描述',
    align: 'center',
    valign: 'middle',
    sortable: true
}, {
    field: 'taskType',
    title: '任务类型',
    align: 'left',
    valign: 'top',
    formatter: 'formatTaskType',
    sortable: true
}, {
    field: 'modelStatus',
    title: '状态',
    align: 'left',
    valign: 'top',
    formatter: 'formatTaskStatus',
    sortable: true
}, {
    field: 'jobStatus',
    title: '调度状态',
    align: 'left',
    visible: false,
    valign: 'top',
    sortable: true
}, {
    field: 'last_modelStatus',
    title: '最近运行状态',
    align: 'left',
    valign: 'top',
    formatter: 'formatLastTaskStatus',
    sortable: true
}, {
    field: 'last_jobStatus',
    title: '最近调度运行状态',
    visible: false,
    align: 'left',
    valign: 'top',
    sortable: true
}, {
    field: 'run_num',
    title: '运行次数',
    align: 'left',
    valign: 'top',
    sortable: true
}, {
    field: 'create_time',
    title: '创建日期',
    align: 'left',
    valign: 'top',
    sortable: true
}, {
    field: 'update_time',
    title: '更新日期',
    align: 'left',
    valign: 'top',
    sortable: true
}, {
    field: 'operate',
    title: '操作',
    align: 'center',
    valign: 'middle',
    formatter: 'operateFormatter'
}];

//标记是什么类型的 任务
var taskFlag = 0;
var fileFields = [{
    field: 'state',
    checkbox: true
}, {
    field: 'id',
    title: 'ID',
    align: 'center',
    valign: 'middle',
    visible: false,
    sortable: false,
}, {
    field: 'name',
    title: '名称',
    align: 'center',
    valign: 'middle',
    sortable: false,
}, {
    field: 'path',
    title: '路径',
    align: 'center',
    valign: 'middle',
    sortable: false
}];


var taskRunFields = [{
    field: 'id',
    title: 'ID',
    align: 'center',
    valign: 'middle',
    visible: false,
    sortable: false,
}, {
    field: 'beginTime',
    title: '开始时间',
    align: 'center',
    valign: 'middle',
    sortable: false,
}, {
    field: 'endTime',
    title: '结束时间',
    align: 'center',
    valign: 'middle',
    sortable: false
}, {
    field: 'sliceNum',
    title: '分片数量',
    align: 'center',
    valign: 'middle',
    sortable: false,
}, {
    field: 'modelStatus',
    title: '状态',
    align: 'center',
    formatter: 'formatTaskStatus',
    valign: 'middle',
    sortable: false
}, {
    field: 'jobStatus',
    title: '调度状态',
    align: 'center',
    visible: false,
    valign: 'middle',
    sortable: false
}, {
    field: 'createTime',
    title: '创建时间',
    align: 'center',
    valign: 'middle',
    sortable: false
}];

var taskRunLogFields = [{
    field: 'id',
    title: 'ID',
    align: 'center',
    valign: 'middle',
    visible: false,
    sortable: false,
}, {
    field: 'modelStatus',
    title: '状态',
    align: 'center',
    formatter: 'formatTaskStatus',
    valign: 'middle',
    sortable: false,
}, {
    field: 'jobStatus',
    title: '调度状态',
    align: 'center',
    visible: false,
    valign: 'middle',
    sortable: false,
}, {
    field: 'message',
    title: '信息',
    align: 'center',
    valign: 'middle',
    sortable: false
}, {
    field: 'logpath',
    title: '日志',
    align: 'center',
    valign: 'middle',
    sortable: false,
}, {
    field: 'createTime',
    title: '时间',
    align: 'center',
    valign: 'middle',
    sortable: false
}];

function initSocketOn(socket) {
    socket.on('model/startTask', function (data) {
        var flag = data.flag;
        if (flag < 0) {
            errorSwal(data.message);
            return;
        } else {
            successSwal('启动任务成功');
            taskQuery();
        }
    });
    socket.on('model/startTimerTask', function (data) {
        var flag = data.flag;
        if (flag < 0) {
            errorSwal(data.message);
            return;
        } else {
            successSwal('启动定时任务成功');
            taskQuery();
        }
    });
}

$(document).ready(function () {
    toastr.options = {
        "closeButton": true,
        "debug": false,
        "progressBar": false,
        "positionClass": "toast-top-center",
        "onclick": null,
        "showDuration": "300",
        "hideDuration": "1000",
        "timeOut": "1000",
        "extendedTimeOut": "1000",
        "showEasing": "swing",
        "hideEasing": "linear",
        "showMethod": "fadeIn",
        "hideMethod": "fadeOut"
    };

    $('#taskTable').on('page-change.bs.table', function (e, number, size) {
        taskQuery();
    });
    $('#taskTable').on('dbl-click-row.bs.table', function (row, element) {
        getTaskRunDetail(element.id);
    });
    $('#taskTable').bootstrapTable('destroy');
    $('#taskTable').bootstrapTable({
        height: getHeight(),
        columns: fields,
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
    $('#taskFileTable').bootstrapTable('destroy');
    $('#taskFileTable').bootstrapTable({
        height: 250,
        columns: fileFields,
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


////任务运行明细情况
    $('#taskRunTable').on('page-change.bs.table', function (e, number, size) {
        getTaskRunDetail();
    });
    $('#taskRunTable').on('dbl-click-row.bs.table', function (row, element) {
        getTaskRunLog(element.id);
    });
    $('#taskRunTable').bootstrapTable('destroy');
    $('#taskRunTable').bootstrapTable({
        height: 300,
        columns: taskRunFields,
        striped: true, //是否显示行间隔色
        cache: false, //是否使用缓存，默认为true，所以一般情况下需要设置一下这个属性（*）
        pagination: true, //是否显示分页（*）
        sortable: true, //是否启用排序
        sortOrder: "asc", //排序方式
        sidePagination: "server", //分页方式：client客户端分页，server服务端分页（*）
        pageNumber: 1, //初始化加载第一页，默认第一页
        pageSize: 10, //每页的记录行数（*）
        pageList: [10, 25, 50, 100, 500], //可供选择的每页的行数（*）
        showColumns: false, //是否显示所有的列
        minimumCountColumns: 2, //最少允许的列数
        clickToSelect: true, //是否启用点击选中行
        idField: "id", //每一行的唯一标识，一般为主键列
        showToggle: false, //是否显示详细视图和列表视图的切换按钮
        showExport: false, //显示导出按钮
        exportDataType: "basic", //导出类型
        onLoadSuccess: function () {
        },
        onLoadError: function () {
            toastr.error('表格初始化失败');
        }
    });
////任务运行明细日志情况
    $('#taskRunLogTable').bootstrapTable('destroy');
    $('#taskRunLogTable').bootstrapTable({
        height: 250,
        columns: taskRunLogFields,
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
    initDate();
    initSelected();
    taskQuery();
});
/**
 * 初始化日期控件
 */
function initDate() {
    var nowtime = new Date().getTime();
    $('#imBeginTime').find('input').val(utils.dateFormat(nowtime - 3600000 * 24, 'yyyy-MM-dd HH:mm:ss'));
    $('#imEndTime').find('input').val(utils.dateFormat(nowtime, 'yyyy-MM-dd HH:mm:ss'));
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
}

/**
 * 获取任务列表
 */
function taskQuery() {
    var taskName = $('#taskNameQuery').val();
    var taskDesc = $('#taskDescQuery').val();
    var taskStatus = $('#taskStatus').selectpicker('val');
    var opts = $("#taskTable").bootstrapTable('getOptions');
    var offset = ((opts.pageNumber - 1) * opts.pageSize);
    var limit = opts.pageSize;
    $.ajax({
        type: 'post',
        url: '/model/task/queryTask',
        dataType: 'json',
        data: {
            taskName: taskName,
            taskDesc: taskDesc,
            taskStatus: taskStatus,
            limit: limit,
            offset: offset
        },
        success: function (data) {
            var flag = data.flag;
            if (flag < 0) {
                toastr.warning(data.message);
                return;
            } else {
                $('#taskTable').bootstrapTable('load', data.data);
            }
        },
        error: function () {
            toastr.error('获取任务信息失败');
        }
    });
}
/**
 * 打开创建任务modal
 */
function createTaskModal() {
    $('#addTaskModal').modal({
        backdrop: 'static'
    });
    $('#timerTypeWeek').find('input').attr('readonly', 'readonly');
    $('#timerTypeMonth').find('input').attr('readonly', 'readonly');
    $('#timerTypeCustomize').find('input').attr('readonly', 'readonly');
    $('#timerTypeDay').find('input').removeAttr('readonly');
    $('#weekDay').attr("disabled", "disabled");
}
/**
 * 关闭任务modal
 */
function closeTaskModal() {
    $('#addTaskModal').modal('hide');
}
/*定时类型选择*/
function initSelected() {
    $('#timerType').on('hide.bs.select', function (e) {
        var type = $('#timerType').selectpicker('val');
        switch (type) {
            case '1':
                $('#timerTypeWeek').find('input').attr('readonly', 'readonly');
                $('#timerTypeMonth').find('input').attr('readonly', 'readonly');
                $('#timerTypeCustomize').find('input').attr('readonly', 'readonly');
                $('#timerTypeDay').find('input').removeAttr('readonly');
                $('#weekDay').attr("disabled", "disabled");
                break;
            case '2':
                $('#timerTypeDay').find('input').attr('readonly', 'readonly');
                $('#timerTypeMonth').find('input').attr('readonly', 'readonly');
                $('#timerTypeCustomize').find('input').attr('readonly', 'readonly');
                $('#timerTypeWeek').find('input').removeAttr('readonly');
                $('#weekDay').removeAttr("disabled");
                break;
            case '3':
                $('#timerTypeWeek').find('input').attr('readonly', 'readonly');
                $('#timerTypeDay').find('input').attr('readonly', 'readonly');
                $('#timerTypeCustomize').find('input').attr('readonly', 'readonly');
                $('#timerTypeMonth').find('input').removeAttr('readonly');
                $('#weekDay').attr("disabled", "disabled");
                break;
            case '4':
                $('#timerTypeWeek').find('input').attr('readonly', 'readonly');
                $('#timerTypeMonth').find('input').attr('readonly', 'readonly');
                $('#timerTypeDay').find('input').attr('readonly', 'readonly');
                $('#timerTypeCustomize').find('input').removeAttr('readonly');
                $('#weekDay').attr("disabled", "disabled");
                break;
            default:
        }
    });
    $('#editTimerType').on('hide.bs.select', function (e) {
        var type = $('#editTimerType').selectpicker('val');
        switch (type) {
            case '1':
                $('#editTimerTypeWeek').find('input').attr('readonly', 'readonly');
                $('#editTimerTypeMonth').find('input').attr('readonly', 'readonly');
                $('#editTimerTypeCustomize').find('input').attr('readonly', 'readonly');
                $('#editTimerTypeDay').find('input').removeAttr('readonly');
                $('#editWeekDay').attr("disabled", "disabled");
                break;
            case '2':
                $('#editTimerTypeDay').find('input').attr('readonly', 'readonly');
                $('#editTimerTypeMonth').find('input').attr('readonly', 'readonly');
                $('#editTimerTypeCustomize').find('input').attr('readonly', 'readonly');
                $('#editTimerTypeWeek').find('input').removeAttr('readonly');
                $('#editWeekDay').removeAttr("disabled");
                break;
            case '3':
                $('#editTimerTypeWeek').find('input').attr('readonly', 'readonly');
                $('#editTimerTypeDay').find('input').attr('readonly', 'readonly');
                $('#editTimerTypeCustomize').find('input').attr('readonly', 'readonly');
                $('#editTimerTypeMonth').find('input').removeAttr('readonly');
                $('#editWeekDay').attr("disabled", "disabled");
                break;
            case '4':
                $('#editTimerTypeWeek').find('input').attr('readonly', 'readonly');
                $('#editTimerTypeMonth').find('input').attr('readonly', 'readonly');
                $('#editTimerTypeDay').find('input').attr('readonly', 'readonly');
                $('#editTimerTypeCustomize').find('input').removeAttr('readonly');
                $('#editWeekDay').attr("disabled", "disabled");
                break;
            default:
        }
    });
}
/**
 * 创建任务列表
 */
function createTask() {
    var taskName = $('#taskName').val();
    if (!taskName) {
        errorSwal('任务名称不能为空');
        return;
    }
    var taskDesc = $('#taskDesc').val();
    var taskBeginTime = $('#imBeginTime').find('input').val();
    var taskEndTime = $('#imEndTime').find('input').val();
    if (!taskBeginTime || !taskEndTime) {
        errorSwal('开始时间或结束时间不能为空');
        return;
    }
    var taskSlice = $('#taskSlice').val();
    if (taskSlice < 1) {
        errorSwal('分片数量不能小于1');
        return;
    }
    var files = $('#taskFileIds').val();
    if (!files) {
        errorSwal('作业文件不能为空');
        return;
    }
    $.ajax({
        url: '/model/task/createTask',
        type: 'post',
        data: {
            taskName: taskName,
            taskDesc: taskDesc,
            taskBeginTime: taskBeginTime,
            taskEndTime: taskEndTime,
            taskSlice: taskSlice,
            taskFiles: files
        },
        dataType: 'json',
        success: function (data) {
            var flag = data.flag;
            if (flag < 0) {
                errorSwal(data.message);
                return;
            } else {
                successSwal('创建任务成功');
            }
        },
        error: function (data) {
            errorSwal();
        }
    });
}

/**
 * 创建任务列表
 */
function createTimerTask() {
    var taskName = $('#timerName').val();
    if (!taskName) {
        errorSwal('任务名称不能为空');
        return;
    }
    var taskDesc = $('#timerDesc').val();
    var cutoffDay = parseInt($('#timerCutOffDay').val());
    var cutoffHour = parseInt($('#timerCutOffDay').val());
    var cutoffMinute = parseInt($('#timerCutOffMinute').val());
    var cutoffTime = cutoffDay * 1440 + cutoffHour * 60 + cutoffMinute;

    if (cutoffTime < 1) {
        errorSwal('截止时间不能小于1');
        return;
    }

    var durtionDay = parseInt($('#durtionDay').val());
    var durtionHour = parseInt($('#durtionHour').val());
    var durtionMinute = parseInt($('#durtionMinute').val());

    var durtion = durtionDay * 1440 + durtionHour * 60 + durtionMinute;
    if (durtion < 1) {
        errorSwal('取数时长不能小于1');
        return;
    }
    var timerSlice = $('#timerSlice').val();
    if (timerSlice < 1) {
        errorSwal('分片数量不能小于1');
        return;
    }
    var timerFiles = $('#timerFileIds').val();
    if (!timerFiles) {
        errorSwal('作业文件不能为空');
        return;
    }
    var taskType = $('#taskType').selectpicker('val');
    var runnum = $('#timerRunnum').val();
    var timerType = $('#timerType').selectpicker('val');
    var day = 0;
    var hour = 0;
    var minute = 0;
    switch (timerType) {
        case '1':
            hour = $('#dayHour').val();
            minute = $('#dayMinute').val();
            break;
        case '2':
            hour = $('#weekHour').val();
            minute = $('#weekMinute').val();
            break;
        case '3':
            day = $('#monthDay').val();
            hour = $('#monthHour').val();
            minute = $('#monthMinute').val();
            if (day > 28) {
                toastr.warning('部分月份可能会执行不到该数据');
            }
            break;
        case '4':
            day = $('#timerDay').val();
            hour = $('#timerHour').val();
            minute = $('#timerMinute').val();
            if ((day * 1440 + hour * 60 + minute) < 0) {
                errorSwal('时间间隔不能小于30分钟');
                return;
            }
            break;
        default:
            hour = $('#dayHour').val();
            minute = $('#dayMinute').val();
            break;
    }
    $.ajax({
        url: '/model/task/createTimerTask',
        type: 'post',
        data: {
            taskName: taskName,
            taskDesc: taskDesc,
            cutoffTime: cutoffTime,
            durtion: durtion,
            timerSlice: timerSlice,
            timerFiles: timerFiles,
            taskType: taskType,
            runnum: runnum,
            timerType: timerType,
            day: day,
            hour: hour,
            minute: minute
        },
        dataType: 'json',
        success: function (data) {
            var flag = data.flag;
            if (flag < 0) {
                errorSwal(data.message);
                return;
            } else {
                successSwal('创建任务成功');
            }
        },
        error: function (data) {
            errorSwal();
        }
    });
}


function getTaskFile(flag) {
    taskFlag = flag;
    var modelFileIds = ''
    if (flag == 'editTask') {
        modelFileIds = $('#editTaskFileIds').val();
    } else if (flag == 'editTimer') {
        modelFileIds = $('#editTimerFileIds').val();
    }
    $.ajax({
        type: 'post',
        url: '/system/fileManage/getModelFile',
        data: {
            modelFileIds: modelFileIds
        },
        dataType: 'json',
        success: function (data) {
            $('#taskFileTable').bootstrapTable('load', data);
            $('#taskFileSelectedModal').modal({
                backdrop: 'static'
            });
        },
        error: function (value) {
            toastr.error('获取信息失败');
        }
    });
}
/**
 * 确认文件窗口
 */
function confirmTaskFile() {
    var rows = $('#taskFileTable').bootstrapTable('getSelections');
    if (rows == undefined || rows == null || rows == "") {
        errorSwal("请选择要关联的行！");
        return;
    }
    var modelFileIds = '';
    var modelNames = '';
    for (var i = 0; i < rows.length; i++) {
        modelFileIds += rows[i].id;
        modelNames += rows[i].name;
        if (rows[i + 1]) {
            modelFileIds += ',';
            modelNames += ',';
        }
    }
    if (!modelFileIds) {
        errorSwal('请选Mode文件');
        return;
    }
    if (taskFlag == 'createTask') {
        $('#taskFileIds').val(modelFileIds);
        $('#taskFiles').val(modelNames)
    } else if (taskFlag == 'createTimer') {
        $('#timerFileIds').val(modelFileIds);
        $('#timerFiles').val(modelNames)
    } else if (taskFlag == 'editTask') {
        $('#editTaskFileIds').val(modelFileIds);
        $('#editTaskFiles').val(modelNames)
    } else if (taskFlag == 'editTimer') {
        $('#editTimerFileIds').val(modelFileIds);
        $('#editTimerFiles').val(modelNames)
    }
    closeTaskFileModal();
}
/**
 * 关闭任务model file文件选择窗口
 */
function closeTaskFileModal() {
    $("#taskFileSelectedModal").modal('hide');
}

/**
 * 查看运行细节
 * @param taskId
 */
function getTaskRunDetail(taskId) {
    var opts = $("#taskRunTable").bootstrapTable('getOptions');
    var offset = ((opts.pageNumber - 1) * opts.pageSize);
    var limit = opts.pageSize;
    $.ajax({
        type: 'post',
        url: '/model/task/getRunTaskDetail',
        data: {
            taskId: taskId,
            offset: offset,
            limit: limit
        },
        dataType: 'json',
        success: function (data) {
            $('#taskRunTable').bootstrapTable('load', data);
            $('#taskRunModal').modal({
                backdrop: 'static'
            });
        },
        error: function (value) {
            toastr.error('获取信息失败');
        }
    });
}

/**
 * 关闭任务 运行明细窗口
 */
function closeTaskRunModal() {
    $("#taskRunModal").modal('hide');
}

/**
 * 查看运行日志细节
 * @param taskId
 */
function getTaskRunLog(taskId) {
    $.ajax({
        type: 'post',
        url: '/model/task/getRunTaskLog',
        data: {
            taskId: taskId
        },
        dataType: 'json',
        success: function (data) {
            $('#taskRunLogTable').bootstrapTable('load', data);
            $('#taskRunLogModal').modal({
                backdrop: 'static'
            });
        },
        error: function (value) {
            toastr.error('获取信息失败');
        }
    });
}

/**
 * 关闭任务 运行明细窗口
 */
function closeTaskLogRunModal() {
    $("#taskRunLogModal").modal('hide');
}


/**
 * 获取高度
 * @returns {number}
 */
function getHeight() {
    var neg = $('.main-header').outerHeight() + $('.main-footer').outerHeight();
    return $(window).height() - $('h1').outerHeight(true) - neg - 110;
}

//日期格式化
function timeFormatter(value, row, index) {
    if (value) {
        return utils.dateFormat(value, utils.formatString);
    }
}

/**
 * 显示删除和删除操作
 */
function operateFormatter(value, row, index) {
    var html = '';
    var taskType = row.taskType;
    var rumNum = row.run_num;
    var status = row.modelStatus;
    if (taskType == 0) {
        if (status == 2) {
            html += '<a class = "glyphicon glyphicon-stop"' +
                'onclick="stopTask(\'' + row.id + '\')" ' +
                'style="color:red; cursor:pointer" title="停止">'
        } else {
            if (rumNum < 1) {
                html += '<a class = "glyphicon glyphicon-play-circle"' +
                    'onclick="startImTask(\'' + row.id + '\')" ' +
                    'style="color:green; cursor:pointer" title="启动">'
            } else {
                html += '<a class = "glyphicon glyphicon-repeat"' +
                    'onclick="startImTask(\'' + row.id + '\')" ' +
                    'style="color:green; cursor:pointer" title="再次启动">'
            }
        }
        html += '&nbsp;<a class="glyphicon glyphicon-edit" ' +
            'onclick="editTask(\'' + row.id + '\')" ' +
            'style="color:blue;cursor:pointer" title="编辑"></a>'
        html += '&nbsp;&nbsp;&nbsp;<a class="glyphicon glyphicon-remove" ' +
            'onclick="deleteImTask(\'' + row.id + '\')" ' +
            'style=" cursor:pointer" title="删除"></a>'
    } else {
        var editFlag = false;
        if (status == 2) {
            html += '<a class = "glyphicon glyphicon-stop"' +
                'onclick="stopTimerTask(\'' + row.id + '\')" ' +
                'style="color:red; cursor:pointer" title="停止">'
        } else {
            html += '<a class = "glyphicon glyphicon-play-circle"' +
                'onclick="startTimerTask(\'' + row.id + '\')" ' +
                'style="color:green; cursor:pointer" title="启动">'
            editFlag = true;
        }
        if (editFlag) {
            html += '&nbsp;<a class="glyphicon glyphicon-edit" ' +
                'onclick="editTimerTaskModal(\'' + row.id + '\')" ' +
                'style=" cursor:pointer" title="编辑"></a>'
            html += '&nbsp;&nbsp;&nbsp;<a class="glyphicon glyphicon-remove" ' +
                'onclick="deleteTimerTask(\'' + row.id + '\')" ' +
                'style="color:red; cursor:pointer" title="删除"></a>'
        } else {
            html += '&nbsp;<a class="glyphicon glyphicon-edit" ' +
                'onclick="editTimerTaskModal(\'' + row.id + '\')" ' +
                'style="color:blue; cursor:pointer"  readonly="readonly" title="编辑"></a>'
            html += '&nbsp;&nbsp;&nbsp;<a class="glyphicon glyphicon-remove" ' +
                'onclick="deleteTimerTask(\'' + row.id + '\')" ' +
                'style="cursor:pointer" readonly="readonly" title="删除"></a>'
        }
    }
    return [html].join('');
}

/**
 * 开始执行即时任务
 * @param id
 */
function startImTask(id) {
    socket.emit('model/startTask', {id: id});
}
/**
 * 停止任务
 * @param id
 */
function stopTask(id) {
    socket.emit('model/stopTask', {id: id});
}
/**
 * 停止定时任务
 * @param id
 */
function stopTimerTask(id) {
    socket.emit('model/stopTimerTask', {id: id});
}

/**
 * 编辑即时任务
 * @param id
 */
function editTask(id) {
    $.ajax({
        type: 'post',
        url: '/model/task/getTaskById',
        data: {
            id: id
        },
        dataType: 'json',
        success: function (data) {
            var flag = data.flag;
            if (flag < 0) {
                errorSwal(data.message);
                return;
            } else {
                var value = data.data;
                $('#editTaskId').val(value.id);
                $('#editTaskName').val(value.name);
                $('#editTaskDesc').val(value.description);
                $('#editImBeginTime').find('input').val(value.begin_time);
                $('#editImEndTime').find('input').val(value.end_time);
                $('#editTaskSlice').val(value.slice_num);
                $('#editTaskFileIds').val(value.file_ids);
                $('#editTaskFiles').val(value.file_names);
                $('#editImTaskModal').modal({
                    backdrop: 'static'
                });
            }
        },
        error: function (data) {
            toastr.error('获取数据失败');
        }
    });

}
/**
 * 关闭编辑对话框
 */
function closeEditImTaskModal() {
    $('#editImTaskModal').modal('hide');
    $('#editTaskId').val('');
    $('#editTaskName').val();
    $('#editTaskDesc').val();
    $('#editImBeginTime').val();
    $('#editImEndTime').val();
    $('#editTaskSlice').val();
    $('#editTaskFiles').val();
}


function editImTask() {
    var taskId = $('#editTaskId').val();
    if (!taskId) {
        errorSwal('请选择任务');
        return;
    }
    var taskName = $('#editTaskName').val();
    if (!taskName) {
        errorSwal('任务名称不能为空');
        return;
    }
    var taskDesc = $('#editTaskDesc').val();
    var taskBeginTime = $('#editImBeginTime').find('input').val();
    var taskEndTime = $('#editImEndTime').find('input').val();
    if (!taskBeginTime || !taskEndTime) {
        errorSwal('开始时间或结束时间不能为空');
        return;
    }
    var taskSlice = $('#editTaskSlice').val();
    if (taskSlice < 1) {
        errorSwal('分片数量不能小于1');
        return;
    }
    var files = $('#editTaskFileIds').val();
    if (!files) {
        errorSwal('作业文件不能为空');
        return;
    }
    $.ajax({
        url: '/model/task/updateTask',
        type: 'post',
        data: {
            taskId: taskId,
            taskName: taskName,
            taskDesc: taskDesc,
            taskBeginTime: taskBeginTime,
            taskEndTime: taskEndTime,
            taskSlice: taskSlice,
            taskFiles: files
        },
        dataType: 'json',
        success: function (data) {
            var flag = data.flag;
            if (flag < 0) {
                errorSwal(data.message);
                return;
            } else {
                successSwal('更新任务成功');
            }
        },
        error: function (data) {
            errorSwal();
        }
    });
}

/**
 * 删除即时任务
 * @param id
 */

function deleteImTask(id) {
    if (!id) {
        errorSwal('请选择任务');
        return;
    }
    swal({
        title: "删除任务?",
        text: "你确定要删除这个任务吗？",
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
                url: '/model/task/deleteTaskById',
                data: {
                    id: id
                },
                dataType: 'json',
                success: function (data) {
                    var flag = data.flag;
                    if (flag < 0) {
                        errorSwal(data.message);
                        return;
                    } else {
                        successSwal();
                    }
                },
                error: function (data) {
                    toastr.error('删除失败');
                }
            });
        } else {
            swal('取消', '任务没有删除', 'error');
        }
    });

}
/**
 * 开始定时任务
 * @param id
 */

function startTimerTask(id) {
    socket.emit('model/startTimerTask', {id: id});
}


/**
 * 编辑定时任务
 * @param id
 */
function editTimerTaskModal(id) {
    $.ajax({
        type: 'post',
        url: '/model/task/getTimerTaskById',
        data: {
            id: id
        },
        dataType: 'json',
        success: function (data) {
            var flag = data.flag;
            if (flag < 0) {
                errorSwal(data.message);
                return;
            } else {
                var value = data.data;
                $('#editTimerId').val(value.id);
                $('#editTimerName').val(value.name);
                $('#editTimerDesc').val(value.description);
                var cutofftime = parseInt(value.cutoff_time);
                $('#editTimerCutOffDay').val(parseInt(cutofftime / 1440));
                $('#editTimerCutOffHour').val(parseInt(cutofftime % 1440 / 60));
                $('#editTimerCutOffMinute').val(parseInt(cutofftime % 60));

                var durtion = parseInt(value.durtion);
                $('#editDurtionDay').val(parseInt(cutofftime / 1440));
                $('#editDurtionHour').val(parseInt(cutofftime % 1440 / 60));
                $('#editDurtionMinute').val(parseInt(cutofftime % 60));

                $('#editTimerFileIds').val(value.file_ids);
                $('#editTimerFiles').val(value.file_names);
                $('#editTaskType').selectpicker('val', value.task_type);
                $('#editTimerRunnum').val(value.max_num);
                var timerType = value.timer_type;
                $('#editTimerType').selectpicker('val', timerType)
                var day = value.day;
                var hour = value.hour;
                var minute = value.minute;
                switch (timerType) {
                    case 1:
                        $('#editDayHour').val(hour);
                        $('#editDayMinute').val(minute);
                        $('#editTimerTypeWeek').find('input').attr('readonly', 'readonly');
                        $('#editTimerTypeMonth').find('input').attr('readonly', 'readonly');
                        $('#editTimerTypeCustomize').find('input').attr('readonly', 'readonly');
                        $('#editTimerTypeDay').find('input').removeAttr('readonly');
                        $('#editWeekDay').attr("disabled", "disabled");
                        break;
                    case 2:
                        $('#editWeekHour').val(hour);
                        $('#editWeekHour').val(hour);
                        $('#editWeekMinute').val(minute);
                        $('#editTimerTypeDay').find('input').attr('readonly', 'readonly');
                        $('#editTimerTypeMonth').find('input').attr('readonly', 'readonly');
                        $('#editTimerTypeCustomize').find('input').attr('readonly', 'readonly');
                        $('#editTimerTypeWeek').find('input').removeAttr('readonly');
                        $('#editWeekDay').removeAttr("disabled");
                        break;
                    case 3:
                        $('#editMonthDay').val(day);
                        $('#editMonthHour').val(hour);
                        $('#editMonthMinute').val(minute);
                        $('#editTimerTypeWeek').find('input').attr('readonly', 'readonly');
                        $('#editTimerTypeDay').find('input').attr('readonly', 'readonly');
                        $('#editTimerTypeCustomize').find('input').attr('readonly', 'readonly');
                        $('#editTimerTypeMonth').find('input').removeAttr('readonly');
                        $('#editWeekDay').attr("disabled", "disabled");
                        break;
                    case 4:
                        $('#editTimerDay').val(hour);
                        $('#editTimerHour').val(hour);
                        $('#editTimerMinute').val(minute);
                        $('#editTimerTypeWeek').find('input').attr('readonly', 'readonly');
                        $('#editTimerTypeMonth').find('input').attr('readonly', 'readonly');
                        $('#editTimerTypeDay').find('input').attr('readonly', 'readonly');
                        $('#editTimerTypeCustomize').find('input').removeAttr('readonly');
                        $('#editWeekDay').attr("disabled", "disabled");
                        break;
                    default:
                        break;
                }
                $('#editTimerTaskModal').modal({
                    backdrop: 'static'
                });
            }
        },
        error: function (data) {
            toastr.error('获取数据失败');
        }
    })
}
/**
 * 关闭定时任务编辑窗口
 */
function closeEditTimerTaskModal() {
    $('#editTimerTaskModal').modal('hide');
    $('#editTimerId').val('');
    $('#editTimerTypeWeek').find('input').val(0);
    $('#editTimerTypeMonth').find('input').val(0);
    $('#editTimerTypeCustomize').find('input').val(0);
    $('#editTimerTypeDay').find('input').val(0);
    $('#editTimerName').val('');
    $('#editTimerDesc').val('');
    $('#editTimerCutOffDay').val(0);
    $('#editTimerCutOffHour').val(0);
    $('#editTimerCutOffMinute').val(0);
    $('#editDurtionDay').val(0);
    $('#editDurtionHour').val(0);
    $('#editDurtionMinute').val(0);
}

/**
 * 编辑定时任务
 */
function editTimerTask() {

    var taskId = $('#editTimerId').val();
    if (!taskId) {
        errorSwal('请选择任务');
        return;
    }
    var taskName = $('#editTimerName').val();
    if (!taskName) {
        errorSwal('任务名称不能为空');
        return;
    }
    var taskDesc = $('#editTimerDesc').val();
    var cutoffDay = parseInt($('#editTimerCutOffDay').val());
    var cutoffHour = parseInt($('#editTimerCutOffDay').val());
    var cutoffMinute = parseInt($('#editTimerCutOffMinute').val());
    var cutoffTime = cutoffDay * 1440 + cutoffHour * 60 + cutoffMinute;

    if (cutoffTime < 1) {
        errorSwal('截止时间不能小于1');
        return;
    }

    var durtionDay = parseInt($('#editDurtionDay').val());
    var durtionHour = parseInt($('#editDurtionHour').val());
    var durtionMinute = parseInt($('#editDurtionMinute').val());

    var durtion = durtionDay * 1440 + durtionHour * 60 + durtionMinute;
    if (durtion < 1) {
        errorSwal('取数时长不能小于1');
        return;
    }
    var timerSlice = parseInt($('#editTimerSlice').val());
    if (timerSlice < 1) {
        errorSwal('分片数量不能小于1');
        return;
    }
    var timerFiles = $('#editTimerFileIds').val();
    if (!timerFiles) {
        errorSwal('作业文件不能为空');
        return;
    }

    var taskType = $('#editTaskType').selectpicker('val');
    var runnum = parseInt($('#editTimerRunnum').val());
    var timerType = $('#editTimerType').selectpicker('val');
    var day = 0;
    var hour = 0;
    var minute = 0;
    switch (timerType) {
        case '1':
            hour = parseInt($('#editDayHour').val());
            minute = parseInt($('#editDayMinute').val());
            break;
        case '2':
            hour = parseInt($('#editWeekHour').val());
            minute = parseInt($('#editWeekMinute').val());
            break;
        case '3':
            day = parseInt($('#editMonthDay').val());
            hour = parseInt($('#editMonthHour').val());
            minute = parseInt($('#editMonthMinute').val());
            if (day > 28) {
                toastr.warning('部分月份可能会执行不到该数据');
            }
            break;
        case '4':
            day = parseInt($('#editTimerDay').val());
            hour = parseInt($('#editTimerHour').val());
            minute = parseInt($('#editTimerMinute').val());
            if ((day * 1440 + hour * 60 + minute) < 0) {
                errorSwal('时间间隔不能小于30分钟');
                return;
            }
            break;
        default:
            hour = parseInt($('#editDayHour').val());
            minute = parseInt($('#editDayMinute').val());
            break;
    }
    $.ajax({
        url: '/model/task/updateTimerTask',
        type: 'post',
        data: {
            taskId: taskId,
            taskName: taskName,
            taskDesc: taskDesc,
            cutoffTime: cutoffTime,
            durtion: durtion,
            timerSlice: timerSlice,
            timerFiles: timerFiles,
            taskType: taskType,
            runnum: runnum,
            timerType: timerType,
            day: day,
            hour: hour,
            minute: minute
        },
        dataType: 'json',
        success: function (data) {
            var flag = data.flag;
            if (flag < 0) {
                errorSwal(data.message);
                return;
            } else {
                successSwal('更新任务成功');
            }
        },
        error: function (data) {
            errorSwal();
        }
    });
}
/**
 * 删除定时任务
 * @param id
 */
function deleteTimerTask(id) {
    if (!id) {
        errorSwal('请选择任务');
        return;
    }
    swal({
        title: "删除任务?",
        text: "你确定要删除这个任务吗？",
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
                url: '/model/task/deleteTimerTaskById',
                data: {
                    id: id
                },
                dataType: 'json',
                success: function (data) {
                    var flag = data.flag;
                    if (flag < 0) {
                        errorSwal(data.message);
                        return;
                    } else {
                        successSwal();
                    }
                },
                error: function (data) {
                    toastr.error('删除失败');
                }
            });
        } else {
            swal('取消', '任务没有删除', 'error');
        }
    });
}



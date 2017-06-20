var fields = [{
    field: 'url',
    title: '请求URL',
    align: 'left',
    valign: 'middle'
}, {
    field: 'userName',
    title: '用户名',
    align: 'left',
    valign: 'middle'
}, {
    field: 'time',
    title: '日期',
    align: 'left',
    valign: 'top'
}, {
    field: 'flag',
    title: '返回标识',
    align: 'left',
    valign: 'top'
}, {
    field: 'message',
    title: '返回说明',
    align: 'left',
    valign: 'top'
}];
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

    $('#sysTable').on('page-change.bs.table', function () {
        querySystemLog();
    });
    $('#sysTable').bootstrapTable('destroy');
    $('#sysTable').bootstrapTable({
        height: getHeight2(),
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
        idField: "ENTERPRISE_ID", //每一行的唯一标识，一般为主键列
        showToggle: true, //是否显示详细视图和列表视图的切换按钮
        showRefresh: true,
        showExport: true, //显示导出按钮
        exportDataType: "basic", //导出类型
        onLoadSuccess: function () {
        },
        onLoadError: function () {
            toastr.error('表格初始化失败');
        }
    });
    initDate();
    querySystemLog();
});

/**
 * 初始化日期控件
 */
function initDate() {
    var nowtime = new Date().getTime();
    $('#beginDate').find('input').val(utils.dateFormat(nowtime - 3600000 * 24, 'yyyy-MM-dd HH:mm:ss'));
    $('#endDate').find('input').val(utils.dateFormat(nowtime, 'yyyy-MM-dd HH:mm:ss'));
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
 * 获取企业列表信息
 */
function querySystemLog() {
    var url = $('#queryURL').val();
    var beginDate = $("#beginDate").find('input').val();
    var endDate = $("#endDate").find('input').val();
    if (endDate <= beginDate) {
        toastr.warn('开始时间不能早于结束时间');
        return;
    }
    var opts = $("#sysTable").bootstrapTable('getOptions');
    var offset = ((opts.pageNumber - 1) * opts.pageSize);
    var limit = opts.pageSize;
    $.ajax({
        type: 'post',
        url: '/system/sysLog/querySysLog',
        data: {
            url: url,
            beginTime: beginDate,
            endTime: endDate,
            offset: offset,
            limit: limit
        },
        dataType: 'json',
        success: function (value) {
            if (value.total == 0) {
                $('#sysTable').bootstrapTable('refreshOptions', {pageNumber: 1});
            }
            $('#sysTable').bootstrapTable('load', value);
        },
        error: function () {
            toastr.error('获取企业信息失败');
        }
    });
}

var columns = [{
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
    width: '30%'
}, {
    field: 'ED',
    title: '描述',
    align: 'left',
    valign: 'top',
    width: '20%'
}, {
    field: 'TM',
    title: '时间',
    align: 'left',
    valign: 'top',
    formatter: 'timeFormatter',
    width: '15%'
}, {
    field: 'RT',
    title: '类型',
    align: 'left',
    valign: 'top',
    visible: false,
    formatter: 'pointRT',
    width: '10%'
}, {
    field: 'DS',
    title: '状态',
    align: 'left',
    valign: 'top',
    formatter: 'getQuality',
    width: '10%'
}, {
    field: 'AV',
    title: '实时值',
    align: 'left',
    valign: 'top',
    formatter: 'toDecimal',
    width: '15%'
}];

$(document).ready(function () {
    $("#stop").hide();
    $('#table').on('page-change.bs.table', function (e, number, size) {
        queryData();
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
    queryMtreeNode();
    queryData();
});

function queryMtreeNode() {
    $.ajax({
        type: 'post',
        url: '/domain/domain/getDataDomain',
        dataType: 'json',
        async: false,
        success: function (value) {
            var flag = value.flag;
            if (flag < 0) {
                toastr.warning(value.message);
                return;
            } else {
                var data = value.data;
                initDomainTree(data);
            }
        },
        error: function () {
            toastr.error('获取信息失败');
        }
    });
}

/**
 * 显示树信息
 * @param data
 */
function initDomainTree(data) {
    var source = {
        dataType: "json",
        dataFields: [{
            name: 'domainId',
            type: 'number'
        }, {
            name: 'preDomainId',
            type: 'number'
        }, {
            name: 'name',
            type: 'string'
        }, {
            name: 'value',
            type: 'string'
        }, {
            name: 'disabled',
            type: 'bool'
        }, {
            name: 'expanded',
            type: 'bool'
        }],
        id: 'domainId',
        localData: data
    };
    //创建data配适器
    var dataAdapter = new $.jqx.dataAdapter(source);
    //perform Data Binding
    dataAdapter.dataBind();
    //对应记录
    var records = dataAdapter.getRecordsHierarchy('domainId', 'preDomainId', 'items', [{name: 'name', map: 'label'}, {name: 'domainId', map: 'id'}]);
    $("#mtreeDropDownButton").jqxDropDownButton({width: '100%', height: 32});
    $('#mtreeNode').on('select', function (event) {
        var args = event.args;
        var item = $('#mtreeNode').jqxTree('getItem', args.element);
        var dropDownContent = '<div style="position: relative; margin-left: 3px; margin-top: 5px;">' + item.value + '</div>';
        $("#mtreeDropDownButton").jqxDropDownButton('setContent', dropDownContent);
    });
    $('#mtreeNode').jqxTree({source: records, width: '100%', height: '200px'});
    $('.jqx-widget .jqx-checkbox').css('margin-top', '4px');
    $('#mtreeNode').jqxTree('selectItem', $("#mtreeNode").find('li:first')[0]);
}

var status;
function queryData() {
    var element = $('#mtreeNode').jqxTree('getSelectedItem');
    var mtreeNode = null;
    if (element) {
        mtreeNode = element.value;
    }
    var opts = $("#table").bootstrapTable('getOptions');
    var pointType = $('#pointType').selectpicker('val'),
        pointName = $('#pointName').val(), //点的全局名称gn
        pointDesc = $('#pointDesc').val();
    var pageData = {
        'offset': ((opts.pageNumber - 1) * opts.pageSize),
        'limit': opts.pageSize,
        mtreeNode: mtreeNode,
        pointType: pointType,
        pointName: pointName,
        pointDesc: pointDesc
    }
    socket.emit('realtimeData', pageData);
}

function start() {
    //刷新数据
    status = setInterval(queryData, 1000);
    $("#start").hide();
    $("#stop").show();
}

function stop() {
    clearInterval(status);
    $("#start").show();
    $("#stop").hide();
}

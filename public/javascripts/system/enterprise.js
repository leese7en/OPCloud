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

    industryList();
    initenterpriseInfoTable();//初始化企业表格
    enterpriseQuery();
    toastr.options.positionClass = 'toast-top-center';
    $('#table').on('page-change.bs.table', function () {
        enterpriseQuery();
    });
});

/**
 * 获取行业列表
 */
function industryList() {
    $.ajax({
        type: 'get',
        url: '/system/customer/industryList',
        dataType: 'json',
        async: false,
        success: function (value) {
            var flag = value.flag;
            if (flag < 0) {
                toastr.warning(value.message);
                return;
            } else {
                var data = value.data;
                //创建下拉菜单
                if (data.length > 0) {
                    var html = '<option value="0">请选择</option>';
                    for (var i = 0; i < data.length; i++) {
                        html += '<option value="' + data[i].INDUSTRY_ID + '">' + data[i].INDUSTRY_NAME + '</option>';
                    }
                    $('#industrySelect').html(html);
                    $('#industrySelect').selectpicker('refresh');
                }
            }
        },
        error: function () {
            toastr.error('获取行业信息失败');
        }
    });
}

/**
 * 获取企业列表信息
 */
function enterpriseQuery() {
    $('#table').bootstrapTable('refreshOptions', {pageNumber: 1});
    var enterpriseName = $('#enterpriseNameQuery').val();
    var enterpriseDesc = $('#enterpriseDescQuery').val();
    var industryId = $('#industrySelect').val();
    //分页数据
    var pageNumber = +options.pageNumber || 1; //当前页码
    var pageSize = +options.pageSize || 10;//页面大小

    $.ajax({
        type: 'post',
        url: '/system/customer/blurryEnterprise',
        data: {
            enterpriseName: enterpriseName,
            enterpriseDesc: enterpriseDesc,
            industryId: industryId,
            pageNumber: pageNumber,
            pageSize: pageSize
        },
        dataType: 'json',
        success: function (value) {
            var flag = value.flag;
            if (flag < 0) {
                toastr.warning(value.message);
                return;
            } else {
                var data = value.data;
                //导入数据
                if (data.total == 0) {
                    $('#table').bootstrapTable('refreshOptions', {pageNumber: 1});
                }
                $('#table').bootstrapTable('load', data);
            }
        },
        error: function () {
            toastr.error('获取企业信息失败');
        }
    });
}

/**
 * 企业表格创建
 * @param {Object} data
 */
function initenterpriseInfoTable() {
    var fields = [{
        field: 'ENTERPRISE_ID',
        title: 'ID',
        align: 'center',
        valign: 'middle',
        visible: false,
        sortable: true
    }, {
        field: 'DOMAIN_ID',
        title: '所属Domain',
        align: 'center',
        valign: 'middle',
        visible: false,
        sortable: true
    }, {
        field: 'ENTERPRISE_NAME',
        title: '名称',
        align: 'left',
        valign: 'top',
        sortable: true
    }, {
        field: 'DESCRIPTION',
        title: '描述',
        align: 'left',
        valign: 'top',
        sortable: true
    }, {
        field: 'INDUSTRY_ID',
        title: '行业ID',
        align: 'left',
        visible: false,
        valign: 'top',
        sortable: true
    }, {
        field: 'INDUSTRY_NAME',
        title: '行业',
        align: 'left',
        valign: 'top',
        sortable: true
    }, {
        field: 'LINK_MAN',
        title: '联系人',
        align: 'left',
        valign: 'top',
        sortable: true
    }, {
        field: 'PHONE',
        title: '电话',
        align: 'left',
        valign: 'top',
        sortable: true
    }, {
        field: 'CREATE_DATE',
        title: '注册日期',
        align: 'left',
        formatter: 'timeFormatter',
        valign: 'top',
        sortable: true
    }, {
        field: 'UPDATE_DATE',
        title: '更新日期',
        align: 'left',
        formatter: 'timeFormatter',
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
    var $table = $('#table');
    $table.bootstrapTable('destroy');
    $table.bootstrapTable({
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
    if (row.IS_ENABLED) {
        html += '<a class="glyphicon glyphicon-ban-circle"' +
            ' onclick="chageState(' + row.ENTERPRISE_ID + ',0)"' + //数字0表示启用
            ' style="color:#DD4B39; cursor:pointer" title="启用"></a>';
    } else {
        html += '<a class="glyphicon glyphicon-ok"' +
            ' onclick="chageState(' + row.ENTERPRISE_ID + ',1)"' + //数字1表示禁用
            ' style="color:#00A65A; cursor:pointer" title="禁用"></a>';
    }

    return [html + '&nbsp;&nbsp;&nbsp;' +
    '<a class="glyphicon glyphicon-edit" ' +
    'onclick="editEnterprise()" ' +
    'style="color:#00A65A; cursor:pointer" title="编辑"></a>'
    ].join('');
}

//禁用或启用企业
function chageState(enterpriseID, flag) {
    $.ajax({
        type: 'post',
        url: '/system/customer/disableOrEnableEnterprise',
        data: {
            enterpriseID: enterpriseID,
            flag: flag
        },
        dataType: 'json',
        success: function (value) {
            var flag = value.flag;
            if (flag < 0) {
                toastr.warning(value.message);
                return;
            } else {
                toastr.success('操作成功');
                enterpriseQuery();
            }
        },
        error: function () {
            toastr.error('操作失败');
        }
    });
}

/*编辑更新企业信息*/
function editEnterprise() {

}

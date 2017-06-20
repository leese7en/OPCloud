$(document).ready(function () {
    getPrePage();
    pageQuery();
    toastr.options.positionClass = 'toast-top-center';
});

/**
 * 获取上级菜单
 * @param {Object} key
 */
function getPrePage() {
    $.ajax({
        type: 'get',
        url: '/system/page/getAllPrePage',
        dataType: 'json',
        async: false,
        success: function (value) {
            var flag = value.flag;
            if (flag < 0) {
                toastr.warning(value.message);
                return;
            } else {
                var data = value.data;
                //创建下拉按钮
                $('#dropDownButton, #dropDownButton2').jqxDropDownButton({width: '100%'});
                //初始提示为：请选择
                var dropDownContent = '<div style="position: relative; margin-left: 3px; margin-top: 5px;">请选择</div>';
                $('#dropDownButton, #dropDownButton2').jqxDropDownButton('setContent', dropDownContent);
                //准备下拉列表数据
                initAddPageTable(data);
            }
        },
        error: function () {
            toastr.error('获取信息失败');
        }
    });
}
/**
 * 格式化显示 下拉列表信息
 * @param {Object} data
 */
function initAddPageTable(value) {
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
        }],
        id: 'pageId',
        localData: value
    };
    //创建data配适器
    var dataAdapter = new $.jqx.dataAdapter(source);
    //perform Data Binding
    dataAdapter.dataBind();
    //对应记录
    var records = dataAdapter.getRecordsHierarchy('pageId', 'prePageId', 'items', [{name: 'pageName', map: 'label'}, {name: 'pageId', map: 'id'}]);
    $('#pagePreInsert, #pagePreUpdate').jqxTree({source: records, width: '100%', height: '200px'});
    //#pagePreInsert添加根目录，在最前面添加，并添加选中事件
    var treeItems = $("#pagePreInsert").jqxTree('getItems');
    var firstItem = treeItems[0];
    var firstItemElement = firstItem.element;
    $('#pagePreInsert').jqxTree('addBefore', {label: '---请选择---', id: 'chooseRoot_Save'}, firstItemElement);
    $('#chooseRoot_Save').click(function () {
        $('#prePageTableId').val(0); //请选择，那么prePageId为0
        $("#dropDownButton").jqxDropDownButton('close'); //选中后关闭该下拉框
    });
    //#pagePreInsert下拉菜单选中事件
    $('#pagePreInsert').on('select', function (event) {
        var args = event.args;
        var item = $('#pagePreInsert').jqxTree('getItem', args.element);
        //选择上级菜单后，返回上级菜单的id: item.id 和 name: item.label
        $('#prePageTableId').val(item.id); //利用隐藏域属性保存id

        var dropDownContent = '<div style="position: relative; margin-left: 3px; margin-top: 5px;">' + item.label + '</div>';
        $("#dropDownButton").jqxDropDownButton('setContent', dropDownContent); //设置下拉框的值
        $("#dropDownButton").jqxDropDownButton('close'); //选中后关闭该下拉框
    });
    //同样#pagePreUpadte需要添加根目录和下拉菜单
    treeItems = $("#pagePreUpdate").jqxTree('getItems');
    firstItem = treeItems[0];
    firstItemElement = firstItem.element;
    $('#pagePreUpdate').jqxTree('addBefore', {label: '---请选择---', id: 'chooseRoot_Update'}, firstItemElement);
    $('#chooseRoot_Update').click(function () {
        $('#prePageTableId').val(0); //请选择，那么prePageId为0
        $("#dropDownButton2").jqxDropDownButton('close'); //选中后关闭该下拉框
    });

    $('#pagePreUpdate').on('select', function (event) {
        var args = event.args;
        var item = $('#pagePreUpdate').jqxTree('getItem', args.element);
        //选择上级菜单后，返回上级菜单的id: item.id 和 name: item.label
        $('#prePageTableId').val(item.id); //利用隐藏域属性保存id

        var dropDownContent = '<div style="position: relative; margin-left: 3px; margin-top: 5px;">' + item.label + '</div>';
        $("#dropDownButton2").jqxDropDownButton('setContent', dropDownContent); //设置下拉框的值
        $("#dropDownButton2").jqxDropDownButton('close'); //选中后关闭该下拉框
    });


}

/**
 * 页面信息
 * @param {Object} pageNumber
 * @param {Object} pageSize
 */
function pageQuery() {
    var pageName = $('#pageNameQuery').val();
    var pageDesc = $('#pageDescQuery').val();
    $.ajax({
        type: 'post',
        url: '/system/page/blurryPage',
        data: {
            pageName: pageName,
            pageDesc: pageDesc
        },
        dataType: 'json',
        success: function (data) {
            var flag = data.flag;
            if (flag < 0) {
                toastr.warning(data.message);
                return;
            } else {
                initPageInfoTable(data.data);
            }
        },
        error: function (value) {
            toastr.error('获取信息失败');
        }
    });
}

/**
 * 格式化显示 页面信息
 * @param {Object} data
 */
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
            name: 'description',
            type: 'string'
        }, {
            name: 'icon',
            type: 'string'
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

    $("#pageInfoTable").jqxTreeGrid({
        width: '99%',
        source: dataAdapter,
        sortable: true,
        ready: function () {
            $("#pageInfoTable").jqxTreeGrid('expandRow', '0');
        },
        columns: [{
            text: '名称',
            dataField: 'pageName',
            width: '25%'
        }, {
            text: '路径',
            dataField: 'url',
            width: '25%'
        }, {
            text: '描述',
            dataField: 'description',
            width: '20%'
        }, {
            text: '图标',
            dataField: 'icon',
            width: '15%'
        }, {
            text: '操作',
            cellsalign: 'left',
            cellsrenderer: operate,
            events: 'operateEvents',
            width: '15%'
        }]
    });
    $('#pageInfoTable').on('rowSelect', function (event) {
        var args = event.args;
        var row = args.row;
        var id = row.pageId;
        $('#pageTableId').val(id);
        if (row.level !== 0) {
        }
    });

}

/**
 * 显示删除和删除操作
 * @param {Object} value
 * @param {Object} row
 * @param {Object} index
 * @return {TypeName}
 */
function operate(value, row, index) {
    return [
        '<span class="glyphicon glyphicon-edit" onclick="showPageInfo()" style="color:#f0ad4e; cursor:pointer"></span>' + '&nbsp;&nbsp;&nbsp;' +
        '<span class="glyphicon glyphicon-trash" onclick="deletePage()" style="color:#f0ad4e; cursor:pointer"></span>'
    ].join('');
}
/**
 * 删除页面信息
 * @param {Object} data
 */
function deletePage(pageId) {
    pageId = $('#pageTableId').val();
    if (!pageId) {
        toastr.error('请选择页面!');
        return;
    }
    swal({
        title: "删除页面?",
        text: "你确定要删除这个页面吗？",
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
                url: '/system/page/deletePage',
                data: {
                    pageId: pageId
                },
                dataType: 'json',
                success: function (data) {
                    var flag = data.flag;
                    if (flag == 0) {
                        pageQuery();
                        getPrePage(); //更新下拉框
                        swal('成功', '删除成功', 'success');
                    } else {
                        swal('错误', data.message, 'error');
                    }
                },
                error: function () {
                    swal('失败', '删除失败', "error");
                }
            });
        } else {
            swal('取消', '页面没有删除', 'error');
        }
    });
}

/**
 * 打开插入对话框
 * @param {Object} roleId
 */
function pageInsert() {
    $('#pageMessageInsert').modal({
        backdrop: 'static'
    });
    //点击添加菜单的时候需要将上级id置为0
    var prePageId = $('#prePageTableId').val(0);
}

/**
 * 插入 菜单
 */
function insertPage() {
    var prePageId = $('#prePageTableId').val(); //利用隐藏域属性获取id

    if (prePageId == '-1' || prePageId == '') {
        prePageId = 0;
    }
    var pageName = $('#pageNameInsert').val();
    if (!pageName) {
        toastr.warning('请输入菜单名称');
        return;
    }
    var pageUrl = $('#pageURLInsert').val();
    var pageIcon = $('#pageIconInsert').val();
    var orderCode = $('#pageOrderCodeInsert').val();
    var pageDesc = $('#pageDescInsert').val();

    $.ajax({
        type: 'post',
        url: '/system/page/addPage',
        data: {
            prePageId: prePageId,
            pageName: pageName,
            pageUrl: pageUrl,
            pageIcon: pageIcon,
            orderCode: orderCode,
            pageDesc: pageDesc
        },
        dataType: 'json',
        success: function (data) {
            var flag = data.flag;
            if (flag < 0) {
                toastr.warning(data.message);
                return;
            } else {
                closePageInsertModal();
                pageQuery(); //刷新表格
                getPrePage(); //刷新下拉框
                toastr.success('添加菜单成功');
            }
        },
        error: function () {
            toastr.error('添加失败');
        }
    });
}
/**
 * 关闭插入对话框
 * @param {Object} roleId
 */
function closePageInsertModal() {
    $('#pageMessageInsert').modal('hide');

    $('#pageNameInsert').val('');
    $('#pageURLInsert').val('');
    $('#pageIconInsert').val('');
    $('#pageOrderCodeInsert').val('');
    $('#pageDescInsert').val('');

}
/**
 * 显示菜单信息 对话框
 */
function showPageInfo(pageId) {
    pageId = $('#pageTableId').val();
    if (!pageId) {
        toastr.warning('请选择菜单');
        return;
    }
    $.ajax({
        type: 'post',
        url: '/system/page/getPageById',
        data: {
            pageId: pageId
        },
        dataType: 'json',
        success: function (data) {
            var flag = data.flag;
            if (flag < 0) {
                toastr.warning(data.message);
                return;
            }
            var obj = data.data;
            $('#pageId').val(obj.pageId);
            //表单属性赋值，需要根据上级菜单的id，查询上级菜单的名称
            //若上级菜单prePageId为0，或者为空，则表明没有上级菜单
            var prePageId = obj.prePageId;
            if (prePageId != 0 && prePageId != null) {
                $.ajax({
                    type: 'post',
                    url: '/system/page/getPageById',
                    data: {
                        pageId: obj.prePageId
                    },
                    dataType: 'json',
                    success: function (data) {
                        var flag = data.flag;
                        if (flag < 0) {
                            toastr.warning(data.message);
                            return;
                        }
                        var dropDownContent = '<div style="position: relative; margin-left: 3px; margin-top: 5px;">' + data.data.pageName + '</div>';
                        $('#dropDownButton2').jqxDropDownButton('setContent', dropDownContent);
                        $('#prePageTableId').val(data.data.pageId); //让该隐藏域记录上级菜单id
                    },
                    error: function () {
                    }
                });
            } else {
                //若本身没有上级菜单，则变为“请选择”
                var dropDownContent = '<div style="position: relative; margin-left: 3px; margin-top: 5px;">请选择</div>';
                $('#dropDownButton2').jqxDropDownButton('setContent', dropDownContent);
                $('#prePageTableId').val(0); //让该隐藏域记录上级菜单id
            }

            //表单属性赋值
            $('#pageNameUpdate').val(obj.pageName);
            $('#pageURLUpdate').val(obj.url);
            $('#pageIconUpdate').val(obj.icon);
            $('#pageOrderCodeUpdate').val(obj.orderCode);
            $('#pageDescUpdate').val(obj.description);
            $('#pageMessage').modal({
                backdrop: 'static'
            });
        },
        error: function () {
            toastr.error('获取角色信息失败!');
        }
    });

}


/**
 * 跟新角色信息
 */
function updatePageMessage() {
    var pageId = $('#pageTableId').val();
    if (!pageId) {
        toastr.warning('请选择菜单');
        return;
    }
    var prePageId = $('#prePageTableId').val(); //利用隐藏域获取上级菜单的id
    if (prePageId == '-1') {
        prePageId = 0;
    }
    var pageName = $('#pageNameUpdate').val();
    if (!pageName) {
        toastr.warning('请输入菜单名称');
        return;
    }
    var pageUrl = $('#pageURLUpdate').val();
    var pageIcon = $('#pageIconUpdate').val();
    var orderCode = $('#pageOrderCodeUpdate').val();
    var pageDesc = $('#pageDescUpdate').val();
    $.ajax({
        type: 'post',
        url: '/system/page/updatePage',
        data: {
            pageId: pageId,
            prePageId: prePageId,
            pageName: pageName,
            pageUrl: pageUrl,
            pageIcon: pageIcon,
            orderCode: orderCode,
            pageDesc: pageDesc
        },
        dataType: 'json',
        success: function (data) {
            var flag = data.flag;
            if (flag < 0) {
                toastr.warning(data.message);
                return;
            } else {
                pageQuery();
                getPrePage(); //刷新下拉框
                closePageMessageoModal();
                toastr.success('更新菜单信息成功');
            }
        },
        error: function () {
            toastr.warning('更新失败');
        }
    });
}
/**
 * 隐藏 角色信息对话框
 */
function closePageMessageoModal() {
    $('#pageMessage').modal('hide');
    $('#pageNameUpdate').val('');
    $('#pageURLUpdate').val('');
    $('#pageIconUpdate').val('');
    $('#pageOrderUpdate').val('');
    $('#pageDescUpdate').val('');

}

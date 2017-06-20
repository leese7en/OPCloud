var fileFields = [{
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
}, {
    field: 'fileType',
    title: '文件类型',
    align: 'center',
    valign: 'middle',
    sortable: false,
}, {
    field: 'jarIds',
    title: '关联jar',
    visible: false,
    align: 'center',
    valign: 'middle',
    sortable: false,
}, {
    field: 'createDate',
    title: '创建时间',
    align: 'center',
    valign: 'middle',
    sortable: false,
}, {
    field: 'operator',
    title: '操作',
    align: 'center',
    valign: 'middle',
    sortable: false,
    formatter: 'operate',
}];


var jarFields = [{
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


var source = {
    dataType: "json",
    dataFields: [
        {name: 'ID', type: 'number'},
        {name: 'PID', type: 'number'},
        {name: 'NAME', type: 'string'},
        {name: 'URI', type: 'string'},
        {name: 'type', type: 'number'},
        {name: 'isDomain', type: 'number'}
    ],
    hierarchy: {
        keyDataField: {name: 'ID'},
        parentDataField: {name: 'PID'}
    },
    id: 'ID',
    timeout: 60 * 1000,
    url: '/system/fileManage/getZXMLFiles',
    addRow: function (rowId, rowData, position, parentId, commit) {
        commit(true);
    }
};

var filed = [
    {text: "id", datafield: "ID", align: "left", hidden: true},//隐藏列
    {text: '名称', dataField: 'NAME', cellsalign: 'left', width: '20%',},
    {text: '路径', dataField: 'URI', cellsalign: 'left', width: '60%'},
    {text: '类型', dataField: 'type', cellsalign: 'left', width: '10%', cellsrenderer: fileType},
    {
        text: '操作', align: "center", cellsalign: 'center', cellsrenderer: operateFormatter,
        events: 'operateEvents', width: '10%'
    }
]
/**
 * 文件类型
 * @param r
 * @param columnfield
 * @param value
 * @param row
 * @param columnproperties
 */
function fileType(r, columnfield, value, row, columnproperties) {
    var pId = row.PID;
    var isDomain = row.isDomain;
    if (!pId) {
        return '';
    }
    value = parseInt(value);
    if (value == 1) {
        if (isDomain == 0) {
            return '文件夹';
        } else {
            return '域文件夹';
        }
    } else if (value == 2) {
        return '图片'
    } else if (value == 3) {
        return '图形文件';
    }
    return ''
}
/**
 * 操作文件
 * @param r
 * @param columnfield
 * @param value
 * @param row
 * @param columnproperties
 * @returns {string}
 */
function operateFormatter(r, columnfield, value, row, columnproperties) {
    var pId = row.PID;
    var isDomain = row.isDomain;
    var type = row.type;
    var render = new Array();
    if (pId && isDomain == 0) {
        if (type == 3) {
            render.push('<a class="add" href="javascript:void(0)" title="设定为主页" style="color:#000000" onclick="indexMenu()">');
            render.push('<i class="glyphicon glyphicon-star"></i></a>');
        }
        render.push('&nbsp;&nbsp;<a class="add" href="javascript:void(0)" title="删除" style="color:#cc0000" onclick="deleteFiles()">');
        render.push('<i class="glyphicon glyphicon-remove"></i></a>');

    }
    return render.join('');
}

function deleteFiles() {
    var URI = $("#fileURI").val();
    if (!URI) {
        swal({
            title: "提示",
            text: "请选择文件！",
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
            deleteFileByPath(URI);
        }
    });
}

function deleteFileByPath(URI) {
    var selectedItem = $('#fileGrid').jqxTreeGrid('getSelection')[0];
    $.ajax({
        type: 'post',
        url: '/system/fileManage/deleteFileByPath',
        data: {
            URI: URI
        },
        dataType: 'json',
        success: function (data) {
            if (data.flag < 0) {
                toastr.error(data.message);
                return;
            }
            $("#fileGrid").jqxTreeGrid('deleteRow', selectedItem.ID);
            successSwal('删除成功');
        }
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
/**
 * 设定当前选中图片为主图
 */
function indexMenu() {
    var URI = $('#fileURI').val();
    if (!URI) {
        swal({
            title: "提示",
            text: "请选择文件！",
            type: "info",
            closeOnConfirm: false
        });
        return;
    }
    $.ajax({
        type: 'post',
        url: '/system/fileManage/indexMenuDiagram',
        data: {
            URI: URI
        },
        dataType: 'json',
        success: function (data) {
            if (data.flag < 0) {
                toastr.error(data.message);
                return;
            }
            successSwal('设定成功');
        }
    });

}


/**
 * 页面信息
 * @param {Object} pageNumber
 * @param {Object} pageSize
 */
function getZXMLFile() {
    var dataAdapter = new $.jqx.dataAdapter(source);
    $("#fileGrid").jqxTreeGrid(
        {
            theme: "magus",
            width: '100%',
            height: getHeight3(),
            source: dataAdapter,
            pagerMode: 'advanced',
            localization: getLocalization(),
            columnsResize: true,
            sortable: true,
            pageSize: 10000,
            columns: filed
        });
    $('#fileGrid').on('rowSelect', function (event) {
        var args = event.args;
        $('#fileURI').val(args.row.URI);
    });
}
$(document).ready(function () {
    toastr.options.positionClass = 'toast-top-center';
    $('#table').bootstrapTable({
        columns: fileFields,
        onLoadSuccess: function () {
        },
        onLoadError: function () {
            swal({
                title: "加载异常",
                text: "数据未正常加载",
                type: "error",
                closeOnConfirm: false
            });
        }
    });
    $('#jarFileTable').bootstrapTable('destroy');
    $('#jarFileTable').bootstrapTable({
        height: 250,
        columns: jarFields,
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
    getFileType();
    fileQuery();
    getZXMLFile();

});

/**
 * 获取jar文件
 */
function associationJarFile(id, jarIds) {
    $('#mdId').val(id);
    $.ajax({
        type: 'post',
        url: '/system/fileManage/getJarFile',
        data: {
            jarIds: jarIds
        },
        dataType: 'json',
        success: function (data) {
            $('#jarFileTable').bootstrapTable('load', data);
            $('#jarFileSelectedModal').modal({
                backdrop: 'static'
            });
        },
        error: function (value) {
            toastr.error('获取信息失败');
        }
    });
}

/**
 * 关联jar文件
 */
function confirmJarFile() {
    var modelFileId = $('#mdId').val();
    if (!modelFileId) {
        errorSwal('请选择ModelFile文件');
        return;
    }
    var rows = $('#jarFileTable').bootstrapTable('getSelections');
    if (rows == undefined || rows == null || rows == "") {
        errorSwal("请选择要关联的行！");
        return;
    }
    var jarIds = '';
    for (var i = 0; i < rows.length; i++) {
        jarIds += rows[i].id;
        if (rows[i + 1]) {
            jarIds += ',';
        }
    }
    if (!jarIds) {
        errorSwal('请选择jar包');
        return;
    }
    $.ajax({
        type: 'POST',
        url: "/system/fileManage/associationJar",
        data: {
            modelFileId: modelFileId,
            jarIds: jarIds
        },
        dataType: "json",
        async: false,
        success: function (data) {
            if (data.flag < 0) {
                toastr.error(data.message);
                return;
            }
            successSwal('关联成功');
            fileQuery();
            closeJarModal();
        }
    })
}

/**
 * 关闭关联窗口
 */
function closeJarModal() {
    $("#jarFileSelectedModal").modal('hide');
    $('#mdid').val('');
}

/**
 * 获取上级菜单
 * @param {Object} key
 */
function getFileType() {
    $.ajax({
        type: 'POST',
        url: "/system/fileManage/getFileType",
        dataType: "json",
        async: false,
        success: function (data) {
            if (data.flag < 0) {
                toastr.error(data.message);
                return;
            }
            callBackIndustryAndDuty(data.data, 'fileTypeQuery');
        }
    });
}

/*函数回调*/
function callBackIndustryAndDuty(data, id) {
    var html = '';
    for (var i in data) {
        var obj = data[i];
        html += '<option value="' + obj.id + '">' + obj.name + '</option>';
    }
    html = '<option value=-1>请选择</option>' + html;
    $('#' + id).html(html);
    $('#' + id).selectpicker('refreash');
}

/**
 * 页面信息
 * @param {Object} pageNumber
 * @param {Object} pageSize
 */
function fileQuery() {
    var fileName = $('#fileNameQuery').val();
    var fileType = $('#fileTypeQuery').selectpicker('val');
    $.ajax({
        type: 'post',
        url: '/system/fileManage/blurryFile',
        data: {
            fileName: fileName,
            fileType: fileType
        },
        dataType: 'json',
        success: function (data) {
            if (data.total == 0) {
                $('#table').bootstrapTable('refreshOptions', {pageNumber: 1});
            }
            $('#table').bootstrapTable('load', data);
        },
        error: function (value) {
            toastr.error('获取信息失败');
        }
    });
}

/**
 * 导入
 */
function showImportZXMLFile() {
    $("#importZXMLModal").modal('show');
}

/**
 * 导入
 */
function showImportZXMLZIPFile() {
    $("#importZXMLZIPModal").modal('show');
}

/**
 * 导入
 */
function showImportImageFile() {
    $("#importImageModal").modal('show');
}

/*关闭导入文件窗口*/
function closeZXML() {
    $('#importZXMLModal').modal('hide');
    $("#resourceZXML").val('');
    $("#zxmlDesc").val('');
    $('#fileDomainId').val('');
}

/*关闭导入图片窗口*/
function closeImage() {
    $('#importImageModal').modal('hide');
    $("#resourceImage").val('');
    $("#imageDesc").val('');
    $('#fileDomainId').val('');
}

/*关闭导入文件窗口*/
function closeZXMLZIP() {
    $('#importZXMLZIPModal').modal('hide');
    $("#resourceZXMLZIP").val('');
    $('#zxmlZIPDesc').val('');
    $('#fileDomainId').val('');
}


/*上传图形文件*/
function importZXMLFile() {
    var domainId = $('#fileDomainId').val();
    if (!domainId) {
        toastr.error("请选择导入文件所属的域!");
        return;
    }
    var desc = $('#zxmlDesc').val();
    var file = $("#resourceZXML").val();
    var ext = file.slice(file.lastIndexOf(".") + 1).toLowerCase();
    if (file == undefined || file == "" || file == null) {
        toastr.error("请选择导入的文件!");
        return;
    } else if ("zxml" != ext) {
        toastr.error("只能导入zxml格式文件!");
        return;
    }
    $('#uploadZXMLForm').ajaxSubmit({
        url: '/system/fileManage/importZXMLFile',
        beforeSend: function () {
            swal({
                showCancelButton: false,
                showConfirmButton: false,
                title: "文件上传中",
                imageUrl: "/images/file-loader.gif"
            });
        },
        data: {
            domainId: domainId,
            desc: desc
        },
        success: function (data) {
            if (data.flag < 0) {
                toastr.error(data.message);
                swal.close();
                $("#resourceZXML").val('')
            } else {
                swal.close();
                $("#resourceZXML").val('')
                fileQuery();
                closeZXML();
                toastr.success("上传成功！");
            }
        }
    });
}

/**
 * 像是对应的 域信息
 * @param id
 */
function showDomain(type) {
    getDomainTree();
    $('#domainModal').modal('show');
}

/**
 * 获取对应的 domain  信息
 * @param id
 */
function getDomainTree(id) {
    $.ajax({
        type: 'post',
        url: '/system/fileManage/getFileDomain',
        dataType: 'json',
        data: {
            userId: id
        },
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
    $('#domainTree').jqxTree({source: records, width: '100%', height: '300px'});
    $('.jqx-widget .jqx-checkbox').css('margin-top', '4px');
}
/**
 * 设定选中的 domain
 */
function selectDomain() {
    var element = $('#domainTree').jqxTree('getSelectedItem');
    if (!element) {
        toastr.warning('请选择域');
        return;
    }
    $('#fileDomainId').val(element.id);
    $('#domainModal').modal('hide');
}
/*上传图形文件*/
function importZXMLZIPFile() {

    var domainId = $('#fileDomainId').val();
    if (!domainId) {
        toastr.error("请选择导入文件所属的域!");
        return;
    }
    var desc = $('#zxmlZIPDesc').val();
    var size = $("#resourceZXMLZIP")[0].files[0].size;
    var max = 1024 * 1024 * 5;
    if (size > max) {
        toastr.error("上传文件最大为5M!");
        return;
    }
    var file = $("#resourceZXMLZIP").val();
    var ext = file.slice(file.lastIndexOf(".") + 1).toLowerCase();
    if (file == undefined || file == "" || file == null) {
        toastr.error("请选择要导入的文件!");
        return;
    } else if ("zip" != ext) {
        toastr.error("只能导入zip格式文件!");
        return;
    }
    $('#uploadZXMLZIPForm').ajaxSubmit({
        url: '/system/fileManage/importZXMLZIPFile',
        data: {
            domainId: domainId,
            desc: desc
        },
        beforeSend: function () {
            swal({
                showCancelButton: false,
                showConfirmButton: false,
                title: "文件上传中",
                imageUrl: "/images/file-loader.gif"
            });
        },
        success: function (data) {
            if (data.flag < 0) {
                swal.close();
                toastr.error(data.message);
                $("#resourceZXMLZIP").val('');
            } else if (data.flag == 1) {
                checkOverWriteUpload(data)
            } else {
                swal.close();
                $("#resourceZXMLZIP").val('')
                fileQuery();
                closeZXMLZIP();
                toastr.success("上传成功！");
            }
        }, error: function (e) {
            swal.close();
            toastr.error("上传出错");
        }
    });
}

function checkOverWriteUpload(data) {
    swal({
        title: "是否覆盖?",
        text: data.message,
        type: "warning",
        showCancelButton: true,
        confirmButtonColor: "#DD6B55",
        confirmButtonText: "确认覆盖",
        cancelButtonText: "取消",
        closeOnConfirm: false,
        closeOnCancel: true
    }, function (confirm) {
        if (confirm) {
            overWriteUpload(1, data.data);
        } else {
            overWriteUpload(0, data.data);
        }
    });
}

function overWriteUpload(flag, insertId) {
    $.ajax({
        beforeSend: function () {
            swal({
                showCancelButton: false,
                showConfirmButton: false,
                title: "文件覆盖中",
                imageUrl: "/images/file-loader.gif"
            });
        },
        type: 'post',
        url: '/system/fileManage/overWriteFile',
        data: {
            flag: flag,
            insertId: insertId
        },
        dataType: 'json',
        success: function (data) {
            swal.close();
            var flag = data.flag;
            if (flag == 0) {
                fileQuery();
                closeZXMLZIP();
                toastr.success('文件覆盖成功');
            } else {
                toastr.error(data.message);
            }
        },
        error: function () {
            swal.close();
            toastr.error(data.message);
        }
    });
}

/*上传图形文件*/
function importImageFile() {
    var domainId = $('#fileDomainId').val();
    if (!domainId) {
        toastr.error("请选择导入文件所属的域!");
        return;
    }
    var desc = $('#imageDesc').val();
    var file = $("#resourceImage").val();
    var ext = file.slice(file.lastIndexOf(".") + 1).toLowerCase();
    if (file == undefined || file == "" || file == null) {
        toastr.error("请选择导入的文件!");
        return;
    } else if ("png" != ext && 'gif' != ext && 'jpg' != ext && 'jpeg' != ext && 'bmp' != ext) {
        toastr.error("只能导入png,gif,jpg,jpeg,bmp图片格式文件!");
        return;
    }
    $('#uploadImageForm').ajaxSubmit({
        url: '/system/fileManage/importImageFile',
        dataType: "json",
        beforeSend: function () {
            swal({
                showCancelButton: false,
                showConfirmButton: false,
                title: "文件上传中",
                imageUrl: "/images/file-loader.gif"
            });
        },
        data: {
            domainId: domainId,
            desc: desc
        },
        success: function (data) {
            if (data.flag < 0) {
                toastr.error(data.message);
                swal.close();
                $("#resourceImage").val('');
            } else {
                swal.close();
                toastr.success("上传成功！");
                $("#resourceImage").val('');
                fileQuery();
                closeImage();
            }
        }
    });
}


/**
 * 导入
 */
function showImportMDFile() {
    $("#importMDModal").modal('show');
}

/**
 * 导入
 */
function showImportJarFile() {
    $("#importJarModal").modal('show');
}

/*关闭导入文件窗口*/
function closeMD() {
    $('#importMDModal').modal('hide');
    $("#resourceMD").val('');

}

/*关闭导入图片窗口*/
function closeJar() {
    $('#importJarModal').modal('hide');
    $("#resourceJar").val('');
}

/*上传图形文件*/
function importMDFile() {
    var domainId = $('#fileDomainId').val();
    if (!domainId) {
        toastr.error("请选择导入文件所属的域!");
        return;
    }
    var desc = $('#mdDesc').val();
    var file = $("#resourceMD").val();
    var ext = file.slice(file.lastIndexOf(".") + 1).toLowerCase();
    if (file == undefined || file == "" || file == null) {
        toastr.error("请选择导入的文件!");
        return;
    } else if ("modelfile" != ext) {
        toastr.error("只能导入modelFile文件!");
        return;
    }
    $('#uploadMDForm').ajaxSubmit({
        url: '/system/fileManage/importModelFile',
        dataType: "json",
        beforeSend: function () {
            swal({
                showCancelButton: false,
                showConfirmButton: false,
                title: "文件上传中",
                imageUrl: "/images/file-loader.gif"
            });
        },
        data: {
            domainId: domainId,
            desc: desc
        },
        success: function (data) {
            if (data.flag < 0) {
                toastr.error(data.message);
                swal.close();
                $("#resourceMD").val('');
            } else {
                toastr.success("上传成功！");
                swal.close();
                $("#resourceMD").val('');
                fileQuery();
                closeMD();

            }
        }
    });
}

/*上传图形文件*/
function importJarFile() {
    var domainId = $('#fileDomainId').val();
    if (!domainId) {
        toastr.error("请选择导入文件所属的域!");
        return;
    }
    var desc = $('#jarDesc').val();
    var file = $("#resourceJar").val();
    var ext = file.slice(file.lastIndexOf(".") + 1).toLowerCase();
    if (file == undefined || file == "" || file == null) {
        toastr.error("请选择导入的文件!");
        return;
    } else if ("jar" != ext) {
        toastr.error("只能导入jar格式文件!");
        return;
    }

    $('#uploadJarForm').ajaxSubmit({
        url: '/system/fileManage/importJarFile',
        dataType: "json",
        beforeSend: function () {
            swal({
                showCancelButton: false,
                showConfirmButton: false,
                title: "文件上传中",
                imageUrl: "/images/file-loader.gif"
            });
        },
        data: {
            domainId: domainId,
            desc: desc
        },
        success: function (data) {
            if (data.flag < 0) {
                toastr.error(data.message);
                swal.close();
                $("#resourceJar").val('');
            } else {
                swal.close();
                toastr.success("上传成功！");
                $("#resourceJar").val('');
                fileQuery();
                closeJar();
            }
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
    var html = '<span class="glyphicon glyphicon-trash" onclick="deleteFile(\'' + row.id + '\',\'' + row.name + '\',\'' + row.fileTypeId + '\')" title="删除" style="color:#f0ad4e;cursor:pointer"></span>';
    if (row.fileTypeId == 3) {
        html += '&nbsp;&nbsp;&nbsp;<span class="glyphicon glyphicon-send" onclick="associationJarFile(\'' + row.id + '\',\'' + row.jarIds + '\')" title="关联Jar" style="cursor:pointer"></span>';
    }
    return [html].join();
}

/**
 * 删除页面信息
 * @param {Object} data
 */
function deleteFile(fileId, fileName, fileType) {
    if (!fileId) {
        toastr.error('请选择文件!');
        return;
    }
    swal({
        title: "删除文件?",
        text: "你确定要删除这个文件吗？",
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
                url: '/system/fileManage/deleteFile',
                data: {
                    fileId: fileId,
                    fileName: fileName,
                    fileType: fileType
                },
                dataType: 'json',
                success: function (data) {
                    var flag = data.flag;
                    if (flag == 0) {
                        fileQuery();
                        successSwal('删除成功');
                    } else {
                        errorSwal(data.message);
                    }
                },
                error: function () {
                    errorSwal('删除失败');
                }
            });
        } else {
            errorSwal('页面没有删除');

        }
    });
}

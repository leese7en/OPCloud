var userFields = [{
    field: 'USER_ID',
    title: 'ID',
    align: 'center',
    valign: 'middle',
    visible: false,
    sortable: false,
}, {
    field: 'USER_NAME',
    title: '用户名',
    align: 'center',
    valign: 'middle',
    sortable: false,
}, {
    field: 'EMAIL',
    title: '邮箱',
    align: 'center',
    valign: 'middle',
    sortable: false
}, {
    field: 'CREATE_DATE',
    title: '创建日期',
    align: 'center',
    valign: 'middle',
    sortable: false
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
//用户信息
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
        $('#userId').val(element.USER_ID);
        $('#userName').val(element.USER_NAME);
        $('#userTable').modal('hide');
        closeUserTableModal();
    });
    queryToken();
});

function closeUserTableModal() {
    $('#userTableModal').modal('hide');
}

function tempClick() {
    var personalTemp = $('#personalTemp').is(':checked');
    if (!personalTemp) {
        $('#personalAging').attr('readonly', 'readonly');
    } else {
        $('#personalAging').removeAttr('readonly');
    }
    var enterpriseTemp = $('#enterpriseTemp').is(':checked');
    if (!enterpriseTemp) {
        $('#enterpriseAging').attr('readonly', 'readonly');
    } else {
        $('#enterpriseAging').removeAttr('readonly');
    }
    var thirdPartyTemp = $('#thirdPartyTemp').is(':checked');
    if (!thirdPartyTemp) {
        $('#thirdPartyAging').attr('readonly', 'readonly');
    } else {
        $('#thirdPartyAging').removeAttr('readonly');
    }
}
/**
 * 显示个人窗口
 */
function showPersonalTokenModal() {
    $('#addPersonalTokenModal').modal({
        static: false
    });
}
/**
 * 创建个人token
 */
function createPersonalToken() {
    var userId = $('#userId').val();
    if (!userId) {
        toastr.warning('请选择用户');
        return;
    }
    var temp = $('#personalTemp').is(':checked');
    var aging = $('#personalAging').val();
    var readRealTime = $('#personalReadRealTime').is(':checked');
    var readArchive = $('#personalReadArchive').is(':checked');
    var readAlarm = $('#personalReadAlarm').is(':checked');
    var readAAlarm = $('#personalReadAAlarm').is(':checked');
    var addPoint = $('#personalAddPoint').is(':checked');
    var updatePoint = $('#personalUpdatePoint').is(':checked');
    var deletePoint = $('#personalDelatePoint').is(':checked');
    var queryPoint = $('#personalQueryPoint').is(':checked');
    var writeRealTime = $('#personalWriteRealTime').is(':checked');
    var writeArchive = $('#personalWriteArchive').is(':checked');
    var runSQL = $('#personalRunSQL').is(':checked');
    var addMTree = $('#personalAddMTree').is(':checked');
    var deleteMTree = $('#personalDeleteMTree').is(':checked');
    var readMTree = $('#personalReadMTree').is(':checked');
    var subRealtime = $('#personalSubRealtime').is(':checked');
    var subAlarm = $('#personalSubAlarm').is(':checked');
    if (!readRealTime && !readArchive && !readAAlarm && !readAlarm && !addPoint && !updatePoint && !deletePoint && !queryPoint && !writeRealTime && !writeArchive && !runSQL && addMTree && deleteMTree) {
        toastr.warning('至少要选择一种权限');
        return;
    }
    if (temp) {
        if (!aging) {
            toastr.warning('有效时长不能为空');
            return;
        }

        if (parseInt(aging) == 'NaN') {
            toastr.warning('有效时长只能为数字');
            return;
        }
        if (aging < 0) {
            toastr.warning('有效时长不能小于0');
            return;
        }
    }
    $.ajax({
        type: 'post',
        url: '/system/user/createToken',
        data: {
            userId: userId,
            temp: temp,
            type: 1,
            aging: aging,
            readRealTime: readRealTime,
            readArchive: readArchive,
            readAlarm: readAlarm,
            readAAlarm: readAAlarm,
            addPoint: addPoint,
            updatePoint: updatePoint,
            deletePoint: deletePoint,
            queryPoint: queryPoint,
            writeRealTime: writeRealTime,
            writeArchive: writeArchive,
            runSQL: runSQL,
            addMTree: addMTree,
            deleteMTree: deleteMTree,
            readMTree: readMTree,
            subRealtime: subRealtime,
            subAlarm: subAlarm
        },
        success: function (data) {
            var flag = data.flag;
            if (flag < 0) {
                errorSwal(data.message);
                return;
            } else {
                queryToken();
                closePersonalTokenModal();
                successSwal('证书生成成功');
            }
        },
        error: function () {
            toastr.error('证书申请失败');
        }
    });
}

/**
 * 关闭个人窗口
 */
function closePersonalTokenModal() {
    $("#addPersonalTokenModal").modal('hide');
}
/**
 * 显示企业窗口
 */
function showEnterpriseTokenModal() {
    $('#addEnterpriseTokenModal').modal({
        static: false
    });
}
/**
 * 创建企业token
 */
function createEnterpriseToken() {
    var temp = $('#enterpriseTemp').is(':checked');
    var aging = $('#enterpriseAging').val();
    var readRealTime = $('#enterpiseReadRealTime').is(':checked');
    var readArchive = $('#enterpiseReadArchive').is(':checked');
    var readAlarm = $('#enterpiseReadAlarm').is(':checked');
    var readAAlarm = $('#enterpiseReadAAlarm').is(':checked');
    var addPoint = $('#enterpiseAddPoint').is(':checked');
    var updatePoint = $('#enterpiseUpdatePoint').is(':checked');
    var deletePoint = $('#enterpiseDelatePoint').is(':checked');
    var queryPoint = $('#enterpiseQueryPoint').is(':checked');
    var writeRealTime = $('#enterpiseWriteRealTime').is(':checked');
    var writeArchive = $('#enterpiseWriteArchive').is(':checked');
    var runSQL = $('#enterpiseRunSQL').is(':checked');
    var addMTree = $('#enterpiseAddMTree').is(':checked');
    var deleteMTree = $('#enterpiseDeleteMTree').is(':checked');
    var readMTree = $('#enterpiseReadMTree').is(':checked');
    var subRealtime = $('#enterpiseSubRealtime').is(':checked');
    var subAlarm = $('#enterpiseSubAlarm').is(':checked');
    if (!readRealTime && !readArchive && !readAAlarm && !readAlarm && !addPoint && !updatePoint && !deletePoint && !queryPoint && !writeRealTime && !writeArchive && !runSQL && addMTree && deleteMTree) {
        toastr.warning('至少要选择一种权限');
        return;
    }
    if (temp) {
        if (!aging) {
            toastr.warning('有效时长不能为空');
            return;
        }

        if (parseInt(aging) == 'NaN') {
            toastr.warning('有效时长只能为数字');
            return;
        }
        if (aging < 0) {
            toastr.warning('有效时长不能小于0');
            return;
        }
    }

    $.ajax({
        type: 'post',
        url: '/system/user/createToken',
        data: {
            temp: temp,
            type: 2,
            aging: aging,
            readRealTime: readRealTime,
            readArchive: readArchive,
            readAlarm: readAlarm,
            readAAlarm: readAAlarm,
            addPoint: addPoint,
            updatePoint: updatePoint,
            deletePoint: deletePoint,
            queryPoint: queryPoint,
            writeRealTime: writeRealTime,
            writeArchive: writeArchive,
            runSQL: runSQL,
            addMTree: addMTree,
            deleteMTree: deleteMTree,
            readMTree: readMTree,
            subRealtime: subRealtime,
            subAlarm: subAlarm
        },
        success: function (data) {
            var flag = data.flag;
            if (flag < 0) {
                errorSwal(data.message);
                return;
            } else {
                queryToken();
                closeEnterpriseTokenModal();
                successSwal('证书生成成功');
            }
        },
        error: function () {
            toastr.error('证书申请失败');
        }
    });
}
/**
 * 关闭企业窗口
 */
function closeEnterpriseTokenModal() {
    $("#addEnterpriseTokenModal").modal('hide');
}
/**
 * 显示第三方窗口
 */
function showThirdPartyTokenModal() {
    $('#addThirdPartyTokenModal').modal({
        static: false
    });
}

/**
 * 获取token信息
 */
function queryToken() {
    $.ajax({
        type: 'post',
        url: '/system/user/queryToken',
        success: function (data) {
            var html = '';
            for (var i in data) {
                var obj = data[i];
                html += '<li href="#" ondblclick="showToken(' + obj.id + ')" title ="双击显示证书"style="cursor:help"><span class="handle"><i class="fa fa-ellipsis-v"></i> <i class="fa fa-ellipsis-v"></i></span>'
                html += '<span class="text">证书类型</span>';
                if (obj.type == 1) {
                    html += '<small class="label label-success">个人证书</small>';
                    html += '<span class="text">拥有者</span><small class="label label-info">' + obj.USER_NAME + '</small>';
                } else if (obj.type == 2) {
                    html += '<small class="label label-info">企业证书</small>';
                    html += '<span class="text">拥有者</span><small class="label label-info">' + obj.USER_NAME + '</small>';
                } else {
                    html += '<small class="label label-warning">第三方证书</small>';
                    html += '<span class="text">拥有者</span><small class="label label-info">' + obj.userName + '</small>';
                }
                if (obj.temp == 0) {
                    html += '<small class="label label-success">永久</small>';
                } else {
                    html += '<small class="label label-danger">临时</small>';
                }
                html += '<input type ="hidden" id ="tokenCode_' + obj.id + '" value ="' + obj.value + '"/>'
                html += '<div class="tools"><i class="fa fa-trash-o" onclick="deleteToken(' + obj.id + ')"></i></div></li>';
            }
            $('#token-list').html(html);
        },
        error: function () {
            toastr.error('证书申请失败');
        }
    });
}

/**
 * 创建第三方token
 */
function createThirdPartyToken() {
    var userName = $('#thirdPartyUserName').val();
    var description = $('#thirdPartyDescription').val();
    var temp = $('#thirdPartyTemp').is(':checked');
    var aging = $('#thirdPartyAging').val();
    var readRealTime = $('#thirdPartyReadRealTime').is(':checked');
    var readArchive = $('#thirdPartyReadArchive').is(':checked');
    var readAlarm = $('#thirdPartyReadAlarm').is(':checked');
    var readAAlarm = $('#thirdPartyReadAAlarm').is(':checked');
    var addPoint = $('#thirdPartyAddPoint').is(':checked');
    var updatePoint = $('#thirdPartyUpdatePoint').is(':checked');
    var deletePoint = $('#thirdPartyDelatePoint').is(':checked');
    var queryPoint = $('#thirdPartyQueryPoint').is(':checked');
    var writeRealTime = $('#thirdPartyWriteRealTime').is(':checked');
    var writeArchive = $('#thirdPartyWriteArchive').is(':checked');
    var runSQL = $('#thirdPartyRunSQL').is(':checked');
    var addMTree = $('#thirdPartyAddMTree').is(':checked');
    var deleteMTree = $('#thirdPartyDeleteMTree').is(':checked');
    var readMTree = $('#thirdPartyReadMTree').is(':checked');
    var subRealtime = $('#thirdPartySubRealtime').is(':checked');
    var subAlarm = $('#thirdPartySubAlarm').is(':checked');
    if (!readRealTime && !readArchive && !readAAlarm && !readAlarm && !addPoint && !updatePoint && !deletePoint && !queryPoint && !writeRealTime && !writeArchive && !runSQL && addMTree && deleteMTree) {
        toastr.warning('至少要选择一种权限');
        return;
    }
    if (temp) {
        if (!aging) {
            toastr.warning('有效时长不能为空');
            return;
        }

        if (parseInt(aging) == 'NaN') {
            toastr.warning('有效时长只能为数字');
            return;
        }
        if (aging < 0) {
            toastr.warning('有效时长不能小于0');
            return;
        }
    }

    $.ajax({
        type: 'post',
        url: '/system/user/createToken',
        data: {
            userName: userName,
            description: description,
            temp: temp,
            type: 3,
            aging: aging,
            readRealTime: readRealTime,
            readArchive: readArchive,
            readAlarm: readAlarm,
            readAAlarm: readAAlarm,
            addPoint: addPoint,
            updatePoint: updatePoint,
            deletePoint: deletePoint,
            queryPoint: queryPoint,
            writeRealTime: writeRealTime,
            writeArchive: writeArchive,
            runSQL: runSQL,
            addMTree: addMTree,
            deleteMTree: deleteMTree,
            readMTree: readMTree,
            subRealtime: subRealtime,
            subAlarm: subAlarm
        },
        success: function (data) {
            var flag = data.flag;
            if (flag < 0) {
                errorSwal(data.message);
                return;
            } else {
                queryToken();
                closeThirdPartyTokenModal();
                successSwal('证书生成成功');
            }
        },
        error: function () {
            toastr.error('证书申请失败');
        }
    })
}
/**
 * 关闭第三方窗口
 */
function closeThirdPartyTokenModal() {
    $('#addThirdPartyTokenModal').modal('hide');
}
/**
 * 获取用户
 * @param flag
 */
function getUser() {
    $.ajax({
        type: 'post',
        url: "/system/user/getUser",
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


function showToken(id) {
    $('#tokenCode').val($('#tokenCode_' + id).val());
    $('#tokenCodeModal').modal({
        static: false
    });
}

function closeTokenCodeModal() {
    $('#tokenCodeModal').modal('hide');
    $('#tokenCode').val('');
}
/**
 * 删除页面信息
 * @param {Object} data
 */
function deleteToken(tokenId) {
    if (!tokenId) {
        toastr.error('请选择证书!');
        return;
    }
    swal({
        title: "删除证书?",
        text: "你确定要删除这个证书吗？",
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
                url: '/system/user/deleteToken',
                data: {
                    id: tokenId
                },
                dataType: 'json',
                success: function (data) {
                    var flag = data.flag;
                    if (flag == 0) {
                        queryToken();
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
            swal('取消', '证书没有删除', 'error');
        }
    });
}

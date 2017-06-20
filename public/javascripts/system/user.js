var roleFields = [{
    field: 'ROLE_ID',
    title: 'ID',
    align: 'center',
    valign: 'middle',
    sortable: false,
}, {
    field: 'ROLE_NAME',
    title: '菜单名',
    align: 'center',
    valign: 'middle',
    sortable: false,
}, {
    field: 'DESCRIPTION',
    title: '描述',
    align: 'center',
    valign: 'middle',
    sortable: false,
}, {
    field: 'ROLE_ID',
    title: '操作',
    align: 'center',
    valign: 'middle',
    sortable: false,
    formatter: 'bindRoleFormatter',
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
    $('#roleTable').bootstrapTable({
        columns: roleFields
    });
    queryUser();
    getDuties();

});

function timeFormatter(value, row, index) {
    return row.CREATE_DATE;
}

function operateFormatter(value, row, index) {
    var html = '';
    if (row.IS_UNVILIABLE) {
        html += '<a class="glyphicon glyphicon-ban-circle"' +
            ' onclick="chageState(' + row.USER_ID + ',' + row.ENTERPRISE_ID + ',' + row.IS_SYSTEM + ',0)"' + //数字0表示启用
            ' style="color:#DD4B39; cursor:pointer" title="启用"></a>';
    } else {
        html += '<a class="glyphicon glyphicon-ok"' +
            ' onclick="chageState(' + row.USER_ID + ',' + row.ENTERPRISE_ID + ',' + row.IS_SYSTEM + ',1)"' + //数字1表示禁用
            ' style="color:#00A65A; cursor:pointer" title="禁用"></a>';
    }
    var opr = [html + "&nbsp;&nbsp;&nbsp;&nbsp;" +

    '<a class="edit" href="javascript:void(0)" title="编辑" style="color:#f0ad4e">',
        '<i class="glyphicon glyphicon-edit"></i></a>',
        '&nbsp;&nbsp;&nbsp;&nbsp;<a class="role" href="javascript:void(0)" title="角色" style="color:#f0ad4e">',
        '<i class="glyphicon glyphicon-user"></i></a>',
        '&nbsp;&nbsp;&nbsp;&nbsp;<a class="menu" href="javascript:void(0)" title="菜单" style="color:#f0ad4e">',
        '<i class="glyphicon glyphicon-book"></i></a>'
    ]
    if (userType != 1) {
        opr.push('&nbsp;&nbsp;&nbsp;&nbsp;<a class="domain" href="javascript:void(0)" title="域信息" style="color:#0000ff">',
            '<i class="glyphicon glyphicon-bed"></i></a>');
        opr.push('&nbsp;&nbsp;&nbsp;&nbsp;<a class="password" href="javascript:void(0)" title="修改密码" style="color:#00ffff">',
            '<i class="glyphicon glyphicon-bell"></i></a>');
        opr.push('&nbsp;&nbsp;&nbsp;&nbsp;<a class="remove" href="javascript:void(0)" title="删除" style="color:red">',
            '<i class="glyphicon glyphicon-trash"></i></a>')

    }
    return opr.join('');
}
//禁用或启用企业和个人开发者用户
function chageState(userID, enterpriseID, systemID, flag) {
    if (systemID == null || systemID == undefined) {
        return;
    }
    //超级管理员进来，只能看到systemID为2和4
    //若禁用2，则表示需要禁用相关企业和普通用户，调用disableOrEnableEnterprise方法，只需要参数enterpriseID
    //若禁用4，则表示禁用个人开发者，只需要禁用userID且systemID为4的用户，需要userID和systemID参数
    //若企业管理员进来，只能看到systemID为3，则禁用的话只能禁用相应userID且systemID为3的用户，需要userID和systemID参数
    if (systemID == 2) {
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
                    queryUser();
                }
            },
            error: function () {
                toastr.error('操作失败');
            }
        });
    } else {
        $.ajax({
            type: 'post',
            url: '/system/customer/disableOrEnableUser',
            data: {
                userID: userID,
                systemID: systemID,
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
                    queryUser();
                }
            },
            error: function () {
                toastr.error('操作失败');
            }
        });
    }


}
/**
 * 绑定事件
 * @type {{[click .remove]: Window.operateEvents.'click .remove', [click .edit]: Window.operateEvents.'click .edit', [click .role]: Window.operateEvents.'click .role', [click .menu]: Window.operateEvents.'click .menu'}}
 */
window.operateEvents = {
    'click .remove': function (e, value, row, index) {
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
                var id = (row.USER_ID);
                if (id != null && id != "") {
                    removeUser(id);
                }
            }
        });
    },
    'click .edit': function (e, value, row, index) {
        var id = (row.USER_ID);
        if (id != null && id != "") {
            showEditUser(id);
        }
    },
    'click .role': function (e, value, row, index) {
        var id = (row.USER_ID);
        if (id != null && id != "") {
            showRole(id);
        }
    },
    'click .menu': function (e, value, row, index) {
        var id = (row.USER_ID);
        if (id != null && id != "") {
            showMenu(id);
        }
    },
    'click .domain': function (e, value, row, index) {
        var id = (row.USER_ID);
        if (id != null && id != "") {
            showDomain(id);
        }
    },
    'click .password': function (e, value, row, index) {
        var id = (row.USER_ID);
        if (id != null && id != "") {
            showPassword(id);
        }
    }
};
/**
 * 显示添加用户对话框
 */
function showAddUser() {
    $('#addUserModal').modal('show');
}
/**
 * 显示绑定角色对话框
 * @param id
 */
function showRole(id) {
    $("#roleUserId").val(id);
    getAllRole(id);
    $('#roleModal').modal('show');
}
/**
 * 显示绑定菜单对话框
 * @param id
 */
function showMenu(id) {
    $("#pageUserId").val(id);
    getAllPage(id);
    $('#menuModal').modal('show');
}
/**
 * 像是对应的 域信息
 * @param id
 */
function showDomain(id) {
    $("#domainUserId").val(id);
    getDomainTree(id);
    $('#domainModal').modal('show');
}
/**
 * 像是对应的 域信息
 * @param id
 */
function showPassword(id) {
    $("#passwordUserId").val(id);
    $('#passwordModal').modal('show');
}
/**
 * 获取对应的 domain  信息
 * @param id
 */
function getDomainTree(id) {
    $.ajax({
        type: 'post',
        url: '/domain/domain/getUserDomain',
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
            name: 'checked',
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
    $('#domainTree').jqxTree({checkboxes: true, source: records, width: '100%', height: '300px'});
    /**
     * 监听 选择事件
     */
    $('#domainTree').on('checkChange', function (event) {
        var element = args.element;
        var checked = args.checked;
        var children = $("#domainTree").jqxTree('getChildrenItems', element);
        if (children.length < 1) {
            return;
        }
        if (checked) {
            for (var i in children) {
                $('#domainTree').jqxTree('checkItem', children[i], true);
            }
        } else {
            for (var i in children) {
                $('#domainTree').jqxTree('checkItem', children[i], false);
            }
        }
    });
    $('.jqx-widget .jqx-checkbox').css('margin-top', '4px');
}
function updateUserDomain() {
    var userId = $('#domainUserId').val();
    var items = $("#domainTree").jqxTree('getCheckedItems');
    var domainIds = new Array();
    for (var i in items) {
        var item = items[i];
        if (item.checked) {
            domainIds.push(item.id);
        }
    }
    $.ajax({
        type: 'post',
        url: '/domain/domain/updateUserDomain',
        dataType: 'json',
        data: {
            userId: userId,
            domainIds: domainIds.toString()
        },
        async: false,
        success: function (value) {
            var flag = value.flag;
            if (flag < 0) {
                toastr.warning(value.message);
                return;
            } else {
                $('#domainModal').modal('hide');
                successSwal('操作成功');
            }
        },
        error: function () {
            toastr.error('获取信息失败');
        }
    });
}
/**
 * 查找用户
 */
function queryUser() {
    var description = $("#description").val();
    var userName = $("#userName").val();
    var opts = $("#table").bootstrapTable('getOptions');
    var offset = ((opts.pageNumber - 1) * opts.pageSize);
    var limit = opts.pageSize;
    $.ajax({
        type: 'POST',
        url: "/system/user/userJsonList",
        data: {
            description: description,
            userName: userName,
            offset: offset,
            limit: limit
        },
        success: function (data) {
            if (data.total == 0) {
                $('#table').bootstrapTable('refreshOptions', {pageNumber: 1});
            }
            $('#table').bootstrapTable('load', data);
        },
        error: function () {
            errorSwal("数据获取失败！");
        },
        async: true,
        dataType: "json"
    });
}
/**
 * 验证用户名（登录名）是否存在
 */
function validateJobNo(jobNo) {
    var flag = false;
    var reg = /^[a-zA-Z0-9_]*$/;
    if (!reg.test(jobNo)) {
        toastr.warning("登录名格式不正确");
        inputBorderErrorColor('job_no');
        return;
    }
    $.ajax({
        type: 'POST',
        url: "/system/user/validateJobNo",
        data: {
            jobNo: jobNo
        },
        async: false,
        success: function (data) {
            if (data.msg == "true") {
                flag = true;
            }
        },
        dataType: "json"
    });
    return flag;
}
/**
 * 添加用户
 */
function addUser() {
    var userName = $("#addUserName").val();
    var jobNo = $("#addJobNo").val();
    var password = $('#addPassword').val();
    var password2 = $('#addPassword2').val();
    var mail = $("#addMail").val();
    var phone = $("#addPhone").val();
    var sex = $("#addSex").val();
    var duty = $("#addDuty").val();
    var addDesc = $("#addDesc").val();
    if (jobNo == null || jobNo == "") {
        toastr.warning("用户名不能为空！");
        return;
    } else if (validateJobNo(jobNo)) {
        toastr.warning("用户名已存在，请修改后继续！");
        return;
    }
    if (userName == null || userName == "") {
        toastr.warning("姓名不能为空！");
        return;
    }
    if (!password) {
        toastr.warning('密码不能为空');
        return;
    }
    if (!password2) {
        toastr.warning('确认密码不能为空');
        return;
    }
    if (password != password2) {
        toastr.warning('两次密码不一样 ');
        return;
    }
    if (mail == null || mail == "") {
        toastr.warning("邮箱不能为空！");
        return;
    }
    if (phone == null || phone == "") {
        toastr.warning("联系方式不能为空！");
        return;
    }
    if (sex == 0 || sex == "") {
        toastr.warning("性别不能为空！");
        return;
    }
    if (duty == 0 || duty == "") {
        toastr.warning("职务不能为空！");
        return;
    }
    password = $.md5(password);
    password2 = $.md5(password2);
    $.ajax({
        type: 'POST',
        url: "/system/user/addUser",
        data: {
            userName: userName,
            jobNo: jobNo,
            password: password,
            password2: password2,
            email: mail,
            mobilePhone: phone,
            sex: sex,
            dutyId: duty,
            userDesc: addDesc
        },
        dataType: "json",
        success: function (data) {
            if (data.flag < 0) {
                toastr.warning(data.message);
                return;
            }
            successSwal("添加成功!");
            closeAddUserModal();
            queryUser();
        },
        error: function (err) {
            toastr.error(err);
        }
    });
}

function resetPassword() {
    var userId = $('#passwordUserId').val();
    if (!userId) {
        toastr.warning('请选择用户');
        return;
    }
    var password = $('#resetPassword').val();
    var password2 = $('#resetPassword2').val();
    if (!password) {
        toastr.warning('密码不能为空');
        return;
    }
    if (password.length < 6 || password.length > 12) {
        toastr.warning('密码位数在6到12位之间');
        return;
    }
    if (!password2) {
        toastr.warning('确认密码不能为空');
        return;
    }
    if (password != password2) {
        toastr.warning('两次密码不一样 ');
        return;
    }
    password = $.md5(password);
    password2 = $.md5(password2);
    $.ajax({
        type: 'POST',
        url: "/system/user/resetPassword",
        data: {
            userId: userId,
            password: password,
            password2: password2
        },
        dataType: "json",
        success: function (data) {
            if (data.flag < 0) {
                toastr.warning(data.message);
                return;
            }
            successSwal("修改成功!");
            closeResetPassword();
        },
        error: function (err) {
            toastr.error(err);
        }
    });
}

function closeResetPassword() {
    $('#passwordModal').modal('hide');
    $('#passwordUserId').val('')
    $('#resetPassword').val('');
    $('#resetPassword2').val('');
}

function closeAddUserModal() {
    $('#addUserModal').modal('hide');
    $("#addUserName").val('');
    $("#addJobNo").val('');
    $('#addPassword').val('');
    $('#addPassword2').val('');
    $("#addMail").val('');
    $("#addPhone").val('');
    $("#addSex").val('-1');
    $("#addDuty").val('-1');
    $("#addDesc").val('');
}
function closeEditUserModal() {
    $('#editUserModal').modal('hide');
    $("#editId").val('');
    $("#editUserName").val('');
    $("#editJobNo").val('').removeAttr("disabled");
    $("#editMail").val('');
    $("#originEmail").val(); //记录原始email
    $("#editPhone").val('');
    $("#originPhone").val('');
    $("#editSex").val('-1');
    $("#editDuty").val('-1');
    $("#editDesc").val('');
}
/**
 * 删除用户
 * @param id
 */
function removeUser(id) {
    $.ajax({
        type: "post",
        url: "/system/user/removeUser",
        data: {
            id: id
        },
        async: false,
        dataType: "json",
        success: function (data) {
            if (data.flag < 0) {
                errorSwal(data.message);
                return
            }
            queryUser();
            successSwal("数据删除成功！");
        },
        error: function () {
            errorSwal("数据删除失败!");
        }
    });
}
/**
 * 显示编辑用户对话框
 * @param id
 */
function showEditUser(id) {
    $.ajax({
        type: 'POST',
        url: "/system/user/userById",
        data: {
            id: id
        },
        success: function (data) {
            $("#editId").val(id);
            $("#editUserName").val(data[0].USER_NAME);
            $("#editJobNo").val(data[0].JOB_NO).attr("disabled", "disabled");
            $("#editMail").val(data[0].EMAIL);
            $("#originEmail").val(data[0].EMAIL); //记录原始email
            $("#editPhone").val(data[0].MOBILE_PHONE);
            $("#originPhone").val(data[0].MOBILE_PHONE);
            $("#editSex").val(data[0].GENDER);
            $("#editDuty").val(data[0].DUTY_ID);
            $("#editDesc").val(data[0].DESCRIPTION);
        },
        error: function () {

        },
        dataType: "json"
    });
    $('#editUserModal').modal('show');
}
/**
 * 编辑用户
 */
function editUser() {

    var id = $("#editId").val();
    var userName = $("#editUserName").val();
    var jobNo = $("#editJobNo").val();
    var mail = $("#editMail").val();
    var phone = $("#editPhone").val();
    var sex = $("#editSex").val();
    var duty = $("#editDuty").val();
    var editDesc = $("#editDesc").val();
    if (jobNo == null || jobNo == "") {
        errorSwal("用户名不能为空！");
        return;
    }
    if (userName == null || userName == "") {
        errorSwal("姓名不能为空！");
        return;
    }
    if (mail == null || mail == "") {
        errorSwal("邮箱不能为空！");
        return;
    }
    if (phone == null || phone == "") {
        errorSwal("联系方式不能为空！");
        return;
    }
    if (sex == null || sex == "") {
        errorSwal("性别不能为空！");
        return;
    }
    if (duty == null || duty == "") {
        errorSwal("职务不能为空！");
        return;
    }
    $.ajax({
        type: 'POST',
        url: "/system/user/editUser",
        data: {
            id: id,
            userName: userName,
            jobNo: jobNo,
            mail: mail,
            phone: phone,
            sex: sex,
            duty: duty,
            userDesc: editDesc
        },
        dataType: "json",
        success: function (data) {
            if (data.flag < 0) {
                toastr.warning(data.message);
                return;
            }
            successSwal("修改成功!");
            closeEditUserModal();
            queryUser();
        },
        error: function (err) {
            toastr.error("编辑失败！");
        }
    });
}
/**
 * 表数据加载
 * @param data
 */
function setTableValue(data) {
    $('#table').bootstrapTable('load', data);
}
/**
 * 时间格式化
 * @param value
 * @param row
 * @param index
 * @returns {*}
 */
function timeFormatter(value, row, index) {
    return $.format.date(value, "yyyy-MM-dd HH:mm:ss");
}
//用户类别is_system格式化
function userTypeFormatter(value, row, index) {
    switch (value) {
        case 1:
            return '超级管理员';
            break;
        case 2:
            return '企业管理员';
            break;
        case 3:
            return '企业普通用户';
            break;
        case 4:
            return '开发者用户';
            break;
        default:
            return '数据错误';
    }
}

function bindRoleFormatter(value, row, index) {
    if (row.isBind == 1) {
        return '<button id ="role_' + row.ROLE_ID + '"  onclick="unBindRole(\'' + row.ROLE_ID + '\')"><font color="red">解绑</font></button>';
    } else if (row.isBind == 0) {
        return '<button id ="role_' + row.ROLE_ID + '"  onclick="bindRole(\'' + row.ROLE_ID + '\')"><font color="green">绑定</font></button>';
    }
}

/**
 * 获取所有角色
 * @param id
 */
function getAllRole(id) {
    var userId;
    if (id == undefined || id == "" || id == null) {
        userId = $("#roleUserId").val();
    } else {
        userId = id;
    }
    $.ajax({
        type: 'POST',
        url: "/system/userRole/getAllRoleByUser",
        data: {
            userId: userId
        },
        success: function (data) {
            $('#roleTable').bootstrapTable('load', data);
            $('#roleTable').bootstrapTable('refresh');
        },
        error: function () {
            errorSwal("数据获取失败！");
        },
        async: true,
        dataType: "json"
    });
}
/**
 * 绑定角色
 * @param roleId
 */
function bindRole(roleId) {
    var userId = $("#roleUserId").val();
    $.ajax({
        type: 'POST',
        url: "/system/userRole/bindRole",
        data: {
            userId: userId,
            roleId: roleId
        },
        success: function (data) {
            if (data.msg == "success") {
                $('#role_' + roleId).parent().html('<button id ="role_' + roleId + '" onclick="unBindRole(\'' + roleId + '\')"><font color="red">解绑</font></button>');
                successSwal("绑定角色成功！");
            } else {
                errorSwal("绑定角色失败！");
            }
        },
        error: function () {
            errorSwal("绑定角色失败！");
        },
        async: true,
        dataType: "json"
    });
}
/**
 * 解绑角色
 * @param roleId
 */
function unBindRole(roleId) {
    var userId = $("#roleUserId").val();
    $.ajax({
        type: 'POST',
        url: "/system/userRole/unBindRole",
        data: {
            userId: userId,
            roleId: roleId
        },
        success: function (data) {
            if (data.msg == "success") {
                $('#role_' + roleId).parent().html('<button id ="role_' + roleId + '" onclick="bindRole(\'' + roleId + '\')"><font color="green">绑定</font></button>');
                successSwal("解绑角色成功！");
            } else {
                errorSwal("解绑角色失败！");
            }
        },
        error: function () {
            errorSwal("解绑角色失败！");
        },
        async: true,
        dataType: "json"
    });
}
/**
 * 获取所有菜单
 */
function getAllPage() {
    var userId = $("#pageUserId").val();
    $.ajax({
        type: 'POST',
        url: "/system/userPage/getAllPageByUser",
        data: {
            userId: userId
        },
        success: function (data) {
            initPageInfoTable(data.data);
        },
        error: function () {
            errorSwal("数据获取失败！");
        },
        async: true,
        dataType: "json"
    });
}

/*格式化菜单信息*/

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
            name: 'icon',
            type: 'string'
        }, {
            name: 'isBind',
            type: 'number'
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
    $("#menuTable").jqxTreeGrid({
        width: 570,
        height: 300,
        source: dataAdapter,
        sortable: true,
        ready: function () {
            $("#menuTable").jqxTreeGrid('expandRow', '0');
        },
        columns: [{
            text: '名称',
            dataField: 'pageName',
            width: '30%'
        }, {
            text: '路径',
            dataField: 'url',
            width: '35%'
        }, {
            text: '描述',
            dataField: 'description',
            width: '20%'
        }, {
            text: '操作',
            cellsalign: 'left',
            cellsrenderer: operate,
            width: '13%'
        }]
    });
}

/**
 * 显示绑定和解绑操作
 * @param {Object} value
 * @param {Object} row
 * @param {Object} index
 * @return {TypeName}
 */
function operate(id, value, index, rowData) {
    if (rowData.url) {
        if (rowData.isBind == 1) {
            return '<button id ="page_' + rowData.pageId + '"  onclick="unBindPage(\'' + rowData.pageId + '\')"><font color="red">解绑</font></button>';
        } else {
            return '<button id ="page_' + rowData.pageId + '"  onclick="bindPage(\'' + rowData.pageId + '\')"><font color="green">绑定</font></button>';
        }
    } else {
        return '';
    }
}

/**
 * 绑定菜单
 * @param pageId
 */
function bindPage(pageId) {
    var userId = $("#pageUserId").val();
    $.ajax({
        type: 'POST',
        url: "/system/userPage/bindPage",
        data: {
            userId: userId,
            pageId: pageId
        },
        success: function (data) {
            if (data.msg == "success") {
                var row = $("#menuTable").jqxTreeGrid('getRow', pageId);
                row.isBind = 1;
                $("#menuTable").jqxTreeGrid('updateRow', pageId, row);
                successSwal("绑定菜单成功！");
            } else {
                errorSwal("绑定菜单失败！");
            }
        },
        error: function () {
            errorSwal("绑定菜单失败！");
        },
        async: true,
        dataType: "json"
    });
}
/**
 * 解绑菜单
 * @param pageId
 */
function unBindPage(pageId) {
    var userId = $("#pageUserId").val();
    $.ajax({
        type: 'POST',
        url: "/system/userPage/unBindPage",
        data: {
            userId: userId,
            pageId: pageId
        },
        success: function (data) {
            if (data.msg == "success") {
                var row = $("#menuTable").jqxTreeGrid('getRow', pageId);
                row.isBind = 0;
                $("#menuTable").jqxTreeGrid('updateRow', pageId, row);
                successSwal("解绑菜单成功！");
            } else {
                errorSwal("解绑菜单失败！");
            }
        },
        error: function () {
            errorSwal("解绑菜单失败！");
        },
        async: true,
        dataType: "json"
    });
}
/**
 * 成功
 * @param message
 * @param timer
 */
function successSwal(message, timer) {
    swal({
        title: "提示",
        text: message ? message : "操作成功！",
        // type: "info",
        type: "success",
        timer: timer ? timer : 1500,
        closeOnConfirm: false
    });
}
/**
 * 失败
 * @param message
 */
function errorSwal(message) {
    swal({
        title: "错误",
        text: message ? message : "操作失败！",
        type: "error",
        timer: 2000,
        closeOnConfirm: false
    });
}

/*验证企业登录名
 * 用户登录名
 * */
function validateAddJobNo() {
    var jobNo = $('#addJobNo').val().trim();
    $('#addJobNo').val(jobNo);
    if (!jobNo) {
        toastr.warning('登录名不能为空');
        inputBorderErrorColor('addJobNo');
        return;
    }
    if (jobNo.length < 3 || jobNo.length > 12) {
        toastr.warning('登录名格式不对，需要在3到12位之间');
        inputBorderErrorColor('addJobNo');
        return;
    }
    var reg = /^[a-zA-Z0-9_]*$/;
    if (!reg.test(jobNo)) {
        toastr.warning("登录名格式不正确");
        inputBorderErrorColor('addJobNo');
        return;
    }
    $.ajax({
        url: '/system/customer/validateJobNo',
        type: 'post',
        data: {
            jobNo: jobNo
        },
        dataType: 'json',
        success: function (data) {
            if (data.flag < 0) {
                toastr.warning(data.message);
                inputBorderErrorColor('addJobNo');
                return;
            }
            inputBorderCorrectColor('addJobNo');
        },
        error: function (err) {
            toastr.error(err);
        }
    });
}

/*验证姓名是否为空*/
function validateAddUserName() {
    var userName = $('#addUserName').val().trim();
    $('#addUserName').val(userName);
    inputBorderCorrectColor('addUserName');
    if (!userName) {
        toastr.warning('姓名不能为空');
        inputBorderErrorColor('addUserName');
        return;
    }
}
/*编辑------验证姓名是否为空*/
function validateEditUserName() {
    var userName = $('#editUserName').val().trim();
    $('#editUserName').val(userName);
    inputBorderCorrectColor('editUserName');
    if (!userName) {
        toastr.warning('姓名不能为空');
        inputBorderErrorColor('editUserName');
        return;
    }
}

/*验证密码是否为空,和是否相等*/
function validateAddPassword() {
    var password = $('#addPassword').val();
    var password2 = $('#addPassword2').val();
    inputBorderCorrectColor('addPassword');
    if (password && password.length < 6 || password.length > 12) {
        toastr.warning('密码格式不对，需要在6到12位之间');
        inputBorderErrorColor('addPassword');
        return;
    }
    if (!password) {
        toastr.warning('密码不能为空');
        inputBorderErrorColor('addPassword');
        return;
    } else if (password2) {
        inputBorderCorrectColor('addPassword');
        inputBorderCorrectColor('addPassword2');
        if (password != password2) {
            toastr.warning('两次输入的密码不相同');
            inputBorderErrorColor('addPassword');
            inputBorderErrorColor('addPassword2');
            return;
        }
    }
}
/*验证确认密码是否为空,和是否相等*/
function validateAddPassword2() {
    var password = $('#addPassword').val();
    var password2 = $('#addPassword2').val();
    inputBorderCorrectColor('addPassword2');
    if (password2 && password2.length < 6 || password2.length > 12) {
        toastr.warning('密码格式不对，需要在6到12位之间');
        inputBorderErrorColor('addPassword2');
        return;
    }
    if (!password || !password2) {
        toastr.warning('密码不能为空');
        inputBorderErrorColor('addPassword2');
        return;
    } else if (password) {
        inputBorderCorrectColor('addPassword');
        inputBorderCorrectColor('addPassword2');
        if (password != password2) {
            toastr.warning('两次输入的密码不相同');
            inputBorderErrorColor('addPassword');
            inputBorderErrorColor('addPassword2');
            return;
        }
    }
}
/*验证邮箱格式是否正确,判断是否注册过*/
function validateAddEmail() {
    var email = $('#addMail').val().trim();
    $('#addMail').val(email);
    inputBorderCorrectColor('addMail');
    if (!email) {
        toastr.warning('邮箱不能为空');
        inputBorderErrorColor('addMail');
        return;
    } else {
        var reg = /^\w+((-\w+)|(\.\w+))*\@[A-Za-z0-9]+((\.|-)[A-Za-z0-9]+)*\.[A-Za-z0-9]+$/;
        var flag = reg.test(email);
        if (!flag) {
            toastr.warning("邮箱格式不正确");
            inputBorderErrorColor('addMail');
            return;
        } else {
            $.ajax({
                url: '/system/publicInfo/validateEmail',
                type: 'post',
                data: {
                    email: email
                },
                dataType: 'json',
                success: function (data) {
                    if (data.flag < 0) {
                        toastr.warning(data.message);
                        inputBorderErrorColor('addMail');
                        return;
                    }
                    inputBorderCorrectColor('addMail');
                },
                error: function (err) {
                    toastr.error(err);
                }
            });
        }
    }
}
/*编辑-------验证邮箱格式是否正确,判断是否注册过*/
function validateEditEmail() {
    var email = $('#editMail').val().trim();
    var originEmail = $('#originEmail').val().trim(); //原始email
    $('#editMail').val(email);
    inputBorderCorrectColor('editMail');
    //编辑的时候邮箱如果更改了才需要验证是否重复
    if (email != originEmail) {
        if (!email) {
            toastr.warning('邮箱不能为空');
            inputBorderErrorColor('editMail');
            return;
        } else {
            var reg = /^\w+((-\w+)|(\.\w+))*\@[A-Za-z0-9]+((\.|-)[A-Za-z0-9]+)*\.[A-Za-z0-9]+$/;
            var flag = reg.test(email);
            if (!flag) {
                toastr.warning("邮箱格式不正确");
                inputBorderErrorColor('editMail');
                return;
            } else {
                $.ajax({
                    url: '/system/publicInfo/validateEmail',
                    type: 'post',
                    data: {
                        email: email
                    },
                    dataType: 'json',
                    success: function (data) {
                        if (data.flag < 0) {
                            toastr.warning(data.message);
                            inputBorderErrorColor('editMail');
                            return;
                        }
                        inputBorderCorrectColor('editMail');
                    },
                    error: function (err) {
                        toastr.error(err);
                    }
                });
            }
        }
    }
}
/*验证电话号码格式是否正确，是否被注册过*/
function validateAddPhone() {
    var phone = $('#addPhone').val().trim();
    $('#addPhone').val(phone);
    inputBorderCorrectColor('addPhone');
    if (!phone) {
        toastr.warning('电话号码不能为空');
        inputBorderErrorColor('addPhone');
        return;
    } else {
        var flag = false;
        var isPhone = /^([0-9]{3,4}-)?[0-9]{7,8}$/;
        var isMob = /^((\+?86)|(\(\+86\)))?(13[012356789][0-9]{8}|15[012356789][0-9]{8}|18[02356789][0-9]{8}|147[0-9]{8}|1349[0-9]{7})$/;
        flag = isPhone.test(phone) || isMob.test(phone);
        if (!flag) {
            toastr.warning("电话号码格式不正确");
            inputBorderErrorColor('addPhone');
            return;
        } else {
            $.ajax({
                url: '/system/publicInfo/validatePhone',
                type: 'post',
                data: {
                    phone: phone
                },
                dataType: 'json',
                success: function (data) {
                    if (data.flag < 0) {
                        toastr.warning(data.message);
                        inputBorderErrorColor('addPhone');
                        return;
                    }
                    inputBorderCorrectColor('addPhone');
                },
                error: function (err) {
                    toastr.error(err);
                }
            });
        }
    }
}
/*编辑-------验证电话号码格式是否正确，是否被注册过*/
function validateEditPhone() {
    var phone = $('#editPhone').val().trim();
    var originPhone = $('#originPhone').val().trim();
    $('#addPhone').val(phone);
    inputBorderCorrectColor('editPhone');
    if (originPhone != phone) {
        if (!phone) {
            toastr.warning('电话号码不能为空');
            inputBorderErrorColor('editPhone');
            return;
        } else {
            var flag = false;
            var isPhone = /^([0-9]{3,4}-)?[0-9]{7,8}$/;
            var isMob = /^((\+?86)|(\(\+86\)))?(13[012356789][0-9]{8}|15[012356789][0-9]{8}|18[02356789][0-9]{8}|147[0-9]{8}|1349[0-9]{7})$/;
            flag = isPhone.test(phone) || isMob.test(phone);
            if (!flag) {
                toastr.warning("电话号码格式不正确");
                inputBorderErrorColor('editPhone');
                return;
            } else {
                $.ajax({
                    url: '/system/publicInfo/validatePhone',
                    type: 'post',
                    data: {
                        phone: phone
                    },
                    dataType: 'json',
                    success: function (data) {
                        if (data.flag < 0) {
                            toastr.warning(data.message);
                            inputBorderErrorColor('editPhone');
                            return;
                        }
                        inputBorderCorrectColor('editPhone');
                    },
                    error: function (err) {
                        toastr.error(err);
                    }
                });
            }
        }
    }
}
/*验证性别是否为空*/
function validateAddSex() {
    var sex = $('#addSex').val();
    inputBorderCorrectColor('addSex');
    if (sex == 0) {
        toastr.warning('请选择性别');
        inputBorderErrorColor('addSex');
        return;
    }
}
/*编辑-------验证性别是否为空*/
function validateEditSex() {
    var sex = $('#editSex').val();
    inputBorderCorrectColor('editSex');
    if (sex == 0) {
        toastr.warning('请选择性别');
        inputBorderErrorColor('editSex');
        return;
    }
}
/*验证职务是否为空*/
function validateAddDuty() {
    var duty_id = $('#addDuty').val();
    inputBorderCorrectColor('addDuty');
    if (duty_id == 0) {
        toastr.warning('请选择职务');
        inputBorderErrorColor('addDuty');
        return;
    }
}
/*编辑-------验证职务是否为空*/
function validateEditDuty() {
    var duty_id = $('#editDuty').val();
    inputBorderCorrectColor('editDuty');
    if (duty_id == 0) {
        toastr.warning('请选择职务');
        inputBorderErrorColor('editDuty');
        return;
    }
}
/*去除描述的前后空格*/
function trimDesc() {
    var addDesc = $('#addDesc').val().trim();
    var editDesc = $('#editDesc').val().trim();
    $('#addDesc').val(addDesc);
    $('#editDesc').val(editDesc);
}

/*获取职务信息*/
function getDuties() {
    $.ajax({
        type: 'POST',
        url: "/system/publicInfo/getDuties",
        dataType: "json",
        async: false,
        success: function (data) {
            if (data.flag < 0) {
                toastr.error(data.message);
                return;
            }
            var data = data.data;
            var html = '';
            for (var i in data) {
                var obj = data[i];
                html += '<option value="' + obj.id + '">' + obj.name + '</option>';
            }
            html = '<option value="0">请选择</option>' + html;
            $('#addDuty, #editDuty').html(html);
        }
    });
}

/*输入错误后输入框边框变红*/
function inputBorderErrorColor(JQueryElementId) {
    var $item = $('#' + JQueryElementId);
    if (!$item.hasClass('inputErr')) {
        $item.addClass('inputErr');
    }
}
/*输入正确后输入框边颜色正确*/
function inputBorderCorrectColor(JQueryElementId) {
    var $item = $('#' + JQueryElementId);
    if ($item.hasClass('inputErr')) {
        $item.removeClass('inputErr');
    }
}
// 中文验证
var SpecialCharPattern = /^[^\u4e00-\u9fa5]{0,}$/;
// 验证IP的正则表达式
var IPPattern = /^(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])$/;
// 验证正整数的正则表达式
var PositiveIntergerPattern = /^[0-9]+$/;
var serviceFields = [ {
    field: 'state',
    checkbox: true
}, {
    field: 'ID',
    title: '序号',
    align: 'center',
    valign: 'middle',
    sortable: true,
    visible : false,
}, {
    field: 'NAME',
    title: '服务名称',
    align: 'left',
    valign: 'top',
    sortable: true,
},{
    field: 'TYPE',
    title: '服务类型',
    align: 'left',
    valign: 'top',
    sortable: true,
}, {
    field: 'DESC',
    title: '描述',
    align: 'left',
    valign: 'top',
    sortable: true,
}, {
    field: 'STATUS',
    title: '状态',
    align: 'left',
    valign: 'top',
    sortable: true,
} ];
var driverFields = [ {
    field: 'state',
    checkbox: true
}, {
    field: 'DRIVER_NAME',
    title: '驱动名称',
    align: 'center',
    valign: 'middle',
    sortable: true,
}, {
    field: 'VERSION',
    title: '驱动版本',
    align: 'left',
    valign: 'top',
    sortable: true,
},{
    field: 'UPLOAD_TIME',
    title: '上传时间',
    align: 'left',
    valign: 'top',
    sortable: true,
}, {
    field: 'DRIVER_DESC',
    title: '描述',
    align: 'left',
    valign: 'top',
    sortable: true,
}, {
    field: 'operate',
    title: '操作',
    align: 'center',
    valign: 'middle',
    formatter: 'operateFormatter',
    events: 'operateEvents'
} ];
$(document).ready(function(){
    show('service');
});
//服务配置
function ModifyServer(){
    var retValue = '';
    var form = document.forms['server-config-form'];
    var obj = "";
    //验证
    for (var i = 0; i < form.length; i++) {
        var alt = form[i].alt;
        if(alt != ""){
            //非空验证
            if(alt == "isnull"){
                retValue =  validateIsNull($(form[i]));
                if(!retValue.status){
                    obj = $(form[i]);
                    break;
                }
            }
            if(alt == "isnum"){
                retValue = validateIsNum($(form[i]));
                if(!retValue.status){
                    obj = $(form[i]);
                    break;
                }
            }
            if(alt == "isip"){
                retValue = validateIsIP($(form[i]));
                if(!retValue.status){
                    obj = $(form[i]);
                    break;
                }
            }
            if(alt == "iscn"){
                retValue = validateIsCN($(form[i]));
                if(!retValue.status){
                    obj = $(form[i]);
                    break;
                }
            }
        }

    }
    //验证不通过
    if(!retValue.status){
        alert(retValue.msg);
        obj.focus();
        return false;
    }
    var datas = "{";
    for (var i = 0; i < form.length; i++) {
        datas += "\"" + form[i].id + "\"" + ":" + "\""
            + form[i].value + "\"" + ",";
    }
    datas = datas.substring(0, datas.length - 1) + "}";
    var dt = JSON.parse(datas);
    $.ajax({
        type: 'POST',
        url: "/domain/system/modifyServerConfig",
        data:dt,
        success: function (data) {
            if (data.msg != null && data.msg != "fail") {
                successSwal("配置成功!");
                $('#serverConfigModal').modal('hide');
            }else{
                errorSwal("数据获取失败！");
                $('#server-config').empty();
            }
        },
        error: function () {
            errorSwal("数据获取失败！");
        },
        async:true,
        dataType: "json"
    });
}
function operateFormatter(value, row, index) {
    return [
        '<a class="remove" href="javascript:void(0)" title="删除" style="color:#f0ad4e">',
        '<i class="glyphicon glyphicon-trash"></i>',
        '</a>'
    ].join('');
}
//传值到子级页面
window.disnameEvents = {
    'click #disname':function(e, value, row, index) {
        var dev_code =(row.DEV_CODE);
        $.ajax({
            type: 'POST',
            url: "/domain/das/setValue",
            data:{
                dev_code:dev_code
            },
            success: function (data) {
            },
            error: function () {
                errorSwal("数据获取失败！");
            },
            async:true,
            dataType: "json"
        });
    }
}
window.operateEvents = {
    /*
     *删除用户
     */
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
                var filename = (row.FILE_NAME);
                if (filename != null && filename != "") {
                    removeDriver(filename);
                }
            }
        });
    },
    /*
     *编辑用户
     */
    'click .edit': function (e, value, row, index) {
        var id = (row.DEV_ID);
        if (id != null && id != "") {
            showEditDevinfo(id);
        }
    }
};

function show(status){
    var URL = "";
    if(status == 'service'){
        URL = "/domain/system/serviceList";
        $('#serviceButton').show();
        $('#driverButton').hide();
        $('#table').bootstrapTable('destroy');
        $('#table').bootstrapTable({
            pageName: "服务列表",
            key: "ID",
            columns: serviceFields
        });
    }else{
        URL = "/domain/system/driverList";
        $('#driverButton').show();
        $('#serviceButton').hide();
        $('#table').bootstrapTable('destroy');
        $('#table').bootstrapTable({
            pageName: "驱动列表",
            key: "FILE_NAME",
            columns: driverFields
        });
    }
    $.ajax({
        type: 'POST',
        url: URL,
        data:{
            status:status
        },
        success: function (data) {
            $('#table').bootstrapTable('load',data);
            $('#table').bootstrapTable('refresh');
        },
        error: function () {
            errorSwal("数据获取失败！");
        },
        async:true,
        dataType: "json"
    });
}

function showAddCsv(){
    var rows = $table.bootstrapTable('getSelections');
    if (rows == undefined || rows == null || rows == "") {
        errorSwal("请选择要操作的服务！");
        return;
    }else if(rows.length > 1){
        errorSwal("操作不正确！");
        return;
    }
    $('#addCsvModal').modal({
        backdrop : 'static',
        keyboard : true
    });
    $.ajax({
        type: 'POST',
        url: "/device/device/DeviceList",
        data:{
            status:"on"
        },
        success: function (data) {
            if(data != null && data.rows != null){
                var datajson = data.rows;
                var html = "";
                for(var i=0;i<datajson.length;i++){
                    html += '<tr>';
                    html += '<td><input type="checkbox"  name="devcode" value="'
                        + datajson[i].DEV_CODE + '"></td>'
                    html += '<td>'+datajson[i].NAME+'</td>';
                    html += '<td>'+datajson[i].DEV_CODE+'</td>';
                    html += '<td>'+datajson[i].GROUPNAME+'</td>';
                    html += '</tr>';
                }
                $("#add-csv-table tbody").html(html);
            }else{
                $("#add-csv-table tbody").empty();
            }
        },
        error: function () {
            errorSwal("数据获取失败！");
        },
        async:true,
        dataType: "json"
    });

}
function showConfigModal(){
    var rows = $table.bootstrapTable('getSelections');
    if (rows == undefined || rows == null || rows == "") {
        errorSwal("请选择要操作的服务！");
        return;
    }else if(rows.length > 1){
        errorSwal("操作不正确！");
        return;
    }
    var type = rows[0].TYPE;
    $.ajax({
        type: 'POST',
        url: "/dasService/das/DasConfig",
        data:{
            "type" : type,
            "scope" : "addServer"
        },
        success: function (data) {
            if (data.msg != null && data.msg != "fail") {
                $('#config-html').val(data.msg);
                var t2 = $('#config-html').val();
                $('#config-html').val('');
                var servers=eval(t2);
                var html='<tr><td><label>服务名称</label></td><td><input type="text"  disabled class="form-control" id="name" value="'+type+'"/></td>';
                for (var i = 1; i < servers.length; i++) {
                    var server = servers[i];
                    html += '<td><label>'+server.Desc+'</label></td>';
                    html += '<td><input type="text" class="form-control" name="'+server.Id+'" id="'+server.Id+'"';
                    if(server.Validate != ""){
                        html += 'alt='+server.Validate+' ';
                    }
                    html += '/></td>';
                    if((i+1) % 3 == 0){
                        html += '</tr><tr>';
                    }
                }
                html += '</tr>';
                $('#server-config').empty();
                $('#server-config').append(html);
            }else{
                errorSwal("数据获取失败！");
                $('#server-config').empty();
            }
        },
        error: function () {
            errorSwal("数据获取失败！");
        },
        async:true,
        dataType: "json"
    });
    $('#serverConfigModal').modal({
        backdrop : 'static',
        keyboard : true
    });
    var form = document.forms['server-config-form'];
    $.ajax({
        type: 'POST',
        url: "/domain/system/transmitserviceinfo",
        data:{
            "type" : "redis2openplant",
        },
        success: function (data) {
            if (data.msg != null && data.msg != "fail") {
                var dt = eval(data.msg);
                for (var i = 0; i < form.length; i++) {
                    var Id = form[i].id;
                    for(var j=0;j<dt.length;j++){
                        if (dt[j].key == Id) {
                            $("#" + Id + "").val(dt[j].value);
                        }
                    }
                }
            }else{
                errorSwal("数据获取失败！");
                $('#server-config').empty();
            }
        },
        error: function () {
            errorSwal("数据获取失败！");
        },
        async:true,
        dataType: "json"
    });
}
function startServer(){

}
function stopServer(){

}
function removeDriver(filename) {
    $.ajax({
        type: "post",
        url: "/domain/system/removeDriver",
        data: {
            filename: filename
        },
        async: false,
        dataType: "json",
        success: function (data) {
            if (data.msg == "success") {
                show('driver');
                successSwal("数据删除成功！");
            } else {
                errorSwal("数据删除失败！");
            }
        },
        error: function () {
            swal("删除失败!", "数据删除失败！", "success");
        }
    });
}
function showUpdateDriver(){
   // $('#driverUpdate').modal('show');
    $('#driverUpdate').modal({
        backdrop : 'static',
        keyboard : true
    });
}
function driverUpdate(){
    var file = $("#resource").val();
    var ext = file.slice(file.lastIndexOf(".")+1).toLowerCase();
    //if(file == undefined|| file =="" || file == null){
    //    errorSwal("请选择导入的文件!");
    //    return;
    //}else if ("gz" != ext && "tar.gz" !=ext) {
    //    errorSwal("请导入正确的驱动文件!");
    //    return;
    //}
    //$('#driverUpdateForm').submit();
    $('#driverUpdateForm').ajaxSubmit({
        url: '/domain/system/driverUpdate',
        dataType: "json",
        data:{},
        success:function (data) {
            if(data != null){
                $('#input_text').val(data.msg);
                var text = $('#input_text').val();
                var info = $.parseJSON(text);
                // 得到驱动信息并设置'驱动名称','协议版本','驱动版本','发布时间'的值
                $('#modal-driver-name').text(info.name);
                $('#modal-driver-protocol').text(info.protocol_version);
                $('#modal-driver-version').text(info.version);
                $('#modal-driver-time').text(info.publish_time);
            }
        }
    });
}
function closeUpload(){
    $('#driverUpdate').modal('hide');
    show('driver');
}
function timeFormatter(value, row, index) {
    return $.format.date(value, "yyyy-MM-dd HH:mm:ss");
}
//中文验证
function validateIsCN(el){
    var value = el.val();
    var id = el.context.id;
    var retValue = {};
    if ("" == value || value == null) {
        retValue.status = false;
        retValue.msg = id+"不能为空.";

    }else if (!SpecialCharPattern.test(value) ) {
        retValue.status = false;
        retValue.msg = id+"不能为中文!";
    }else {
        retValue.status = true;
        retValue.msg = "";
    }
    return retValue;
}
//IP验证
function validateIsIP(el){
    var value = el.val();
    var id = el.context.id;
    var retValue = {};
    if ("" == value || value == null) {
        retValue.status = false;
        retValue.msg = id+"不能为空.";

    }else if (!IPPattern.test(value) ) {
        retValue.status = false;
        retValue.msg = id+"不合法!";
    }else {
        retValue.status = true;
        retValue.msg = "";
    }
    return retValue;
}
//验证数字
function validateIsNum(el){
    var value = el.val();
    var id = el.context.id;
    var retValue = {};
    if ("" == value || value == null) {
        retValue.status = false;
        retValue.msg = id+"不能为空.";

    }else if (!PositiveIntergerPattern.test(value) ) {
        retValue.status = false;
        retValue.msg = id+"只能为数字!";
    }else {
        retValue.status = true;
        retValue.msg = "";
    }
    return retValue;
}
//验证是否为空
function validateIsNull(el){
    var value = el.val();
    var id = el.context.id;
    var retValue = {};
    if ("" == value || value == null) {
        retValue.status = false;
        retValue.msg = id+"不能为空.";

    } else {
        retValue.status = true;
        retValue.msg = "";
    }
    return retValue;
}
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


function errorSwal(message) {
    swal({
        title: "错误",
        text: message ? message : "操作失败！",
        type: "error", timer: 2000,
        closeOnConfirm: false
    });
}
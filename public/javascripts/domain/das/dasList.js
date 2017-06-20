// 中文验证
var SpecialCharPattern = /^[^\u4e00-\u9fa5]{0,}$/;
// 验证IP的正则表达式
var IPPattern = /^(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])$/;
// 验证正整数的正则表达式
var PositiveIntergerPattern = /^[0-9]+$/;
// 字符串长度为1-20
var NamePattern = /^\S{1,20}$/;
$(document).ready(function(){
    showDasList();
    getDevcode();
});
function finddriver(){
    $("#driver-file-list").show();
    var devcode = $('#devcode').val();
    $.ajax({
        type: 'POST',
        url: "/device/device/finddriver",
        data:{
            devcode : devcode
        },
        success: function (data) {
            if(data != null ){
                if(data.status == true){
                    getDriverByDevcode(devcode);
                }else{
                    errorSwal(data.msg);
                }
            }else{
                errorSwal("数据获取失败！");
            }
        },
        error: function () {
            errorSwal("数据获取失败！");
        },
        async:true,
        dataType: "json"
    });
}
function getDriverByDevcode(devcode){
    $('#driverUpdateModal').modal('show');
    $("#driver-file-list tbody").empty();
    $.ajax({
        type: 'POST',
        url: "/dasService/das/systemList",
        data:{
            devcode : devcode,
            type : "driver"
        },
        success: function (data) {
            if(data != null && data.length >0){
                var html = '';
                for(var i=0;i<data.length;i++){
                    html += '<tr>';
                    html += '<td>'+data[i].file_name+'</td>';
                    html += '<td>'+data[i].version+'</td>';
                    html += '<td>'+data[i].upload_time+'</td>';
                    html += '</tr>';
                }
                $("#driver-file-list tbody").html(html);
            }
        },
        error: function () {
            errorSwal("数据获取失败！");
        },
        async:true,
        dataType: "json"
    });
}
function showDriverUpdate(){
    $('#driverUpdateModal').modal('show');
    $("#driver-update-table tbody").empty();
    $.ajax({
        type: 'POST',
        url: "/dasService/das/systemList",
        data:{
            type : "driver"
        },
        success: function (data) {
            if(data != null && data.length >0){
                var html = '';
                for(var i=0;i<data.length;i++){
                    html += '<tr>';
                    html += '<td><input type="checkbox" name="driver_file_name" value="'+data[i].file_name+'"></td>';
                    html += '<td>'+data[i].driver_name+'</td>';
                    html += '<td>'+data[i].version+'</td>';
                    html += '<td>'+data[i].upload_time+'</td>';
                    html += '<td>'+data[i].driver_desc+'</td>';
                    html += '</tr>';
                }
                $("#driver-update-table tbody").html(html);
            }
        },
        error: function () {
            errorSwal("数据获取失败！");
        },
        async:true,
        dataType: "json"
    });
}
function showSystemUpdate(){
    $('#systemUpdateModal').modal('show');
    $("#system-update-table tbody").empty();
    $.ajax({
        type: 'POST',
        url: "/dasService/das/systemList",
        data:{
            type : "sys"
        },
        success: function (data) {
            if(data != null && data.length >0){
                var html = '';
                for(var i=0;i<data.length;i++){
                    html += '<tr>';
                    html += '<td><input type="checkbox" name="sys_file_name" value="'+data[i].file_name+'"></td>';
                    html += '<td>'+data[i].file_name+'</td>';
                    html += '<td>'+data[i].version+'</td>';
                    html += '<td>'+data[i].upload_time+'</td>';
                    html += '<td>'+data[i].driver_desc+'</td>';
                    html += '</tr>';
                }
                $("#system-update-table tbody").html(html);
            }
        },
        error: function () {
            errorSwal("数据获取失败！");
        },
        async:true,
        dataType: "json"
    });
}
function systemUpdate(){
    var devcode = $('#devcode').val();
    var file_name = "";
    var boxs = $('input[name="sys_file_name"]:checked');
    if( boxs.length > 1){
        alert("暂不支持多个文件同时升级！");
        return false;
    }
    for (var i = 0; i < boxs.length; i++) {
        if (boxs[i].checked == true) {
            file_name = boxs[i].value;
        }
    }
    if(file_name == ""){
        alert("请选择要升级的文件！");
        return false;
    }
    //$('#fileName').val(file_name);
    $.ajax({
        type: 'POST',
        url: "/device/device/sysup",
        data:{
            name : file_name,
            devcode : devcode
        },
        success: function (data) {
            if(data != null){
                if(data.status == true){
                    successSwal("升级成功");
                }else{
                    errorSwal("升级失败！");
                }
            }
        },
        error: function () {
            errorSwal("数据获取失败！");
        },
        async:true,
        dataType: "json"
    });
}
function driverUpdate(){
    var devcode = $('#devcode').val();
    var file_name = "";
    var boxs = $('input[name="driver_file_name"]:checked');
    if( boxs.length > 1){
        alert("暂不支持多个文件同时升级！");
        return false;
    }
    for (var i = 0; i < boxs.length; i++) {
        if (boxs[i].checked == true) {
            file_name = boxs[i].value;
        }
    }
    if(file_name == ""){
        alert("请选择要升级的文件！");
        return false;
    }
    //$('#fileName').val(file_name);
    $.ajax({
        type: 'POST',
        url: "/device/device/driverup",
        data:{
            name : file_name,
            devcode : devcode
        },
        success: function (data) {
            if(data != null){
                if(data.status == true){
                    successSwal("升级成功");
                }else{
                    errorSwal("升级失败！");
                }
            }
        },
        error: function () {
            errorSwal("数据获取失败！");
        },
        async:true,
        dataType: "json"
    });
}
function startService(){
    var rows = $table.bootstrapTable('getSelections');
    if (rows == undefined || rows == null || rows == "") {
        errorSwal("请选择要操作的行！");
        return;
    }else if(rows.length > 1){
        errorSwal("操作不正确！");
        return;
    }
    $.ajax({
        type: 'POST',
        url: "/device/device/startService",
        data:{
            id:rows[0].ID
        },
        success: function (data) {
            if(data != null ){
                if(data.status == true){
                    successSwal(data.msg);
                    showDasList();
                }else{
                    errorSwal(data.msg);
                }
            }else{
                errorSwal("数据获取失败！");
            }
        },
        error: function () {
            errorSwal("数据获取失败！");
        },
        async:true,
        dataType: "json"
    });
}
function stopService(){
    var rows = $table.bootstrapTable('getSelections');
    if (rows == undefined || rows == null || rows == "") {
        errorSwal("请选择要操作的行！");
        return;
    }else if(rows.length > 1){
        errorSwal("操作不正确！");
        return;
    }
    $.ajax({
        type: 'POST',
        url: "/device/device/stopService",
        data:{
            id:rows[0].ID
        },
        success: function (data) {
            if(data != null ){
                if(data.status == true){
                    successSwal(data.msg);
                    showDasList();
                }else{
                    errorSwal(data.msg);
                }
            }else{
                errorSwal("数据获取失败！");
            }
        },
        error: function () {
            errorSwal("数据获取失败！");
        },
        async:true,
        dataType: "json"
    });
}
//查询时间
function look_time(){
    $('#devInfoModal').modal('show');
    var devcode = $('#devcode').val();
    $.ajax({
        type: 'POST',
        url: "/device/device/querytime",
        data:{
            devcode:devcode
        },
        success: function (data) {
            if(data != null ){
                if(data.status == true){
                    $('#current_time').html(data.msg);
                }else{
                    errorSwal(data.msg);
                }
            }else{
                errorSwal("数据获取失败！");
            }
            var nowtime = $.format.date(new Date(), "yyyy-MM-dd HH:mm:ss");
            $('#server_time').html(nowtime);
        },
        error: function () {
            errorSwal("数据获取失败！");
        },
        async:true,
        dataType: "json"
    });
}
//同步时间
function sync_time(){
    var devcode = $('#devcode').val();
    $.ajax({
        type: 'POST',
        url: "/device/device/syncTime",
        data:{
            devcode:devcode
        },
        success: function (data) {
            if(data != null ){
                if(data.status == true){
                    successSwal(data.msg);
                }else{
                    errorSwal(data.msg);
                }
            }else{
                errorSwal("数据获取失败！");
            }

        },
        error: function () {
            errorSwal("数据获取失败！");
        },
        async:true,
        dataType: "json"
    });
}
//同步
function sync_dasInfo(){
    var devcode = $('#devcode').val();
    $.ajax({
        type: 'POST',
        url: "/device/device/getdasserverinfo",
        data:{
            devcode:devcode
        },
        success: function (data) {
            if(data != null){
                if(data.status == true){
                    successSwal(data.msg);
                    showDasList();
                }else{
                    errorSwal(data.msg);
                }
            }else{
                errorSwal("数据获取失败！");
            }
        },
        error: function () {
            errorSwal("数据获取失败！");
        },
        async:true,
        dataType: "json"
    });
}
function nameFormatter(value, row, index) {
    return [
        '<a href="/domain/point/pointList" title="采集名称" id="dasName">',
        row.NAME,
        '</a>'
    ].join('');
}
function getDevcode(){
    $.ajax({
        type: 'POST',
        url: "/dasService/das/getDevcode",
        data:{ },
        success: function (data) {
            $('#devcode').val(data.msg);//保留设备码到页面
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
function statusFormatter(value, row, index){
    if(value == 0){
        return [
           '已同步'
        ].join('');
    }else{
        return [
            '未同步'
        ].join('');
    }
}
//传值到子级页面
window.nameEvents = {
    'click #dasName':function(e, value, row, index) {
        var dev_code =(row.DEV_CODE);
        var das_name =(row.NAME);
        var das_type =(row.TYPE);
        var das_staus =(row.STATUS);
        $.ajax({
            type: 'POST',
            url: "/domain/point/setValue",
            data:{
                dev_code:dev_code,
                das_name:das_name,
                das_type :das_type,
                das_staus :das_staus
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
     *删除数据
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
                var id = (row.ID);
                var name = (row.NAME);
                var devcode = (row.DEV_CODE);
                if (id != null && id != "") {
                    removeDas(id,name,devcode);
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
//列表
function showDasList(){
    $.ajax({
        type: 'POST',
        url: "/dasService/das/dasJsonList",
        data:{},
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
function showAddDas(){
    var devcode = $('#devcode').val();
    $.ajax({
        type: 'POST',
        url: "/device/device/finddriver",
        data:{
            devcode : devcode
        },
        success: function (data) {
        },
        error: function () {
            errorSwal("数据获取失败！");
        },
        async:true,
        dataType: "json"
    });
    $.ajax({
        type: 'POST',
        url: "/dasService/das/getDriverType",
        data:{devcode:devcode},
        success: function (data) {
            $("#driver_name").empty();
            drivers = data;
            $("#driver_name")
                .append("<option value=''>请选择...</option>");
            for (var i = 0; i < drivers.length; i++) {
                if (driver_name == drivers[i].driver_name) {
                    $("#driver_name").append("<option value='"
                        + drivers[i].driver_name + "'  selected>"
                        + drivers[i].driver_name + "  "
                        + drivers[i].version + "</option>");
                } else {
                    $("#driver_name").append("<option value='"
                        + drivers[i].driver_name + "' >"
                        + drivers[i].driver_name + "  "
                        + drivers[i].version + "</option>");
                }
            }
        },
        error: function () {
            errorSwal("数据获取失败！");
        },
        async:true,
        dataType: "json"
    });
    $('#das-add-form')[0].reset();
    $('#addDasInfoModal').modal('show');
    $('#add-dasServer tbody').empty();
}
function typeChange(){
    var das_name = $('#das_name').val();
    var driver_name = $("#driver_name").val();
    if(driver_name == null || driver_name == ""){
        $('#add-dasServer tbody').empty();
        return;
    }
    $.ajax({
            type: 'POST',
            url: "/dasService/das/DasConfig",
            data:{
                "type" : driver_name,
                "scope" : "addServer"
            },
            success: function (data) {
                if (data.msg != null && data.msg != "fail") {
                    $('#das_desc').val(data.msg);
                    var t2 = $('#das_desc').val();
                    $('#das_desc').val('');
                    var servers=eval(t2);
                    var html="<tr>";
                    for (var i = 0; i < servers.length; i++) {
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
                }else{
                    errorSwal("数据获取失败！");
                    $('#add-dasServer tbody').empty();
                }
                $('#das_name').val(das_name);
                $('#add-dasServer tbody').empty();
                $('#add-dasServer tbody').append(html);
            },
            error: function () {
                errorSwal("数据获取失败！");
            },
            async:true,
            dataType: "json"
        });
}
function reset() {

}
function removeDas(id,name,devcode) {
    $.ajax({
        type: "post",
        url: "/dasService/das/removeDas",
        data: {
            id: id,
            name:name,
            devcode:devcode
        },
        async: false,
        dataType: "json",
        success: function (data) {
            if (data.msg == "success") {
                showDasList();
                successSwal("数据删除成功！");
            } else if(data.msg == "sync"){
                errorSwal("请先同步数据！");
            }else {
                errorSwal("数据删除失败！");
            }
        },
        error: function () {
            swal("删除失败!", "数据删除失败！", "success");
        }
    });
}
//添加采集
function addDasServer(){
    var retValue = '';
    var form = document.forms['das-add-form'];
    var obj = "";
    //验证
    for (var i = 0; i < form.length; i++) {
        var alt = form[i].alt;
        if(alt != ""){
            if(alt == "validateName"){
                retValue =  validateName($(form[i]));
                if(!retValue.status){
                    obj = $(form[i]);
                    break;
                }
            }
            //验证驱动名称
            if(form[i].id == "driver_name"){
                retValue =  validateDriverName($(form[i]));
                if(!retValue.status){
                    obj = $(form[i]);
                    break;
                }
            }
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
    var data = JSON.parse(datas);
    $.ajax({
        url : '/dasService/das/createdasServer',
        type : 'post',
        data : data,
        dataType : 'json',
        success : function(data) {
            if (data.msg == "success") {
                $('#addDasInfoModal').modal('hide');
                showDasList();
                successSwal("创建成功！");
            } else {
                errorSwal("创建失败！");
            }
        },
        error : function() {
            errorSwal('创建service ajax failure!');
        }
    });
}
function setTableValue(data) {
    $('#table').bootstrapTable('load', data);
}
function timeFormatter(value, row, index) {
    return $.format.date(value, "yyyy-MM-dd HH:mm:ss");
}
// 采集进程名称的验证
function validateName(el) {
    var name = el.val();
    var temp = el.context.title;
    var category = temp.substring(3, temp.length);
    var retValue = {};
    if ("" == name) {
        retValue.msg = category + "不能为空！";
        retValue.status = false;
    } else if (!NamePattern.test(name)) {
        retValue.msg = category + "的长度不超过20！";
        retValue.status = false;
    } else if (!SpecialCharPattern.test(name)) {
        retValue.msg = category + "不能为中文!";
        retValue.status = false;
    } else {
        retValue.msg = "";
        retValue.status = true;
        /*$.ajax({
         url : "/Das/ValidateDasName?name=" + name,
         type : 'get',
         dataType : 'json',
         async : false,
         success : function(data) {
         retValue.status = data.Status;
         if (!data.Status) {
         retValue.msg = data.Data;
         }
         },
         error : function(XMLHttpRequest, textStatus, errorThrown) {
         alert(errorThrown);
         }
         });*/
    }
    return retValue;
}

//驱动类型的验证
function validateDriverName(el) {
    var value = el.val();
    var retValue = {};
    if ("" == value || value == null) {
        retValue.status = false;
        retValue.msg = "请选择驱动类型";

    } else {
        retValue.status = true;
        retValue.msg = "";
    }
    return retValue;
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
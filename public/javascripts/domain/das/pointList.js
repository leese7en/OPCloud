// 中文验证
var SpecialCharPattern = /^[^\u4e00-\u9fa5]{0,}$/;
// 验证IP的正则表达式
var IPPattern = /^(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])$/;
// 验证正整数的正则表达式
var PositiveIntergerPattern = /^[0-9]+$/;
// 字符串长度为1-20
var NamePattern = /^\S{1,20}$/;
$(document).ready(function(){
    showPointList();
    getValue();
    //自动刷新
   /* $("#autofreshcheck").click(function() {
        alert(33);
        // 自动刷新
        if ($('#autofreshcheck').get(0).checked) {
            searchPoint();
            //setInterval(searchPoint, 5000);
        } else {
            window.location.reload();
        }
    });*/
    $('#table').on('page-change.bs.table', function (e, number, size) {
        showPointList();
    });
});
function autofreshcheck(){
   // alert($('#autofreshcheck').get(0).checked);
    searchPoint();
}
function importPoint(){
    var file = $("#resource").val();
    var ext = file.slice(file.lastIndexOf(".")+1).toLowerCase();
    if(file == undefined|| file =="" || file == null){
        errorSwal("请选择导入的文件!");
        return;
    }else if ("csv" != ext ) {
        errorSwal("请导入正确的CSV文件!");
        return;
    }
    var devcode = $('#devcode').val();
    var dasname = $('#dasname').val();
    $('#importCsvForm').ajaxSubmit({
        url: '/domain/point/importCsv',
        dataType: "json",
        data:{
            devcode : devcode,
            dasname : dasname
        },
        success:function (data) {
            if(data != null && data.status == true){
                successSwal(data.msg);
                showPointList();
            }else{
                errorSwal(data.msg);
            }
        }
    });
}
function showImportPoint(){
    $('#importCsvModal').modal({
        backdrop : 'static',
        keyboard : true
    });
}
function closeUpload(){
    $('#importCsvModal').modal('hide');
}
function getValue(){
    $.ajax({
        type: 'POST',
        url: "/domain/point/getValue",
        data:{ },
        success: function (data) {
            var value = data.msg.split(',');
            $('#devcode').val(value[0]);
            $('#dasname').val(value[1]);
            $('#das_staus').val(value[2]);
        },
        error: function () {
            errorSwal("数据获取失败！");
        },
        async:true,
        dataType: "json"
    });
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
function operateFormatter(value, row, index) {
    return [
        '<a class="edit" href="javascript:void(0)" title="编辑" style="color:#f0ad4e">',
        '<i class="glyphicon glyphicon-edit"></i>',
        '</a>'+"&nbsp;&nbsp;" +
        '<a class="remove" href="javascript:void(0)" title="删除" style="color:#f0ad4e">',
        '<i class="glyphicon glyphicon-trash"></i>',
        '</a>'
    ].join('');
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
                var id = (row.ID);
                if (id != null && id != "") {
                    removePoint(id);
                }
            }
        });
    },
    /*
     *编辑用户
     */
    'click .edit': function (e, value, row, index) {
        var id = (row.ID);
        if (id != null && id != "") {
            showEditPoint(id);
        }
    }
};
function searchPoint(){
    var rows = $table.bootstrapTable('getData');
    var ids = "";
    if(rows != null && rows.length >0){
        for(var i=0;i<rows.length;i++){
            ids += rows[i].ID +",";
        }
    }
    if(ids != ""){
        $.ajax({
            type: 'POST',
            url: "/domain/point/getRealTimeData",
            data:{
                'ids' :ids
            },
            success: function (data) {
                alert(data);
            },
            error: function () {
                errorSwal("数据获取失败！");
            },
            async:true,
            dataType: "json"
        });
    }
}
function showPointList(){
    var opts = $("#table").bootstrapTable('getOptions');
    var offset = ((opts.pageNumber - 1) * opts.pageSize);
    var limit = opts.pageSize;

    var pointName = $('#pointName').val();
    var pointRt = $('#pointRt').val();
    var das_staus = $('#das_staus').val();
    $.ajax({
        type: 'POST',
        url: "/domain/point/pointJsonList",
        data:{
            'pointName' :pointName,
            'pointRt':pointRt,
            'das_staus':das_staus,
            offset: offset,
            limit: limit
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
function showAddPoint(){
    LoadAddPointModal();
    $('#point-add-form')[0].reset();
    $('#point-title').html("添加测点");
    $('#id').val("");
    $('#addPointModal').modal({
        backdrop : 'static',
        keyboard : true
    });
}
function LoadAddPointModal(){
    $.ajax({
        type: 'POST',
        url: "/domain/point/DasConfig",
        data:{
            "scope" : "addPoint"
        },
        success: function (data) {
            if (data.msg != null && data.msg != "fail") {
                $('#input_value').val(data.msg);
                var t2 = $('#input_value').val();
                $('#input_value').val('');
                var points=eval(t2);
                var html="<tr>";
                for (var i = 0; i < points.length; i++) {
                    var point = points[i];
                    if(point.Id != "Id"){
                        if(point.TextType == "select"){//下拉框
                            html += '<td><label>'+point.Desc+'</label></td><td><select name="'+point.Id+'" class="form-control" id="'+(point.Id).toLowerCase()+'"';
                            if(point.Tips == ""){//没有图标多加50px
                                html += 'style="margin-right: 50px;"';
                            }
                            if(point.Validate != ""){//验证
                                html += 'alt='+point.Validate+'';
                            }
                            html += '><option value="">请选择</option>';
                            if (point.TextData != null && point.TextData.indexOf('.')>0) {
                                var data = point.TextData.split('.');
                                for (var j = 0; j < data.length; j++) {
                                    html += " <option value=\""
                                        + data[j] + "\">" + data[j]
                                        + "</option>";
                                }
                            }
                            html += '</select>';
                            //if(point.Tips != ""){
                            //    html += '<img src="../../../images/tf.png" title="'+point.Tips+'" />';
                            //}
                            html += '</td>';
                        }else{//普通文本框
                            html += '<td><label>'+point.Desc+'</label></td><td><input type="text" class="form-control" name="'+(point.Id).toLowerCase()+'" id="'+(point.Id).toLowerCase()+'"';
                            if(point.Tips == ""){//没有图标多加50px
                                html += 'style="margin-right: 50px;"';
                            }
                            if(point.Validate != ""){//验证
                                html += 'alt='+point.Validate+'';
                            }
                            html += '>';
                            //if(point.Tips != ""){
                            //    html += '<img src="../../images/tf.png" title="'+point.Tips+'" />';
                            //}
                            html += '</td>';
                        }
                        if(i % 2 == 0){
                            html += '</tr><tr>';
                        }
                    }
                }
                html += '</tr>';
            }else{
                errorSwal("数据获取失败！");
                $('#add-dasServer tbody').empty();
            }
            $('#point-add-table').empty();
            $('#point-add-table').append(html);
        },
        error: function () {
            errorSwal("数据获取失败！");
        },
        async:false,
        dataType: "json"
    });
}
function addPoint(){
    var retValue = {
        status : true,
         msg : ""
    };
    var form = document.forms['point-add-form'];
    var id = $('#id').val();
    var obj = "";
    //验证
    for (var i = 0; i < form.length; i++) {
        var alt = form[i].alt;
        if(alt != "" && alt != undefined){
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
            if(alt == "iscn" && id == ""){
               /* retValue = validateIsCN($(form[i]));
                if(!retValue.status){
                    obj = $(form[i]);
                    break;
                }*/
                retValue =  validateName($(form[i]));
                if(!retValue.status){
                    obj = $(form[i]);
                    break;
                }
            }
        }

    }
    //验证不通过
    if(!retValue.status){
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
        url : '/domain/point/addPoint',
        type : 'post',
        data : data,
        dataType : 'json',
        success : function(data) {
            if (data.msg == "success") {
                $('#addPointModal').modal('hide');
                showPointList();
                if(id != "" && id != null){
                    successSwal("修改成功！");
                }else{
                    successSwal("创建成功！");
                }
            } else {
                if(id != "" && id != null){
                    successSwal("修改失败！");
                }else{
                    successSwal("创建失败！");
                }
            }
        },
        error : function() {
            errorSwal('创建service ajax failure!');
        }
    });

}
function reset() {

}

function removePoint(id) {
    $.ajax({
        type: "post",
        url: "/domain/point/removePoint",
        data: {
            id: id
        },
        async: false,
        dataType: "json",
        success: function (data) {
            if (data.msg == "success") {
                showPointList();
                successSwal("数据删除成功！");
            }else if(data.msg == "sync"){
                errorSwal("请先同步数据！");
            } else {
                errorSwal("数据删除失败！");
            }
        },
        error: function () {
            swal("删除失败!", "数据删除失败！", "success");
        }
    });
}
function showEditPoint(id) {
    LoadAddPointModal();
    $('#point-title').html("修改测点");
    $('#addPointModal').modal({
        backdrop : 'static',
        keyboard : true
    });
    var form = document.forms['point-add-form'];
    $.ajax({
        type: 'POST',
        url: "/domain/point/pointById",
        data: {
            id: id
        },
        success: function (data) {
            $('#pn').attr('disabled',true);
            $('#rt').attr('disabled',true);
            var value = data[0];
            for (var i = 0; i < form.length; i++) {
                var Id = form[i].id;
                for (key in value) {
                    if (key == Id) {
                        $("#" + Id + "").val(value[key]);
                    }
                }
            }
        },
        error: function () {

        },
        dataType: "json",
    });
}
// 名称的验证
function validateName(el) {
    var name = el.val();
    var category = el.context.id;
    var retValue = {};
    var devcode = $('#devcode').val();
    var dasname = $('#dasname').val();
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
        $.ajax({
            type: 'POST',
            url: "/domain/point/validateName",
            data: {
                devcode : devcode,
                sn : dasname,
                pn : name
            },
            success: function (data) {
                if(data != null && data.length > 0){
                    retValue.msg = "点名已存在！";
                    retValue.status = false;
                }else{
                    retValue.msg = "";
                    retValue.status = true;
                }
            },
            error: function () {

            },
            dataType: "json",
            async:false
        });
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
function setTableValue(data) {
    $('#table').bootstrapTable('load', data);
}
function timeFormatter(value, row, index) {
    return $.format.date(value, "yyyy-MM-dd HH:mm:ss");
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
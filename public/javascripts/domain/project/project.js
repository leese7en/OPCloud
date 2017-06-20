$(document).ready(function(){
    $('#table').on('page-change.bs.table', function (e, number, size) {
        queryProject();
    });
    queryProject();
});

var format = function (value, row, index) {
    if (value == 1 || value == "1") {
        return "已锁定";
    }else if (value == 0 || value == "0"){
        return "未锁定";
    }
}

function operateFormatter(value, row, index) {
    return [
        '<a class="remove" href="javascript:void(0)" title="删除">',
        '<i class="glyphicon glyphicon-remove"></i>',
        '</a>'
        + "&nbsp;&nbsp;&nbsp;&nbsp;" +
        '<a class="edit" href="javascript:void(0)" title="编辑" style="color:#f0ad4e">',
        '<i class="glyphicon glyphicon-edit"></i>',
        '</a>'
    ].join('');
}
window.operateEvents = {
    /*
     *删除
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
                var id = (row.PROJECT_ID);
                if (id != null && id != "") {
                    removeProject(id);
                    queryProject();
                }
            }
        });
    },

    /*
     *编辑
     */

    'click .edit': function (e, value, row, index) {
        var id = (row.PROJECT_ID);
        if (id != null && id != "") {
            $("#editId").val(row.PROJECT_ID);
            $("#editName").val(row.PROJECT_NAME);
            $("#editPrincipal").val(row.PRINCIPAL);
            var lock = document.getElementById("editLock");
            console.log(row.IS_LOCK);
            if(row.IS_LOCK == 1){
                lock.options[0].selected = true;
            }else{
                lock.options[1].selected = true;
            }
            $("#editAddress").val(row.ADDRESS);
            $("#editLongitude").val(row.LONGITUDE);
            $("#editLatitude").val(row.LATITUDE);
            $("#editDesc").val(row.DESCRIPTION);
            showEditProject();
        }
    }
};

function queryProject(){
    var principal = $("#principal").val();
    var projectName = $("#projectName").val();
    var opts = $("#table").bootstrapTable('getOptions');
    var offset= ((opts.pageNumber - 1) * opts.pageSize);
    var limit= opts.pageSize;
    $.ajax({
        type : "post",
        url : "/domain/project/JsonList",
        data : {
            principal : principal,
            projectName:projectName,
            offset:offset,
            limit:limit
        },
        dataType : "json",
        success:function(data){
            $('#table').bootstrapTable('load',data);
            $('#table').bootstrapTable('refresh');
        },
        error:function(){
            errorSwal("数据加载失败!");
        }
    });
}


function showAddProject(){
    $('#addProjectModal').modal('show');
}

function addProject(){
    var addName = $("#addName").val();
    var addPrincipal = $("#addPrincipal").val();
    var addLock = $("#addLock").val();
    var addAddress = $("#addAddress").val();
    var addLongitude = $("#addLongitude").val();
    var addLatitude = $("#addLatitude").val();
    var  addDesc = $("#addDesc").val();

    $.ajax({
        type: 'POST',
        url: "/domain/project/add_project",
        data: {
            addName : addName,
            addPrincipal : addPrincipal,
            addLock : addLock,
            addAddress : addAddress,
            addLongitude : addLongitude,
            addLatitude : addLatitude,
            addDesc : addDesc
        },
        success: function (data) {
            if (data.msg == "success") {
                $('#table').bootstrapTable('refresh');
                successSwal("添加成功!");
            } else {
                errorSwal("添加失败!");
            }
        },
        error: function () {
            errorSwal("添加失败!");
        },
        dataType: "json"
    });
}

function showEditProject(){
    $('#editProjectModal').modal('show');
}

function editProject(){
    var id =  $("#editId").val();
    var editName = $("#editName").val();
    var editPrincipal = $("#editPrincipal").val();
    var editLock = $("#editLock").val();
    var editAddress = $("#editAddress").val();
    var editLongitude = $("#editLongitude").val();
    var editLatitude = $("#editLatitude").val();
    var  editDesc = $("#editDesc").val();

    $.ajax({
        type: 'POST',
        url: " /domain/project/edit_project",
        data: {
            id : id,
            editName: editName,
            editPrincipal:editPrincipal,
            editLock: editLock,
            editAddress: editAddress,
            editLongitude: editLongitude,
            editLatitude: editLatitude,
            editDesc: editDesc
        },
        success: function (data) {
            if (data.msg == "success") {
                successSwal("编辑成功!");
                queryProject();
            } else {
                errorSwal("编辑失败!");
            }
        },
        error: function () {
            successSwal("编辑成功!");
            errorSwal("编辑失败!");
        },
        dataType: "json"
    });
}

function removeProject(id){
    $.ajax({
        type : "post",
        url : "/domain/project/remove_project",
        data : {
            id : id
        },
        async:false,
        dataType : "json",
        success:function(data){
            if (data.msg == "success") {
                $('#table').bootstrapTable('refresh');
                successSwal("删除成功!");
            } else {
                errorSwal("删除失败!");
            }
        },
        error:function(){
            errorSwal("删除失败!");
        }
    });
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
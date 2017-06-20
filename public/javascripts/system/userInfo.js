/**
 * Created by JY on 2016/12/27.
 */

function previewImage() {
    var result = document.getElementById("previewCon");
    if (typeof FileReader == 'undefined') {
        result.innerHTML = "抱歉，你的浏览器不支持FileReader";
    }
    // 将文件以Data URL形式进行读入页面
    // 检查是否为图像类型
    var simpleFile = document.getElementById("resourceImage").files[0];
    if (!/image\/\w+/.test(simpleFile.type)) {
        alert("请确保文件类型为图像类型");
        return false;
    }
    var reader = new FileReader();
    // 将文件以Data URL形式进行读入页面
    reader.readAsDataURL(simpleFile);
    reader.onload = function (e) {
        $('#preview').attr('src', this.result);
    }
}
//更换用户头像
function changeUserHeadImg() {
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
        url: '/system/user/userHeadImg',
        dataType: "json",
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
                toastr.error(data.message);
            } else {
                swal.close();
                toastr.success("上传成功！");
                $("#userHeadImgModal").modal('hide');
                $('#userHeadImg,#userHeadImg2,#userHeadImgLeftSide').attr('src', data.data);
            }
        }
    });
}

//显示图像上传模块
function showUserHeadModal() {
    $("#userHeadImgModal").modal('show');
}
function showPersonaliseModal() {
    $('#uploadPersonaliseImageForm').ajaxSubmit({
        url: '/system/user/getPersonalise',
        type: 'post',
        dataType: "json",
        success: function (data) {
            if (data.flag < 0) {
                toastr.error(data.message);
            } else {
                var data = data.data;
                if (data) {
                    $('#fullName').val(data.fullName);
                    $('#shortName').val(data.shortName);
                    $('#previewLogo').attr('src', data.logoPath);
                }
                $("#personaliseModal").modal('show');
            }
        }
    });

}


function previewLogoImage() {
    var result = document.getElementById("previewLogoCon");
    if (typeof FileReader == 'undefined') {
        result.innerHTML = "抱歉，你的浏览器不支持FileReader";
    }
    // 将文件以Data URL形式进行读入页面
    // 检查是否为图像类型
    var simpleFile = document.getElementById("logoImage").files[0];
    if (!/image\/\w+/.test(simpleFile.type)) {
        alert("请确保文件类型为图像类型");
        return false;
    }
    var reader = new FileReader();
    // 将文件以Data URL形式进行读入页面
    reader.readAsDataURL(simpleFile);
    reader.onload = function (e) {
        $('#previewLogo').attr('src', this.result);
    }
}
/**
 * 用户个性化logo
 */
function updateUserPersonaliseLogo() {
    var file = $("#logoImage").val();
    var ext = file.slice(file.lastIndexOf(".") + 1).toLowerCase();
    if (file == undefined || file == "" || file == null) {
        toastr.error("请选择导入的文件!");
        return;
    } else if ("png" != ext && 'gif' != ext && 'jpg' != ext && 'jpeg' != ext && 'bmp' != ext) {
        toastr.error("只能导入png,gif,jpg,jpeg,bmp图片格式文件!");
        return;
    }
    $('#uploadPersonaliseImageForm').ajaxSubmit({
        url: '/system/user/personaliseLogo',
        type: 'post',
        beforeSend: function () {
            swal({
                showCancelButton: false,
                showConfirmButton: false,
                title: "文件上传中",
                imageUrl: "/images/file-loader.gif"
            });
        },
        dataType: "json",
        success: function (data) {
            if (data.flag < 0) {
                toastr.error(data.message);
            } else {
                swal.close();
                toastr.success("上传成功！");
                var src = data.data;
                if (src) {
                    $('#personaliseLogoPath').css('background-image', 'url(' + src + ')').css('background-size', 'cover');
                }
                $("#personaliseModal").modal('hide');
            }
        }
    });
}
/**
 * 删除已有
 */
function deleteUserPersonaliseLogo() {
    $.ajax({
        url: '/system/user/deleteUserPersonaliseLogo',
        type: 'post',
        dataType: "json",
        success: function (data) {
            if (data.flag < 0) {
                toastr.error(data.message);
            } else {
                toastr.success("操作成功！");
                $('#personaliseLogoPath').removeAttr('style');
                $("#personaliseModal").modal('hide');
            }
        }
    });
}
/**
 * 更新用户个性化信息
 */
function updateUserPersonaliseInfo() {
    var fullName = $('#fullName').val();
    var shortName = $('#shortName').val();
    $.ajax({
        url: '/system/user/personaliseInfo',
        type: 'post',
        data: {
            fullName: fullName,
            shortName: shortName
        },
        dataType: "json",
        success: function (data) {
            if (data.flag < 0) {
                toastr.error(data.message);
            } else {
                toastr.success("上传成功！");
                if (shortName) {
                    $('#personaliseShortName').html(shortName);
                } else {
                    $('#personaliseShortName').html('Cloud');
                }
                if (fullName) {
                    $('#personaliseFullName').html(fullName);
                } else {
                    $('#personaliseFullName').html('OPCloud');
                }
                $("#personaliseModal").modal('hide');
            }
        }
    });
}
/**
 * 显示个人信息
 */
function showUserInfo() {
    $.ajax({
        type: 'POST',
        url: "/system/user/getUserInfo",
        success: function (data) {
            if (data.flag < 0) {
                errorSwal(data.message);
                return;
            } else {
                var data = data.data;
                $("#editUserName").val(data.USER_NAME);
                $("#editJobNo").val(data.JOB_NO).attr("disabled", "disabled");
                $("#editMail").val(data.EMAIL);
                $("#editPhone").val(data.MOBILE_PHONE);
                $("#editDesc").val(data.DESCRIPTION);
                $('#editUserModal').modal('show');
            }

        },
        error: function () {

        },
        dataType: "json"
    });

}
/**
 * 编辑用户
 */
function updateUserInfo() {
    var userName = ($("#editUserName").val());
    var phone = ($("#editPhone").val());
    var editDesc = ($("#editDesc").val());
    if (userName == null || userName == "") {
        errorSwal("姓名不能为空！");
        return;
    }
    if (phone == null || phone == "") {
        errorSwal("联系方式不能为空！");
        return;
    }
    $.ajax({
        type: 'POST',
        url: "/system/user/updateUserInfo",
        data: {
            userName: userName,
            phone: phone,
            userDesc: editDesc
        },
        dataType: "json",
        success: function (data) {
            if (data.flag < 0) {
                errorSwal(data.message);
                return;
            }
            $('#personaliseUserNameTop').html(userName);
            $('#personaliseUserNameInner').html(userName);
            $('#personaliseUserNameLeft').html(userName);
            $('#personaliseUserDesc').html(editDesc);
            swal("修改成功!", "success");
            $('#editUserModal').modal('hide');
        },
        error: function (err) {
            toastr.error("编辑失败！");
        }
    });
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
/*编辑-------验证电话号码格式是否正确，是否被注册过*/
function validateEditPhone() {
    var phone = $('#editPhone').val().trim();
    $('#addPhone').val(phone);
    inputBorderCorrectColor('editPhone');
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
/*去除描述的前后空格*/
function trimDesc() {
    var editDesc = $('#editDesc').val().trim();
    $('#editDesc').val(editDesc);
}

/**
 * 更新用户密码信息
 */
function changePassword() {
    var oldPassword = $('#password').val();
    if (!oldPassword || oldPassword.trim().length < 6 || oldPassword.length > 12) {
        toastr.warning('密码位数介于6到12');
        return;
    }
    var newPasswd = $('#newPass').val();
    if (!newPasswd || newPasswd.trim().length > 12 || newPasswd.trim().length < 6) {
        toastr.warning('密码位数介于6到12');
        return;
    }
    var newPasswdA = $('#newPassAgain').val();
    if (newPasswd.trim() != newPasswdA.trim()) {
        toastr.warning('两次密码不一样');
        return;
    }

    oldPassword = $.md5(oldPassword);
    newPasswd = $.md5(newPasswd);
    newPasswdA = $.md5(newPasswdA);
    $.ajax({
        type: 'post',
        url: '/system/user/changePassword',
        data: {
            pass: oldPassword,
            passNew: newPasswd,
            passAgain: newPasswdA
        },
        dataType: 'json',
        success: function (data) {
            var flag = data.flag;
            if (flag < 0) {
                toastr.warning(data.message);
                if (data.message == '原密码不正确') {
                    inputBorderErrorColor('password');
                }
                return;
            }
            else {
                toastr.success('更新密码成功');
                closeUpdateUserModal();
            }

        },
        error: function () {

        }
    });
}
/*验证密码是否为空*/
function validateOldPass() {
    var password = $('#password').val();
    inputBorderCorrectColor('password');
    if (!password) {
        toastr.warning('密码不能为空');
        inputBorderErrorColor('password');
    }
    if (password && password.length < 6 || password.length > 12) {
        toastr.warning('密码格式不对，需要在6到12位之间');
        inputBorderErrorColor('password');
    }
}
/*验证密码是否为空,和是否相等*/
function validateNewPassword() {
    var password = $('#newPass').val();
    var password2 = $('#newPassAgain').val();
    inputBorderCorrectColor('newPass');
    if (password && password.length < 6 || password.length > 12) {
        toastr.warning('密码格式不对，需要在6到12位之间');
        inputBorderErrorColor('newPass');
        return;
    }
    if (!password) {
        toastr.warning('密码不能为空');
        inputBorderErrorColor('newPass');
        return;
    } else if (password2) {
        inputBorderCorrectColor('newPass');
        inputBorderCorrectColor('newPassAgain');
        if (password != password2) {
            toastr.warning('两次输入的密码不相同');
            inputBorderErrorColor('newPass');
            inputBorderErrorColor('newPassAgain');
            return;
        }
    }
}
/*验证确认密码是否为空,和是否相等*/
function validateNewPassword2() {
    var password = $('#newPass').val();
    var password2 = $('#newPassAgain').val();
    inputBorderCorrectColor('newPassAgain');
    if (password2 && password2.length < 6 || password2.length > 12) {
        toastr.warning('密码格式不对，需要在6到12位之间');
        inputBorderErrorColor('newPassAgain');
        return;
    }
    if (!password || !password2) {
        toastr.warning('密码不能为空');
        inputBorderErrorColor('newPassAgain');
        return;
    } else if (password) {
        inputBorderCorrectColor('newPass');
        inputBorderCorrectColor('newPassAgain');
        if (password != password2) {
            toastr.warning('两次输入的密码不相同');
            inputBorderErrorColor('newPass');
            inputBorderErrorColor('newPassAgain');
            return;
        }
    }
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
/**
 * 获取开发者证书
 */
function getUserToken() {
    $.ajax({
        type: 'post',
        url: '/system/user/getUserToken',
        dataType: 'json',
        success: function (data) {
            var flag = data.flag;
            if (flag < 0) {
                toastr.error('获取开发者证书错误');
                return;
            } else {
                swal({
                    title: "<small>你的开发者账号</small>",
                    text: data.value,
                    type: "input",
                    inputValue: data.data,
                    animation: "slide-from-top",
                    inputPlaceholder: '你的证书号',
                    html: true
                });
            }
        },
        error: function () {
            toastr.error('获取开发者证书错误');
        }
    });
}
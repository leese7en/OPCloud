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
    getDuties();
    getIndustry();
    getDomains();
});

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
            console.log(data.msg);
            if (data.msg == "true") {
                flag = true;
            }
        },
        dataType: "json"
    });
    return flag;
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
            callBackIndustryAndDuty(data.data, 'duty_id');
        }
    });
}
/*获取行业*/
function getIndustry() {
    $.ajax({
        type: 'POST',
        url: "/system/publicInfo/getIndustry",
        dataType: "json",
        async: false,
        success: function (data) {
            if (data.flag < 0) {
                toastr.error(data.message);
                return;
            }
            callBackIndustryAndDuty(data.data, 'industry_id');
        }
    });
}

/*获取domain*/
function getDomains() {
    $.ajax({
        type: 'POST',
        url: "/system/publicInfo/getDomains",
        dataType: "json",
        async: false,
        success: function (data) {
            if (data.flag < 0) {
                toastr.error(data.message);
                return;
            }
            callBackIndustryAndDuty(data.data, 'domain_id');
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
    html = '<option value="0">请选择</option>' + html;
    $('#' + id).html(html);
    $('#' + id).selectpicker('refreash');
}

/*添加企业用户*/
function addPublicCustomer() {
    var jobNo = $("#job_no").val();
    var password = $('#password').val();
    var password2 = $('#password2').val();
    var mail = $("#email").val();
    var phone = $("#mobile_phone").val();
    var companyName = $('#companyName').val();
    var smsCode = $('#smsCode').val().trim();
    if (jobNo == null || jobNo == "") {
        toastr.warning("用户名不能为空！");
        return;
    } else if (validateJobNo(jobNo)) {
        toastr.warning("用户名已存在，请修改后继续！");
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
    if (!companyName) {
        toastr.warning('企业名称不能为空');
        return;
    }
    if (!smsCode) {
        toastr.warning('验证码不能为空');
        return;
    }
    password = $.md5(password);
    password2 = $.md5(password2);
    $.ajax({
        type: 'POST',
        url: "/system/customer/addPublicCustomer",
        data: {
            jobNo: jobNo,
            password: password,
            password2: password2,
            email: mail,
            mobilePhone: phone,
            companyName: companyName,
            smsCode: smsCode
        },
        dataType: "json",
        success: function (data) {
            if (data.flag < 0) {
                toastr.warning(data.message);
                return;
            } else {
                self.location = '/';
            }
        },
        error: function (err) {
            toastr.error(err);
        }

    });
}

/*添加个人用户*/
function addCustomerIndividual() {
    var jobNo = $("#job_no").val();
    var password = $('#password').val();
    var password2 = $('#password2').val();
    var mail = $("#email").val();
    var phone = $("#mobile_phone").val();
    var smsCode = $('#smsCode').val().trim();
    if (jobNo == null || jobNo == "") {
        toastr.warning("用户名不能为空！");
        return;
    } else if (validateJobNo(jobNo)) {
        toastr.warning("用户名已存在，请修改后继续！");
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
    password = $.md5(password);
    password2 = $.md5(password2);
    $.ajax({
        type: 'POST',
        url: "/system/customer/addCustomerIndividual",
        data: {
            jobNo: jobNo,
            password: password,
            password2: password2,
            email: mail,
            mobilePhone: phone,
            smsCode: smsCode
        },
        dataType: "json",
        success: function (data) {
            if (data.flag < 0) {
                toastr.warning(data.message);
                return;
            } else {
                self.location = '/';
            }
        },
        error: function (err) {
            toastr.error(err);
        }
    });
}

function getPhoneSmsCode() {
    var phone = $("#mobile_phone").val();
    if (phone == null || phone == "") {
        toastr.warning("联系方式不能为空！");
        return;
    }
    $.ajax({
        type: 'POST',
        url: "/system/publicInfo/sendCloudSmsCode",
        data: {
            phone: phone
        },
        dataType: "json",
        success: function (data) {
            if (data.flag < 0) {
                toastr.warning(data.message);
                return;
            } else {
                swal("你的验证码!", data.data, "success");
                var i = 60;
                var j = setInterval(function () {
                    $('#sendSmsCode').attr('disabled', 'disabled').html('重新发送' + i);
                    i--;
                    if (i < 1) {
                        $('#sendSmsCode').removeAttr('disabled').html('获取验证码');
                        clearInterval(j);
                    }
                }, 1000);
            }
        },
        error: function (err) {
            toastr.error(err);
        }
    });
}

/*验证企业名称*/
function validateCompanyName() {
    var companyName = $('#companyName').val().trim();
    $('#companyName').val(companyName);
    if (!companyName) {
        toastr.warning('企业名称不能为空');
        inputBorderErrorColor('companyName');
        return;
    }
    $.ajax({
        url: '/system/customer/validateCompanyName',
        type: 'post',
        data: {
            companyName: companyName
        },
        dataType: 'json',
        success: function (data) {
            if (data.flag < 0) {
                toastr.warning(data.message);
                inputBorderErrorColor('companyName');
                return;
            }
            inputBorderCorrectColor('companyName');
        },
        error: function (err) {
            toastr.error(err);
        }
    });
}
/*验证企业登录名
 * 用户登录名
 * */
function validateJobNo() {
    var jobNo = $('#job_no').val().trim();
    $('#job_no').val(jobNo);
    if (!jobNo) {
        toastr.warning('登录名不能为空');
        inputBorderErrorColor('job_no');
        return;
    }
    if (jobNo.length < 3 || jobNo.length > 12) {
        toastr.warning('登录名需要在3到12位之间');
        inputBorderErrorColor('job_no');
        return;
    }
    var reg = /^[a-zA-Z0-9_]*$/;
    if (!reg.test(jobNo)) {
        toastr.warning("登录名格式不正确");
        inputBorderErrorColor('job_no');
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
                inputBorderErrorColor('job_no');
                return;
            }
            inputBorderCorrectColor('job_no');
        },
        error: function (err) {
            toastr.error(err);
        }
    });
}
/*验证验证码*/
function validateCCAP() {
    var ccap = $('#CcapCode').val().trim();
    $('#CcapCode').val(ccap);
    if (!ccap) {
        toastr.warning('验证码不能为空');
        inputBorderErrorColor('CcapCode');
        return;
    }
    $.ajax({
        url: '/system/customer/validateCCAP',
        type: 'post',
        data: {
            ccap: ccap
        },
        dataType: 'json',
        success: function (data) {
            if (data.flag < 0) {
                toastr.warning(data.message);
                inputBorderErrorColor('CcapCode');
                return;
            }
            inputBorderCorrectColor('CcapCode');
        },
        error: function (err) {
            toastr.error(err);
        }
    });
}
/*验证姓名是否为空*/
function validateUserName() {
    var userName = $('#user_name').val().trim();
    $('#user_name').val(userName);
    inputBorderCorrectColor('user_name');
    if (!userName) {
        toastr.warning('姓名不能为空');
        inputBorderErrorColor('user_name');
        return;
    }
}
/*验证密码是否为空,和是否相等*/
function validatePassword() {
    var password = $('#password').val();
    var password2 = $('#password2').val();
    inputBorderCorrectColor('password');
    if (password && password.length < 6 || password.length > 12) {
        toastr.warning('密码格式不对，需要在6到12位之间');
        inputBorderErrorColor('password');
        return;
    }
    if (!password) {
        toastr.warning('密码不能为空');
        inputBorderErrorColor('password');
        return;
    } else if (password2) {
        inputBorderCorrectColor('password');
        inputBorderCorrectColor('password2');
        if (password != password2) {
            toastr.warning('两次输入的密码不相同');
            inputBorderErrorColor('password');
            inputBorderErrorColor('password2');
            return;
        }
    }
}
/*验证确认密码是否为空,和是否相等*/
function validatePassword2() {
    var password = $('#password').val();
    var password2 = $('#password2').val();
    inputBorderCorrectColor('password2');
    if (password2 && password2.length < 6 || password2.length > 12) {
        toastr.warning('密码格式不对，需要在6到12位之间');
        inputBorderErrorColor('password2');
        return;
    }
    if (!password || !password2) {
        toastr.warning('密码不能为空');
        inputBorderErrorColor('password2');
        return;
    } else if (password) {
        inputBorderCorrectColor('password');
        inputBorderCorrectColor('password2');
        if (password != password2) {
            toastr.warning('两次输入的密码不相同');
            inputBorderErrorColor('password');
            inputBorderErrorColor('password2');
            return;
        }
    }
}
/*验证邮箱格式是否正确,判断是否注册过*/
function validateEmail() {
    var email = $('#email').val().trim();
    $('#email').val(email);
    inputBorderCorrectColor('email');
    if (!email) {
        toastr.warning('邮箱不能为空');
        inputBorderErrorColor('email');
        return;
    } else {
        var reg = /^\w+((-\w+)|(\.\w+))*\@[A-Za-z0-9]+((\.|-)[A-Za-z0-9]+)*\.[A-Za-z0-9]+$/;
        var flag = reg.test(email);
        if (!flag) {
            toastr.warning("邮箱格式不正确");
            inputBorderErrorColor('email');
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
                        inputBorderErrorColor('email');
                        return;
                    }
                    inputBorderCorrectColor('email');
                },
                error: function (err) {
                    toastr.error(err);
                }
            });
        }
    }
}
/*验证电话号码格式是否正确，是否被注册过*/
function validatePhone() {
    var phone = $('#mobile_phone').val().trim();
    $('#mobile_phone').val(phone);
    inputBorderCorrectColor('mobile_phone');
    if (!phone) {
        toastr.warning('电话号码不能为空');
        inputBorderErrorColor('mobile_phone');
        return;
    } else {
        var flag = false;
        var isPhone = /^([0-9]{3,4}-)?[0-9]{7,8}$/;
        var isMob = /^((\+?86)|(\(\+86\)))?(13[012356789][0-9]{8}|15[012356789][0-9]{8}|18[02356789][0-9]{8}|147[0-9]{8}|1349[0-9]{7})$/;
        flag = isPhone.test(phone) || isMob.test(phone);
        if (!flag) {
            toastr.warning("电话号码格式不正确");
            inputBorderErrorColor('mobile_phone');
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
                        inputBorderErrorColor('mobile_phone');
                        return;
                    }
                    inputBorderCorrectColor('mobile_phone');
                },
                error: function (err) {
                    toastr.error(err);
                }
            });
        }
    }
}
/*验证性别是否为空*/
function validateSex() {
    var sex = $('#sex').val();
    inputBorderCorrectColor('sex');
    if (sex == 0) {
        toastr.warning('请选择性别');
        inputBorderErrorColor('sex');
        return;
    }
}
/*验证行业是否为空*/
function validateIndustry() {
    var industry = $('#industry_id').val();
    inputBorderCorrectColor('industry_id');
    if (industry == 0) {
        toastr.warning('请选择行业');
        inputBorderErrorColor('industry_id');
        return;
    }
}
/*验证职务是否为空*/
function validateDuty() {
    var duty_id = $('#duty_id').val();
    inputBorderCorrectColor('duty_id');
    if (duty_id == 0) {
        toastr.warning('请选择职务');
        inputBorderErrorColor('duty_id');
        return;
    }
}
/*验证同意CheckBox*/
function validateCheck() {
    var flag = $('#Check_').is(':checked');
    var $button = $('#addCustomer');
    if (flag) {
        $button.removeAttr('disabled');
    } else {
        $button.attr('disabled', 'disabled');
    }
}
/*安全声明*/
function securityStatement() {
    swal({
        title: "安全声明!",
        text: "A custom <span style='color:#F8BB86'>html<span> message.",
        html: true
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
$(document).ready(function() {
    toastr.options.positionClass = 'toast-top-center';
});

/**
 * 获取上级菜单
 * @param {Object} key
 */
function submitInfo() {
    var jobNo = $('#jobNo').val();
    var email = $('#email').val();
    var CcapCode = $('#CcapCode').val();
    $.ajax({
        type: 'post',
        url: '/system/user/forgetPwd',
        dataType: 'json',
        data: {
            jonNo: jobNo,
            email: email,
            CcapCode: CcapCode
        },
        async: false,
        success: function(value) {
            var flag = value.flag;
            if (flag < 0) {
                toastr.warning(value.message);
                return;
            } else {
                toastr.success('密码修改邮件已经发送到注册邮箱，请查阅');
            }
        },
        error: function() {
            toastr.error('获取信息失败');
        }
    });
}

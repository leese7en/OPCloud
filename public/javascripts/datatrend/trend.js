/**
 * 设定为默认趋势点
 */
function indexMenuTrend() {

    var points = trendGroup.defaultTrendString;
    if (!points || points.length < 1) {
        toastr.warning("请选择测点");
        return;
    }
    $.ajax({
        type: 'post',
        url: '/system/fileManage/indexMenuTrend',
        data: {
            points: points.toString(),
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
 * 获取传递的点名和时间参数
 * @returns {Object}
 */

function getUrlParms() {
    var args = new Object();
    var query = location.search.substring(1);
    var pairs = query.split("&");
    for (var i = 0; i < pairs.length; i++) {
        var pos = pairs[i].indexOf('=');
        if (pos == -1)
            continue;
        var argname = pairs[i].substring(0, pos);
        var value = pairs[i].substring(pos + 1);
        args[argname] = unescape(value);
    }
    return args;
}

/**
 * 设置点信息数据改变
 */
function initPointName() {
    $(".pointName").select2({
        ajax: {
            url: "/trend/trend/getPoint",
            dataType: 'json',
            delay: 250,
            data: function (params) {
                return {
                    keyWord: params.term
                };
            },
            processResults: function (data, params) {

                return {
                    results: data.data,
                    pagination: {
                        more: false
                    }
                };
            },
            cache: false
        },
        escapeMarkup: function (markup) {
            return markup;
        },
        minimumInputLength: 1,
        templateResult: formatPointName,
        templateSelection: formatPointName
    });
    $(".pointName").on('select2:select', function (e) {
        var pointInfo = e.params;
        var pointName = pointInfo.data.name;
        var from, to;
        if (trendGroup.isMobile) {
            from = $('#trend_from_m').html();
            to = $('#trend_to_m').html();
            if (from == '开始时间' || to == '结束时间') {
                from = '';
                to = '';
                $('#trend_from_m').html('开始时间');
                $('#trend_to_m').html('结束时间');
            }
        } else {
            from = $('#trend_from').find('input').val();
            to = $('#trend_to').find('input').val();
        }
        pointCloseManage();
        trendGroup.addName(pointName.trim(), from, to);
    });
    $("#trendTime").select2({
        minimumResultsForSearch: Infinity,
        theme: "classic"
    }).on('select2:select', function (e) {
        var time = e.params;
        var target = time.data.id;
        if (target == -1) {
            return;
        }
        trendGroup.shortCutSearch(parseInt(target));
    });
}

/**
 *  数据快速查询快捷键
 */
function shortCutSearch(target) {
    trendGroup.shortCutSearch(parseInt(target));
}
/**
 *自适应量程
 **/
function adaptiveRange() {
    trendGroup.adaptiveRange();
}
/**
 * 格式化数据
 * @param param
 * @returns {*}
 */
function formatPointName(param) {
    return param.name || param.text;
}
/**
 * 初始化日期控件
 */
function initDate() {
    var currYear = new Date().getFullYear();
    var opt = {};
    opt.date = {preset: 'date'};
    opt.datetime = {preset: 'datetime'};
    opt.time = {preset: 'time'};
    opt.default = {
        theme: 'android-ics light', //皮肤样式
        display: 'modal', //显示方式
        mode: 'scroller', //日期选择模式
        dateFormat: 'yyyy-mm-dd',
        lang: 'zh',
        showNow: true,
        nowText: "今天",
        startYear: currYear - 50, //开始年份
        endYear: currYear + 10 //结束年份
    };
    $("#pointsTrendManage #trend_from_m").mobiscroll($.extend(opt['datetime'], opt['default']));
    $("#pointsTrendManage #trend_to_m").mobiscroll($.extend(opt['datetime'], opt['default']));
    $('.form_datetime').datetimepicker({
        language: 'zh-CN',
        format: 'yyyy-mm-dd hh:ii:ss',
        autoclose: true,
        startView: 'day',
        minView: 'hour',
        todayHighlight: true,
        todayBtn: true,
        clearBtn: true,
        forceParse: false,
        allowInputToggle: true,
        minuteStep: 1
    });
}

/*点管理*/
function openPointsTrendManage() {
    var width = trendGroup.documentWidth;
    var height = trendGroup.documentHeight;
    $('#pointsTrendManage').css('width', (width - 200) > 1200 ? 1200 : (width - 200));
    $('#pointsTrendManage').css('height', height / 3 * 2 + 150);
    $('#pointsTrendManage .modal-dialog').css('width', (width - 200) > 1200 ? 1200 : (width - 200));
    // $('#pointsTrendManage .modal-dialog').css('height', height / 3 * 2);
    $('#pointsTrendManage').css('margin-top', height / 16);
    $('#pointsTrendManage').css('margin-left', (width - 200) > 1200 ? (width - 1200) / 2 : 100);
    $('#pointsTrendManage .pointInfoTableDiv').css('height', height / 3 * 2 - 128);
    $('#pointsTrendManage').modal({
        show: true
    });
}
/*点管理*/
function closePointsTrendManageModal() {
    $('#pointsTrendManage').modal('hide');
}

function pointManage() {
    $('.theme-popover-mask').fadeIn(100);
    $('.theme-popover').slideDown(200);
    $('.theme-popover .select2-selection').click();
}

function pointCloseManage() {
    $('.theme-popover-mask').fadeOut(100);
    $('.theme-popover').slideUp(200);
}

/**
 * 查询数据
 */
function queryData() {
    var beginTime, endTime;
    if (trendGroup.isMobile) {
        beginTime = $('#trend_from_m').html();
        endTime = $('#trend_to_m').html();
        if (beginTime == '开始时间') {
            beginTime = '';
        }
        if (endTime == '结束时间') {
            endTime = '';
        }
    } else {
        beginTime = $('#trend_from').find('input').val();
        endTime = $('#trend_to').find('input').val();
    }

    //当查询实时数据的时候
    if (!beginTime && !endTime) {
        trendGroup.addTrend(trendGroup.defaultTrendString, null, null, true);
    }
    // 非实时数据，但是时间有空的时候
    else if (!beginTime) {
        toastr.warning("开始时间不能为空");
    } else if (!endTime) {
        toastr.warning("结束时间不能为空");
    }
    //查询历史的时候
    else {
        //时间先后顺序不符
        if (beginTime >= endTime) {
            toastr.warning("开始时间不能晚于结束时间");
        } else {
            trendGroup.addTrend(trendGroup.defaultTrendString, beginTime, endTime, false);
        }
    }

}

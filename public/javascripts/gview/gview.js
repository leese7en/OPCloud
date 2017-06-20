/**
 * 关闭对话框
 */

function indexMenuDiagram() {
    if (graph) {
        var URI = graph.current_graph_url;
        if (URI) {
            $.ajax({
                type: 'post',
                url: '/system/fileManage/indexMenuDiagram',
                data: {
                    URI: URI,
                    flag: 1
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
    }

}
function closeTrendInfo() {

}

function openModel() {
    var pointInfo = 'W3.UNIT01.POINT01,W3.UNIT01.POINT03';
    trendGroup.addName(pointInfo);
}

function pointManage() {
    $('.theme-popover-mask').fadeIn(100);
    $('.theme-popover').slideDown(200);
    $('.theme-popover .select2-selection').trigger('click');
}

function pointCloseManage() {
    $('.theme-popover-mask').fadeOut(100);
    $('.theme-popover').slideUp(200);
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

function mainPage() {
    if (graph) {
        graph.mainPage();
    }
}

function previousPage() {
    if (graph) {
        graph.previousPage();
    }
}

function nextPage() {
    if (graph) {
        graph.nextPage();
    }
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
        minuteStep: 1,
        bodyWidth: window_w
    });

}

/**
 * 查询数据
 */
function queryData() {
    var beginTime, endTime;
    if (trendGroup.isMobile) {
        beginTime = $('#trend_from_m').html();
        endTime = $('#trend_to_m').html();
        if (beginTime == '开始时间' || endTime == '结束时间') {
            beginTime = '';
            endTime = '';
            $('#trend_from_m').html('开始时间');
            $('#trend_to_m').html('结束时间');
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

//重写alert 函数
function alert(message) {
    if (message instanceof Object) {
        message = JSON.stringify(message)
    } else if (!isNaN(message)) {
        message = message + "";
    }
    message = "<span style='style:#F8BB86;font-size:24px;'>" + message.toString() + "</span>";
    swal({
        title: "系统消息",
        text: message,
        html: true,
        timer: 2000,
        showConfirmButton: false
    });
}

function showCTRL_Value(_uri, _av) {
    $('#CTRL_Modal').css({"margin-top": "200px"});
    $("#key").html(_uri);
    $("#CTRL_DX").bootstrapSwitch('destroy');
    $("#CTRL_DX").hide();
    $('#CTRL_TEXT input').val(_av)
    $("#CTRL_TEXT").show();
    $('#CTRL_Modal').modal();
    $("#commit").click(function () {
        $("#CTRL_DX").bootstrapSwitch('destroy');
        $("#CTRL_DX").hide();
        var value = $('#CTRL_TEXT input').val();
        if (_av == value) {
            sweetAlert("操作错误", "测点值与设置值一致!", "error");
            return;
        } else {
            swal({
                title: "执行确认",
                text: "请确认参数为：<span style=color:#ff4847><B>" + value + "</B></span>，控制点：<span style='color: #ff4847'><B>" + _uri + "</B></span>！",
                showCancelButton: true,
                confirmButtonColor: "#DD6B55",
                cancelButtonText: "取消",
                confirmButtonText: "确定",
                closeOnConfirm: false,
                closeOnCancel: false,
                html: true
            }, function (isConfirm) {
                if (isConfirm) {
                    $("#CTRL_TEXT").show();
                    $('#CTRL_Modal').modal('hide');
                    if (g && g.setValue) {
                        g.setValue(_uri, value);
                    }
                } else {
                    $('#CTRL_Modal').modal('hide');
                    swal({
                        title: "取消任务",
                        text: "取消动作成功",
                        timer: 2000,
                        showConfirmButton: false
                    });
                }
            });
        }
    });
}

function showCTRL_DX(_uri, _av) {
    $('#CTRL_Modal').css({"margin-top": "200px"});
    $("#key").html(_uri);
    $("#CTRL_DX").bootstrapSwitch('state', _av);
    $("#CTRL_TEXT").hide();
    $("#CTRL_DX").show();
    $('#CTRL_Modal').modal();

    $("#commit").click(function () {
        $("#CTRL_TEXT").hide();
        var state = $("#CTRL_DX").bootstrapSwitch('state');
        if (_av == state) {
            sweetAlert("操作错误", "测点状态与设置状态一致!", "error");
            return;
        } else {
            var value = (state ? 1 : 0);
            swal({
                title: "执行确认",
                text: "请确认<span style=color:#ff4847><B>" + (state ? "开启" : "关闭") + "</B></span>控制点：<span style='color: #ff4847'><B>" + _uri + "</B></span>！",
                showCancelButton: true,
                confirmButtonColor: "#DD6B55",
                cancelButtonText: "取消",
                confirmButtonText: "确定",
                closeOnConfirm: false,
                closeOnCancel: false,
                html: true
            }, function (isConfirm) {
                if (isConfirm) {
                    $("#CTRL_DX").show();
                    $('#CTRL_Modal').modal('hide');
                    if (g && g.setValue) {
                        g.setValue(_uri, value);
                    }
                } else {
                    $('#CTRL_Modal').modal('hide');
                    swal({
                        title: "取消任务",
                        text: "取消动作成功",
                        timer: 12000,
                        showConfirmButton: false
                    });
                }
            });
        }
    });
}

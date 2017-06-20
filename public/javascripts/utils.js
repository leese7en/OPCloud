/**
 * Created by se7en on 2015/12/16.
 */

var host = window.location.hostname;
var socketURI = host + ':8778/api/v1';
var socket = null;
var numberFormat = {
    numberDecimal: 2
};
/**
 * 根据获取到的资源权限信息，格式化资源树
 * @param selectedResources
 */
function formatResourcesTree(selectedResources) {
    var length = selectedResources.length;
    var oAuth = '';
    for (var i = 0; i < length; i++) {
        var o = selectedResources[i];
        if (o.auth == 0) {
            var ooAuth = o.id;
            for (var j = 0; j < length; j++) {
                var oo = selectedResources[j];
                if (oo.auth == 1 && oo.pId == o.id) {
                    ooAuth += ('|' + oo.id)
                }
            }
            oAuth += (ooAuth + '$');
        }
    }
    return oAuth;
}

/**
 * js map 对象
 * @memberOf {TypeName}
 * @return {TypeName}
 */
function UtilMap() {
    var struct = function (key, value) {
        this.key = key;
        this.value = value;
    };

    var put = function (key, value) {
        for (var i = 0; i < this.arr.length; i++) {
            if (this.arr[i].key === key) {
                this.arr[i].value = value;
                return;
            }
        }
        this.arr[this.arr.length] = new struct(key, value);
    };

    var get = function (key) {
        for (var i = 0; i < this.arr.length; i++) {
            if (this.arr[i].key === key) {
                return this.arr[i].value;
            }
        }
        return null;
    };

    var remove = function (key) {
        var v;
        for (var i = 0; i < this.arr.length; i++) {
            v = this.arr.pop();
            if (v.key === key) {
                continue;
            }
            this.arr.unshift(v);
        }
    };

    var size = function () {
        return this.arr.length;
    };

    var isEmpty = function () {
        return this.arr.length <= 0;
    };
    this.arr = [];
    this.get = get;
    this.put = put;
    this.remove = remove;
    this.size = size;
    this.isEmpty = isEmpty;
}

var utils = {
    formatString: 'yyyy-MM-dd HH:mm:ss',
    /**
     * 格式化时间
     * @param value
     * @returns {string}
     */
    formatTime: function (value) {
        var t = new Date(value),
            tf = function (i) {
                return (i < 10 ? '0' : '') + i;
            }
        return this.formatString.replace(/yyyy|yy|MM|dd|HH|mm|ss/g, function (a) {
            switch (a) {
                case 'yy':
                    return tf((t.getFullYear() + "").substr(2, 3));
                    break;
                case 'yyyy':
                    return tf(t.getFullYear());
                    break;
                case 'MM':
                    return tf(t.getMonth() + 1);
                    break;
                case 'mm':
                    return tf(t.getMinutes());
                    break;
                case 'dd':
                    return tf(t.getDate());
                    break;
                case 'HH':
                    return tf(t.getHours());
                    break;
                case 'ss':
                    return tf(t.getSeconds());
                    break;
            }
        });
    },
    /**
     * 日期格式化
     *
     * @param {}
     *            time
     * @param {}
     *            format
     * @return {}
     */
    dateFormat: function (time, format) {
        var t = new Date(time),
            tf = function (i) {
                return (i < 10 ? '0' : '') + i;
            }
        return format.replace(/yyyy|yy|MM|dd|HH|mm|ss/g, function (a) {
            switch (a) {
                case 'yy':
                    return tf((t.getFullYear() + "").substr(2, 3));
                    break;
                case 'yyyy':
                    return tf(t.getFullYear());
                    break;
                case 'MM':
                    return tf(t.getMonth() + 1);
                    break;
                case 'mm':
                    return tf(t.getMinutes());
                    break;
                case 'dd':
                    return tf(t.getDate());
                    break;
                case 'HH':
                    return tf(t.getHours());
                    break;
                case 'ss':
                    return tf(t.getSeconds());
                    break;
            }
        });
    }
}


/**
 * 格式化年份处理
 */
function formatYear(beginYear) {
    if (!beginYear) {
        beginYear = 2011;
    }
    var year = new Date().getFullYear();

    var yearArray = [];
    var yearObject = null;
    for (var i = 2011; i <= year; i++) {
        yearObject = new Object();
        yearObject.text = i;
        yearObject.value = i;
        yearArray.push(yearObject);
    }
    return yearArray;
}

/**
 * 格式化数值，强制保留2位小数，如：2，会在2后面补上00.即2.00
 */
function toDecimal(value, row, index) {
    var rt = row.RT;
    var x = value;
    var f = parseFloat(x);
    if (isNaN(f)) {
        return '-';
    }
    if (rt == 1 || rt == 2 || rt == 3) {
        return x;
    }
    if (typeof(x) == 'number') {
        return x.toFixed(2);
    }
    return x;
}

/**
 * 格式化数值，强制保留2位小数，如：2，会在2后面补上00.即2.00
 */
function toInteger(value, row, index) {
    var x = value;
    var f = parseInt(x);
    if (isNaN(f)) {
        return '-';
    }
    return f;
}

/**
 * 格式化数值，强制保留2位小数，如：2，会在2后面补上00.即2.00
 */
function toNotNumber(value, row, index) {
    return '-';
}
/**
 * 历史区间统计
 */
function toDecimalSta(value, row, index) {
    var rt = row.RT;
    var x = value;
    var f = parseFloat(x);
    if (isNaN(f)) {
        return '-';
    }
    if (rt == 1 || rt == 2 || rt == 3) {
        return x;
    }
    if (typeof(x) == 'number') {
        return x.toFixed(2);
    }
    return x;
}

/**
 * 历史区间统计
 */
function toDecimalAvg(value, row, index) {
    var x = value;
    var f = parseFloat(x);
    if (isNaN(f)) {
        return '-';
    }
    if (typeof(x) == 'number') {
        return x.toFixed(2);
    }
    return x;
}

/**
 * 获取报警级别
 * @param value
 * @param row
 * @param index
 * @returns {*}
 */
function getAlarmLevel(value, row, index) {
    switch (parseInt(value)) {
        case 0:
            return '<span class="span_red">红</span>';
        case 1:
            return '<span class="span_yellow">黄</span>';
        case 2:
            return "<span class='span_white'>白</span>";
        case 3:
            return "<span class='span_green'>绿</span>";
        default:
            return "<span>无报警</span>";
    }
}

/**
 * 任务运行状态
 * @param value
 * @param row
 * @param index
 * @returns {*}
 */
function formatTaskStatus(value, row, index) {
    var type = row.taskType;
    if (type == 0) {
        var jobStatus = row.jobStatus;
        if (jobStatus == 0) {
            switch (parseInt(value)) {
                case 1:
                    return '<span >未开始</span>';
                default:
                    return '<span class="color:green;">运行中</span>';
            }
        } else if (jobStatus == 2) {
            switch (parseInt(value)) {
                case 2:
                    return '<span class="color:green;">运行中</span>';
                case 3:
                    return "<span class='color:yellow'>结束</span>";
                case 4:
                    return "<span class='color:red'>出错</span>";
                default:
                    return "<span>运行中</span>";
            }
        } else {
            return '<span class="color:green;">运行中</span>';
        }
    } else {
        switch (parseInt(value)) {
            case 1:
                return '<span >未开始</span>';
            case 2:
                return '<span class="color:green;">运行中</span>';
            case 3:
                return "<span class='color:yellow'>结束</span>";
            case 4:
                return "<span class='color:red'>出错</span>";
            default:
                return "<span>未开始</span>";
        }
    }
}
/**
 * 任务最后一次运行状态
 * @param value
 * @param row
 * @param index
 * @returns {*}
 */
function formatLastTaskStatus(value, row, index) {
    var jobStatus = row.last_jobStatus;
    if (jobStatus == 2) {
        switch (parseInt(value)) {
            case 2:
                return '<span class="color:green;">运行中</span>';
            case 3:
                return "<span class='color:yellow'>结束</span>";
            case 4:
                return "<span class='color:red'>出错</span>";
            default:
                return '<span class="color:green;">运行中</span>';
        }
    } else if (jobStatus == 1) {
        return '<span class="color:green;">运行中</span>';
    } else {
        switch (parseInt(value)) {
            case 1:
                return '未开始';
            default:
                return '<span class="color:green;">运行中</span>';
        }
    }
}
/**
 * 任务运行类型
 * @param value
 * @param row
 * @param index
 * @returns {*}
 */
function formatTaskType(value, row, index) {
    switch (parseInt(value)) {
        case 0:
            return '<span >即时任务</span>';
        case 1:
            return '<span >定时任务</span>';
        default:
            return "<span>即时任务</span>";
    }
}
/*背景颜色设置*/
function alarmAPColor() {
    $('.span_red').parent().css('background-color', 'red');
    $('.span_yellow').parent().css('background-color', 'yellow');
    $('.span_white').parent().css('background-color', 'white');
    $('.span_green').parent().css('background-color', 'green');
}

/**
 * 获取点类型
 * @param value
 * @param row
 * @param index
 * @returns {*}
 */
function pointRT(value, row, index) {
    switch (parseInt(value)) {
        case 0:
            return '模拟量(AX)';
        case 1:
            return '数字量(DX)';
        case 2:
            return "短整数(I2)";
        case 3:
            return "长整数(I4)";
        case 4:
            return "浮点型(R8)";
        default:
            return "模拟量(AX)";
    }

}
/**
 * 获取报警信息
 * @param alarmType
 * @param alarmLC
 * @param alarmPointAS
 * @returns {*}
 */
function getAlarmDesc(value, row, index) {
    var alarmType = row.RT;
    var alarmPointAS = row.DS;
    var UNKNOWN = "恢复报警";
    var MASK_L1 = 1 << 1;
    var MASK_H1 = 1 << 2;
    var MASK_L2 = (1 << 3) | (1 << 1);
    var MASK_H2 = (1 << 3) | (1 << 2);
    var MASK_L3 = (1 << 1) | 1;
    var MASK_H3 = (1 << 2) | 1;
    var MASK_L4 = (1 << 3) | (1 << 1) | 1;
    var MASK_H4 = (1 << 3) | (1 << 2) | 1;

    var MASK_AL = alarmPointAS >> 7 & 1;
    /**
     * 如果是 DX点
     */
    if (alarmType.toString() == '1') {
        // DX报警
        switch (parseInt(MASK_AL)) {
            case 0:
                return '<span>不报警</span>';
            case 1:
                return '<span style="color:red">报警</span>';
            default:
                return UNKNOWN;
        }
    } else {
        // AX或其它报警
        //是否报警
        if (((alarmPointAS & 128) >> 7) == 1) {
            var intAS = alarmPointAS >> 1;
            // 8限报警
            intAS = intAS & 15;
            switch (intAS) {
                case MASK_L1:
                    var CO = numberToColor(row.C1);
                    return '<span style="color:' + CO + '">报警低限</span>';
                case MASK_L2:
                    var CO = numberToColor(row.C2);
                    return '<span style="color:' + CO + '">报警低2限</span>';
                case MASK_L3:
                    var CO = numberToColor(row.C3);
                    return '<span style="color:' + CO + '">报警低3限</span>';
                case MASK_L4:
                    var CO = numberToColor(row.C4);
                    return '<span style="color:' + CO + '">报警低4限</span>';
                case MASK_H1:
                    var CO = numberToColor(row.C5);
                    return '<span style="color:' + CO + '">报警高限</span>';
                case MASK_H2:
                    var CO = numberToColor(row.C6);
                    return '<span style="color:' + CO + '">报警高2限</span>';
                case MASK_H3:
                    var CO = numberToColor(row.C7);
                    return '<span style="color:' + CO + '">报警高3限</span>';
                case MASK_H4:
                    var CO = numberToColor(row.C8);
                    return '<span style="color:' + CO + '">报警高4限</span>';
                default:
                    return UNKNOWN;
            }
        } else {
            return UNKNOWN;
        }
    }
}

function numberToColor(value) {
    var val = 0xff000000 | (-parseInt(value));
    val = val.toString(16).substring(1);
    var str = '';
    //当返回的颜色值没有达到六位时
    if (val.length < 6) {
        var i = 6 - val.length;
        for (var t = 0; t < i; t++) {
            str += '0';
        }
    }
    return '#' + str + val;
}
//日期格式化
function timeFormatter(value, row, index) {
    if (value) {
        return utils.dateFormat(value * 1000, utils.formatString);
    }
}

function getQuality(value) {
    if (value < 0) {
        return 'Timeout';
    }
    var as = value & 1023;
    as = as >> 9;
    switch (as) {
        case 0:
            return 'Good';
        case 1:
            return 'Bad';
        default:
            return 'Timeout';
    }
}

var isMobile = {
    Android: function () {
        return navigator.userAgent.match(/Android/i) ? true : false;
    },
    BlackBerry: function () {
        return navigator.userAgent.match(/BlackBerry/i) ? true : false;
    },
    iOS: function () {
        return navigator.userAgent.match(/iPhone|iPad|iPod/i) ? true : false;
    },
    Windows: function () {
        return navigator.userAgent.match(/IEMobile/i) ? true : false;
    },
    any: function () {
        return (isMobile.Android() || isMobile.BlackBerry() || isMobile.iOS() || isMobile.Windows());
    }
};

/**
 * 获取高度
 * @returns {number}
 */
function getHeight() {
    var neg = $('.main-header').outerHeight() + $('.main-footer').outerHeight();
    return $(window).height() - $('h1').outerHeight(true) - neg - 50;
}

function getHeight2() {
    var neg = $('.main-header').outerHeight() + $('.main-footer').outerHeight();
    return $(window).height() - $('h1').outerHeight(true) - neg - 55;
}

/**
 * 获取高度
 * @returns {number}
 */
function getHeight3() {
    var neg = $('.main-header').outerHeight() + $('.main-footer').outerHeight();
    return $(window).height() - $('h1').outerHeight(true) - neg - 100;
}

/**
 * 获取高度
 * @returns {number}
 */
function getHeight4() {
    var neg = $('.main-header').outerHeight() + $('.main-footer').outerHeight();
    return $(window).height() - $('h1').outerHeight(true) - neg - 80;
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
        type: "error",
        timer: 2000,
        closeOnConfirm: false
    });
}


function indexFormatter(value, row, index) {
    return index + 1;
}


function selectedChange() {
    //历史区间快照
    $("#snapSelect").combobox({
        onChange: function (newValue, oldValue) {
            var dis = 3600
            switch (newValue) {
                case '10分钟':
                    dis = 600;
                    break;
                case '30分钟':
                    dis = 1800;
                    break;
                case '1小时':
                    dis = 3600;
                    break;
                case '6小时':
                    dis = 21600;
                    break;
                case '7天':
                    dis = 604800;
                    break;
                default:
                    dis = 3600;
                    break;
            }
            var endTime = $('#snapEnd').datetimebox('getValue');
            if (!endTime) {
                endTime = utils.dateFormat(new Date(), 'yyyy-MM-dd HH:mm:ss');
            }
            var end = Date.parse(endTime.replace(/-/g, "/")) / 1000;
            var begin = end - dis;
            $('#snapBegin').datetimebox('setValue', utils.dateFormat(new Date(begin * 1000), 'yyyy-MM-dd HH:mm:ss'));
            $('#snapEnd').datetimebox('setValue', utils.dateFormat(new Date(end * 1000), 'yyyy-MM-dd HH:mm:ss'));

        }
    });

    /**
     * 历史区间统计
     */
    $("#staSelect").combobox({
        onChange: function (newValue, oldValue) {
            var dis = 3600
            switch (newValue) {
                case '10分钟':
                    dis = 600;
                    break;
                case '30分钟':
                    dis = 1800;
                    break;
                case '1小时':
                    dis = 3600;
                    break;
                case '6小时':
                    dis = 21600;
                    break;
                case '1天':
                    dis = 86400;
                    break;
                case '7天':
                    dis = 604800;
                    break;
                default:
                    dis = 3600;
                    break;
            }
            var endTime = $('#staEnd').datetimebox('getValue');
            if (!endTime) {
                endTime = utils.dateFormat(new Date(), 'yyyy-MM-dd HH:mm:ss');
            }
            var end = Date.parse(endTime.replace(/-/g, "/")) / 1000;
            var begin = end - dis;
            $('#staBegin').datetimebox('setValue', utils.dateFormat(new Date(begin * 1000), 'yyyy-MM-dd HH:mm:ss'));
            $('#staEnd').datetimebox('setValue', utils.dateFormat(new Date(end * 1000), 'yyyy-MM-dd HH:mm:ss'));
        }
    });
}
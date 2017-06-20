openPlant = {
    toString: function () {
        return 'openPlant';
    }
}

openPlant.v = {};

//------------------system utils
function log(message) {
    if (window.console && window.console.log) {
        console.log(message);
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


function windowZoom() {
    var w = document.body.scrollWidth;
    var zoom = w / window.innerWidth;
    return zoom;
}


/**
 * 获取 参数
 * @returns {Object}
 */
function op_get_url_parms() {
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


function colorFormat(color) {
    if (color) {
        return color.replace('0x', '#')
    }
    return '';
}


openPlant.DCSMasker = function (_name, _value, _mask) {
    this.name = _name;
    this.value = _value;
    this.mask = _mask;
}

openPlant.DCSMaskerMap = function () {
    var _map = new Object();
    var init = function () {
        var onMask, offMask;
        for (var i = 0; i < 32; ++i) {
            var mask = (1 << i);
            onMask = "ON" + i;
            offMask = "OFF" + i;
            _map[onMask] = new openPlant.DCSMasker(onMask, mask, mask);
            _map[offMask] = new openPlant.DCSMasker(offMask, 0, mask);
        }

        var mask = 1;
        onMask = "ON";
        _map[onMask] = new openPlant.DCSMasker(onMask, mask, mask);
        onMask = "OFF";
        _map[onMask] = new openPlant.DCSMasker(onMask, 0, mask);

        // common shared
        _map["HDWRFAIL"] = new openPlant.DCSMasker("HDWRFAIL", 32768, 32768);
        _map["BAD"] = new openPlant.DCSMasker("BAD", 768, 768 + 32768);
        _map["POOR"] = new openPlant.DCSMasker("POOR", 512, 768 + 32768);
        _map["FAIR"] = new openPlant.DCSMasker("FAIR", 256, 768 + 32768);
        _map["GOOD"] = new openPlant.DCSMasker("GOOD", 0, 768 + 32768);
        _map["NORMAL"] = new openPlant.DCSMasker("NORMAL", 0, 128 + 32768);
        _map["ALARM"] = new openPlant.DCSMasker("ALARM", 128, 128 + 32768);
        _map["ALARMACK"] = new openPlant.DCSMasker("ALARMACK", 32, 32 + 32768);
        _map["ALARMOFF"] = new openPlant.DCSMasker("ALARMOFF", 8192, 8192
            + 32768);
        _map["CUTOUT"] = new openPlant.DCSMasker("CUTOUT", 64, 64 + 32768);
        _map["SCANOFF"] = new openPlant.DCSMasker("SCANOFF", 2048, 2048 + 32768);
        _map["ENTERVALUE"] = new openPlant.DCSMasker("ENTERVALUE", 1024, 1024
            + 32768);
        // DU Alarm
        _map["DROPALM"] = new openPlant.DCSMasker("DROPALM", 128, 128);
        _map["DROPCLEAR"] = new openPlant.DCSMasker("DROPCLEAR", 0, 128);
        _map["DROPFAULT"] = new openPlant.DCSMasker("DROPFAULT", 64, 64);
        _map["MCB0OFFLIN"] = new openPlant.DCSMasker("MCB0OFFLIN", 256, 256);
        _map["MCB1OFFLIN"] = new openPlant.DCSMasker("MCB1OFFLIN", 512, 512);
        _map["UPDATETIME"] = new openPlant.DCSMasker("UPDATETIME", 1024, 1024);
        _map["OPATTN"] = new openPlant.DCSMasker("OPATTN", 16, 16);
        // LA
        _map["LIMITOFF"] = new openPlant.DCSMasker("LIMITOFF", 4096, 4096
            + 32768);
        _map["HIGHALARM"] = new openPlant.DCSMasker("HIGHALARM", 128 + 8, 140
            + 32768);
        _map["LOWALARM"] = new openPlant.DCSMasker("LOWALARM", 128 + 4, 140
            + 32768);
        _map["HHALARM"] = new openPlant.DCSMasker("HIGHALARM", 128 + 8, 140
            + 32768); // ???
        _map["LLALARM"] = new openPlant.DCSMasker("LOWALARM", 128 + 4, 140
            + 32768); // ???
        _map["SENSORALM"] = new openPlant.DCSMasker("SENSORALM", 128 + 8 + 4,
            140 + 32768);
        _map["SENSORMODE"] = new openPlant.DCSMasker("SENSORMODE", 16, 16
            + 32768);
        _map["BETTER"] = new openPlant.DCSMasker("BETTER", 1, 3 + 32768);
        _map["WORSE"] = new openPlant.DCSMasker("WORSE", 2, 3 + 32768);
        // LD
        _map["RESET"] = new openPlant.DCSMasker("RESET", 0, 1 + 32768);
        _map["SET"] = new openPlant.DCSMasker("SET", 1, 1 + 32768);
        _map["SETALM"] = new openPlant.DCSMasker("SETALM", 2, 2 + 32768);
        _map["RESETALM"] = new openPlant.DCSMasker("RESETALM", 0, 2 + 32768);
        _map["TOGGLE"] = new openPlant.DCSMasker("TOGGLE", (1 << 14), (3 << 14));
    }
    init();

    this.getDCSMaskerMap = function () {
        return _map;
    }
}


var ColorUtils = {
    backgroundColors: [
        '#FFFFFF',
        '#F2F2E6',
        '#878787',
        '#FFFFFF',
        '#FAFAFA'
    ],
    defaultColors: [
        '#C0232C',
        '#23C07F',
        '#C07423',
        '#BEC023',
        '#5723C0',
        '#23C04C',
        '#2366C0',
        '#C023BA'
    ],
    infographicsColors: [
        '#89ED35',
        '#44B702',
        '#E42B6E',
        '#F4E250',
        '#FF9416',
        '#16FF47',
        '#3C16FF',
        '#FF1616'
    ],
    drakColors: [
        '#89ED35',
        '#44B702',
        '#E42B6E',
        '#F4E250',
        '#FF9416',
        '#16FF47',
        '#3C16FF',
        '#FF1616'
    ],
    grayColors: [
        '#656565',
        '#A9A9A9',
        '#888888',
        '#BABABA',
        '#484848',
        '#A7A7A7',
        '#666666',
        '#6F6F6F'
    ],
    helianthusColors: [
        '#6995ED',
        '#FF7F50',
        '#87CE6A',
        '#DAD970',
        '#DA70D6',
        '#32CD32',
        '#6764ED',
        '#CD8A32'
    ],

    /**
     * 将rgba 转为rgb
     * @param color
     */
    rgbaTorgb: function (color) {

        if (color.indexOf('#') > -1) {
            return color;
        }

        var rgb = color.replace(/rgba/, "");
        rgb = rgb.replace('(', "");
        rgb = rgb.replace(')', "");

        var color = rgb.split(',');
        var r = parseInt(color[0]);
        var g = parseInt(color[0]);
        var b = parseInt(color[0]);
        r = r.toString(16);
        g = g.toString(16);
        b = b.toString(16);
        return '#' + r + g + b;
    },

    /**
     * 获取高阶颜色
     * @param color
     * @returns {string}
     */
    brighter: function (color) {

        var rgb = color.replace(/#/, "");
        if (rgb.length === 6) {
            var r = parseInt('0x' + rgb.substring(0, 2)) + 50;
            var g = parseInt('0x' + rgb.substring(2, 4)) + 50;
            var b = parseInt('0x' + rgb.substring(4, 6)) + 50;
        }
        if (r > 255)
            r = 255;
        if (g > 255)
            g = 255;
        if (b > 255)
            b = 255;
        r = r.toString(16);
        g = g.toString(16);
        b = b.toString(16);
        return '#' + r + g + b;
    },
    /**
     * 获取低阶颜色
     * @param color
     * @returns {string}
     */
    darker: function (color) {
        var rgb = color.replace(/#/, "");
        if (rgb.length === 6) {
            var r = parseInt('0x' + rgb.substring(0, 2)) - 50;
            var g = parseInt('0x' + rgb.substring(2, 4)) - 50;
            var b = parseInt('0x' + rgb.substring(4, 6)) - 50;
        }
        if (r < 0)
            r = 0;
        if (g < 0)
            g = 0;
        if (b < 0)
            b = 0;
        r = r.toString(16);
        g = g.toString(16);
        b = b.toString(16);
        return '#' + r + g + b;
    },

    /**
     * 获取颜色的取反值
     * @param color
     * @returns {string}
     */
    xorColor: function (color) {
        var rgb = color.replace(/#/, "");
        if (rgb.length === 6) {
            var r = 255 - parseInt('0x' + rgb.substring(0, 2));
            var g = 255 - parseInt('0x' + rgb.substring(2, 4));
            var b = 255 - parseInt('0x' + rgb.substring(4, 6));
        }

        r = r.toString(16);
        g = g.toString(16);
        b = b.toString(16);
        return '#' + r + g + b;
    }
}

openPlant.dotted = {
    /**
     * 判断对应的点是否在给定区域内
     * @param x
     * @param y
     * @param _class
     * @param _bound
     */
    isInnerPath: function (x, y, _object, _canvas_widht, _canvas_height) {
        //创建绘图环境
        var _canvas = document.createElement("canvas");
        _canvas.width = _canvas_widht;
        _canvas.height = _canvas_height;
        var _context = _canvas.getContext("2d");
        //获取绘制的属性
        var _bounds = openPlant.GraphUtils.getElementBounds(_object);
        var _class = parseInt(_object["class"]);

        var posX = _bounds.x;
        var posY = _bounds.y;
        var width = _bounds.w;
        var height = _bounds.h;

        _context.beginPath();
        switch (_class) {
            case openPlant.GraphConst.TYPE_GROUP: {
                break;
            }
            case openPlant.GraphConst.TYPE_RECTANGLE: {
                // rect
                break;
            }
            case openPlant.GraphConst.TYPE_ELLIPSE: {
                // ellipse
                var scale = height / width;
                _context.save();
                _context.scale(1, scale);
                _context.arc(posX, posY / scale, width / 2, 0, Math.PI * 2);
                _context.restore();
                _context.closePath();
                if (_context.isPointInPath(x, y)) {
                    return true;
                }
                break;
            }
            case openPlant.GraphConst.TYPE_POLYLINE: {
                // POLYLINE
                break;
            }
            case openPlant.GraphConst.TYPE_POLYGON: {
                // 多边形
                var points = _object[openPlant.GraphConst.POLYLINE_PROPERTY_POINTS];
                _context.translate(0.5, 0.5);
                var p0 = points[0];
                _context.moveTo(p0.x, p0.y);
                for (var _i = 1; _i < points.length; _i++) {
                    var _px = points[_i];
                    _context.lineTo(_px.x, _px.y);
                }
                _context.closePath();

                if (_context.isPointInPath(x, y)) {
                    return true;
                }
                break;
            }
            case openPlant.GraphConst.TYPE_ARC: {
                // 扇形
                var _scale = _bounds.h / _bounds.w;
                var _centerX = _bounds.x + _bounds.w * 0.5;
                var _centerY = (_bounds.y + _bounds.h * 0.5) / _scale;
                var _arctype = _object[openPlant.GraphConst.ARC_PROPERTY_TYPE];
                if (_arctype) {
                    _arctype = parseInt(_arctype);
                } else {
                    _arctype = 1;
                }
                // 开始弧度
                var arcStart = _object[openPlant.GraphConst.ARC_PROPERTY_START];
                if (arcStart) {
                    arcStart = parseInt(arcStart);
                } else {
                    arcStart = 0;
                }
                // 弧度范围
                var arcEnd = _object[openPlant.GraphConst.ARC_PROPERTY_EXTENT];
                if (arcEnd) {
                    arcEnd = parseInt(arcEnd);
                } else {
                    arcEnd = 0;
                }
                switch (_arctype) {
                    case 0:
                        var r = parseInt(_bounds.w * 0.5), begin = -openPlant.GraphUtils.angle(arcStart), over = -openPlant.GraphUtils
                            .angle(arcStart + arcEnd);
                        _context.beginPath();
                        _context.arc(_centerX, _centerY, r, begin, over, (arcEnd > 0) ? true : false);
                        _context.restore();
                        break;
                    case 1:
                        var radius = _bounds.w * 0.5, sDeg = -openPlant.GraphUtils.angle(arcStart), eDeg = -openPlant.GraphUtils
                            .angle(arcStart + arcEnd);
                        _context.scale(1, _scale);
                        _context.translate(_centerX, _centerY);
                        _context.arc(0, 0, radius, sDeg, eDeg, (arcEnd > 0) ? true : false);
                        _context.rotate(sDeg);
                        _context.lineTo(radius, 0);
                        _context.closePath();
                        _context.restore();
                        break;
                    case 2:
                        var radius = _bounds.w * 0.5, sDeg = -openPlant.GraphUtils.angle(arcStart), eDeg = -openPlant.GraphUtils
                            .angle(arcStart + arcEnd);
                        _context.scale(1, _scale);
                        _context.translate(_centerX, _centerY);
                        _context.arc(0, 0, radius, sDeg, eDeg, (arcEnd > 0) ? true : false);
                        if (_arctype == 2) {
                            _context.lineTo(0, 0);
                        }
                        _context.rotate(sDeg);
                        _context.lineTo(radius, 0);
                        _context.closePath();
                        _context.restore();
                        break;
                    default:
                        var radius = _bounds.w * 0.5, sDeg = -openPlant.GraphUtils.angle(arcStart), eDeg = -openPlant.GraphUtils
                            .angle(arcStart + arcEnd);
                        _context.scale(1, _scale);
                        _context.translate(_centerX, _centerY);
                        _context.arc(0, 0, radius, sDeg, eDeg, (arcEnd > 0) ? true : false);
                        _context.rotate(sDeg);
                        _context.lineTo(radius, 0);
                        _context.closePath();
                        _context.restore();
                        break;
                }
                if (_context.isPointInPath(x, y)) {
                    return true;
                }
                break;
            }
            case openPlant.GraphConst.TYPE_BUTTON: {
                // 按钮
                break;
            }
            case openPlant.GraphConst.TYPE_TEXT: {
                //文本

                break;
            }
            case openPlant.GraphConst.TYPE_DASPOINT: {
                //采集点

                break;
            }
            case openPlant.GraphConst.TYPE_CALCPOINT: {
                // 计算点

                break;
            }
            case openPlant.GraphConst.TYPE_TIME: {
                //时间
                break;
            }
            case openPlant.GraphConst.TYPE_BAR: {
                //bar
                break;
            }
            case openPlant.GraphConst.TYPE_IMAGE: {
                //图片
                break;
            }
            case openPlant.GraphConst.TYPE_TREND: {
                //趋势
                break;
            }
            case openPlant.GraphConst.TYPE_DASHBOARD: {
                //仪表盘
                var r = width > height ? height / 2 : width / 2;
                posX = posX + r;
                posY = posY + r;
                _context.arc(posX, posY, r, 0, Math.PI * 2);
                if (_context.isPointInPath(x, y)) {
                    return true;
                }
                break;
            }
            case openPlant.GraphConst.TYPE_CHART_PIE: {
                //饼图
                break;
            }
        }
        return false;
    },
    /**
     * 绘制波浪线
     * @param context
     * @param x
     * @param y
     * @param width
     * @param height
     */
    drawWavy: function (context, x, y, width, height, color) {
        var space = 5;
        var indexx = width / space;
        var indexy = height / space;
        context.beginPath();
        for (var i = 1; i <= indexy; i++) {
            var isUp = false;
            context.moveTo(x, y + (i - 1) * space);
            for (var j = 1; j <= indexx; j++) {
                if (isUp) {
                    context.lineTo(x + j * space, y + (i - 1) * space);
                } else {
                    context.lineTo(x + j * space, y + i * space)
                }
                isUp = !isUp;
            }
        }
        context.lineWidth = 1;
        context.strokeStyle = color ? color : 'red';
        context.stroke();
    },

    /**
     * 绘制交叉斜线
     * @param context
     * @param x
     * @param y
     * @param width
     * @param height
     * @param isUp
     */
    drawJoinSlash: function (context, x, y, width, height, isjointype, space, color) {
        var space = space;
        var indexx = width / space;
        var indexy = height / space;
        var index = indexx > indexy ? indexx : indexy;
        context.beginPath();
        if (isjointype) {
            context.lineJoin = "round";
        }

        //绘制左边
        var startX = 0;
        var startY = 0;
        var endX = 0;
        var endY = 0;
        var i = 1;
        while ((startX < x + width) && (endY < y + height)) {
            startX = x;
            startY = y + space * i;
            if (i > indexy) {
                startX = x + (i - indexy) * space;
                startY = y + height;
            }
            endX = x + space * i;
            endY = y;

            if (i > indexx) {
                endX = x + width;
                endY = y + (i - indexx) * space;
            }
            context.moveTo(startX, startY);
            context.lineTo(endX, endY);
            i++;
        }

        //绘制右边
        startX = x;
        startY = y + height;
        endX = x;
        endY = y + height;
        i = 1;
        while ((startX < x + width) && (endY > y)) {
            startX = x;
            startY = y + height - space * i;
            if (i > indexy) {
                startX = x + (i - indexy) * space;
                startY = y;
            }
            endX = x + space * i;
            endY = y + height;

            if (i > indexx) {
                endX = x + width;
                endY = y + height - (i - indexx) * space;
            }
            context.moveTo(startX, startY);
            context.lineTo(endX, endY);
            i++;
        }
        context.lineWidth = 1;
        context.strokeStyle = color ? color : 'red';
        context.stroke();
    },

    /**
     * 绘制斜线
     * @param context
     * @param x
     * @param y
     * @param width
     * @param height
     * @param isUp
     */
    drawSlash: function (context, x, y, width, height, isUp, space, color) {
        var space = space;
        var indexx = width / space;
        var indexy = height / space;
        var index = indexx > indexy ? indexx : indexy;
        context.beginPath();
        if (isUp) {
            var startX = 0;
            var startY = 0;
            var endX = 0;
            var endY = 0;
            var i = 1;
            while ((startX < x + width) && (endY < y + height)) {
                startX = x;
                startY = y + space * i;
                if (i > indexy) {
                    startX = x + (i - indexy) * space;
                    startY = y + height;
                }
                endX = x + space * i;
                endY = y;

                if (i > indexx) {
                    endX = x + width;
                    endY = y + (i - indexx) * space;
                }
                context.moveTo(startX, startY);
                context.lineTo(endX, endY);
                i++;
            }
        } else {
            var startX = x;
            var startY = y + height;
            var endX = x;
            var endY = y + height;
            var i = 1;
            while ((startX < x + width) && (endY > y)) {
                startX = x;
                startY = y + height - space * i;
                if (i > indexy) {
                    startX = x + (i - indexy) * space;
                    startY = y;
                }
                endX = x + space * i;
                endY = y + height;

                if (i > indexx) {
                    endX = x + width;
                    endY = y + height - (i - indexx) * space;
                }
                context.moveTo(startX, startY);
                context.lineTo(endX, endY);
                i++;
            }
        }
        context.lineWidth = 1;
        context.strokeStyle = color ? color : 'red';
        context.stroke();
    },

    /**
     * 绘制竖线和横线
     * @param context
     * @param x
     * @param y
     * @param width
     * @param height
     * @param isHorizontal
     */
    drawLine: function (context, x, y, width, height, isHorizontal, lineWidth, color) {
        var space = 10;
        var indexx = width / space;
        var indexy = height / space;
        context.beginPath();
        if (isHorizontal) {
            for (var i = 0; i <= indexy; i++) {
                context.moveTo(x, y + i * space);
                context.lineTo(x + width, y + i * space);
            }
        } else {
            for (var j = 0; j <= indexx; j++) {
                context.moveTo(x + space * j, y);
                context.lineTo(x + space * j, y + height);
            }
        }
        context.lineWidth = lineWidth;
        context.strokeStyle = color ? color : 'white';
        context.stroke();
    },

    /**
     * 绘制墙
     * @param context
     * @param x
     * @param y
     * @param width
     * @param height
     * @param color
     */

    drawWall: function (context, x, y, width, height, color) {
        var space = 5;
        var indexx = width / space;
        var indexy = height / space;
        var isEven = false;
        context.beginPath();
        for (var i = 0; i <= indexx; i++) {
            //是否偶数条数据
            if (isEven) {
                for (var j = 1; j <= indexy; j += 2) {
                    context.moveTo(x + space * i, y + space * j);
                    context.lineTo(x + space * i, y + space * (j + 1));

                }
            }
            //奇数条数据
            else {
                for (var j = 0; j <= indexy; j += 2) {
                    context.moveTo(x + space * i, y + space * j);
                    context.lineTo(x + space * i, y + space * (j + 1));
                }
            }
            isEven = !isEven;
        }
        for (var t = 0; t <= indexy; t++) {
            context.moveTo(x, y + t * space);
            context.lineTo(x + width, y + t * space);
        }
        context.lineWidth = 1;
        context.strokeStyle = color ? color : 'red';
        context.stroke();
    },

    /**
     * 绘制 雨点 支持横向和竖向
     * @param context
     * @param x
     * @param y
     * @param width
     * @param height
     * @param isHorizontal
     */
    drawRain: function (context, x, y, width, height, isHorizontal, color) {
        var space = 10;
//判断横向
        if (isHorizontal) {
            context.beginPath();
            var indexx = width / space;
            var indexy = height / space;
            var isEven = false;
            for (var j = 0; j <= indexy; j++) {
                //是否偶数条数据
                if (isEven) {
                    for (var i = 1; i <= indexx; i += 2) {
                        context.moveTo(x + space * i, y + space * j);
                        context.lineTo(x + space * (i + 1), y + space * j);
                    }
                }
                //奇数条数据
                else {
                    for (var i = 0; i <= indexx; i += 2) {
                        context.moveTo(x + space * i, y + space * j);
                        context.lineTo(x + space * (i + 1), y + space * j);
                    }
                }
                isEven = !isEven;
            }
        }
//竖向
        else {
            context.beginPath();
            var indexx = width / space;
            var indexy = height / space;
            var isEven = false;
            for (var i = 0; i <= indexx; i++) {
                //是否偶数条数据
                if (isEven) {
                    for (var j = 1; j <= indexy; j += 2) {
                        context.moveTo(x + space * i, y + space * j);
                        context.lineTo(x + space * i, y + space * (j + 1));

                    }
                }
                //奇数条数据
                else {
                    for (var j = 0; j <= indexy; j += 2) {
                        context.moveTo(x + space * i, y + space * j);
                        context.lineTo(x + space * i, y + space * (j + 1));

                    }
                }
                isEven = !isEven;
            }
        }
        context.lineWidth = 1;
        context.strokeStyle = color ? color : 'red';
        context.stroke();
    },

    /**
     * 绘制网格
     * @param x1
     * @param y1
     * @param x2
     * @param y2
     * @param width
     * @param height
     */
    drawGrid: function (context, x, y, width, height, lineWidth, color) {
        var space = 10;
        var indexx = width / space;
        var indexy = height / space;
        context.beginPath();
        for (var i = 0; i <= indexx; i++) {
            context.moveTo(x, y + i * space);
            context.lineTo(x + width, y + i * space);
        }
        for (var j = 0; j <= indexy; j++) {
            context.moveTo(x + j * space, y);
            context.lineTo(x + j * space, y + height);
        }
        context.lineWidth = lineWidth;
        context.strokeStyle = color ? color : 'white';
        context.stroke();
    },

    /**
     * 根据点集合绘制曲线
     * @param context
     * @param points
     * @constructor
     */

    drawDashBessel: function (context, points) {
        for (var i = 0; i < points.length - 1; i++) {
            context[i % 2 === 0 ? 'moveTo' : "lineTo"](points[i].x, points[i].y, points[i + 1].x, points[i + 1].y);
        }
    },
    /**
     * 绘制虚线
     * @param context  换图环境
     * @param x  起始点x
     * @param y  起始点y
     * @param x2 结束点x
     * @param y2 结束点y
     * @param dashLength  点间隔
     * @param lineType   虚线类型
     * @param lineWidth  线宽
     * @param color   线的颜色
     */
    drawDashLine: function (context, x, y, x2, y2, lineType, color) {
        var dashLength = 5;
        lineType = lineType === undefined ? 1 : lineType;
        var deltaX = x2 - x;
        var deltaY = y2 - y;
        var delta = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        var index = parseInt(delta / dashLength);
        var lengthX = deltaX / index;
        var lengthY = deltaY / index;
        switch (lineType) {
            case LineType.SOLID:
                context.moveTo(x, y);
                context.lineTo(x2, y2);
                break;
            case LineType.SMALL_DASH:
            case LineType.DASHED:
            case LineType.NEAR_SOLID:
            case LineType.MIT_DASH1:
            case LineType.MIT_DASH2:
            case LineType.MIT_DASH3:
            case LineType.MIT_DASH4:
            case LineType.MIT_DASH5:
                for (var i = 0; i <= index; i++) {
                    context[i % 2 === 0 ? 'moveTo' : 'lineTo'](x + lengthX * i, y + lengthY * i);
                }
                break;
            case LineType.BIG_DOTS:
            case LineType.DASH_DOT:
                for (var i = 0; i <= index * 2; i++) {
                    context[i % 2 === 0 ? 'moveTo' : 'lineTo'](x + (lengthX / 2) * i, y + (lengthY / 2) * i);
                }
                break;
            case LineType.DOTTED:
            case LineType.DOT_DASH:
                context.beginPath();
                for (var i = 0; i <= index; i++) {
                    context.arc(x + (lengthX) * i, y + (lengthY) * i, 1, 0, Math.PI * 2);
                }
                context.fillStyle = color;
                context.fill();
                return;
            case LineType.SPACE:
                for (var i = 0; i <= index; i++) {
                    context.moveTo(x + (lengthX) * i, y + (lengthY) * i);
                    context.lineTo(x + (lengthX) * (i + 1 / 6), y + (lengthY) * (i + 1 / 6));
                    context.moveTo(x + (lengthX) * (i + 1 / 3), y + (lengthY) * (i + 1 / 3));
                    context.lineTo(x + (lengthX) * (i + 1 / 2), y + (lengthY) * (i + 1 / 2));
                }
                break;
            case LineType.KATHLINE:
                for (var i = 0; i < index; i++) {
                    context.moveTo(x + (lengthX) * (i + 0.1), y + (lengthY) * (i + 0.1));
                    context.lineTo(x + (lengthX) * (i + 0.3), y + (lengthY) * (i + 0.3));
                    context.moveTo(x + (lengthX) * (i + 0.5), y + (lengthY) * (i + 0.5));
                    context.lineTo(x + (lengthX) * (i + 0.6), y + (lengthY) * (i + 0.6));
                    context.moveTo(x + (lengthX) * (i + 0.8), y + (lengthY) * (i + 0.8));
                    context.lineTo(x + (lengthX) * (i + 1), y + (lengthY) * (i + 1));
                }
                break;
            default:
                context.moveTo(x, y);
                context.lineTo(x2, y2);
                break;
        }
    },

    /**
     * 绘制 虚边的圆
     * @param context
     * @param x
     * @param y
     * @param radius
     * @param beginArc
     * @param endArc
     * @param clockwise
     * @param dashLength
     * @param isclosed
     * @param color
     */
    drawArcDash: function (context, x, y, radius, beginArc, endArc, clockwise, dashLength, arcType, color) {
        dashLength = dashLength === undefined ? 10 : dashLength;

//如果逆时针
        if (clockwise) {
            beginArc = beginArc % (Math.PI * 2);
            endArc = endArc % (Math.PI * 2);
            if ((beginArc > 0 && endArc < 0) || (beginArc < 0 && endArc > 0)) {
                if (Math.abs((beginArc - endArc) % (Math.PI * 2)) == 0) {
                    beginArc = 0;
                    endArc = Math.PI * 2;
                }
            }
            //如果相差 刚好是圆的整数倍 则是空的
            else if (Math.abs((beginArc - endArc) % (Math.PI * 2)) == 0) {
                beginArc = 0;
                endArc = 0;
            } else {
                var arc = beginArc;
                beginArc = endArc;
                endArc = arc;
            }
        }
// 如果相差大于等于2π
        else {
            if (Math.abs(beginArc - endArc) >= Math.PI * 2) {
                beginArc = 0;
                endArc = Math.PI * 2;
            }
        }
        if (beginArc > endArc) {
            endArc += Math.PI * 2;
        }
        var radian = (endArc - beginArc) / dashLength;
        for (var i = 0; i < dashLength; i += 2) {
            context.beginPath();
            context.arc(x, y, radius, beginArc + radian * i, beginArc + radian * (i + 1), false);
            context.strokeStyle = color ? color : 'red';
            context.stroke();
        }
        if (arcType) {
            var pointX1 = x + radius * Math.cos(beginArc);
            var pointY1 = y + radius * Math.sin(beginArc);
            var pointX2 = x + radius * Math.cos(endArc);
            var pointY2 = y + radius * Math.sin(endArc);
            switch (arcType) {
                case 0:
                    break;
                case 1:
                    context.drawDashLine(pointX1, pointY1, pointX2, pointY2, dashLength);
                    break;
                case 2:
                    context.drawDashLine(pointX1, pointY1, x, y, dashLength);
                    context.drawDashLine(x, y, pointX2, pointY2, dashLength);
                    break;
                default:
                    context.drawDashLine(pointX1, pointY1, pointX2, pointY2, dashLength);
                    break;
            }
        }
    },
    /**
     * 获取数据
     * @param start
     * @param end
     * @returns {Array}
     */
    getNumber: function (start, end) {
        var number = new Array();
        var value = (end - start) / 10;
        number.push(parseInt(start));
        var nowValue = start;
        while (nowValue < end) {
            nowValue += value;
            number.push(parseInt(nowValue));
        }
        return number;
    }
}
/**
 * 构建贝塞尔曲线
 * @type {{points: Array, bessel2: Function, bessel3: Function, getPoint2: Function, getPoint3: Function, Point: Function}}
 */
openPlant.Bessel = {
    /**
     * 点信息集合
     */
    points: new Array(),
    /**
     * 绘制线段的个数
     */
    frequency: 40,
    /**
     * 获取对应的点信息集合
     * @param p0
     * @param p1
     * @param p2
     * @returns {Array}
     */
    bessel2: function (x0, y0, x1, y1, x2, y2) {
        var time = 1 / this.frequency;
        this.points = [];
        for (var t = 0; t <= 1; t += time) {
            this.points.push(this.getPoint2(x0, y0, x1, y1, x2, y2, t));
        }
        return this.points;
    },
    /**
     * 绘制3阶贝塞尔曲线
     * @param p0
     * @param p1
     * @param p2
     * @param p3
     * @returns {Array}
     */
    bessel3: function (x0, y0, x1, y1, x2, y2, x3, y3) {
        var time = 1 / this.frequency;
        this.points = [];
        for (var t = 0; t <= 1; t += time) {
            this.points.push(this.getPoint3(x0, y0, x1, y1, x2, y2, x3, y3, t));
        }
        return this.points;
    },
    /**
     * 根据点和时间获取对应的点信息  针对二阶贝塞尔
     * @param p0
     * @param p1
     * @param p2
     * @param t
     * @returns {Function}
     */
    getPoint2: function (x0, y0, x1, y1, x2, y2, t) {
        var x = (1 - t) * (1 - t) * x0 + 2 * t * (1 - t) * x1 + t * t * x2;
        var y = (1 - t) * (1 - t) * y0 + 2 * t * (1 - t) * y1 + t * t * y2;
        var point = new openPlant.Bessel.Point();
        point.x = x;
        point.y = y;
        return point;
    },
    /**
     * 根据点和对应的时间获取对应的点信息 针对三阶贝塞尔曲线
     * @param p0
     * @param p1
     * @param p2
     * @param p3
     * @param t
     * @returns {Function}
     */
    getPoint3: function (x0, y0, x1, y1, x2, y2, x3, y3, t) {
        var x = (1 - t) * (1 - t) * (1 - t) * x0 + 3 * t * (1 - t) * (1 - t) * x1 + 3 * t * t * (1 - t) * x2 + t * t
            * t * x3;
        var y = (1 - t) * (1 - t) * (1 - t) * y0 + 3 * t * (1 - t) * (1 - t) * y1 + 3 * t * t * (1 - t) * y2 + t * t
            * t * y3;
        var point = new openPlant.Bessel.Point();
        point.x = x;
        point.y = y;
        return point;
    },
    /**
     * 点对象
     * @constructor
     */
    Point: function () {
        this.x = 0;
        this.y = 0;
    }
}
/**
 * 线型常量
 * @type {{SOLID: number, DASHED: number, DOTS: number, DOTTED: number, SPACE: number, KATHLINE: number}}
 */
var LineType = {
    SOLID: 0,//正常的线
    DASHED: 1,//间隔线
    SMALL_DASH: 2,
    BIG_DOTS: 3,
    //DOTS: 2,  //点线
    DOTTED: 4, //虚线\
    DASH_DOT: 5,
    NEAR_SOLID: 6,
    SPACE: 7,//空格线
    DOT_DASH: 8,
    KATHLINE: 9,//一长 一短baud
    MIT_DASH1: 10,
    MIT_DASH2: 11,
    MIT_DASH3: 12,
    MIT_DASH4: 13,
    MIT_DASH5: 14
}
/**
 * 各种背景 图；类型常量
 * @type {{HORIZONTALFINELINE: number, VERTICALFINELINE: number, FINEGRID: number, HORIZONTALCRUDELINE: number, VERTICALCRUDELINE: number, CRUDEGRID: number, LEFTFINESLASH: number, RIGHTFINESLASH: number, JOINFINEWSLASH: number, LEFTCRUDESLASH: number, RIGHTCRUDESLASH: number, JOINCRUDESLASH: number, WAVY: number, WALL: number, HORIZONTALRAIN: number, VERICTRAIN: number}}
 */
openPlant.BackGroundType = {
    HORIZONTALFINELINE: 0,//横向 细线
    VERTICALFINELINE: 1,//竖向 细线
    FINEGRID: 2,//细 网格
    HORIZONTALCRUDELINE: 3,//横向 粗线
    VERTICALCRUDELINE: 4,//竖向 粗线
    CRUDEGRID: 5, //粗的网格
    LEFTFINESLASH: 6,// 左边 细斜线
    RIGHTFINESLASH: 7,// 右边 细斜线
    JOINFINEWSLASH: 8,// 左右 细斜线
    LEFTCRUDESLASH: 9,//左边 粗斜线
    RIGHTCRUDESLASH: 10,//右边 粗斜线
    JOINCRUDESLASH: 11,// 左右 粗斜线
    WAVY: 12,//波浪线
    WALL: 13,//墙型
    HORIZONTALRAIN: 14,//横向 雨点
    VERICTRAIN: 15
//竖向 雨点
}

CanvasRenderingContext2D.prototype.drawDashLine = function (x, y, x2, y2, dashLength) {
    dashLength = dashLength === undefined ? 10 : dashLength;
    var deltaX = x2 - x;
    var deltaY = y2 - y;
    for (var i = 0; i < dashLength; i++) {
        this[i % 2 === 0 ? 'moveTo' : 'lineTo'](x + (deltaX / dashLength) * i, y + (deltaY / dashLength) * i);
    }
    this.stroke();
}
/**
 * 将获取背景canvas背景图的方法加入到canvas绘图环境中去
 * @param backGroundType
 * @param frontColor
 * @param hinderColor
 * @returns {CanvasPattern}
 */
CanvasRenderingContext2D.prototype.getBackGroundImage = function (backGroundType, frontColor, hinderColor) {
    var canvas = document.createElement("canvas");
    canvas.width = 100;
    canvas.height = 100;
    var context = canvas.getContext("2d");
    context.rect(0, 0, 100, 100);
    context.fillStyle = frontColor;
    context.fill();
    var image = new Image();
    switch (backGroundType) {
        case openPlant.BackGroundType.HORIZONTALFINELINE:
            openPlant.dotted.drawLine(context, 0, 0, canvas.width, canvas.height, true, 1, hinderColor);
            break;
        case openPlant.BackGroundType.VERTICALFINELINE:
            openPlant.dotted.drawLine(context, 0, 0, canvas.width, canvas.height, false, 1, hinderColor);
            break;
        case openPlant.BackGroundType.FINEGRID:
            openPlant.dotted.drawGrid(context, 0, 0, canvas.width, canvas.height, 1, hinderColor);
            break;
        case openPlant.BackGroundType.HORIZONTALCRUDELINE:
            openPlant.dotted.drawLine(context, 0, 0, canvas.width, canvas.height, true, 3, hinderColor);
            break;
        case openPlant.BackGroundType.VERTICALCRUDELINE:
            openPlant.dotted.drawLine(context, 0, 0, canvas.width, canvas.height, false, 3, hinderColor);
            break;
        case openPlant.BackGroundType.CRUDEGRID:
            openPlant.dotted.drawGrid(context, 0, 0, canvas.width, canvas.height, 3, hinderColor);
            break;
        case openPlant.BackGroundType.LEFTFINESLASH:
            openPlant.dotted.drawSlash(context, 0, 0, canvas.width, canvas.height, true, 20, hinderColor);
            break;
        case openPlant.BackGroundType.RIGHTFINESLASH:
            openPlant.dotted.drawSlash(context, 0, 0, canvas.width, canvas.height, false, 20, hinderColor);
            break;
        case openPlant.BackGroundType.JOINFINEWSLASH:
            openPlant.dotted.drawJoinSlash(context, 0, 0, canvas.width, canvas.height, false, 20, hinderColor);
            break;
        case openPlant.BackGroundType.LEFTCRUDESLASH:
            openPlant.dotted.drawSlash(context, 0, 0, canvas.width, canvas.height, true, 10, hinderColor);
            break;
        case openPlant.BackGroundType.RIGHTCRUDESLASH:
            openPlant.dotted.drawSlash(context, 0, 0, canvas.width, canvas.height, false, 10, hinderColor);
            break;
        case openPlant.BackGroundType.JOINCRUDESLASH:
            openPlant.dotted.drawJoinSlash(context, 0, 0, canvas.width, canvas.height, true, 10, hinderColor);
            break;
        case openPlant.BackGroundType.WAVY:
            openPlant.dotted.drawWavy(context, 0, 0, canvas.width, canvas.height, hinderColor);
            break;
        case openPlant.BackGroundType.WALL:
            openPlant.dotted.drawWall(context, 0, 0, canvas.width, canvas.height, hinderColor);
            break;
        case openPlant.BackGroundType.HORIZONTALRAIN:
            openPlant.dotted.drawRain(context, 0, 0, canvas.width, canvas.height, true, hinderColor);
            break;
        case openPlant.BackGroundType.VERICTRAIN:
            openPlant.dotted.drawRain(context, 0, 0, canvas.width, canvas.height, false, hinderColor);
            break;
        default:
            break;
    }
    try {
        image.src = canvas.toDataURL('image/png');
        var pattern = context.createPattern(image, 'repeat');
        while (!pattern) {
            pattern = context.createPattern(image, 'repeat');
        }
    } catch (e) {
        if (e.name == "NS_ERROR_NOT_AVAILABLE") {
            setTimeout(function () {
                pattern = context.createPattern(image, "repeat");
                return pattern;
            }, 100)

        } else {
            throw e;
        }
    }
    return pattern;
}

/**
 * 绘制虚边矩形
 * @param x
 * @param y
 * @param w
 * @param h
 * @param lineWidth
 * @param lineType
 * @param color
 */
CanvasRenderingContext2D.prototype.drawDashRect = function (x, y, w, h, lineWidth, lineType, color) {
    this.beginPath();
    if (lineType == 0) {
        this.moveTo(x, y);
        this.lineTo(x + w, y);
        this.lineTo(x + w, y + h);
        this.lineTo(x, y + h);
    } else {
        openPlant.dotted.drawDashLine(this, x, y, x, y + h, lineType, color);
        openPlant.dotted.drawDashLine(this, x, y + h, x + w, y + h, lineType, color);
        openPlant.dotted.drawDashLine(this, x + w, y + h, x + w, y, lineType, color);
        openPlant.dotted.drawDashLine(this, x + w, y, x, y, lineType, color);
    }
    this.closePath();

    if (lineWidth > 0) {
        this.lineWidth = lineWidth;
        this.strokeStyle = color ? color : 'black';
        this.stroke();
    } else {
        this.strokeStyle = "rgba(0,0,0,0)"
    }
}

/**
 * 绘制虚边 椭圆
 * @param x
 * @param y
 * @param a
 * @param b
 * @param lineWidth
 * @param lineType
 * @param color
 */
CanvasRenderingContext2D.prototype.drawDashEllipse = function (x, y, a, b, lineWidth, lineType, color) {
    /*
     var k = .5522848, ox = a * k, // 水平控制点偏移量
     oy = b * k; // 垂直控制点偏移量*/
    var scale = b / a;
    this.beginPath();
    //绘制虚边框
    if (lineType != 0) {
        this.save();
        this.scale(1, scale);
        openPlant.dotted.drawArcDash(this, x, y / scale, a, 0, Math.PI * 2, false, 100, undefined, color);
        this.restore();
    } else {

        this.save();
        this.scale(1, scale);
        this.arc(x, y / scale, a, 0, Math.PI * 2);
        this.restore();
        if (parseInt(lineWidth) > 0) {
            this.lineWidth = lineWidth + 1;
            this.strokeStyle = color ? color : 'black';
            this.stroke();
        }
    }
}

/**
 * 绘制虚边多边形
 * @param points
 * @param lineWidth
 * @param lineType
 * @param color
 * @param _isPolygon
 */
CanvasRenderingContext2D.prototype.drawDashPoly = function (points, _fill, lineWidth, lineType, color, isPolygon) {
    this.translate(0.5, 0.5);
    this.beginPath();
    var p0 = points[0];
    for (var i = 1; i < points.length; i++) {
        var pS = points[i - 1];
        var pE = points[i];
        openPlant.dotted.drawDashLine(this, parseInt(pS.x), parseInt(pS.y), parseInt(pE.x), parseInt(pE.y),
            lineType, color);
    }
    if (isPolygon) {
        openPlant.dotted.drawDashLine(this, parseInt(pE.x), parseInt(pE.y), parseInt(p0.x), parseInt(p0.y),
            lineType, color);
    }

    if (parseInt(lineWidth) > 0) {
        this.lineWidth = lineWidth;
        this.strokeStyle = color ? color : 'black';
        this.stroke();
    }
    this.beginPath();
    this.moveTo(p0.x, p0.y);
    for (var _i = 1; _i < points.length; _i++) {
        var _px = points[_i];
        this.lineTo(_px.x, _px.y);
    }
    if (isPolygon) {
        this.closePath();
        if (_fill && _fill.type != 0) {
            this.fill();
        }
    }
}
/**
 * 绘制网格
 *
 * @param x
 * @param y
 * @param width
 * @param height
 * @param lineWidth
 * @param lineType
 * @param color
 */
CanvasRenderingContext2D.prototype.drawGrid = function (x, y, width, height, row, column, lineWidth, lineType, color) {

    this.beginPath();
    if (row != undefined && !row) {
        row = 5;
    }
    if (column != undefined && !column) {
        column = 5;
    }
    var xDis = width / row;
    var yDis = height / column;
    for (var i = 1; i < row; i++) {
        openPlant.dotted.drawDashLine(this, x + (i * xDis), y, x + (i * xDis), y + height, lineType, color);
    }
    for (var i = 1; i < column; i++) {
        openPlant.dotted.drawDashLine(this, x, y + (i * yDis), x + width, y + (i * yDis), lineType, color);
    }
    this.rect(x, y, width, height);
    if (parseInt(lineWidth) > 0) {
        this.lineWidth = lineWidth;
        this.strokeStyle = color ? color : 'black';
        this.stroke();
    }
}

/**
 * 绘制虚边 扇形
 * @param bounds
 * @param arctype
 * @param arcStart
 * @param arcEnd
 * @param lineWidth
 * @param lineType
 * @param color
 */
CanvasRenderingContext2D.prototype.drawDashArc = function (bounds, arctype, arcStart, arcEnd, lineWidth, lineType, color) {
    var _scale = bounds.h / bounds.w;
    var _centerX = bounds.x + bounds.w * 0.5;
    var _centerY = (bounds.y + bounds.h * 0.5) / _scale;
    if (lineType != 0) {
        switch (arctype) {
            case 0:
                var r = parseInt(bounds.w * 0.5), begin = -openPlant.GraphUtils.angle(arcStart), over = -openPlant.GraphUtils
                    .angle(arcStart + arcEnd);
                this.save();
                this.scale(1, _scale);
                openPlant.dotted.drawArcDash(this, _centerX, _centerY, r, begin, over, (arcEnd > 0) ? true : false, 100,
                    arctype, color);
                this.beginPath();
                this.arc(_centerX, _centerY, r, begin, over, (arcEnd > 0) ? true : false);
                if (parseInt(lineWidth) > 0) {
                    this.lineWidth = lineWidth + 1;
                    this.strokeStyle = color ? color : 'black';
                    this.stroke();
                }
                this.restore();
                break;
            case 1:
                var radius = bounds.w * 0.5, sDeg = -openPlant.GraphUtils.angle(arcStart), eDeg = -openPlant.GraphUtils
                    .angle(arcStart + arcEnd);
                this.save();
                this.scale(1, _scale);
                this.translate(_centerX, _centerY);
                this.beginPath();
                openPlant.dotted.drawArcDash(this, 0, 0, radius, sDeg, eDeg, (arcEnd > 0) ? true : false, 100, arctype,
                    color);
                this.arc(0, 0, radius, sDeg, eDeg, (arcEnd > 0) ? true : false);
                this.rotate(sDeg);
                this.lineTo(radius, 0);
                this.closePath();
                if (parseInt(lineWidth) > 0) {
                    this.lineWidth = lineWidth + 1;
                    this.strokeStyle = color ? color : 'black';
                    this.stroke();
                }
                this.restore();
                break;
            case 2:
                var radius = bounds.w * 0.5, sDeg = -openPlant.GraphUtils.angle(arcStart), eDeg = -openPlant.GraphUtils
                    .angle(arcStart + arcEnd);
                this.save();
                this.scale(1, _scale);
                this.translate(_centerX, _centerY);
                this.beginPath();
                openPlant.dotted.drawArcDash(this, 0, 0, radius, sDeg, eDeg, (arcEnd > 0) ? true : false, 100, arctype,
                    color);
                this.arc(0, 0, radius, sDeg, eDeg, (arcEnd > 0) ? true : false);
                if (arctype == 2) {
                    this.lineTo(0, 0);
                }
                this.rotate(sDeg);
                this.lineTo(radius, 0);
                this.closePath();
                if (parseInt(lineWidth) > 0) {
                    this.lineWidth = lineWidth + 1;
                    this.strokeStyle = color ? color : 'black';
                    this.stroke();
                }
                this.restore();
                break;
            default:
                var radius = bounds.w * 0.5, sDeg = -openPlant.GraphUtils.angle(arcStart), eDeg = -openPlant.GraphUtils
                    .angle(arcStart + arcEnd);
                this.save();
                this.scale(1, _scale);
                this.translate(_centerX, _centerY);
                this.beginPath();
                openPlant.dotted.drawArcDash(this, 0, 0, radius, sDeg, eDeg, (arcEnd > 0) ? true : false, 100, arctype,
                    color);
                this.arc(0, 0, radius, sDeg, eDeg, (arcEnd > 0) ? true : false);
                this.rotate(sDeg);
                this.lineTo(radius, 0);
                this.closePath();
                if (parseInt(lineWidth) > 0) {
                    this.lineWidth = lineWidth + 1;
                    this.strokeStyle = color ? color : 'black';
                    this.stroke();
                }
                this.restore();
                break;
        }
    } else {
        if (arctype == 2 || arctype == 1) {
            var radius = bounds.w * 0.5, sDeg = -openPlant.GraphUtils.angle(arcStart), eDeg = -openPlant.GraphUtils
                .angle(arcStart + arcEnd);
            this.save();
            this.scale(1, _scale);
            this.translate(_centerX, _centerY);
            this.beginPath();
            this.arc(0, 0, radius, sDeg, eDeg, (arcEnd > 0) ? true : false);
            this.save();
            this.rotate(eDeg);
            if (arctype == 2) {
                this.lineTo(0, 0);
            }
            this.restore();
            this.rotate(sDeg);
            this.lineTo(radius, 0);
            this.closePath();
            this.restore();
        } else {
            var r = parseInt(bounds.w * 0.5), begin = -openPlant.GraphUtils.angle(arcStart), over = -openPlant.GraphUtils
                .angle(arcStart + arcEnd);
            this.save();
            this.beginPath();
            this.scale(1, _scale);
            this.arc(_centerX, _centerY, r, begin, over, (arcEnd > 0) ? true : false);
            this.restore();
        }
        if (parseInt(lineWidth) > 0) {
            this.lineWidth = lineWidth + 1;
            this.strokeStyle = color ? color : 'black';
            this.stroke();
        }
    }
}

/**
 * 绘制圆角矩形
 * @param x
 * @param y
 * @param w
 * @param h
 * @param radius_aw
 * @param radius_ah
 * @param lineWidth
 * @param lineType
 * @param color
 */
CanvasRenderingContext2D.prototype.drawDashFilletRect = function (x, y, w, h, radius_aw, radius_ah, lineWidth, lineType,
                                                                  color) {
    // 左上椭圆圆心
    var x1 = x + radius_aw, y1 = y + radius_ah;
    // 右上椭圆圆心
    var x2 = x + w - radius_aw, y2 = y + radius_ah;
    // 左下椭圆圆心
    var x3 = x + w - radius_aw, y3 = y + h - radius_ah;
    // 右下椭圆圆心
    var x4 = x + radius_aw, y4 = y + h - radius_ah;
    var r = x + w;
    var b = y + h;
    var k = 0.5522848, ox = radius_aw * k, // 水平控制点偏移量
        oy = radius_ah * k; // 垂直控制点偏移量
    // 从椭圆的左端点开始顺时针绘制四条三次贝塞尔曲线

    this.beginPath();

    if (lineType != 0) {
        // 绘制左上圆角
        openPlant.dotted.drawDashBessel(this, openPlant.Bessel.bessel3(x, y1, x, y1 - oy, x1 - ox, y, x1, y));
        openPlant.dotted.drawDashLine(this, x1, y, x2, y, lineType, color);
        // 绘制右上圆角
        openPlant.dotted.drawDashBessel(this, openPlant.Bessel.bessel3(x2, y, x2 + ox, y, r, y2 - oy, r, y2));
        openPlant.dotted.drawDashLine(this, r, y2, r, y3, lineType, color);
        // 绘制右下圆角
        openPlant.dotted.drawDashBessel(this, openPlant.Bessel.bessel3(r, y3, r, y3 + oy, x3 + ox, b, x3, b));
        openPlant.dotted.drawDashLine(this, x3, b, x4, b, lineType, color);
        // 绘制左边圆角
        openPlant.dotted.drawDashBessel(this, openPlant.Bessel.bessel3(x4, b, x4 - ox, b, x, y4 + oy, x, y4));
        openPlant.dotted.drawDashLine(this, x, y4, x, y1, lineType, color);
        if (lineWidth > 0) {
            this.lineWidth = lineWidth;
            this.strokeStyle = color ? color : 'black';
            this.stroke();
        }
        // 从椭圆的左端点开始顺时针绘制四条三次贝塞尔曲线
        this.beginPath();
        this.moveTo(x, y1);
        // 绘制左上圆角
        this.bezierCurveTo(x, y1 - oy, x1 - ox, y, x1, y);
        // 绘制上边线
        this.lineTo(x2, y);
        // 绘制右上圆角
        this.bezierCurveTo(x2 + ox, y, r, y2 - oy, r, y2);
        // 绘制右边线
        this.lineTo(r, y3);
        // 绘制右下圆角
        this.bezierCurveTo(r, y3 + oy, x3 + ox, b, x3, b);
        // 绘制下边线
        this.lineTo(x4, b);
        // 绘制左边圆角
        this.bezierCurveTo(x4 - ox, b, x, y4 + oy, x, y4);
        // 绘制左边线
        this.lineTo(x, y4);
        this.closePath();
    } else {
        this.moveTo(x, y1);
        // 绘制左上圆角
        this.bezierCurveTo(x, y1 - oy, x1 - ox, y, x1, y);
        // 绘制上边线
        this.lineTo(x2, y);
        // 绘制右上圆角
        this.bezierCurveTo(x2 + ox, y, r, y2 - oy, r, y2);
        // 绘制右边线
        this.lineTo(r, y3);
        // 绘制右下圆角
        this.bezierCurveTo(r, y3 + oy, x3 + ox, b, x3, b);
        // 绘制下边线
        this.lineTo(x4, b);
        // 绘制左边圆角
        this.bezierCurveTo(x4 - ox, b, x, y4 + oy, x, y4);
        // 绘制左边线
        this.lineTo(x, y4);
        this.closePath();
        if (parseInt(lineWidth) > 0) {
            this.lineWidth = lineWidth;
            this.strokeStyle = color ? color : 'black';
            this.stroke();
        } else {
            this.strokeStyle = "rgba(0,0,0,0)"
        }
    }
}

/**
 * 绘制仪表盘
 * @param x
 * @param y
 * @param width
 * @param height
 * @param startValue
 * @param endValue
 * @param nowValue
 */
CanvasRenderingContext2D.prototype.drawDashBoard = function (x, y, r, startValue, endValue, currentValue) {
    this.beginPath();
    this.save();
    this.arc(x, y, r, 0, Math.PI * 2);
    this.fillStyle = '#B8BABC';
    this.fill();
    this.beginPath();
    this.arc(x, y, r * 0.95, 0, Math.PI * 2);
    this.fillStyle = '#000000';
    this.fill();
    this.beginPath();
    this.arc(x, y, r * 0.88, 0, Math.PI * 2);
    var gradient = this.createRadialGradient(x, y, 0.1 * r, x, y, 0.7 * r);
    gradient.addColorStop(0, 'white');
    gradient.addColorStop(1, '#4B87C4');
    this.fillStyle = gradient;
    this.fill();
    this.beginPath();
    this.arc(x, y, r * 0.15, 0, Math.PI * 2);
    this.fillStyle = 'black';
    this.fill();
    this.beginPath();
    this.arc(x, y, r * 0.12, 0, Math.PI * 2);
    this.fillStyle = 'white';
    this.fill();
    this.beginPath();
    this.arc(x, y, r * 0.10, 0, Math.PI * 2);
    this.fillStyle = 'black';
    this.fill();
    var start = Math.PI / 180 * 135;
    var step = Math.PI / 180 * 5.4;
    this.lineWidth = 2;
    for (var i = 0; i < 51; i++) {
        this.beginPath();
        this.strokeStyle = '#E6E6E6';
        if (i % 5 == 0) {
            this.arc(x, y, r * 0.80, start + step * i, start + step * i + 0.002);
            this.arc(x, y, r * 0.70, start + step * i, start + step * i + 0.002);
        }
        this.arc(x, y, r * 0.80, start + step * i, start + step * i + 0.001);
        this.arc(x, y, r * 0.75, start + step * i, start + step * i + 0.001);
        this.stroke();
    }
    var textStep = Math.PI / 180 * 27;
    var number = openPlant.dotted.getNumber(startValue, endValue);
    //绘制左下角
    for (var i = 0; i < 2; i++) {
        var posX = x + (r * 0.65) * Math.cos(start + textStep * i);
        var posY = y + r * 0.70 * Math.sin(start + textStep * i);
        this.fillText(number[i], posX, posY);
    }

    //绘制左上角
    for (var i = 2; i < 4; i++) {
        var posX = x + (r * 0.65) * Math.cos(start + textStep * i);
        var posY = y + r * 0.55 * Math.sin(start + textStep * i);
        this.fillText(number[i], posX, posY);
    }
    //绘制上侧
    var posX = x + (r * 0.7) * Math.cos(start + textStep * 4);
    var posY = y + r * 0.55 * Math.sin(start + textStep * 4);
    this.fillText(number[4], posX, posY);
    //绘制上侧
    var posX = x - 10;
    var posY = y - r * 0.6;
    this.fillText(number[5], posX, posY);
    //绘制上侧
    var posX = x + (r * 0.5) * Math.cos(start + textStep * 6);
    var posY = y + r * 0.55 * Math.sin(start + textStep * 6);
    this.fillText(number[6], posX, posY);
    //绘制右上角
    for (var i = 7; i < 9; i++) {
        var posX = x + (r * 0.5) * Math.cos(start + textStep * i);
        var posY = y + r * 0.5 * Math.sin(start + textStep * i);
        this.fillText(number[i], posX, posY);
    }

    //绘制右下侧
    for (var i = 9; i < 11; i++) {
        var posX = x + (r * 0.50) * Math.cos(start + textStep * i);
        var posY = y + r * 0.70 * Math.sin(start + textStep * i);
        this.fillText(number[i], posX, posY);
    }
    var nowAngle = (currentValue - startValue) / (endValue - startValue) * (Math.PI * 1.5) + Math.PI / 180 * 135;
    //绘制指针
    this.beginPath();
    this.translate(x, y);
    this.rotate(nowAngle);
    this.rect(-2, -2, r * 0.7, 4);
    //ctx.lineWidth=2;
    this.fillStyle = 'red';
    this.fill();
    this.restore();
}

/**
 * 绘制 chart 的title
 * @param x
 * @param y
 * @param w
 * @param h
 * @param title
 * @param titleFont
 * @param titleColor
 * @param position
 */
CanvasRenderingContext2D.prototype.drawChartTitle = function (x, y, w, h, title, titleFont, titleColor, position) {
    this.save();
    var width = this.measureText(title).width;
    var height = this.measureText('麦').width;
    this.font = titleFont;
    this.fillStyle = titleColor;
    switch (position) {
        case 0:
            this.fillText(title, x, h + height);
            break;
        case 2:
            this.fillText(title, x + w - width, h + height);
            break;
        default:
            this.fillText(title, x + (w - width) / 2, h + height);
            break;
    }
    this.restore();
}
/**
 * 绘制 pieChart
 * @param x
 * @param y
 * @param w
 * @param h
 * @param font
 * @param position
 * @param dataSet
 * @param HollowPercent
 * @param chartType
 * @param chartStyle
 * @param lineWidth
 * @param lineType
 * @param color
 */

CanvasRenderingContext2D.prototype.drawPieChart = function (x, y, w, h, dataSet, font, position, hollowPercent,
                                                            chartType, chartStyle, lineWidth, lineType, color) {
    this.save();

    var colors = new Array();

    var backColor;
    /**
     * 绘制背景
     */
    switch (chartStyle) {
        case 1:
            backColor = ColorUtils.backgroundColors[0];
            colors = ColorUtils.defaultColors;
            break;
        case 2:
            backColor = ColorUtils.backgroundColors[1];
            colors = ColorUtils.infographicsColors;
            break;
        case 3:
            backColor = ColorUtils.backgroundColors[2];
            colors = ColorUtils.drakColors;
            break;
        case 4:
            backColor = ColorUtils.backgroundColors[3];
            colors = ColorUtils.grayColors;
            break;
        case 5:
            backColor = ColorUtils.backgroundColors[4];
            colors = ColorUtils.helianthusColors;
            break;
        default:
            backColor = ColorUtils.backgroundColors[4];
            colors = ColorUtils.defaultColors;
            break;
    }
    this.fillStyle = backColor;
    this.fillRect(x, y, w, h);

    /**
     * 绘制信息栏
     * @type {Number}
     */
    var fontHeight = this.measureText('W').width;
    var datasInfo = new Array();
    datasInfo = dataSet.split('#');

    var size = datasInfo.length;
    var maxWidth = Utils.getFontMaxWidth(this, datasInfo, font) + fontHeight * 2 + 5;
    //每行和每列的数据个数
    var xNum = parseInt(w / maxWidth);
    var yNum = size / xNum;
    var xAxis = 2;
    //圆心位置
    var posX = 0;
    var posY = 0
    var radius = 10;
    if (size % xNum > 0) {
        yNum += 1;
    }
    this.font = font;
    switch (position) {
        case 0:
            for (var i = 0; i < size; i++) {
                this.fillStyle = colors[i];
                this.fillRect(x + xAxis + (i % xNum) * maxWidth, y + xAxis + (parseInt(i / xNum)) * (fontHeight + xAxis),
                    fontHeight * 2, fontHeight);
                this.fillText(datasInfo[i].split(',')[0], x + xAxis * 2 + (i % xNum) * maxWidth + fontHeight * 2, y
                    + fontHeight + (parseInt(i / xNum)) * (fontHeight + 2));
            }
            posX = x + w / 2;
            posY = y + yNum * (fontHeight + 2) + (h - yNum * (fontHeight + 2)) / 2;
            radius = (h - yNum * (fontHeight + 2)) / 2;
            break;
        case 2:
            for (var i = 0; i < size; i++) {
                this.fillStyle = colors[i];
                this.fillRect(x + xAxis, y + 2 + i * (fontHeight + xAxis), fontHeight * 2, fontHeight);
                this.fillText(datasInfo[i].split(',')[0], x + xAxis * 2 + fontHeight * 2, y + fontHeight + i
                    * (fontHeight + 2));
            }
            posX = x + maxWidth + (w - maxWidth) / 2;
            posY = y + h / 2;
            radius = (w - maxWidth) / 2;
            break;
        case 3:
            for (var i = 0; i < size; i++) {
                this.fillStyle = colors[i];
                this.fillRect(x + xAxis + w - maxWidth, y + 2 + i * (fontHeight + xAxis), fontHeight * 2, fontHeight);
                this.fillText(datasInfo[i].split(',')[0], x + xAxis * 2 + w - maxWidth + fontHeight * 2, y + fontHeight + i
                    * (fontHeight + 2));
            }
            posX = x + (w - maxWidth) / 2;
            posY = y + h / 2;
            radius = (w - maxWidth) / 2;
            break;
        default:
            for (var i = 0; i < size; i++) {
                this.fillStyle = colors[i];
                this.fillRect(x + xAxis + (i % xNum) * maxWidth, y + h - yNum * (fontHeight + xAxis) + (parseInt(i / xNum))
                    * (fontHeight + xAxis), fontHeight * 2, fontHeight);
                this.fillText(datasInfo[i].split(',')[0], x + xAxis * 2 + (i % xNum) * maxWidth + fontHeight * 2, y + h
                    - yNum * (fontHeight + xAxis) + fontHeight + (parseInt(i / xNum)) * (fontHeight + xAxis));
            }
            posX = x + w / 2;
            posY = y + (h - yNum * (fontHeight + 2)) / 2;
            radius = (h - yNum * (fontHeight + 2)) / 2;
            break;
    }

    /**
     * 绘制图表
     */
    var total = Utils.getDataTotal(datasInfo);
    var start = 0;
    var end = 0;
    for (var i = 0; i < size; i++) {
        this.beginPath();
        var data = datasInfo[i].split(',')[1];
        end = start + data / total * Math.PI * 2;
        this.fillStyle = colors[i]
        this.arc(posX, posY, radius - 3, start, end);
        this.lineTo(posX, posY);
        this.closePath()

        start = end;
        this.fill();
    }

    this.beginPath();
    this.strokeStyle = ColorUtils.darker(backColor);
    this.arc(posX, posY, radius, 0, Math.PI * 2);
    this.stroke();
    this.closePath();

    /**
     * 绘制图表类型
     */
    switch (chartType) {
        case 1:
            this.beginPath();
            this.fillStyle = backColor;
            this.arc(posX, posY, radius * hollowPercent / 100, 0, Math.PI * 2);
            this.fill();
            this.closePath();

            this.beginPath();
            this.strokeStyle = ColorUtils.darker(backColor);
            this.arc(posX, posY, radius * (hollowPercent - 5) / 100, 0, Math.PI * 2);
            this.stroke();
            this.closePath();
            break;
        case 2:
            break;
        default:
            this.beginPath();
            this.fillStyle = backColor;
            this.arc(posX, posY, radius * hollowPercent / 100, 0, Math.PI * 2);
            this.fill();
            this.closePath();
            break;
    }
    this.restore();
}

/**
 * 绘制 柱状图
 * @param x   起始x点
 * @param y   起始y点
 * @param w   宽度
 * @param h   高度
 * @param dataSet   数据集
 * @param font    字体
 * @param direction   方向
 * @param chartType   类型
 * @param chartStyle  风格
 * @param hlimit     高限
 * @param llimit     底限
 * @param lineWidth   线宽
 * @param lineType    线类型
 * @param color       线颜色
 */
CanvasRenderingContext2D.prototype.drawBarChart = function (x, y, w, h, dataSet, font, direction, chartType, chartStyle,
                                                            hlimit, llimit, lineWidth, lineType, color) {

    this.save();

    var colors = new Array();

    var backColor;
    /**
     * 绘制背景
     */
    switch (chartStyle) {
        case 1:
            backColor = ColorUtils.backgroundColors[0];
            colors = ColorUtils.defaultColors;
            break;
        case 2:
            backColor = ColorUtils.backgroundColors[1];
            colors = ColorUtils.infographicsColors;
            break;
        case 3:
            backColor = ColorUtils.backgroundColors[2];
            colors = ColorUtils.drakColors;
            break;
        case 4:
            backColor = ColorUtils.backgroundColors[3];
            colors = ColorUtils.grayColors;
            break;
        case 5:
            backColor = ColorUtils.backgroundColors[4];
            colors = ColorUtils.helianthusColors;
            break;
        default:
            backColor = ColorUtils.backgroundColors[4];
            colors = ColorUtils.defaultColors;
            break;
    }
    this.fillStyle = backColor;
    this.fillRect(x, y, w, h);
    var barX = x, barY = y, barW = w, barH = h;
    barX += 5;
    barY += 10;
    barH -= 15;
    barW -= 15;

    /**
     * 绘制信息栏
     * @type {Number}
     */
    var fontHeight = this.measureText('W').width;
    var datasInfo = new Array();
    datasInfo = dataSet.split('#');

    var size = datasInfo.length;
    var maxWidth = Utils.getFontMaxWidth(this, datasInfo, font) + fontHeight * 2 + 5;
    /**
     * 网格间距
     * @type {number}
     */
    var spacing = 5;
    //每行和每列的数据个数
    var xNum = parseInt(w / maxWidth);
    var yNum = size / xNum;
    var xAxis = 2;
    if (size % xNum > 0) {
        yNum += 1;
    }
    this.font = font;
    for (var i = 0; i < size; i++) {
        this.fillStyle = colors[i];
        this.fillRect(x + xAxis + (i % xNum) * maxWidth, y + h - yNum * (fontHeight + xAxis) + (parseInt(i / xNum))
            * (fontHeight + xAxis), fontHeight * 2, fontHeight);
        this.fillText(datasInfo[i].split(',')[0], x + xAxis * 2 + (i % xNum) * maxWidth + fontHeight * 2, y + h - yNum
            * (fontHeight + xAxis) + fontHeight + (parseInt(i / xNum)) * (fontHeight + xAxis));
    }

    barH -= yNum * (fontHeight + 5);

    /**
     * 绘制刻度
     */
    if (chartType == 1) {
        var xyAxis = Utils.getMinAndMax(datasInfo);
        var xyLimit = parseInt(xyAxis[1]) + parseInt(xyAxis[3]);

        var uPercent = xyAxis[1] / xyLimit;
        var dPercent = xyAxis[3] / xyLimit;

        llimit = Math.min(xyAxis[0], xyAxis[2]) - 5;

        var axisWidth = Utils.getFontWidth(this, Math.max(xyAxis[1], xyAxis[3]) + "", font);
        this.fillStyle = 'black';

        // 绘制竖向刻度
        if (direction == 0) {
            var uBarH = barH * uPercent;
            var dBarH = barH * dPercent;

            var uTime = parseInt(11 * uPercent);
            var dTime = parseInt(11 * dPercent);

            var yDis = parseInt(uBarH / uTime);
            var vDis = parseInt((xyAxis[1] - llimit) / uTime);
            for (var i = 0; i <= uTime; i++) {
                this.fillText(parseInt(llimit + vDis * i).toString(), barX, barY + uBarH - i * yDis);
            }

            yDis = parseInt(dBarH / dTime);
            vDis = parseInt((xyAxis[3] - llimit) / dTime);
            for (var i = 0; i <= dTime; i++) {
                this.fillText(parseInt(llimit + vDis * i).toString(), barX, barY + uBarH + i * yDis);
            }

            barX += (axisWidth - 2);
            barW -= (axisWidth + 2);

        }
        // 绘制横向刻度
        else {
            barH -= 10;
            var uBarW = barW * uPercent;
            var dBarW = barW * dPercent;
            var uTime = parseInt(10 * uPercent);
            var dTime = parseInt(10 * dPercent);

            var xDis = parseInt(uBarW / uTime);
            var vDis = parseInt((xyAxis[1] - llimit) / uTime);
            for (var i = 0; i <= uTime; i++) {
                this.fillText(parseInt(llimit + vDis * i).toString(), barX + uBarW - i * xDis, barY + barH - 10 + 25);
            }
            xDis = parseInt(dBarW / dTime);
            vDis = parseInt((xyAxis[3] - llimit) / dTime);
            for (var i = 0; i <= dTime; i++) {
                this.fillText(parseInt(llimit + vDis * i).toString(), barX + uBarW + i * xDis, barY + barH - 10 + 25);
            }
            barX += (axisWidth - 2);
            barW -= (axisWidth + 2);
        }
    }

    else {
        var axisWidth = Utils.getFontWidth(this, hlimit + "", font);
        this.fillStyle = 'black';

        // 绘制竖向刻度
        if (direction == 0) {
            var yDis = barH / 10;
            var vDis = parseInt((hlimit - llimit) / 10);
            for (var i = 0; i <= 10; i++) {
                this.fillText(parseInt(llimit + vDis * i).toString(), barX, barY + barH - i * yDis + fontHeight / 2);
            }
            barX += (axisWidth - 2);
            barW -= (axisWidth + 2);
        }
        // 绘制横向刻度
        else {
            barH -= 10;
            var xDis = barW / 10;
            var vDis = parseInt((hlimit - llimit) / 10);
            for (var i = 0; i <= 10; i++) {
                this.fillText(parseInt(llimit + vDis * i).toString(), barX + i * xDis
                    - this.measureText(parseInt(llimit + vDis * i).toString()).width / 2, barY + barH - 10 + 25);
            }
        }
    }
    /**
     * 绘制图表
     */
    if (barW <= 10 || barH <= 10)
        return;
    this.fillStyle = ColorUtils.darker(backColor);
    this.fillRect(barX, barY, barW, barH);
    var xDis = barW / 10;
    var yDis = barH / 10;
    if (direction == 0) {
        // 绘制横向线
        for (var i = 0; i < 10; i++) {
            if (i % 2 == 0) {
                this.fillStyle = ColorUtils.darker(backColor);
            } else {
                this.fillStyle = ColorUtils.brighter(backColor);
            }
            this.fillRect(barX, barY + i * yDis, barW, yDis)
        }
        xDis = (barW - spacing) / size;
        // 绘制纵向线
        for (var i = 1; i < size; i++) {
            this.strokeStyle = backColor;
            this.moveTo(parseInt(barX + spacing + i * xDis - spacing / 2), barY);
            this.lineTo(parseInt(barX + spacing + i * xDis - spacing / 2), barY + barH);
            this.stroke();
        }
    }
    // 绘制竖向的背景
    else {
        // 绘制横向线
        for (var i = 0; i < 10; i++) {
            if (i % 2 == 0) {
                this.fillStyle = ColorUtils.darker(backColor);
            } else {
                this.fillStyle = ColorUtils.brighter(backColor);
            }
            this.fillRect(barX + i * xDis, barY, xDis, barH)
        }
        yDis = (barH - spacing) / size;
        // 绘制纵向线
        for (i = 1; i < size; i++) {
            this.strokeStyle = backColor;
            this.moveTo(barX, parseInt(barY + spacing + i * yDis - spacing / 2));
            this.lineTo(barX + barW, parseInt(barY + spacing + i * yDis - spacing / 2));
            this.stroke();
        }
    }
    /**
     * 绘制bar
     */
    switch (chartType) {
        case 1:
            var xyAxis = Utils.getMinAndMax(datasInfo);
            var xyLimit = parseInt(xyAxis[1]) + parseInt(xyAxis[3]);

            var uPercent = xyAxis[1] / xyLimit;
            var dPercent = xyAxis[3] / xyLimit;

            // 绘制竖向bar
            if (direction == 0) {

                var uBarH = parseInt(barH * uPercent);
                var dBarH = parseInt(barH * dPercent);

                var xDis = (barW - spacing) / size;
                var yDis = parseInt(xyAxis[1]) + 5 - llimit;
                for (var i = 0; i < datasInfo.length; i++) {
                    var height = parseInt(datasInfo[i].split(',')[1]) / yDis * uBarH;
                    height = height > uBarH ? uBarH : height;
                    this.fillStyle = colors[i];
                    this.fillRect(barX + spacing + xDis * i, (barY + uBarH - height), xDis - spacing, height);
                }
                yDis = parseInt(xyAxis[3]) + 5 - llimit;
                for (var i = 0; i < datasInfo.length; i++) {
                    var height = parseInt(datasInfo[i].split(',')[2]) / yDis * dBarH;
                    height = height > dBarH ? dBarH : height;
                    this.fillStyle = ColorUtils.xorColor(colors[i]);
                    this.fillRect(barX + spacing + xDis * i, barY + uBarH, xDis - spacing, height);
                }
            }
            // 绘制横向的bar
            else {

                var uBarW = parseInt(barW * uPercent);
                var dBarW = parseInt(barW * dPercent);

                var yDis = (barH - spacing) / size;
                var xDis = parseInt(xyAxis[1]) + 5 - llimit;
                for (var i = 0; i < datasInfo.length; i++) {
                    var height = parseInt(datasInfo[i].split(',')[1]) / xDis * uBarW;
                    height = height > uBarW ? uBarW : height;
                    this.fillStyle = colors[i];
                    this.fillRect((barX + uBarW - height), (barY + spacing + yDis * i), height, (yDis - spacing));
                }
                xDis = parseInt(xyAxis[3]) + 5 - llimit;
                i = 0;
                for (var i = 0; i < datasInfo.length; i++) {
                    var height = parseInt(datasInfo[i].split(',')[2]) / xDis * dBarW;
                    height = height > dBarW ? dBarW : height;
                    this.fillStyle = ColorUtils.xorColor(colors[i]);
                    this.fillRect((barX + uBarW), (barY + spacing + yDis * i), height, (yDis - spacing));
                }
            }
            break;
        case 2:
            // 绘制竖向bar
            if (direction == 0) {
                var xDis = (barW - spacing) / size;
                yDis = hlimit - llimit;
                for (var i = 0; i < datasInfo.length; i++) {
                    var height = parseInt(datasInfo[i].split(',')[1]);
                    height = height > barH ? barH : height;
                    this.fillStyle = colors[i];
                    this.fillRect(barX + spacing + xDis * i, parseInt(barY + barH - height), xDis - spacing, height);
                    this.fillStyle = ColorUtils.xorColor(colors[i]);
                    this.fillRect(barX + spacing + xDis * i, barY, xDis - spacing, barH - height);
                }
            }
            // 绘制横向bar
            else {
                var yDis = (barH - spacing) / size;
                var xDis = hlimit - llimit;

                for (var i = 0; i < datasInfo.length; i++) {
                    var width = parseInt(datasInfo[i].split(',')[1]);
                    width = width > barW ? barW : width;
                    this.fillStyle = colors[i];
                    this.fillRect(barX, parseInt(barY + spacing + yDis * i), width, yDis - spacing);
                    this.fillStyle = ColorUtils.xorColor(colors[i]);
                    this.fillRect((barX + width), (barY + spacing + yDis * i), barW - width, yDis - spacing);
                }
            }
            break;
        default:
            // 绘制竖向bar
            if (direction == 0) {
                var xDis = (barW - spacing) / size;
                var yDis = hlimit - llimit;
                for (var i = 0; i < datasInfo.length; i++) {
                    var value = datasInfo[i].split(',')[1];
                    var height = value / yDis * barH;
                    height = height > barH ? barH : height;
                    this.fillStyle = colors[i];
                    this.fillRect(barX + spacing + xDis * i, parseInt(barY + barH - height), xDis - spacing,
                        parseInt(height));
                }
            }
            // 绘制横向bar
            else {
                var yDis = (barH - spacing) / size;
                var xDis = hlimit - llimit;
                for (var i = 0; i < datasInfo.length; i++) {
                    var value = datasInfo[i].split(',')[1];
                    var width = value / xDis * barW;
                    width = width > barW ? barW : width;
                    this.fillStyle = colors[i];
                    this.fillRect(barX, parseInt(barY + spacing + yDis * i), width, parseInt(yDis - spacing));
                }
            }
            break;
    }
    this.restore();
}


// 放在openPlant.v里
// ////////////////////////////////////////////////////////
// ////////////////////////////////////////////////////////
// ////////////////////////////////////////////////////////

var _contextmenuFlag = false;
document.oncontextmenu = function (e) {
    return !_contextmenuFlag;
}

String.prototype.trim = function () {
    return this.replace(/(^\s*)|(\s*$)/g, "");
};

String.prototype.replaceAll = function (pattern, str) {
    return this.replace(new RegExp(pattern, "gm"), str);
};

openPlant.v.openPlant_dcsMaskerMap = new openPlant.DCSMaskerMap();

openPlant.v.openplant_maskerMap = openPlant.v.openPlant_dcsMaskerMap.getDCSMaskerMap();

openPlant.v.openplant_rt_data_json = {};
// 跳转时需要清空
openPlant.v.openplant_static_data_json = {};
//历史数据
openPlant.v.openplant_rp_data_json = {};

openPlant.v.openplant_script_propertyChanges = [];
openPlant.v.openplant_script_object;
openPlant.v.openplant_script_activite_graph;


openPlant.Graph = function (_config) {
    var _this = this;
    //加载图形前，时间标记 用于时间修正
    var _loadGraphDataTime = 0;
    //最后一次绘制时间，用于本地刷新时使用
    var _last_paint_time = 0;

    //强制刷新标记，若包含系统开启本地刷新检查
    var _local_repaint_flag = false;
    //本地刷新最小周期
    var _repaint_period = 1000;
    //本地刷新定时任务
    var _repaint_timer;
    var _visibie_cache = {};

    //系统动作主锁
    var _look = false;
    //图形绘制锁
    var _drawing = false;
    // 页面切换锁
    var _changeingPageLook = false;

    //系统最大层模型个数
    var max_zindex = 4;

    // 0-gview|1-replay
    var graphType = 0;
    this.replayerInterval = 1;
    var replayerAction;
    var replayerBegintime;
    var replayerEndtime;
    var minInterval = 0.125;
    var maxInterval = 8;
    var currentTime;

    //当前图路径
    var _current_graph_url;

    //系统屏幕宽高与像素比例
    this.DPR = (window && window.devicePixelRatio) ? window.devicePixelRatio : 1;
    //保存动态数据  动态数据
    var _dynamicDataContainer = new openPlant.DataContainer();
    var _staticDataContainer = new openPlant.DataContainer();
    //创建层次结构对象
    var elementsMap = {};
    var canvasMap = {};
 
    var _pages = new Array();
    var _page_currentIndex = -1;


    //默认宽高
    var _canvas_width = 1024;
    var _canvas_height = 768;
    // 背景布局的大小
    var _background_minsize;
    //默认缩放比例
    var _paint_zoom_x = 1;
    var _paint_zoom_y = 1;

    //服务器时间差
    var _time_deviation = 0;

    //图片资源路径
    var _image_src_pre = "../diagram/imglib/";

    //主容器
    _this._target = null;
    _this._targetDiv = null;
    //工具栏高度
    _this.toolbar_height = 0;


    _this._evtCanvas = null;
    _this._changePage_fun = null;
    _this._element_mouse_click_fun = null;
    _this._element_mouse_down_fun = null;

    /**
     * 绘制 各种元素
     * @param _object
     * @param context
     * @private
     */

    this._draw_element = function (_object, context) {
        context.save();
        context.scale(_paint_zoom_x, _paint_zoom_y);
        var _class = _object['class'];
        var _visibie = _object[openPlant.GraphConst.ELEMENT_PROPERTY_VISIBLE];
        // 超出布局大小的对象不进行绘制
        if (_visibie != undefined && _visibie) {
 	//父结构是否隐藏，若隐藏，对象直接隐藏且加入缓存结构
            if (_object["pref"] != undefined && _visibie_cache[_object["pref"]]) {
                if (_object["ref"] != undefined) {
                    _visibie_cache[_object["ref"]] = _object;
                }
            } else {
            try {
                switch (_class) {
                    case openPlant.GraphConst.TYPE_GROUP: {
                        // group
                        // 强制绘制透明层，用于覆盖其对象元素之下
                        _object[openPlant.GraphConst.SHAPE_PROPERTY_FILL] = {
                            type: 0,
                           bg: '#FFFFFF',
                           fg: '#FFFFFF'
                        }
                        _object[openPlant.GraphConst.SHAPE_PROPERTY_STROKE] = {
                            width: 0, style: 0, color: "#000000"
                        }
                        openPlant.GraphElement.parseRect(context, _object);
                        break;
                    }
                    case openPlant.GraphConst.TYPE_RECTANGLE: {
                        // rect
                        openPlant.GraphElement.parseRect(context, _object);
                        break;
                    }
                    case openPlant.GraphConst.TYPE_ELLIPSE: {
                        // ellipse
                        openPlant.GraphElement.parseEllipse(context, _object);
                        break;
                    }
                    case openPlant.GraphConst.TYPE_POLYLINE: {
                        // POLYLINE
                        openPlant.GraphElement.parsePolyline(context, _object);
                        break;
                    }
                    case openPlant.GraphConst.TYPE_POLYGON: {
                        // POLYGON
                        openPlant.GraphElement.parsePolygon(context, _object);
                        break;
                    }
                    case openPlant.GraphConst.TYPE_ARC: {
                        // arc
                        openPlant.GraphElement.parseArc(context, _object);
                        break;
                    }
                    case openPlant.GraphConst.TYPE_BUTTON: {
                        // button
                        openPlant.GraphElement.parseButton(context, _object, _paint_zoom_x, _paint_zoom_y);
                        break;
                    }
                    case openPlant.GraphConst.TYPE_TEXT: {
                        // TEXT
                        openPlant.GraphElement.parseText(context, _object, 0, _paint_zoom_x, _paint_zoom_y);
                        break;
                    }
                    case openPlant.GraphConst.TYPE_DASPOINT: {
                        // TEXT
                        openPlant.GraphElement.parseDaspoint(context, _object, _paint_zoom_x, _paint_zoom_y,
                            openPlant.v.openplant_rt_data_json, openPlant.v.openplant_static_data_json);
                        break;
                    }
                    case openPlant.GraphConst.TYPE_CALCPOINT: {
                        // 计算点调用 TEXT
                        openPlant.GraphElement.parseCalcPoint(context, _object, _paint_zoom_x, _paint_zoom_y,
                            openPlant.v.openplant_rt_data_json, openPlant.v.openplant_static_data_json);
                        break;
                    }
                    case openPlant.GraphConst.TYPE_TIME: {
                        if (_local_repaint_flag == false) {
                            _local_repaint_flag = true;
                        }
                        openPlant.GraphElement.parseTime(context, _object, _paint_zoom_x, _paint_zoom_y, _time_deviation);
                        break;
                    }
                    case openPlant.GraphConst.TYPE_BAR: {
                        openPlant.GraphElement.parseBar(context, _object, openPlant.v.openplant_rt_data_json,
                            openPlant.v.openplant_static_data_json);
                        break;
                    }
                    case openPlant.GraphConst.TYPE_IMAGE: {
                        break;
                    }
                    case openPlant.GraphConst.TYPE_TREND: {

                        // if (openPlant.GraphElement.parseTrend) {
                            //     openPlant.GraphElement.parseTrend(context, _object,
                            //         _object[openPlant.GraphConst.TREND_PRIPERTY_OPTREND], _repaint_period,
                            //         openPlant.v.openplant_rt_data_json, openPlant.v.openplant_static_data_json);
                            // }
                            break;
                    }
                    case openPlant.GraphConst.TYPE_DASHBOARD: {
                      // openPlant.GraphElement.parseDashChart(context, _object,
                            //     _object[openPlant.GraphConst.DASHBOARD_PROPERTY_OBJECT], openPlant.v.openplant_rt_data_json);
                            break;
                    }
                    case openPlant.GraphConst.TYPE_CHART_PIE: {
                      // openPlant.GraphElement.parsePiechart(context, _object,
                            //     _object[openPlant.GraphConst.PIECHART_PROPERTY_OBJECT], openPlant.v.openplant_rt_data_json);
                            break;
                    }

                    case openPlant.GraphConst.TYPE_CHART_BAR: {
                      // openPlant.GraphElement.parseBarchart(context, _object,
                            //     _object[openPlant.GraphConst.BARCHART_PROPERTY_OBJECT], openPlant.v.openplant_rt_data_json);
                            break;
                    }
                    case openPlant.GraphConst.TYPE_GRID: {
                        openPlant.GraphElement.parseGrid(context, _object)
                        break;
                    }
                }
            } catch (e) {
                log(_object)
                log(e)
            }
	    }
	    } else {
            if (_object["ref"] != undefined) {
                _visibie_cache[_object["ref"]] = _object;
            }
        }
        context.translate(0.5, 0.5);
        context.restore();
    }

    /**
     *  判断传过来的 对象是否是静态数据
     * @param _object
     * @returns {boolean}
     */
    this.isStaticObject = function (_object) {
        if (openPlant.GraphUtils.isContain(_object["class"], openPlant.GraphConst.DEFAULT_DYNAMIC_OBJECT)) {
            return false;
        } else if (_object[openPlant.GraphConst.ELEMENT_PROPERTY_REFRESH_SCRIPT]
            || _object[openPlant.GraphConst.ELEMENT_PROPERTY_MOUSEEVENT_SCRIPT]) {
            return false;
        }
        return true;
    }

    this._transformBounds = function (_bounds) {
        var x = _bounds.x * _paint_zoom_x;
        var y = _bounds.y * _paint_zoom_y;
        var w = _bounds.w * _paint_zoom_x;
        var h = _bounds.h * _paint_zoom_y;

        return {x: x, y: y, w: w, h: h}
    }
    function _initRefreshFunction(_object) {
        var _script_fun = _object[openPlant.GraphConst.ELEMENT_PROPERTY_REFRESH_SCRIPT];
        if (_script_fun) {
            var test = _script_fun.toString().trim();
            test = test.replaceAll("\\\\n", "");
            test = test.replaceAll("\\\\r", "");
            try {
                var f = new Function(test)
                _object[openPlant.GraphConst.ELEMENT_PROPERTY_REFRESH_SCRIPT] = f;
            } catch (e) {
                log("Script exception:" + f);
            }
        }
    }

    function _initCanvasEL(zIndex) {
        if (_this._target && _this._targetDiv) {
            if ($("#canvas_" + zIndex).size() == 0) {
                var _canvas = $("<canvas id='canvas_" + zIndex + "' height=" + _this._targetDiv.height() + " width=" + _this._targetDiv.width() + "  />").css({
                    "position": "absolute",
                    "z-index": zIndex
                }).appendTo(_this._targetDiv)[0];

                _this._evtCanvas = _canvas;
                var _context = _canvas.getContext("2d");
                canvasMap[zIndex] = _context;
                elementsMap[zIndex] = new openPlant.DataContainer();
            }
        }
    }

    /**
     * 判断传递过来的对象 所属的层次，如果elementMap 有这个层次则加入，如果没有则创建后加入
     * @param _object
     */
    this._initController = function (_object) {
        _object[openPlant.GraphConst.ELEMENT_PROPERTY_VISIBLE] = true;
        //初始化刷新脚本
        // 获取当前图元的层次
        var zIndex = _object[openPlant.GraphConst.ELEMENT_PROPERTY_Z_INDEX];

        _initRefreshFunction(_object);
        if (zIndex % 2 == 0) {
            _dynamicDataContainer.addElement(_object);
        } else {
            var _mouse_script = _object[openPlant.GraphConst.ELEMENT_PROPERTY_MOUSEEVENT_SCRIPT];
            if (_mouse_script) {
                _dynamicDataContainer.addElement(_object);
            }
            _staticDataContainer.addElement(_object);
        }

        //超过最大层图像时，处理图层结构
        if (zIndex > max_zindex) {
            zIndex = max_zindex;
            // console.log("元素分层模型已超过最大设置");
        }

        if (_object["class"] == openPlant.GraphConst.TYPE_IMAGE && _object[openPlant.GraphConst.IMAGE_PROPERTY_URL]) {
            var url = _object[openPlant.GraphConst.IMAGE_PROPERTY_URL].toString();
            //检查是否已创建对应的图片层
            if (_this._target && _this._targetDiv) {
                var _div = document.getElementById("DIV_" + zIndex);
                if (_div == null) {
                    _div = "<div id='DIV_" + zIndex + "' class='imgDiv'  style='position:absolute; z-index:" + zIndex + ";height:" + _this._targetDiv.height() + "px; width:" + _this._targetDiv.width() + "px;'></div>";
                    $(_div).appendTo(_this._targetDiv)
                }
                var _boundsTemp = _object[openPlant.GraphConst.ELEMENT_PROPERTY_BOUNDS];
                var _bounds = _this._transformBounds(_boundsTemp);
                //变形参数处理
                var _img = "<img class='imgView' id='' src='" + _image_src_pre + url + "' x='" + _boundsTemp.x + "' y='" + _boundsTemp.y + "' w='" + _boundsTemp.w + "' h='" + _boundsTemp.h + "' style='position:absolute; z-index:" + zIndex + ";margin-top:" + _bounds.y + "px;margin-left: " + _bounds.x + "px;width: " + _bounds.w + "px;height: " + _bounds.h + "px'/>";
                $(_img).appendTo($("#DIV_" + zIndex))
            }
        }


        // 获取map中的对应的层次图元集合
        var currentContainer = elementsMap[zIndex];
        // 如果当前图元层次集合不为空，则将当前图元加入到集合中去
        if (currentContainer) {
            currentContainer.addElement(_object);
        } else {
            // 如果当前图元层次不存在，则新创建一个图元集合
            _initCanvasEL(zIndex);
            currentContainer = new openPlant.DataContainer();
            currentContainer.addElement(_object);
            elementsMap[zIndex] = currentContainer;

        }
    }


    this._loadGraphData = function (_current_graph_url) {
        if (!_look) {
 console.log("loadDiagram " + _current_graph_url);
            _look = true;
            _loadGraphDataTime = new Date().getTime();
            
            console.time("loadDiagram");
            if (graphType) {
                //回放
                socket.emit('loadReplayerDiagram', {filePath: _current_graph_url, beginTime: replayerBegintime, endTime: replayerEndtime});
            } else {
                //实时
		                socket.emit('loadDiagram', {filePath: _current_graph_url});
				}
        }
    }
    function clearData() {
        _staticDataContainer.clear();
        _dynamicDataContainer.clear();
        elementsMap = {};
        canvasMap = {};
    }

    /**
     * 初始化数据
     * @private
     */
    // first init
    this._parseGraphData = function (_graphData) {
        if (_graphData) {
            clearData();
            _staticDataContainer.setFileName(_current_graph_url)
            if (_graphData.BackGround && _graphData.Elements) {
                if (_graphData.systemTime) {
                   _time_deviation = _loadGraphDataTime - _graphData.systemTime;
                }
                var background = _graphData.BackGround;
                _staticDataContainer.setBackground(background);
                _background_minsize = background[openPlant.GraphConst.CURRENTSIZE];
                var _gelements = _graphData.Elements;
                _initZoom();
                //默认创建一层
                _initCanvasEL(1);
                if (_gelements && _gelements.length > 0) {
                    _gelements.forEach(function (_gelement,index) {
                        _this._initController(_gelement);
                    });
                }
                _this._repaint_graph();
            } else {
                if (_page_currentIndex > 0) {
                    //游标处理
                    _page_currentIndex--;
                    var _url = _pages[_page_currentIndex];
                    //解锁
                    _look = false;
                    _current_graph_url = _url;
                   
                    _pages.splice(_page_currentIndex + 1, (_pages.length - _page_currentIndex));
                   
                    _this._loadGraphData(_current_graph_url);
                    alert("您访问的页面不存在！！！")
                }

            }
        }
    }

    function _initZoom() {
        if (_background_minsize) {
            _paint_zoom_x = _canvas_width / _background_minsize.w;
            _paint_zoom_y = _canvas_height / _background_minsize.h;
        }
    }

    /**
     * 清除脚本
     * @private
     */
    this._clear_dirty_script_propertychanges = function () {
        var _pcs = openPlant.v.openplant_script_propertyChanges;
        for (var i = 0; i < _pcs.length; i++) {
            var _spc = _pcs[i];
            var _o = _spc[0];
            var _n = _spc[1];
            var _v = _spc[2];
            _o[_n] = _v;
        }
    }


    /**
     * 重绘全部元素
     * @private
     */
    this._repaint_graph = function () {
        if (_canvas_height == 0) {
            return;
        }
        // 不处于加载解析阶段时，执行重绘
        if (!_drawing) {
            _drawing = true;
            try {
		_visibie_cache = {};
                if (elementsMap) {
                    for (var key in elementsMap) {
                        var dataContainer = elementsMap[key];
                        var contextTemp = canvasMap[key];
                        contextTemp.clearRect(0, 0, _canvas_width, _canvas_height);
                        //第一层是，绘制背景在第一层上
                        if (key == 1) {
                            openPlant.GraphElement.drawBackground(contextTemp, _image_src_pre, _staticDataContainer.getBackground());
                        }
                        dataContainer.foreach(function (_object,index) {
_object[openPlant.GraphConst.ELEMENT_PROPERTY_VISIBLE] = true;
                            var _script_fun = _object[openPlant.GraphConst.ELEMENT_PROPERTY_REFRESH_SCRIPT];
                            if (_script_fun) {
                                openPlant.v.openplant_script_object = _object;
                                try {
                                    _script_fun();
                                } catch (e) {
                                    log(e)
                                    log("Script exception:" + _script_fun);
                                }
                            }
                            _this._draw_element(_object, contextTemp);
                        });
                    }
                }
            } catch (e) {
                log("Draw exception " + e);
            }

            _last_paint_time = new Date().getTime();
            _drawing = false;
        }
    }

    /**
     * 绘制 动态的对象信息
     * @private
     */
    this._repaint_dynamic_graph = function () {
        var start = new Date().getTime();
        if (_canvas_height == 0) {
            return;
        }
        // 不处于加载解析阶段时，执行重绘
        if (_drawing != undefined && !_drawing) {
            _drawing = true;
            _this._clear_dirty_script_propertychanges();
            openPlant.v.openplant_script_propertyChanges.length = 0;
            
            try {
		_visibie_cache = {};
                if (elementsMap) {
                    for (var key in elementsMap) {
                        if ((key % 2 == 0) || key == max_zindex) {
                            var dataContainer = elementsMap[key];
                            var contextTemp = canvasMap[key];
                            contextTemp.clearRect(0, 0, _canvas_width, _canvas_height);
                            if (key == 1) {
                                openPlant.GraphElement.drawBackground(contextTemp, _image_src_pre, _staticDataContainer.getBackground());
                            }
                            dataContainer.foreach(function (_object) {
				_object[openPlant.GraphConst.ELEMENT_PROPERTY_VISIBLE] = true;
                                var _script_fun = _object[openPlant.GraphConst.ELEMENT_PROPERTY_REFRESH_SCRIPT];
                                if (_script_fun) {
                                    openPlant.v.openplant_script_object = _object;
                                    try {
                                        _script_fun();
                                    } catch (e) {
                                        log(e)
                                        log("Script exception:" + _script_fun);
                                    }
                                }
                                _this._draw_element(_object, contextTemp);
                            });
                        }
                    }
                }
            } catch (e) {
                log("Draw exception:" + e.message);
            }
            _last_paint_time = new Date().getTime();
            _drawing = false;
        }

        var end = new Date().getTime();


        $("#paint").val(end - start)

    }


    function _targetResize() {
        _look = true;
        console.time("_targetResize");
        _canvas_width = _this._targetDiv.width();
        _canvas_height = _this._targetDiv.height();
        _initZoom();
        var _canvasList = $("canvas");
        _canvasList.width(_canvas_width);
        _canvasList.height(_canvas_height);
        _canvasList.each(function () {
            var key = parseInt($(this).css("z-index"));
            var contextTemp = canvasMap[key];
            if (contextTemp) {
                //设置画布大小，浏览器默认会清空内容
                contextTemp.clearRect(0, 0, this.width, this.height);
                this.width = _canvas_width;
                this.height = _canvas_height;
                //创建新画布
                contextTemp = this.getContext("2d");
                canvasMap[key] = contextTemp;
            }
        });
        $(".imgDiv").width(_canvas_width);
        $(".imgDiv").height(_canvas_height);
        $(".imgDiv .imgView").each(function () {
            var img = $(this);
            var x = img.attr("x");
            var y = img.attr("y");
            var w = img.attr("w");
            var h = img.attr("h");
            var _bounds = _this._transformBounds({x: x, y: y, w: w, h: h});
            img.css({
                'margin-left': _bounds.x,
                'margin-top': _bounds.y,
                height: _bounds.h + "px",
                width: _bounds.w + "px"
            });
        });
        _this._repaint_graph();
        _look = false;
        console.timeEnd("_targetResize");
    }

    /**
     * 初始化信息
     * @private
     */
    this._init = function () {
        if (_config['target']) {
            //获取目标路径
            _this._target = _config['target'];
            //获取DIV
            _this._targetDiv = $("#" + _this._target);
            //添加大小变化监听
            _this._targetDiv.resize(_targetResize);
            _canvas_width = _this._targetDiv.width();
            _canvas_height = _this._targetDiv.height();
            _this.toolbar_height = 0;
            if (!$("#toolbar").is(":hidden")) {
                _this.toolbar_height = ($("#toolbar").height());
            }

        }
        _current_graph_url = _config['name'];


        if (!_current_graph_url) {
            log('fileName is missing .');
            return;
        }
        var _image_pre = _config['imageSrcPrefix'];
        if (_image_pre) {
            _image_src_pre = _image_pre;
        }


        //设置模式


        replayerBegintime = _config['beginTime'];
        replayerEndtime = _config['endTime'];
        if (replayerBegintime && replayerEndtime) {
            replayerBegintime = Date.parse(replayerBegintime.replace(/-/g, "/"));
            replayerEndtime = Date.parse(replayerEndtime.replace(/-/g, "/"));
            graphType = 1;
            currentTime = replayerBegintime;
        } else {
            replayerBegintime = null;
            replayerEndtime = null;
            graphType = 0;
        }

        this.addPage(_current_graph_url);
        socket.on("diagramCB", function (diagramData) {
            openPlant.v.openplant_static_data_json = diagramData["staticData"];
            openPlant.v.openplant_rt_data_json = {};
            console.timeEnd("loadDiagram");
            _local_repaint_flag = false;
            _last_paint_time = 0;
            clearInterval(_repaint_timer)
            _this._evtCanvas = null;
            _this._parseGraphData(diagramData);
            if (_this._evtCanvas && !isMobile.any()) {
                _this._evtCanvas.addEventListener('click', function (evt) {
                    var xy = _this.getEvtXY(evt);
                    var _x = xy.x, _y = xy.y;
                    _this._mouse_click(_x, _y);
                }, false);
            }
            _look = false;
        });
        socket.on("DataChange", function (changeList) {
            //合并数据
            if (Object.getOwnPropertyNames(changeList).length > 0) {
                for (var key in changeList) {
                    openPlant.v.openplant_rt_data_json[key] = changeList[key];
                }
            }
            if (!_look) {
                _this._repaint_dynamic_graph();
            }
            // _local_repaint_flag = true;
            if (_local_repaint_flag) {
                _repaint_timer = setInterval(function () {
                    if (!_look) {
                        if (new Date().getTime() - _last_paint_time >= 500) {
                            // var temp;
                            // for (var key in openPlant.v.openplant_rt_data_json) {
                            //     temp = openPlant.v.openplant_rt_data_json[key];
                            //     temp.AS = 0;
                            //     temp.AV = Math.random() * 100;
                            //     openPlant.v.openplant_rt_data_json[key] = temp;
                            // }
                            _this._repaint_dynamic_graph();
                        }
                    }
                }, _repaint_period)
            }
        });
        socket.on("setValueCB", function (data) {
            if (data.msg) {
                alert(data.msg);
            }
        })

        socket.on("loadPointCB", function (data) {
            var pointData = data.pointData;
            if (pointData) {
                var rt = pointData.RT;
                var gn = pointData.GN;
                var av = pointData.AV;
                switch (rt) {
                    case 0:
                        //AX
                        if (showCTRL_Value) {
                            showCTRL_Value(gn, av);
                        }
                        break;
                    case 1:
                        //DX
                        if (showCTRL_DX) {
                            showCTRL_DX(gn, (av == 1 ? true : false));
                        }
                        break;
                    case 2:
                        //I2
                        if (showCTRL_Value) {
                            showCTRL_Value(gn, av);
                        }
                        break;
                    case 3:
                        //I4
                        if (showCTRL_Value) {
                            showCTRL_Value(gn, av);
                        }
                        break;
                    case 4:
                        //R8
                        if (showCTRL_Value) {
                            showCTRL_Value(gn, av);
                        }
                        break;

                }
            }
        })
        socket.on("replayerData", function (data) {
            openPlant.v.openplant_static_data_json = data["staticData"];
            openPlant.v.openplant_rt_data_json = {};
            _local_repaint_flag = false;
            _last_paint_time = 0;
            clearInterval(_repaint_timer)
            _this._evtCanvas = null;
            _this._parseGraphData(data);
            if (_this._evtCanvas && !isMobile.any()) {
                _this._evtCanvas.addEventListener('click', function (evt) {
                    var xy = _this.getEvtXY(evt);
                    var _x = xy.x, _y = xy.y;
                    _this._mouse_click(_x, _y);
                }, false);
            }
            _look = false;

            var replayerData = data['replayerData'];
            //获取历史数据执行插值算法
            _this.pretreatmentData(replayerData);
            _this.startPlay();
        });
        this._loadGraphData(_current_graph_url);
        if (_this._target && _this._targetDiv) {
            function touchChangePage(e) {
                endTime = new Date().getTime();
                clearTimeout(touchChange);
                //延迟执行
                touchChange = setTimeout(function () {
                    //超过50ms 认为有效
                    if (endTime - startTime < 50) return;
                    if (windowZoom() == 1) {
                        var touch = e.touches[0];
                        var x = touch.clientX;
                        var y = touch.clientY;
                        if (startXY) {
                            x -= startXY.x;
                            y -= startXY.y;
                            var _x = Math.abs(x);
                            var _y = Math.abs(y);
                            var distance = Math.sqrt(_x * _x + _y * _y);
                            //移动距离超过200PX 才进行计算方向
                            if (distance > 200) {
                                var direction;
                                if (_y > _x) {
                                    if (y > 0) {
                                        // alert("down");
                                        _this.mainPage();
                                    } else {
                                        // alert("up");
                                        _this.mainPage();
                                    }
                                } else {
                                    if (x < 0) {
                                        // alert("left");
                                        _this.previousPage();
                                    } else {
                                        // alert( "right");
                                        _this.nextPage();
                                    }
                                }
                            }
                        }
                    }
                }, 100);
            }

            var touchClickEvent;

            function touchClick(e) {
                clearTimeout(touchClickEvent);
                //延迟执行
                touchClickEvent = setTimeout(function () {
                    if ((endTime - startTime) == 0) {
                        var x = startXY.x;
                        var y = startXY.y;
                        y -= _this.toolbar_height;
                        _this._mouse_click(x, y);
                    }
                }, 200);
            }

            if (isMobile.any()) {
                var touchChange = null;
                var div = document.getElementById(_this._target);
                var startXY;
                var startTime;
                var endTime;
                div.ontouchstart = function (e) {
                    startTime = new Date().getTime();
                    if (e.touches.length == 1) {
                        var touch = e.touches[0];
                        var x = touch.clientX;
                        var y = touch.clientY;
                        startXY = {x: x, y: y};
                        touchClick();
                        endTime = startTime;
                    } else {
                        //清理缓存
                        startXY = null;
                        endTime = startTime;
                    }
                };
                div.ontouchmove = function (e) {
                    if (e.touches.length == 1) {
                        touchChangePage(e);
                    } else {
                        //取消监视动作
                        startXY = null;
                        clearTimeout(touchChange);
                    }
                };
            }

            var windowResizeCB = 0;
            $(window).resize(function () {
                clearTimeout(windowResizeCB);
                windowResizeCB = setTimeout(function () {
                    window_w = $(window).width() * this.DPR;
                    window_h = ($(window).height() - 3 ) * this.DPR;
                    $("#toolbar").css({height: toolbar_height + "px", width: window_w});
                    _this._targetDiv.css({height: window_h - this.toolbar_height + "px", width: window_w + "px"});
                }, 300);
            });
        }

    };

    //获取历史数据，执行插值算法
    this.pretreatmentData = function (data) {
        var pd = {};
        for (var i in data) {
            if (data.hasOwnProperty(key) === true) {
                var v = data[i];
                var pt = pd[v.GN];
                if (!pt) {
                    pt = [];
                }
                pt.push(v);
            }
        }
        var values = [];
        for (var t in pt) {
            var vl = pt[t];
            var size = vl.length;
            if (size < 1) {
                continue;
            }
            var rt = openPlant.v.openplant_static_data_json[vl[0].GN];
            switch (rt) {
                case 1:
                case 2:
                case 3:
                    var array = this.prepareComplementeData(rt);
                    values.push(array);
                    break;
                default:
                    var array = this.prepareLinearData(rt);
                    values.push(array);
                    break;
            }
        }
        var rp_data = {};
        for (var i in values) {
            var oo = values[i];
            for (var j in oo) {
                var o = oo[j];
                var obj = rp_data[o.TM];
                if (!obj) {
                    obj = {};
                }
                obj[o.GN] = o;
                rp_data[o.TM] = obj;
            }
        }
        openPlant.v.openplant_rp_data_json = rp_data;
    };
    //AX ，R8 插值算法
    this.prepareLinearData = function (data) {
        var arr = [];
        var size = data.length;
        for (var i = 0; i < size; i++) {
            if (data[size + 1]) {
                var vl = this.complementLinerData(data[size], data[size + 1]);
                arr = arr.concat(arr, vl);
            }
        }
        return arr;
    };
    //DX ，I2，I4 插值算法
    this.prepareComplementeData = function (data) {
        var arr = [];
        var size = data.length;
        for (var i = 0; i < size; i++) {
            if (data[size + 1]) {
                var vl = this.complementPreData(data[size], data[size + 1]);
                arr = arr.concat(arr, vl);
            }
        }
        return arr;
    };
    this.complementLinerData = function (value1, value2) {
        var arr = [];
        var tm1 = value1.TM;
        var tm2 = value2.TM;
        if (tm2 - tm1 == 1) {
            arr.push(value1);
        } else if (tm2 - tm1 > 4000) {
            //两个值时间间隔大于4000秒中间数据置为超时
            arr.push(value1)
            for (var i = tm1 + 1; i < tm2; i++) {
                value1.DS = -32768;
                value1.TM = i;
                arr.push(value1);
            }
        } else {
            var ds1 = this.getTimeout(value1.DS);
            //如果上一个数据超时，则将插入的数据置为超时
            if (ds1) {
                for (var i = tm1; i < tm2; i++) {
                    value1.TM = i;
                    arr.push(value1);
                }
            } else {
                var av1 = value1.AV, av2 = value2.AV;
                var a = (av2 - av1) / (tm2 - tm1);
                var b = av1 - k * tm1;
                for (var i = tm1; i < tm2; i++) {
                    value1.AV = a * i + b;
                    value1.TM = i;
                    arr.push(arr);
                }
            }
        }
        return arr;
    };
    this.complementPreData = function (value1, value2) {
        var arr = [];
        var tm1 = value1.TM;
        var tm2 = value2.TM;
        if (tm2 - tm1 == 1) {
            arr.push(value1);
        } else if (tm2 - tm1 > 4000) {
            //两个值时间间隔大于4000秒中间数据置为超时
            arr.push(value1)
            for (var i = tm1 + 1; i < tm2; i++) {
                value1.DS = -32768;
                value1.TM = i;
                arr.push(value1);
            }
        } else {
            var ds1 = this.getTimeout(value1.DS);
            //如果上一个数据超时，则将插入的数据置为超时
            if (ds1) {
                for (var i = tm1; i < tm2; i++) {
                    value1.TM = i;
                    arr.push(value1);
                }
            } else {
                for (var i = tm1; i < tm2; i++) {
                    value1.TM = i;
                    arr.push(arr);
                }
            }
        }
        return arr;
    }

    /**
     * 获取是否超时的状态
     * @param ds
     * @returns {boolean}
     */
    this.getTimeout = function (ds) {
        var status = parseInt(ds);
        if (status != undefined && status != null) {
            status = status & 0x0FFFF;
            // 第15位为1或者第14位为1，表示超时。
            if (((status & 0x8000) == 0x8000) || (status & 0x4020) == 0x4020 || status < 0) {
                return true;
            }
        }
        return false;
    };
    this.changeReplayerTime = function (beginTime, endTime) {
        openPlant.v.openplant_static_data_json = {};
        openPlant.v.openplant_rp_data_json = {};
        _config['beginTime'] = beginTime;
        _config['endTime'] = endTime;
        var from = Date.parse(beginTime.replace(/-/g, "/")) / 1000;
        var to = Date.parse(endTime.replace(/-/g, "/")) / 1000;
        replayerBegintime = from
        replayerEndtime = to;
        currentTime = replayerBegintime;
        _this.pausePlay();
        this._loadGraphData(_current_graph_url);

    };
    this.getEvtXY = function (evt) {
        var explorer = openPlant.GraphConst.EXPLORER;
        var _x, _y;

        // IE11不进行任何修正
        if (explorer.indexOf("Trident/7.0") >= 0
            && (explorer.indexOf("rv:11.0") >= 0 || explorer.indexOf("rv 11.0") >= 0)) {
            _x = evt.clientX;
            _y = evt.clientY;
        } else if (explorer && explorer.indexOf("Safari") >= 0 || explorer.indexOf("Chrome") >= 0 || explorer.indexOf("Firefox") >= 0) {
            _x = evt.clientX;
            _y = evt.clientY;
        } else {
            _x = evt.layerX;
            _y = evt.layerY;
        }
        if (_this._target && _this._targetDiv) {
            _x -= _this._targetDiv.offset().left;
            _y -= _this._targetDiv.offset().top;
        }
        return {
            x: _x,
            y: _y
        }
    }

    this._mouse_down = function (_x, _y) {
        if (this._element_mouse_down_fun) {
            _x = _x / _paint_zoom_x;
            _y = _y / _paint_zoom_y;
            var _select_object = openPlant.GraphUtils.getSelectedElements(_dynamicDataContainer, _x, _y, _canvas_width,
                _canvas_height);
            // mouse event
            var _l = _select_object.length;

            // 优先处理组合对象事件活动
            var _points = [];
            var _mouse_scriptBuff = null
            for (var _i = _l - 1; _i >= 0; _i--) {
                var _s_o = _select_object[_i];
                var _mouse_script = _s_o[openPlant.GraphConst.ELEMENT_PROPERTY_MOUSEEVENT_SCRIPT];
                if (_mouse_script) {
                    // 解析脚本中包含的测点
                    _points = openPlant.GraphUtils.getDCSNameFromScript(_mouse_script, _points)
                }
            }
            if (_points.length > 0) {
                _contextmenuFlag = true;
                _points = _points.unique();
                this._element_mouse_down_fun(_select_object, _points);
            }
        }
    }

    this.setChangePageListener = function (_fun) {
        this._changePage_fun = _fun;
    }
    this._mouse_click = function (_x, _y) {
        var tempXY;
        _x = _x / _paint_zoom_x;
        _y = _y / _paint_zoom_y;
        var _select_object = openPlant.GraphUtils.getSelectedElements(_dynamicDataContainer, _x, _y);
        // mouse event
        var _l = _select_object.length;
        // 优先处理组合对象事件活动
        var _mouse_scriptBuff = null
        for (var _i = _l - 1; _i >= 0; _i--) {
            var _s_o = _select_object[_i];
            var _mouse_script = _s_o[openPlant.GraphConst.ELEMENT_PROPERTY_MOUSEEVENT_SCRIPT];
            if (_mouse_script == undefined) {
                break;
            }
            _mouse_script = _mouse_script.toString().trim();
            _mouse_script = _mouse_script.replaceAll("\\\\n", "");
            _mouse_script = _mouse_script.replaceAll("\\\\r", "");
            var ref = _s_o["ref"];
            var pref = _s_o["pref"];
            if (_mouse_script) {
                // 若检查为组内对象，检查是否已存入缓冲
                // 缓存中没有，加入缓冲，不执行代码
                if (pref && _mouse_scriptBuff == null) {
                    _mouse_scriptBuff = [pref, _mouse_script]
                } else {
                    _mouse_scriptBuff = null;
                    // 加入事件处理队列
                    var _mf = null;
                    if (_mouse_script instanceof Function) {
                        _mf = _mouse_script;
                    } else {
                        _mf = new Function(_mouse_script);
                    }
                    openPlant.v.openplant_script_activite_graph = _this;
                    _mf();
                    return;
                }
            }
            // 组对象事件检查
            var _class = _s_o['class'];
            switch (_class) {
                case openPlant.GraphConst.TYPE_GROUP: {
                    // 组内没有事件，设置当前触发事件为组内最上层有事件的对象事件进行触发
                    if (_mouse_scriptBuff && ref && ref == _mouse_scriptBuff[0]) {
                        _mouse_script = _mouse_scriptBuff[1];
                    }
                    if (_mouse_script) {
                        // 加入事件处理队列
                        var _mf = null;
                        if (_mouse_script instanceof Function) {
                            _mf = _mouse_script;
                        } else {
                            _mf = new Function(_mouse_script);
                        }
                        openPlant.v.openplant_script_activite_graph = _this;
                        _mf();
                        return;
                    }
                }
            }
        }

        if (this._element_mouse_click_fun) {
            this._element_mouse_click_fun(_select_object);
        }
    }

    this.setElementMouseClickListener = function (_fun) {
        this._element_mouse_click_fun = _fun;
    }
    this.setChangeReplayerUI = function (_fun) {
        this.changeReplayerUI = _fun;
    }
    this._changePage = function (_url) {
        if (this._changePage_fun) {
            this._changePage_fun(_url);
        }
        if (!_look && !_changeingPageLook && _url && (_url != _current_graph_url)) {
            _changeingPageLook = true;
            openPlant.v.openplant_static_data_json = null;
            _mouse_script_changepage_url = _url;
            try {
                // need change page
                if (_mouse_script_changepage_url) {
                    _current_graph_url = _mouse_script_changepage_url;
                    if (_this._target && _this._targetDiv) {
                        $("#" + _this._target + " canvas[id!='canvas_evt']").remove();
                        $("#" + _this._target + " div").remove();
                    }
                    // 页面切换了
                    _this._loadGraphData(_current_graph_url);
                }
            } catch (e) {
                log(e)
            }
            _changeingPageLook = false;
        } else {
            return;
        }
    }
    this._script_changepage = function (_url) {
        if (_url && _mouse_script_changepage_url != _url) {
            this.addPage(_url);
            this._changePage(_url);
        }
    }

    this.addPage = function (_url) {
        if (_pages[_page_currentIndex] != _url) {
            _pages.push(_url);
            _page_currentIndex++;
        }
    }

    this.previousPage = function () {
        if (_page_currentIndex > 0) {
            _page_currentIndex--;
            var _url = _pages[_page_currentIndex];
            this._changePage(_url);
        }
    }

//主页
    this.mainPage = function () {
        var _url = _pages[0];
        _page_currentIndex = 0;
        this._changePage(_url);
    }
//下一页
    this.nextPage = function () {
        if (_page_currentIndex < (_pages.length - 1)) {
            _page_currentIndex++;
            var _url = _pages[_page_currentIndex];
            this._changePage(_url);
        }
    }

    this.toString = function () {
        return 'openPlant.graph';
    }
    this.changeReplayerUI = function () {
    };
    this.replayerFunction = function () {
        if (currentTime <= replayerEndtime) {
            if (_this.changeReplayerUI) {
                _this.changeReplayerUI(_config['beginTime'], _config['endTime'], currentTime - replayerBegintime, null);
            }
            openplant_time_data_json = (currentTime * 1000);
            _this.set_replay_current_time(currentTime);
            currentTime = currentTime + 1;
        } else {
            // 开始结束时间开始变换，加载后一页的数据结果
            _config['beginTime'] = _config['historyTo'];
            _config['endTime'] = openPlant.GraphUtils.dateformat(new Date(replayerEndtime - replayerBegintime + replayerEndtime), "yyyy-MM-dd hh:mm:ss");
            replayerBegintime = replayerEndtime;
            replayerEndtime = replayerEndtime - replayerBegintime + replayerEndtime
            if (_this.changeReplayerUI) {
                _this.changeReplayerUI(_config['beginTime'], _config['endTime'], 0, replayerEndtime - replayerBegintime);
            }
            _this._loadGraphData(_current_graph_url);
        }
    }
    /**
     * 开始播放
     */
    this.startPlay = function () {
        clearInterval(replayerAction);
        replayerAction = setInterval(_this.replayerFunction, _this.replayerInterval * 1000);
    }
    /**
     * 暂停播放
     */
    this.pausePlay = function () {
        if (replayerAction) {
            clearInterval(replayerAction);
            replayerAction = null;
        }
    }
    /**
     * 快速播放
     */
    this.fastReplay = function () {
        if (graphType) {
            _this.replayerInterval = _this.replayerInterval / 2;
            if (_this.replayerInterval < minInterval) {
                _this.replayerInterval = minInterval;
            }
            if (replayerAction) {
                this.pausePlay();
                this.startPlay();
            }
        }
    }
    /**
     * 慢速播放
     */

    this.slowReplay = function () {
        if (graphType) {
            _this.replayerInterval = _this.replayerInterval * 2;
            if (_this.replayerInterval > maxInterval) {
                _this.replayerInterval = maxInterval;
            }
            if (replayerAction) {
                this.pausePlay();
                this.startPlay();
            }
        }
    }
    /**
     * 设定播放时间
     * @param _ct
     */
    this.set_replay_current_time = function (_ct) {
        if (graphType) {
            _ct = parseInt(_ct);
            if (this.historySnaps) {
                this._current_time = _ct;
                openPlant.v.openplant_rt_data_json = this.historySnaps['' + _ct];
                this._repaint_dynamic_graph();
                openPlant.v.openplant_rt_data_json = null;
            }
        }
    }
    /**
     * 设定播放的帧数re
     * @param _index
     */
    this.set_replay_current_index = function (_index) {
        if (graphType) {
            _index = parseInt(_index);
            if (this.historySnaps) {
                currentTime = _index + replayerBegintime;
                openPlant.v.openplant_rt_data_json = this.historySnaps['' + this._current_time];
                this._repaint_dynamic_graph();
                openPlant.v.openplant_rt_data_json = null;
            }
        }
    }
    this._init();
}

openPlant.DataContainer = function () {
    var _fileName;
    var _background;
    var _elements = [];

    this.addElement = function (_element) {
        _elements.push(_element);
    }

    this.setFileName = function (_file) {
        _fileName = _file;
    }

    this.getFileName = function () {
        return _fileName;
    }

    this.setBackground = function (_b) {
        background = _b;
    }

    this.getBackground = function () {
        return background;
    }

    this.foreach = function (_callback) {
        var _length = _elements.length;
        for (var _i = 0; _i < _length; _i++) {
            _callback(_elements[_i]);
        }
    }

    this.clear = function () {
        _elements = [];
        background = null;
    }

    this.size = function () {
        return _elements.length;
    }

}

openPlant.GraphElement = {
    parseBoolean: function (_str) {
        if (_str === 'true') {
            return true;
        } else {
            return false;
        }
    },
    parse_Boolean: function (_str) {
        if (String(_str) == 'true') {
            return true;
        } else {
            return false;
        }
    },
    /**
     * 暂时解决IE8及低版本 字体颜色（无透明度）
     */
    parseTextColor4LowIE: function (_color) {
        var that = _color;
        if (/^(rgba|RGBA)/.test(that)) {
            var aColor = that.replace(/(?:\(|\)|rgba|RGBA)*/g, "").split(",");
            var strHex;
            strHex = "#";
            for (var i = 0; i < aColor.length - 1; i++) {
                var hex = Number(aColor[i]).toString(16);
                if (hex === "0") {
                    hex += hex;
                }
                strHex += hex;
            }
            if (strHex.length !== 7) {
                strHex = that;
            }
            return strHex;
        }
    },

    parseColor: function (_color) {
        var reg = /^#([0-9a-fA-f]{3}|[0-9a-fA-f]{6})$/;
        var that = _color;
        if (/^(rgba|RGBA)/.test(that)) {
            var aColor = that.replace(/(?:\(|\)|rgba|RGBA)*/g, "").split(",");
            var strHex;
            if (aColor.length == 4) {
                strHex = "rgba(" + aColor[0] + "," + aColor[1] + ","
                    + aColor[2] + "," + ((aColor[3] / 255)) + ")";
            } else {
                strHex = "#";
                for (var i = 0; i < aColor.length - 1; i++) {
                    var hex = Number(aColor[i]).toString(16);
                    if (hex === "0") {
                        hex += hex;
                    }
                    strHex += hex;
                }
                if (strHex.length !== 7) {
                    strHex = that;
                }
            }
            return strHex;
        } else if (reg.test(that)) {
            var aNum = that.replace(/#/, "").split("");
            if (aNum.length === 6) {
                return that;
            } else if (aNum.length === 3) {
                var numHex = "#";
                for (var i = 0; i < aNum.length; i += 1) {
                    numHex += (aNum[i] + aNum[i]);
                }
                return numHex;
            }
        } else if (/^(0x[0-9a-fA-f]{6})$/.test(that)) {
            try {
                if (_color == null || _color == "" || _color == undefined) {
                    return null;
                } else {
                    return "#" + _color.substr(2);
                }
            } catch (e) {
                log(_color);
            }
        } else {
            return that;
        }
    },
    // 圆角
    roundRect: function (context, _bounds, _stroke, _radius_aw) {
        var x = _bounds.x;
        var y = _bounds.y;
        var w = _bounds.w;
        var h = _bounds.h;


        if (_radius_aw != undefined && _radius_aw > 0) {
            var _radius_ah = _radius_aw
            if (h < _radius_ah) {
                _radius_ah = h;
            }
            if (w < _radius_aw) {
                _radius_aw = w
            }

            var lineSize_w = w - _radius_aw;
            var lineSize_h = h - _radius_ah;

            _radius_ah /= 2;
            _radius_aw /= 2;
            context.drawDashFilletRect(x, y, w, h, _radius_aw, _radius_ah, _stroke.strokeWidth, _stroke.strokeStyle, _stroke.color);

        } else {
            context.drawDashRect(x, y, w, h, _stroke.strokeWidth, _stroke.strokeStyle, _stroke.color);
        }
    },
    fillElement: function (canvas_context, _fill, _bounds) {
        switch (_fill.type) {
            case 0 :
                break;
            case 1 : {
                canvas_context.fillStyle = _fill.bgcolor;
                break;
            }
            case 2 : {
                canvas_context.fillStyle = canvas_context.getBackGroundImage(_fill.gradientType, _fill.bgcolor, _fill.forecolor);
                break;
            }
            case 3 : {
                openPlant.GraphUtils.gradient(canvas_context, _bounds, _fill);
                break;
            }
        }
    },
    fillBackElement: function (canvas_context, _fill, _bounds) {
        switch (_fill.type) {
            case 0 :
                break;
            case 1 : {
                canvas_context.fillStyle = _fill.bgcolor;
                break;
            }
            case 2 : {
                canvas_context.fillStyle = _fill.bgcolor;
                break;
            }
            case 3 : {
                openPlant.GraphUtils.gradient(canvas_context, _bounds, _fill);
                break;
            }
        }
    },
    strokeElement: function (canvas_context, _stroke) {
        if (_stroke.strokeWidth > 0) {
            canvas_context.lineWidth = _stroke.strokeWidth;
            canvas_context.strokeStyle = _stroke.color;
        } else {
            // 设定为无色
            canvas_context.strokeStyle = "rgba(0,0,0,0)"
        }
    },

    _fill_stroke: function (_object) {
        var _fill = _object[openPlant.GraphConst.SHAPE_PROPERTY_FILL];
        var _class = _object['class'];
        if (_class == 200) {
            _fill = _object[openPlant.GraphConst.BAR_BACK_FILL];
        }
        if (!_fill) {
            _fill = openPlant.GraphConst.DEFAULT_VALUE_SHAPE_FILL;
            _object[openPlant.GraphConst.SHAPE_PROPERTY_FILL] = _fill;
        }
        var _stroke = _object[openPlant.GraphConst.SHAPE_PROPERTY_STROKE];
        if (!_stroke) {
            _stroke = openPlant.GraphConst.DEFAULT_VALUE_SHAPE_STROKE;
            _object[openPlant.GraphConst.SHAPE_PROPERTY_STROKE] = _stroke;
        }
        return [_fill, _stroke];
    },

    drawBackground: function (canvas_context, _image_pre, _object) {
        try {
            if (_object) {
                var _url = _object[openPlant.GraphConst.IMAGE_URL];
                var _bounds = {
                    x: 0, y: 0, w: canvas_context.canvas.width, h: canvas_context.canvas.height
                }
                if (_url) {
                    var _image = new Image();
                    _image.onload = function () {
                        // 可能save已经出边界了
                        canvas_context.save();
                        canvas_context.drawImage(_image, _bounds.x,
                            _bounds.y, _bounds.w,
                            _bounds.h);
                        canvas_context.restore();
                    };
                    _image.src = _image_pre + _url;
                } else {
                    var _drawfill = _object[openPlant.GraphConst.DRAWFILL];
                    canvas_context.save();
                    this.fillBackElement(canvas_context, _drawfill, _bounds);
                    canvas_context.fillRect(_bounds.x, _bounds.y, _bounds.w, _bounds.h);
                    canvas_context.restore();
                }
            }

        }
        catch (e) {
            console.log(e);
        }
    },

    drawShape: function (canvas_context, _object, _draw) {
        var _bounds = _object[openPlant.GraphConst.ELEMENT_PROPERTY_BOUNDS];
        if (_bounds) {
            var _f_s = this._fill_stroke(_object);
            var _fill = _f_s[0];
            var _stroke = _f_s[1];
            if (_draw) {
                _draw.call(this, _bounds, _stroke);
            }
            if (_fill) {
                var fillType = _fill.type;
                if (fillType != 0) {
                    this.fillElement(canvas_context, _fill, _bounds);
                    var _class = _object['class'];
                    if (_class != 200) {
                        canvas_context.fill();
                    }
                }
            }
            if (_stroke) {
                this.strokeElement(canvas_context, _stroke);
            }
        }
    }
    ,

    drawPoly: function (canvas_context, _object, _isPolygon) {
        var _f_s = this._fill_stroke(_object);
        var _fill = _f_s[0];
        var _stroke = _f_s[1];
        var _points = _object[openPlant.GraphConst.POLYLINE_PROPERTY_POINTS];
        if (_isPolygon) {
            // 获得最大矩形
            var _bounds = _object[openPlant.GraphConst.ELEMENT_PROPERTY_BOUNDS];
            if (_fill) {
                try {
                    this.fillElement(canvas_context, _fill, _bounds);
                } catch (e) {
                    log(e)
                }
            }
        }
        canvas_context.drawDashPoly(_points, _fill, _stroke.strokeWidth, _stroke.strokeStyle, _stroke.color, _isPolygon);
    }
    ,

    parseRect: function (canvas_context, _object) {
        this.drawShape(canvas_context, _object, function (_bounds, _stroke) {
            var _radius = 0;
            var _ac = _object[openPlant.GraphConst.RECTANGLE_PROPERTY_ARCW];
            if (_ac) {
                _ac = parseInt(_ac);
            } else {
                _ac = 0;
            }
            var _ah = _object[openPlant.GraphConst.RECTANGLE_PROPERTY_ARCH];
            if (_ah) {
                _ah = parseInt(_ah);
            } else {
                _ah = 0;
            }
            var _radius_aw = 0;
            var _radius_ah = 0;

            if (_radius_aw < _ac)
                _radius_aw = _ac;
            if (_radius_ah < _ah)
                _radius_ah = _ah;
            this.roundRect(canvas_context, _bounds, _stroke, _radius_aw,
                _radius_ah);
        });
    }
    ,
    /*
     * 图形画椭圆 @param {Object} canvas_context @param {Object} _object @memberOf
     * {TypeName}
     */
    parseEllipse: function (canvas_context, _object) {
        this.drawShape(canvas_context, _object, function (_bounds) {
            var a = _bounds.w / 2, b = _bounds.h / 2, x = _bounds.x
                + a, y = _bounds.y + b - 1;
            var k = .5522848, ox = a * k, // 水平控制点偏移量
                oy = b * k; // 垂直控制点偏移量
            var _f_s = this._fill_stroke(_object);
            var _fill = _f_s[0];
            var _stroke = _f_s[1];
            var style;
            canvas_context.drawDashEllipse(x, y, a, b, _stroke.strokeWidth, _stroke.strokeStyle, _stroke.color)

        });
    }
    ,
    /**
     * 绘制二次三次贝塞尔曲线（虚线样式）TODO 暂时只实现前四种
     *
     * @param {Object}
     *            obj
     */
    drawArcLine: function (drawPs, _stroke, canvas_context) {
        var t = 0;
        var cp = drawPs;
        var ax, bx, cx, ay, by, cy;
        if (drawPs.length === 3) {
            cx = 2.0 * (cp[1][0] - cp[0][0]);
            ax = cp[2][0] - cp[0][0] - cx;
            cy = 2.0 * (cp[1][1] - cp[0][1]);
            ay = cp[2][1] - cp[0][1] - cy;
        } else if (drawPs.length === 4) {
            cx = 3.0 * (cp[1][0] - cp[0][0]);
            bx = 3.0 * (cp[2][0] - cp[1][0]) - cx;
            ax = cp[3][0] - cp[0][0] - cx - bx;
            cy = 3.0 * (cp[1][1] - cp[0][1]);
            by = 3.0 * (cp[2][1] - cp[1][1]) - cy;
            ay = cp[3][1] - cp[0][1] - cy - by;
        }
        canvas_context.beginPath();
        canvas_context.lineWidth = _stroke.strokeWidth;
        canvas_context.strokeStyle = _stroke.color;
        canvas_context.moveTo(cp[0][0], cp[0][1]);
        var b = false;

        while (t <= 1) {
            var tCubed, xx, yy, tSquared;

            if (drawPs.length === 3) {
                tCubed = t * t;
                xx = (ax * tCubed) + (cx * t) + cp[0][0];
                yy = (ay * tCubed) + (cy * t) + cp[0][1];
            } else if (drawPs.length === 4) {
                tSquared = t * t;
                tCubed = tSquared * t;
                xx = (ax * tCubed) + (bx * tSquared) + (cx * t) + cp[0][0];
                yy = (ay * tCubed) + (by * tSquared) + (cy * t) + cp[0][1];
            }
            t += this.getDashLinestyle_arc(_stroke.strokeStyle);
            if (b) {
                canvas_context.lineTo(xx, yy);
            } else {
                canvas_context.moveTo(xx, yy);
            }

            b = !b;
        }
        canvas_context.lineWidth = 2;
        canvas_context.closePath();
        canvas_context.stroke();
    }
    ,
    /*
     * 获取弧线的虚线样式 @param {Object} style @return float
     */
    getDashLinestyle_arc: function (style) {
        switch (parseInt(style)) {
            case 1 :
                return 0.035;
            case 2 :
                return 0.02;
            case 3 :
                return 0.01;
            case 4 :
                return 0.005;
        }
    }
    ,
    parsePolyline: function (canvas_context, _object) {
        this.drawPoly(canvas_context, _object, false);
    }
    ,

    parsePolygon: function (canvas_context, _object) {
        this.drawPoly(canvas_context, _object, true);
    }
    ,

    parseArc: function (canvas_context, _object) {
        // default value type
        var _arctype = _object[openPlant.GraphConst.ARC_PROPERTY_TYPE];
        if (_arctype == undefined) {
            _arctype = 1;
        }
        // 开始弧度
        var _arcstart = _object[openPlant.GraphConst.ARC_PROPERTY_START];
        if (_arcstart == undefined) {
            _arcstart = 0;
        }
        // 弧度范围
        var _arcextend = _object[openPlant.GraphConst.ARC_PROPERTY_EXTENT];
        if (_arcextend == undefined) {
            _arcextend = 0;
        }
        this.drawShape(canvas_context, _object, function (_bounds, _stroke) {
            canvas_context.drawDashArc(_bounds, _arctype, _arcstart, _arcextend, _stroke.strokeWidth, _stroke.strokeStyle, _stroke.color);
        });
    }
    ,
    _scienceNum: function (value) {
        return parseFloat(value).toExponential(2);
    }
    ,
    _getTextComponenetValue: function (canvas_context, _object, _type,
                                       _rt_data_json, _static_data_json, _time_deviation) {
        var _text = _object[openPlant.GraphConst.TEXT_PROPERTY_TEXTCONTEXT];
        var _dotcount = _object[openPlant.GraphConst.NUMBER_PROPERTY_DOTCOUNT];
        if (_dotcount == undefined || _dotcount < 0) {
            _dotcount = 2;
        }
        if (_dotcount > 10) {
            _dotcount = 10;
        }

        var status_color;
        if (_type == 1) {
            _text = "N/A";
            if (_rt_data_json && _static_data_json) {
                var _pn = _object[openPlant.GraphConst.DASHPOINT_PROPERTY_POINTNAME].toUpperCase();
                var _science = _object[openPlant.GraphConst.NUMBER_PROPERTY_SCIENCE];
                if (_pn) {
                    var _field = _object[openPlant.GraphConst.DASHPOINT_PROPERTY_POINTFIELDNAME];
                    if (_field && 'AV' != _field) {
                        var _static_data = _static_data_json[_pn];
                        if (_static_data) {
                            var eu = _static_data[_field];
                            if (eu) {
                                _text = "" + eu;
                            } else {
                                _text = "?" + _field;
                            }
                        } else {
                            _text = "?" + _field;
                        }
                    } else {
                        var _dy_data = _rt_data_json[_pn];
                        if (_dy_data) {
                            if (_dy_data['AV'] != undefined && _dy_data['AV'] != null) {
                                if (_science) {
                                    _text = this._scienceNum(_dy_data['AV'].toFixed(_dotcount));
                                } else {
                                    _text = "" + _dy_data['AV'].toFixed(_dotcount);
                                }
                                var _status = parseInt(_dy_data['AS']);
                                if (_status != undefined && _status != null) {
                                    _status = _status & 0x0FFFF;
                                    if (((_status & 0x8000) == 0x8000) || (_status & 0x4020) == 0x4020 || _status < 0) { // 第15位为1或者第14位为1，表示超时。
                                        status_color = openPlant.GraphConst.ALARM_TIMEOUT;
                                    } else if ((_status & 0x80) == 0x80) {// 第7位为1，表示报警。
                                        if (openPlant.GraphConst.COMPEL_CHANGE_COLOR_FOR_ALARM) {
                                            if ((_status & 0x8) == 0x8) {// 第3位为1，表示高限报警。
                                                status_color = openPlant.GraphConst.ALARM_HIGH;
                                            } else if ((_status & 0x4) == 0x4) {// 第2位为1，表示低限报警。
                                                status_color = openPlant.GraphConst.ALARM_LOW;
                                            }
                                        } else {
                                            var _script_fun = _object[openPlant.GraphConst.ELEMENT_PROPERTY_REFRESH_SCRIPT];
                                            if (!_script_fun || _script_fun.toString().indexOf("setfontColor(") == -1) {
                                                //检查对象中是否包含了字体颜色设定语句
                                                if ((_status & 0x8) == 0x8) {// 第3位为1，表示高限报警。
                                                    status_color = openPlant.GraphConst.ALARM_HIGH;
                                                } else if ((_status & 0x4) == 0x4) {// 第2位为1，表示低限报警。
                                                    status_color = openPlant.GraphConst.ALARM_LOW;
                                                }
                                            }
                                        }
                                    } else if ((_status & 0x300) == 0x300) {// 第8,9位为1，表示BAD。
                                        status_color = openPlant.GraphConst.ALARM_BAD;
                                    }
                                }
                            } else {
                                status_color = openPlant.GraphConst.ALARM_TIMEOUT;
                                _text = "N/D";
                            }
                        } else {
                            _text = "N/A";
                        }
                    }
                }
            }
        }
        if (_type == 4) {
            _text = "N/A";
            var _ex = _object[openPlant.GraphConst.CALCPOINT_PROPERTY_EXPRESSION];
            var _science = _object[openPlant.GraphConst.NUMBER_PROPERTY_SCIENCE];
            if (_ex) {
                try {

                    _ex = _ex.toString().replaceAll("\\\\n", ";");
                    _text = _ex;
                    var _value = eval(_ex);
                    if (_science) {
                        _text = this._scienceNum(parseFloat(_value.toString()).toFixed(_dotcount));
                    } else {
                        _text = parseFloat(_value.toString()).toFixed(_dotcount);
                    }
                } catch (e) {
                    _text = _ex;
                }
            }
        } else if (_type == 2 && _time_deviation) {
            var _date = new Date(new Date().getTime() + _time_deviation);
            var _format = _object[openPlant.GraphConst.TIME_PROPERTY_FORMAT];
            if (_format) {
                var _f = openPlant.GraphUtils.getDateFormat(parseInt(_format));
                _text = openPlant.GraphUtils.dateformat(_date, _f);
            } else {
                _text = openPlant.GraphUtils.dateformat(_date,
                    "yyyy-MM-dd hh:mm:ss");
            }
        } else if (_type == 0) {
            // 删除多余的换行符
            if (_text) {
                _text = _text;
            }
        } else {
        }
        return [_text, status_color];
    }
    ,
// 0 文字，1 das，2 time ,3 button , 4 calcPoint
    parseText: function (canvas_context, _object, _type, _paint_zoom_x,
                         _paint_zoom_y, _rt_data_json, _static_data_json, _time_deviation) {
        var _value = this._getTextComponenetValue(canvas_context, _object, _type, _rt_data_json, _static_data_json, _time_deviation);
        var _text = _value[0];
        var _status_color = _value[1];
        if (_text == undefined || _text.length == undefined) {
            return;
        }

        var _text_color = _object[openPlant.GraphConst.TEXT_PROPERTY_TEXTCOLOR];
        if (!_text_color) {
            _text_color = openPlant.GraphConst.DEFAULT_VALUE_TEXT_TEXTCOLOR;
        }

        if (_status_color) {
            if (_status_color != "Default" || _status_color != "default") {
                _text_color = _status_color;
            }
        }

        var _text_font = _object[openPlant.GraphConst.TEXT_PROPERTY_TEXTFONT];

        if (!_text_font) {
            _text_font = {
                textFont: 'sans',
                style: '',
                fontSize: 20
            };
        }
        if (true == _object[openPlant.GraphConst.NUMBER_PROPERTY_DIGIT]) {
            _text_font.textFont = "GViewDigital";
        }


        var _isFill = _object[openPlant.GraphConst.TEXT_PROPERTY_FILL_VISIBLE];
        if (!_isFill) {
            _isFill = false;
        }

        var _isStroke = _object[openPlant.GraphConst.TEXT_PROPERTY_STROKE_VISIBLE];
        if (!_isStroke) {
            _isStroke = false;
        }

        var _bounds = _object[openPlant.GraphConst.ELEMENT_PROPERTY_BOUNDS];

        var _f_s = this._fill_stroke(_object);
        var _fill = _f_s[0];
        var _stroke = _f_s[1];

        var vertical = _object[openPlant.GraphConst.TEXT_PROPERTY_ALIGN];

        var _size_def = 20, _defaultFont = null;
        // 文字大小处理 ————————————————————————————
        if (_text_font) {
            // 获取设定的字体大小
            _size_def = _text_font.fontSize;
            if ((openPlant.GraphConst.BUTTON_AUTO_FONT_SIZE != undefined && (openPlant.GraphConst.BUTTON_AUTO_FONT_SIZE == true || openPlant.GraphConst.BUTTON_AUTO_FONT_SIZE == "true")) || (_type != 3)) {
                if (vertical != undefined && (vertical == true || vertical == "true")) {
                    if (_bounds.w > 0) {
                        _size_def = _bounds.w;
                        if (_text != undefined && _text.length > 0) {
                            var _textHeight = _bounds.h
                                / _text.length;
                            _size_def = _textHeight > _size_def ? _size_def : _textHeight
                        }
                        _size_def *= 0.7;
                        _text_font.fontSize = _size_def;
                    }
                } else {
                    if (_bounds.h > 0) {
                        _size_def = _bounds.h;
                        _text_font.fontSize = _size_def;
                    }
                }
            }
            if (openPlant.GraphConst.BUTTON_AUTO_FONT_SIZE != undefined && (openPlant.GraphConst.BUTTON_AUTO_FONT_SIZE == true || openPlant.GraphConst.BUTTON_AUTO_FONT_SIZE == "true")) {
                if (_type == 3) {
                    _size_def = _size_def * openPlant.GraphConst.BUTTON_FONT_SIZE_RATIO;
                    _text_font.fontSize = _size_def;
                }
            }

            if (_text_font.style == 'BOLDITALIC') {
                _text_font.style = 'bold italic';
            } else if (_text_font.style == 'PLAIN') {
                _text_font.style = "";
            }
            if (openPlant.OPConst.isLowIE || openPlant.OPConst.isSafari) {
                _size_def = parseInt(_size_def * _paint_zoom_x);
                _size_def = this.conversionTextSize(canvas_context, _size_def, _text_font, _bounds, _text);
                _text_font.fontSize = _size_def;
            }
            _defaultFont = _text_font.style + ' ' + _size_def + 'px ' + _text_font.textFont;
        }

        if (_bounds.w == 0 || _bounds.h == 0) {
            canvas_context.font = _defaultFont;
            var width = canvas_context.measureText(_text).width;
            var height = _text_font.fontSize;
            _bounds.w = parseInt(width) + _text.length;
            _bounds.h = height;
        }

        var shadow = 0;

        if (_isFill || _isStroke) {
            var _strokeTemp = {strokeWidth: 0, strokeStyle: 0, color: "#000000"};
            //button  采用圆角矩形模型
            if (_type == 3) {
                shadow = _bounds.w < _bounds.h ? (_bounds.w / 10) : (_bounds.h / 10)
                this.roundRect(canvas_context, _bounds, _strokeTemp, shadow * 2);
            } else {
                this.roundRect(canvas_context, _bounds, _strokeTemp);
            }

            if (_isFill && _fill) {
                canvas_context.save();
                if (_type == 3) {
                    canvas_context.shadowColor = "RGBA(100,100,100,0.7)";
                    canvas_context.shadowOffsetX = shadow;
                    canvas_context.shadowOffsetY = shadow;
                    canvas_context.shadowBlur = shadow;
                }
                this.fillElement(canvas_context, _fill, _bounds);
                canvas_context.fill();
                canvas_context.restore();
            }

            if (_isStroke && _stroke) {
                this.strokeElement(canvas_context, _stroke);
                canvas_context.stroke();
            }
        }


        if (_text) {
            if (_text_color) {
                canvas_context.fillStyle = _text_color;
            }
            canvas_context.font = _defaultFont;
            this.parseTextHigh(canvas_context, _bounds, _text, _size_def, _type, _object, _stroke);
            _object[openPlant.GraphConst.ELEMENT_PROPERTY_EXACT_BOUNDS] = _bounds;
        }
    }
    ,
    conversionTextSize: function (canvas_context, _size_def, _text_font,
                                  _bounds, _text) {
        var tempFont = _text_font.style + ' ' + _size_def + 'px ' + _text_font.textFont;
        canvas_context.font = tempFont;
        var width = canvas_context.measureText(_text).width;
        if (_bounds.w > 0 && _bounds.h > 0) {
            while (width > _bounds.w) {
                _size_def--;
                canvas_context.font = _text_font.style + ' ' + _size_def + 'px '
                    + _text_font.textFont;
                width = canvas_context.measureText(_text).width;
            }
        }
        return _size_def;
    }
    ,
    parseTextHigh: function (canvas_context, _bounds, _text, _size_def, _type, _object, _stroke) {
        var vertical = _object[openPlant.GraphConst.TEXT_PROPERTY_ALIGN];
        // 高级浏览器 有size
        var _x = _bounds.x;
        var _y = _bounds.y;
        var _w = _bounds.w;
        var _h = _bounds.h;
        if (vertical != undefined && (vertical == true || vertical == "true")) {
            var ch = _h / _text.length;
            for (var i = 0; i < _text.length; i++) {
                canvas_context.textAlign = 'center';// 文本水平对齐方式
                canvas_context.textBaseline = 'hanging';
                canvas_context.fillText(_text.slice(i, i + 1), _x + _w / 2, (_y
                + ch * 0.15 + ch * i));
            }
        } else {
            var _metrics = canvas_context.measureText(_text);
            var xt = _x
                + (_w > _metrics.width ? ((_w - _metrics.width) / 2) : 0);
            if (_type == 3) {
                // 头留白部分
                var yt = _y + _stroke.strokeWidth + (_h - _size_def) / 2 + _size_def * 0.85;
                if (!(openPlant.GraphConst.BUTTON_AUTO_FONT_SIZE != undefined && (openPlant.GraphConst.BUTTON_AUTO_FONT_SIZE == true || openPlant.GraphConst.BUTTON_AUTO_FONT_SIZE == "true"))) {
                    xt = _x + (_w - _metrics.width) / 2;
                    _w = _metrics.width;
                }
            } else {
                var yt = _y + _h * 0.85;
            }
            canvas_context.fillText(_text, xt, yt, _w);
        }
    }
    ,
    parseTextLowIE: function (canvas_context, _bounds, _text, _size_def, _type,
                              _object, _paint_zoom_x) {
        // 有size，button。则按字体
        if (_type == 3) {
            var _metrics = canvas_context.measureText(_text);
            var _x = _bounds.x;
            var _y = _bounds.y;
            var _w = _bounds.w;
            var _h = _bounds.h;
            var xt = _x + (_w - _metrics.width) / 2;
            var yt = _y + (_h - _size_def) / 2 + _size_def / 2;
            canvas_context.fillText(_text, xt, yt);
        } else {
            var _metrics = canvas_context.measureText(_text);
            var _x = _bounds.x;
            var _y = _bounds.y;
            var _w = _bounds.w;
            var _h = _bounds.h;
            var xt = _x + (_w - _metrics.width) / 2;
            var yt = _y + (_h - _size_def) / 2 + _size_def / 2;
            canvas_context.fillText(_text, xt, yt);
        }
    },

    parseButton: function (canvas_context, _object, _paint_zoom_x,
                           _paint_zoom_y) {
        this.parseText(canvas_context, _object, 3, _paint_zoom_x,
            _paint_zoom_y);
    },
    parseDaspoint: function (canvas_context, _object, _paint_zoom_x,
                             _paint_zoom_y, _rt_data_json, _static_data_json) {
        this.parseText(canvas_context, _object, 1, _paint_zoom_x,
            _paint_zoom_y, _rt_data_json, _static_data_json);
    },
    parseTime: function (canvas_context, _object, _paint_zoom_x, _paint_zoom_y,
                         _time_deviation) {
        this.parseText(canvas_context, _object, 2, _paint_zoom_x,
            _paint_zoom_y, null, null, _time_deviation);
    }
    ,
    parseCalcPoint: function (canvas_context, _object, _paint_zoom_x,
                              _paint_zoom_y, _rt_data_json, _static_data_json) {

        this.parseText(canvas_context, _object, 4, _paint_zoom_x,
            _paint_zoom_y, _rt_data_json, _static_data_json);
    },
    /**
     * 绘制网格
     * @param canvas_context
     * @param _object
     */
    parseGrid: function (canvas_context, _object) {
        this.drawShape(canvas_context, _object, function (_bounds, _stroke) {
            var grid_column = _object[openPlant.GraphConst.GRID_COLUMN];
            var grid_row = _object[openPlant.GraphConst.GRID_ROW];
            canvas_context.drawGrid(_bounds.x, _bounds.y, _bounds.w, _bounds.h, _stroke.strokeWidth, grid_row, grid_column, _stroke.strokeStyle, _stroke.color);
        });
    }
    ,
    parseBar: function (canvas_context, _object, _rt_data_json, _static_data_json) {
        this.drawShape(canvas_context, _object, function (_bounds) {
            var _fill = _object[openPlant.GraphConst.BAR_BACK_FILL];
            if (!_fill) {
                _fill = openPlant.GraphConst.BAR_VALUE_SHAPE_FILL;
            }
            if (_fill.type != 0) {
                canvas_context.fillStyle = _fill.bgcolor;
                canvas_context.fillRect(_bounds.x, _bounds.y, _bounds.w,
                    _bounds.h);
            }
            canvas_context.strokeStyle = "black";
            canvas_context.strokeRect(_bounds.x, _bounds.y, _bounds.w,
                _bounds.h);

            if (_static_data_json) {
                var _pn = _object[openPlant.GraphConst.DASHPOINT_PROPERTY_POINTNAME].toUpperCase();
                if (_pn) {
                    var _static_data = _static_data_json[_pn];
                    if (_static_data) {

                        var _bv = _static_data['BV'];
                        var _tv = _static_data['TV'];

                        if (_object[openPlant.GraphConst.BAR_HIGH_LIMIT] != undefined) {
                            _tv = _object[openPlant.GraphConst.BAR_HIGH_LIMIT];
                        }

                        if (_object[openPlant.GraphConst.BAR_LOW_LIMIT] != undefined) {
                            _bv = _object[openPlant.GraphConst.BAR_LOW_LIMIT];
                        }

                        if (_rt_data_json) {
                            var _dy_data = _rt_data_json[_pn];
                            var _data_av = 0;
                            if (_dy_data)
                                _data_av = _dy_data.AV;
                            var _ppp = 0;

                            _data_av = _data_av < _bv ? _bv : _data_av;
                            _data_av = _data_av > _tv ? _tv : _data_av;

                            if (_data_av - _bv > 0) {
                                _ppp = (_data_av - _bv) / (_tv - _bv);
                            }

                            var _direct = parseInt(_object[openPlant.GraphConst.BAR_DIRECT]);
                            if (_direct != undefined && !_direct)
                                _direct = parseInt(0);

                            var percertHeight = _bounds.h * _ppp;
                            var percentWidth = _bounds.w * _ppp;

                            var _valueFill = _object[openPlant.GraphConst.BAR_VALUE_FILL];
                            if (!_valueFill) {
                                _valueFill = openPlant.GraphConst.DEFAULT_VALUE_SHAPE_FILL;
                            }
                            switch (_direct) {
                                // 0 ↑, 1 ↓,2 ←,3 →
                                case 0 : {
                                    canvas_context.fillStyle = this
                                        .parseColor(_valueFill.bgcolor);
                                    canvas_context.fillRect(_bounds.x,
                                        _bounds.y + _bounds.h
                                        - percertHeight,
                                        _bounds.w, percertHeight);
                                    break;
                                }
                                case 1 : {
                                    canvas_context.fillStyle = this
                                        .parseColor(_valueFill.bgcolor);
                                    canvas_context.fillRect(_bounds.x,
                                        _bounds.y, _bounds.w,
                                        percertHeight);
                                    break;
                                }
                                case 2 : {
                                    canvas_context.fillStyle = this
                                        .parseColor(_valueFill.bgcolor);
                                    canvas_context.fillRect(
                                        _bounds.x + _bounds.w
                                        - percentWidth, _bounds.y,
                                        percentWidth, _bounds.h);
                                    break;
                                }
                                case 3 : {
                                    canvas_context.fillStyle = this
                                        .parseColor(_valueFill.bgcolor);
                                    canvas_context.fillRect(_bounds.x,
                                        _bounds.y, percentWidth,
                                        _bounds.h);
                                    break;
                                }
                            }
                        }
                    }
                }
            }
        });
    }
};

openPlant.GraphConst = {
    EXPLORER: window.navigator.userAgent,
    TYPE_RECTANGLE: 1,
    TYPE_ELLIPSE: 2,
    TYPE_POLYLINE: 3,
    TYPE_POLYGON: 4,
    TYPE_ARC: 5,
    TYPE_IMAGE: 6,
    TYPE_BUTTON: 7,
    TYPE_TEXT: 8,
    TYPE_GROUP: 9,

    TYPE_LINK: 20,
    TYPE_COMPLEXSHAPE: 21,
    // ext
    TYPE_DASPOINT: 101,
    TYPE_TIME: 102,
    TYPE_CALCPOINT: 103,

    TYPE_CHART_PIE: 150,
    TYPE_CHART_BAR: 151,

    TYPE_BAR: 200,
    TYPE_TREND: 201,
    TYPE_AREA: 202,
    TYPE_DASHBOARD: 203,// add dashboard
    TYPE_GRID: 210,
    TYPE_WEBVIEW: 220,
    TYPE_COMBOBOX: 230,
    TYPE_CHECKBOX: 231,
    TYPE_TEXTFIELD: 240,
    TYPE_PASSWORD_TEXTFIELD: 241,

    DEFAULT_VALUE_SHAPE_FILL: {
        type: 1,
        bgcolor: 'rgba(0,0,255,255)',
        forecolor: 'rgba(255,255,255,255)',
        patternType: 0,
        gradientType: 0,
        gradientDriection: 0
    },

    DEFAULT_VALUE_SHAPE_STROKE: {
        strokeWidth: 1, strokeStyle: 0, color: "#000000"
    }
    ,

    DEFAULT_VALUE_TEXT_CONTENT: "TEXT",
    DEFAULT_VALUE_TEXT_TEXTCOLOR: "#000000",
    DEFAULT_TEXT_FONT: ['Arial', 20],

    ELLIPSE_ENDANGLE: (Math.PI / 180) * 360,

    //dynamic object
    DEFAULT_DYNAMIC_OBJECT: [7, 8, 9, 101, 102, 103, 200, 202, 203],
    //irregularity graph
    DEFAULT_IRREGULARITY_GRAPH: [2, 3, 4, 5, 201],

    // background
    IMAGE_URL: "background.image.url",
    DRAWFILL: "background.drawfill",
    MINSIZE: "background.minsize",
    CURRENTSIZE: "background.currentsize",
    // base
    ELEMENT_PROPERTY_NAME: "base.name",
    ELEMENT_PROPERTY_Z_INDEX: "base.z.index",
    ELEMENT_PROPERTY_REFNAME: "base.refname",
    ELEMENT_PROPERTY_CONTAINER: "base.container",
    ELEMENT_PROPERTY_BOUNDS: "base.bounds",
    ELEMENT_PROPERTY_REFRESH_SCRIPT: "base.refresh.script",
    ELEMENT_PROPERTY_MOUSEEVENT_SCRIPT: "base.mouseevent.script",
    ELEMENT_PROPERTY_REFRESH_SCRIPT_DCSPOINTS: "base.refresh.script.dcspoints",
    ELEMENT_PROPERTY_VISIBLE: "base.visible",

    ELEMENT_PROPERTY_GEOGRAPHY: "base.geography",

    // 真实的边框,交互使用
    ELEMENT_PROPERTY_EXACT_BOUNDS: "base.exactbounds",
    // layout
    ELEMENT_PROPERTY_LAYOUTPARENT: "base.layout.parent",
    ELEMENT_PROPERTY_LAYOUT_CHILDREN_ADD: "group.layout.children.add",
    ELEMENT_PROPERTY_LAYOUT_CHILDREN_REMOVE: "group.layout.children.remove",

    // group
    GROUP_PROPERTY_VAR: "group.var",
    GROUP_PROPERTY_CHILDREN_ADD: "group.children.add",
    GROUP_PROPERTY_CHILDREN_REMOVE: "group.children.remove",
    GROUP_PROPERTY_CHILDREN_CLEAR: "group.children.clear",

    // garea
    AREA_PROPERTY_GRAPHURL: "area.graphurl",
    AREA_PROPERTY_BACKGROUND_IMAGEURL: "area.background.imageurl",

    // shape
    SHAPE_PROPERTY_FILL: "shape.fill",
    SHAPE_PROPERTY_STROKE: "shape.stroke",

    // rect
    RECTANGLE_PROPERTY_ARCW: "rectangle.arcw",
    RECTANGLE_PROPERTY_ARCH: "rectangle.arch",
    RECTANGLE_PROPERTY_3D: "rectangle.3d",

    // PolyLine
    POLYLINE_PROPERTY_POINTS: "polyline.points",
    POLYLINE_PROPERTY_POINTS_ADD: "polyline.points.add",
    POLYLINE_PROPERTY_POINTS_SET: "polyline.points.set",

    // complex shape
    COMPLEXSHAPE_PROPERTY_SEGMENTS: "complexshape.segments",
    COMPLEXSHAPE_PROPERTY_CLOSED: "complexshape.closed",
    COMPLEXSHAPE_PROPERTY_SEGMENTS_ADD: "complexshape.segments.add",
    COMPLEXSHAPE_PROPERTY_SEGMENTS_SET: "complexshape.segments.set",

    // Arc
    ARC_PROPERTY_TYPE: "arc.type",
    ARC_PROPERTY_START: "arc.start",
    ARC_PROPERTY_EXTENT: "arc.extent",

    // text
    TEXT_PROPERTY_TEXTCONTEXT: "text.textcontext",
    TEXT_PROPERTY_ALIGN: "text.align",
    TEXT_PROPERTY_TEXTFONT: "text.textfont",
    TEXT_PROPERTY_TEXTCOLOR: "text.textcolor",
    TEXT_PROPERTY_FILL_VISIBLE: "text.fill.visible",
    TEXT_PROPERTY_STROKE_VISIBLE: "text.stroke.visible",

    // button same with text.

    // GJComponent
    COMPONENT_PROPERTY_JC: "component.jc",

    // image
    IMAGE_PROPERTY_URL: "image.url",

    // number
    NUMBER_PROPERTY_DOTCOUNT: "number.dotcount",
    NUMBER_PROPERTY_DIGIT: "number.digit",
    NUMBER_PROPERTY_SCIENCE: "number.science",
    // dash point
    DASHPOINT_PROPERTY_POINTNAME: "dashpoint.pointname",
    DASHPOINT_TREND_POINTNAME: "dashpoint.trend.pointnames",
    DASHPOINT_PROPERTY_POINTFIELDNAME: "dashpoint.pointfieldname",
    DASHPOINT_PROPERTY_VALUE: "dashpoint.value",
    DASHPOINT_PROPERTY_INFO: "dashpoint.info",

    // calc point
    CALCPOINT_PROPERTY_EXPRESSION: "calcpoint.expression",
    CALCPOINT_PROPERTY_EXPRESSIONRESULT: "calcpoint.expressionresult",

    // time
    TIME_PROPERTY_FORMAT: "time.format",
    TIME_PROPERTY_VALUE: "time.value",

    // bar
    BAR_VALUE: "bar.value",
    BAR_HIGH_LIMIT: "bar.high.limit",
    BAR_LOW_LIMIT: "bar.low.limit",

    BAR_LOW_TYPE: "bar.low.type",
    BAR_LOW_POINTNAME: "bar.low.pointname",
    BAR_LOW_POINTFIELD: "bar.low.pointfield",

    BAR_HIGH_TYPE: "bar.high.type",
    BAR_HIGH_POINTNAME: "bar.high.pointname",
    BAR_HIGH_POINTFIELD: "bar.high.pointfield",

    BAR_VALUE_FILL: "bar.value.fill",
    BAR_BACK_FILL: "bar.back.fill",
    BAR_DIRECT: "bar.direct",
    BAR_VALUE_SHAPE_FILL: "1/rgba(0,0,0,255)/rgba(255,255,255,255)/0/0/0",

    // pie
    // 饼图
    PIECHART_PROPERTY_REALTIME: "piechart.point.realtime",
    PIECHART_PROPERTY_POINTN_LISTINFO: "piechart.point.listinfo",
    PIECHART_PROPERTY_BACKGROUND_COLOR: 'piechart.background.color',
    PIECHART_PROPERTY_HOLLOW_PERCENT: "pie.hollow.precent",
    PIECHART_PROPERTY_STYLE: "piechart.style",
    PIECHART_PROPERTY_TYPE: "piechart.type",
    PIECHART_PROPERTY_OBJECT: "piechart.object",
    PIECHART_SHAPE_STROKE: "shape.stroke",
    PIECHART_PROPERTY_DIRECTION: "piechart.legend.direction",
    PIECHART_PROPERTY_FONT: "piechart.graduation.font",

    //barchart
    //柱状图
    BARCHART_PROPERTY_REALTIME: "piechart.point.realtime",
    BARCHART_PROPERTY_POINTN_LISTINFO: "barchart.point.listinfo",
    BARCHART_PROPERTY_BACKGROUND_COLOR: 'barchart.background.color',
    BARCHART_PROPERTY_STYLE: "barchart.style",
    BARCHART_PROPERTY_TYPE: "barchart.type",
    BARCHART_HIGH_LIMIT: "barchart.high.limit",
    BARCHART_LOW_LIMIT: "barchart.low.limit",
    BARCHART_SECOND_HIGH_LIMIT: "barchart.high.second.limit",
    BARCHART_SECOND_LOW_LIMIT: "barchart.low.second.limit",
    BARCHART_DIRECTION: "barchart.direction",
    BARCHART_PROPERTY_OBJECT: "barchart.object",
    BARCHART_SHAPE_STROKE: "shape.stroke",
    BARCHART_PROPERTY_POINTN_LIST: "bar.point.list",
    BARCHART_PROPERTY_FONT: "barchart.graduation.font",


    // grid
    GRID_COLUMN: "grid.column",
    GRID_ROW: "grid.row",
    GRID_LINESTROKE: "grid.linestroke",

    // trend

    TREND_PRIPERTY_OPTREND: "trend.optrend",
    TREND_PROPERTY_TYPE_OBJECT: "trend.typeobject",//
    TREND_PROPERTY_DURATION: "trend.duration",//
    TREND_PROPERTY_TEXTFONT: "trend.textfont",//
    TREND_PROPERTY_INNER_TOP_MARGIN: "trend.inner.top.margin",//
    TREND_PROPERTY_INNER_BOTTOM_MARGIN: "trend.inner.bottom.margin",//
    TREND_PROPERTY_INNER_LEFT_MARGIN: "trend.inner.left.margin",//

    TREND_PROPERTY_TIME_AXIS_MIN_COUNT: "trend.axis.count",//
    TREND_PROPERTY_GRID_X_COUNT: "trend.grid.x.count",//
    TREND_PROPERTY_GRID_Y_COUNT: "trend.grid.y.count",//
    TREND_PROPERTY_GRID_STROKE: "trend.grid.stroke",//
    TREND_PROPERTY_TIME_FORMAT: "trend.time.format",//
    TREND_PROPERTY_COLOR_FILLGROUND: "trend.color.fillground",//
    TREND_PROPERTY_COLOR_INBORDER: "trend.color.inborder",//

    TREND_PROPERTY_COLOR_RENDERING: "shape.fill",//
    TREND_PROPERTY_BORDER_STYLE: "shape.stroke",

    TREND_PROPERTY_LEGEND_LOCATION: "trend.legend.location",
    TREND_PROPERTY_LEGEND_WIDTH: "trend.legend.singleWidth",
    TREND_PROPERTY_LEGEND_STYLE: "trend.legend.style",

    TREND_PROPERTY_SCALE_MIN_LEFT: "trend.scale.min.left",
    TREND_PROPERTY_SCALE_MAX_LEFT: "trend.scale.max.left",
    TREND_PROPERTY_SCALE_MIN_RIGHT: "trend.scale.min.right",
    TREND_PROPERTY_SCALE_MAX_RIGHT: "trend.scale.max.right",
    TREND_PORPERTY_LIST_TRENDPOINTS: "trend.list.trendpoints",//

    // 仪表盘
    DASHBOARD_DASHPOINT_NAME: "dashpoint.pointname",
    DASHBOARD_DOTCOUNT: "dialchart.dotcount",
    DASHBOARD_LIMIT_LOW: "dialchart.low.limit",
    DASHBOARD_LIMIT_TOP: "dialchart.high.limit",
    DASHBOARD_bgcolor: "dialchart.background.color",
    DASHBOARD_DIALCHART_TYPE: "dialchart.type",
    DASHBOARD_PROPERTY_OBJECT: "dialchart.object",

    // GJComponent
    WEBVIEW_PROPERTY_URL: "webview.url",

    COMBOBOX_PROPERTY_ITEMS: "combobox.items",
    COMBOBOX_PROPERTY_CHANGE_SCRIPT: "combobox.change.script",

    CHECKBOX_PROPERTY_TEXT: "checkbox.text",
    CHECKBOX_PROPERTY_SELECT: "checkbox.select",
    CHECKBOX_PROPERTY_CHANGE_SCRIPT: "checkbox.change.script",

    TEXTFIELD_PROPERTY_TEXT: "textfield.text",

    // 超时报警色
    ALARM_TIMEOUT: "#FFFF00",
    // 坏值报警色
    ALARM_BAD: "#FF0000",
    //质量差 报警
    ALARM_POOR: "#FF8888",
    //质量一般报警
    ALARM_FIRE: "#FF8800",
    // 超高报警色
    ALARM_HIGH: "#FF0000",
    // 超低报警色
    ALARM_LOW: "#0000FF",

    // 强制报警超限变色开关
    COMPEL_CHANGE_COLOR_FOR_ALARM: false,

    // 自动字体开关
    BUTTON_AUTO_FONT_SIZE: true,
    // 按钮自动适配占比
    BUTTON_FONT_SIZE_RATIO: 0.6,

    PATT_POINT_NAME: /('[\w\d]+.[\w\d\_]+.[\w\d_$%\&\*@#.]+')/ig,
    PATT_DCSPOINT_NAME: /([\w\d]+.[\w\d\_]+.[\w\d_$%\&\*@#]+)/ig

}


openPlant.ScriptGlobalUtils = {
    av: function (_name) {
        if (openPlant.v.openplant_rt_data_json) {
            var _dydata = openPlant.v.openplant_rt_data_json[_name.toUpperCase()];
            if (_dydata) {
                return _dydata['AV'];
            }
        }
        return null;
    },
    as: function (_name) {
        if (openPlant.v.openplant_rt_data_json) {
            var _dydata = openPlant.v.openplant_rt_data_json[_name.toUpperCase()];
            if (_dydata) {
                return _dydata['AS'];
            }
        }
        return null;
    },
    avmask: function (_name, _mask) {
        if (openPlant.v.openplant_rt_data_json) {
            var _dydata = openPlant.v.openplant_rt_data_json[_name.toUpperCase()];
            if (_dydata) {
                var _av = _dydata['AV'];
                var _value = _mask.value;
                var _msk1 = _mask.mask;
                if ((_av & _msk1) == _value) {
                    return true;
                } else {
                    return false;
                }
            } else {
                return false;
            }
        } else {
            return false;
        }
    },
    asmask: function (_name, _mask) {
        var _value = _mask.value;
        var _msk1 = _mask.mask;
        if (openPlant.v.openplant_rt_data_json) {
            var _dydata = openPlant.v.openplant_rt_data_json[_name.toUpperCase()];
            if (_dydata) {
                var _as = _dydata['AS'];
                // 强制转换为无符号状态进行计算
                _as = _as & 0x0FFFF;
                var _value = _mask.value;
                var _msk1 = _mask.mask;
                if ((_as & _msk1) == _value) {
                    return true;
                } else {
                    return false;
                }
            } else {
                return false;
            }
        } else {
            return false;
        }
    },
    bv: function (_name) {
        var _dydata = openPlant.v.openplant_rt_data_json[_name.toUpperCase()];
        if (_dydata) {
            var _bv = _dydata['BV'];
            return _bv;
        } else {
            // TODO BV默认值0返回，不合理，但未实现
            return 0;
        }
    },
    tv: function (_name) {
        var _dydata = openPlant.v.openplant_rt_data_json[_name.toUpperCase()];
        if (_dydata) {
            var _tv = _dydata['TV'];
            return _tv;
        } else {
            // TODO TV默认值100返回，不合理，但未实现
            return 100;
        }
    },

    // action
    setbgColor: function (_color) {
        var _o = openPlant.v.openplant_script_object;
        openPlant.v.openplant_script_propertyChanges.push([_o, openPlant.GraphConst.SHAPE_PROPERTY_FILL, _o[openPlant.GraphConst.SHAPE_PROPERTY_FILL]]);
        var _fill = _o[openPlant.GraphConst.SHAPE_PROPERTY_FILL];
        if (_fill) {
            _o[openPlant.GraphConst.SHAPE_PROPERTY_FILL] = {
                type: _fill.type,
                bgcolor: colorFormat(_color),
                forecolor: _fill.forecolor,
                patternType: _fill.patternType,
                gradientType: _fill.gradientType,
                gradientDriection: _fill.gradientDriection
            }
        }
    },
    setFontColor: function (_color) {
        var _o = openPlant.v.openplant_script_object;
        openPlant.v.openplant_script_propertyChanges.push([_o,
            openPlant.GraphConst.TEXT_PROPERTY_TEXTCOLOR,
            _o[openPlant.GraphConst.TEXT_PROPERTY_TEXTCOLOR]]);
        _o[openPlant.GraphConst.TEXT_PROPERTY_TEXTCOLOR] = colorFormat(_color);
    },
    setLine: function (_color) {
        var _o = openPlant.v.openplant_script_object;
        var style = _o[openPlant.GraphConst.SHAPE_PROPERTY_STROKE];
        var lineWidth = 1;
        var strokeStyle = 0;
        if (style) {
            lineWidth = style.strokeWidth;
            strokeStyle = style.strokeStyle;
        }
        openPlant.v.openplant_script_propertyChanges.push([_o, openPlant.GraphConst.SHAPE_PROPERTY_STROKE, _o[openPlant.GraphConst.SHAPE_PROPERTY_STROKE]]);
        _o[openPlant.GraphConst.SHAPE_PROPERTY_STROKE] = {
            strokeWidth: lineWidth, strokeStyle: strokeStyle, color: colorFormat(_color)
        }
    },

    setText: function (_text) {
        var _o = openPlant.v.openplant_script_object;
        openPlant.v.openplant_script_propertyChanges.push([_o, openPlant.GraphConst.TEXT_PROPERTY_TEXTCONTEXT, _o[openPlant.GraphConst.TEXT_PROPERTY_TEXTCONTEXT]]);
        _o[openPlant.GraphConst.TEXT_PROPERTY_TEXTCONTEXT] = _text + "";
    },

    setVisible: function (_visible) {
        if (String(_visible) == "true" || String(_visible) == "false") {
            var _o = openPlant.v.openplant_script_object;
            openPlant.v.openplant_script_propertyChanges.push([_o, openPlant.GraphConst.ELEMENT_PROPERTY_VISIBLE, _o[openPlant.GraphConst.ELEMENT_PROPERTY_VISIBLE]]);
            _o[openPlant.GraphConst.ELEMENT_PROPERTY_VISIBLE] = openPlant.GraphElement.parse_Boolean(_visible);
        } else {
            log("Script exception:" + _visible + " error ");
        }
    },

    setValue: function (_uri, _value) {
        socket.emit('setValue', {key: _uri, value: _value});
    },
    showCTRL: function (_uri) {
        socket.emit('loadPoint', {cols: ["ID", "GN", "RT", "AV"], pointNames: [_uri]});
    },
    changePage: function (_url) {
        openPlant.v.openplant_script_activite_graph._script_changepage(_url);
    }
}

var g = openPlant.ScriptGlobalUtils;


// ////////////////////////////////////////////////////////
// ///////////条件对象
// ////////////////////////////////////////////////////////
var ON = openPlant.v.openplant_maskerMap["ON"];
var OFF = openPlant.v.openplant_maskerMap["OFF"];
var ON0 = openPlant.v.openplant_maskerMap["ON0"];
var OFF0 = openPlant.v.openplant_maskerMap["OFF0"];
var ON1 = openPlant.v.openplant_maskerMap["ON1"];
var OFF1 = openPlant.v.openplant_maskerMap["OFF1"];
var ON2 = openPlant.v.openplant_maskerMap["ON2"];
var OFF2 = openPlant.v.openplant_maskerMap["OFF2"];
var ON3 = openPlant.v.openplant_maskerMap["ON3"];
var OFF3 = openPlant.v.openplant_maskerMap["OFF3"];
var ON4 = openPlant.v.openplant_maskerMap["ON4"];
var OFF4 = openPlant.v.openplant_maskerMap["OFF4"];
var ON5 = openPlant.v.openplant_maskerMap["ON5"];
var OFF5 = openPlant.v.openplant_maskerMap["OFF5"];
var ON6 = openPlant.v.openplant_maskerMap["ON6"];
var OFF6 = openPlant.v.openplant_maskerMap["OFF6"];
var ON7 = openPlant.v.openplant_maskerMap["ON7"];
var OFF7 = openPlant.v.openplant_maskerMap["OFF7"];
var ON8 = openPlant.v.openplant_maskerMap["ON8"];
var OFF8 = openPlant.v.openplant_maskerMap["OFF8"];
var ON9 = openPlant.v.openplant_maskerMap["ON9"];
var OFF9 = openPlant.v.openplant_maskerMap["OFF9"];

var ON10 = openPlant.v.openplant_maskerMap["ON10"];
var OFF10 = openPlant.v.openplant_maskerMap["OFF10"];
var ON11 = openPlant.v.openplant_maskerMap["ON11"];
var OFF11 = openPlant.v.openplant_maskerMap["OFF11"];
var ON12 = openPlant.v.openplant_maskerMap["ON12"];
var OFF12 = openPlant.v.openplant_maskerMap["OFF12"];
var ON13 = openPlant.v.openplant_maskerMap["ON13"];
var OFF13 = openPlant.v.openplant_maskerMap["OFF13"];
var ON14 = openPlant.v.openplant_maskerMap["ON14"];
var OFF14 = openPlant.v.openplant_maskerMap["OFF14"];
var ON15 = openPlant.v.openplant_maskerMap["ON15"];
var OFF15 = openPlant.v.openplant_maskerMap["OFF15"];
var ON16 = openPlant.v.openplant_maskerMap["ON16"];
var OFF16 = openPlant.v.openplant_maskerMap["OFF16"];
var ON17 = openPlant.v.openplant_maskerMap["ON17"];
var OFF17 = openPlant.v.openplant_maskerMap["OFF17"];
var ON18 = openPlant.v.openplant_maskerMap["ON18"];
var OFF18 = openPlant.v.openplant_maskerMap["OFF18"];
var ON19 = openPlant.v.openplant_maskerMap["ON19"];
var OFF19 = openPlant.v.openplant_maskerMap["OFF19"];

var ON20 = openPlant.v.openplant_maskerMap["ON20"];
var OFF20 = openPlant.v.openplant_maskerMap["OFF20"];
var ON21 = openPlant.v.openplant_maskerMap["ON21"];
var OFF21 = openPlant.v.openplant_maskerMap["OFF21"];
var ON22 = openPlant.v.openplant_maskerMap["ON22"];
var OFF22 = openPlant.v.openplant_maskerMap["OFF22"];
var ON23 = openPlant.v.openplant_maskerMap["ON23"];
var OFF23 = openPlant.v.openplant_maskerMap["OFF23"];
var ON24 = openPlant.v.openplant_maskerMap["ON24"];
var OFF24 = openPlant.v.openplant_maskerMap["OFF24"];
var ON25 = openPlant.v.openplant_maskerMap["ON25"];
var OFF25 = openPlant.v.openplant_maskerMap["OFF25"];
var ON26 = openPlant.v.openplant_maskerMap["ON26"];
var OFF26 = openPlant.v.openplant_maskerMap["OFF26"];
var ON27 = openPlant.v.openplant_maskerMap["ON27"];
var OFF27 = openPlant.v.openplant_maskerMap["OFF27"];
var ON28 = openPlant.v.openplant_maskerMap["ON28"];
var OFF28 = openPlant.v.openplant_maskerMap["OFF28"];
var ON29 = openPlant.v.openplant_maskerMap["ON29"];
var OFF29 = openPlant.v.openplant_maskerMap["OFF29"];

var ON30 = openPlant.v.openplant_maskerMap["ON30"];
var OFF30 = openPlant.v.openplant_maskerMap["OFF30"];
var ON31 = openPlant.v.openplant_maskerMap["ON31"];
var OFF31 = openPlant.v.openplant_maskerMap["OFF31"];

// common shared
var HDWRFAIL = openPlant.v.openplant_maskerMap["HDWRFAIL"];
var BAD = openPlant.v.openplant_maskerMap["BAD"];
var POOR = openPlant.v.openplant_maskerMap["POOR"];
var FAIR = openPlant.v.openplant_maskerMap["FAIR"];
var GOOD = openPlant.v.openplant_maskerMap["GOOD"];
var NORMAL = openPlant.v.openplant_maskerMap["NORMAL"];
var ALARM = openPlant.v.openplant_maskerMap["ALARM"];
var ALARMACK = openPlant.v.openplant_maskerMap["ALARMACK"];
var ALARMOFF = openPlant.v.openplant_maskerMap["ALARMOFF"];
var CUTOUT = openPlant.v.openplant_maskerMap["CUTOUT"];
var SCANOFF = openPlant.v.openplant_maskerMap["SCANOFF"];
var ENTERVALUE = openPlant.v.openplant_maskerMap["ENTERVALUE"];
// DU Alarm
var DROPALM = openPlant.v.openplant_maskerMap["DROPALM"];
var DROPCLEAR = openPlant.v.openplant_maskerMap["DROPCLEAR"];
var DROPFAULT = openPlant.v.openplant_maskerMap["DROPFAULT"];
var MCB0OFFLIN = openPlant.v.openplant_maskerMap["MCB0OFFLIN"];
var MCB1OFFLIN = openPlant.v.openplant_maskerMap["MCB1OFFLIN"];
var UPDATETIME = openPlant.v.openplant_maskerMap["UPDATETIME"];
var OPATTN = openPlant.v.openplant_maskerMap["OPATTN"];
// LA
var LIMITOFF = openPlant.v.openplant_maskerMap["LIMITOFF"];
var HIGHALARM = openPlant.v.openplant_maskerMap["HIGHALARM"];
var LOWALARM = openPlant.v.openplant_maskerMap["LOWALARM"];
var HHALARM = openPlant.v.openplant_maskerMap["HIGHALARM"];
var LLALARM = openPlant.v.openplant_maskerMap["LOWALARM"];
var SENSORALM = openPlant.v.openplant_maskerMap["SENSORALM"];
var SENSORMODE = openPlant.v.openplant_maskerMap["SENSORMODE"];
var BETTER = openPlant.v.openplant_maskerMap["BETTER"];
var WORSE = openPlant.v.openplant_maskerMap["WORSE"];
// LD
var RESET = openPlant.v.openplant_maskerMap["RESET"];
var SET = openPlant.v.openplant_maskerMap["SET"];
var SETALM = openPlant.v.openplant_maskerMap["SETALM"];
var RESETALM = openPlant.v.openplant_maskerMap["RESETALM"];
var TOGGLE = openPlant.v.openplant_maskerMap["TOGGLE"];


// ////////////////////////////////////////////
// //////////function
// ////////////////////////////////////////////


var av = function (_name) {
    return g.av(_name);
}

var as = function (_name) {
    return g.as(_name);
}

var avmask = function (_name, _mask) {
    return g.avmask(_name, _mask);
}

var asmask = function (_name, _mask) {
    return g.asmask(_name, _mask);
}

var bv = function (_name) {
    return g.bv(_name);
}

var tv = function (_name) {
    return g.tv(_name);
}

// action
var setbg = function (_color) {
    return g.setbgColor(_color);
}

var setbgColor = function (_color) {
    return g.setbgColor(_color);
}


var setfontColor = function (_color) {
    return g.setFontColor(_color);
}

var setFontColor = function (_color) {
    return g.setFontColor(_color);
}


var setline = function (_color) {
    return g.setLine(_color);
}
var setLine = function (_color) {
    return g.setLine(_color);
}

var settext = function (_text) {
    return g.setText(_text);
}
var setText = function (_text) {
    return g.setText(_text);
}

var setvisible = function (_v) {
    return g.setVisible(_v);
}

var setVisible = function (_v) {
    return g.setVisible(_v);
}

var setValue = function (_uri, _value) {
    return g.setValue(_uri, _value);
}

var showCTRL = function (_uri) {
    return g.showCTRL(_uri);
}

// ////////////////////////////////////////
// ////////mouse
// ////////////////////////////////////////
var changepage = function (_url) {
    return g.changePage(_url);
}

var changePage = function (_url) {
    return g.changePage(_url);
}


Array.prototype.unique = function () {
    if (this.length > 0) {
        this.sort();
        var re = [this[0]];
        for (var i = 1; i < this.length; i++) {
            if (this[i] !== re[re.length - 1]) {
                re.push(this[i]);
            }
        }
        return re;
    }
    return this;
}

openPlant.GraphUtils = {
    trim: function (_str) {
        return _str.replace(/(^\s*)|(\s*$)/g, "");
    },
    nullFunction: function () {
        return false;
    },
    createFunction: function (obj, strFunc) {
        var args = [];
        for (var i = 2; i < arguments.length; i++)
            args.push(arguments[i]);
        return function () {
            strFunc.apply(obj, args);
        }
    },
    getDateFormat: function (_format_index) {
        switch (_format_index) {
            case 0 :
                return "mm:ss";
            case 1 :
                return "mm";
            case 2 :
                return "hh";
            case 3 :
                return "hh:mm:ss";
            case 4 :
                return "yyyy-MM-dd hh:mm:ss";
            case 5 :
                return "yyyy-MM-dd";
            case 6 :
                return "MM-dd";
            case 7 :
                return "MM-dd-yy";
            case 8 :
                return "EEE";
        }
    },

    dateformat: function (_date, _format) {
        var o = {
            "M+": _date.getMonth() + 1, // month
            "d+": _date.getDate(), // day
            "h+": _date.getHours(), // hour
            "m+": _date.getMinutes(), // minute
            "s+": _date.getSeconds(), // second
            "q+": Math.floor((_date.getMonth() + 3) / 3), // quarter
            "S": _date.getMilliseconds()
            // millisecond
        }

        var week = {
            "0": "\u65e5",
            "1": "\u4e00",
            "2": "\u4e8c",
            "3": "\u4e09",
            "4": "\u56db",
            "5": "\u4e94",
            "6": "\u516d"
        };

        if (/(y+)/.test(_format)) {
            _format = _format.replace(RegExp.$1, (_date.getFullYear() + "")
                .substr(4 - RegExp.$1.length));
        }

        if (/(E+)/.test(_format)) {
            _format = _format.replace(RegExp.$1,
                ((RegExp.$1.length > 1) ? (RegExp.$1.length > 2
                        ? "\u661f\u671f"
                        : "\u5468") : "")
                + week[_date.getDay() + ""]);
        }

        for (var k in o) {
            if (new RegExp("(" + k + ")").test(_format)) {
                _format = _format.replace(RegExp.$1, RegExp.$1.length == 1
                    ? o[k]
                    : ("00" + o[k]).substr(("" + o[k]).length));
            }
        }
        return _format;
    },

    angle: function (_a) {
        return (Math.PI / 180) * _a;
    },
    gradient: function (canvas_context, _bounds, _fill) {
        var vx = _bounds.x;
        var vy = _bounds.y;
        var vw = _bounds.w;
        var vh = _bounds.h;
        var _bc = _fill.bgcolor;
        var _ptColor = _fill.forecolor;
        var _type = _fill.gradientType;
        var _direction = _fill.gradientDriection;
        var grd;
        switch (_type) {
            case 0 : // Horizental
                var vy2 = vy + vh;
                grd = canvas_context.createLinearGradient(0, vy, 0, vy2);
                break;
            case 1 : // Vertical
                var vx2 = vx + vw;
                grd = canvas_context.createLinearGradient(vx, 0, vx2, 0);
                break;
            case 2 : // Diagonal up
                var vx2 = vx + vw;
                var vy2 = vy + vh;
                grd = canvas_context.createLinearGradient(vx, vy, vx2, vy2);
                break;
            case 3 : // Diagonal down
                grd = canvas_context.createLinearGradient(vx, vy + vh, vx + vw,
                    vy);
                break;
            default :
                break;
        }
        if (grd) {
            switch (_direction) {
                case 0 :
                    grd.addColorStop(0, _bc);
                    grd.addColorStop(1, _ptColor);
                    canvas_context.fillStyle = grd;
                    break;
                case 1 :
                    grd.addColorStop(0, _ptColor);
                    grd.addColorStop(1, _bc);
                    canvas_context.fillStyle = grd;
                    break;
                case 2 :
                    grd.addColorStop(0, _bc);
                    grd.addColorStop(0.5, _ptColor);
                    grd.addColorStop(1, _bc);
                    canvas_context.fillStyle = grd;
                    break;
                case 3 :
                    grd.addColorStop(0, _ptColor);
                    grd.addColorStop(0.5, _bc);
                    grd.addColorStop(1, _ptColor);
                    canvas_context.fillStyle = grd;
                    break;
                default :
                    break;
            }
        }
    },
    getElementBounds: function (_object) {
        var _exact_bounds = _object[openPlant.GraphConst.ELEMENT_PROPERTY_EXACT_BOUNDS];
        if (_exact_bounds) {
            return _exact_bounds;
        }
        return _object[openPlant.GraphConst.ELEMENT_PROPERTY_BOUNDS];
    },

    getSelectedElements: function (_dataContainer, _x, _y, _canvas_width, _canvas_height) {
        var _select_object = [];
        _dataContainer.foreach(function (_object) {
            var _bounds = openPlant.GraphUtils.getElementBounds(_object);
            var _class = (_object["class"]);
            if (openPlant.GraphUtils.isContain(_class, openPlant.GraphConst.DEFAULT_IRREGULARITY_GRAPH)) {
                if (openPlant.dotted.isInnerPath(_x, _y, _object, _canvas_width, _canvas_height)) {
                    _select_object.push(_object);
                }
            } else {
                if (_bounds) {
                    var x1 = _bounds.x;
                    var y1 = _bounds.y;
                    var w1 = _bounds.w;
                    var h1 = _bounds.h;
                    if (_x >= x1 && _x <= x1 + w1 && _y >= y1 && _y <= y1 + h1) {
                        _select_object.push(_object);
                    }
                }
            }
        });
        return _select_object;
    },

    getDCSNameFromScript: function (expression, _points) {
        var r, i = 0;
        while (r = openPlant.GraphConst.PATT_POINT_NAME.exec(expression)) {
            var _pointName = r[0];
            while (t = openPlant.GraphConst.PATT_DCSPOINT_NAME.exec(_pointName)) {
                _points.push(t[0]); // 添加到最后
            }
        }
        return _points;
    },
    // start : long
    getReplayHistorySnap: function (_statics, _his_datas, _start, _end) {
        var _return_object = new Object();
        var _begin = _start;
        while (_begin <= _end) {
            var _hisSnap = new Object();// pn ---> hisdata
            for (var _pn in _his_datas) {
                var _single_his_datas = _his_datas[_pn];
                if (_single_his_datas
                    && _single_his_datas.constructor === Array
                    && _single_his_datas.length > 0) {
                    if (_statics[_pn] && _statics[_pn].RT) {
                        var _rt = _statics[_pn].RT;
                        var _math_data = this._getReplayHistorySnapData(_start,
                            _begin, _single_his_datas, _rt);
                        _hisSnap[_pn] = _math_data;
                    } else {
                        _hisSnap[_pn] = null;
                    }
                } else {
                    if (_statics[_pn] && _statics[_pn].RT) {
                        // 设置数据结果集为无数据
                        var _re_data = new Object();
                        _re_data["TM"] = _begin * 1000;
                        _re_data["AV"] = null;
                        _hisSnap[_pn] = _re_data;
                    } else {
                        _hisSnap[_pn] = null;
                    }
                }// if
            }// for
            _return_object[_begin] = _hisSnap;
            _begin = _begin + 1;
        }// while
        return _return_object;
    },

    /**
     * _request_time long 请求时间 _his_array Array 历史数组
     *
     * return 一个点一个时刻的差值_data_array Array : time,status,value
     */
    _getReplayHistorySnapData: function (_start, _request_time, _his_array, _rt) {
        var _re_data = new Object();
        _re_data["TM"] = _request_time * 1000;
        for (var _i = 0; _i < _his_array.length; _i++) {
            var _his_data = _his_array[_i];
            var _data_time = parseInt(_his_data["TM"]) + _start;
            var _value = _his_data["AV"];
            var _data_as = _his_data["AS"];
            _re_data["AS"] = _data_as;
            if ((_request_time == _data_time)) {
                return _his_array[_i];
            } else if (_request_time < _data_time) {// 请求时间小于本次迭代出的数据时间
                // 差分
                if (_i > 0 && _his_array[_i - 1]) {// 数据集不是第一个
                    var _before_time = parseInt(_his_array[_i - 1]["TM"])
                        + _start;

                    if (_request_time > _before_time) {// 请求的数据时间大于前一个时间且小于当前迭代出数据的时间

                        // 检查数据测点的质量是否为timeout 状态，timeout 状态的数据值不填充，显示N/D
                        _as = _data_as & 0x0FFFF;
                        if ((_as >> 15 & 1 == 1) || (_as >> 14 & 1 == 1)) {
                            _re_data["AV"] = null;
                            return _re_data;
                        } else {// 其他状态的数据进行处理
                            if (_rt == "AX" || _rt == "R8") {
                                var _before_value = _his_array[_i - 1]["AV"];
                                var _math_value = _before_value
                                    + (_value - _before_value)
                                    * (_request_time - _before_time)
                                    / (_data_time - _before_time);
                                _re_data["AV"] = _math_value;
                            } else {
                                _re_data["AV"] = _value;
                            }
                            return _re_data;
                        }

                    } else {
                        return _re_data;
                    }
                } else {
                    return _re_data;
                }
                // 不满足上述内容的 直接退出循环
                break;
            }
        }
        _re_data["AV"] = null;
        return _re_data;
    },

    toString: function () {
        return 'openplant utils';
    },
    /**
     *   判断数组中是否包含 给定的字段
     * @param _class
     * @param objs
     * @returns {boolean}
     */
    isContain: function (_class, arrays) {
        var _classs = arrays;
        return _classs.some(function (x) {
            return x == _class;
        });
    }
}

openPlant.OPConst = {
    isIE: function () {
        return navigator.userAgent.toLowerCase().indexOf("msie") > -1;
    }(),
    isLowIE: function () {
        // IE8 IE7 IE6
        if ((navigator.userAgent.toLowerCase().indexOf("msie") > -1)
            && document.documentMode <= 8) {
            return true;
        } else {
            return false;
        }
    }(),
    isHighIE: function () {
        if ((navigator.userAgent.toLowerCase().indexOf("msie") > -1)
            && document.documentMode >= 8) {
            return true;
        } else {
            return false;
        }
    }(),
    is_cs: function () {
        if ((navigator.userAgent.toLowerCase().indexOf("msie") > 1)) {
            if (document.documentMode) {
                if (document.documentMode > 8) {
                    return true;
                } else {
                    return false;
                }
            } else {
                return false;
            }
        } else {
            return true;
        }
    }(),
    isSafari: function () {
        if ((window.navigator.userAgent.indexOf("Safari") >= 0 && window.navigator.userAgent
                .indexOf("Chrome") == -1)) {
            return true;
        } else {
            return false;
        }
    }()
}
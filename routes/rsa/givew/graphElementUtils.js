var fs = require("fs");
var zlib = require('zlib');
var Buffer = require('buffer').Buffer;
var path = require('path');
var Stream = require('stream')
var xml2obj = require('xml2obj-stream');
var async = require("async");
var domParser = require('xmldom').DOMParser;

var debug = function (message) {
    console.log(message);
}

var GraphConst = {
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
    TYPE_DASPO: 101,
    TYPE_TIME: 102,
    TYPE_CALCPO: 103,

    TYPE_PIE_CHART: 150,
    TYPE_BAR_CHART: 151,

    TYPE_BAR: 200,
    TYPE_TREND: 201,
    TYPE_AREA: 202,
    TYPE_DIAL_CHART: 203,

    TYPE_GRID: 210,
    TYPE_WEBVIEW: 220,
    TYPE_COMBOBOX: 230,
    TYPE_CHECKBOX: 231,

    TYPE_TEXTFIELD: 240,
    TYPE_PASSWORD_TEXTFIELD: 241,


    //background
    BACKGROUND_DRAWFILL: "background.drawfill",
    BACKGROUND_MINSIZE: "background.minsize",
    BACKGROUND_CURRENTSIZE: "background.currentsize",
    BACKGROUND_IMAGE_URL: "background.image.url",


    BACKGROUND_DRAWFILL_V2: "fill",
    BACKGROUND_MINSIZE_V2: "minsize",
    BACKGROUND_CURRENTSIZE_V2: "size",
    BACKGROUND_IMAGE_URL_V2: "url",


    // base

    ELEMENT_PROPERTY_BOUNDS: "base.bounds",
    ELEMENT_PROPERTY_REFRESH_SCRIPT: "base.refresh.script",
    ELEMENT_PROPERTY_MOUSEEVENT_SCRIPT: "base.mouseevent.script",
    ELEMENT_PROPERTY_Z_INDEX: "base.z.index",


    ELEMENT_CLASS: "class",
    ELEMENT_REF: "ref",
    ELEMENT_PREF: "pref",

    ELEMENT_PROPERTY_BOUNDS_V2: "bounds",
    ELEMENT_PROPERTY_REFRESH_SCRIPT_V2: "onPaint",
    ELEMENT_PROPERTY_MOUSEEVENT_SCRIPT_V2: "onClick",
    ELEMENT_PROPERTY_Z_INDEX_V2: "zIndex",


    // group
    GROUP_PROPERTY_VAR: "group.var",
    GROUP_PROPERTY_VAR_V2: "var",

    // garea
    AREA_PROPERTY_BACKGROUND_IMAGEURL: "area.background.imageurl",

    AREA_PROPERTY_BACKGROUND_IMAGEURL_V2: "url",


    // shape
    SHAPE_PROPERTY_FILL: "shape.fill",
    SHAPE_PROPERTY_STROKE: "shape.stroke",


    SHAPE_PROPERTY_FILL_V2: "fill",
    SHAPE_PROPERTY_STROKE_V2: "stroke",

    // rect
    RECTANGLE_PROPERTY_ARCW: "rectangle.arcw",
    RECTANGLE_PROPERTY_ARCH: "rectangle.arch",
    RECTANGLE_PROPERTY_3D: "rectangle.3d",

    RECTANGLE_PROPERTY_ARCW_V2: "arcw",
    RECTANGLE_PROPERTY_ARCH_V2: "arch",

    // PolyLine
    POLYLINE_PROPERTY_POINTS: "polyline.points",

    POLYLINE_PROPERTY_POINTS_V2: "points",

    // Arc
    ARC_PROPERTY_TYPE: "arc.type",
    ARC_PROPERTY_START: "arc.start",
    ARC_PROPERTY_EXTENT: "arc.extent",

    ARC_PROPERTY_TYPE_V2: "type",
    ARC_PROPERTY_START_V2: "start",
    ARC_PROPERTY_EXTENT_V2: "extent",


    // text
    TEXT_PROPERTY_TEXTCONTEXT: "text.textcontext",
    TEXT_PROPERTY_ALIGN: "text.align",
    TEXT_PROPERTY_TEXTFONT: "text.textfont",
    TEXT_PROPERTY_TEXTCOLOR: "text.textcolor",
    TEXT_PROPERTY_FILL_VISIBLE: "text.fill.visible",
    TEXT_PROPERTY_STROKE_VISIBLE: "text.stroke.visible",

    TEXT_PROPERTY_TEXTCONTEXT_V2: "text",
    TEXT_PROPERTY_ALIGN_V2: "align",
    TEXT_PROPERTY_TEXTFONT_V2: "font",
    TEXT_PROPERTY_TEXTCOLOR_V2: "color",
    TEXT_PROPERTY_FILL_VISIBLE_V2: "showFill",
    TEXT_PROPERTY_STROKE_VISIBLE_V2: "showBorder",


    // image
    IMAGE_PROPERTY_URL: "image.url",
    IMAGE_PROPERTY_URL_V2: "url",


    // number
    NUMBER_PROPERTY_DOTCOUNT: "number.dotcount",
    NUMBER_PROPERTY_DIGIT: "number.digit",
    NUMBER_PROPERTY_SCIENCE: "number.science",

    NUMBER_PROPERTY_DOTCOUNT_V2: "fm",
    NUMBER_PROPERTY_DIGIT_V2: "digit",
    NUMBER_PROPERTY_SCIENCE_V2: "science",

    // dash point
    DASHPOINT_PROPERTY_POINTNAME: "dashpoint.pointname",
    DASHPOINT_PROPERTY_POINTFIELDNAME: "dashpoint.pointfieldname",
    DASHPOINT_PROPERTY_VALUE: "dashpoint.value",
    DASHPOINT_PROPERTY_INFO: "dashpoint.info",
    DASHPOINT_PROPERTY_TREND_POINTNAMES: "dashpoint.trend.pointnames",


    DASHPOINT_PROPERTY_POINTNAME_V2: "tag",
    DASHPOINT_PROPERTY_POINTFIELDNAME_V2: "field",
    DASHPOINT_PROPERTY_VALUE_V2: "value",
    DASHPOINT_PROPERTY_INFO_V2: "info",
    DASHPOINT_PROPERTY_TREND_POINTNAMES_V2: "onTrend",


    // calc point
    CALCPOINT_PROPERTY_EXPRESSION: "calcpoint.expression",
    CALCPOINT_PROPERTY_EXPRESSIONRESULT: "calcpoint.expressionresult",

    CALCPOINT_PROPERTY_EXPRESSION_V2: "ex",


    // time
    TIME_PROPERTY_FORMAT: "time.format",
    TIME_PROPERTY_VALUE: "time.value",

    TIME_PROPERTY_FORMAT_V2: "format",
    TIME_PROPERTY_VALUE_V2: "value",

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
    BAR_DIRECTION: "bar.direction",

    BAR_VALUE_V2: "value",
    BAR_HIGH_LIMIT_V2: "high",
    BAR_LOW_LIMIT_V2: "low",

    BAR_LOW_TYPE_V2: "lowType",
    BAR_LOW_POINTNAME_V2: "lowTag",
    BAR_LOW_POINTFIELD_V2: "lowField",

    BAR_HIGH_TYPE_V2: "highType",
    BAR_HIGH_POINTNAME_V2: "highTag",
    BAR_HIGH_POINTFIELD_V2: "highField",

    BAR_VALUE_FILL_V2: "valueFill",
    BAR_BACK_FILL_V2: "backFill",
    BAR_DIRECT_V2: "direct",
    BAR_DIRECTION_V2: "desc",


    // dialchart
    DIALCHART_VALUE: "dialchart.value",
    DIALCHART_HIGH_LIMIT: "dialchart.high.limit",
    DIALCHART_LOW_LIMIT: "dialchart.low.limit",
    DIALCHART_BACKGROUND_COLOR: "dialchart.background.color",
    DIALCHART_EU_TEXT: "dialchart.eu.text",
    DIALCHART_GRADUATION_FONT: "dialchart.graduation.font",
    DIALCHART_DOTCOUNT: "dialchart.dotcount",
    DIALCHART_NUMBER_DOTCOUNT: "dialchart.number.dotcount",
    DIALCHART_TYPE: "dialchart.type",

    DIALCHART_VALUE_V2: "value",
    DIALCHART_HIGH_LIMIT_V2: "high",
    DIALCHART_LOW_LIMIT_V2: "low",
    DIALCHART_BACKGROUND_COLOR_V2: "bg",
    DIALCHART_EU_TEXT_V2: "eu",
    DIALCHART_GRADUATION_FONT_V2: "font",
    DIALCHART_DOTCOUNT_V2: "fm",
    DIALCHART_NUMBER_DOTCOUNT_V2: "numberDotcount",
    DIALCHART_TYPE_V2: "type",


    // pie
    CHART_PROPERTY_POINTN_LIST: "chart.point.list",
    BARCHART_PROPERTY_REALTIME: "barchart.point.realtime",


    PIE_PROPERTY_POINTNCOLOR_LIST: "pie.pointcolor.list",
    PIE_PROPERTY_HOLLOW_PERCENT: "pie.hollow.precent",

    PIE_PROPERTY_LEGEND_LOCATION: "piechart.legend.direction",

    PIECHART_PROPERTY_POINTN_LISTINFO: "piechart.point.listinfo",
    PIECHART_PROPERTY_REALTIME: "piechart.point.realtime",
    PIECHART_BACKGROUND_COLOR: "piechart.background.color",
    PIECHART_DIRECTION: "piechart.direction",
    PIECHART_GRADUATION_FONT: "piechart.graduation.font",
    PIECHART_TYPE: "piechart.type",
    PIECHART_STYLE: "piechart.style",


    CHART_PROPERTY_POINTN_LIST_V2: "tags",

    BARCHART_PROPERTY_REALTIME_V2: "realtime",

    PIE_PROPERTY_POINTNCOLOR_LIST_V2: "colors",
    PIE_PROPERTY_HOLLOW_PERCENT_V2: "hollow",
    PIE_PROPERTY_LEGEND_LOCATION_V2: "location",

    PIECHART_PROPERTY_POINTN_LISTINFO_V2: "listinfo",
    PIECHART_PROPERTY_REALTIME_V2: "realtime",
    PIECHART_BACKGROUND_COLOR_V2: "color",
    PIECHART_DIRECTION_V2: "desc",
    PIECHART_GRADUATION_FONT_V2: "font",
    PIECHART_TYPE_V2: "type",
    PIECHART_STYLE_V2: "style",


    // barchart
    BARCHART_PROPERTY_POINTN_LISTINFO: "barchart.point.listinfo",
    BARCHART_BACKGROUND_COLOR: "barchart.background.color",
    BARCHART_DIRECTION: "barchart.direction",
    BARCHART_HIGH_LIMIT: "barchart.high.limit",
    BARCHART_LOW_LIMIT: "barchart.low.limit",
    BARCHART_SECOND_HIGH_LIMIT: "barchart.second.high.limit",
    BARCHART_SECOND_LOW_LIMIT: "barchart.second.low.limit",
    BARCHART_TYPE: "barchart.type",
    BARCHART_GRADUATION_FONT: "barchart.graduation.font",
    BARCHART_STYLE: "barchart.style",


    BARCHART_PROPERTY_POINTN_LISTINFO_V2: "listinfo",
    BARCHART_BACKGROUND_COLOR_V2: "color",
    BARCHART_DIRECTION_V2: "desc",
    BARCHART_HIGH_LIMIT_V2: "high",
    BARCHART_LOW_LIMIT_V2: "low",
    BARCHART_SECOND_HIGH_LIMIT_V2: "second.high",
    BARCHART_SECOND_LOW_LIMIT_V2: "second.low",
    BARCHART_TYPE_V2: "type",
    BARCHART_GRADUATION_FONT_V2: "font",
    BARCHART_STYLE_V2: "style",

    // grid
    GRID_COLUMN: "grid.column",
    GRID_ROW: "grid.row",
    GRID_LINESTROKE: "grid.linestroke",

    GRID_COLUMN_V2: "column",
    GRID_ROW_V2: "row",
    GRID_LINESTROKE_V2: "lineStyle",

    // trend
    TREND_PROPERTY_TYPE_OBJECT: "trend.typeobject",
    TREND_PROPERTY_DURATION: "trend.duration",
    TREND_PROPERTY_TEXTFONT: "trend.textfont",
    TREND_PROPERTY_INNER_TOP_MARGIN: "trend.inner.top.margin",
    TREND_PROPERTY_INNER_BOTTOM_MARGIN: "trend.inner.bottom.margin",
    TREND_PROPERTY_INNER_LEFT_MARGIN: "trend.inner.left.margin",

    TREND_PROPERTY_TIME_AXIS_MIN_COUNT: "trend.axis.count",
    TREND_PROPERTY_GRID_X_COUNT: "trend.grid.x.count",
    TREND_PROPERTY_GRID_Y_COUNT: "trend.grid.y.count",
    TREND_PROPERTY_GRID_STROKE: "trend.grid.stroke",
    TREND_PROPERTY_TIME_FORMAT: "trend.time.format",
    TREND_PROPERTY_COLOR_FILLGROUND: "trend.color.fillground",
    TREND_PROPERTY_COLOR_INBORDER: "trend.color.inborder",

    TREND_PROPERTY_LEGEND_LOCATION: "trend.legend.location",
    TREND_PROPERTY_LEGEND_WIDTH: "trend.legend.singleWidth",
    TREND_PROPERTY_LEGEND_STYLE: "trend.legend.style",

    TREND_PROPERTY_SCALE_MIN_LEFT: "trend.scale.min.left",
    TREND_PROPERTY_SCALE_MAX_LEFT: "trend.scale.max.left",
    TREND_PROPERTY_SCALE_MIN_RIGHT: "trend.scale.min.right",
    TREND_PROPERTY_SCALE_MAX_RIGHT: "trend.scale.max.right",
    TREND_PROPERTY_LIST_TRENDPOINTS: "trend.list.trendpoints",
    TREND_PROPERTY_LIST_TYPE: "trend.list.type",
    TREND_PROPERTY_LIST_BEGIN: "trend.list.begin",
    TREND_PROPERTY_LIST_END: "trend.list.end",


    TREND_PROPERTY_TYPE_OBJECT_V2: "typeobject",
    TREND_PROPERTY_DURATION_V2: "duration",
    TREND_PROPERTY_TEXTFONT_V2: "font",
    TREND_PROPERTY_INNER_TOP_MARGIN_V2: "top",
    TREND_PROPERTY_INNER_BOTTOM_MARGIN_V2: "bottom",
    TREND_PROPERTY_INNER_LEFT_MARGIN_V2: "left",

    TREND_PROPERTY_TIME_AXIS_MIN_COUNT_V2: "axis",
    TREND_PROPERTY_GRID_X_COUNT_V2: "gridX",
    TREND_PROPERTY_GRID_Y_COUNT_V2: "gridY",
    TREND_PROPERTY_GRID_STROKE_V2: "gridStroke",
    TREND_PROPERTY_TIME_FORMAT_V2: "timeFormat",
    TREND_PROPERTY_COLOR_FILLGROUND_V2: "groundColor",
    TREND_PROPERTY_COLOR_INBORDER_V2: "inborderColor",

    TREND_PROPERTY_LEGEND_LOCATION_V2: "legendLocation",
    TREND_PROPERTY_LEGEND_WIDTH_V2: "singleWidth",
    TREND_PROPERTY_LEGEND_STYLE_V2: "style",

    TREND_PROPERTY_SCALE_MIN_LEFT_V2: "minL",
    TREND_PROPERTY_SCALE_MAX_LEFT_V2: "maxL",
    TREND_PROPERTY_SCALE_MIN_RIGHT_V2: "minR",
    TREND_PROPERTY_SCALE_MAX_RIGHT_V2: "maxR",
    TREND_PROPERTY_LIST_TRENDPOINTS_V2: "trendpoints",
    TREND_PROPERTY_LIST_TYPE_V2: "type",
    TREND_PROPERTY_LIST_BEGIN_V2: "begin",
    TREND_PROPERTY_LIST_END_V2: "end",


    // GJComponent
    WEBVIEW_PROPERTY_URL: "webview.url",

    COMBOBOX_PROPERTY_ITEMS: "combobox.items",
    COMBOBOX_PROPERTY_CHANGE_SCRIPT: "combobox.change.script",

    CHECKBOX_PROPERTY_TEXT: "checkbox.text",
    CHECKBOX_PROPERTY_SELECT: "checkbox.select",
    CHECKBOX_PROPERTY_CHANGE_SCRIPT: "checkbox.change.script",

    TEXTFIELD_PROPERTY_TEXT: "textfield.text",


    WEBVIEW_PROPERTY_URL_V2: "url",

    COMBOBOX_PROPERTY_ITEMS_V2: "items",
    COMBOBOX_PROPERTY_CHANGE_SCRIPT_V2: "onChange",

    CHECKBOX_PROPERTY_TEXT_V2: "text",
    CHECKBOX_PROPERTY_SELECT_V2: "onSelect",
    CHECKBOX_PROPERTY_CHANGE_SCRIPT_V2: "onChange",

    TEXTFIELD_PROPERTY_TEXT_V2: "text",


    TREND_PROPERTY_TYPE: null,

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

    // 动态GIF支持
    ANIMATION_GIF: true,
    // 自动字体开关
    BUTTON_AUTO_FONT_SIZE: false,
    // 按钮自动适配占比
    BUTTON_FONT_SIZE_RATIO: 0.7,

    PATT_POINT_NAME: /[\w\d]+\.[\w\d\_]+\.[\w\d_$%\&\*@#]+/ig,
    PATT_DCSPOINT_NAME: /[\w\d]+\.[\w\d\_]+\.[\w\d_$%\&\*@#]+/ig,


    scriptPattern: [
        /avmask\([^\)]+\)/g,
        /asmask\([^\)]+\)/g,
        /tv\([^\)]+\)/g,
        /bv\([^\)]+\)/g,
        /av\([^\)]+\)/g,
        /as\([^\)]+\)/g,
    ],

    ERROR_VIEW: '<?xml version:\'1.0\' encoding:\'UTF-8\'?> <Openplant> <BackGround class:"com.magustek.graph.ui.viewer.GBackGround"> <Pr name:"background.minsize" value:"1024,768"/> <Pr name:"background.drawfill" value:"1/rgba(255,255,255,255)/rgba(64,64,64,255)/0/0/0"/> <Pr name:"background.currentsize" value:"1024,768"/></BackGround></Openplant>',
}


function zxml2json(_proto) {
    var jsonData = {};
    var pointsArray = [];
    var ref = {};
    openplant(_proto, jsonData);
    function openplant(xmlObj, xmlData) {
        for (var attr in xmlObj.$attrs) {
            xmlData[attr] = xmlObj.$attrs[attr];
        }
        if (Array.isArray(xmlObj.$children)) {
            xmlObj.$children.forEach(function (item) {
                mapperChildren(item, xmlData)
            });
        }
    }

    function mapperChildren(xmlObj, xmlData) {
        var key = xmlObj.$name;
        var temp = {};
        if (key == "BackGround") {
            if (Array.isArray(xmlObj.$children)) {
                xmlObj.$children.forEach(function (item) {
                    mapperPropertys(item, temp)
                });
            }
            xmlData[key] = convertBackGround(temp);
        } else if (key == "Elements") {
            if (Array.isArray(xmlObj.$children)) {
                temp = [];
                xmlObj.$children.forEach(function (item) {
                    var itemEl = {};
                    if (item.$name.toUpperCase() == "EL") {
                        itemEl = mapperElement(item, itemEl)
                        temp.push(itemEl);
                    }
                });
            }
            xmlData[key] = temp;
        }
    }

    function mapperElement(xmlObj, data) {
        for (var attr in xmlObj.$attrs) {
            data[attr] = xmlObj.$attrs[attr];
        }
        if (Array.isArray(xmlObj.$children)) {
            xmlObj.$children.forEach(function (item) {
                mapperPropertys(item, data)
            });
        }
        data = convertElement(data);


        //TODO 转换对象的VAR 参数内容
        if (data[GraphConst.ELEMENT_PREF] != undefined && data[GraphConst.ELEMENT_PREF] != "") {
            var pref = data[GraphConst.ELEMENT_PREF];
            if (ref[pref] != undefined) {
                if (data[GraphConst.GROUP_PROPERTY_VAR_V2] == undefined) {
                    data[GraphConst.GROUP_PROPERTY_VAR_V2] = {};
                }

                for (var ref_key in ref[pref]) {
                    data[GraphConst.GROUP_PROPERTY_VAR_V2][ref_key] = ref[pref][ref_key];
                }
            }
        }
        // 添加组对象的 变量表 到变量缓存中
        if (data[GraphConst.ELEMENT_REF] && data[GraphConst.GROUP_PROPERTY_VAR_V2] != undefined) {
            ref[data[GraphConst.ELEMENT_REF]] = data[GraphConst.GROUP_PROPERTY_VAR_V2];
        }

        if (data[GraphConst.GROUP_PROPERTY_VAR_V2] != undefined) {
            var vars = (data[GraphConst.GROUP_PROPERTY_VAR_V2]);
            for (var key in vars) {
                replaceParameter(data, key, vars[key]);
            }
        }


        //提取测点
        if (data[GraphConst.DASHPOINT_PROPERTY_POINTNAME_V2] != undefined && data[GraphConst.DASHPOINT_PROPERTY_POINTNAME_V2] != "") {
            var pn = data[GraphConst.DASHPOINT_PROPERTY_POINTNAME_V2];
            pointsArray.push(pn);
        }

        if (data[GraphConst.ELEMENT_PROPERTY_REFRESH_SCRIPT_V2] != undefined && data[GraphConst.ELEMENT_PROPERTY_REFRESH_SCRIPT_V2] != "") {
            var script = data[GraphConst.ELEMENT_PROPERTY_REFRESH_SCRIPT_V2];
            var points = formatScript(script);
            pointsArray = pointsArray.concat(points);
        }

        if (data[GraphConst.ELEMENT_PROPERTY_MOUSEEVENT_SCRIPT_V2] != undefined && data[GraphConst.ELEMENT_PROPERTY_MOUSEEVENT_SCRIPT_V2] != "") {
            var script = data[GraphConst.ELEMENT_PROPERTY_MOUSEEVENT_SCRIPT_V2];
            var points = formatScript(script);
            pointsArray = pointsArray.concat(points);
        }
        return data;
    }


    function mapperPropertys(xmlObj, data) {
        var key = null;
        var values = {};
        for (var attr in xmlObj.$attrs) {
            if (attr == "name") {
                key = xmlObj.$attrs[attr];
            } else {
                values[attr] = (xmlObj.$attrs[attr])
            }
        }
        data[key] = values;
    }


    //测点提取动作
    pointsArray = arrayDelRepeat(pointsArray);
    return {data: jsonData, pointsMap: {all: pointsArray}};
}


function formatScript(value) {
    var points = []
    points = getDCSNameFromScript(value, points);
    return arrayDelRepeat(points);
}

function getDCSNameFromScript(expression, _points) {
    var r, i = 0;
    while (r = GraphConst.PATT_POINT_NAME.exec(expression)) {
        _points.push(r[0]); // 添加到最后
    }
    return _points;
}

function arrayDelRepeat(array) {
    array = array.sort();
    var cache = undefined;
    var newArray = [];
    for (var i = 0; i < array.length; i++) {
        if (array[i] && array[i] !== cache) {
            cache = array[i];
            if (typeof cache == "string" && cache.toLocaleUpperCase != undefined) {
                newArray.push(cache.toLocaleUpperCase());
            }


        }
    }
    return newArray;
}


/**
 * zxml 文件转 xml文件
 * @type {{getXml: Function}}
 */
var zxmlUtils = {

    /**
     * 根据传递过来的文件路径，获取xml文件内容
     * @param filePath
     */
    _getXml: function (filePath, callback) {
        var inp = fs.createReadStream(filePath);
        var chunks = [];
        var data;
        var encoding = 'gzip';
        inp.on('data', function (chunk) {
            chunks.push(chunk);
        });
        inp.on('end', function () {
            var buffer = Buffer.concat(chunks);
            var ext = path.extname(filePath);
            if (ext && ext.toLocaleString() == '.zxml') {
                if (encoding == 'gzip') {
                    zlib.gunzip(buffer, function (err, decoded) {
                        data = decoded.toString();
                        var str = data.toString();
                        var index = str.indexOf('<?xml version=\'1.0\' encoding=\'UTF-8\'?>');
                        callback(str.substring(index));
                    });
                } else if (encoding == 'deflate') {
                    zlib.inflate(buffer, function (err, decoded) {
                        data = decoded.toString();
                        var str = data.toString();
                        var index = str.indexOf('<?xml version=\'1.0\' encoding=\'UTF-8\'?>');
                        callback(str.substring(index));
                    });
                } else {
                    data = buffer.toString();
                }
            } else if (ext && ext.toLocaleString() == '.xml') {
                callback(buffer.toString());
            } else {
                callback(buffer.toString());
            }
        });
    },

    /**
     * 根据传递过来的文件路径，获取xml文件内容
     * @param filePath
     */
    getJson: function (filePath, callback) {
        var _this = this;
        try {
            fs.exists(filePath, function (exists) {
                if (exists) {
                    _this._getXml(filePath, function (xml) {
                        var readStream = new Stream()
                        var parseStream = new xml2obj.Parser(readStream);
                        parseStream.setTransformation(zxml2json);
                        parseStream.each('Openplant', function (item) {
                            callback(filePath, item.data, item.pointsMap);
                        });
                        readStream.emit('data', xml);
                    });
                } else {
                    callback(filePath, {}, {});
                }
            });
        } catch (e) {
            log(e)
        }
    }
}


String.prototype.replaceAll = function (pattern, str) {
    return this.replace(new RegExp(pattern, "gm"), str);
};
var basePath = __dirname.replaceAll("\\\\", "/") + "/../../../public/diagram/";
var GraphElementUtilsV2 = {
    memoryCache: require('memory-cache'),
}
function convertStroke(str) {
    try {
        var data = str.split("/")
        return {
            width: parseInt(data[0]),
            style: parseInt(data[1]),
            color: data[2],
        };
    } catch (e) {
        debug(e)
        debug("convertStroke " + str + " error")
    }
}


function convertBounds(str) {
    try {
        var data = str.split("/")
        return {
            x: parseInt(data[0]),
            y: parseInt(data[1]),
            w: parseInt(data[2]),
            h: parseInt(data[3]),
        };
    } catch (e) {
        debug(e)
        debug("convertBounds " + str + " error")
    }
}

function convertFill(str) {
    try {
        var data = str.split("/");

        var type = parseInt(data[0]);

        switch (type) {
            case 0:
                return {
                    type: type,
                }
            case 1:
                return {
                    type: type,
                    bg: data[1]
                }
            case 2:
                return {
                    type: type,
                    bg: data[1],
                    fg: data[2],
                    pattern: parseInt(data[3]),
                }
            case 3:
                return {
                    type: type,
                    bg: data[1],
                    fg: data[2],
                    gradient: {
                        type: parseInt(data[4]),
                        orient: parseInt(data[5]),
                    },
                }
        }
        return data;
    } catch (e) {
        debug(e)
        debug("convertFill " + str + " error")
    }
}


function convertPoints(str) {
    try {
        var data = str.split("/")
        var points = [];
        data.forEach(function (item) {
            var temp = item.split(",");
            points.push({x: temp[0], y: temp[1]});
        })
        return points;
    } catch (e) {
        debug(e)
        debug("convertPoints " + str + " error")
    }
}

function convertFonts(str) {
    try {
        var data = str.split("/");

        if (data[0] && data[0].indexOf(".") != -1) {
            data[0] = data[0].split(".")[0];
        }
        return {
            name: data[0],
            style: data[1],
            size: parseInt(data[2])
        };
    } catch (e) {
        debug(e)
        debug("convertFonts " + str + " error")
    }
}


function convertPropertys(element) {
    var errorCout = 0;
    for (var key in element) {
        switch (key) {
            case GraphConst.ELEMENT_CLASS:
                this[GraphConst.ELEMENT_CLASS] = element[key]
                break;
            case GraphConst.ELEMENT_PREF:
                this[GraphConst.ELEMENT_PREF] = element [key]
                break;
            case GraphConst.ELEMENT_REF:
                this[GraphConst.ELEMENT_REF] = element [key]
                break;

            case GraphConst.ELEMENT_PROPERTY_Z_INDEX:
                this[GraphConst.ELEMENT_PROPERTY_Z_INDEX_V2] = element [key].value
                break;
            case GraphConst.DIALCHART_TYPE:
                this[GraphConst.DIALCHART_TYPE_V2] = element [key].value
                break;

            case GraphConst.DIALCHART_BACKGROUND_COLOR:
                this[GraphConst.DIALCHART_BACKGROUND_COLOR_V2] = element [key].value
                break;
            case GraphConst.ELEMENT_PROPERTY_BOUNDS:
                this[GraphConst.ELEMENT_PROPERTY_BOUNDS_V2] = convertBounds(element [key].value)
                break;
            case GraphConst.SHAPE_PROPERTY_FILL:
                this[GraphConst.SHAPE_PROPERTY_FILL_V2] = convertFill(element [key].value)
                break;
            case GraphConst.SHAPE_PROPERTY_STROKE:
                this[GraphConst.SHAPE_PROPERTY_STROKE_V2] = convertStroke(element [key].value)
                break;
            case GraphConst.ELEMENT_PROPERTY_REFRESH_SCRIPT:
                this[GraphConst.ELEMENT_PROPERTY_REFRESH_SCRIPT_V2] = element [key].value
                break;
            case GraphConst.ELEMENT_PROPERTY_MOUSEEVENT_SCRIPT:
                this[GraphConst.ELEMENT_PROPERTY_MOUSEEVENT_SCRIPT_V2] = element [key].value
                break;
            case GraphConst.RECTANGLE_PROPERTY_3D:
                break;
            case GraphConst.POLYLINE_PROPERTY_POINTS:
                this[GraphConst.POLYLINE_PROPERTY_POINTS_V2] = convertPoints(element [key].value)
                break;
            case GraphConst.ARC_PROPERTY_TYPE:
                this[GraphConst.ARC_PROPERTY_TYPE_V2] = (element [key].value)
                break;
            case GraphConst.ARC_PROPERTY_START:
                this[GraphConst.ARC_PROPERTY_START_V2] = (element [key].value);
                break;
            case GraphConst.ARC_PROPERTY_EXTENT:
                this[GraphConst.ARC_PROPERTY_EXTENT_V2] = (element [key].value);
                break;
            case GraphConst.IMAGE_PROPERTY_URL:
                this[GraphConst.IMAGE_PROPERTY_URL_V2] = (element [key].value);
                break;
            case GraphConst.RECTANGLE_PROPERTY_ARCW:
                this[GraphConst.RECTANGLE_PROPERTY_ARCW_V2] = (element [key].value)
                break;
            case GraphConst.RECTANGLE_PROPERTY_ARCH:
                this[GraphConst.RECTANGLE_PROPERTY_ARCH_V2] = (element [key].value)
                break;

            case GraphConst.TEXT_PROPERTY_TEXTCONTEXT:
                this[GraphConst.TEXT_PROPERTY_TEXTCONTEXT_V2] = (element [key].value) + "";
                break;
            case GraphConst.TEXT_PROPERTY_ALIGN:
                this[GraphConst.TEXT_PROPERTY_ALIGN_V2] = (element [key].value);
                break;
            case GraphConst.TEXT_PROPERTY_TEXTFONT:
                this[GraphConst.TEXT_PROPERTY_TEXTFONT_V2] = convertFonts(element [key].value)
                break;
            case GraphConst.TEXT_PROPERTY_TEXTCOLOR:
                this[GraphConst.TEXT_PROPERTY_TEXTCOLOR_V2] = (element [key].value);
                break;
            case GraphConst.TEXT_PROPERTY_FILL_VISIBLE:
                this[GraphConst.TEXT_PROPERTY_FILL_VISIBLE_V2] = (element [key].value);
                break;
            case GraphConst.TEXT_PROPERTY_STROKE_VISIBLE:
                this[GraphConst.TEXT_PROPERTY_STROKE_VISIBLE_V2] = (element [key].value);
                break;

            case GraphConst.GRID_COLUMN:
                this[GraphConst.GRID_COLUMN_V2] = (element [key].value);
                break;
            case GraphConst.GRID_ROW:
                this[GraphConst.GRID_ROW_V2] = (element [key].value);
                break;
            case GraphConst.GRID_LINESTROKE:
                this[GraphConst.GRID_LINESTROKE_V2] = convertStroke(element [key].value)
                break;
            case GraphConst.GROUP_PROPERTY_VAR:
                if (element [key].value != "") {
                    this[GraphConst.GROUP_PROPERTY_VAR_V2] = convertVarString(element [key].value);
                }
                break;

            // daspoints
            //点名
            case GraphConst.DASHPOINT_PROPERTY_POINTNAME:
                this[GraphConst.DASHPOINT_PROPERTY_POINTNAME_V2] = (element [key].value);
                break;
            //显示字段
            case GraphConst.DASHPOINT_PROPERTY_POINTFIELDNAME:
                this[GraphConst.DASHPOINT_PROPERTY_POINTFIELDNAME_V2] = (element [key].value);
                break;
            //测点值
            case GraphConst.DASHPOINT_PROPERTY_VALUE:
                this[GraphConst.DASHPOINT_PROPERTY_VALUE_V2] = (element [key].value);
                break;
            case GraphConst.DASHPOINT_PROPERTY_INFO:
                this[GraphConst.DASHPOINT_PROPERTY_INFO_V2] = (element [key].value);
                break;
            case GraphConst.DASHPOINT_PROPERTY_TREND_POINTNAMES:
                this[GraphConst.DASHPOINT_PROPERTY_TREND_POINTNAMES_V2] = (element [key].value);
                break;

            case GraphConst.NUMBER_PROPERTY_DOTCOUNT:
                this[GraphConst.NUMBER_PROPERTY_DOTCOUNT_V2] = (element [key].value);
                break;
            case GraphConst.NUMBER_PROPERTY_DIGIT:
                this[GraphConst.NUMBER_PROPERTY_DIGIT_V2] = (element [key].value);
                break;
            case GraphConst.NUMBER_PROPERTY_SCIENCE:
                this[GraphConst.NUMBER_PROPERTY_SCIENCE_V2] = (element [key].value);
                break;


            case GraphConst.TIME_PROPERTY_FORMAT:
                this[GraphConst.TIME_PROPERTY_FORMAT_V2] = (element [key].value);
                break;
            case GraphConst.TIME_PROPERTY_VALUE:
                this[GraphConst.TIME_PROPERTY_VALUE_V2] = (element [key].value);
                break;


            //BAR
            case GraphConst.BAR_VALUE:
                this[GraphConst.BAR_VALUE_V2] = (element [key].value);
                break;
            case GraphConst.BAR_HIGH_LIMIT:
                this[GraphConst.BAR_HIGH_LIMIT_V2] = (element [key].value);
                break;
            case GraphConst.BAR_LOW_LIMIT:
                this[GraphConst.BAR_LOW_LIMIT_V2] = (element [key].value);
                break;
            case GraphConst.BAR_LOW_TYPE:
                this[GraphConst.BAR_LOW_TYPE_V2] = (element [key].value);
                break;
            case GraphConst.BAR_LOW_POINTNAME:
                this[GraphConst.BAR_LOW_POINTNAME_V2] = (element [key].value);
                break;
            case GraphConst.BAR_LOW_POINTFIELD:
                this[GraphConst.BAR_LOW_POINTFIELD_V2] = (element [key].value);
                break;
            case GraphConst.BAR_HIGH_TYPE:
                this[GraphConst.BAR_HIGH_TYPE_V2] = (element [key].value);
                break;
            case GraphConst.BAR_HIGH_POINTNAME:
                this[GraphConst.BAR_HIGH_POINTNAME_V2] = (element [key].value);
                break;
            case GraphConst.BAR_HIGH_POINTFIELD:
                this[GraphConst.BAR_HIGH_POINTFIELD_V2] = (element [key].value);
                break;
            case GraphConst.BAR_VALUE_FILL:
                this[GraphConst.BAR_VALUE_FILL_V2] = convertFill(element [key].value)
                break;
            case GraphConst.BAR_BACK_FILL:
                this[GraphConst.BAR_BACK_FILL_V2] = convertFill(element [key].value)
                break;
            case GraphConst.BAR_DIRECT:
                this[GraphConst.BAR_DIRECT_V2] = (element [key].value);
                break;
            case GraphConst.BAR_DIRECTION:
                this[GraphConst.BAR_DIRECTION_V2] = (element [key].value);
                break;

            //calcPoint
            case GraphConst.CALCPOINT_PROPERTY_EXPRESSION:
                this[GraphConst.CALCPOINT_PROPERTY_EXPRESSION_V2] = (element [key].value);
                break;
            case GraphConst.CALCPOINT_PROPERTY_EXPRESSIONRESULT:
                break;

            //barchart
            case GraphConst.BARCHART_PROPERTY_POINTN_LISTINFO:
                this[GraphConst.BARCHART_PROPERTY_POINTN_LISTINFO_V2] = (element [key].value);
                break;
            case GraphConst.BARCHART_BACKGROUND_COLOR:
                this[GraphConst.BARCHART_BACKGROUND_COLOR_V2] = (element [key].value);
                break;
            case GraphConst.BARCHART_DIRECTION:
                this[GraphConst.BARCHART_DIRECTION_V2] = (element [key].value);
                break;
            case GraphConst.BARCHART_HIGH_LIMIT:
                this[GraphConst.BARCHART_HIGH_LIMIT_V2] = (element [key].value);
                break;
            case GraphConst.BARCHART_LOW_LIMIT:
                this[GraphConst.BARCHART_LOW_LIMIT_V2] = (element [key].value);
                break;
            case GraphConst.BARCHART_SECOND_HIGH_LIMIT:
                this[GraphConst.BARCHART_SECOND_HIGH_LIMIT_V2] = (element [key].value);
                break;
            case GraphConst.BARCHART_SECOND_LOW_LIMIT:
                this[GraphConst.BARCHART_SECOND_LOW_LIMIT_V2] = (element [key].value);
                break;
            case GraphConst.BARCHART_TYPE:
                this[GraphConst.BARCHART_TYPE_V2] = (element [key].value);
                break;
            case GraphConst.BARCHART_GRADUATION_FONT:
                this[GraphConst.BARCHART_GRADUATION_FONT_V2] = convertFonts(element [key].value)
                break;
            case GraphConst.BARCHART_STYLE:
                this[GraphConst.BARCHART_STYLE_V2] = (element [key].value);
                break;



            //piehart
            case GraphConst.CHART_PROPERTY_POINTN_LIST:
                this[GraphConst.CHART_PROPERTY_POINTN_LIST_V2] = (element [key].value);
                break;
            case GraphConst.BARCHART_PROPERTY_REALTIME:
                this[GraphConst.BARCHART_PROPERTY_REALTIME_V2] = (element [key].value);
                break;
            case GraphConst.PIE_PROPERTY_POINTNCOLOR_LIST:
                this[GraphConst.PIE_PROPERTY_POINTNCOLOR_LIST_V2] = (element [key].value);
                break;
            case GraphConst.PIE_PROPERTY_HOLLOW_PERCENT:
                this[GraphConst.PIE_PROPERTY_HOLLOW_PERCENT_V2] = (element [key].value);
                break;
            case GraphConst.PIE_PROPERTY_LEGEND_LOCATION:
                this[GraphConst.PIE_PROPERTY_LEGEND_LOCATION_V2] = (element [key].value);
                break;
            case GraphConst.PIECHART_PROPERTY_POINTN_LISTINFO:
                this[GraphConst.PIECHART_PROPERTY_POINTN_LISTINFO_V2] = (element [key].value);
                break;
            case GraphConst.PIECHART_PROPERTY_REALTIME:
                this[GraphConst.PIECHART_PROPERTY_REALTIME_V2] = (element [key].value);
                break;
            case GraphConst.PIECHART_BACKGROUND_COLOR:
                this[GraphConst.PIECHART_BACKGROUND_COLOR_V2] = (element [key].value);
                break;
            case GraphConst.PIECHART_DIRECTION:
                this[GraphConst.PIECHART_DIRECTION_V2] = convertFonts(element [key].value)
                break;
            case GraphConst.PIECHART_GRADUATION_FONT:
                this[GraphConst.PIECHART_GRADUATION_FONT_V2] = (element [key].value);
                break;
            case GraphConst.PIECHART_TYPE:
                this[GraphConst.PIECHART_TYPE_V2] = (element [key].value);
                break;
            case GraphConst.PIECHART_STYLE:
                this[GraphConst.PIECHART_STYLE_V2] = (element [key].value);
                break;


            // trend
            case GraphConst.TREND_PROPERTY_TYPE_OBJECT:
                this[GraphConst.TREND_PROPERTY_TYPE_OBJECT_V2] = (element [key].value);
                break;
            case GraphConst.TREND_PROPERTY_DURATION:
                this[GraphConst.TREND_PROPERTY_DURATION_V2] = (element [key].value);
                break;
            case GraphConst.TREND_PROPERTY_TEXTFONT:
                this[GraphConst.TREND_PROPERTY_TEXTFONT_V2] = convertFonts(element [key].value)
                break;
            case GraphConst.TREND_PROPERTY_INNER_TOP_MARGIN:
                this[GraphConst.TREND_PROPERTY_INNER_TOP_MARGIN_V2] = (element [key].value);
                break;
            case GraphConst.TREND_PROPERTY_INNER_BOTTOM_MARGIN:
                this[GraphConst.TREND_PROPERTY_INNER_BOTTOM_MARGIN_V2] = (element [key].value);
                break;
            case GraphConst.TREND_PROPERTY_INNER_LEFT_MARGIN:
                this[GraphConst.TREND_PROPERTY_INNER_LEFT_MARGIN_V2] = (element [key].value);
                break;
            case GraphConst.TREND_PROPERTY_TIME_AXIS_MIN_COUNT:
                this[GraphConst.TREND_PROPERTY_TIME_AXIS_MIN_COUNT_V2] = (element [key].value);
                break;
            case GraphConst.TREND_PROPERTY_GRID_X_COUNT:
                this[GraphConst.TREND_PROPERTY_GRID_X_COUNT_V2] = (element [key].value);
                break;
            case GraphConst.TREND_PROPERTY_GRID_Y_COUNT:
                this[GraphConst.TREND_PROPERTY_GRID_Y_COUNT_V2] = (element [key].value);
                break;
            case GraphConst.TREND_PROPERTY_GRID_STROKE:
                this[GraphConst.TREND_PROPERTY_GRID_STROKE_V2] = (element [key].value);
                break;
            case GraphConst.TREND_PROPERTY_TIME_FORMAT:
                this[GraphConst.TREND_PROPERTY_TIME_FORMAT_V2] = (element [key].value);
                break;
            case GraphConst.TREND_PROPERTY_COLOR_FILLGROUND:
                this[GraphConst.TREND_PROPERTY_COLOR_FILLGROUND_V2] = (element [key].value);
                break;
            case GraphConst.TREND_PROPERTY_LEGEND_LOCATION:
                this[GraphConst.TREND_PROPERTY_LEGEND_LOCATION_V2] = (element [key].value);
                break;
            case GraphConst.TREND_PROPERTY_LEGEND_WIDTH:
                this[GraphConst.TREND_PROPERTY_LEGEND_WIDTH_V2] = (element [key].value);
                break;
            case GraphConst.TREND_PROPERTY_LEGEND_STYLE:
                this[GraphConst.TREND_PROPERTY_LEGEND_STYLE_V2] = (element [key].value);
                break;
            case GraphConst.TREND_PROPERTY_SCALE_MIN_LEFT:
                this[GraphConst.TREND_PROPERTY_SCALE_MIN_LEFT_V2] = (element [key].value);
                break;
            case GraphConst.TREND_PROPERTY_SCALE_MAX_LEFT:
                this[GraphConst.TREND_PROPERTY_SCALE_MAX_LEFT_V2] = (element [key].value);
                break;
            case GraphConst.TREND_PROPERTY_SCALE_MIN_RIGHT:
                this[GraphConst.TREND_PROPERTY_SCALE_MIN_RIGHT_V2] = (element [key].value);
                break;
            case GraphConst.TREND_PROPERTY_SCALE_MAX_RIGHT:
                this[GraphConst.TREND_PROPERTY_SCALE_MAX_RIGHT_V2] = (element [key].value);
                break;
            case GraphConst.TREND_PROPERTY_LIST_TRENDPOINTS:
                this[GraphConst.TREND_PROPERTY_LIST_TRENDPOINTS_V2] = (element [key].value);
                break;
            case GraphConst.TREND_PROPERTY_LIST_TYPE:
                this[GraphConst.TREND_PROPERTY_LIST_TYPE_V2] = (element [key].value);
                break;
            case GraphConst.TREND_PROPERTY_LIST_BEGIN:
                this[GraphConst.TREND_PROPERTY_LIST_BEGIN_V2] = (element [key].value);
                break;
            case GraphConst.TREND_PROPERTY_LIST_END:
                this[GraphConst.TREND_PROPERTY_LIST_END_V2] = (element [key].value);
                break;
            case GraphConst.TREND_PROPERTY_COLOR_INBORDER:
                this[GraphConst.TREND_PROPERTY_COLOR_INBORDER_V2] = (element [key].value);
                break;
            default:
                if (element [key].value) {
                    this[key] = (element [key].value);
                    debug("ERROR " + key + "  " + element [key].value)
                    errorCout++;
                } else {
                    debug("ERROR " + key)
                    debug(element [key])
                    this[key] = (element [key])
                }
                break;
        }
    }
    return errorCout;
}


function replaceParameter(obj, key, value) {
    var keyInfo = "${" + key + "}";
    if (obj[GraphConst.DASHPOINT_PROPERTY_POINTNAME_V2] != undefined && obj[GraphConst.DASHPOINT_PROPERTY_POINTNAME_V2] == keyInfo) {
        obj[GraphConst.DASHPOINT_PROPERTY_POINTNAME_V2] = value;
    }

    if (obj[GraphConst.TEXTFIELD_PROPERTY_TEXT_V2] != undefined) {
        obj[GraphConst.TEXTFIELD_PROPERTY_TEXT_V2] = obj[GraphConst.TEXTFIELD_PROPERTY_TEXT_V2].replace(new RegExp("\\$\\{" + key + "\\}", "gm"), value);
    }

    if (obj[GraphConst.ELEMENT_PROPERTY_REFRESH_SCRIPT_V2] != undefined) {
        obj[GraphConst.ELEMENT_PROPERTY_REFRESH_SCRIPT_V2] = obj[GraphConst.ELEMENT_PROPERTY_REFRESH_SCRIPT_V2].replace(new RegExp("\\$\\{" + key + "\\}", "gm"), value);
    }

    if (obj[GraphConst.ELEMENT_PROPERTY_MOUSEEVENT_SCRIPT_V2] != undefined) {
        obj[GraphConst.ELEMENT_PROPERTY_MOUSEEVENT_SCRIPT_V2] = obj[GraphConst.ELEMENT_PROPERTY_MOUSEEVENT_SCRIPT_V2].replace(new RegExp("\\$\\{" + key + "\\}", "gm"), value);
    }
}


function convertVarString(string) {
    var vars = {};
    if (typeof string == "string") {
        var array = string.split("/");
        for (var i = 0; i < array.length; i++) {
            var kv = array[i].split(",");
            vars[kv[0]] = kv[1];
        }
    }
    return vars;
}

function convertBackGround(backGround) {

    if (backGround.class) {
        delete  backGround.class;
    }
    var data = {};

    if (backGround[GraphConst.BACKGROUND_IMAGE_URL]) {
        data[GraphConst.BACKGROUND_IMAGE_URL_V2] = backGround[GraphConst.BACKGROUND_IMAGE_URL].value;
    }


    //大小格式处理
    if (backGround[GraphConst.BACKGROUND_CURRENTSIZE]) {
        var temp = backGround[GraphConst.BACKGROUND_CURRENTSIZE].value.split(",");
        data[GraphConst.BACKGROUND_CURRENTSIZE_V2] = {w: parseInt(temp[0]), h: parseInt(temp[1])}
    } else {
        data[GraphConst.BACKGROUND_CURRENTSIZE_V2] = {w: 1024, h: 768}
    }

    if (backGround[GraphConst.BACKGROUND_DRAWFILL]) {
        data[GraphConst.BACKGROUND_DRAWFILL_V2] = convertFill(backGround[GraphConst.BACKGROUND_DRAWFILL].value)
    } else {
        data[GraphConst.BACKGROUND_DRAWFILL_V2] = {
            type: 1,
            bg: "rgba(255, 255, 255, 255)",
            fg: "rgba(64, 64, 64, 255)"
        }
    }
    return data;
}


function parseElement(element) {
    var errorCout = convertPropertys.call(this, element);
    if (errorCout > 0) {
        debug("error >>>" + errorCout)
        debug(element)
    }
}


// 图形对象结构--------------------
function GRectangle(element) {
    try {
        this.class = element.class;
        //TODO 对象默认值设置
        parseElement.call(this, element);
    }
    catch (e) {
        debug(element)
        debug(e)
    }

    return this;
}


function GEllipse(element) {
    try {
        this.class = element.class;
        //TODO 对象默认值设置
        parseElement.call(this, element);
    } catch (e) {
        debug(element)
        debug(e)
    }
    return this;
}

function GPolyLine(element) {
    try {
        this.class = element.class;
        //TODO 对象默认值设置
        parseElement.call(this, element);
    } catch (e) {
        debug(element)
        debug(e)
    }

    return this;
}


function GPolygon(element) {
    try {
        this.class = element.class;
        //TODO 对象默认值设置
        parseElement.call(this, element);
    } catch (e) {
        debug(e)
    }
    return this;
}

function GArc(element) {
    try {
        this.class = element.class;
        //TODO 对象默认值设置
        parseElement.call(this, element);
    } catch (e) {
        debug(element)
        debug(e)
    }
    return this;
}


function GImage(element) {
    try {
        this.class = element.class;
        //TODO 对象默认值设置
        parseElement.call(this, element);
    } catch (e) {
        debug(e)
        debug(element)
    }
    return this;
}


function GButton(element) {
    try {
        this.class = element.class;
        this.stroke = {
            width: 1,
            style: 0,
            color: "rgba(0,0,0,255)",
        };

        //TODO 对象默认值设置
        parseElement.call(this, element);
    } catch (e) {
        debug(element)
        debug(e)
    }
    return this;
}

function GText(element) {
    try {
        this.class = element.class;
        //TODO 对象默认值设置
        parseElement.call(this, element);
    } catch (e) {
        debug(e)
        debug(element)
    }
    return this;
}

function GGroup(element) {
    try {
        this.class = element.class;
        //TODO 对象默认值设置
        parseElement.call(this, element);
    } catch (e) {
        debug(element)
        debug(e)
    }
    return this;
}


function GLink(element) {
    try {
        this.class = element.class;
        //TODO 对象默认值设置
        parseElement.call(this, element);
    } catch (e) {
        debug(element)
        debug(e)
    }
    return this;
}


function GComplexShape(element) {
    try {
        this.class = element.class;
        //TODO 对象默认值设置
        parseElement.call(this, element);
    } catch (e) {
        debug(e)
        debug(element)
    }
    return this;
}


function GDasPoint(element) {
    try {
        this.class = element.class;
        //TODO 对象默认值设置
        parseElement.call(this, element);
    } catch (e) {
        debug(e)
        debug(element)
    }
    return this;
}

function GTimeText(element) {
    try {
        this.class = element.class;
        //TODO 对象默认值设置
        parseElement.call(this, element);
    } catch (e) {
        debug(e)
        debug(element)
    }
    return this;
}

function GCalcPoint(element) {
    try {
        this.class = element.class;
        //TODO 对象默认值设置
        parseElement.call(this, element);
    } catch (e) {
        debug(e)
        debug(element)
    }
    return this;
}

function GPieChart(element) {
    try {
        this.class = element.class;
        //TODO 对象默认值设置
        parseElement.call(this, element);
    } catch (e) {
        debug(e)
        debug(element)
    }
    return this;
}

function GBarChart(element) {
    try {
        this.class = element.class;
        //TODO 对象默认值设置
        parseElement.call(this, element);
    } catch (e) {
        debug(e)
        debug(element)
    }
    return this;
}


function GBar(element) {
    try {
        this.class = element.class;
        //TODO 对象默认值设置
        parseElement.call(this, element);
    } catch (e) {
        debug(e)
        debug(element)
    }
    return this;
}

function GTrend(element) {
    try {
        this.class = element.class;
        //TODO 对象默认值设置
        parseElement.call(this, element);
    } catch (e) {
        debug(e)
        debug(element)
    }
    return this;
}

function GArea(element) {
    try {
        this.class = element.class;
        //TODO 对象默认值设置
        parseElement.call(this, element);
    } catch (e) {
        debug(e)
        debug(element)
    }
    return this;
}

function GDialChart(element) {
    try {
        this.class = element.class;
        //TODO 对象默认值设置
        parseElement.call(this, element);
    } catch (e) {
        debug(e)
        debug(element)
    }
    return this;
}

function GGrid(element) {
    try {
        this.class = element.class;
        //TODO 对象默认值设置
        parseElement.call(this, element);
    } catch (e) {
        debug(e)
    }
    return this;
}

function GWebView(element) {
    try {
        this.class = element.class;
        //TODO 对象默认值设置
        parseElement.call(this, element);
    } catch (e) {
        debug(e)
    }
    return this;
}

function GComboBox(element) {
    try {
        this.class = element.class;
        //TODO 对象默认值设置
        parseElement.call(this, element);
    } catch (e) {
        debug(e)
    }
    return this;
}

function GCheckBox(element) {
    try {
        this.class = element.class;
        //TODO 对象默认值设置
        parseElement.call(this, element);
    } catch (e) {
        debug(e)
    }
    return this;
}


function GTextField(element) {
    try {
        this.class = element.class;
        //TODO 对象默认值设置
        parseElement.call(this, element);
    } catch (e) {
        debug(e)
    }
    return this;
}

function GPasswordTextField(element) {
    try {
        this.class = element.class;
        //TODO 对象默认值设置
        parseElement.call(this, element);
    } catch (e) {
        debug(e)
    }

    return this;
}


function convertElement(element) {
    var data = {};
    switch (element.class) {
        case  GraphConst.TYPE_RECTANGLE :
            data = new GRectangle(element);
            break;
        case  GraphConst.TYPE_ELLIPSE:
            data = new GEllipse(element);
            break;
        case  GraphConst.TYPE_POLYLINE:
            data = new GPolyLine(element);
            break;
        case  GraphConst.TYPE_POLYGON:
            data = new GPolygon(element);
            break;
        case  GraphConst.TYPE_ARC:
            data = new GArc(element);
            break;
        case  GraphConst.TYPE_IMAGE:
            data = new GImage(element);
            break;
        case  GraphConst.TYPE_BUTTON:
            data = new GButton(element);
            break;
        case  GraphConst.TYPE_TEXT:
            data = new GText(element);
            break;
        case  GraphConst.TYPE_GROUP:
            data = new GGroup(element);
            break;
        case  GraphConst.TYPE_LINK:
            data = new GLink(element);
            break;
        case  GraphConst.TYPE_COMPLEXSHAPE:
            data = new GComplexShape(element);
            break;
        // ext
        case  GraphConst.TYPE_DASPO:
            data = new GDasPoint(element);
            break;
        case  GraphConst.TYPE_TIME:
            data = new GTimeText(element);
            break;
        case  GraphConst.TYPE_CALCPO:
            data = new GCalcPoint(element);
            break;
        case  GraphConst.TYPE_PIE_CHART:
            data = new GPieChart(element);
            break;
        //BAR
        case  GraphConst.TYPE_BAR:
            data = new GBar(element);
            break;
        case  GraphConst.TYPE_BAR_CHART:
            data = new GBarChart(element);
            break;
        case  GraphConst.TYPE_TREND:
            data = new GTrend(element);
            break;
        case  GraphConst.TYPE_AREA:
            data = new GArea(element);
            break;
        case  GraphConst.TYPE_DIAL_CHART:
            data = new GDialChart(element);
            break;
        case  GraphConst.TYPE_GRID:
            data = new GGrid(element);
            break;
        case  GraphConst.TYPE_WEBVIEW:
            data = new GWebView(element);
            break;
        case  GraphConst.TYPE_COMBOBOX:
            data = new GComboBox(element);
            break;
        case  GraphConst.TYPE_CHECKBOX:
            data = new GCheckBox(element);
            break;
        case  GraphConst.TYPE_TEXTFIELD:
            data = new GTextField(element);
            break;
        case  GraphConst.TYPE_PASSWORD_TEXTFIELD:
            data = new GPasswordTextField(element);
            break;
        default:
            break;
    }
    return data;
}

GraphElementUtilsV2.get = function (path, callback) {
    var cacheData = GraphElementUtilsV2.memoryCache.get(path);
    var fullPath = path;
    if (cacheData) {
        callback(cacheData.jsonData, cacheData.pointsMap)
    } else {
        zxmlUtils.getJson(fullPath, function (filePath, data, pointsMap) {
            filePath = filePath.replaceAll(basePath, "");
            var cacheData = {
                jsonData: data,
                pointsMap: pointsMap
            }
            GraphElementUtilsV2.memoryCache.put(filePath, cacheData, 10 * 60 * 1000);
            callback(data, pointsMap);
        })
    }
}


module.exports = GraphElementUtilsV2;
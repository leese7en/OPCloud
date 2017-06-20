var express = require('express');
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

    DC_ADD: "dc.add",
    DC_REMOVE: "dc.remove",
    DC_CLEAR: "dc.clear",

    //background
    BACKGROUND_DRAWFILL: "background.drawfill",
    BACKGROUND_MINSIZE: "background.minsize",
    BACKGROUND_CURRENTSIZE: "background.currentsize",
    BACKGROUND_IMAGE_URL: "background.image.url",

    VIEW_SELECTION_CLEAR: "view.selection.clear",
    VIEW_SELECTION_APPEND: "view.selection.append",
    VIEW_SELECTION_REMOVE: "view.selection.remove",
    VIEW_SELECTION_APPEND_ALL: "view.selection.append.all",

    VIEW_FRONT: "view.front",
    VIEW_BEHIND: "view.behind",

    // view
    GVIEWER_PROPERTY_IMAGE_PREFIX: "view.image.prefix",
    GVIEWER_PROPERTY_GRAPH_PREFIX: "view.graph.prefix",
    GVIEWER_PROPERTY_IMAGE_PARSE: "view.image.parse",

    // base
    ELEMENT_PROPERTY_NAME: "base.name",
    ELEMENT_PROPERTY_REFNAME: "base.refname",
    ELEMENT_PROPERTY_CONTAINER: "base.container",
    ELEMENT_PROPERTY_BOUNDS: "base.bounds",
    ELEMENT_PROPERTY_REFRESH_SCRIPT: "base.refresh.script",
    ELEMENT_PROPERTY_MOUSEEVENT_SCRIPT: "base.mouseevent.script",
    ELEMENT_PROPERTY_REFRESH_SCRIPT_DCSPOINTS: "base.refresh.script.dcspoints",
    ELEMENT_PROPERTY_VISIBLE: "base.visible",

    ELEMENT_PROPERTY_Z_INDEX: "base.z.index",

    ELEMENT_PROPERTY_GEOGRAPHY: "base.geography",
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
    DASHPOINT_PROPERTY_POINTFIELDNAME: "dashpoint.pointfieldname",
    DASHPOINT_PROPERTY_VALUE: "dashpoint.value",
    DASHPOINT_PROPERTY_INFO: "dashpoint.info",
    DASHPOINT_PROPERTY_TREND_POINTNAMES: "dashpoint.trend.pointnames",

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
    BAR_DIRECTION: "bar.direction",

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

    // grid
    GRID_COLUMN: "grid.column",
    GRID_ROW: "grid.row",
    GRID_LINESTROKE: "grid.linestroke",

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

    // GJComponent
    WEBVIEW_PROPERTY_URL: "webview.url",

    COMBOBOX_PROPERTY_ITEMS: "combobox.items",
    COMBOBOX_PROPERTY_CHANGE_SCRIPT: "combobox.change.script",

    CHECKBOX_PROPERTY_TEXT: "checkbox.text",
    CHECKBOX_PROPERTY_SELECT: "checkbox.select",
    CHECKBOX_PROPERTY_CHANGE_SCRIPT: "checkbox.change.script",

    TEXTFIELD_PROPERTY_TEXT: "textfield.text",
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

module.exports = GraphConst;
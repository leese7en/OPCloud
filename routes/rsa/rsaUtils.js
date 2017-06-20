/**
 * Created by se7en on 2015/11/9.
 */
/**
 * Created by se7en on 2015/11/9.
 */
var fs = require("fs");
var zlib = require('zlib');
var Buffer = require('buffer').Buffer;
var path = require('path');
var domParser = require('xmldom').DOMParser;

var scriptPatterns = [/(av(\'=?)(\S*)(?=\'))/, /(as(\'=?)(\S*)(?=\'))/, /(avmask(\'=?)(\S*)(?=\'))/, /(asmask(\'=?)(\S*)(?=\'))/, /(bv(\'=?)(\S*)(?=\'))/, /(tv(\'=?)(\S*)(?=\'))/];
var ELEMENT_PROPERTY_REFRESH_SCRIPT = "base.refresh.script",
    ELEMENT_PROPERTY_MOUSEEVENT_SCRIPT = "base.mouseevent.script",
    ELEMENT_PROPERTY_REFRESH_SCRIPT_DCSPOINTS = "base.refresh.script.dcspoints",
    DASHPOINT_PROPERTY_POINTNAME = "dashpoint.pointname",
    DASHPOINT_TREND_POINTNAME = "dashpoint.trend.pointnames",
    PIECHART_PROPERTY_POINTN_LISTINFO = "piechart.point.listinfo",
    BARCHART_PROPERTY_POINTN_LISTINFO = "barchart.point.listinfo",
    TREND_PROPERTY_TYPE_OBJECT = "trend.typeobject",//
    ERROR_VIEW = '<?xml version=\'1.0\' encoding=\'UTF-8\'?> <Openplant> <BackGround class="com.magustek.graph.ui.viewer.GBackGround"> <Pr name="background.minsize" value="1024,768"/> <Pr name="background.drawfill" value="1/rgba(255,255,255,255)/rgba(64,64,64,255)/0/0/0"/> <Pr name="background.currentsize" value="1024,768"/></BackGround></Openplant>';

/**
 * zxml 文件转 xml文件
 * @type {{getXml: Function}}
 */
var
    rsaUtils = {

        /**
         * 根据传递过来的文件路径，获取xml文件内容
         * @param fileName
         */
        getXml: function (fileName, licenseOrFileError, callback) {
            var that = this;
            fs.exists(fileName, function (exists) {
                if (licenseOrFileError == 0) {
                    if (!exists) {
                        licenseOrFileError = fileName + '文件不存在，请检查';
                    }
                }
                if (licenseOrFileError != 0) {
                    var viewError = that.initLicenseOrFileError(licenseOrFileError);
                    callback(viewError, new Array());
                }
                else {
                    var inp = fs.createReadStream(fileName);
                    var chunks = [];
                    var data;
                    var encoding = 'gzip';
                    inp.on('data', function (chunk) {
                        chunks.push(chunk);
                    });
                    inp.on('end', function () {
                        var buffer = Buffer.concat(chunks);
                        var ext = path.extname(fileName);
                        var pointsArray;
                        if (ext == '.zxml') {
                            if (encoding == 'gzip') {
                                zlib.gunzip(buffer, function (err, decoded) {
                                    data = decoded.toString();
                                    var str = data.toString();
                                    var index = str.indexOf('<?xml version=\'1.0\' encoding=\'UTF-8\'?>');
                                    var value = str.substring(index);
                                    pointsArray = that.getPoints(value);
                                    callback(value, pointsArray);
                                });
                            } else if (encoding == 'deflate') {
                                zlib.inflate(buffer, function (err, decoded) {
                                    data = decoded.toString();
                                    var str = data.toString();
                                    var index = str.indexOf('<?xml version=\'1.0\' encoding=\'UTF-8\'?>');
                                    var value = str.substring(index);
                                    pointsArray = that.getPoints(value);
                                    callback(value, pointsArray);
                                });
                            } else {
                                data = buffer.toString();
                            }
                        }
                        else if (ext == '.xml') {
                            var value = buffer.toString();
                            pointsArray = that.getPoints(value);
                            callback(value, pointsArray);
                        } else {
                            var value = buffer.toString();
                            pointsArray = that.getPoints(value);
                            callback(value, pointsArray);
                        }
                    });
                }
            });
        },
        /**
         * 根据 传递过来的文件名 获取的点集合
         * @param filePath
         */
        getPoints: function (value) {
            var pointsArray = new Array();
            var doc = new domParser().parseFromString(value, 'text/xml');
            var docRoot = doc.documentElement;
            var childNodes = docRoot.childNodes;
            for (var i = 0; i < childNodes.length; i++) {
                var childNode = childNodes[i];
                if (childNode.tagName == 'Elements') {
                    var childs = childNode.childNodes;
                    for (var j = 0; j < childs.length; j++) {
                        var child = childs[j];
                        if (child.nodeType == 1) {
                            var properties = child.childNodes;
                            for (var t = 0; t < properties.length; t++) {
                                var property = properties[t];
                                if (property.nodeType == 1) {
                                    var name = property.getAttribute('name');
                                    if (name == DASHPOINT_PROPERTY_POINTNAME) {
                                        pointsArray.push(property.getAttribute('value'));
                                    }
                                    else if (name == PIECHART_PROPERTY_POINTN_LISTINFO) {
                                        var nodeValue = property.getAttribute('value').toString();
                                        this.chartAddPoints(pointsArray, nodeValue);
                                    }
                                    else if (name == BARCHART_PROPERTY_POINTN_LISTINFO) {
                                        var nodeValue = property.getAttribute('value').toString();
                                        this.chartAddPoints(pointsArray, nodeValue);
                                    }
                                    if (name == ELEMENT_PROPERTY_REFRESH_SCRIPT || name == ELEMENT_PROPERTY_MOUSEEVENT_SCRIPT || name == ELEMENT_PROPERTY_REFRESH_SCRIPT_DCSPOINTS) {
                                        pointsArray = pointsArray.concat(this.formatScript(property.getAttribute('value')));
                                    }
                                }
                            }
                        }

                    }
                }
            }
            return this.arrayDelRepeat(pointsArray);
        },

        /**
         * license 或者 file error
         * @param value
         * @param lOrfError
         */
        initLicenseOrFileError: function (licenseOrFileError) {
            var doc = new domParser().parseFromString(ERROR_VIEW, 'text/xml');
            var docRoot = doc.documentElement;
            var childNodes = docRoot.childNodes;
            for (var i = 0; i < childNodes.length; i++) {
                var childNode = childNodes[i];
                if (childNode.tagName == 'Elements') {
                    docRoot.removeChild(childNode);
                }
            }
            var child = doc.createElement('Elements');
            var node = doc.createElement('E1');
            node.setAttribute('class', 8);
            var pr1 = doc.createElement('Pr');
            pr1.setAttribute('name', 'base.z.index');
            pr1.setAttribute('class', 1);
            pr1.setAttribute('value', 1);
            node.appendChild(pr1);
            var pr2 = doc.createElement('Pr');
            pr2.setAttribute('name', 'text.textcontext');
            pr2.setAttribute('class', 4);
            pr2.setAttribute('value', licenseOrFileError);
            node.appendChild(pr2);
            var pr3 = doc.createElement('Pr');
            pr3.setAttribute('name', 'base.bounds');
            pr3.setAttribute('class', 1);
            pr3.setAttribute('value', '0/0/438/27');
            node.appendChild(pr3);
            child.appendChild(node);
            docRoot.appendChild(child);
            return doc.toString();
        },
        /**
         * 根据 传递过来的脚本事件 获取 所包含的点名
         * @param value
         * @returns {Array}
         */
        formatScript: function (value) {
            var points = new Array();
            for (var i = 0; i < scriptPatterns.length; i++) {
                var matcher = value.match(scriptPatterns[i]);
                if (matcher && matcher.length > 0) {
                    for (var j = 0; j < matcher.length; j++) {
                        points.push(matcher[j]);
                    }
                }
            }
            return points;
        },
        /**
         * 格式化chart对应的点信息，向pointArray中添加数据
         * @param pointArray
         * @param value
         */
        chartAddPoints: function (pointArray, value) {
            var pointInfo = value.split('##');
            for (var p = 0; p < pointInfo.length; p++) {
                pointArray.push(pointInfo[p].split('#')[0]);
            }
        },
        /**
         * 数值去重
         * @param array
         */
        arrayDelRepeat: function (array) {
            var newArray = new Array();
            var len = array.length;
            for (var i = 0; i < len; i++) {
                for (var j = i + 1; j < len; j++) {
                    if (array[i] === array[j]) {
                        j = ++i;
                    }
                }
                newArray.push(array[i]);
            }
            return newArray;
        }
        ,
        /**
         * 根据传递过来的集合获取对应的点ID
         * @param array
         * @returns {Array}
         */
        getPointIdArray: function (array) {
            var pointIds = new Array();
            for (var i = 0; i < array.length; i++) {
                pointIds.push(array[i].ID);
            }
            return pointIds;
        }
        ,
        /**
         * 获取对应的nodeid集合
         * @param array
         * @returns {Array}
         */
        getNodeIdArray: function (array) {
            var nodeIds = new Array();
            for (var i = 0; i < array.length; i++) {
                nodeIds.push(array[i].ND);
            }
            return nodeIds;
        }
        ,
        /**
         * 获取 point name
         */
        getPointName: function (dataBaseResult, nodeResult, poiObj) {
            var pointName = poiObj.PN;
            var nodeName = '';
            var dataBaseName = '';
            var nodeId = poiObj.ND;
            var dataBaseId = '0';
            for (var i = 0; i < nodeResult.length; i++) {
                var node = nodeResult[i];
                if (nodeId == node.ID) {
                    nodeName = node.PN;
                    dataBaseId = node.ND;
                    break;
                }
            }
            for (var j = 0; j < dataBaseResult.length; i++) {
                var dataBase = dataBaseResult[j];
                if (dataBaseId == dataBase.ID) {
                    dataBaseName = dataBase.PN;
                    break;
                }
            }

            return dataBaseName + '.' + nodeName + '.' + pointName;
        }
        ,
        /**
         * 获取报警信息
         * @param alarmType
         * @param alarmLC
         * @param alarmPointAS
         * @returns {*}
         */
        getAlarmDesc: function (alarmType, alarmLC, alarmPointAS) {
            var UNKNOWN = "恢复报警";
            var MASK_L1 = 1 << 1;
            var MASK_H1 = 1 << 2;
            var MASK_L2 = (1 << 3) | (1 << 1);
            var MASK_H2 = (1 << 3) | (1 << 2);
            var MASK_L3 = (1 << 1) | 1;
            var MASK_H3 = (1 << 2) | 1;
            var MASK_L4 = (1 << 3) | (1 << 1) | 1;
            var MASK_H4 = (1 << 3) | (1 << 2) | 1;

            /**
             * 如果是 DX点
             */
            if (alarmType.toString() == '1') {
                // DX报警
                switch (parseInt(alarmLC)) {
                    case 0:
                        return "不报警";
                    case 1:
                        return "变0报警";
                    case 2:
                        return "变1报警";
                    case 3:
                        return "变化报警";
                    default:
                        return UNKNOWN;
                }
            }
            else {
                // AX或其它报警
                //是否报警
                if (((alarmPointAS & 128) >> 7) == 1) {
                    var intAS = alarmPointAS >> 1;
                    // 8限报警
                    intAS = intAS & 15;
                    switch (intAS) {
                        case MASK_L1:
                            return '报警低限';
                        case MASK_L2:
                            return '报警低2限';
                        case MASK_L3:
                            return '报警低3限';
                        case MASK_L4:
                            return '报警低4限';
                        case MASK_H1:
                            return '报警高限';
                        case MASK_H2:
                            return '报警高2限';
                        case MASK_H3:
                            return '报警高3限';
                        case MASK_H4:
                            return '报警高4限';
                        default:
                            return UNKNOWN;
                    }
                }
                else {
                    return UNKNOWN;
                }
            }
        }
        ,
        /**
         * 获取报警颜色
         * @param alarmDesc
         * @param info
         * @returns {*}
         */
        getAlarmColor: function (alarmDesc, info) {
            if ("报警高限" == alarmDesc) {
                return this.numberToColor(info.C5);
            } else if ("报警高2限" == alarmDesc) {
                return this.numberToColor(info.C6);
            } else if ("报警高3限" == alarmDesc) {
                return this.numberToColor(info.C7);
            } else if ("报警高4限" == alarmDesc) {
                return this.numberToColor(info.C8);
            } else if ("报警低限" == alarmDesc) {
                return this.numberToColor(info.C1);
            } else if ("报警低2限" == alarmDesc) {
                return this.numberToColor(info.C2);
            } else if ("报警低3限" == alarmDesc) {
                return this.numberToColor(info.C3);
            } else if ("报警低4限" == alarmDesc) {
                return this.numberToColor(info.C4);
            } else {
                return "#000000";
            }
        },
        /**
         *  数值 转为 color
         * @param value
         */
        numberToColor: function (value) {
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
        ,
        /**
         * 获取点的类型
         * @param value
         * @returns {*}
         */
        getPointType: function (value) {
            switch (value) {
                case 0:
                    return 'AX';
                case 1:
                    return 'DX';
                case 2:
                    return 'I2';
                case 3:
                    return 'I4';
                case 4:
                    return 'R8';
                default:
                    return 'AX';
            }
        }
        ,
        /**
         * 获取质量
         * @param value
         */
        getQuality: function (value) {
            if (value < 0) {
                return 'TimeOut';
            }
            var as = value & 1023;
            as = as >> 8;
            switch (as) {
                case 0:
                    return 'Good';
                case 1:
                    return 'Fair'
                case 2:
                    return 'Poor';
                case 4:
                    return 'Bad';
                default :
                    return 'TimeOut';
            }
        }
        ,
        /**
         * 将获取到的数据进行处理
         * @param value
         */
        initDataSta: function (value, names, idsNameMap) {
            var data = new this.UtilMap();
            for (var i = 0; i < value.length; i++) {
                var obj = value[i];
                var id = obj.ID;
                var datas = data.get(id);
                if (!datas || datas.length < 1) {
                    datas = new Array();
                    data.put(id, datas);
                }
                datas.push(obj);
            }
            return this.initdataArray(data, names, idsNameMap);
        }
        ,
        /**
         * 将转过来的 数据进行处理
         * @param value
         * @returns {UtilMap}
         */
        initdataArray: function (value, names, idsNameMap) {
            var size = names.length;
            var valueSize = value.size();
            var result = new this.UtilMap();
            //遍历所有的点
            for (var i = 0; i < size; i++) {
                //遍历所有的值
                for (var t = 0; t < valueSize; t++) {
                    var key = value.getKey(t);
                    //如果点对应起来
                    if (names[i] == idsNameMap.get(key)) {
                        var objArray = value.get(key);
                        if (!objArray) {
                            objArray = new Array();
                        }
                        var length = objArray.length;
                        for (var j = 0; j < length; j++) {
                            var obj = objArray[j];
                            var tm = obj.TM;
                            var avS = result.get(tm);
                            if (!avS || avS.length < 1) {
                                avS = new Array(size);
                                result.put(tm, avS);
                            }
                            avS[i] = obj.AV;
                        }
                        break;
                    }
                }
            }
            return result;
        },
        /**
         *  根据要查询的开始时间和结束时间 计算间隔值
         * @param beginTime
         * @param endTime
         */
        getInterval: function (beginTime, endTime) {
            var interval = 1;
            interval = (endTime - beginTime) / 300;
            if (interval < 1) {
                interval = 1;
            }
            return parseInt(interval);
        },
        /**
         * 获取map对应的 key 集合
         * @param utilMap
         * @returns {Array}
         */
        getMapKeyArray: function (utilMap) {
            var keyArray = new Array();
            for (var i = 0; i < utilMap.size(); i++) {
                keyArray.push(utilMap.getKey(i));
            }
            return keyArray;
        },
        /**
         * 判断DS状态 如果 15 为1  超时
         *
         * 14 位 为 1 数据库首次开始接收数据
         * @param DS
         */
        statusOfDS: function (DS) {
            if (DS < 0)
                return true;
            var ds = DS >> 15;
            if (ds > 0) {
                return true;
            }
            return false;
        }
        ,
        /***
         * map 类
         * @constructor
         */

        UtilMap: function () {
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
            var getKey = function (index) {
                if (index > -1 && index < this.arr.length) {
                    return this.arr[index].key;
                }
                return null;
            };
            var containsKey = function (key) {
                for (var i = 0; i < this.arr.length; i++) {
                    if (this.arr[i].key === key) {
                        return true;
                    }
                }
                return false;
            }
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
            this.arr = new Array();
            this.get = get;
            this.getKey = getKey;
            this.containsKey = containsKey;
            this.put = put;
            this.remove = remove;
            this.size = size;
            this.isEmpty = isEmpty;
        }
    }
module.exports = rsaUtils;


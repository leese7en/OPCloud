/**
 * Created by se7en on 2015/11/9.
 */
var fs = require("fs");
var zlib = require('zlib');
var Buffer = require('buffer').Buffer;
var path = require('path');
var Stream = require('stream')
var xml2obj = require('xml2obj-stream');
var async = require("async");
var graphConst = require("./graphConst");
var domParser = require('xmldom').DOMParser;

log = function (obj) {
    console.log(obj)
}

function zml2json(_proto) {
    var elementKey = "datas";
    var xmlData = {};
    openplant(_proto, xmlData);
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
        var temp = new Object();
        if (key == "BackGround") {
            for (var attr in xmlObj.$attrs) {
                temp[attr] = xmlObj.$attrs[attr];
            }
            if (Array.isArray(xmlObj.$children)) {
                temp["propertys"] = new Object();
                xmlObj.$children.forEach(function (item) {
                    mapperPropertys(item, temp)
                });
            }
        } else if (key == "Elements") {
            for (var attr in xmlObj.$attrs) {
                temp[attr] = xmlObj.$attrs[attr];
            }

            if (Array.isArray(xmlObj.$children)) {
                if (!temp[elementKey]) {
                    temp[elementKey] = new Array();
                }
                xmlObj.$children.forEach(function (item) {
                    var itemEl = new Object();
                    if (item.$name.toUpperCase() == "EL") {
                        itemEl = mapperElement(item, itemEl)
                        temp[elementKey].push(itemEl);
                    }
                });
            }
        }
        xmlData[key] = temp;
    }

    function mapperElement(xmlObj, data) {
        for (var attr in xmlObj.$attrs) {
            data[attr] = xmlObj.$attrs[attr];
        }
        if (Array.isArray(xmlObj.$children)) {
            data["propertys"] = new Object();
            xmlObj.$children.forEach(function (item) {
                mapperPropertys(item, data)
            });
        }
        return data;
    }


    function mapperPropertys(xmlObj, data) {
        var key = null;
        var values = new Object();
        for (var attr in xmlObj.$attrs) {
            if (attr == "name") {
                key = xmlObj.$attrs[attr];
            } else {
                values[attr] = (xmlObj.$attrs[attr])
            }
        }
        data["propertys"][key] = values;
    }

    return xmlData;
}


function formatScript(value) {
    var points = new Array()
    points = getDCSNameFromScript(value, points);
    return arrayDelRepeat(points);
}

function getDCSNameFromScript(expression, _points) {
    var r, i = 0;
    while (r = graphConst.PATT_POINT_NAME.exec(expression)) {
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
            newArray.push(cache);
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


    _getXMLPointMap: function (xmlDoc) {
        var pointsMap = {};
        var pointsArray = new Array();
        var doc = new domParser().parseFromString(xmlDoc, 'text/xml');
        var docRoot = doc.documentElement;
        var childNodes = docRoot.childNodes;
        var indexMap = {};
        var count = 0;
        for (var i = 0; i < childNodes.length; i++) {
            var childNode = childNodes[i];
            if (childNode.tagName == 'Elements') {
                var childs = childNode.childNodes;
                for (var j = 0; j < childs.length; j++) {
                    var child = childs[j];
                    if (child.nodeType == 1) {
                        var properties = child.childNodes;
                        var zindex = -1;
                        for (var t = 0; t < properties.length; t++) {
                            var property = properties[t];
                            if (property.nodeType == 1) {
                                var name = property.getAttribute('name');
                                var value = property.getAttribute('value');

                                if (name == graphConst.ELEMENT_PROPERTY_Z_INDEX) {
                                    if (value != undefined) {
                                        zindex = value
                                        if (pointsMap[zindex] == undefined) {
                                            pointsMap[zindex] = [];
                                        }
                                    }
                                }
                                if (name == graphConst.DASHPOINT_PROPERTY_POINTNAME) {
                                    if (value != undefined) {
                                        if (zindex != -1) {
                                            pointsMap[zindex].push(value);
                                        }

                                        if (!indexMap[value]) {
                                            indexMap[value] = [];
                                        }
                                        indexMap[value].push(zindex);
                                        pointsArray.push(value);
                                    }
                                }
                                if (name == graphConst.ELEMENT_PROPERTY_REFRESH_SCRIPT || name == graphConst.ELEMENT_PROPERTY_MOUSEEVENT_SCRIPT || name == graphConst.ELEMENT_PROPERTY_REFRESH_SCRIPT_DCSPOINTS) {
                                    var points = formatScript(value);
                                    if (zindex != -1) {
                                        pointsMap[zindex] = pointsMap[zindex].concat(points);
                                    }
                                    pointsArray = pointsArray.concat(points);
                                    points.forEach(function (point) {
                                        if (!indexMap[point]) {
                                            indexMap[point] = [];
                                        }
                                        indexMap[point].push(zindex);
                                    });
                                }
                            }
                        }
                    }

                }
            }
        }
        for (var key in pointsMap) {
            if (pointsMap[key] && pointsMap[key].length) {
                pointsMap[key] = arrayDelRepeat(pointsMap[key])
            } else {
                delete pointsMap[key]
            }
        }
        pointsArray = arrayDelRepeat(pointsArray);
        pointsMap["all"] = pointsArray;
        for (var key in indexMap) {
            if (indexMap[key] && indexMap[key].length) {
                indexMap[key] = arrayDelRepeat(indexMap[key])
            } else {
                delete indexMap[key]
            }
        }
        pointsMap["keyIndexs"] = indexMap;

        return pointsMap;
    },
    /**
     * 根据传递过来的文件路径，获取xml文件内容
     * @param filePath
     */
    getJson: function (filePath, callback) {
        var _this = this;
        this._getXml(filePath, function (xml) {
            var pointsMap = _this._getXMLPointMap(xml);
            var readStream = new Stream()
            var parseStream = new xml2obj.Parser(readStream);
            parseStream.setTransformation(zml2json);
            parseStream.each('Openplant', function (item) {
                callback(filePath, item, pointsMap)
            });
            readStream.emit('data', xml);
        });
    }
}
module.exports = zxmlUtils;

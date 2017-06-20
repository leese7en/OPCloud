/**
 * Created by se7en on 2015/11/9.
 */

var zxmlUtils = require("./zxmlUtils")
var graphConst = require("./graphConst");
var domParser = require('xmldom').DOMParser;
var file = '../../../public/diagram/unit1/1RCP001YCD.zxml';
zxmlUtils._getXml(file, function (value) {
    var pointsArray = new Array();
    var doc = new domParser().parseFromString(value, 'text/xml');
    var docRoot = doc.documentElement;
    var childNodes = docRoot.childNodes;
    var count = 0;
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
                            if (name == graphConst.DASHPOINT_PROPERTY_POINTNAME) {
                                // console.log(count++ +"\t "+property.getAttribute('value'))
                                pointsArray.push(property.getAttribute('value'));
                            }
                            if (name == graphConst.ELEMENT_PROPERTY_REFRESH_SCRIPT || name == graphConst.ELEMENT_PROPERTY_MOUSEEVENT_SCRIPT || name == graphConst.ELEMENT_PROPERTY_REFRESH_SCRIPT_DCSPOINTS) {
                                pointsArray = pointsArray.concat(formatScript(property.getAttribute('value')));
                            }
                        }
                    }
                }

            }
        }
    }
    pointsArray = arrayDelRepeat(pointsArray)
    for (var t = 0; t < pointsArray.length; t++) {
        console.log(t + ' : ' + pointsArray[t].toString());
    }
});


function formatScript(value) {
    var points = new Array()
    points = getDCSNameFromScript(value, points);
    return arrayDelRepeat(points);
}

function getDCSNameFromScript(expression, _points) {
    var r, i = 0;
    while (r = graphConst.PATT_POINT_NAME.exec(expression)) {
        var _pointName = r[0];
        while (t = graphConst.PATT_DCSPOINT_NAME.exec(_pointName)) {
            _points.push(t[0]); // 添加到最后
        }
    }
    return _points;
}

function arrayDelRepeat(array) {
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

var getXmlPoints = {};

module.exports = getXmlPoints;
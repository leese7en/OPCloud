/**
 * Created by se7en on 2015/11/9.
 */

var fs = require("fs");
var path = require('path');
var zxmlUtils = require('./zxmlUtils');
var domParser = require('xmldom').DOMParser;
var file = '../../public/diagram/demo_main.zxml';
zxmlUtils.getXml(file, function (value) {
    var pointsArray = new Array();
    var doc = new domParser().parseFromString(value, 'text/xml');
    var docRoot = doc.documentElement;
    var childNodes = docRoot.childNodes;
    for (var i = 0; i < childNodes.length; i++) {
        var childNode = childNodes[ i ];
        if (childNode.tagName == 'Elements') {
            var childs = childNode.childNodes;
            for (var j = 0; j < childs.length; j++) {
                var child = childs[ j ];
                if (child.nodeType == 1) {
                    var properties = child.childNodes;
                    for (var t = 0; t < properties.length; t++) {
                        var property = properties[ t ];
                        if (property.nodeType == 1) {
                            var name = property.getAttribute('name');
                            if (name == zxmlUtils.DASHPOINT_PROPERTY_POINTNAME) {
                                pointsArray.push(property.getAttribute('value'));
                            }
                            if (name == zxmlUtils.ELEMENT_PROPERTY_REFRESH_SCRIPT || name == zxmlUtils.ELEMENT_PROPERTY_MOUSEEVENT_SCRIPT || name == zxmlUtils.ELEMENT_PROPERTY_REFRESH_SCRIPT_DCSPOINTS) {
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
        console.log(t + ' : ' + pointsArray[ t ].toString());
    }
});


function formatScript(value) {
    var points = new Array();
    for (var i = 0; i < zxmlUtils.scriptPattern.length; i++) {
        var sp = zxmlUtils.scriptPattern[ i ];
        var matcher = value.match(sp);
        //console.log('length:' + matcher.length);
        if (matcher && matcher.length > 0) {
            for (var j = 0; j < matcher.length; j++) {
                points.push(matcher[ j ]);
            }
        }
    }
    return arrayDelRepeat(points);
}

function arrayDelRepeat(array) {
    var newArray = new Array();
    var len = array.length;
    for (var i = 0; i < len; i++) {
        for (var j = i + 1; j < len; j++) {
            if (array[ i ] === array[ j ]) {
                j = ++i;
            }
        }
        newArray.push(array[ i ]);
    }
    return newArray;
}

var getXmlPoints = {};

module.exports = getXmlPoints;
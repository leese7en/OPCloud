/**
 * Created by se7en on 2015/11/9.
 */
var fs = require("fs");
var zlib = require('zlib');
var Buffer = require('buffer').Buffer;
var fs = require('fs');
var path = require('path');
/**
 * zxml 文件转 xml文件
 * @type {{getXml: Function}}
 */

var zxmlUtils = {
    scriptPattern: [ /(av(\'=?)(\S*)(?=\'))/, /(as(\'=?)(\S*)(?=\'))/, /(avmask(\'=?)(\S*)(?=\'))/, /(asmask(\'=?)(\S*)(?=\'))/, /(bv(\'=?)(\S*)(?=\'))/, /(tv(\'=?)(\S*)(?=\'))/ ],
    ELEMENT_PROPERTY_REFRESH_SCRIPT: "base.refresh.script",
    ELEMENT_PROPERTY_MOUSEEVENT_SCRIPT: "base.mouseevent.script",
    ELEMENT_PROPERTY_REFRESH_SCRIPT_DCSPOINTS: "base.refresh.script.dcspoints",
    DASHPOINT_PROPERTY_POINTNAME: "dashpoint.pointname",
    DASHPOINT_TREND_POINTNAME: "dashpoint.trend.pointnames",
    PIECHART_PROPERTY_POINTN_LISTINFO: "piechart.point.listinfo",
    BARCHART_PROPERTY_POINTN_LISTINFO: "barchart.point.listinfo",
    TREND_PROPERTY_TYPE_OBJECT: "trend.typeobject",//
    ERROR_VIEW: '<?xml version=\'1.0\' encoding=\'UTF-8\'?> <Openplant> <BackGround class="com.magustek.graph.ui.viewer.GBackGround"> <Pr name="background.minsize" value="1024,768"/> <Pr name="background.drawfill" value="1/rgba(255,255,255,255)/rgba(64,64,64,255)/0/0/0"/> <Pr name="background.currentsize" value="1024,768"/></BackGround></Openplant>',

    /**
     * 根据传递过来的文件路径，获取xml文件内容
     * @param fileName
     */
    getXml: function (fileName, callback) {
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
            if (ext == '.zxml') {
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
            }
            else if (ext == '.xml') {
                callback(buffer.toString());
            }
            else {
                callback(buffer.toString());
            }
        });
    },
    /**
     * 根据传递过来的文件路径，获取xml文件内容
     * @param fileName
     */
    getJson: function (fileName, callback) {
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
            if (ext == '.zxml') {
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
            }
            else if (ext == '.xml') {
                callback(buffer.toString());
            }
            else {
                callback(buffer.toString());
            }
        });
    }
}
module.exports = zxmlUtils;

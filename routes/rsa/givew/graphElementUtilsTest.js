var fs = require('fs');
var path = require('path');
var cache = require('memory-cache');
var zxmlUtils = require("./zxmlUtils");
var graphConst = require("./graphConst");
var graphElementUtils = require("./graphElementUtils")
var basePath = "../../../public/diagram";
var async = require("async");
var debug = function (message) {
    console.log(message);
}
//
// var tasks = new Array();
//
// String.prototype.replaceAll = function (pattern, str) {
//     return this.replace(new RegExp(pattern, "gm"), str);
// };
// initTasks(basePath);
// function initTasks(filePath) {
//     var files = fs.readdirSync(filePath);
//     for (var i = 0; i < files.length; i++) {
//         var fileName = files[i].toString();
//         var ext = path.extname(fileName);
//         if (ext == '.zxml') {
//             tasks.push((filePath + "/" + fileName));
//         } else if (ext == "") {
//             var dir = fs.statSync(filePath + "/" + fileName);
//             if (dir.isDirectory()) {
//                 initTasks(filePath + "/" + fileName)
//             }
//         }
//     }
// }
//
// debug("tasks : " + tasks.length)

var path = "unit1/1RCP001YCD.zxml";

console.time("getZXML");
graphElementUtils.get(path, function (data,pointsMap) {
    // console.log(data);
    // console.log(pointsMap)
    console.timeEnd("getZXML");
});


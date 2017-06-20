var fs = require('fs');

contactFile();
function contactFile() {
    var basePath = '../../public/javascripts/';
    var out = '../../public/javascripts/viewCanvas/openPlant.js';
    var fileNames = new Array();
    var exists = fs.existsSync(out);
    var files = fs.readdirSync(basePath);
    for (var i = 0; i < files.length; i++) {
        var fileName = files[i].toString();
        if (fileName != "viewCanvas" && fileName != "diagram") {
            fileNames.push(files[i].toString())
        }
    }
    if (exists) {
        fs.unlink(out, function (err) {
            if (err) {
                console.log('删除文件失败');
            }
            else {
                console.log('文件存在，删除文件成功');
                mergeFile(basePath, fileNames, out);
            }
        });
    } else {
        mergeFile(basePath, fileNames, out);
    }
}
function mergeFile(basePath, fileNames, out) {
    console.log('合并文件开始');
    for (var i = 0; i < fileNames.length; i++) {
        var data = fs.readFileSync(basePath + fileNames[i]);
        fs.appendFileSync(out, data);
        fs.appendFileSync(out, '\n\n');
    }
    if (i == fileNames.length) {
        console.log('合并文件结束');
    }
}



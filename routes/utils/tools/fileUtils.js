var fs = require('fs');
var fileUtils = {
    /**
     * 递归删除文件
     * @param path
     */
    rmdirSync: function (path) {
        var that = this;
        if (!fs.statSync(path).isDirectory()) {
            fs.unlinkSync(path);
        }
        var files = [];
        if (fs.existsSync(path)) {
            files = fs.readdirSync(path);
            files.forEach(function (file, index) {
                var curPath = path + "/" + file;
                if (fs.statSync(curPath).isDirectory()) { // recurse
                    that.rmdirSync(curPath);
                } else { // delete file
                    fs.unlinkSync(curPath);
                }
            });
            fs.rmdirSync(path);
        }
    },
    /**
     * 检查是否有同名文件
     * @param sourcePath
     * @param targetPath
     */
    checkSameFile: function (sourcePath, targetPath) {
        var that = this;
        var sourceFiles = that.getDirectory(sourcePath);
        var targetFiles = that.getDirectory(targetPath);
        var sourceObj = {}
        for (var i in sourceFiles) {
            sourceObj[sourceFiles[i]] = sourceFiles[i];
        }
        var targetArray = [];
        for (var i in targetFiles) {
            var targetURI = targetFiles[i].replace(targetPath, sourcePath);
            targetArray.push(targetURI);
        }
        for (var i in targetArray) {
            if (sourceObj[targetArray[i]]) {
                return true;
            }
        }
        return false;
    },
    /**
     * 获取文件夹是否所有的文件和文件夹
     * @param path
     * @returns {Array}
     */
    getDirectory: function (path) {
        var that = this;
        var files = [];
        var names = [];
        if (fs.existsSync(path)) {
            files = fs.readdirSync(path);
            files.forEach(function (file, index) {
                var curPath = path + "/" + file;
                if (fs.statSync(curPath).isDirectory()) {
                    var ns = that.getDirectory(curPath);
                    names = names.concat(ns);
                } else {
                    names.push(curPath);
                }
            });
        }
        return names;
    },

    /**
     * 获取文件夹是否所有的文件和文件夹
     * @param path
     * @returns {Array}
     */
    fileTree: function (path, pId, index) {
        var that = this;
        var files = [];
        var fls = [];
        var fileObj = {};
        if (!pId) {
            fileObj = {ID: index, PID: pId, URI: path, NAME: 'ROOT', type: 1};
            fls.push(fileObj);
            //设定开始文件 上级ID
            pId = index;
        }
        if (fs.existsSync(path)) {
            //读取文件目录
            files = fs.readdirSync(path);
            //定义目录对象，用于后面遍历文件
            var dirs = {};
            //遍历文件夹下文件
            files.forEach(function (file, indexF) {
                var curPath = path + "/" + file;
                var isDirectory = fs.statSync(curPath).isDirectory();
                var type = that.isImageOrZxml(file);
                if (isDirectory || type > 0) {
                    index++;
                    if (isDirectory) {
                        type = 1;
                        dirs[index] = curPath;
                    }
                    //构建文件对象
                    fileObj = {ID: index, PID: pId, URI: curPath, NAME: file, type: type, isDomain: 0};
                    fls.push(fileObj);
                }
            });
            for (var i in dirs) {
                var curPath = dirs[i];
                //递归遍历文件夹，将对应的文件按着树形结构展示出来
                var ns = that.fileTree(curPath, i, index++);
                // 设定文件ID ，递归调用会破坏index 的值引用
                index += ns.length;
                //合并数组
                fls = fls.concat(ns);
            }
        }
        return fls;
    },
    /**
     * 当前文件类型 图片或者 zxml
     * @param file
     */
    isImageOrZxml: function (file) {
        var fls = file.split('.');
        var ext = fls[fls.length - 1].toLowerCase();
        if ('png' == ext || 'gif' == ext || 'jpg' == ext || 'jpeg' == ext || 'bmp' == ext) {
            return 2;
        } else if ('zxml' == ext) {
            return 3;
        }
        return -1;
    },
    /**
     * 同步复制文件
     * @param sourceURI
     * @param targetURI
     */
    copyFileSync: function (sourceURI, targetURI) {
        var that = this;
        if (fs.existsSync(sourceURI) && fs.existsSync(targetURI)) {
            that.copyDirectorySync(sourceURI, sourceURI, targetURI);
            that.renameFilesSync(sourceURI, sourceURI, targetURI);
        }
    },
    copyDirectorySync: function (path, sourceURI, targetURI) {
        var that = this;
        var files = fs.readdirSync(path);
        if (files.length < 1) {
            return;
        }
        files.forEach(function (file, index) {
            var curPath = path + "/" + file;
            if (fs.statSync(curPath).isDirectory()) {
                fs.mkdirSync(targetURI + '/' + curPath.replace(sourceURI + '/', ''));
                that.copyDirectorySync(curPath, sourceURI, targetURI);
            }
        });
        return;
    },
    renameFilesSync: function (path, sourceURI, targetURI) {
        var that = this;
        var files = fs.readdirSync(path);
        if (files.length < 1) {
            return;
        }
        files.forEach(function (file, index) {
            var curPath = path + "/" + file;
            if (!fs.statSync(curPath).isDirectory()) {
                fs.rename(curPath, targetURI + curPath.replace(sourceURI, ''));
            } else {
                that.renameFilesSync(curPath, sourceURI, targetURI);
            }
        });
        return;
    }
};
module.exports = fileUtils;

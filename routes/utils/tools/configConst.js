var fs = require('fs');
var filePath = './config/config.json';
var JsonObj = JSON.parse(fs.readFileSync(filePath));
var configConst = {
    //'emailAddress': 'http://127.0.0.1',//需要动态获取
    'filePath': './public/userfile'
}
module.exports = configConst;

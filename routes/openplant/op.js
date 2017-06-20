var actionUtil = require("../framework/action/actionUtils")();
var query = actionUtil.query;
var opPool = require('../openplant/openPlantPool');
var utils = require('../rsa/rsaUtils');
var moduleName = "openplant";
var message = {
    flag: 0,
    message: '成功',
    data: null
}

var openplant = {
    /**
     * 获取用户菜单信息
     * @param req
     * @param res
     */
    getServerTime: function (req, res) {
        var nowTime = opPool.getConnect().systemTime();
        if (!nowTime) {
            message.flag = -1;
            message.message = '获取数据失败';
        } else {
            message.flag = 0;
            message.data = nowTime;
        }
        res.send(message);
    }
}

module.exports = openplant;

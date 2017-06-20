var opPool = require('../openplant/openPlantPool');
var message = {
    flag: 0,
    message: '成功',
    data: null
}

var publicInfo = {
    /**
     * 获取系统时间
     * @param req
     * @param res
     */
    systemTime: function(req, res) {
        var time = opPool.systemTime();
        message.flag = 0;
        message.data = time;
        res.json(message);
    }

}

module.exports = publicInfo;

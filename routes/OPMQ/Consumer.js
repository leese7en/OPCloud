/**
 * Created by tp on 2016/9/20.
 */

var events = require('events');

var Consumer = function (SID, socket, producer) {
    this.producer = producer;
    this.idList = [];
    this.nameList = [];
    this.indexList = [];
    this.cacheList = [];
    this.changeList = {};
    this.dataList = [];
    this.socket = socket;
    var _this = this;
    //定义数据变更监听
    this.dataChangeEvent = new events.EventEmitter();
    var change = function () {
        //进入时清空已缓存的变更列表
        _this.changeList = {};
        //获取新数据
        //若第一次进入，无缓存数据，直接提交为全部返回
        if (_this.cacheList.length == 0) {
            _this.indexList.forEach(function (dataIndex, index) {
                var row = producer.dataList[dataIndex];
                _this.dataList.push(row);
                var key = _this.nameList[index];
                _this.changeList[key] = (row);
            })
        } else {
            //比对缓存结果与当前结果
            _this.indexList.forEach(function (dataIndex, index) {
                var row = producer.dataList[dataIndex];
                var cacheData = _this.cacheList[index];
                if (cacheData.TM != row.TM) {
                    //添加变更列表
                    //添加清单时，需要检查ID 是否为-1
                    if (row.ID != -1) {
                        var key = _this.nameList[index];
                        _this.changeList[key] = (row);
                    }
                }
                //添加最新一批数据缓存
                _this.dataList.push(row);
            });
        }
        _this.cacheList = _this.dataList;
        _this.dataList = [];
        if (_this.socket && _this.changeList && Object.getOwnPropertyNames(_this.changeList).length > 0) {
            _this.socket.emit('dataChange', _this.changeList);
        }
    }

    this.dataChangeEvent.on("dataChange", change);
    this.clear = function () {
        _this.cacheList = [];
        _this.dataList = [];
        _this.idList = [];
        _this.nameList = [];
        _this.indexList = [];
        _this.changeList = {};
    }
    this.destroy = function () {
        _this.clear();
        _this.socket = null;
        //避免监听对象事件触发
        _this.dataChangeEvent.removeListener('dataChange', change); //移除事件;
    }
}


module.exports = Consumer;

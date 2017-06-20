/**
 * Created by tp on 2016/9/20.
 */

var schedule = require("node-schedule");
var opPool = require('../openplant/openPlantPool');
var events = require('events');
var logger = require('log4js').getLogger('system');

var Producer = function () {
    //自增长索引
    this.index = 0;
    //所有订阅的ID集合
    this.idList = [];
    //所有订阅的ID的数据集合
    this.dataList = [];
    this.cacheList = [];
    this.consumerList = [];
    //缓存ID为KEY，对应订阅ID的IDList集合下标、当前最新订阅者版本，订阅数量等数据
    this.cacheMap = {};
    //可回收的索引集合
    this.trashList = [];

    var rule = new schedule.RecurrenceRule();
    var times = [];
    for (var i = 0; i < 60; i++) {
        times.push(i);
    }
    rule.second = times;

    //定义数据变更监听
    var dataChangeListening = new events.EventEmitter();
    dataChangeListening.on("change", function () {
        for (var key in _this.consumerList) {
            _this.consumerList[key].dataChangeEvent.emit('dataChange');
        }
    });
    var refreshJob = schedule.scheduleJob(rule, function () {
        if (_this.idList.length > 0) {
            var cols = ["ID", "DS", "TM", "AV"];
            opPool.find("Realtime", 'ID', _this.idList, cols, function (error, rows, columns) {
                if (!error) {
                    //更新数据体
                    _this.dataList = rows;
                    //通知监听
                    dataChangeListening.emit('change');
                }
            });
        }
    });

    //自变量，闭包使用
    var _this = this;

    //消费者注册
    this.register = function (SID, consumer) {
        _this.consumerList[SID] = consumer;
    }

    //消费者反注册
    this.eregister = function (SID) {
        delete _this.consumerList[SID];
    }

    //订阅测点信息
    this.subscription = function (idList, SID, consumer) {
        //检查结构是否满足要求
        if (idList instanceof Array) {
            //消费者登记
            _this.register(SID, consumer);
            //时间标记
            var now = new Date().getTime();
            var indexList = [];
            idList.forEach(function (id, index) {
                var key = id;
                var idIndex = -1;
                var cacheData = _this.cacheMap[key]
                if (cacheData == undefined) {
                    //存在可回收资源，复用索引
                    if (_this.trashList.length > 0) {
                        //回收站内取出最末位置的索引，数组结构不用移动，性能最高
                        idIndex = _this.trashList.pop();
                    } else {
                        //采用递增构建新结构
                        idIndex = _this.index++;
                    }
                    cacheData = {index: idIndex, consumerSize: 1, time: now};
                    //初始化订阅清单
                    _this.cacheMap[key] = cacheData;
                    _this.idList[idIndex] = id;
                } else {
                    //添加订阅计数
                    cacheData.consumerSize += 1;
                    //添加版本时间标记
                    cacheData.time = now;
                }
                //更新索引清单
                indexList[index] = cacheData.index;
            })
        }
        return indexList;
    }

    //取消订阅信息
    this.unsubscribe = function (idList) {
        if (idList instanceof Array) {
            idList.forEach(function (id, index) {
                var cacheData = _this.cacheMap[id];
                if (cacheData) {
                    //获取取消订阅元素的索引
                    var cacheIndex = cacheData.index;
                    //订阅者取消计数
                    cacheData.consumerSize -= 1;
                    //若无人使用时，回收其他资源，通知GC进行数据处理
                    if (cacheData.consumerSize == 0) {
                        //ID索引复原
                        _this.idList[cacheIndex] = -1;
                        //添加索引回收站
                        _this.trashList.push(cacheIndex);
                        //移除清单元素
                        delete _this.cacheMap[id];
                    }
                }
            });
            //更e新订阅的ID集合
            // var ids = new Array();
            // for (var i in _this.idList) {
            //     if (_this.idList[i] != -1) {
            //         ids.push(_this.idList[i]);
            //     }
            // }
            // _this.idList = ids;
        }
    }
}
module.exports = Producer;

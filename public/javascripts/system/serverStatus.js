/**
 * 初始话组件
 */
var docHeight = $('#chartContainer').height() - 50;
var docWidth = $('#chartContainer').width() - 200;
/**
 * 启动任务监听
 */
function initSocketOn() {
    socket.on('server/serverStatus', function (data) {
        refreshData(data);
    });
    setInterval(function () {
        socket.emit('server/serverStatus', '');
    }, 2000);
}
var dataCPU = [];
var dataMEM = [];
var dataHD = [];
var dataFLOW = [];
var agentTotalOption = {
    tooltip: {
        formatter: "{a} <br/>{c} {b}"
    },
    toolbox: {
        show: false,
        feature: {
            mark: {show: true},
            restore: {show: true},
            saveAsImage: {show: true}
        }
    },
    series: [
        {
            name: 'CPU',
            type: 'gauge',
            min: 0,
            max: 100,
            splitNumber: 10,
            center: ['50%', '50%'],    // 默认全局居中
            radius: '90%',
            axisLine: {            // 坐标轴线
                lineStyle: {       // 属性lineStyle控制线条样式
                    color: [[0.09, 'lime'], [0.82, '#1e90ff'], [1, '#ff4500']],
                    width: 3,
                    shadowColor: '#fff', //默认透明
                    shadowBlur: 10
                }
            },
            axisTick: {            // 坐标轴小标记
                length: 15,        // 属性length控制线长
                lineStyle: {       // 属性lineStyle控制线条样式
                    color: 'auto',
                    shadowColor: '#fff', //默认透明
                    shadowBlur: 10
                }
            },
            splitLine: {           // 分隔线
                length: 25,         // 属性length控制线长
                lineStyle: {       // 属性lineStyle（详见lineStyle）控制线条样式
                    width: 3,
                    color: '#fff',
                    shadowColor: '#fff', //默认透明
                    shadowBlur: 10
                }
            },
            pointer: {           // 分隔线
                shadowColor: '#fff', //默认透明
                shadowBlur: 5
            },
            title: {
                textStyle: {       // 其余属性默认使用全局文本样式，详见TEXTSTYLE
                    fontWeight: 'bolder',
                    fontSize: 20,
                    fontStyle: 'italic',
                    color: '#fff',
                    shadowColor: '#fff', //默认透明
                    shadowBlur: 10
                }
            },
            detail: {
                backgroundColor: 'rgba(30,144,255,0.8)',
                borderWidth: 1,
                borderColor: '#fff',
                shadowColor: '#fff', //默认透明
                shadowBlur: 3,
                offsetCenter: [0, '50%'],       // x, y，单位px
                textStyle: {       // 其余属性默认使用全局文本样式，详见TEXTSTYLE
                    fontWeight: 'bolder',
                    color: '#fff'
                }
            },
            data: [{value: 40, name: '%'}]
        },
        {
            name: '内存',
            type: 'gauge',
            center: ['17%', '60%'],    // 默认全局居中
            radius: '85%',
            min: 0,
            max: 100,
            splitNumber: 10,
            axisLine: {            // 坐标轴线
                lineStyle: {       // 属性lineStyle控制线条样式
                    color: [[0.29, 'lime'], [0.86, '#1e90ff'], [1, '#ff4500']],
                    width: 2,
                    shadowColor: '#fff', //默认透明
                    shadowBlur: 10
                }
            },
            axisTick: {            // 坐标轴小标记
                length: 12,        // 属性length控制线长
                lineStyle: {       // 属性lineStyle控制线条样式
                    color: 'auto',
                    shadowColor: '#fff', //默认透明
                    shadowBlur: 10
                }
            },
            splitLine: {           // 分隔线
                length: 20,         // 属性length控制线长
                lineStyle: {       // 属性lineStyle（详见lineStyle）控制线条样式
                    width: 3,
                    color: '#fff',
                    shadowColor: '#fff', //默认透明
                    shadowBlur: 10
                }
            },
            pointer: {
                width: 5,
                shadowColor: '#fff', //默认透明
                shadowBlur: 5
            },
            title: {
                offsetCenter: [0, '-30%'],       // x, y，单位px
                textStyle: {       // 其余属性默认使用全局文本样式，详见TEXTSTYLE
                    fontWeight: 'bolder',
                    fontStyle: 'italic',
                    color: '#fff',
                    shadowColor: '#fff', //默认透明
                    shadowBlur: 10
                }
            },
            detail: {
                backgroundColor: 'rgba(30,144,255,0.8)',
                borderWidth: 1,
                borderColor: '#fff',
                shadowColor: '#fff', //默认透明
                shadowBlur: 3,
                height: 25,
                width: 60,
                offsetCenter: [0, '40%'],       // x, y，单位px
                textStyle: {       // 其余属性默认使用全局文本样式，详见TEXTSTYLE
                    fontWeight: 'bolder',
                    color: '#fff',
                    fontSize: 18
                }
            },
            data: [{value: 1.5, name: '%'}]
        },
        {
            name: '磁盘',
            type: 'gauge',
            center: ['83%', '60%'],    // 默认全局居中
            radius: '85%',
            min: 0,
            max: 100,
            splitNumber: 10,
            axisLine: {            // 坐标轴线
                lineStyle: {       // 属性lineStyle控制线条样式
                    color: [[0.29, 'lime'], [0.86, '#1e90ff'], [1, '#ff4500']],
                    width: 2,
                    shadowColor: '#fff', //默认透明
                    shadowBlur: 10
                }
            },
            axisTick: {            // 坐标轴小标记
                length: 12,        // 属性length控制线长
                lineStyle: {       // 属性lineStyle控制线条样式
                    color: 'auto',
                    shadowColor: '#fff', //默认透明
                    shadowBlur: 10
                }
            },
            splitLine: {           // 分隔线
                length: 20,         // 属性length控制线长
                lineStyle: {       // 属性lineStyle（详见lineStyle）控制线条样式
                    width: 3,
                    color: '#fff',
                    shadowColor: '#fff', //默认透明
                    shadowBlur: 10
                }
            },
            pointer: {
                width: 5,
                shadowColor: '#fff', //默认透明
                shadowBlur: 5
            },
            title: {
                offsetCenter: [0, '-30%'],       // x, y，单位px
                textStyle: {       // 其余属性默认使用全局文本样式，详见TEXTSTYLE
                    fontWeight: 'bolder',
                    fontStyle: 'italic',
                    color: '#fff',
                    shadowColor: '#fff', //默认透明
                    shadowBlur: 10
                }
            },
            detail: {
                backgroundColor: 'rgba(30,144,255,0.8)',
                borderWidth: 1,
                borderColor: '#fff',
                shadowColor: '#fff', //默认透明
                shadowBlur: 3,
                height: 25,
                width: 60,
                offsetCenter: [0, '40%'],       // x, y，单位px
                textStyle: {       // 其余属性默认使用全局文本样式，详见TEXTSTYLE
                    fontWeight: 'bolder',
                    color: '#fff',
                    fontSize: 18
                }
            },
            data: [{value: 1.5, name: '%'}]
        }
    ]
};
var agentHistOption = {
    title: {
        text: '近一分钟数据',
        x: 'center',
        show: false
    },
    tooltip: {
        trigger: 'axis',
        formatter: function (params) {
            var length = params.length;
            var time = params[0].name;
            var html = '时间：' + utils.formatTime(time);
            for (var i = 0; i < length; i++) {
                var param = params[i];
                html += '<br/> ' + param.seriesName + ':' + param.value[1];
            }
            return html;
        },
        axisPointer: {
            animation: false
        }
    },
    legend: {
        data: ['CPU', '内存', '磁盘', '流量']
    },
    grid: {
        x: 30,
        y: 50,
        x2: 50,
        y2: 20
    },
    xAxis: {
        type: 'time',
        splitLine: {
            show: false
        },
    },
    yAxis: [
        {
            type: 'value',
            name: '使用率(%)',
            nameTextStyle: {
                color: 'rgba(0,0,0,0.7)'
            },
            axisLabel: {
                textStyle: {
                    color: 'rgba(0,0,0,0.7)'
                }
            },
            interval: 20,
            max: 100
        }, {

            type: 'value',
            name: '流量(KB)',
            nameTextStyle: {
                color: 'rgba(0,0,0,0.7)'
            },
            axisLabel: {
                textStyle: {
                    color: 'rgba(0,0,0,0.7)'
                }
            },
            splitLine: {
                show: false
            }
        }],
    color: ['#CD0000', '#0000AA', '#76EE00', '#8B5A00'],
    series: [{
        name: 'CPU',
        type: 'line',
        showSymbol: false,
        data: dataCPU
    }, {
        name: '内存',
        type: 'line',
        showSymbol: false,
        data: dataMEM
    }, {
        name: '磁盘',
        type: 'line',
        showSymbol: false,
        data: dataHD
    }, {
        name: '流量',
        type: 'line',
        showSymbol: false,
        yAxisIndex: 1,
        data: dataFLOW
    }]
};

$('#agentTotal').css('width', docWidth / 3 * 2);
$('#agentTotal').css('height', docHeight);
$('#agentHist').css('width', docWidth);
$('#agentHist').css('height', 300);
var agentTotal = echarts.init(document.getElementById('agentTotal'));
var agentHist = echarts.init(document.getElementById('agentHist'));
agentHist.setOption(agentHistOption);
function refreshData(data) {
    refreashAgent(data.agent);
    refreshGroup(data.Group);
}
//刷新Agent信息
function refreashAgent(data) {
    $('#agentConn').html(parseInt(data.agentConn));
    $('#agentFlowUp').html(parseFloat(data.agentFlowUp).toFixed(2));
    $('#agentFlowDown').html(parseFloat(data.agentFlowDown).toFixed(2));
    $('#agentNetworkUp').html(parseFloat(data.agentNetworkUp).toFixed(2));
    $('#agentNetworkDown').html(parseFloat(data.agentNetworkDown).toFixed(2));
    var time = parseFloat(data.time * 1000);
    var cpu = parseFloat(data.agentCPU).toFixed(2);
    var mem = parseFloat(data.agentMem).toFixed(2);
    var hd = parseFloat(data.agentHD).toFixed(2);
    var flow = (parseFloat(data.agentFlowUp) + parseFloat(data.agentFlowDown)).toFixed(2);
    agentTotalOption.series[0].data[0].value = cpu;
    agentTotalOption.series[1].data[0].value = mem;
    agentTotalOption.series[2].data[0].value = hd;
    agentTotal.setOption(agentTotalOption);
    initHist(time, cpu, mem, hd, flow);
    agentHist.setOption({
        series: [{data: dataCPU}, {data: dataMEM}, {data: dataHD}, {data: dataFLOW}]
    });
}
$(window).resize(function () {
    docHeight = $('#chartContainer').height() - 50;
    docWidth = $('#chartContainer').width() - 200;
    $('#agentTotal').css('width', docWidth / 3 * 2);
    $('#agentTotal').css('height', docHeight);
    $('#agentHist').css('width', docWidth);
    $('#agentHist').css('height', 300);
    agentTotal.resize();
    agentHist.resize();
});
//刷新数据库信息
function refreshGroup(data) {
    $('#group').empty();
    for (var i in data) {
        var group = data[i];
        var groupName = group.GroupName;
        var html = '<div class="box box-primary"> <div class="box-header with-border"> <i class="ion ion-clipboard"></i> <h3 class="box-title">Group ' + groupName + '运行情况</h3> </div> <div class="row" style="padding-top: 8px; padding-left: 20px;"> ';
        for (var j in group) {
            if (j.indexOf('OP') > -1) {
                var opGroup = group[j];
                var str = '<div class="box-header with-border" style="padding:5px;"> <i class="ion ion-clipboard"></i> <h3 class="box-title" >openPlant ' + opGroup.Host + ' 运行情况</h3> </div> <div class="row" style="padding-top: 8px; padding-left: 10px;"> ';
                str += '<div class="col-lg-2 col-xs-2"> <div class="small-box bg-purple"> <div class="inner"> <h3 >' + opGroup.SESSION + '</h3> <p>当前连接数</p> </div> <div class="icon"> <i class="ion ion-person-stalker"></i> </div> </div> </div>';
                str += '<div class="col-lg-2 col-xs-2"> <div class="small-box bg-red-active"> <div class="inner"> <h3 >' + parseFloat(opGroup.LOAD).toFixed(2) + '</h3> <p>系統负荷(%)</p> </div> <div class="icon"> <i class="ion ion-filing"></i> </div> </div> </div>';
                str += '<div class="col-lg-2 col-xs-2"> <div class="small-box bg-olive"> <div class="inner"> <h3 >' + opGroup.DBMEM + '</h3> <p>占用内存(M)</p> </div> <div class="icon"> <i class="ion ion-soup-can"></i> </div> </div> </div>';
                str += '<div class="col-lg-2 col-xs-2"> <div class="small-box bg-blue"> <div class="inner"> <h3 >' + opGroup.MEMFREE + '</h3> <p>可用内存(M)</p> </div> <div class="icon"> <i class="ion ion-soup-can"></i> </div> </div> </div>';
                str += '<div class="col-lg-2 col-xs-2"> <div class="small-box bg-yellow"> <div class="inner"> <h3 >' + opGroup.VOLFREE + '</h3> <p>可用空间(M)</p> </div> <div class="icon"> <i class="ion ion-pinpoint"></i> </div> </div> </div>';
                str += '<div class="col-lg-2 col-xs-2"> <div class="small-box bg-green"> <div class="inner"> <h3 >' + parseFloat(opGroup.UPTIME).toFixed(2) + '</h3> <p>运行时长(天)</p> </div> <div class="icon"> <i class="ion ion-videocamera"></i> </div> </div> </div>';
                str += '</div>';
                html += str;
            } else {
                continue;
            }
        }
        html += '</div> </div>';
        $('#group').append(html);
    }

}
/**
 * 设置实时数据
 * @param time
 * @param cpu
 * @param mem
 * @param hd
 * @param flow
 */
function initHist(time, cpu, mem, hd, flow) {
    if (dataCPU.length == 0) {
        initHistory(time);
    }
    dataCPU.shift();
    dataMEM.shift();
    dataHD.shift();
    dataFLOW.shift();
    dataCPU.push({key: 'CPU', name: time, value: [time, cpu]});
    dataMEM.push({key: '内存', name: time, value: [time, mem]});
    dataHD.push({key: '磁盘', name: time, value: [time, hd]});
    dataFLOW.push({key: '流量', name: time, value: [time, flow]});

}
/**
 * 初始化历史数据
 * @param time
 */
function initHistory(time) {
    for (var i = 60; i > 0; i--) {
        var tt = time - i * 2000;
        dataCPU.push({key: 'CPU', name: tt, value: [tt, '-']});
        dataMEM.push({key: '内存', name: tt, value: [tt, '-']});
        dataHD.push({key: '磁盘', name: tt, value: [tt, '-']});
        dataFLOW.push({key: '流量', name: tt, value: [tt, '-']});
    }
}


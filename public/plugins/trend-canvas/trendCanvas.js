function log(message) {
    if (window && window.console && console.log) {
        console.log(message);
    }
}

function defaultTrendGroup() {
    this.trendcontainer = 'trend_container';
    this.isMobile = false;
    this.iosPlus = false;
    this.isHorizontalScreen = true;
    this.localFormat = true;
    this.adaptive = false;
    this.opTrend = new opTrend();
    this.socket = null;
    this.canvas_context = null;
    this.pointsTable = 'pointsTable';
    this.pointType = "plot"; // 点的类型
    this.isDialog = false; // 是否是对话框
    this.isInit = false;
    this.flushInterval = 1000; // 刷新频率
    this.formatString = 'yyyy-MM-dd HH:mm:ss';
    this.defaultTrendString = []; // 趋势集合
    this.history = "history"; //历时
    this.trendIntervalId = 0;
    this.trendStopFlushFlags = []; //趋势停刷的集合
    this.trendNormalHeight = document.documentElement.clientHeight * 9 / 10 - 20;
    this.trendNormalWidth = document.documentElement.clientWidth;
    this.trendDialogWidth = 770;
    this.trendDialogHeight = 400;
    this.documentWidth = document.documentElement.clientWidth;
    this.documentHeight = document.documentElement.clientHeight;
    this.viewerFont = 15;
    this.viewerFontLineHeight = 12;
    this.viewerFontSpace = 0;
    this.viewerWidth = 175;
    this.isHide = false;
    this.isLarge = false;
    this.trendInfoPrecentMax = 0.15;
    this.trendInfoHeight = 90;
    this.trendDialogRealHeight = document.documentElement.clientHeight * 8 / 10 - 20;
    this.trendDialogRealWidth = document.documentElement.clientWidth * 9 / 10 - 50;
    this.trendDialogMaxHeight = document.documentElement.clientHeight;
    this.trendDialogMaxWidth = document.documentElement.clientWidth;
    this.trendDialogNormalHeight = document.documentElement.clientHeight * 8 / 10 - 20;
    this.trendDialogNormalWidth = document.documentElement.clientWidth * 9 / 10 - 50;

    this.linePointCount = 1600; // 点的总个数
    this.mouseLeaveXY = []; // 鼠标离开的位置
    this.trendTotleCount = 8; // 趋势总个数
    this.trendIdFlags = []; //趋势ID标记
    this.chcekdPointNames = []; // 选中的点名
    this.trendConfigInfoMap = new trendUtilMap(); // 趋势列表
    this.trendChartColors = ['#FF0000', '#FFFF00', '#00FF00', '#6666E1', '#00FFFF',
        '#FF00FF', '#FF007B', '#804000', '#FFAFAF', '#99CC00', '#FFC800',
        '#CCFFFF', '#695D61', '#00EBA3', '#8540FF', '#FF9900'
    ];
    this.trendColorNotUseing = [];
    this.trendColorUseing = [];
    /**
     * 获取趋势颜色
     * @returns {*}
     */
    this.getTrendColor = function () {
        var co = this.trendColorNotUseing[0];
        this.trendColorNotUseing.shift();
        this.trendColorUseing.push(co);
        return co;
    }
    /**
     * 还回趋势颜色
     * @param color
     */
    this.returnTrendColor = function (color) {
        this.trendColorNotUseing.push(color);
        var cos = [];
        for (var i in this.trendColorUseing) {
            if (this.trendColorUseing[i] != color) {
                cos.push(this.trendColorUseing[i]);
            }
        }
        this.trendColorUseing = cos;
    }
    /**
     * 初始化基本参数
     * @param from
     * @param to
     * @param width
     * @param height
     * @param current
     */
    this.initProperties = function (from, to, width, height, current) {
        this.trendColorNotUseing = this.trendChartColors;
        if (!trend_Util.isNull(from)) {
            this.opTrend.from = from;
        }
        if (!trend_Util.isNull(to)) {
            this.opTrend.to = to;
        }
        this.opTrend.localFormat = this.localFormat;
        // 设置基本信息
        this.opTrend.margin_top = 0;
        this.opTrend.margin_bottom = 0;
        this.opTrend.margin_padding = 0;
        this.opTrend.xAxisScaleCount = 5;
        this.opTrend.trend_backLineCount = 5;
        var _width = this.trendDialogWidth - 50;
        var _bounds = [0, 0, _width, (this.trendDialogHeight - 100) / 10 * 7];
        this.opTrend.canvasX = parseInt(_bounds[0]);
        this.opTrend.canvasY = parseInt(_bounds[1]);
        this.opTrend.canvasWidth = parseInt(_bounds[2] - this.opTrend.margin_padding * 2);
        this.opTrend.canvasHeight = parseInt(_bounds[3] - this.opTrend.margin_top - this.opTrend.margin_bottom);
        this.opTrend.trend_bgColor = "black";
        this.opTrend.trend_bgLineColor = "white";
        this.opTrend.innerBorder_color = "white";
        this.opTrend.isComponents = false;

        if (this.isMobile) {
            this.opTrend.timeFontSize = 18;
            this.opTrend.timeFontLineHeight = 8;
            this.viewerFont = 24;
            this.viewerFontLineHeight = 20;
            this.viewerWidth = 240;
            this.viewerFontSpace = 8;
            if (this.iosPlus) {
                this.opTrend.timeFontSize = 28;
                this.opTrend.timeFontLineHeight = 14;
                this.viewerFont = 32;
                this.viewerFontLineHeight = 28;
                this.viewerWidth = 280;
                this.viewerFontSpace = 24;
            }
        }
    };

    /**
     * 添加点
     * @param names
     * @param from
     * @param to
     * @param width
     * @param height
     * @param current
     */
    this.addName = function (names, from, to, width, height, current) {
        if (this.defaultTrendString.length >= this.trendTotleCount) {
            alert("最多容纳" + this.trendTotleCount + "条曲线");
            return;
        }
        trend_Util.initProperties(from, to, width, height, this);
        this.initProperties(from, to, width, height, current);
        var playing = false;
        if (trend_Util.isNull(from) && trend_Util.isNull(to)) {
            playing = true;
        }
        // 分隔字符串
        var str = names.split(",");
        // 移除相同点
        str = trend_Util.removeArraySameElement(str);
        if (this.defaultTrendString.length == 0) {
            if (!trend_Util.checkNameRE(str, this)) {
                for (var i = 0; i < str.length; i++) {
                    if (this.defaultTrendString.length < this.trendTotleCount) {
                        this.defaultTrendString.push(str[i]);
                    } else {
                        break;
                    }
                }
            }
            this.addTrend(this.defaultTrendString, from, to, playing, current);
        } else if (this.defaultTrendString.length < this.trendTotleCount) {
            if (trend_Util.checkNameRE(str, this)) {
                alert("点名重复");
                this.addTrend(this.defaultTrendString, from, to, playing, current);
            } else {
                for (var i = 0; i < str.length; i++) {
                    if (this.defaultTrendString.length < this.trendTotleCount) {
                        this.defaultTrendString.push(str[i]);
                    } else {
                        break;
                    }
                }
                this.addTrend(this.defaultTrendString, from, to, playing, current);
            }
        }
        // this.setHtmlCss();
    };

    this.reloadData = function (names, from, to, playing, at, ab, current) {
        var socketOn = this.socket;
        var that = this;
        // 清空信息
        $("#" + that.pointsTable + ' tbody').empty();
        socketOn.removeAllListeners('trend/getPointInfo');
        socketOn.removeAllListeners('trend/getTrendHis');
        socketOn.removeAllListeners('trend/refreshTrend');
        if (current) {
            var tt = new Date(current).getTime() - new Date(from).getTime();
            if (tt / 1000 < 600) {
                from = openPlant.GraphUtils.dateformat(new Date(new Date(current).getTime() - 600 * 1000), "yyyy-MM-dd hh:mm:ss");
            }
        }
        //监听获取测点静态数据信息
        socketOn.on('trend/getPointInfo', function (value) {
            var data = value.value;
            var flag = data.flag;
            if (flag < 0) {
                alert(data.message);
                return;
            } else {
                that.initPointInfoTable(data.data, names);
                if (that.isDialog) {
                    that.showDialog();
                } else if (that.isMobile) {
                    that.setHtmlCss();
                }
                socketOn.emit('trend/getTrendHis', {
                    pointsName: names,
                    beginTime: from,
                    endTime: to,
                    pointType: that.pointType,
                    pointCount: that.linePointCount
                });
                if (playing) {
                    that.opTrend.playing = playing;
                    that.getTrendReal();
                }
                trend_Util.setCanvasClick(that);
                trend_Util.setCanvasFun(that);
            }
        });
        //监听获取历史数据
        socketOn.on('trend/getTrendHis', function (val) {
            var data2 = val.value
            that.opTrend.trendArray = [];
            var beginTemp = data2.beginTime;
            var endTemp = data2.endTime;
            var value = data2.value;
            $.each(names, function (i, name) {
                /**
                 *  设置趋势信息
                 */
                var obj = that.trendConfigInfoMap.get(name);
                var t1 = new that.opTrend.trendObj();
                t1.opTrend = that.opTrend;
                t1.id = obj.ID;
                t1.pointName = obj.GN;
                t1.dotcount = obj.FM;
                t1.color = obj.CO;
                t1.lineWidth = obj.LW;
                t1.topLimit = obj.TV;
                t1.lowLimit = obj.BV;
                t1.type = obj.RT;
                if (value && value[name]) {
                    t1.trendData = value[name];
                }
                t1.alarmTop = obj.AT;
                t1.alarmLow = obj.AB;
                if (obj.CK == 'checked') {
                    t1.hide = false;
                } else if (obj.CK == true) {
                    t1.hide = true;
                }
                that.opTrend.addTrend(t1);
            });
            //Time sheet Correction
            from = new Date(beginTemp);
            that.opTrend.from = from;
            from = trend_Util.dateFormat(from, that.formatString);
            to = new Date(endTemp);
            that.opTrend.to = to;
            to = trend_Util.dateFormat(to, that.formatString);
            if (current) {
                that.historyPlayer(names, from, to, current);
            } else {
                that.opTrend.repaint(names);
            }
            that.initAdaptiveRange();
        });
        socketOn.on('trend/refreshTrend', function (data) {
            that.refreshTrend(data.value);
        });
        that.socket.emit('trend/getPointInfo', {
            pointsName: names
        });
    };
    /**
     重新建立连接的时候，需要移除以前的监听
     */
    this.resetSocket = function (socket) {
        var socketOn = this.socket;
        var that = this;
        // 清空信息
        $("#" + that.pointsTable + ' tbody').empty();
        socketOn.removeAllListeners('trend/getPointInfo');
        socketOn.removeAllListeners('trend/getTrendHis');
        socketOn.removeAllListeners('trend/refreshTrend');
        this.socket = socket;
    };
    /**
     监听页面显示隐藏事件
     */
    this.pageVisibility = function () {
        if (this.opTrend.playing) {
            this.addTrend(this.defaultTrendString, null, null, true);
        }
    };
    //实时刷新数据
    this.getTrendReal = function () {
        var socketOn = this.socket;
        var that = this;
        that.trendIntervalId = setInterval(function () {
            socketOn.emit('trend/refreshTrend', {
                pointsName: that.defaultTrendString.toString()
            });
        }, that.flushInterval);
    };
    /**
     * 格式化显示信息
     * @param {Object} data
     */
    this.initPointInfoTable = function (value, names) {
        var that = this;
        var html = '';
        var htmlPoints = '<tr>';
        var topNumber = 0;
        if (that.isMobile) {
            html += '<tr>' +
                '<td width="40%">点名</td>' +
                '<td width="6%">颜色</td>' +
                '<td width="40%">描述</td>' +
                '<td width="8%">单位</td>' +
                '<td width="8%">上限</td>' +
                '<td width="8%">下限</td>' +
                '<td width="8%">删除</td>' +
                '</tr>';
        } else {
            html += '<tr>' +
                '<td width="4%">显示</td>' +
                '<td width="22%">点名</td>' +
                '<td width="4%">颜色</td>' +
                '<td width="10%">实时值</td>' +
                '<td width="30%">描述</td>' +
                '<td width="5%">单位</td>' +
                '<td width="5%">上限</td>' +
                '<td width="5%">下限</td>' +
                '<td width="5%">高限</td>' +
                '<td width="5%">低限</td>' +
                '<td width="4%">线宽</td>' +
                '<td width="2%">删除</td>' +
                '</tr>';
        }
        var objSize = value.length;
        var objNameSize = names.length;
        for (var j = 0; j < objNameSize; j++) {
            var obj = {};
            var GN = names[j];
            if (objSize != 0) {
                for (var i = 0; i < objSize; i++) {
                    var objName = names[j];
                    var GN = value[i].GN;
                    if (objName.toString() != GN.toString()) {
                        continue;
                    } else {
                        obj = value[i];
                        obj.AT = "";
                        obj.AB = "";
                        obj.CK = false;
                        if (obj.RT == 1) {
                            obj.TV = 2;
                            obj.BV = -1;
                        }
                        break;
                    }
                }
                if (objSize == i) {
                    obj.ID = -1;
                    obj.GN = names[j];
                    obj.FM = 2;
                    obj.RT = 0;
                    obj.AT = "";
                    obj.AB = "";
                    obj.LW = 1;
                    obj.CK = false;
                    obj.TV = 100;
                    obj.BV = 0;
                    obj.EU = '';
                    obj.ED = '';
                }
            } else {
                obj.ID = -1;
                obj.GN = names[j];
                obj.FM = 2;
                obj.AT = "";
                obj.AB = "";
                obj.RT = 0;
                obj.LW = 1;
                obj.CK = false;
                obj.TV = 100;
                obj.ATV = 100;
                obj.BV = 0;
                obj.ABV = 0;
                obj.EU = '';
                obj.ED = '';
            }
            var objC = this.trendConfigInfoMap.get(obj.GN);
            if (objC) {
                obj.CK = objC.CK;
                obj.FM = objC.FM;
                obj.CO = objC.CO;
                obj.RT = objC.RT;
                obj.TV = objC.TV;
                obj.ATV = objC.TV;
                obj.BV = objC.BV;
                obj.ABV = objC.BV;
                obj.AT = objC.AT;
                obj.AB = objC.AB;
                obj.LW = objC.LW;
            } else {
                obj.AT = "";
                obj.AB = "";
                obj.LW = 1;
                obj.CK = false;
                obj.CO = that.getTrendColor();
                var range = {};
                range.ID = obj.ID;
                range.GN = obj.GN;
                range.FM = obj.FM;
                range.RT = obj.RT;
                range.CK = obj.CK;
                range.CO = obj.CO;
                range.TV = obj.TV;
                range.ATV = obj.TV;
                range.BV = obj.BV;
                range.ABV = obj.BV;
                range.AT = obj.AT;
                range.AB = obj.AB;
                range.LW = obj.LW;
                this.trendConfigInfoMap.put(range.GN, range);
            }
            if (that.isMobile) {
                html += '<tr id="' + obj.GN + '" class = "' + obj.GN.replace(/\/|\./g, '') + '">' +
                    '<td style="width:20%;padding:1px;"> <span class="GN form-control" readonly style="overflow:hidden;text-overflow:ellipsis">' + obj.GN + '</span></td>' +
                    '<td style="width:5%;padding:1px;"> <div class="input-group colorpicker-component" style="width: 100%;"> <input type="text" value="' + obj.CO + '" class="form-control CO" readonly style="display:none;"/> <span class="input-group-addon"><i style="width:36px;height:36px;"></i></span> </div></td>' +
                    '<td style="width:40%;padding:1px;"><span readonly class="ED form-control" style="width: 100%;overflow:hidden;text-overflow:ellipsis;"> ' + obj.ED + '</span></td>' +
                    '<td style="width:8%;padding:1px;"><span readonly class="EU form-control" style="width:100%;overflow:hidden;text-overflow:ellipsis;">' + obj.EU + '</span></td>' +
                    '<td style="width:8%;padding:1px;"> <input type="text" style="width: 80px;" class="TV form-control" value="' + parseInt(obj.TV) + '" > </td>' +
                    '<td style="width:8%;padding:1px;"> <input type="text" style="width: 80px;" class="BV form-control" value="' + parseInt(obj.BV) + '" > </td>' +
                    '<td style="width:8%;min-width:60px;padding:1px;"><button class="btn  btn-mini btn-danger glyphicon glyphicon-remove DL" type="button"></button></td>' +
                    '</tr>';
                var leftPrecent = '0%';
                if (j % 2 == 1) {
                    leftPrecent = '50%';
                }
                if (j > 0 && j % 2 == 0) {
                    topNumber += 35;
                    htmlPoints += '</tr><tr>'
                }
                htmlPoints += '<td id="' + obj.GN + '" class = "' + obj.GN.replace(/\/|\./g, '') + '" style="height:20px;border:none;">' +
                    '<input type="checkbox" ' + (obj.CK ? '' : 'checked') + ' class = "CK form-control" style="display:inline-block;width:10%;padding:1px;"/>' +
                    '<span class="GN form-control" readonly style="display:inline-block;width:50%;overflow:hidden;text-overflow:ellipsis;">' + obj.GN + '</span>' +
                    '<div class="input-group colorpicker-component" style="display:inline-block;width:8%;padding:1px;margin-top:3px;"> <input type="text" value="' + obj.CO + '" class="form-control CO" readonly style="display:none;"/> <span class="input-group-addon"><i style="height:30px;width:30px;"></i></span> </div>' +
                    '<span style="display:inline-block;width:24%;overflow:hidden;text-overflow:ellipsis;text-align:center;" class="AV form-control" readonly value=""></span>' +
                    '</td>';
            } else {
                html += '<tr id="' + obj.GN + '" class = "' + obj.GN.replace(/\/|\./g, '') + '">' +
                    '<td style="width:5%;padding:1px;margin-top:0px;"><input type="checkbox" style="padding:0px;height:20px;" ' + (obj.CK ? '' : 'checked') + ' class = "CK form-control"/></td>' +
                    '<td style="width:18%;padding:1px;"> <input type="text" style="padding:0px;height:20px;" class="GN form-control" value="' + obj.GN + '" readonly onmouseover="this.title=this.value"/> </td>' +
                    '<td style="width:3%;padding:1px;"> <div  class="input-group colorpicker-component" style="width: 100%;"> <input type="text" value="' + obj.CO + '" class="form-control CO" readonly style="display:none;"/> <span class="input-group-addon" style="padding:0px;"><i></i></span> </div></td>' +
                    '<td style="width:10%;padding:1px;"><input type="text" style="width: 100%;padding:0px;height:20px;" class="AV form-control" value="' + '' + '"  readonly> </td>' +
                    '<td style="width:14%;padding:1px;"><input type="text" style="width: 100%;padding:0px;height:20px;" class="ED form-control" value="' + obj.ED + '" readonly> </td>' +
                    '<td style="width:6%;padding:1px;"><input type="text" style="width: 100%;padding:0px;height:20px;" class="EU form-control" value="' + obj.EU + '" readonly></td>' +
                    '<td style="width:6%;padding:1px;"> <input type="text" style="width:100%;padding:0px;height:20px;" class="TV form-control" value="' + parseInt(obj.TV) + '" > </td>' +
                    '<td style="width:6%;padding:1px;"> <input type="text" style="width: 100%;padding:0px;height:20px;" class="BV form-control" value="' + parseInt(obj.BV) + '" > </td>' +
                    '<td style="width:6%;padding:1px;"> <input type="text" class="form-control AT"  style="width: 100%;padding:0px;height:20px;" value="' + obj.AT + '" > </td>' +
                    '<td style="width:6%;padding:1px;"> <input type="text" class="form-control AB"  style="width: 100%;padding:0px;height:20px;" value="' + obj.AB + '"> </td>' +
                    '<td style="width:4%;padding:1px;"><input type="text" class="form-control LW"  style="width:40px;padding:0px;height:20px;" value="' + obj.LW + '" > </td>' +
                    '<td style="width:2%;min-width:30px;padding:1px;"><button class="btn  btn-mini btn-danger glyphicon glyphicon-remove DL" type="button" style="padding:0px;"></button></td>' +
                    '</tr>';
                topNumber += 30;
            }
        }
        htmlPoints += '</tr>';
        if (that.isMobile) {
            that.trendInfoHeight = topNumber + 60;
        } else {
            that.trendInfoHeight = topNumber + 40;
        }
        if (that.isMobile) {
            $('#' + this.pointsTable + 'Manage').addClass('mobilePointtable');
            $('#' + this.pointsTable).addClass('mobilePointtable');
            $("#" + this.pointsTable + 'Manage tbody').html(html);
            $("#" + this.pointsTable + ' tbody').html(htmlPoints);
            if (this.isDilaog) {
                $('#trend_container').parent().css('margin-top', '-1px');
            }
        } else {
            $("#" + this.pointsTable + ' tbody').html(html);
            // $('#trend_container').parent().css('margin-top', '-1px');
        }
        this.trendObjListener();
        this.isSafari();
        $('.colorpicker').css('z-index', '100000');
    };
    this.isSafari = function () {
        if (isMobile.iOS()) {
            $('.mobilePointtable .form-control').css('position', 'relative').css('top', '-9px');
        }
    };
    /*手机组件格式化*/
    this.initMobileTable = function () {
        var htmlPoints = '<tr>';
        var topNumber = 0;
        var size = this.trendConfigInfoMap.size();
        for (var j = 0; j < size; j++) {
            var obj = this.trendConfigInfoMap.getObj(j);
            var leftPrecent = '0%';
            if (j % 2 == 1) {
                leftPrecent = '50%';
            }
            if (j > 0 && j % 2 == 0) {
                topNumber += 45;
                htmlPoints += '</tr><tr>'
            }
            htmlPoints += '<td id="' + obj.GN + '" class = "' + obj.GN.replace(/\/|./g, '') + '" style="height:20px;border:none;">' +
                '<input type="checkbox" ' + (obj.CK ? '' : 'checked') + ' class = "CK form-control" style="display:inline-block;width:10%;padding:1px;"/>' +
                '<span type="text" class="GN form-control" readonly style="display:inline-block;width:50%;padding:1px;margin-top:3px;overflow:hidden;text-overflow:ellipsis;">' + obj.GN + '</span>' +
                '<div class="input-group colorpicker-component" style="display:inline-block;width:8%;padding:1px;margin-top:3px;"> <input type="text" value="' + obj.CO + '" class="form-control CO" readonly style="display:none;"/> <span class="input-group-addon"><i style="height:30px;width:30px;"></i></span> </div>' +
                '<span type="text" style="display:inline-block;width:24%;padding:1px;overflow:hidden;text-overflow:ellipsis;" class="AV form-control" value="' + '' + '"  readonly></span>' +
                '</td>';
        }
        htmlPoints += '</tr>';
        if (this.isMobile) {
            this.trendInfoHeight = topNumber + 30;
        }
        $("#" + this.pointsTable + ' tbody').html(htmlPoints);
        this.setHtmlCss();
        this.isSafari();
        this.trendObjListener();
    };
    /**
     * 设置监听事件
     */
    this.trendObjListener = function () {
        var that = this;
        $('.colorpicker-component').colorpicker({
            format: "hex"
        }).on('changeColor', function (e) {
            var GN = $(this).parent().parent().attr('id') || $(this).parent().attr('id');
            var obj = that.trendConfigInfoMap.get(GN);
            if (obj) {
                obj.CO = e.color.toHex();
                that.trendRedraw(GN);
            }
            var GNC = $(this).parent().parent().attr('class') || $(this).parent().attr('class');
            $('#' + that.pointsTable + ' .' + GNC + ' .input-group-addon i').css('background-color', e.color.toHex());
            $('#' + that.pointsTable + 'Manage .' + GNC + ' .input-group-addon i').css('background-color', e.color.toHex());
        });

        $('#' + this.pointsTable + ' tbody .CK').click(function (e) {
            var GN = $(this).parent().parent().attr('id') || $(this).parent().attr('id');
            var checked = $(this).is(':checked');
            var obj = that.trendConfigInfoMap.get(GN);
            if (obj) {
                obj.CK = !checked;
                that.trendRedraw(GN);
            }
        });
        $('#' + this.pointsTable + ' tbody .CO').change(function (e) {
            var GN = $(this).parent().parent().attr('id') || $(this).parent().attr('id');
            var value = $(this).val();
            var obj = that.trendConfigInfoMap.get(GN);
            if (obj) {
                obj.CO = value;
                that.trendRedraw(GN);
            }
        });
        $('#' + this.pointsTable + ' tbody .TV').change(function (e) {
            var GN = $(this).parent().parent().attr('id');
            var value = $(this).val();
            var tt = {};
            tt.value = value;
            trend_Util.checkDouble(tt);
            var obj = that.trendConfigInfoMap.get(GN);
            if (obj) {
                obj.TV = parseInt(tt.value);
                $(this).val(parseInt(tt.value));
                that.trendRedraw(GN);
            }
        });
        $('#' + this.pointsTable + ' tbody .BV').change(function (e) {
            var GN = $(this).parent().parent().attr('id');
            var value = $(this).val();
            var tt = {};
            tt.value = value;
            trend_Util.checkDouble(tt);
            var obj = that.trendConfigInfoMap.get(GN);
            if (obj) {
                obj.BV = parseInt(tt.value);
                $(this).val(parseInt(tt.value));
                that.trendRedraw(GN);
            }
        });
        //手机监听 弹出框组件
        $('#' + this.pointsTable + 'Manage tbody .TV').change(function (e) {
            var GN = $(this).parent().parent().attr('id');
            var value = $(this).val();
            var tt = {};
            tt.value = value;
            trend_Util.checkDouble(tt);
            var obj = that.trendConfigInfoMap.get(GN);
            if (obj) {
                obj.TV = parseInt(tt.value);
                $(this).val(parseInt(tt.value));
                that.trendRedraw(GN);
            }
        });
        $('#' + this.pointsTable + 'Manage tbody .BV').change(function (e) {
            var GN = $(this).parent().parent().attr('id');
            var value = $(this).val();
            var tt = {};
            tt.value = value;
            trend_Util.checkDouble(tt);
            var obj = that.trendConfigInfoMap.get(GN);
            if (obj) {
                obj.BV = parseInt(tt.value);
                $(this).val(parseInt(tt.value));
                that.trendRedraw(GN);
            }
        });
        $('#' + this.pointsTable + 'Manage tbody .DL').click(function (e) {
            var GN = $(this).parent().parent().attr('id');
            if (that.opTrend.trendArray) {
                that.trendConfigInfoMap.remove(GN);
                for (var j = 0; j < that.opTrend.trendArray.length; j++) {
                    if (GN == that.opTrend.trendArray[j].pointName) {
                        that.returnTrendColor(co);
                        that.opTrend.trendArray.remove(j);
                    }
                }
            }
            var names = [];
            var namesTemp = that.defaultTrendString;
            for (var i = 0; i < namesTemp.length; i++) {
                var nameTemp = namesTemp[i];
                if (nameTemp != GN) {
                    names.push(nameTemp);
                }
            }
            that.defaultTrendString = names;
            var pointGN = GN.replace(/\/|\./g, '');
            $('#' + that.pointsTable + ' tbody .' + pointGN).remove();
            $('#' + that.pointsTable + 'Manage tbody .' + pointGN).remove();
            if (that.defaultTrendString.length == 0) {
                trend_Util.stopFlush(that);
                trend_Util.clearDefaultString(this, that);
            }
            that.initMobileTable();
            that.opTrend.repaint(names);
        });

        $('#' + this.pointsTable + ' tbody .AT').change(function (e) {
            var GN = $(this).parent().parent().attr('id');
            var value = $(this).val();
            var tt = {};
            tt.value = value;
            trend_Util.checkDouble(tt);
            var obj = that.trendConfigInfoMap.get(GN);
            if (obj) {
                obj.AT = tt.value;
                $(this).val(tt.value);
                that.trendRedraw(GN);
            }
        });
        $('#' + this.pointsTable + ' tbody .AB').change(function (e) {
            var GN = $(this).parent().parent().attr('id');
            var value = $(this).val();
            var tt = {};
            tt.value = value;
            trend_Util.checkDouble(tt);
            var obj = that.trendConfigInfoMap.get(GN);
            if (obj) {
                obj.AB = tt.value;
                $(this).val(tt.value);
                that.trendRedraw(GN);
            }
        });
        $('#' + this.pointsTable + ' tbody .LW').change(function (e) {
            var GN = $(this).parent().parent().attr('id');
            var value = $(this).val();
            var tt = {};
            tt.value = value;
            trend_Util.checkDouble(tt);
            var obj = that.trendConfigInfoMap.get(GN);
            if (obj) {
                obj.LW = tt.value;
                $(this).val(tt.value);
                that.trendRedraw(GN);
            }
        });
        $('#' + this.pointsTable + ' tbody .DL').click(function (e) {
            var GN = $(this).parent().parent().attr('id');
            if (that.opTrend.trendArray) {
                that.trendConfigInfoMap.remove(GN);
                for (var j = 0; j < that.opTrend.trendArray.length; j++) {
                    if (GN == that.opTrend.trendArray[j].pointName) {
                        var co = that.opTrend.trendArray[j].color;
                        that.returnTrendColor(co);
                        that.opTrend.trendArray.remove(j);
                    }
                }
            }

            var names = [];
            var namesTemp = that.defaultTrendString;
            for (var i = 0; i < namesTemp.length; i++) {
                var nameTemp = namesTemp[i];
                if (nameTemp != GN) {
                    names.push(nameTemp);
                }
            }
            that.defaultTrendString = names;
            var pointGN = GN.replace(/\/|\./g, '');
            $('#' + that.pointsTable + ' tbody .' + pointGN).remove();
            if (that.defaultTrendString.length == 0) {
                trend_Util.stopFlush(that);
                trend_Util.clearDefaultString(this, that);
            }
            // that.setHtmlCss();
            that.opTrend.repaint(names);
        });
    };
    this.historyPlayer = function (names, from, to, current) {
        var that = this;
        var toTime = new Date(to);
        if (that.opTrend.currentFrom) {
            that.opTrend.from = that.opTrend.currentFrom;
        }
        that.opTrend.currentFrom = that.opTrend.from;
        that.opTrend.to = new Date(current);
        that.opTrend.current = that.opTrend.to;
        that.history = setInterval(
            function () {
                if (that.opTrend.to.getTime() != toTime.getTime()) {
                    that.opTrend.updateTimeReplayer(that.opTrend.to.getTime());
                    trend_Util.showHistory(that.opTrend.to, that);
                    that.opTrend.repaint(names);
                    that.opTrend.current = that.opTrend.to;
                    that.opTrend.currentFrom = that.opTrend.from;
                    if (that.mouseLeaveXY.length != 0) {
                        trend_Util.drawVernier(that.mouseLeaveXY, that);
                    }
                } else {
                    that.opTrend.from = from;
                    that.opTrend.to = to;
                    clearInterval(that.history);
                }
            }, that.flushInterval);
    };
    /**
     * 添加趋势
     *
     * @param {}
     *            names
     * @param {}
     *            from
     * @param {}
     *            to
     * @param {}
     *            playing
     */
    this.addTrend = function (names, from, to, playing, current) {
        names = trend_Util.removeArraySameElement(names);
        this.opTrend.promptMsg = "数据加载中";
        $("#" + this.trendcontainer).unbind();
        // 设置颜色

        this.opTrend.interval = this.flushInterval;
        // 设置刷新频率
        // 停止刷新
        trend_Util.stopFlush(this);
        if (this.isMobile) {
            $('#pointsTrend .isMobile').show();
            $('#pointsTrend .notMobile').hide();
            $('.container .isMobile').show();
            $('.container .notMobile').hide();
        } else {
            $('#pointsTrend .isMobile').hide();
            $('#pointsTrend .notMobile').show();
            $('.container .isMobile').hide();
            $('.container .notMobile').show();
        }
        if (this.isDialog) {
            // this.setHtmlCss();
            this.showDialog();
        } else {
            this.setHtmlCss();
        }
        if (!trend_Util.isNull(from)) {
            if (this.isMobile) {
                $("#trend_from_m").html(from);
            } else {
                $("#trend_from").find('input').val(from);
            }
        } else {
            if (this.isMobile) {
                $("#trend_from_m").html('开始时间');
            } else {
                $("#trend_from").find('input').val('');
            }
        }
        if (!trend_Util.isNull(to)) {
            if (this.isMobile) {
                $("#trend_to_m").html(to);
            } else {
                $("#trend_to").find('input').val(to);
            }
        } else {
            if (this.isMobile) {
                $("#trend_to_m").html('结束时间');
            } else {
                $("#trend_to").find('input').val('');
            }
        }
        // trend_Util.getCheckedNames(this);
        this.trendStopFlushFlags.push(this.trendIntervalId);
        this.reloadData(names, from, to, playing, null, null, current);
    };

    //刷新数据
    this.refreshTrend = function (value) {
        var that = this;
        var data = value.value;
        var time = value.time;
        var names = that.defaultTrendString;
        var flag = false;
        for (var i = 0; i < names.length; i++) {
            var j = 0
            for (j = 0; j < that.opTrend.trendArray.length; j++) {
                if (names[i] == that.opTrend.trendArray[j].pointName) {
                    var name = names[i].replace(/\/|\./g, '');
                    var current = $('#' + this.pointsTable + ' .' + name + ' .AV');
                    var pointId = that.opTrend.trendArray[j].id;
                    if (pointId == -1) {
                        var val = 'N/A';
                        if (that.isMobile) {
                            current.html(val);
                        } else {
                            current.val(val);
                        }
                        break;
                    }
                    if (trend_Util.isNull(data[pointId])) {
                        var val = 'N/D';
                        if (pointId == -1) {
                            val = 'N/A';
                        }
                        if (that.isMobile) {
                            current.html(val);
                        } else {
                            current.val(val);
                        }
                    } else {
                        if (trend_Util.statusOfDS(data[pointId].DS)) {
                            var val = 'N/D';
                            if (that.isMobile) {
                                current.html(val);
                            } else {
                                current.val(val);
                            }
                        } else if (data[pointId].y == null) {
                            if (that.isMobile) {
                                $('#' + names[i] + ' .AV').html('');
                            } else {
                                $('#' + names[i] + ' .AV').val('');
                            }
                        } else {
                            if (that.isMobile) {
                                if (that.opTrend.trendArray[j].type == 1 || that.opTrend.trendArray[j].type == 2 || that.opTrend.trendArray[j].type == 3) {
                                    current.html(data[pointId].y);
                                } else {
                                    if (that.localFormat) {
                                        current.html(parseFloat(data[pointId].y).toFixed(trend_Util.dotcount));
                                    } else {
                                        current.html(parseFloat(data[pointId].y).toFixed(that.opTrend.trendArray[j].dotcount));
                                    }
                                }
                            } else {
                                if (that.opTrend.trendArray[j].type == 1 || that.opTrend.trendArray[j].type == 2 || that.opTrend.trendArray[j].type == 3) {
                                    current.val(parseInt(data[pointId].y));
                                } else {
                                    if (that.localFormat) {
                                        current.val(parseFloat(data[pointId].y).toFixed(trend_Util.dotcount));
                                    } else {
                                        current.val(parseFloat(data[pointId].y).toFixed(that.opTrend.trendArray[j].dotcount));
                                    }
                                }
                            }
                        }
                        var arr = [];
                        arr[0] = data[pointId].x;
                        // 是否越界
                        // if (parseInt(data[i].x) > that.opTrend.to.getTime()) {
                        //     // that.opTrend.to = new Date(parseInt(data[i].x));
                        // }
                        arr[1] = data[pointId].y;
                        that.opTrend.trendArray[j].addPoint(arr);
                        //自适应量程
                        if (arr[1] > that.opTrend.trendArray[j].TV || arr[1] < that.opTrend.trendArray[j].BV) {
                            flag = true;
                        }
                    }
                    break;
                }
            }
        }
        //自适应量程
        if (flag) {
            that.initAdaptiveRange();
        }
        that.opTrend.updateTime(time);
        that.opTrend.repaint(names);
        if (that.mouseLeaveXY.length != 0) {
            trend_Util.drawVernier(that.mouseLeaveXY, that);
        }
    };
    this.showDialog = function () {
        if (!this.isInit) {
            this.trendDialogRealHeight = this.documentHeight * 8 / 10 - 20;
            this.trendDialogRealWidth = this.documentWidth * 9 / 10 - 50;
            this.trendDialogMaxHeight = this.documentHeight;
            this.trendDialogMaxWidth = this.documentWidth;
            this.trendDialogNormalHeight = this.documentHeight * 8 / 10;
            this.trendDialogNormalWidth = this.documentWidth * 9 / 10 - 50;
            this.isInit = true;
        }
        var that = this;
        $('#pointsTrend').modal({
            backdrop: 'static',
            keyboard: false
        });
        $('.modal-backdrop').css('display', 'none');
        that.setHtmlCss();
        that.opTrend.repaint(this.defaultTrendString);
        /**监听窗口关闭*/
        window.closeTrendInfo = function () {
            $('#pointsTrend').modal('hide');
            trendGroup.isHide = false;
            trendGroup.isLarge = false;
            trendGroup.adaptive = false;
            trendGroup.isInit = true;
            trendGroup.trendInfoHeight = 90;
            trendGroup.trendCanvasPrecent = 0.60;
            if (trendGroup.isMobile) {
                trendGroup.trendInfoHeight = 30;
                trendGroup.trendCanvasPrecent = 0.8;
            }
            trend_Util.stopFlush(trendGroup);
            trend_Util.clearDefaultString(null, trendGroup);
            if (that.isMobile) {
                $('.isMobile .btnOperator').show();
            }
        };
        /**监听窗口最小*/
        window.onTrendInfoMin = function () {
            if (that.isHide) {
                that.isHide = false;
                if (that.isMobile) {
                    $('.isMobile .btnOperator').show();
                }
            } else {
                that.isHide = true;
                if (that.isMobile) {
                    $('.isMobile .btnOperator').hide();
                }
            }
            that.setHtmlCss();
            that.opTrend.repaint(that.defaultTrendString);
        }

        /**监听窗口恢复大小*/
        window.resizeTrendInfoMin = function () {
            if (that.isLarge || that.isHide) {
                that.trendDialogNormalHeight = that.trendDialogRealHeight;
                that.trendDialogNormalWidth = that.trendDialogRealWidth;
                that.isLarge = false;
                that.isHide = false;
                that.setHtmlCss();
                that.opTrend.repaint(that.defaultTrendString);
            }
        }

        /**监听窗口最大*/
        window.resizeTrendInfoMax = function () {
            if (!that.isLarge || that.isHide) {
                that.trendDialogNormalHeight = that.trendDialogMaxHeight - 20;
                that.trendDialogNormalWidth = that.trendDialogMaxWidth;
                that.isLarge = true;
                that.isHide = false;
                that.setHtmlCss();
                that.opTrend.repaint(that.defaultTrendString);
            }
        }
    };

    /**
     *  设置页面样式和大小
     */
    this.setHtmlCss = function () {
        this.trendDialogWidth = this.trendDialogRealWidth;
        this.trendDialogHeight = this.trendDialogRealHeight;
        var _canvas = document.getElementById(this.trendcontainer);
        this.canvas_context = _canvas.getContext('2d');
        trend_canvas = this.canvas_context;
        this.opTrend.canvas_context = this.canvas_context;
        if (this.isMobile) {
            this.isLarge = true;
            this.trendDialogRealHeight = this.documentHeight * 8 / 10 - 20;
            this.trendDialogRealWidth = this.documentWidth * 9 / 10 - 50;
            this.trendDialogMaxHeight = this.documentHeight;
            this.trendDialogMaxWidth = this.documentWidth;
            this.trendDialogNormalHeight = this.documentHeight * 8 / 10;
            this.trendDialogNormalWidth = this.documentWidth * 9 / 10 - 50;
            this.trendDialogNormalHeight = this.trendDialogMaxHeight;
            this.trendDialogNormalWidth = this.trendDialogMaxWidth;
            this.trendDialogWidth = this.trendDialogRealWidth;
            this.trendDialogHeight = this.trendDialogRealHeight;
            if (this.isHorizontalScreen) {
                $('#trend_container').parent().css('margin-top', '20px');
            } else {
                $('#trend_container').parent().css('margin-top', '60px');
            }
        } else {
            this.trendNormalWidth = this.documentWidth;
            this.trendNormalHeight = this.documentHeight;
        }
        var heightTable = this.trendInfoHeight > this.trendDialogNormalHeight * this.trendInfoPrecentMax ? this.trendDialogNormalHeight * this.trendInfoPrecentMax : this.trendInfoHeight;
        if (this.isDialog) {
            _canvas.width = this.trendDialogNormalWidth - 40;
            _canvas.height = this.trendDialogNormalHeight - heightTable - 60;
            this.opTrend.canvasWidth = this.trendDialogNormalWidth - 40;
            if (this.isMobile) {
                this.opTrend.canvasHeight = this.trendDialogNormalHeight - heightTable - 140;
            } else {
                this.opTrend.canvasHeight = this.trendDialogNormalHeight - heightTable - 90;
            }
            $('#' + this.trendcontainer).css('height', this.trendDialogNormalHeight - heightTable - 60);
            $('#' + this.trendcontainer).css('width', this.trendDialogNormalWidth - 40);
        } else {
            if (this.isMobile) {
                if (isMobile.iPhone()) {
                    if (this.iosPlus) {
                        _canvas.width = this.trendDialogNormalWidth - 30;
                        _canvas.height = this.trendDialogNormalHeight - heightTable - 320;
                        this.opTrend.canvasWidth = this.trendDialogNormalWidth - 30;
                        this.opTrend.canvasHeight = this.trendDialogNormalHeight - heightTable - 380;
                        $('#scrollable').css('width', this.trendDialogNormalWidth);
                        $('#scrollable').css('height', this.trendDialogNormalHeight)
                        $('#' + this.pointsTable).css('width', this.trendDialogNormalWidth - 60);
                        $('#' + this.pointsTable).css('height', heightTable);
                    } else {
                        var widthTemp = 20;
                        if (this.isHorizontalScreen) {
                            widthTemp = 150;
                        }
                        _canvas.width = this.trendDialogNormalWidth - widthTemp;
                        _canvas.height = this.trendDialogNormalHeight - heightTable - 70;
                        this.opTrend.canvasWidth = this.trendDialogNormalWidth - widthTemp;
                        this.opTrend.canvasHeight = this.trendDialogNormalHeight - heightTable - 110;
                        $('#scrollable').css('width', this.trendDialogNormalWidth);
                        $('#scrollable').css('height', this.trendDialogNormalHeight);
                        $('#' + this.pointsTable).css('width', this.trendDialogNormalWidth - widthTemp);
                        $('#' + this.pointsTable).css('height', heightTable);
                    }
                } else if (isMobile.iPad()) {
                    _canvas.width = this.trendDialogNormalWidth - 30;
                    _canvas.height = this.trendDialogNormalHeight - heightTable - 90;
                    this.opTrend.canvasWidth = this.trendDialogNormalWidth - 30;
                    this.opTrend.canvasHeight = this.trendDialogNormalHeight - heightTable - 150;
                    $('#scrollable').css('width', this.trendDialogNormalWidth);
                    $('#scrollable').css('height', this.trendDialogNormalHeight)
                    $('#' + this.pointsTable).css('width', this.trendDialogNormalWidth - 10);
                    $('#' + this.pointsTable).css('height', heightTable);
                } else {
                    _canvas.width = this.trendDialogNormalWidth;
                    _canvas.height = this.trendDialogNormalHeight - heightTable - 50;
                    this.opTrend.canvasWidth = this.trendDialogNormalWidth;
                    this.opTrend.canvasHeight = this.trendDialogNormalHeight - heightTable - 90;
                    $('#' + this.pointsTable).css('width', this.trendDialogNormalWidth - 10);
                    $('#' + this.pointsTable).css('height', heightTable);
                }
            } else {
                $('.container').css('width', '100%');
                $('.container').css('margin-left', 'auto');
                _canvas.width = this.trendNormalWidth - 40;
                _canvas.height = this.trendNormalHeight - heightTable - 60;
                this.opTrend.canvasWidth = this.trendNormalWidth - 40;
                this.opTrend.canvasHeight = this.trendNormalHeight - heightTable - 90;
            }
        }
        if (this.isDialog) {
            $('#pointsTrend .box-primary').css('height', heightTable);
            $('#pointsTrend .modal-dialog').css('height', this.trendDialogNormalHeight);
            $('#pointsTrend .modal-dialog').css('width', this.trendDialogNormalWidth);
            if (!this.isHide) {
                $('#pointsTrend .modal-content .modal-body').show();
            } else {
                $('#pointsTrend').css('margin-top', '0px');
                $('#pointsTrend .modal-dialog').css('width', '350px');
                if (this.isMobile) {
                    $('#pointsTrend .modal-dialog').css('width', '150px');
                }
                $('#pointsTrend .modal-content .modal-body').hide();
            }
            var contentHeight = parseInt($('#pointsTrend .modal-content').css('height').replace('px', ''));
            var contentWidth = parseInt($('#pointsTrend .modal-content').css('width').replace('px', ''));
            if (contentHeight == 0) {
                contentHeight = this.trendDialogNormalHeight + 60;
            } else {
                contentHeight += 50;
            }
            if (contentWidth == 0) {
                contentWidth = this.trendDialogNormalWidth;
            }
            $('#pointsTrend').css('height', contentHeight);
            $('#pointsTrend').css('width', contentWidth);
            $('#pointsTrend .modal-dialog').css('height', '0px');
            $('#pointsTrend .modal-dialog').css('width', contentWidth);
            var marginLeft = (this.trendDialogMaxWidth - contentWidth) / 2;
            if (marginLeft) {
                $('#pointsTrend').css('margin-left', marginLeft);
            } else {
                $('#pointsTrend').css('margin-left', '0px');
            }
            if (!this.isHide) {
                if (this.isLarge) {
                    $('#pointsTrend').css('margin-top', '-15px');
                    if (this.isMobile) {
                        $('#pointsTrend').css('margin-top', '-1px');
                    }
                } else {
                    $('#pointsTrend').css('margin-top', (this.trendDialogMaxHeight - contentHeight) / 2);
                }
            }
        } else {
            if (this.isMobile) {
                $('.container .box-primary').css('height', heightTable + 60);
                $('.container .box-primary').css('width', this.trendDialogNormalWidth);
            } else {
                $('.container .box-primary').css('height', heightTable + 100);
            }
        }
    };
    /**
     * 重新绘制
     */
    this.trendRedraw = function (gn) {
        var obj = this.trendConfigInfoMap.get(gn);
        if (this.opTrend.trendArray) {
            for (var j = 0; j < this.opTrend.trendArray.length; j++) {
                if (gn == this.opTrend.trendArray[j].pointName) {
                    this.opTrend.trendArray[j].hide = obj.CK;
                    this.opTrend.trendArray[j].color = obj.CO;
                    this.opTrend.trendArray[j].topLimit = obj.TV;
                    this.opTrend.trendArray[j].lowLimit = obj.BV;
                    this.opTrend.trendArray[j].alarmTop = obj.AT;
                    this.opTrend.trendArray[j].alarmLow = obj.AB;
                    this.opTrend.trendArray[j].lineWidth = obj.LW;
                    break;
                }
            }
        }
        this.opTrend.repaint(this.defaultTrendString);
    };
    /**
     * 查询快捷键
     *
     * @param {}
     *            flag
     */
    this.shortCutSearch = function (flag) {
        var that = this;
        that.trend_getData4CheckboxFlag = true;
        var time;
        if (that.isMobile) {
            time = $('#trend_to_m').html();
            if (time == '结束时间') {
                time = '';
            }
        } else {
            time = $("#trend_to").find('input').val();
        }
        if (trend_Util.isNull(time)) {
            time = trend_Util.dateFormat(new Date(trend_Util.getServerTime()), that.formatString);
        }
        //当 flag 为 0时，是实时，其他为历时 单位是小时
        if (flag == 0) {
            var temp = 1000 * 60 * 10;
            that.addTrend(that.defaultTrendString, null, null, true);
            if (that.isMobile) {
                $('#trend_from_m').html('开始时间');
                $('#trend_to_m').html('结束时间');
            } else {
                $('#trend_to').find('input').val('');
                $("#trend_from").find('input').val('');
            }
        } else {
            var from = trend_Util.getParameter4Time(flag, this, time);
            if (that.isMobile) {
                $('#trend_from_m').html(from);
                $('#trend_to_m').html(time);
            } else {
                $('#trend_to').find('input').val(time);
                $("#trend_from").find('input').val(from);
            }
            that.addTrend(that.defaultTrendString, from, time, false);
        }
    };
    /*自适应量程*/
    this.adaptiveRange = function () {
        if (this.adaptive) {
            this.opTrend.reAdaptiveRange(this.trendConfigInfoMap)
        } else {
            this.opTrend.adaptiveRange(this.trendConfigInfoMap);
        }
        this.adaptive = !this.adaptive;
        this.modifyAdaptive();
        this.opTrend.repaint(this.defaultTrendString);
    };
    /*重新加载数据的时候判断是不是处于自适应量程状态*/
    this.initAdaptiveRange = function () {
        if (this.adaptive) {
            this.opTrend.adaptiveRange(this.trendConfigInfoMap);
        }
        this.modifyAdaptive();
        this.opTrend.repaint(this.defaultTrendString);
    };
    /*
     修改量程上下限
     */
    this.modifyAdaptive = function () {
        var pointArray = this.trendConfigInfoMap.arr;
        var size = pointArray.length;
        for (var i = 0; i < size; i++) {
            var point = pointArray[i];
            $('.' + point.key.replace(/\/|\./g, '') + ' .TV').val(point.value.TV);
            $('.' + point.key.replace(/\/|\./g, '') + ' .BV').val(point.value.BV);
        }
    };
    /**
     * 查询历时
     */
    this.searchHistory = function () {
        this.trend_getData4CheckboxFlag = true;
        var minDate = $('#trend_from').val(),
            maxDate = $('#trend_to').val(),
            regS = new RegExp(
                "-", "gi"),
            from = minDate.replace(regS, "/"),
            to = maxDate
                .replace(regS, "/"),
            bd = new Date(Date.parse(from)),
            ed = new Date(
                Date.parse(to));
        if (bd > ed) {
            alert("开司时间不能晚于结束时间");
        } else {
            this.addTrend(this.defaultTrendString, minDate, maxDate, false);
        }
    }
}


var trend_Util = {
    dotcount: 2,
    colorHex: function (target) {
        var reg = /^#([0-9a-fA-f]{3}|[0-9a-fA-f]{6})$/;
        var that = target;
        if (/^(rgba|RGBA)/.test(that)) {
            var aColor = that.replace(/(?:\(|\)|rgba|RGBA)*/g, "").split(",");
            var strHex = "#";
            for (var i = 0; i < aColor.length - 1; i++) {
                var hex = Number(aColor[i]).toString(16);
                if (hex === "0") {
                    hex += hex;
                }
                strHex += hex;
            }
            if (strHex.length !== 7) {
                strHex = that;
            }
            return strHex;

        } else if (reg.test(that)) {
            var aNum = that.replace(/#/, "").split("");
            if (aNum.length === 6) {
                return that;
            } else if (aNum.length === 3) {
                var numHex = "#";
                for (var i = 0; i < aNum.length; i += 1) {
                    numHex += (aNum[i] + aNum[i]);
                }
                return numHex;
            }
        } else {
            return that;
        }
    },
    trendRedraw: function (objTrendGroup) {
        var checkboxs = document.getElementsByName(objTrendGroup.pointsTable + "_trendCheckBox");
        for (var i = 0; i < checkboxs.length; i++) {
            var trObj = document.getElementById(checkboxs[i].id);
            var pname = trObj.cells[1].innerHTML;
            var ranges = objTrendGroup.trendConfigInfoMap.get(pname);
            // 数据
            if (objTrendGroup.opTrend.trendArray) {
                for (var j = 0; i < objTrendGroup.opTrend.trendArray.length; j++) {
                    if (pname == objTrendGroup.opTrend.trendArray[j].pointName) {
                        objTrendGroup.opTrend.trendArray[j].topLimit = ranges[0];
                        objTrendGroup.opTrend.trendArray[j].lowLimit = ranges[1];
                        objTrendGroup.opTrend.trendArray[j].alarmTop = ranges[2];
                        objTrendGroup.opTrend.trendArray[j].alarmLow = ranges[3];
                        objTrendGroup.opTrend.trendArray[j].lineWidth = ranges[4];
                        break;
                    }
                }
            }
        }
        objTrendGroup.opTrend.repaint(objTrendGroup.defaultTrendString);
    },
    isNull: function (obj) {
        if (obj == null) {
            return true;
        } else if (obj == "") {
            return true;
        } else if (undefined == obj) {
            return true;
        } else {
            return false;
        }
    },
    /**
     * 日期格式化
     *
     * @param {}
     *            time
     * @param {}
     *            format
     * @return {}
     */
    dateFormat: function (time, format) {
        var t = new Date(time),
            tf = function (i) {
                return (i < 10 ? '0' : '') + i
            }
        return format.replace(/yyyy|yy|MM|dd|HH|mm|ss/g, function (a) {
            switch (a) {
                case 'yy':
                    return tf((t.getFullYear() + "").substr(2, 3));
                    break;
                case 'yyyy':
                    return tf(t.getFullYear());
                    break;
                case 'MM':
                    return tf(t.getMonth() + 1);
                    break;
                case 'mm':
                    return tf(t.getMinutes());
                    break;
                case 'dd':
                    return tf(t.getDate());
                    break;
                case 'HH':
                    return tf(t.getHours());
                    break;
                case 'ss':
                    return tf(t.getSeconds());
                    break;
            }
        });
    },
    /***
     * 趋势弹出窗组件调用初始化属性
     *
     * @param {}
     *            from
     * @param {}
     *            to
     * @param {}
     *            width
     * @param {}
     *            height
     */
    initProperties: function (from, to, width, height, objTrendGroup) {
        if (!this.isNull(width) && !this.isNull(height)) {
            objTrendGroup.trendDialogWidth = width;
            objTrendGroup.trendDialogHeight = height;
        } else {
            var h = document.documentElement.clientHeight;
            var w = document.documentElement.clientWidth;
            if (objTrendGroup.isDialog) {
                h = h * 4 / 5;
                w = w * 3 / 4;
            }
            objTrendGroup.trendDialogWidth = w;
            objTrendGroup.trendDialogHeight = h;
        }
    },
    /**
     * 清空点组和刷新标记
     */
    clearDefaultString: function (obj, objTrendGroup) {
        // $("#pointsTable").empty();
        objTrendGroup.defaultTrendString = [];
        objTrendGroup.trendConfigInfoMap = new trendUtilMap();
        objTrendGroup.opTrend.trendArray = [];
        objTrendGroup.trendColorNotUseing = objTrendGroup.trendChartColors.slice();
        objTrendGroup.trendColorUseing = [];
    },
    /**
     * 获取对象在页面的位置
     *
     * @param obj
     * @returns {Array}
     */
    getPosition: function (obj) {
        var topValue = 0,
            leftValue = 0,
            height = 0,
            arr = [];
        while (obj) {
            leftValue += obj.offsetLeft;
            topValue += obj.offsetTop;
            height = obj.height;
            obj = obj.offsetParent;
        }
        arr.push(leftValue);
        arr.push(topValue);
        arr.push(height);
        return arr;
    },
    /**
     * 获取canvas容器坐标
     *
     * @param e
     * @returns {Array}
     */
    getCanvasPos: function (e, objTrendGroup) {
        var canvas = document.getElementById(objTrendGroup.trendcontainer)
        var arrayXY = trend_Util.getPosition(canvas);
        var pointX = e.pageX - arrayXY[0];
        var pointY = canvas.height / 2 - 80;
        var posX = e.pageX - arrayXY[0];
        if ((pointX + 175) > canvas.width) {
            posX = canvas.width - 175;
        }
        return [pointX, pointY, posX];
    },
    /*
     根据点击的位置，获取趋势位置
     */

    getCanvasPosMobile: function (e, objTrendGroup) {
        var canvas = document.getElementById(objTrendGroup.trendcontainer)
        var arrayXY = trend_Util.getPosition(canvas);
        var touch = e.touches[0];
        var pointX = touch.clientX - arrayXY[0];
        var pointY = canvas.height / 2 - 80;
        var posX = touch.clientX - arrayXY[0];
        if ((pointX + 175) > canvas.width) {
            posX = canvas.width - 175;
        }
        return [pointX, pointY, posX];
    },
    /**
     * 绘制游标值及游标线
     *
     * @param {}
     *            xys
     */
    drawVernier: function (xys, objTrendGroup) {
        objTrendGroup.opTrend.repaint(objTrendGroup.defaultTrendString);
        // 数据
        objTrendGroup.canvas_context.save();
        var objs = objTrendGroup.opTrend.trendArray,
            pointX = xys[0],
            pointY = xys[1],
            posX = xys[2];

        objTrendGroup.canvas_context.globalAlpha = 0.8;
        objTrendGroup.canvas_context.fillStyle = "#aea7a7";
        objTrendGroup.canvas_context.fillRect(posX, pointY, objTrendGroup.viewerWidth, objTrendGroup.viewerFont + objTrendGroup.viewerFontLineHeight * objs.length);
        objTrendGroup.canvas_context.globalAlpha = 1;
        objTrendGroup.canvas_context.strokeStyle = objTrendGroup.opTrend.trend_bgLineColor;
        objTrendGroup.canvas_context.lineWidth = 1;
        objTrendGroup.canvas_context.save();
        objTrendGroup.canvas_context.translate(0.5, 0.5);
        objTrendGroup.canvas_context.beginPath();
        objTrendGroup.canvas_context.lineWidth = 2;
        objTrendGroup.canvas_context.moveTo(pointX + 0.8, 0 + 0.8);
        objTrendGroup.canvas_context.lineTo(pointX + 0.8, objTrendGroup.opTrend.canvasHeight + 0.8);
        objTrendGroup.canvas_context.stroke();
        objTrendGroup.canvas_context.restore();
        var time = new Date(objTrendGroup.opTrend.getTimeFromX(pointX + 0.8)).getTime(),
            ymd = trend_Util.dateFormat(new Date(time), objTrendGroup.formatString);
        objTrendGroup.canvas_context.fillStyle = "black";
        objTrendGroup.canvas_context.font = "bold " + objTrendGroup.viewerFont + "px 宋体";
        objTrendGroup.canvas_context.fillText(ymd, posX, pointY + objTrendGroup.viewerFontLineHeight / 2 + 5);
        var arr = objTrendGroup.opTrend.getValueFromTime(time);
        for (var f = 0; f < objs.length; f++) {
            objTrendGroup.canvas_context.fillStyle = objs[f].color;
            objTrendGroup.canvas_context.fillText(arr[f], posX + 10, pointY + 25 + objTrendGroup.viewerFontSpace + objTrendGroup.viewerFontLineHeight * (f));
        }
        objTrendGroup.canvas_context.restore();
    },
    /**
     * 为canvas 设置click 事件
     * @param objTrendGroup
     */
    setCanvasClick: function (objTrendGroup) {
        var rightX = objTrendGroup.opTrend.canvasX + objTrendGroup.opTrend.canvasWidth * objTrendGroup.opTrend.widthRatioA / objTrendGroup.opTrend.widthRatioB + objTrendGroup.opTrend.margin_padding;
        $("#" + objTrendGroup.trendcontainer).unbind('click');
        $("#" + objTrendGroup.trendcontainer).bind(
            'click',
            function (e) {
                var xys = trend_Util.getCanvasPos(e, objTrendGroup);
                if (parseInt(xys[0]) <= parseInt(rightX)) {
                    objTrendGroup.mouseLeaveXY = xys;
                    trend_Util.drawVernier(xys, objTrendGroup);
                }
            }
        );
    },
    /**
     * 为整体canvas添加事件
     */
    setCanvasFun: function (objTrendGroup) {
        var clickBeginX = 0,
            downflag = false,
            moveflag = false,
            from = null,
            to = null;
        var rightX = objTrendGroup.opTrend.canvasX + objTrendGroup.opTrend.canvasWidth * objTrendGroup.opTrend.widthRatioA / objTrendGroup.opTrend.widthRatioB + objTrendGroup.opTrend.margin_padding;
        if (objTrendGroup.isMobile) {
            var div = document.getElementById(objTrendGroup.trendcontainer);
            div.ontouchstart = function (e) {
                if (e.touches.length == 1) {
                    downflag = true;
                    var xys = trend_Util.getCanvasPosMobile(e, objTrendGroup);
                    var pointX = xys[0];
                    clickBeginX = pointX;
                    from = new Date(objTrendGroup.opTrend.getTimeFromX(pointX));
                }
            };
            div.ontouchmove = function (e) {
                e.preventDefault();
                if (e.touches.length == 1) {
                    var xys = trend_Util.getCanvasPosMobile(e, objTrendGroup);
                    if (parseInt(xys[0]) >= parseInt(rightX)) {
                        xys[0] = parseInt(rightX);
                    }
                    objTrendGroup.mouseLeaveXY = xys;
                    var width = parseInt(xys[0]) - clickBeginX;
                    if (downflag && (parseInt(xys[0]) <= parseInt(rightX))) {
                        objTrendGroup.opTrend.repaint(objTrendGroup.defaultTrendString);
                        if (width >= 10) {
                            moveflag = true;
                            objTrendGroup.canvas_context.globalAlpha = 0.4;
                            objTrendGroup.canvas_context.fillStyle = objTrendGroup.opTrend.trend_bgLineColor;
                            objTrendGroup.canvas_context.fillRect(clickBeginX, 0, width, objTrendGroup.opTrend.canvasHeight);
                            objTrendGroup.canvas_context.globalAlpha = 1;
                            to = new Date(objTrendGroup.opTrend.getTimeFromX(xys[0]));
                        }
                    }
                }
            };
            div.ontouchend = function (e) {
                downflag = false;
                if (moveflag) {
                    objTrendGroup.trend_getData4CheckboxFlag = true;
                    objTrendGroup.mouseLeaveXY = [];
                    if (to - from < 60000) {
                        if (!objTrendGroup.opTrend.playing) {
                            objTrendGroup.addTrend(objTrendGroup.defaultTrendString, objTrendGroup.opTrend.from, objTrendGroup.opTrend.to, false);
                        }
                        return;
                    }
                    if ((to - from) / (objTrendGroup.opTrend.to - objTrendGroup.opTrend.from) < 0.1) {
                        if (!objTrendGroup.opTrend.playing) {
                            objTrendGroup.addTrend(objTrendGroup.defaultTrendString, objTrendGroup.opTrend.from, objTrendGroup.opTrend.to, false);
                        }
                        return;
                    }
                    objTrendGroup.opTrend.from = from;
                    objTrendGroup.opTrend.to = to;
                    from = trend_Util.dateFormat(from, objTrendGroup.formatString);
                    to = trend_Util.dateFormat(to, objTrendGroup.formatString);
                    $("#trend_to_m").html(to);
                    $("#trend_from_m").html(from);
                    $('#trendTime').val(-1).trigger("change");
                    objTrendGroup.addTrend(objTrendGroup.defaultTrendString, from, to, false);
                }
                moveflag = false;
            };
        } else {
            $("#" + objTrendGroup.trendcontainer).bind({
                mousedown: function (e) {
                    downflag = true;
                    var xys = trend_Util.getCanvasPos(e, objTrendGroup),
                        pointX = xys[0];
                    clickBeginX = pointX;
                    from = new Date(objTrendGroup.opTrend.getTimeFromX(pointX));
                },
                mouseup: function (e) {
                    downflag = false;
                    var xys = trend_Util.getCanvasPos(e, objTrendGroup);
                    if (parseInt(xys[0]) >= parseInt(rightX)) {
                        xys[0] = parseInt(rightX);
                    }
                    objTrendGroup.mouseLeaveXY = xys;
                    if (moveflag) {
                        objTrendGroup.trend_getData4CheckboxFlag = true;
                        objTrendGroup.mouseLeaveXY = [];
                        if (to - from < 60000) {
                            if (!objTrendGroup.opTrend.playing) {
                                objTrendGroup.addTrend(objTrendGroup.defaultTrendString, objTrendGroup.opTrend.from, objTrendGroup.opTrend.to, false);
                            }
                            return;
                        }
                        if ((to - from) / (objTrendGroup.opTrend.to - objTrendGroup.opTrend.from) < 0.1) {
                            if (!objTrendGroup.opTrend.playing) {
                                objTrendGroup.addTrend(objTrendGroup.defaultTrendString, objTrendGroup.opTrend.from, objTrendGroup.opTrend.to, false);
                            }
                            return;
                        }
                        objTrendGroup.opTrend.from = from;
                        objTrendGroup.opTrend.to = to;
                        from = trend_Util.dateFormat(from, objTrendGroup.formatString);
                        to = trend_Util.dateFormat(to, objTrendGroup.formatString);
                        $("#trend_to").find('input').val(to);
                        $("#trend_from").find('input').val(from);
                        $('#trendTime').val(-1).trigger("change");
                        objTrendGroup.addTrend(objTrendGroup.defaultTrendString, from, to, false);
                    }
                    moveflag = false;
                },
                mousemove: function (e) {
                    var xys = trend_Util.getCanvasPos(e, objTrendGroup);
                    if (parseInt(xys[0]) >= parseInt(rightX)) {
                        xys[0] = parseInt(rightX);
                    }
                    var width = parseInt(xys[0]) - clickBeginX;
                    if (downflag && (parseInt(xys[0]) <= parseInt(rightX))) {
                        objTrendGroup.opTrend.repaint(objTrendGroup.defaultTrendString);
                        if (width >= 10) {
                            moveflag = true;
                            objTrendGroup.canvas_context.globalAlpha = 0.4;
                            objTrendGroup.canvas_context.fillStyle = objTrendGroup.opTrend.trend_bgLineColor;
                            objTrendGroup.canvas_context.fillRect(clickBeginX, 0, width, objTrendGroup.opTrend.canvasHeight);
                            objTrendGroup.canvas_context.globalAlpha = 1;
                            to = new Date(objTrendGroup.opTrend.getTimeFromX(xys[0]));
                            objTrendGroup.mouseLeaveXY = [];
                        }
                    }
                }
            });
        }
    },
    /**
     * 显示历史回放实时数据
     */
    showHistory: function (time, objTrendGroup) {
        var objs = objTrendGroup.opTrend.trendArray;
        var arr = objTrendGroup.opTrend.getValueFromTime(time);
        for (var i = 0; i < objs.length; i++) {
            $("#" + objTrendGroup.trendIdFlags[i]).text(arr[i]);
        }
    },
    /**
     * 获取被选中的点名
     */
    getCheckedNames: function (objTrendGroup) {
        // 数组克隆
        objTrendGroup.chcekdPointNames = [];
        objTrendGroup.chcekdPointNames = objTrendGroup.defaultTrendString.slice(0);
        var checkboxs = $("#" + objTrendGroup.pointsTable + " input[name='" + objTrendGroup.pointsTable + "_trendCheckBox']");
        //document.getElementsByName("trendCheckBox");
        for (var i = 0; i < checkboxs.length; i++) {
            if (!checkboxs[i].checked) {
                var trObj = document.getElementById(checkboxs[i].id),
                    pn = trObj.cells[1].innerHTML;
                //              this.trendGroup.chcekdPointNames.push(pn);
                var index = objTrendGroup.chcekdPointNames.indexOf(pn);
                objTrendGroup.chcekdPointNames.splice(index, 1);
            }
        }
    },
    checkDouble: function (obj, precision, scale) {
        // 如果未空直接返回；
        var objValue = obj.value;
        if (objValue == null || objValue.length == 0)
            return;
        // 将所有非数字，非"."去掉；
        if (objValue.match(/[^-0-9\.]+/)) {
            obj.value = objValue.replace(/[^-0-9\.]+/, "");
            objValue = obj.value;
        }
        // 小数点最多一个，超过一个，保留第一个；
        if (objValue.indexOf(".") != objValue.lastIndexOf(".")) {
            obj.value = objValue.dotClear();
            objValue = obj.value;
        }
        // 去掉首位多余的0；
        if (objValue.match(/^0+$/)) {
            obj.value = objValue.replace(/^0+$/, "0");
            objValue = obj.value;
        } else if (objValue.match(/^0+/)) {
            obj.value = objValue.replace(/^0+/, "");
            objValue = obj.value;
        }
        if (!objValue.match(/\./)) {
            // 如果没有小数点
            if (objValue.length - precision > 0) {
                // 最大长度precision
                obj.value = objValue.substring(obj.value.length - precision,
                    obj.value.length);
                objValue = obj.value;
            }
        } else {
            // 有小数点；
            var dotIndex = objValue.indexOf("\.");
            if (dotIndex === 0) {
                // 如果小数点在首位，前面加0
                obj.value = "0" + objValue;
                objValue = obj.value;
            }

            dotIndex = objValue.indexOf("\.");
            if (dotIndex - precision > 0) {
                // 保证小数点左边最多 precision位；(超出的话向左移动小数点)
                obj.value = objValue.substring(dotIndex - precision, dotIndex) + objValue.substring(dotIndex);
                objValue = obj.value;
            }

            dotIndex = objValue.indexOf("\.");
            var realScale = objValue.length - (dotIndex + 1);
            if (realScale - scale > 0) {
                // 保证小数点右边最多sacle位；
                obj.value = objValue.substring(0, objValue.length - (realScale - scale));
                objValue = obj.value;
            }
        }
    },
    /**
     * 根据参数获取日期
     *
     * @param {}
     *            count
     * @return {}
     */
    getParameter4Time: function (count, objTrendGroup, dateTime) {
        var temp = 1000 * 60 * 60;
        var time = dateTime.replace(/-/g, "/");
        var result;
        if (!trend_Util.isNull(time)) {
            result = trend_Util.dateFormat(new Date(time).getTime() - temp * count, objTrendGroup.formatString);
        } else {
            result = trend_Util.dateFormat(new Date().getTime() - temp * count, objTrendGroup.formatString);
        }
        return result;
    },

    /**
     * 检测点名是否重复
     *
     * @param {}
     *            names
     * @return {Boolean}
     */
    checkNameRE: function (names, objTrendGroup) {
        var flag = false;
        var length = objTrendGroup.defaultTrendString.length;
        for (var j = 0; j < names.length; j++) {
            for (var i = 0; i < length; i++) {
                if (objTrendGroup.defaultTrendString[i] == names[j]) {
                    flag = true;
                    break;
                }
            }
            if (i == length) {
                objTrendGroup.defaultTrendString.push(names[j]);
            }
        }
        return flag;
    },
    /**
     * 停止刷新
     */
    stopFlush: function (objTrendGroup) {
        for (var i = 0; i < objTrendGroup.trendStopFlushFlags.length; i++) {
            clearInterval(objTrendGroup.trendStopFlushFlags[i]);
        }
        clearInterval(objTrendGroup.trendIntervalId);
        clearInterval(objTrendGroup.history);
    },


    /**
     * 删除数组中的重复元素
     *
     * @param {}
     *            array
     * @return {}
     */
    removeArraySameElement: function (array) {
        for (var i = 0; i < array.length; i++) {
            for (var j = i + 1; j < array.length; j++) {
                if (array[i] == array[j]) {
                    // alert("输入内容包含重复点名！");
                    array = trend_Util.removeElement(j, array); // 删除指定下标的元素
                    i = -1;
                    break;
                }
            }
        }
        return array;
    },
    /**
     * 移除数组对象
     *
     * @param {}
     *            index
     * @param {}
     *            array
     * @return {}
     */
    removeElement: function (index, array) {
        if (index >= 0 && index < array.length) {
            for (var i = index; i < array.length; i++) {
                array[i] = array[i + 1];
            }
            array.length = array.length - 1;
        }
        return array;
    },
    /**
     * 获取服务器时间
     */
    getServerTime: function () {
        var time = new Date().getTime();
        // $.ajax({
        //     url: '/openplant/getServerTime',
        //     type: 'GET',
        //     datatype: 'json',
        //     success: function(data) {
        //         *
        //          * 判断对应的键值是否有对应的数据

        //         if (data.flag == 0) {
        //             time = data.data;
        //         }
        //     }
        // });
        return time;
    },
    statusOfDS: function (DS) {
        if (DS < 0)
            return true;
        var ds = DS >> 14;
        if (ds > 0) {
            return true;
        }
        return false;
    }
};

var trend_canvas = null;

function opTrend() {
    this.localFormat = true;
    this.backCanvas = null;
    this.canvas_context = null;
    this.canvasX = 0;
    this.canvasY = 0;
    this.canvasWidth = 400;
    this.canvasHeight = 300;
    this.drawLineType = 0; // 画曲线类型，（暂定0为当前时间曲线，即曲线会跟随时间平移，1为固定时间区间内画曲线）
    this.colors = ['#FF0000', '#FFFF00', '#00FF00', '#6666E1', '#00FFFF',
        '#FF00FF', '#FF007B', '#804000', '#FFAFAF', '#99CC00', '#FFC800',
        '#CCFFFF', '#695D61', '#00EBA3', '#8540FF', '#FF9900'
    ];
    this.from = null;
    this.to = null;
    this.currentFrom = null;
    this.current = null;
    this.interval = 1000; // 更新频率
    this.dateType = 4; // 日期格式化类型，具体内容参考画图工具设置
    this.playing = true; // 曲线是否动态播放
    this.trendObjs = new trendUtilMap(); // 趋势组
    this.trendArray = [];
    this.margin_top = 10; // 趋势内部面板与边框上下间隔
    this.margin_bottom = 40; // 趋势内部面板与边框下间隔
    this.margin_padding = 40; // 趋势内部面板与边框左右的间隔
    this.margin_lineStyle = 0; // 外边框样式
    this.margin_fillColor = 'white'; // 外边框前景色
    this.margin_fillBackColor = 'white'; // 外边框后景色
    this.margin_lineWidth = 1; // 外边框线宽度
    this.margin_lineColor = 'black'; // 外边框线颜色
    this.margin_type = 1; // 背景框填充样式
    this.margin_fillStyleFirst = 0;
    this.margin_fillStyleSecond = 0;
    this.margin_fillStyleThird = 0;
    this.widthRatioA = 13;
    this.widthRatioATemp = 13;
    this.widthRatioB = 14; // 趋势区域所占整体宽度为widthRatioA/widthRatioB，上下限所占（B-A）/B
    this.innerBorder_lineWidth = 1; // 内边框线宽
    this.innerBorder_lineStyle = 0; // 内边框样式
    this.innerBorder_color = 'black'; // 内边框颜色
    this.xaxisHeight = 40; // x轴刻度高度
    this.xAxisScaleCount = 5; // 刻度个数
    this.timeFontColor = 'black'; // 时间字体颜色
    this.timeFontSize = 12; // 时间刻度字体
    this.timeFontLineHeight = 5;
    this.trend_backLineCount = 10; // 背景线条数
    this.trend_bgLineColor = 'black'; // 背景线颜色
    this.trend_bgLineWidth = 0.5; // 背景线宽
    this.trend_bgLineStyle = 3; // 背景线样式
    this.trend_bgColor = 'white'; // 趋势面板背景色
    this.isComponents = true;
    this.promptMsg = "数据正在加载中，请稍侯……";
    this.rightMessageBackgroundColor = 'white'; // 上下限信息背景色

    // 添加趋势
    this.addTrendMap = function (name, lines) { // 添加趋势
        this.trendObjs.put(name, lines);
    };
    this.addTrend = function (line) {
        this.trendArray.push(line);
    };
    /*自适应量程*/
    this.adaptiveRange = function (trendObjMap) {
        for (var j = 0; j < this.trendArray.length; j++) {
            var opT = this.trendArray[j];
            var obj = trendObjMap.get(opT.pointName);
            opT.adaptiveRange(obj);
        }
    };
    /*重置自适应量程*/
    this.reAdaptiveRange = function (trendObjMap) {
        for (var j = 0; j < this.trendArray.length; j++) {
            var opT = this.trendArray[j];
            var obj = trendObjMap.get(opT.pointName);
            opT.reAdaptiveRange(obj);
        }
    };
    this.repaint = function (name) {
        // 重绘
        //this.from = this.getTimeFromString(this.from);
        // this.to = this.getTimeFromString(this.to);
        this.from = new Date(this.from);
        this.to = new Date(this.to);
        this.drawBack();
        this.drawTrend(name);
        this.canvasXAxis.draw(this);
        // this.update(name);
    };

    this.drawBack = function () {
        if (!this.backCanvas || (this.backCanvas && this.widthRatioATemp != this.widthRatioA)) {
            var _canvas = document.createElement("canvas");
            _canvas.width = this.canvasWidth + this.margin_padding * 2;
            _canvas.height = this.canvasHeight + this.margin_top + this.margin_bottom;
            var _context = _canvas.getContext("2d");
            // _context.save();
            // 背景
            this.borderRect.draw(this, _context);
            // 绘制趋势背景区域
            this.trendRect.draw(this, _context);
            // 绘制背景线
            this.trendBackLine.draw(this, _context);
            //绘制右边区间
            this.rightMessage.draw(this, _context);
            // 绘制x轴刻度
            this.verticalDraw.draw(this, _context);
            this.backCanvas = _canvas;
            this.widthRatioATemp = this.widthRatioA;
            // _context.translate(0.5, 0.5);
            // _context.restore();
        }
        // 清除整个画布
        this.canvas_context.clearRect(this.canvasX, this.canvasY, this.canvasWidth + this.margin_padding * 2, this.canvasHeight + this.margin_top + this.margin_bottom + 100);
        this.canvas_context.drawImage(this.backCanvas, this.canvasX, this.canvasY, this.canvasWidth + this.margin_padding * 2, this.canvasHeight + this.margin_top + this.margin_bottom);
    };
    /**
     * 绘制画布
     */
    this.draw = function () {
    };
    this.drawTrend = function (name) {
        var temp = 0;
        var objs = null;
        // 组件趋势
        if (this.trendArray.length > 0) {
            objs = this.trendArray;
            for (var j = 0; j < objs.length; j++) {
                objs[j].draw();
                temp += (this.canvasHeight) / 20;
                objs[j].drawRightMessage(temp);
                objs[j].drawAlarmLine();
            }
        }
        // this.drawPrompt(this.promptMsg);
        //this.promptMsg = "";
    };

    /**
     * 更新变更坐标
     */
    this.update = function (name) {
        if (this.playing) {
            var objs = this.trendObjs.get(name);
            if (objs) {
                for (var j = 0; j < objs.length; j++) {
                    objs[j].update();
                }
            }
            if (this.trendArray.length > 0 && !this.isComponents) {
                objs = this.trendArray;
                for (var j = 0; j < objs.length; j++) {
                    objs[j].update();
                }
            }
        }
    };
    /**
     * 数据加载信息
     *
     * @param {}
     *            str
     */
    this.drawPrompt = function (str) {
        this.canvas_context.fillStyle = "red";
        this.canvas_context.font = "15px 宋体";
        this.canvas_context.fillText(str, this.canvasX + this.canvasWidth / this.widthRatioB * this.widthRatioA / 2,
            this.canvasY + this.canvasHeight / 2);
    };
    /**
     * 更新X轴坐标时间
     */
    this.updateTime = function (time) {
        var interval = this.to.getTime() - this.from.getTime();
        this.from = new Date(time - interval);
        this.to = new Date(time);
    };
    /**
     * 更新X轴坐标时间
     */
    this.updateTimeReplayer = function (time) {
        var interval = this.to.getTime() - this.from.getTime();
        this.from = new Date(time - interval + 1000);
        this.to = new Date(time + 1000);
    };
    this.init = function () {
        this.from = this.getTimeFromString(this.from);
        this.to = this.getTimeFromString(this.to);
        var play = this.setIntervalFun(this.interval);
    };
    this.clear = function () {
        this.trendObjs = new trendUtilMap();
        this.trendArray = [];
    };
    this.setIntervalFun = function (interval) {
        var play = setInterval(function () {
            this.draw();
            this.update();
        }, interval);
        return play;
    };
    /**
     * 字符串转时间
     *
     * @param {}
     *            target
     * @return {}
     */
    this.getTimeFromString = function (target) {
        var str = target.toString();
        str = str.replace(/-/g, "/");
        var oDate1 = new Date(str);
        return oDate1;
    };
    /**
     * 日期格式化
     *
     * @param {}
     *            _format_index
     * @return {String}
     */
    this.getDateFormat = function (_format_index) {
        switch (_format_index) {
            case 0:
                return "mm:ss";
            case 1:
                return "mm";
            case 2:
                return "hh";
            case 3:
                return "hh:mm:ss";
            case 4:
                return "yyyy-MM-dd hh:mm:ss";
            case 5:
                return "yyyy-MM-dd";
            case 6:
                return "MM-dd";
            case 7:
                return "MM-dd-yy";
            case 8:
                return "EEE";
        }
    };
    /**
     * 趋势对象
     *
     * @param data
     * @returns
     */
    this.trendObj = function () {
        this.opTrend = new opTrend();
        this.id = -1;
        this.pointName = null;
        this.type = null;
        this.lineWidth = 1;
        this.topLimit = 100; // 上限
        this.lowLimit = 0; // 下限
        this.alarmTop = null; // 限高
        this.alarmLow = null; // 限低
        this.hide = false;
        this.dotcount = 2;
        this.color = "red";
        this.data = [];
        this.trendData = [];
        /*重置自适应量程*/
        this.reAdaptiveRange = function (obj) {
            this.topLimit = obj.ATV;
            this.lowLimit = obj.ABV;
            obj.TV = obj.ATV;
            obj.BV = obj.ABV;
        };
        /*自适应量程*/
        this.adaptiveRange = function (obj) {
            if (this.type == 1) {
                this.topLimit = 2;
                this.lowLimit = -1;
                obj.TV = this.topLimit;
                obj.BV = this.lowLimit;
                return;
            }
            var min, max;
            if (this.data != null && this.data.length > 1) {
                for (var i in this.data) {
                    var value = this.data[i][1];
                    if (!value && value != 0) {
                        continue;
                    }
                    if (!min || value < min) {
                        min = value;
                    }
                    if (!max || max < value) {
                        max = value;
                    }
                }
            }
            if ((min && max) || min == 0 || max == 0) {
                var dis = max - min;
                this.topLimit = parseInt(max + dis * 0.2);
                this.lowLimit = parseInt(min - dis * 0.2);
                if (dis == 0) {
                    this.topLimit = parseInt(max + 1);
                    this.lowLimit = parseInt(min - 1);
                }
                if (min <= this.lowLimit) {
                    this.lowLimit = this.lowLimit - 1;
                }
                if (max >= this.topLimit) {
                    this.topLimit = this.topLimit + 1;
                }
            }
            obj.TV = this.topLimit;
            obj.BV = this.lowLimit;
        };
        // 绘制曲线
        this.draw = function () {
            var y = this.opTrend.canvasY + this.opTrend.canvasHeight + this.opTrend.margin_top;
            this.opTrend.canvas_context.beginPath();
            this.opTrend.canvas_context.strokeStyle = this.color;
            this.opTrend.canvas_context.lineWidth = this.lineWidth;
            if (this.data != null && this.data.length > 1 && !this.hide) {
                this.opTrend.repaintLine(this.data, y, this.color, this.lineWidth, this.type, this.topLimit, this.lowLimit);
            } else if (this.trendData != null && this.trendData.length > 0) {
                this.data = this.opTrend.drawLineAndGenerateData(this.trendData, y, this.color, this.lineWidth, this.type, this.topLimit, this.lowLimit, this.hide);
                this.trendData = [];
            }
        };
        // 绘制限高限低线
        this.drawAlarmLine = function () {
            var y = this.opTrend.canvasY + this.opTrend.canvasHeight + this.opTrend.margin_top;
            var x1 = this.opTrend.canvasX + this.opTrend.margin_padding,
                x2 = this.opTrend.canvasX + this.opTrend.canvasWidth * this.opTrend.widthRatioA / this.opTrend.widthRatioB + this.opTrend.margin_padding;
            var height = 16,
                tempH = 4,
                tempW = 2;
            if (this.alarmTop != null && this.alarmTop != "" && !this.hide) {
                var width = this.opTrend.canvas_context.measureText(this.alarmTop).width * 1.2;
                var yy = this.opTrend.getCanvasY(this.alarmTop, this.topLimit, this.lowLimit);
                yy = this.opTrend.drawLineLimit(yy, y);
                trend_funStyle.drawDashedLine(x1 + width, yy, x2 - width, yy, 2, this.lineWidth, this.color, this.opTrend.canvas_context);
                this.opTrend.canvas_context.globalAlpha = 0.6;
                this.opTrend.canvas_context.fillStyle = this.color;
                this.opTrend.canvas_context.fillRect(x1, yy - height / 2, width, height);
                this.opTrend.canvas_context.fillRect(x2 - width, yy - height / 2, width, height);
                this.opTrend.canvas_context.globalAlpha = 1;
                this.opTrend.canvas_context.fillStyle = this.color;
                this.opTrend.canvas_context.font = "12px 宋体";
                this.opTrend.canvas_context.fillText(this.alarmTop, x1 + tempW, yy + tempH);
                this.opTrend.canvas_context.fillText(this.alarmTop, x2 - width + tempW, yy + tempH);
            }
            if (this.alarmLow != null && this.alarmLow != "" && !this.hide) {
                var width = this.opTrend.canvas_context.measureText(this.alarmLow).width * 1.2;
                var yy = this.opTrend.getCanvasY(this.alarmLow, this.topLimit, this.lowLimit);
                yy = this.opTrend.drawLineLimit(yy, y);
                trend_funStyle.drawDashedLine(x1 + width, yy, x2 - width, yy, 2, this.lineWidth, this.color, this.opTrend.canvas_context);
                this.opTrend.canvas_context.globalAlpha = 0.6;
                this.opTrend.canvas_context.fillStyle = this.color;
                this.opTrend.canvas_context.fillRect(x1, yy - height / 2, width, height);
                this.opTrend.canvas_context.fillRect(x2 - width, yy - height / 2, width, height);
                this.opTrend.canvas_context.globalAlpha = 1;
                this.opTrend.canvas_context.fillStyle = this.color;
                this.opTrend.canvas_context.font = "12px 宋体";
                this.opTrend.canvas_context.fillText(this.alarmLow, x1 + tempW, yy + tempH);
                this.opTrend.canvas_context.fillText(this.alarmLow, x2 - width + tempW, yy + tempH);
            }
        };
        // 绘制右边上下限图形及文字
        this.drawRightMessage = function (temp) {
            var x = this.opTrend.canvasX + this.opTrend.canvasWidth + this.opTrend.margin_padding - (this.opTrend.canvasWidth / this.opTrend.widthRatioB * (this.opTrend.widthRatioB - this.opTrend.widthRatioA));
            var y = this.opTrend.canvasY + this.opTrend.margin_top,
                width = this.opTrend.canvasWidth / this.opTrend.widthRatioB,
                height = this.opTrend.canvasHeight,
                side = height / 35,
                x1 = x + width / this.opTrend.widthRatioB,
                y1 = y + temp - 8,
                y2 = y + height - temp;
            this.opTrend.canvas_context.fillStyle = this.color;
            this.opTrend.canvas_context.fillRect(x1, y1, side, side);
            this.opTrend.canvas_context.fillRect(x1, y2, side, side);
            this.opTrend.canvas_context.font = this.opTrend.timeFontSize + "px Verdana";
            var t = Math.round(this.topLimit),
                l = Math.round(this.lowLimit);
            this.opTrend.canvas_context.fillText(t, x1 + side * 1.5, y1 + side);
            this.opTrend.canvas_context.fillText(l, x1 + side * 1.5, y2 + side);
        };
        // 每次间隔更新坐标
        this.update = function () {
            var timeWidth = this.opTrend.to.getTime() - this.opTrend.from.getTime();
            if (this.data.length > 10) {
                if (this.data[0][0] + timeWidth < this.opTrend.from.getTime()) {
                    this.data.remove(0);
                }
            }
        };
        // 实时添加动态数据
        this.addPoint = function (arr) {
            if (this.data && this.data.length > 0) {
                var length = this.data.length;
                var val = this.data[length - 1];
                if (val[0] == arr[0]) {
                    this.data[length - 1] = arr;
                } else {
                    this.data.push(arr);
                }
            } else {
                this.data.push(arr);
            }
        };
    };
    /**
     * 背景框
     */
    this.borderRect = {
        draw: function (opTrend, context) {
            var width = opTrend.canvasWidth + opTrend.margin_padding * 2,
                height = opTrend.canvasHeight + opTrend.margin_bottom + opTrend.margin_top;
            var dashedRect = {
                x: opTrend.canvasX,
                y: opTrend.canvasY,
                width: width,
                height: height,
                lineStyle: opTrend.margin_lineStyle,
                fillType: opTrend.margin_type,
                lineWidth: opTrend.margin_lineWidth,
                color: opTrend.margin_lineColor,
                fcolor: opTrend.margin_fillColor,
                bcolor: opTrend.margin_fillBackColor,
                firstParam: opTrend.margin_fillStyleFirst,
                secondParam: opTrend.margin_fillStyleSecond,
                thirdParam: opTrend.margin_fillStyleThird
            };
            if (context) {
                trend_funStyle.drawRect(dashedRect, context);
            } else {
                trend_funStyle.drawRect(dashedRect, opTrend.canvas_context);
            }
        }
    };
    /**
     * 背景线
     */
    this.trendBackLine = {
        draw: function (opTrend, context) {
            var x = opTrend.canvasX + opTrend.margin_padding,
                y = opTrend.canvasY + opTrend.margin_top,
                targetHeight = opTrend.canvasHeight,
                temp = targetHeight / opTrend.trend_backLineCount;
            for (var i = 0; i < opTrend.trend_backLineCount - 1; i++) {
                if (context) {
                    trend_funStyle.drawDashedLine(x, temp + y, opTrend.canvasWidth + x - opTrend.canvasWidth / opTrend.widthRatioB * (opTrend.widthRatioB - opTrend.widthRatioA), temp + y, opTrend.trend_bgLineStyle, opTrend.trend_bgLineWidth, opTrend.trend_bgLineColor, context);
                } else {
                    trend_funStyle.drawDashedLine(x, temp + y, opTrend.canvasWidth + x - opTrend.canvasWidth / opTrend.widthRatioB * (opTrend.widthRatioB - opTrend.widthRatioA), temp + y, opTrend.trend_bgLineStyle, opTrend.trend_bgLineWidth, opTrend.trend_bgLineColor, opTrend.canvas_context);
                }
                temp += targetHeight / opTrend.trend_backLineCount;
            }
        }
    };
    /**
     * 绘制竖线
     * @type {{draw: opTrend.verticalDraw.draw}}
     */
    this.verticalDraw = {
        draw: function (opTrend, context) {
            var y = opTrend.canvasY + opTrend.canvasHeight + opTrend.margin_top,
                temp = (opTrend.canvasWidth - (opTrend.canvasWidth / opTrend.widthRatioB * (opTrend.widthRatioB - opTrend.widthRatioA))) / opTrend.xAxisScaleCount,
                xTemp = 0;
            for (var i = 0; i < opTrend.xAxisScaleCount + 1; i++) {
                var _x = xTemp + opTrend.canvasX + opTrend.margin_padding;
                if (i != 0 && i < opTrend.xAxisScaleCount) {
                    if (context) {
                        trend_funStyle.drawDashedLine(_x, y, _x + 0.1, (opTrend.canvasY + opTrend.margin_top), opTrend.trend_bgLineStyle, opTrend.trend_bgLineWidth, opTrend.trend_bgLineColor, context);
                    } else {
                        trend_funStyle.drawDashedLine(_x, y, _x + 0.1, (opTrend.canvasY + opTrend.margin_top), opTrend.trend_bgLineStyle, opTrend.trend_bgLineWidth, opTrend.trend_bgLineColor, opTrend.canvas_context);
                    }
                }
                xTemp += temp;
            }
        }
    };

    /**
     * 趋势画布
     */
    this.trendRect = {
        draw: function (opTrend, context) {
            var x = opTrend.canvasX + opTrend.margin_padding,
                y = opTrend.canvasY + opTrend.margin_top,
                width = opTrend.canvasWidth / opTrend.widthRatioB * opTrend.widthRatioA,
                height = opTrend.canvasHeight;
            var dashedRect = {
                x: x,
                y: y,
                width: width,
                height: height,
                lineStyle: opTrend.innerBorder_lineStyle,
                fillType: 1,
                lineWidth: opTrend.innerBorder_lineWidth,
                color: opTrend.innerBorder_color,
                fcolor: null,
                bcolor: opTrend.trend_bgColor
            };
            if (context) {
                trend_funStyle.drawRect(dashedRect, context);
            } else {
                trend_funStyle.drawRect(dashedRect, opTrend.canvas_context);
            }
        }
    };
    /**
     * x轴刻度对象
     */
    this.canvasXAxis = {
        time: 0,
        scale: {
            lineHeight: 5,
            draw: function (opTrend) {
                try {
                    var y = opTrend.canvasY + opTrend.canvasHeight + opTrend.margin_top,
                        temp = (opTrend.canvasWidth - (opTrend.canvasWidth / opTrend.widthRatioB * (opTrend.widthRatioB - opTrend.widthRatioA))) / opTrend.xAxisScaleCount,
                        xTemp = 0;
                    opTrend.canvas_context.fillStyle = opTrend.timeFontColor;
                    for (var i = 0; i < opTrend.xAxisScaleCount + 1; i++) {
                        var _x = xTemp + opTrend.canvasX + opTrend.margin_padding;
                        opTrend.canvas_context.font = opTrend.timeFontSize + "px Verdana";
                        var time = new Date(opTrend.getTimeFromX(xTemp)).getTime(),
                            ymd = "",
                            hms = "";
                        if (opTrend.dateType == 4) {
                            ymd = trend_Util.dateFormat(new Date(time), "yy-MM-dd");
                            hms = trend_Util.dateFormat(new Date(time), "HH:mm:ss");
                        } else {
                            hms = trend_Util.dateFormat(new Date(time), opTrend.getDateFormat(opTrend.dateType));
                        }
                        opTrend.canvas_context.fillText(hms, _x, y + opTrend.timeFontLineHeight * 2);
                        opTrend.canvas_context.fillText(ymd, _x, y + opTrend.timeFontLineHeight * 4);
                        xTemp += temp;
                    }
                } catch (e) {
                    log(e);
                }
            }

        },
        // 绘制背景框
        draw: function (opTrend) {
            this.scale.draw(opTrend);
        }
    };
    /**
     * 画板上下限区域
     *
     * @type
     */
    this.rightMessage = {
        draw: function (opTrend, context) {
            var x = opTrend.canvasX + opTrend.canvasWidth + opTrend.margin_padding - opTrend.canvasWidth / opTrend.widthRatioB * (opTrend.widthRatioB - opTrend.widthRatioA),
                y = opTrend.canvasY + opTrend.margin_top,
                width = opTrend.canvasWidth / opTrend.widthRatioB * (opTrend.widthRatioB - opTrend.widthRatioA),
                height = opTrend.canvasHeight;
            var dashedRect = {
                x: x,
                y: y,
                width: width,
                height: height,
                lineStyle: opTrend.innerBorder_lineStyle,
                fillType: 1,
                lineWidth: opTrend.innerBorder_lineWidth,
                color: opTrend.innerBorder_color,
                fcolor: null,
                bcolor: opTrend.trend_bgColor
            };
            if (context) {
                trend_funStyle.drawRect(dashedRect, context);
            } else {
                trend_funStyle.drawRect(dashedRect, opTrend.canvas_context);
            }
        }
    };
    /**
     * 获取画布x坐标
     *
     * @param target
     * @returns {Number}
     */
    this.getCanvasX = function (target) {
        var result = null,
            interval = target - this.from.getTime();
        result = this.getXProportion() * interval;
        return result;
    };
    /**
     * 获取画布y坐标
     *
     * @param target
     * @param top
     * @param low
     * @returns {Number}
     */
    this.getCanvasY = function (target, top, low) {
        var interval = target - low,
            res = this.canvasHeight + this.canvasY + this.margin_top - this.getYProportion(top, low) * interval;
        return res;
    };
    /**
     * 获取X轴比例
     *
     * @returns {Number}
     */
    this.getXProportion = function () {
        var timeWidth = this.to.getTime() - this.from.getTime();
        return (this.canvasWidth - this.canvasWidth / this.widthRatioB * (this.widthRatioB - this.widthRatioA)) / timeWidth;
    };
    /**
     * 获取Y轴比例
     *
     * @returns {Number}
     */
    this.getYProportion = function (top, low) {
        var valueHeight = top - low;
        return (this.canvasHeight) / valueHeight;
    };
    /**
     * 根据坐标获取时间
     *
     * @param xx
     * @returns
     */
    this.getTimeFromX = function (xx) {
        var result = this.from.getTime() + xx * (this.to.getTime() - this.from.getTime()) / (this.canvasWidth - this.canvasWidth / this.widthRatioB * (this.widthRatioB - this.widthRatioA));
        return result;
    };
    /**
     * 根据时间获取游标值
     *
     * @param {}
     *            time
     * @return {}
     */
    this.getValueFromTime = function (time) {
        var arr = [],
            objs = this.trendArray;
        value = null;
        for (var f = 0; f < objs.length; f++) {
            var data = objs[f].data;
            var val = 'N/D';
            if (objs[f].id == -1) {
                val = 'N/A'
            }
            if (!data) {
                arr.push(val);
            } else {
                var index = this.getDataIndexFromTime(data, time, objs[f].type); // 获取数据集中和时间最近的一点
                if (index == -1) {
                    arr.push('N/D');
                    continue;
                }
                value = this.calcYaxisValue(index, objs[f].type, data, time, objs[f].id);
                if (typeof(value) == 'number') {
                    if (objs[f].type == 1 || objs[f].type == 2 || objs[f].type == 3) {
                        arr.push(value);
                        continue;
                    }
                    if (this.localFormat) {
                        arr.push(value.toFixed(trend_Util.dotcount));
                    } else {
                        arr.push(value.toFixed(objs[f].dotcount));
                    }
                } else {
                    arr.push(value);
                }
            }
        }
        return arr;
    };
    /**
     * 计算游标值
     *
     * @param {}
     *            index
     * @param {}
     *            type
     * @param {}
     *            data
     * @param {}
     *            time
     * @return {String}
     */
    this.calcYaxisValue = function (index, type, data, time, id) {
        if (id == -1) {
            return 'N/A';
        }
        if (type == 0 || type == 4) {
            try {
                var xy1 = data[index],
                    x1 = 0,
                    y1 = 0,
                    x2 = 0,
                    y2 = 0;
                if (xy1 && xy1[1] != null) {
                    x1 = xy1[0];
                    y1 = xy1[1];
                } else {
                    return "N/D";
                }
                if (time < x1) {
                    index = index - 1;
                } else {
                    index = index + 1;
                }
                var xy2 = data[index];
                if (xy2 && xy2[1] != null) {
                    x2 = xy2[0];
                    y2 = xy2[1];
                } else {
                    return "N/D";
                }
                var k = (y2 - y1) / (x2 - x1),
                    b = y1 - k * x1;
                // if (x2 - x1 > 0) {
                var yy = k * time + b;
                return yy;
                // } else {
                //     return "N/D";
                // }
            } catch (e) {
                log(e.message);
                return "N/D";
            }
        } else {
            try {
                var t = data[index][1];
                var t1;
                if (data[index + 1]) {
                    t1 = data[index + 1][1];
                }
                if (t != null && t1 != null) {
                    return t;
                } else {
                    return "N/D";
                }
            } catch (e) {
                log(e.message);
                return "N/D";
            }
        }
    };
    /**
     * 遍历数据组取时间点相近的数据的位置
     *
     * @param data
     * @param time
     * @returns {Array}
     */
    this.getDataIndexFromTime = function (data, time, type) {
        var count = -1;
        if (data) {
            if (type == 0 || type == 4) {
                for (var d = 0; d < data.length; d++) {
                    var tm = Math.round(data[d][0]);
                    var dataNext = data[d + 1];
                    if (!dataNext) {
                        return d;
                    }
                    var tmNext = Math.round(dataNext[0]);
                    var temp = time - tm;
                    var tempNext = time - tmNext;
                    if (temp <= 500 && temp >= -500) {
                        count = d;
                        break;
                    } else if (temp > 0 && tempNext < 0) {
                        if (Math.abs(tempNext) > temp) {
                            return d;
                        } else {
                            return d + 1;
                        }
                    } else if (tm > time) {
                        count = d - 1;
                        break;
                    }
                }
            } else {
                for (var d = 0; d < data.length; d++) {
                    var tm = Math.round(data[d][0]);
                    var d2 = data[d + 1];
                    if (d2) {
                        var tm2 = Math.round(d2[0]);
                    } else {
                        return d;
                    }
                    if (tm >= time && time <= tm2) {
                        count = d;
                        break;
                    } else if (tm2 > time) {
                        count = d;
                        break;
                    }
                }
            }
        }
        return count;
    };
    /**
     * 初次画曲线并且生成x,y数组
     *
     * @param data
     * @param top
     * @param low
     * @param y
     * @returns {Array}
     */
    this.drawLineAndGenerateData = function (data, y, color, lineWidth, type, top,
                                             low, isHide) {
        // data,top,low,y,type
        var newData = [];
        for (var i = 0; i < data.length; i++) {
            var xys = [];
            xys[0] = data[i].x;
            if (data[i].y == null) {
                xys[1] = null;
            } else {
                xys[1] = data[i].y;
            }
            newData.push(xys);
        }
        if (!isHide) {
            this.repaintLine(newData, y, color, lineWidth, type, top, low);
        }
        return newData;
    };
    /**
     * 曲线坐标变更后重绘曲线
     *
     * @param data
     * @param y
     * @param color
     * @param lineWidth
     */
    this.repaintLine = function (data, y, color, lineWidth, type, top, low) {
        if (type == 1) {
            data = this.getDXDataFromOldData(data);
        }
        this.canvas_context.lineWidth = lineWidth;
        this.canvas_context.strokeStyle = color;
        if (type == 2 || type == 3) {
            if (data.length > 0) {
                for (var i = 0; i < data.length; i++) {
                    var xx = this.getCanvasX(data[i][0]) + this.canvasX + this.margin_padding,
                        yy = data[i][1];
                    var yyTemp;
                    //回放趋势时未达到的数据不进行绘制
                    if (data[i] && data[i][0] <= this.to.getTime() + 1000) {
                        var rightX = this.canvasX + this.canvasWidth * this.widthRatioA / this.widthRatioB + this.margin_padding;
                        if ((yy == null || i == 0) && i + 1 < data.length) {
                            if (yy == null) {
                                var x1 = this.getCanvasX(data[i + 1][0]) + this.canvasX + this.margin_padding;
                                if (x1 > rightX)
                                    x1 = rightX;
                                var y1 = this.getCanvasY(data[i + 1][1], top, low);
                                y1 = this.drawLineLimit(y1, y);
                                this.canvas_context.moveTo(x1, y1);
                                yyTemp = y1;
                                i++;
                            } else if (i == 0) {
                                var x1 = this.getCanvasX(data[i][0]) + this.canvasX + this.margin_padding;
                                if (x1 > rightX)
                                    x1 = rightX;
                                var y1 = this.getCanvasY(data[i][1], top, low);
                                y1 = this.drawLineLimit(y1, y);
                                this.canvas_context.moveTo(x1, y1);
                                yyTemp = y1;
                            }
                        } else {
                            if (yy != null) {
                                yy = this.getCanvasY(yy, top, low);
                                yy = this.drawLineLimit(yy, y);
                                if (xx > rightX)
                                    xx = rightX;
                                this.canvas_context.lineTo(xx, yyTemp);
                                this.canvas_context.lineTo(xx, yy);
                                yyTemp = yy;
                            }
                        }
                    }
                }
                this.canvas_context.stroke();
            }
        } else {
            if (data.length > 0) {
                for (var i = 0; i < data.length; i++) {
                    var xx = this.getCanvasX(data[i][0]) + this.canvasX + this.margin_padding,
                        yy = data[i][1];
                    //回放趋势时未达到的数据不进行绘制
                    if (data[i] && data[i][0] <= this.to.getTime() + 1000) {
                        var rightX = this.canvasX + this.canvasWidth * this.widthRatioA / this.widthRatioB + this.margin_padding;
                        if ((yy == null || i == 0) && i + 1 < data.length) {
                            if (yy == null) {
                                var x1 = this.getCanvasX(data[i + 1][0]) + this.canvasX + this.margin_padding;
                                if (x1 > rightX)
                                    x1 = rightX;
                                var y1 = this.getCanvasY(data[i + 1][1], top, low);
                                y1 = this.drawLineLimit(y1, y);
                                this.canvas_context.moveTo(x1, y1);
                                i++;
                            } else if (i == 0) {
                                var x1 = this.getCanvasX(data[i][0]) + this.canvasX + this.margin_padding;
                                if (x1 > rightX)
                                    x1 = rightX;
                                var y1 = this.getCanvasY(data[i][1], top, low);
                                y1 = this.drawLineLimit(y1, y);
                                this.canvas_context.moveTo(x1, y1);
                            }
                        } else {
                            if (yy != null) {
                                yy = this.getCanvasY(yy, top, low);
                                yy = this.drawLineLimit(yy, y);
                                if (xx > rightX)
                                    xx = rightX;
                                this.canvas_context.lineTo(xx, yy);
                            }
                        }
                    }
                }
                this.canvas_context.stroke();
            }
        }
    };
    /**
     * 数据转换为DX曲线数据
     *
     * @param data
     * @returns {Array}
     */
    this.getDXDataFromOldData = function (data) {
        var newData = [];
        if (data.length > 0) {
            for (var i = 0; i < data.length; i++) {
                if (i + 1 < data.length) {
                    newData.push(data[i]);
                    if (data[i][1] != null && data[i + 1][1] != null) {
                        var arr = [];
                        arr[0] = data[i + 1][0];
                        arr[1] = data[i][1];
                        newData.push(arr);
                    }
                } else {
                    newData.push(data[i]);
                }
            }
        }
        return newData;
    };
    /**
     * 修正曲线超出上下屏时坐标
     *
     * @param n
     * @param limit
     * @returns
     */
    this.drawLineLimit = function (n, limit) {
        if (n >= limit) {
            n = limit;
        } else if (n < this.canvasY + this.margin_top) {
            n = this.canvasY + this.margin_top;
        }
        return n;
    }
};

// --------------------------------------------------------------------------------------
var trend_funStyle = {
    /**
     * 画矩形 obj --> x,y,width,height,lineStyle,lineWidth,color,fcolor,bcolor……
     */
    drawRect: function (obj, canvas_context) {
        var grd = null;
        switch (obj.fillType) {
            case 0:
                canvas_context.fillStyle = "white";
                trend_funStyle.drawBorderRect(obj, canvas_context);
                break;
            case 1:
                if (obj.fcolor == null || obj.fcolor == undefined)
                    obj.fcolor = "white";
                canvas_context.fillStyle = obj.bcolor;
                trend_funStyle.drawBorderRect(obj, canvas_context);
                break;
            case 2:
                canvas_context.fillStyle = obj.bcolor;
                trend_funStyle.drawBorderRect(obj, canvas_context);
                trend_funStyle.drawBgStyle(obj, canvas_context);
                break;
            case 3:
                grd = trend_funStyle.drawBgColorChange(obj, canvas_context);
                canvas_context.fillStyle = grd;
                trend_funStyle.drawBorderRect(obj, canvas_context);
                break;
        }
    },
    /**
     * 背景色渐变
     */
    drawBgColorChange: function (obj, canvas_context) {
        var grd = null;
        switch (obj.secondParam) {
            case 0:
                grd = canvas_context.createLinearGradient(0, obj.y, 0, obj.height + obj.y);
                break;
            case 1:
                grd = canvas_context.createLinearGradient(obj.x, 0,
                    obj.width + obj.x, 0);
                break;
            case 2:
                grd = canvas_context.createLinearGradient(obj.x, obj.y, obj.width + obj.x, obj.height + obj.y);
                break;
            case 3:
                grd = canvas_context.createLinearGradient(obj.x, obj.height + obj.y,
                    obj.width + obj.x, obj.y);
                break;
        }
        switch (obj.thirdParam) {
            case 0:
                grd.addColorStop(0, obj.bcolor);
                grd.addColorStop(1, obj.fcolor);
                break;
            case 1:
                grd.addColorStop(0, obj.fcolor);
                grd.addColorStop(1, obj.bcolor);
                break;
            case 2:
                grd.addColorStop(0, obj.bcolor);
                grd.addColorStop(0.5, obj.fcolor);
                grd.addColorStop(1, obj.bcolor);
                break;
            case 3:
                grd.addColorStop(0, obj.fcolor);
                grd.addColorStop(0.5, obj.bcolor);
                grd.addColorStop(1, obj.fcolor);
                break;
        }
        return grd;
    },
    /**
     * 背景图案
     */
    drawBgStyle: function (obj, canvas_context) {
        var a = 6,
            b = 8;
        switch (obj.firstParam) {
            case 0: // 横线
                trend_funStyle.drawLine4Lateral(a, obj, canvas_context);
                break;
            case 1: // 纵线
                trend_funStyle.drawLine4Longitudinal(a, obj, canvas_context);
                break;
            case 2: // 横纵交叉线
                trend_funStyle.drawLine4Lateral(a, obj, canvas_context);
                trend_funStyle.drawLine4Longitudinal(a, obj, canvas_context);
                break;
            case 3: // 横线
                trend_funStyle.drawLine4Lateral(a / 2, obj, canvas_context);
                break;
            case 4: // 纵线
                trend_funStyle.drawLine4Longitudinal(a / 2, obj, canvas_context);
                break;
            case 5: // 纵横交叉线
                trend_funStyle.drawLine4Lateral(a / 2, obj, canvas_context);
                trend_funStyle.drawLine4Longitudinal(a / 2, obj, canvas_context);
                break;
            case 6: // k = 1
                trend_funStyle.drawLine4beveled(b, obj, canvas_context);
                break;
            case 7: // k = -1
                trend_funStyle._drawLine4beveled(b, obj, canvas_context);
                break;
            case 8: // 交叉线
                trend_funStyle.drawLine4beveled(b, obj, canvas_context);
                trend_funStyle._drawLine4beveled(b, obj, canvas_context);
                break;
            case 9: // k = 1
                trend_funStyle.drawLine4beveled(b / 2, obj, canvas_context);
                break;
            case 10: // k = -1
                trend_funStyle._drawLine4beveled(b / 2, obj, canvas_context);
                break;
            case 11: // 交叉线
                trend_funStyle.drawLine4beveled(b / 2, obj, canvas_context);
                trend_funStyle._drawLine4beveled(b / 2, obj, canvas_context);
                break;
            case 12: // 波浪线
                trend_funStyle.drawWavesLine(obj);
                break;
            case 13: // 砖块线
                trend_funStyle.drawBrickBG(obj);
                break;
            case 14: // 横线虚线
                trend_funStyle.drawDashedLine4BGLateral(a, obj, canvas_context);
                break;
            case 15: // 纵向虚线
                trend_funStyle.drawDashedLine4BGLongitudinal(a, obj, canvas_context);
                break;
        }
    },

    /**
     * 画纵线
     *
     * @param temp
     * @param obj
     */
    drawLine4Longitudinal: function (temp, obj, canvas_context) {
        var count = temp;
        while ((obj.x + count) < obj.width + obj.x) {
            trend_funStyle.drawDashedLine(obj.x + count, obj.y, obj.x + count,
                obj.y + obj.height, 0, 1, obj.fcolor, canvas_context);
            count += temp;
        }
    },
    /**
     * 画横线
     *
     * @param temp
     * @param obj
     */
    drawLine4Lateral: function (temp, obj, canvas_context) {
        var count = temp;
        while ((obj.y + count) < obj.height + obj.y) {
            trend_funStyle.drawDashedLine(obj.x, obj.y + count, obj.x + obj.width, obj.y + count, 0, 1, obj.fcolor, canvas_context);
            count += temp;
        }
    },
    /**
     * 画斜线 k = -1 TODO width<height 情况未处理
     *
     * @param temp
     * @param obj
     */
    drawLine4beveled: function (temp, obj, canvas_context) {
        var count = temp;
        var flag = 0;
        while ((obj.y + count) <= obj.height + obj.y) {
            trend_funStyle.drawDashedLine(obj.x, obj.y + count, obj.x + count,
                obj.y, 0, 1, obj.fcolor, canvas_context);
            count += temp;
        }
        flag = count - temp;
        count = temp;
        while (obj.x + flag + count < obj.x + obj.width) {
            trend_funStyle.drawDashedLine(obj.x + count, obj.y + obj.height,
                obj.x + flag + count, obj.y, 0, 1, obj.fcolor, canvas_context);
            count += temp;
        }

        count = temp;
        while (obj.y + obj.height - count > obj.y) {
            trend_funStyle.drawDashedLine(obj.x + obj.width - count, obj.y + obj.height, obj.x + obj.width,
                obj.y + obj.height - count, 0, 1, obj.fcolor, canvas_context);
            count += temp;
        }
    },
    /**
     * 画斜线 k = 1 TODO width<height 情况未处理
     *
     * @param temp
     * @param obj
     */
    _drawLine4beveled: function (temp, obj, canvas_context) {
        var count = temp;
        var flag = 0;
        while ((obj.y + count) <= obj.height + obj.y) {
            trend_funStyle.drawDashedLine(obj.x, obj.y + obj.height - count,
                obj.x + count, obj.y + obj.height, 0, 1, obj.fcolor);
            count += temp;
        }
        flag = count - temp;
        count = temp;
        while (obj.x + flag + count < obj.x + obj.width) {
            trend_funStyle.drawDashedLine(obj.x + count, obj.y, obj.x + count + flag, obj.y + obj.height, 0, 1, obj.fcolor, canvas_context);
            count += temp;
        }
        count = temp;
        while (obj.y + obj.height - count > obj.y) {
            trend_funStyle.drawDashedLine(obj.x + obj.width - count, obj.y,
                obj.x + obj.width, obj.y + count, 0, 1, obj.fcolor, canvas_context);
            count += temp;
        }
    },
    /**
     * 画矩形边框（虚线样式）
     *
     * @param obj
     */
    drawBorderRect: function (obj, canvas_context) {
        canvas_context.fillRect(obj.x, obj.y, obj.width, obj.height);
        trend_funStyle.drawDashedLine(obj.x, obj.y, obj.x, obj.y + obj.height, obj.lineStyle, obj.lineWidth, obj.color, canvas_context);
        trend_funStyle.drawDashedLine(obj.x + obj.width, obj.y, obj.x + obj.width, obj.y + obj.height, obj.lineStyle, obj.lineWidth, obj.color, canvas_context);
        trend_funStyle.drawDashedLine(obj.x, obj.y, obj.x + obj.width, obj.y, obj.lineStyle, obj.lineWidth, obj.color, canvas_context);
        trend_funStyle.drawDashedLine(obj.x, obj.y + obj.height, obj.x + obj.width, obj.y + obj.height, obj.lineStyle, obj.lineWidth, obj.color, canvas_context);
    },
    /**
     * 背景横向虚线
     */
    drawDashedLine4BGLateral: function (temp, obj, canvas_context) {
        var count = temp;
        while ((obj.y + count) < obj.height + obj.y) {
            trend_funStyle.drawDashedLine(obj.x, obj.y + count, obj.x + obj.width, obj.y + count, 1, 1, obj.fcolor, canvas_context);
            count += temp;
            var yy = obj.y + count;
            if (yy >= obj.height + obj.y) {
                yy = obj.height + obj.y;
            }
            trend_funStyle.drawDashedLine(obj.x + temp, yy, obj.x + obj.width, yy, 1, 1, obj.fcolor, canvas_context);
            count += temp;
        }
    },
    /**
     * 背景纵向虚线
     *
     * @param temp,obj
     */
    drawDashedLine4BGLongitudinal: function (temp, obj, canvas_context) {
        var count = temp;
        while ((obj.x + count) < obj.width + obj.x) {
            trend_funStyle.drawDashedLine(obj.x + count, obj.y, obj.x + count, obj.y + obj.height, 1, 1, obj.fcolor, canvas_context);
            count += temp;
            var xx = obj.x + count;
            if (xx >= obj.width + obj.x) {
                xx = obj.width + obj.x;
            }
            trend_funStyle.drawDashedLine(xx, obj.y + temp, xx, obj.y + obj.height, 1, 1, obj.fcolor, canvas_context);
            count += temp;
        }

    },
    /**
     * 画波浪线
     */
    drawWavesLine: function (obj, canvas_context) {
        var tempX = 0,
            tempY = 0,
            temp = 5;
        while (tempY < obj.height - temp) {
            while (tempX < obj.width) {
                trend_funStyle.drawDashedLine(obj.x + tempX, obj.y + tempY, obj.x + tempX + temp, obj.y + tempY + temp, 0, 1, obj.fcolor, canvas_context);
                trend_funStyle.drawDashedLine(obj.x + tempX + temp, obj.y + tempY + temp, obj.x + tempX + 2 * temp, obj.y + tempY, 0, 1, obj.fcolor, canvas_context);
                tempX += 2 * temp;
            }
            tempX = 0;
            tempY += temp;
        }
    },
    /**
     * 背景砖块图案
     *
     * @param obj
     */
    drawBrickBG: function (obj, canvas_context) {
        var temp = 7,
            tempX = 0,
            tempY = 0;
        trend_funStyle.drawLine4Lateral(temp, obj);
        while (tempY < obj.height - temp) {
            while (tempX + temp < obj.width) {
                trend_funStyle.drawDashedLine(obj.x + tempX, obj.y + tempY, obj.x + tempX, obj.y + tempY + temp, 0, 1, obj.fcolor, canvas_context);
                trend_funStyle.drawDashedLine(obj.x + tempX + temp, obj.y + tempY + temp, obj.x + tempX + temp, obj.y + tempY + 2 * temp, 0, 1, obj.fcolor, canvas_context);
                tempX += 2 * temp;
            }
            tempX = 0;
            tempY += 2 * temp;
        }
    },
    /**
     * 画虚线
     *
     * @param x,y,x2,y2,type,lw,color
     */
    drawDashedLine: function (x, y, x2, y2, type, lw, color, canvas_context) {
        if (color == null || color == undefined)
            color = "black";
        if (lw == null || lw == undefined)
            lw = 1;
        var dashGapArray = [];
        var flag = "butt";
        switch (type) {
            case 0:
                dashGapArray = [20000];
                flag = "square";
                break;
            case 1:
                dashGapArray = [8];
                break;
            case 2:
                dashGapArray = [4];
                break;
            case 3:
                dashGapArray = [3];
                break;
            case 4:
                dashGapArray = [2];
                break;
            case 5:
                dashGapArray = [11, 2, 2, 11];
                break;
            case 6:
                dashGapArray = [12, 3];
                break;
            case 7:
                dashGapArray = [2, 12, 2, 4];
                break;
            case 8:
                dashGapArray = [2, 2, 2, 2, 14, 12, 2, 2];
                break;
            case 9:
                dashGapArray = [11, 11, 2];
                break;
            case 10:
                dashGapArray = [4, 10];
                break;
            case 11:
                dashGapArray = [6, 10];
                break;
            case 12:
                dashGapArray = [8, 10];
                break;
            case 13:
                dashGapArray = [10, 9, 3, 10];
                break;
            case 14:
                dashGapArray = [30, 12, 6, 12];
                break;
        }
        canvas_context.lineWidth = lw;
        canvas_context.lineCap = flag;
        canvas_context.beginPath();
        canvas_context.strokeStyle = color;
        canvas_context.dashedLine(x, y, x2, y2, dashGapArray);
        canvas_context.stroke();
    }
};

// js map 函数
function trendUtilMap() {
    var struct = function (key, value) {
        this.key = key;
        this.value = value;
    };
    var put = function (key, value) {
        for (var i = 0; i < this.arr.length; i++) {
            if (this.arr[i].key === key) {
                this.arr[i].value = value;
                return;
            }
        }
        this.arr[this.arr.length] = new struct(key, value);
    };

    var get = function (key) {
        for (var i = 0; i < this.arr.length; i++) {
            if (this.arr[i].key === key) {
                return this.arr[i].value;
            }
        }
        return null;
    };

    var getObj = function (key) {
        return this.arr[key].value;
    };

    var remove = function (key) {
        var v;
        for (var i = 0; i < this.arr.length; i++) {
            v = this.arr.pop();
            if (v.key === key) {
                continue;
            }
            this.arr.unshift(v);
        }
    };

    var size = function () {
        return this.arr.length;
    };

    var isEmpty = function () {
        return this.arr.length <= 0;
    };
    this.arr = [];
    this.get = get;
    this.put = put;
    this.remove = remove;
    this.size = size;
    this.getObj = getObj;
    this.isEmpty = isEmpty;
}
Array.prototype.remove = function (dx) {
    if (isNaN(dx) || dx > this.length) {
        return false;
    }
    for (var i = 0, n = 0; i < this.length; i++) {
        if (this[i] != this[dx]) {
            this[n++] = this[i];
        }
    }
    this.length -= 1;
};
if (window.CanvasRenderingContext2D && CanvasRenderingContext2D.prototype.lineTo) {
    CanvasRenderingContext2D.prototype.dashedLine = function (x, y, x2, y2,
                                                              dashArray) {
        var temp = 0.1;
        if (!dashArray)
            dashArray = [10, 5];
        var dashCount = dashArray.length;
        this.moveTo(x + temp, y + temp);

        var dx = (x2 - x),
            dy = (y2 - y);
        var slope = dx ? dy / dx : 1e15;
        var distRemaining = Math.sqrt(dx * dx + dy * dy);
        var dashIndex = 0,
            draw = true;
        while (distRemaining >= 0.1 && dashIndex < 10000) {
            var dashLength = dashArray[dashIndex++ % dashCount];
            if (dashLength == 0)
                dashLength = 0.001; // Hack for Safari
            if (dashLength > distRemaining)
                dashLength = distRemaining;
            var xStep = Math
                .sqrt(dashLength * dashLength / (1 + slope * slope));
            x += xStep;
            y += slope * xStep;
            this[draw ? 'lineTo' : 'moveTo'](x + temp, y + temp);
            distRemaining -= dashLength;
            draw = !draw;
        }
        this.moveTo(0, 0);
    }
}


var isMobile = {
    Android: function () {
        return navigator.userAgent.match(/Android/i) ? true : false;
    },
    BlackBerry: function () {
        return navigator.userAgent.match(/BlackBerry/i) ? true : false;
    },
    iOS: function () {
        return navigator.userAgent.match(/iPhone|iPad|iPod/i) ? true : false;
    },
    iPhone: function () {
        return navigator.userAgent.match(/iPhone/i) ? true : false;
    },
    iPad: function () {
        return navigator.userAgent.match(/iPad/i) ? true : false;
    },
    Windows: function () {
        return navigator.userAgent.match(/IEMobile/i) ? true : false;
    },
    any: function () {
        return (isMobile.Android() || isMobile.BlackBerry() || isMobile.iOS() || isMobile.Windows());
    }
};

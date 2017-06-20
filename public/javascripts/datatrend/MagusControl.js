/**
 * Created by se7en on 2015-06-02.
 *
 *    控件是为了实现类似于百度自动提示的功能
 *
 * 为了实现可重用，控件提供样式美化，参数可配置数据自动获取
 *
 */

function Magus() {
    var _key;
    var timeout;
    var action;
    this.valueId = "magus_value";
    this.tipId = "magus_tip";
    this.showId = "show";
    this.callback = function () {
    };
    /**
     * 提示框出现
     */
    this.ShowTip = function () {
        var that = this;
        document.getElementById(that.tipId).onmouseleave = function () {
            document.getElementById(that.tipId).style.display = "none";
        }
        document.onclick = function () {
            document.getElementById(that.tipId).style.display = "none";
        }
        /**
         * 当双击的时候
         */
        document.getElementById(that.valueId).ondblclick = function (e) {
            _key = (e == null) ? event.keyCode : e.which
            if (_key != 39 && _key != 40 && _key != 37 && _key != 38
                && _key != 13 && _key != 17) {
                document.getElementById(that.tipId).style.display = "";
                document.getElementById(that.tipId).innerHTML = "&nbsp;正在获取提示...";
                clearTimeout(timeout);
                $.ajax({
                        type: 'get',
                        url: that.action,
                        data: {
                            keyWord: document.getElementById(that.valueId).value
                        },
                        dataType: 'text',
                        success: function (data) {
                            that.showTips(data);
                        },
                        error: function () {
                            alert('failed');
                        }
                    }
                )
                ;
            }
        }
        document.getElementById(that.valueId).onkeyup = function (e) {
            _key = (e == null) ? event.keyCode : e.which
            if (_key != 39 && _key != 40 && _key != 37 && _key != 38
                && _key != 13 && _key != 17) {
                document.getElementById(that.tipId).style.display = "";
                document.getElementById(that.tipId).innerHTML = "&nbsp;正在获取提示...";
                // 类似ajax的一个方法
                clearTimeout(timeout);
                $.ajax({
                    type: 'get',
                    url: that.action,
                    data: {
                        keyWord: document.getElementById(that.valueId).value
                    },
                    dataType: 'text',
                    success: function (data) {
                        that.showTips(data);
                    },
                    error: function () {
                        alert('failed');
                    }
                });
            }
        }
        document.onkeyup = function (e) {
            _key = (e == null) ? event.keyCode : e.which
            if (_key == 13) {
                var pointnametext = document.getElementById(that.valueId).value;
                if (pointnametext && pointnametext.trim() != "") {
                    that.callback(pointnametext);
                }
            }
        }
    };
    this.HideTip = function () {
        var that = this;
        var _key;
        document.onkeyup = function (e) {
            _key = (e == null) ? event.keyCode : e.which
            if (_key != 39 && _key != 40 && _key != 37 && _key != 38
                && _key != 13 && _key != 17) {
                document.getElementById(that.tipId).style.display = "none";
            }
        }
    };
    /**
     * 隐藏提示框
     */
    this.HideTTip = function () {
        document.getElementById(this.tipId).style.display = "none";
    };
    /**
     * 获取数据以后回调
     * @param data
     */

    this.showTips = function (data) {
        var that = this;
        if (data != "") {
            document.getElementById(that.tipId).innerHTML = "";
            var strSplits = data.split('|');
            var DIVStr = "";
            var FormatStr = "";
            var sum = strSplits.length - 1;
            var elementText = document.getElementById(that.valueId).value;
            // 搜索有内容
            if (sum > 1) {
                for (i = 1; i < sum; i++)// cut 0, and the end element
                {
                    FormatStr = strSplits[i].replace(elementText.toUpperCase(),
                        "<b><font color='red'>" + elementText.toUpperCase()
                        + "</font></b>")
                    DIVStr += "<div id='"
                        + that.tipId
                        + i
                        + "' style='cursor:pointer;line-height:20px;' onmousemove='MagusControl.FocusOP("
                        + i + "," + sum + ",\"" + that.tipId
                        + "\");' onmouseout='MagusControl.UFocusOP(" + i
                        + ",\"" + that.tipId
                        + "\");' onclick='MagusControl.ClickInner(\""
                        + strSplits[i] + "\",\"" + that.valueId + "\",\""
                        + that.tipId + "\");'>" + FormatStr + "</div>";
                }
                document.getElementById(that.tipId).innerHTML = DIVStr;
                var i = 1;
                maxid = strSplits.length - 1;
                MagusControl.FocusOP(i, maxid, that.tipId);
                document.onkeydown = function (e) {
                    _key = (e == null) ? event.keyCode : e.which
                    // ///////////向下
                    if (_key == 39 || _key == 40) {
                        MagusControl.UFocusOP(i, that.tipId);
                        i = i + 1;
                        if (i > maxid - 1) {
                            i = 1;
                        }
                        MagusControl.FocusOP(i, maxid, that.tipId);
                    }
                    // ///////////向上
                    else if (_key == 37 || _key == 38) {
                        MagusControl.UFocusOP(i, that.tipId);
                        i = i - 1;
                        if (i < 1) {
                            i = maxid - 1;
                        }
                        MagusControl.FocusOP(i, maxid, that.tipId);
                    }
                    // 回车且弹出框显示有内容
                    if (_key == 13
                        && document.getElementById(that.tipId).style.display != "none") {
                        if (window.XMLHttpRequest) {
                            document.getElementById(that.valueId).value = document
                                .getElementById(that.tipId + i).textContent;
                        } else {
                            document.getElementById(that.valueId).value = document
                                .getElementById(that.tipId + i).innerText;
                        }
                        document.getElementById(that.tipId).style.display = "none";
                    }
                }// end key down
            }//
        } else {
            // alert("无数据...");
            document.getElementById(that.tipId).style.display = "none";
        }
    }
    /**
     * 初始化 控件属性
     * @param {Object} container
     * @param {Object} options
     * @memberOf {TypeName}
     */
        //父级div
    this.ontainerDiv = null;
//调用的方法
    this.container = 'maugsTip';
    /**
     * 页面加载的时候进行调用 显示页面
     * @return {TypeName}
     */
    this.View = function () {
        var html = '<input type="text" id="'
            + this.valueId
            + '" ondblclick="javascript:ShowTip();" '
            + 'onkeyup="javascript:if ( this.value!=\'\'){ this.ShowTip(); '
            + '} else { this.HideTTip(); }" size="25" style="width:100%;height:100%" /> '
            + '<div id='
            + this.showId
            + '> <div id="'
            + this.tipId
            + '" name=this.tipId style="display:none; width:100%;height:100%" align="left">'
            + '</div> </div>';
        return html;
    };
    /**
     * 进行 控件渲染
     * @memberOf {TypeName}
     */
    this.render = function () {
        var widgetDiv = document.createElement('div');
        widgetDiv.style.border = '1px';
        widgetDiv.style.cursor = 'pointer';
        widgetDiv.style.color = 'green';
        var html = this.View();
        widgetDiv.innerHTML = html;
        this.containerDiv.appendChild(widgetDiv);
    };

    /**
     * 初始化 数据
     * @param {Object} container
     * @param {Object} callback
     * @memberOf {TypeName}
     */
    this.init = function (container, action, callback) {
        this.containerDiv = document.getElementById(container);
        this.action = action;
        if (callback) {
            this.callback = callback;
        }
        this.render();
        this.ShowTip();
    }

    /**
     * 获取选择 的值
     */
    this.getValue = function () {
        return document.getElementById(this.valueId).value;
    }

    this.initValue = function () {
        document.getElementById(this.valueId).value = "";
    }
}
;

var MagusControl = {
    // 获取焦点
    FocusOP: function (OPP, VNum, tipId) {
        // 清除其它焦点
        for (M = 1; M < VNum; M++) {
            document.getElementById(tipId + M).focus = false;
            document.getElementById(tipId + M).style.background = "white";
        }
        document.getElementById(tipId + OPP).focus = true;
        document.getElementById(tipId + OPP).style.background = "#a9e4e9";// change to

    },
    // 失去焦点
    UFocusOP: function (EID, tipId) {
        // alert(EID + " UFocusOP ");
        document.getElementById(tipId + EID).focus = false;
        document.getElementById(tipId + EID).style.background = "#FFFFFF";

    },

    // 单击注入值
    ClickInner: function (strValue, valueId, tipId) {
        document.getElementById(valueId).value = strValue;
        document.getElementById(tipId).style.display = "none";
    }
}
/**
 * 去除空格
 * @memberOf {TypeName}
 * @return {TypeName}
 */
String.prototype.trim = function () {
    return this.replace(/(^\s*)|(\s*$)/g, "");
};
/**
 * 批量替换
 * @param {Object} pattern
 * @param {Object} str
 * @memberOf {TypeName}
 * @return {TypeName}
 */
String.prototype.replaceAll = function (pattern, str) {
    return this.replace(new RegExp(pattern, "gm"), str);
};
var utils = {
    //邮箱、手机号码、固话号码正则表达式
    emailReg:/^\w+((-\w+)|(\.\w+))*\@[A-Za-z0-9]+((\.|-)[A-Za-z0-9]+)*\.[A-Za-z0-9]+$/,
    telReg: /^([0-9]{3,4}-)?[0-9]{7,8}$/,
    mobileReg: /^((\+?86)|(\(\+86\)))?(13[012356789][0-9]{8}|15[012356789][0-9]{8}|18[02356789][0-9]{8}|147[0-9]{8}|1349[0-9]{7})$/,
    dotcount: 2,
    yyyyMMddhhmmss:'yyyy-MM-dd HH:mm:ss',
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
        var t = new Date(time), tf = function (i) {
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
    }
};

module.exports = utils;
/**
 * Created by tp on 2016/8/15.
 */

var zxmlUtils = require("./../zxmlUtils");
//TEST
zxmlUtils.getXml("../../public/diagram/demo_main.zxml", function (xml) {
    console.log(xml)
})
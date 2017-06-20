/**
 * Created by tp on 2016/7/16.
 */
// var OPAPI = require('opapi');
var opPool = require("./opPool")

function testQuery() {
    opPool.query("select ID,PN,RT,TV,BV,ED,EU from point limit 10", function (error, rows, columns) {
        console.log(error);
        console.log(rows);
        console.log(columns);
    })
}
function testSyncQuery() {
    var data = opPool.syncQuery("select ID,PN,RT,TV,BV,ED,EU from point limit 10");
    console.log(data.rows)
}


function testFind() {
    var names = [ 'W3.UNIT01.POINT01',
        'W3.TEST2.QQQ',
        'W3.TEST2.WWW',
        'W3.TEST3.OP',
        'W3.UNIT01.POINT04',
        'W3.TEST3.QA' ];
    var cols = [ "ID", "AV", "AS", "TM" ];
    var time = new Date().getTime();
    opPool.find("Realtime", names, cols, function (error, rows, columns) {
        console.log(error);
        console.log(rows);
        console.log(columns);
        console.log((new Date().getTime() - time) + " ms");
    });
}


function testUpdate() {
    var cols = [ "ID", "AV" ];
    var rows = new Array();
    for (var i = 0; i < 100; i++) {
        rows.push([ 1024 + i, i + 0.6 ]);
    }
    opPool.update("Realtime", rows, cols, function (error, rows, columns) {
        console.log(error);
        console.log(rows);
        console.log(columns);
        console.log((new Date().getTime() - time) + " ms");
    });
}


function testRemove() {
    var time = new Date().getTime();
    var names = [ "W3.UNIT1.AAA" ];
    opPool.remove("Point", names, function (error, rows, columns) {
        console.log(error);
        console.log(rows);
        console.log(columns);
        console.log((new Date().getTime() - time) + " ms");
    });
}

function testSyncFind() {
    var time = new Date().getTime();
    var names = [ "W3.SYS.LOAD", "W3.SYS.SESSION", "NULL" ];
    var cols = [ "ID", "AV", "AS", "TM" ];
    var data = opPool.syncFind("Realtime", names, cols);
    console.log((new Date().getTime() - time) + " ms");
    setTimeout(testSyncFind, 1000);
}
function testSyncUpdate() {
    var cols = [ "ID", "AV" ];
    var rows = new Array();
    for (var i = 0; i < 100; i++) {
        rows.push([ 1024 + i, i + 0.6 ]);
    }
    var rs = opPool.syncUpdate("Realtime", rows, cols);
    console.log(rs);
}

function testSyncRemove() {
    var time = new Date().getTime();
    var names = [ "W3.UNIT1.AAA" ];
    var rs = opPool.syncRemove("Point", names);
    console.log(rs)
    console.log("remove " + (new Date().getTime() - time) + " ms");
}

try {
    //异步查询示例
    // testQuery();
    testFind();
    // testUpdate();
    // testRemove();

    //同步查询示例
    // testSyncQuery();
    // testSyncFind();
    // testSyncUpdate();
    // testSyncRemove();

} catch (e) {
    console.log(e);
}

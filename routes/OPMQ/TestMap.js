/**
 * Created by tp on 2016/9/21.
 */

// var map = new Map();
console.time("MapTest")
var a = new Object();
for (var i = 0; i < 10000 * 100; i++) {
    // map.set("key" + i, i);
    a = {};
}
console.timeEnd("MapTest")
// console.log(map.get("key55"))
// console.log(obj[55])
/**
 * Created by tp on 2016/9/20.
 */


var cacheDataList = new Array();
var nowDataList = new Array();
for (var i = 0; i < 10000 * 100; i++) {
    cacheDataList[i] = {id: i, as: 0, av: i, tm: i};
    if (i % 23 == 0) {
        nowDataList[i] = {id: i, as: 32768, av: i, tm: 0};
    } else {
        nowDataList[i] = {id: i, as: 0, av: i, tm: i};
    }
}

console.time("Test");
var changeList = new Array();

nowDataList.forEach(function (row, index) {
    var cacheData = cacheDataList[index];
    if (cacheData.tm != row.tm) {
        changeList.push(row)
        // console.log(row)
    }
})
console.timeEnd("Test");
// console.log(changeList)
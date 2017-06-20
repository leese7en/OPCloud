/**
 * Created by TP on 2017/3/30.
 */
var graphElementUtils = require("./graphElementUtils");


var filePath = "test3.zxml";

 filePath = "tt.zxml";

console.time("ZXML");

graphElementUtils.get(filePath, function (diagramData, pointsMap) {
    console.timeEnd("ZXML");
    console.log(JSON.stringify(diagramData));
    console.log(JSON.stringify(pointsMap));
});



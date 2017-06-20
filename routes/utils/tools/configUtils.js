var fs =require('fs');
var filePath = './config/config.json';
var JsonObj=JSON.parse(fs.readFileSync(filePath));
var configUtils = {
    getPointIDNext :function(number){
        if(!number){
            number=1;
        }
        var pointID = JsonObj.pointID;
        JsonObj.pointID = pointID+number;
        this.updatePointIDNext(JsonObj);
        return pointID;
    },
    updatePointIDNext:function(json){
        fs.writeFileSync(filePath,JSON.stringify(json));
    }
}
module.exports = configUtils;



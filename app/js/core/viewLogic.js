angular.module('core.viewLogic', ['firebase', 'myApp.config'])
    .factory('viewLogic', function (config, $q){
        console.log("viewLogicLoaded");
        var viewLogic={
            ruleMatrix: config.viewLogic,
            createIndex:createIndex
        };

        var ruleMatrix=config.viewLogic,
            rowNum=ruleMatrix.length,
            colNum=ruleMatrix[0].length;

        function createIndex(){
            viewLogic["index"]={}; //紀錄規則表中的某modelPath 其值變動所需檢查的部分
            for(var i=0; i<rowNum; i++){
                for(var j=0; j<colNum-1; j++){ //最後一行是條件確認後要變動的位置
                    if(i===0){
                        viewLogic["index"][ruleMatrix[0][j]]=[j];    //第0個元素為該path所在行數
                    } else {
                        if(!!ruleMatrix[i][j]){
                            viewLogic["index"][ruleMatrix[0][j]].push(i)
                        }
                    }
                }
            }
        }
        return viewLogic
    });
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
            viewLogic["index"]={}; //�����W�h�����YmodelPath ����ܰʩһ��ˬd������
            for(var i=0; i<rowNum; i++){
                for(var j=0; j<colNum-1; j++){ //�̫�@��O����T�{��n�ܰʪ���m
                    if(i===0){
                        viewLogic["index"][ruleMatrix[0][j]]=[j];    //��0�Ӥ�������path�Ҧb���
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
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

        function compileRule(){
            var temp={};
            temp.allElement={rowCount:0};
            viewLogic.ruleMatrix=[[]];
            for(var key in config.viewLogic){
                var firstRow=config.viewLogic[key][0];
                temp[key]=[];
                //�ͦ��s���Ĥ@��A��X�Ҧ����l���Ĥ@��A�N�Ĥ@���X�{��element���rowCount���@�C
                // �ðO���C��KEY �l��������m��temp[key] array
                for(var i=0; i<firstRow.length; i++){
                    if(firstRow[i]==="result") break;
                    if(temp.allElement[firstRow[i]]===undefined){
                        viewLogic.ruleMatrix[0][temp.allElement.rowCount]=firstRow[i];
                        temp.allElement[firstRow[i]]=temp.allElement.rowCount;
                        temp[key].push(temp.allElement.rowCount);
                        temp.allElement.rowCount++;
                    } else {
                        temp[key].push(temp.allElement[firstRow[i]]);
                    }
                }
                //�`���ͤ@�C�s���P�_�C�ñN�쥻��key �W�٪�table �̪��P�_�C��������������m
                for(var j=1; j<config.viewLogic[key].length; j++){
                    viewLogic.ruleMatrix.push([]);
                    for(var k=0; k<firstRow.length; k++){
                        viewLogic.ruleMatrix[viewLogic.ruleMatrix.length-1][temp[key][k]]=config.viewLogic[key][j][k]
                    }
                }
            }
        }

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
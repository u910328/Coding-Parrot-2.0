angular.module('core.model', ['firebase', 'myApp.config'])
    .factory('model', function (config, fbutil, $q, snippet, viewLogic) {
        var model={
            update:update,
            updateView:updateView,
            modelObj:ModelObj,
            view:{},
            path:{},
            test:{test1:{test2:{a:"a",b:"b",c:"c",d:"d"}}}
        };

        function ModelObj(modelPath){
            var that=this;
            this.modelPathArr=modelPath.split("|");
            this.pathArr=this.modelPathArr[0].split(".");
            this.val=function(){
                var value={},
                    modelPath="";

                for(var j=0; j<that.pathArr.length; j++){
                    modelPath=modelPath+"['"+that.pathArr[j]+"']"
                }
                for(var i=1; i<that.modelPathArr.length; i++){
                    value[that.modelPathArr[i]]=eval("model"+modelPath)[that.modelPathArr[i]];
                }

                if(JSON.stringify(value)==="{}"){
                    eval("value=model"+modelPath)
                }

                return value
            }
        }

        function checkRow(i, pathCol) {
            var ithRow = viewLogic["ruleMatrix"][i],
                pathRow = viewLogic["ruleMatrix"][0],
                match = true,
                chagedModelObj=new ModelObj(pathRow[pathCol]),
                chagedVal=chagedModelObj.val();
            if (!eval("chagedVal"+ithRow[pathCol])) {   //先檢查改變的以加快檢查速度
                return false;
            }
            for (var j = 0; j < pathRow.length - 1; j++) {
                if (ithRow[j] && j!= pathCol) {
                    var modelObj=new ModelObj(pathRow[j]),
                        val=modelObj.val();
                    if (!eval("val" + ithRow[j])) {
                        match = false;
                        break
                    }
                }
            }
            return match;
        }

//分成兩部分 1.先計算所有變動 preProcessView 2.將變動套用到view上 updateView
        function preProcessView(modelPath){
            var rule=viewLogic["ruleMatrix"],
                colNum=rule[0].length,
                mPath=modelPath.split("|")[0],
                index=viewLogic.index[mPath],
                finalResult={};
            if(index===undefined) return finalResult;
            for(var i=1; i<index.length; i++){            //第0個元素為該path所在行數
                if(checkRow(index[i], index[0])){
                    var resultArr=rule[index[i]][colNum-1].split(";");  //rule 的最後一行看起來像 "showAAA=class1;showBBB=class2"
                    for(var j=0;j<resultArr.length;j++){
                        finalResult[resultArr[j].split("=")[0]]=resultArr[j].split("=")[1]
                    }
                }
            }
            return finalResult
        }

        function updateView(modelPath) {
            var toBeUpdated=preProcessView(modelPath);
            JSON.stringify(preProcessView(modelPath));
            for (var key in toBeUpdated) {
                snippet.evalAssignment([model, key.split(".")], [toBeUpdated[key]]);
            }
        }

        function update(path, value) {
            var pathArr=path.split(".");
            snippet.evalAssignment([model, pathArr], [value]);
            updateView(path)
        }

        return model
    });

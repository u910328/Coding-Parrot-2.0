angular.module('core.snippet', ['firebase', 'myApp.config'])
    .factory('snippet', function (config, $q) {

        function getUnionOfObj(objArr){
            var result=objArr[0];
            if(objArr.length=1) return result;
            for(var i=1;i<objArr.length;i++){
                for(var key in objArr[i]){
                    result[key]=objArr[i][key];
                }
            }
            return result
        }

        function evalAssignment(lhsArr, rhsArr){
            var lhsPath="",
                lhs=lhsArr[0],
                rhs=rhsArr[0];

            if(lhsArr[1]!=undefined){
                for(var i=0; i<lhsArr[1].length; i++){
                    lhsPath=lhsPath+"['"+lhsArr[1][i]+"']";
                    if((i+1<lhsArr[1].length)&&typeof lhs[lhsArr[1][i]]!="object"){
                        eval("lhsArr[0]"+lhsPath+"={}")
                    } else {
                        lhs=lhs[lhsArr[1][i]];
                    }
                }
            }
            if(!rhsArr) return eval("lhsArr[0]"+lhsPath);
            if(typeof rhsArr==='function'){
                eval("rhs=rhsArr(lhsArr[0]"+lhsPath+")");
            } else {
                if(rhsArr[1]!=undefined){
                    for(var j=0; j<rhsArr[1].length; j++){
                        if(rhs[rhsArr[1][j]]===undefined){
                            rhs=undefined;
                            break;
                        }
                        rhs=rhs[rhsArr[1][j]];
                    }
                }
            }
            console.log("lhsArr[0]"+lhsPath);
            eval("lhsArr[0]"+lhsPath+"=rhs");




            //console.log(lhsArr[0]); TODO:reomove debug code here
            //console.log("lhsArr[0]"+lhsPath+"="+rhs);
            //console.log(eval("lhsArr[0]"+lhsPath));

        }

        function checkIfPropertyExist(arr){
            var obj=arr[0],
                pathArr=arr[1],
                isExist=true;
            for(var i=0; i<pathArr.length; i++){
                if(obj[pathArr[i]]===undefined||obj[pathArr[i]]===null) {
                    isExist=false;
                    break;
                }
                obj=obj[pathArr[i]]
            }
            return isExist
        }

        function getRouteKey(locationPath, routeParam){
            var path=locationPath;
            for(var key in routeParam){
                if(key==='key') continue;
                var replacement=routeParam[key].split('/')[1]? ':'+key+'*':':'+key;
                path=path.replace(routeParam[key], replacement);
            }
            return path
        }


        function getRule(structure, pathArr){
            var omniKey={},
                currentStructure=structure,
                checkStructure=true;

            //collect the real value for keys like $uid, $pjId.
            function findOmniKey(i){
                if(currentStructure[pathArr[i]]){
                    currentStructure=currentStructure[pathArr[i]]
                } else {
                    var keyExist=false;
                    for(var key in currentStructure){
                        if(key.charAt(0)=="$"){
                            omniKey[key]=pathArr[i];
                            currentStructure=currentStructure[key];
                            keyExist=true;
                            break;
                        }
                    }
                    if(!keyExist){
                        checkStructure=false;
                        console.log("no rules for ["+pathArr.toString()+"]");
                    }
                }
            }

            for(var i=0; i<pathArr.length; i++){
                findOmniKey(i);
                if(!checkStructure) break
            }

            if(!checkStructure) return undefined;

            var contentString=JSON.stringify(currentStructure);
            for(var key in omniKey){
                contentString=contentString.replace(eval("/\\"+key+"/g"), omniKey[key])
            }

            console.log(JSON.stringify(omniKey));

            return JSON.parse(contentString);
        }

        function waitUntil(conditionNum, onComplete, argArr){
            var that=this;
            this.satisfiedCondition=0;
            this.resolve=function(){
                that.satisfiedCondition++;
                if(that.satisfiedCondition===conditionNum){
                    onComplete.apply(null, argArr)
                }
            };
            if(conditionNum===0){
                onComplete.apply(null, argArr)
            }
        }

        return {
            getRule:getRule,
            getRouteKey:getRouteKey,
            evalAssignment:evalAssignment,
            checkIfPropertyExist:checkIfPropertyExist,
            waitUntil:waitUntil,
            getUnionOfObj:getUnionOfObj
        }
    });
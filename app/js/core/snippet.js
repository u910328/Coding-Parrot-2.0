angular.module('core.snippet', ['firebase', 'myApp.config'])
    .factory('snippet', function (config, $q) {

        function evalAssignment(lhsArr, rhsArr){
            var lhsPath="",
                lhs=lhsArr[0],
                rhs=rhsArr[0];

            if(lhsArr[1]!=undefined){
                for(var i=0; i<lhsArr[1].length; i++){
                    lhsPath=lhsPath+"['"+lhsArr[1][i]+"']";
                    if(lhs[lhsArr[1][i]]===undefined){
                        eval("lhsArr[0]"+lhsPath+"={}")
                    } else {
                        lhs=lhs[lhsArr[1][i]];
                    }
                }
            }

            if(rhsArr[1]!=undefined){
                for(var j=0; j<rhsArr[1].length; j++){
                    if(rhs[rhsArr[1][j]]===undefined){
                        rhs=undefined;
                        break;
                    }
                    rhs=rhs[rhsArr[1][j]];
                }
            }



            //console.log(lhsArr[0]); TODO:reomove debug code here
            //console.log("lhsArr[0]"+lhsPath+"="+rhs);
            //console.log(eval("lhsArr[0]"+lhsPath));
            eval("lhsArr[0]"+lhsPath+"=rhs")
        }

        function checkIfPropertyExist(arr){
            var obj=arr[0],
                isExist=true;
            for(var i=1; i<arr.length; i++){
                if(obj[arr[i]]===undefined) {
                    isExist=false;
                    break;
                }
                obj=obj[arr[i]]
            }
            return isExist
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
            evalAssignment:evalAssignment,
            checkIfPropertyExist:checkIfPropertyExist,
            waitUntil:waitUntil
        }
    });
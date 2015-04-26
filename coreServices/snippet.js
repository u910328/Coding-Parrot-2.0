angular.module('core.snippet', ['firebase', 'myApp.config'])
    .factory('snippet', function (config, $q) {

        function evalAssignment(lhsArr, rhsArr){
            var lhs=lhsArr[0],
                rhs=rhsArr[0];

            for(var j=1; j<rhsArr[1].length; j++){
                rhs=rhs[rhsArr[1][j]];
            }

            for(var i=1; i<lhsArr[1].length; i++){
                lhs=lhs[lhsArr[1][i]];
            }
            lhs=rhs
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
                contentString=contentString.replace(eval("/"+key+"/g"), omniKey[key])
            }

            return eval(contentString);
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

        function checkThenCreate(targetObj, pathArr, value){                  //TODO:測試
            var currentObjString="";

            for(var i=0; i<pathArr.length; i++){
                currentObjString=currentObjString+"["+pathArr[i]+"]";

                //create {} for undefined
                if(eval("targetObj"+currentObjString+"["+pathArr[i]+"]")==undefined){
                    eval("targetObj"+currentObjString+"["+pathArr[i]+"]={}")
                }
                currentObjString=currentObjString+"["+pathArr[i]+"]";

                if(i==(pathArr.length-1)){
                    switch(value){
                        case null:
                            eval("delete targetObj"+currentObjString);
                            break;
                        default:
                            eval("targetObj"+currentObjString+"=value||true");
                            break;
                    }
                }
            }
        }

        return {
            checkThenCreate:checkThenCreate,
            getRule:getRule,
            evalAssignment:evalAssignment
        }
    });
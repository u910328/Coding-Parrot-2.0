angular.module('core', ['firebase', 'myApp.config'])
    .factory('snippet', function (config, $q, model) {
        function FbObj(refUrl){
            var that=this;
            this.dbName=model.db[refUrl.split("@")[1]].dbName;
            this.dbUrl="https://"+dbName+".firebaseio.com/";
            this.path=refUrl.split("@")[0];
            this.url= this.dbUrl+this.path;
            this.dbType=refUrl.split("@")[1];
            this.t=(new Date).getTime().toString();
            this.omniKey={};
            this.ref=function(){
                var ref= new Firebase(that.dbUrl);
                var pathArr=refUrl.split("@")[0].split("/");
                for(var i=0; i<pathArr.length; i++){
                    if(pathArr[i].charAt(1)==="$"){
                        ref=ref.push();
                        that.omniKey[pathArr[i]]=ref.key();
                    } else {
                        ref=ref.child(pathArr[i]);
                    }
                }
                that.url=ref.toString();
                that.path=that.url.replace(ref.dbUrl,"");
                return ref
            }
        }

        function replaceOmniKey(typeAndTime, omniKey){
            for(var i=0; i<argArr.length; i++){
                var arg=model.action[typeAndTime]["updateFb"][i];
                for(var key in omniKey){
                    model.action[typeAndTime]["updateFb"][i][0]=arg[0].replace(key, omniKey[key]);
                }
            }
        }

        function evalAssignment(lhsArr, RHS){
            var lhs=lhsArr[0],
                rhs="RHS";

            if((typeof RHS=="object") && RHS.length!=undefined){
                rhs=RHS[0];
                for(var j=1; j<lhsArr.length; j++){
                    rhs=rhs+"["+lhsArr[j]+"]";
                }
            }
            for(var i=1; i<lhsArr.length; i++){
                lhs=lhs+"["+lhsArr[i]+"]";
            }
            eval(lhs+"="+rhs);
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
            FbObj:FbObj,
            checkThenCreate:checkThenCreate,
            getRule:getRule,
            evalAssignment:evalAssignment,
            replaceOmniKey:replaceOmniKey
        }
    });
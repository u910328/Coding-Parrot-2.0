angular.module('core', ['firebase', 'myApp.config'])
    .factory('snippet', function (config, $q, data) {
        function FbObj(refUrl){
            this.dbName=data.db[refUrl.split("@")[1]].dbName;
            this.dbUrl="https://"+dbName+".firebaseio.com/";
            this.path=refUrl.split("@")[0];
            this.url= this.dbUrl+this.path;
            this.t=(new Date).getTime().toString;
            this.dbType=refUrl.split("@")[1];
        }
        function checkThenCreate(targetObj, pathArr, value){                  //TODO:測試
            var currentObjString="";
            for(var i=0; i<pathArr.length; i++){
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
            FbObj:FbObj
        }
    });
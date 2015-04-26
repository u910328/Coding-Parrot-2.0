
angular.module('core', ['firebase', 'myApp.config'])
    .factory('fbToData', function (config, fbutil, $q, cases, data, snippets) {

        return function(scope, dataPath, query, config){
            var pathArr = dataPath.split("."),
                path = "",
                recoveredPath = "",
                omniKey = {};

            //analyzing data at this path and replace keys like $UID
            for(var i= 0; i<pathArr.length; i++) {
                if(eval("data"+recoveredPath+"."+pathArr[i])){
                    recoveredPath = recoveredPath+"."+pathArr[i];
                } else {
                    var isOmniKeyExist=false;
                    for(var key in eval("data"+recoveredPath)){
                        if(key.charAt(0)=="$"){
                            recoveredPath = recoveredPath+"."+key;
                            omniKey[key]= pathArr[i];
                            isOmniKeyExist=true;
                        }
                    }
                    if(!isOmniKeyExist) {
                        console.log("Error: data"+recoveredPath+"."+pathArr[i]+" is undefined.")
                    }
                }
                path = path+"."+pathArr[i];
                if(eval("data.value"+path)==undefined) {
                    eval("data.value"+path+"={}")
                }
            }

            eval("scope=data.value"+path);

            var contentInString = JSON.stringify(eval("data"+recoveredPath));
            for(var key in omniKey) {
                contentInString = contentInString.replace(key, omniKey[key])
            }
            var contentAtPath = eval(contentInString);

            //get data from firebase
            var dbType = contentAtPath.fbPath.split("@")[1]||"main";
            var t = (new Date).getTime().toString;
            var fbUrl = "http://"+data.db[dbType].dbName+".firebaseio.com/";
            var fbPath = contentAtPath.fbPath.split("@")[0]|| path.slice(1).replace(/\./g,"/");
            var ref = new Firebase(fbUrl+fbPath);
            var queryRef = eval("ref."+query);
            var evalString = "queryRef.once('value', function(snap){data.value"+path+"=snap.val(); snippets.goOffline(dbType, t)}, cancelCallback)";
            if(config.sync||dbType=="D") {evalString.replace("once", "on");evalString.replace("snippets.goOffline(dbType, t)","")}

            function cancelCallback(err){
                console.log("Fail to map "+contentAtPath.fbPath+": "+err.code);
                snippets.goOffline(dbType, t);
            }

            snippets.goOnline(dbType);
            eval(evalString)
        }
    });
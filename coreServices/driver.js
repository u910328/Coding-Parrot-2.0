angular.module('core', ['firebase', 'myApp.config'])
    .factory('driver', function (config, $q, data, action, localFb, model, snippet) {
        model.action={};             //起始

        function compiledAction(type, config){
            var actionString=JSON.stringify(action[type]);
            for(var key in config){
                if(typeof config[key]!="string") continue;
                actionString=actionString.replace(eval("/"+key+"/g"), config[key])
            }
            var compiled=eval(actionString);
            for(var key1 in action[type]){
                for(var key2 in action[type][key1]){
                    if(!compiled[key1][key2]){
                        compiled[key1][key2]=action[type][key1][key2];
                    }
                }
            }
            return compiled
        }

        function addActivity(info) {
            var def = $q.defer();
            var _case = action[info.type];
            var actvt={};
            var rootPath = _case[info.type].rootPath||"data"+".";
            /*TODO: 將rootPath方法套用到下面所有的函數*/
            var actRef= new Firebase("http://"+data.db.A+".com/users/"+data.myUid+"/"+data.myToken+"/activities/");
            var onComplete = function(error) {
                if (error) {
                    console.log('Adding activity failed');
                } else {
                    console.log('Adding activity succeeded');
                    def.resolve(info)
                }
                /*TODO: 刪掉原本位置的通知*/
            };

            var properties = _case.activity.split("|");
            var dirString = rootPath+properties[0];
            var dir = eval(dirString);

            for(var i=1; i<properties.length; i++) {
                actvt[key]=dir[key];
            }
            actRef.push(actvt, onComplete);

            return def.promise
        }

        var buildInFn={
            modelToFb:function(mdToFbArr, typeAndTime){
                var def=$q.defer(),
                    updateArr=model.action[typeAndTime]["updateFb"]||[];
                for(var i=0; i<mdToFbArr.length; i++){
                    var arr=mdToFbArr[i].split(":"),
                        modelObj=new model.modelObj(arr[0]),
                        updateType=arr[1],
                        refUrl=arr[2],
                        value=modelObj.val();

                    updateArr.push([refUrl, modelObj.path, value, updateType]);
                }
                model.action[typeAndTime]["updateFb"]=updateArrf;
                def.resolve();
                return def.promise
            },
            extraFn:function(fn, typeAndTime){
                switch(typeof fn){
                    case "function":
                        var FN=fn.apply(null, [model, localFb, $q, typeAndTime]);
                        return FN.then!=undefined? FN: function(){
                            var def=$q.defer();
                            def.resolve();
                            return def.promise;
                        };
                        break;
                    case "string":
                        eval("var FN=function(model, localFb, $q, typeAndTime){"+fn+"}");
                        var executed= FN.apply(null, [model, localFb, $q, typeAndTime]);

                        return executed.then!=undefined? FN:function(){
                            var def=$q.defer();
                            def.resolve();
                            return def.promise;
                        };
                        break;
                }
            },
            delay:function(countdown){
                var def=$q.defer();
                setTimeout(function(){def.resolve()}, countdown);
                return def.promise
            },
            log:function(extraValue, typeAndTime){
                var def=$q.defer(),
                    updateArr=model.action[typeAndTime]["updateFb"]||[],
                    type=typeAndTime.split(":")[0],
                    refUrl=config.logRefUrl.replace(/$uid/g, model.uid),
                    modelPath=config.logModelPath.replace(/$uid/g, model.uid),
                    value={type:type, time:Firebase.ServerValue.TIMESTAMP};
                for(var key in extraValue){
                    var modelObj=new model.modelObj(extraValue[key]);
                    value[key]=modelObj.val();
                }
                updateArr.push([refUrl, modelPath, value, "update"]);
                return def.promise
            }
        };

        function transFnName(fnName){
            return (fnName.search("extraFn")!=-1? "extraFn": fnName)
        }

        function process(compiledType, typeAndTime, preOrPost, extraArg){
            var def=$q.defer(),
                fnchain="";
            if(preOrPost==="pre") model.action[typeAndTime]={};
            if(compiledType[preOrPost+"Process"]){
                for(var key in compiledType[preOrPost+"Process"]){
                    var fn="buildInFn."+transFnName(key)+"("+compiledType[preOrPost+"Process"][key]+","+typeAndTime+", extraArg)";
                    fnchain= fnchain===""? fn: fnchain+".then(function(){return "+fn+"}"; //TODO: 檢查這種寫法會不會出問題
                }
            }
            var finishing= preOrPost==="post"? "delete model.action["+typeAndTime+"];":"";
            fnchain= fnchain===""? finishing+"def.resolve()": fnchain+".then(function(){"+finishing+"def.resolve()})";
            eval(fnchain);
            return def.promise
        }

        function verifyUpdateData(typeAndTime){
            var def=$q.defer(),
                type=typeAndTime.split(":")[0];
                if(action[type]["verify"]===true && !!model.action[typeAndTime]["updateFb"]){
                    var tobeVerifiedArr= model.action[typeAndTime]["updateFb"],
                        tobeVerified={typeAndTime: typeAndTime, data: tobeVerifiedArr, time: Firebase.ServerValue.TIMESTAMP},
                        srvVerifyRefUrl=config.srvVerifyRefUrl.replace(/$uid/g, model.uid),
                        srvAnsRefUrl=config.srvAnsRefUrl.replace(/$uid/g, model.uid);
                    localFb.update(srvVerifyRefUrl, "", tobeVerified);           //TODO: config加入SERVER中的VERIFY的路徑
                    var fbObj= new localFb.FbObj(srvAnsRefUrl),
                        srvAnsRef=fbObj.ref();
                    srvAnsRef.child(typeAndTime).once('value', function(snap){
                        if(snap.val()==="valid"){
                            def.resolve()
                        } else {
                            var reason="Error: invalid data in action:"+typeAndTime;
                            def.reject(reason)
                        }
                    }, function(err){
                        var reason ="Error: cannot validate the data in action:"+typeAndTime+" ("+err.code+")";
                        def.reject(reason)
                    })
                } else {
                    def.resolve()
                }
            return def.promise
        }

        function parallelUpdateFb(typeAndTime){
            var def=$q.defer(),
                arr=model.action[typeAndTime]["updateFb"]? model.action[typeAndTime]["updateFb"]:[],
                waitUntil=new snippet.waitUntil(arr.length, function(){def.resolve()});
            for(var i=0; i<arr.length; i++){
                var refUrl=arr[i][0],
                    modelPath=arr[i][1],
                    value=arr[i][2],
                    updateType=arr[i][3];
                localFb[updateType](refUrl, "", value, function(){waitUntil.resolve()}, typeAndTime);
            }
            return def.promise
        }

        function serialUpdateFb(typeAndTime){
            var def=$q.defer(),
                argArr=model.action[typeAndTime]["updateFb"]? model.action[typeAndTime]["updateFb"]:[],
                fnchain="";

            function fb(i){
                var arr=model.action[typeAndTime]["updateFb"],
                    refUrl=arr[i][0],
                    modelPath=arr[i][1],
                    value=arr[i][2],
                    updateType=arr[i][3];
                return localFb[updateType](refUrl, "", value, "ROK_"+typeAndTime);            //ROK= replaceOmniKey
            }

            for(var i=0; i<argArr.length; i++){
                var fn="fb("+i+")";
                fnchain= fnchain===""? fn: fnchain+".then(function(){return "+fn+"})"
            }
            fnchain= fnchain===""? "def.resolve()":fnchain+".then(function(){def.resolve()})";
            eval(fnchain);
            return def.promise
        }

        return function(type, omniKey, extraArg){
            var t=(new Date).getTime().toString(),
                typeAndTime=type+":"+ t,
                compiledType=compiledAction(type, omniKey),
                updateFb=parallelUpdateFb;

            if(action[type]["updateFb"]==="serial"){
                updateFb=serialUpdateFb;
            }

            process(compiledType, typeAndTime, "pre", extraArg)
                .then(function(){return verifyUpdateData(typeAndTime)})
                .then(function(){return updateFb(typeAndTime)})
                .then(function(){return process(compiledType, typeAndTime, "post", extraArg)});
        }
    });
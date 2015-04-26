angular.module('core.driver', ['firebase', 'myApp.config'])
    .factory('driver', function (config, $q, action, localFb, model, snippet) {

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
            modelToFb:function(mdToFbArr, actionObj){
                var def=$q.defer();
                for(var i=0; i<mdToFbArr.length; i++){
                    var arr=mdToFbArr[i].split(":"),
                        modelObj=new model.ModelObj(arr[0]),
                        updateType=arr[1],
                        refUrl=arr[2],
                        value=modelObj.val();

                    actionObj["updateFbArr"].push([refUrl, modelObj.path, value, updateType]);
                }
                def.resolve();
                return def.promise
            },
            extraFn:function(FnString, actionObj){
                if(FnString.search('function')===0) {
                    eval("var FN="+FnString);
                } else {
                    eval("var FN=function(model, localFb, $q, actionObj){"+FnString+"}");
                }
                var executed=FN.apply(null, [model, localFb, $q, actionObj]);
                if((typeof executed==='object')&&executed.then!=undefined) return executed;

                var def=$q.defer();
                def.resolve();
                return def.promise;
            },
            delay:function(countdown){
                var def=$q.defer();
                setTimeout(function(){def.resolve()}, countdown);
                return def.promise
            },
            log:function(extraValue, actionObj){
                var def=$q.defer(),
                    refUrl=actionObj.paths.logRefUrl,
                    modelPath=actionObj.paths.logModelPath,
                    value={type:actionObj.type, time:Firebase.ServerValue.TIMESTAMP};
                for(var key in extraValue){
                    var modelObj=new model.modelObj(extraValue[key]);
                    value[key]=modelObj.val();
                }
                if(refUrl) actionObj.updateFbArr.push([refUrl, modelPath, value, "update"]);
                return def.promise
            }
        };

        function transFnName(fnName){
            return (fnName.search("extraFn")!=-1? "extraFn": fnName)
        }

        function process(actionObj, preOrPost, extraArg){
            var def=$q.defer(),
                fnchain="",
                args=[];
            if(actionObj.compiled[preOrPost+"Process"]){
                var i=0;
                for(var key in actionObj.compiled[preOrPost+"Process"]){
                    args[i]=actionObj.compiled[preOrPost+"Process"][key];
                    var fn="buildInFn."+transFnName(key)+"(args["+i+"], actionObj, extraArg)";
                    fnchain= fnchain===''? fn:fnchain+".then(function(){return "+fn+"})";
                    i++;
                }
            }
            fnchain= fnchain===""? "def.resolve()": fnchain+".then(function(){def.resolve()})";
            //console.log(fnchain);
            eval(fnchain);
            return def.promise
        }

        function verifyUpdateData(actionObj){
            var def=$q.defer();
                if(actionObj.compiled["verify"]===true && !!actionObj["updateFb"]){
                    actionObj.timeStamp=(new Date).getTime().toString();
                    var tobeVerifiedArr= actionObj["updateFb"],
                        tobeVerified={data: tobeVerifiedArr, time: Firebase.ServerValue.TIMESTAMP},
                        srvVerifyRefUrl=config.srvVerifyRefUrl.replace(/$uid/g, model.uid),
                        srvAnsRefUrl=config.srvAnsRefUrl.replace(/$uid/g, model.uid);
                    localFb.update(srvVerifyRefUrl, "", tobeVerified);           //TODO: config加入SERVER中的VERIFY的路徑
                    var fbObj= new localFb.FbObj(srvAnsRefUrl),
                        srvAnsRef=fbObj.ref();
                    var srvVerifyUrlArr=config.srvVerifyRefUrl.split('/'),
                        lastKey=srvVerifyUrlArr[srvVerifyUrlArr.length-1];
                    srvAnsRef.child(actionObj.lastParam[lastKey]).once('value', function(snap){
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

        function parallelUpdateFb(actionObj){
            var def=$q.defer(),
                arr=actionObj["updateFbArr"]? actionObj["updateFbArr"]:[],
                waitUntil=new snippet.waitUntil(arr.length, function(){def.resolve()});
            for(var i=0; i<arr.length; i++){
                var refUrl=arr[i][0],
                    value=arr[i][2],
                    updateType=arr[i][3];
                localFb[updateType](refUrl, "", value, function(){waitUntil.resolve()}, actionObj);
            }
            return def.promise
        }

        //function serialUpdateFb(typeAndTime){
        //    var def=$q.defer(),
        //        argArr=model.action[typeAndTime]["updateFb"]? model.action[typeAndTime]["updateFb"]:[],
        //        fnchain="";
        //
        //    function fb(i){
        //        var arr=model.action[typeAndTime]["updateFb"],
        //            refUrl=arr[i][0],
        //            modelPath=arr[i][1],
        //            value=arr[i][2],
        //            updateType=arr[i][3];
        //        return localFb[updateType](refUrl, "", value, "ROK_"+typeAndTime);            //ROK= replaceOmniKey
        //    }
        //
        //    for(var i=0; i<argArr.length; i++){
        //        var fn="fb("+i+")";
        //        fnchain= fnchain===""? fn: fnchain+".then(function(){return "+fn+"})"
        //    }
        //    fnchain= fnchain===""? "def.resolve()":fnchain+".then(function(){def.resolve()})";
        //    eval(fnchain);
        //    return def.promise
        //}

        return function(type, params, extraArg){
            var actionObj=new snippet.ReplaceableObj();
            var def=$q.defer();
            actionObj.type=type;
            actionObj.compiled=action[type];
            actionObj.replace('compiled', params);
            actionObj.updateFbArr=[];
            actionObj.paths=config.paths;
            actionObj.replace('paths', model.params);

            if(actionObj.compiled["updateFb"]==="serial"){
                updateFb=serialUpdateFb;
            }

            process(actionObj, "pre", extraArg)
                .then(function(){return verifyUpdateData(actionObj)})
                .then(function(){return parallelUpdateFb(actionObj)})
                .then(function(){return process(actionObj, "post", extraArg)})
                .then(function(){def.resolve()});
            return def.promise
        }
    });
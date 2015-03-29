angular.module('core', ['firebase', 'myApp.config'])
    .factory('driver', function (config, $q, data, action, localFb, model) {
        model.action={};             //起始
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
                var updateArr=[];
                for(var i=0; i<mdToFbArr.length; i++){
                    var arr=mdToFbArr[i].split(":"),
                        modelPath=arr[0],                          //TODO: modelPath也能replace omnikey
                        updateType=arr[1],
                        value=snippet.value(model, modelPath),    //TODO: 完成這個snippet
                        refUrl=arr[2];
                    updateArr.push([refUrl, modelPath, value, updateType]);
                }
                model.action[typeAndTime]["updateFb"]=updateArr
            },
            newActivity:function(){},
            extraFn:function(fn, typeAndTime){
                switch(typeof fn){
                    case "function":
                        var FN=fn;
                        return !!FN.then? FN.apply(null, model, localFb, $q, typeAndTime): function(){    //TODO:確認可以用此法判斷是否包含defer
                            var def=$q.defer();
                            if(FN) FN.apply(null, model, localFb, $q, typeAndTime);
                            def.resolve();
                            return def.promise;
                        };
                        break;
                    case "string":
                        eval("var FN=function(model, localFb, $q, typeAndTime){"+fn+"}");
                        if(!FN.then){
                            return function(){
                                var def=$q.defer();
                                FN.apply(null, model, localFb, $q, typeAndTime);
                                def.resolve();
                                return def.promise;
                            }
                        } else {
                            return FN.apply(null, model, localFb, $q, typeAndTime)
                        }
                        break;
                }
            }
        };


        function processModel(typeAndTime, preOrPost){
            var def=$q.defer(),
                fnchain="",
                type=typeAndTime.split(":")[0];

            if(action[type][preOrPost+"Model"]){
                for(var key in action[type][preOrPost+"Model"]){
                    var fn="buildInFn."+key+"("+action[type][preOrPost+"Model"][key]+","+typeAndTime+")";
                    fnchain= fnchain===""? fn: fnchain+".then(function(){return "+fn+"}"; //TODO: 檢查這種寫法會不會出問題
                }
            }
            var finishing=preOrPost==="post"? "delete model.action["+typeAndTime+"];":"";
            fnchain= fnchain===""? finishing+"def.resolve()": fnchain+".then(function(){"+finishing+"def.resolve()})";
            eval(fnchain);
            return def.promise
        }

        function updateFb(typeAndTime){
            var def=$q.defer(),
                argArr=model.action[typeAndTime]["updateFb"]? model.action[typeAndTime]["updateFb"]:[],
                fnchain="";

            function fb(i){
                var arr=model.action[typeAndTime]["updateFb"],
                    refUrl=arr[i][0],
                    modelPath=arr[i][1],
                    value=arr[i][2],
                    updateType=arr[i][3];
                return localFb[updateType](refUrl, modelPath, value, "ROK_"+typeAndTime)
            }

            for(var i=0; i<argArr.length; i++){
                var fn="fb("+i+")";
                fnchain= fnchain===""? fn: fnchain+".then(function(){return "+fn+"})"
            }
            fnchain= fnchain===""? "def.resolve()":fnchain+".then(function(){def.resolve()})";
            eval(fnchain);
            return def.promise
        }

        return function(type, extraArg){
            var t=(new Date).getTime().toString();
            function extraFn(preOrPost, typeAndTime){
                return !!action[type][preOrPost+"Model"]["extraFn"].then? action[type][preOrPost+"Model"]["extraFn"].apply(null, extraArg, typeAndTime): function(){    //TODO:確認可以用此法判斷是否包含defer
                    var def=$q.defer();
                    if(action[type][preOrPost+"Model"]["extraFn"]) action[type][preOrPost+"Model"]["extraFn"].apply(null, extraArg, typeAndTime);
                    def.resolve();
                    return def.promise();
                };
            }
            processModel(type+":"+t, "pre")
                .then(function(){return updateFb(type+":"+t)})
                .then(function(){return processModel(type+":"+t, "post")});
        }
    });
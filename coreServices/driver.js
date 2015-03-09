angular.module('core', ['firebase', 'myApp.config'])
    .factory('driver', function (config, $q, data, action, paths, fbIO) {
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

        function processData(info) {
            var def = $q.defer();
            eval(action[info.type].processData);
            def.resolve(info);
            return def.promise;
        }

        function updateFB(info) {
            var def = $q.defer();
            function collectData(string){
                var data_update = {};
                var dataPaths = string.split(",")[2].split("|");
                var dataRootPath = eval("data."+dataPaths[0]);
                for(var j=1; j<dataPaths.length;j++){
                    var key = dataPaths[j];
                    data_update[key] = dataRootPath[key];
                }
                return data_update
            }

            function batchUpdate(array){
                var def1=$q.defer();
                for(var i=0; i<array.length; i++) {
                    var paths = array[i].split(",");
                    var path = eval("paths."+info.type+"."+paths[0]);
                    path = path.replace("$pushKey", info.$pushKey);
                    var updateDb = array[i].split(",")[1];
                    var ref = new Firebase("http://"+updateDb+".firebaseio.com/"+path);
                    ref.update(collectData(array[i]), function(){def1.resolve()});
                }
                return def1.promise
            }

            function push(){
                var def2=$q.defer();
                var pushPaths = action[info.type].updateFB.push||false;
                if (!pushPaths) {def2.resolve()} else {
                    var pushDb = pushPaths.split(",")[1];
                    var pushPath = eval("paths."+info.type+"."+pushPaths.split(",")[0]);
                    var ref = new Firebase("http://"+pushDb+".firebaseio.com/"+pushPath).push();
                    info.$pushKey = ref.name();
                    ref.set(collectData(pushPaths), function(){def2.resolve()});
                }
                return def2.promise
            }
            push().then(function(){batchUpdate(action[info.type].updateFB.update)}).then(function(){def.resolve()});
            return def.promise
        }

        function updateData() {
            for(var i=0; i<action[info.type].updateData.length; i++){
                eval("data."+action[info.type].updateData[i])
            }
        }

        return function(type, info){
            info.type=type;
            addActivity(info)
                .then(processData)
                .then(function(info2){
                    if(info2.responseRef) {
                        var ref = new Firebase(info2.responseRef);
                        ref.on("value", function(snap){
                            if(snap.val().valid){
                                updateData(info2);
                                ref.off()
                            } else {console.log("warning")} /* TODO: 做一個警告系統以提示這個動作未通過BE的檢驗*/

                        });
                        updateFB(info2);
                    } else {
                        updateFB(info2).then(updateData(info2))
                    }
                })
        }
    });
angular.module('core', ['firebase', 'myApp.config'])
    .factory('fbIO', function (config, fbutil, $q, data) {
        function goOfflineIfLast(onlineArr, t, dbUrl){
            if(onlineArr.length==1) {
                Firebase.goOffline(dbUrl);
            }
            setTimeout(function(){
                onlineArr.slice(onlineArr.indexOf(t),1);
            },0);
        }
        function load(refUrl, dataPath, query) {
            //refUrl:path@dbName; Ex: users/activities@A
            var def = $q.defer();
            var dbName = data.db[refUrl.split("@")[1]].dbName;
            var dbUrl = "http://"+dbName+".firebaseio.com/";
            var path = refUrl.split("@")[0];
            var ref = new Firebase(dbUrl+path);
            var queryRef = query? eval("ref."+query): ref;
            var t = (new Date).getTime().toString;
            var onlineArr = data.db[dbType].online;

            if(onlineArr.length==0){Firebase.goOnline(dbUrl)}
            onlineArr.push(t);

            queryRef.once("value", function(snap){
                //TODO: 做一個函數(在util 服務底下)使不存在的data子屬性能自動產生
                //TODO: 做一個可用orderByKey的map
                eval("data."+dataPath+"=snap.val()");
                goOfflineIfLast(onlineArr, t, dbUrl);
                def.resolve(snap.val())
            },function(err){
                console.log("Fail to map "+refUrl+"to "+dataPath+": "+err.code);
                goOfflineIfLast(onlineArr, t, dbUrl);
                def.resolv(err)
            });
            return def.promise
        }

        function update(dbType, path, value, onCompleteFn){
            var dbUrl = "http://"+data.db[dbType].dbName+".firebaseio.com/";
            var ref = new Firebase(dbUrl+path);
            var t = (new Date).getTime().toString;
            var onlineArr = data.db[dbType].online;

            if(onlineArr.length==0){Firebase.goOnline(dbUrl)}
            onlineArr.push(t);

            ref.update(value, function(error){
                if (error) {
                    console.log("Update failed: "+refUrl);
                } else {
                    if(config.debug){console.log("Update success: "+refUrl)}
                    onCompleteFn();
                }
                goOfflineIfLast(onlineArr, t, dbUrl);
            })
        }

        function push(dbType, path, value, onCompleteFn){
            var dbUrl = "http://"+data.db[dbType].dbName+".firebaseio.com/";
            var ref = new Firebase(dbUrl+path);
            var t = (new Date).getTime().toString;
            var onlineArr = data.db[dbType].online;

            if(onlineArr.length==0){Firebase.goOnline(dbUrl)}
            onlineArr.push(t);

            if(value) {
                ref.push(value, function(error){
                    if (error) {
                        console.log("Update failed: "+refUrl);
                    } else {
                        if(config.debug){console.log("Update success: "+refUrl)}
                        onCompleteFn();
                        if(onlineArr.length==1) {
                            Firebase.goOffline(dbUrl);
                        }
                        setTimeout(function(){
                            onlineArr.slice(onlineArr.indexOf(t),1);
                        },0);
                        /*TODO: 檢驗是否跟其他的讀寫操作衝突*/
                    }
                })
            } else {
                return ref.push()
            }
        }
        function set(dbType, path, value, onCompleteFn){
            var dbUrl = "http://"+data.db[dbType].dbName+".firebaseio.com/";
            var ref = new Firebase(dbUrl+path);
            var t = (new Date).getTime().toString;
            var onlineArr = data.db[dbType].online;

            if(onlineArr.length==0){Firebase.goOnline(dbUrl)}
            onlineArr.push(t);

            ref.set(value, function(error){
                if (error) {
                    console.log("Update failed: "+refUrl);
                } else {
                    if(config.debug){console.log("Update success: "+refUrl)}
                    onCompleteFn();
                    if(onlineArr.length==1) {
                        Firebase.goOffline(dbUrl);
                    }
                    setTimeout(function(){
                        onlineArr.slice(onlineArr.indexOf(t),1);
                    },0);
                }
            })
        }
    });
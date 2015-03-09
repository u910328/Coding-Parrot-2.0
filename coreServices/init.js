angular.module('core', ['firebase', 'myApp.config'])
    .factory('init', function (config, $q, data, util) {

        function mapFbToData(refUrl, dataPath) {
            //refUrl Ex: users/token@A
            var def = $q.defer();
            var dbName = data.db[refUrl.split("@")[1]].dbName;
            var path = refUrl.split("@")[0];
            var ref = new Firebase("http://"+dbName+".firebaseio.com/"+path);
            ref.once("value", function(snap){
                //TODO: 做一個函數(在util 服務底下)使不存在的data子屬性能自動產生
                //TODO: 做一個可用orderByKey的map
                eval("data."+dataPath+"=snap.val()");
                def.resolve(snap.val())
            },function(err){
                console.log("Fail to map "+refUrl+"to "+dataPath+": "+err.code);
                def.resolv(err)
            });
            return def.promise
        }

        function loadMainDb(uid) {
            var def = $q.defer();
            if(uid) {
                mapFbToData("db@main", "db").then(function(){
                    mapFbToData("users/"+uid+"/db/A@main", "db.A")
                });
                mapFbToData("users/"+uid+"/token@main", "token");
                util.waitUntil([data.db.A.dbName, data.token]).then(function(){
                    def.resolve();
                })
            } else {
                mapFbToData("db/C@main", "db.C").then(function(){
                    def.resolve();
                });
            }
            return def.promise
        }

        return function(){
            var def = $q.defer();
            var onComplete = function(){
                def.resolve();data.initUid= data.uid||false;
                Firebase.goOffline("http://"+data.db.main.dbName+".firebaseio.com")
            };
            if(data.initUid==data.uid){
                def.resolve()
            } else {
                if(data.uid) {
                    loadMainDb(data.uid).then(onComplete)
                } else {
                    loadMainDb().then(onComplete)
                }
            }
            return def.promise
        }

    });
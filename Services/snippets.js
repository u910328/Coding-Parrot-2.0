angular.module('core', ['firebase', 'myApp.config'])
    .factory('snippets', function (config, $q, data) {

        function goOnline(dbType, t){
            var dbUrl = "https://"+data.db[dbType].dbName+".firebaseio.com/";
            var onlineArr = data.db[dbType].online;

            if(onlineArr.length==0){Firebase.goOnline(dbUrl)}
            //first one goOnline.

            onlineArr.push(t);
            // 重複!!fbIO裡也有
        }

        function goOffline(dbType, t){
            var dbUrl = "https://"+data.db[dbType].dbName+".firebaseio.com/";
            var onlineArr = data.db[dbType].online;

            if(onlineArr.length==1) {
                Firebase.goOffline(dbUrl);
            }
            //last one goOffline.

            setTimeout(function(){
                onlineArr.slice(onlineArr.indexOf(t),1);
            },0);
        }


    });
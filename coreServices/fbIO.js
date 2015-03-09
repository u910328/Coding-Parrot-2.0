angular.module('core', ['firebase', 'myApp.config'])
    .factory('fbIO', function (config, fbutil, $q, fbStructure, data, snippet) {
        function FbObj(refUrl){                                  //TODO: 移至snippet
            this.dbName=data.db[refUrl.split("@")[1]].dbName;
            this.dbUrl="https://"+dbName+".firebaseio.com/";
            this.path=refUrl.split("@")[0];
            this.url= this.dbUrl+this.path;
            this.t=(new Date).getTime().toString;
            this.dbType=refUrl.split("@")[1];
        }
        function goOnline_IfAllOffline(refUrl, t){
            var fbObj=new FbObj(refUrl);
            if(data.db[fbObj.dbType].online.length==0){Firebase.goOnline(fbObj.dbUrl)}
            data.db[fbObj.dbType].online.push(t);
        }
        function goOffline_IfLastOnline(refUrl, t){           //TODO: 檢驗是否跟其他的讀寫操作衝突
            var fbObj=new FbObj(refUrl);
            if(data.db[fbObj.dbType].online.length==1) {
                Firebase.goOffline(fbObj.dbUrl);
            }
            setTimeout(function(){
                data.db[fbObj.dbType].online.slice(onlineArr.indexOf(t),1);
            },0);
        }
        //TODO: 做一個函數(在util 服務底下)使不存在的data子屬性能自動產生
        function load(refUrl, orderBy, limit, isSync, eventType, extraOnComplete){
            var fbObj=new FbObj(refUrl);
            var ref=new Firebase(fbObj.url),
                queryRef=eval("ref."+(orderBy||"orderByKey()")+"."+limit);

            if((!eventType||eventType!="value")&&!isSync) {
                console.log("invalid to use child_added, child_removed, child_changed of child_moved when isSync==false");
                return
            }
            goOnline_IfAllOffline(refUrl, fbObj.t);

            function onComplete(snap, prevChildName){
                fbStructure(refUrl, snap.val(), eventType); //TODO: 完成fbStructure, 可以將snap.val 寫入fbStructure 裡的refUrl
                if(extraOnComplete) extraOnComplete(snap, prevChildName);
                if(!isSync) goOffline_IfLastOnline(refUrl, fbObj.t);
            }
            function errorCallback(err){
                console.log("Fail to load "+refUrl+": "+err.code);
                goOffline_IfLastOnline(refUrl, fbObj.t);
            }
            eval("queryRef."+(isSync? "on":"once")+"(eventType||'value', onComplete, errorCallback)");
        }

        function update(refUrl, value, onComplete){
            var fbObj=new FbObj(refUrl);
            var ref=new Firebase(fbObj.url);

            goOnline_IfAllOffline(refUrl, fbObj.t);

            ref.update(value, function(error){
                if (error) {
                    console.log("Update failed: "+refUrl);
                } else {
                    if(config.debug){console.log("Update success: "+refUrl)}
                    onComplete();
                }
                goOffline_IfLastOnline(refUrl, fbObj.t);
            })
        }

        function push(refUrl, value, onComplete){
            var fbObj=new FbObj(refUrl);
            var ref = new Firebase(fbObj.url);

            goOnline_IfAllOffline(refUrl, fbObj.t);

            if(value) {
                ref.push(value, function(error){
                    if (error) {
                        console.log("Update failed: "+refUrl);
                    } else {
                        if(config.debug){console.log("Update success: "+refUrl)}
                        onComplete();
                    }
                    goOffline_IfLastOnline(refUrl, fbObj.t);
                })
            } else {
                return ref.push()
            }
        }

        function set(refUrl, value, onComplete){
            var fbObj=new FbObj(refUrl);
            var ref=new Firebase(fbObj.url);

            goOnline_IfAllOffline(refUrl, fbObj.t);

            ref.set(value, function(error){
                if (error) {
                    console.log("Update failed: "+refUrl);
                } else {
                    if(config.debug){console.log("Update success: "+refUrl)}
                    onComplete();
                }
                goOffline_IfLastOnline(refUrl, fbObj.t);
            })
        }
//TODO: Transaction
    });
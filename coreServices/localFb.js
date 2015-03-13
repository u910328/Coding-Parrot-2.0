angular.module('core', ['firebase', 'myApp.config'])
    .factory('localFb', function (config, fbutil, $q, model, snippet) {
        function goOnline_IfAllOffline(refUrl, t){
            var fbObj=new snippet.FbObj(refUrl);
            if(model.db[fbObj.dbType].online.length==0){Firebase.goOnline(fbObj.dbUrl)}
            model.db[fbObj.dbType].online.push(t);
        }
        function goOffline_IfLastOnline(refUrl, t){           //TODO: 檢驗是否跟其他的讀寫操作衝突
            var fbObj=new snippet.FbObj(refUrl);
            if(model.db[fbObj.dbType].online.length==1) {
                Firebase.goOffline(fbObj.dbUrl);
            }
            setTimeout(function(){
                model.db[fbObj.dbType].online.slice(onlineArr.indexOf(t),1);
            },0);
        }

        function updateLocalFb(refUrl, value, key, eventType){
            var fbObj=new snippet.FbObj(refUrl),
                pathArr=fbObj.path.split("/");
            switch(eventType){
                case "child_added":
                    snippet.checkThenCreate(localFb, pathArr.push(key), value);
                    break;
                case "child_removed":
                    snippet.checkThenCreate(localFb, pathArr.push(key), null);
                    break;
                case "child_changed":
                    snippet.checkThenCreate(localFb, pathArr.push(key), value);
                    break;
                case "child_moved":
                    break;
                default:
                    snippet.checkThenCreate(localFb, pathArr, value);
                    break;
            }
        }

        function load(refUrl, query, extraOnComplete){
            var fbObj=new snippet.FbObj(refUrl),
                orderBy=query.orderBy,
                limit=(query.limit? ("."+query.limit):""),
                isSync=query.isSync,
                eventType=query.eventType;

            var ref=new Firebase(fbObj.url),
                queryRef=eval("ref."+(orderBy||"orderByKey()")+limit);

            if((!eventType||eventType!="value")&&!isSync) {
                console.log("invalid to use child_added, child_removed, child_changed of child_moved when isSync==false");
                return
            }
            goOnline_IfAllOffline(refUrl, fbObj.t);

            function onComplete(snap, prevChildName){
                updateLocalFb(refUrl, snap.val(), snap.key(), eventType);
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
            var fbObj=new snippet.FbObj(refUrl);
            var ref=new Firebase(fbObj.url);

            goOnline_IfAllOffline(refUrl, fbObj.t);

            ref.update(value, function(error){
                if (error) {
                    console.log("Update failed: "+refUrl);
                } else {
                    if(config.debug){console.log("Update success: "+refUrl)}
                    onComplete();
                    updateLocalFb(refUrl, value);
                }
                goOffline_IfLastOnline(refUrl, fbObj.t);
            })
        }

        function push(refUrl, value, onComplete){
            var fbObj=new snippet.FbObj(refUrl);
            var ref = new Firebase(fbObj.url);

            goOnline_IfAllOffline(refUrl, fbObj.t);

            if(value) {
                ref.push(value, function(error){
                    if (error) {
                        console.log("Update failed: "+refUrl);
                    } else {
                        if(config.debug){console.log("Update success: "+refUrl)}
                        onComplete();
                        updateLocalFb(refUrl, value);
                    }
                    goOffline_IfLastOnline(refUrl, fbObj.t);
                })
            } else {
                return ref.push()
            }
        }

        function set(refUrl, value, onComplete){
            var fbObj=new snippet.FbObj(refUrl);
            var ref=new Firebase(fbObj.url);

            goOnline_IfAllOffline(refUrl, fbObj.t);

            ref.set(value, function(error){
                if (error) {
                    console.log("Update failed: "+refUrl);
                } else {
                    if(config.debug){console.log("Update success: "+refUrl)}
                    onComplete();
                    updateLocalFb(refUrl, value);
                }
                goOffline_IfLastOnline(refUrl, fbObj.t);
            })
        }
//TODO: Transaction
        var localFb={
            load:load,
            update:update,
            set:set,
            push:push
        };
        return localFb
    });
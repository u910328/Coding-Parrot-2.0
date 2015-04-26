angular.module('core.localFb', ['firebase', 'myApp.config'])
    .factory('localFb', function (config, fbutil, $q, model, snippet) {
        var localFb={
            load:load,
            update:update,
            set:set,
            push:push
        };

        function FbObj(refUrl){
            var that=this;
            this.dbName=model.db[refUrl.split("@")[1]].dbName;
            this.dbUrl="https://"+dbName+".firebaseio.com/";
            this.path=refUrl.split("@")[0];
            this.url= this.dbUrl+this.path;
            this.dbType=refUrl.split("@")[1];
            this.t=(new Date).getTime().toString();
            this.omniKey={};
            this.ref=function(){
                var ref= new Firebase(that.dbUrl);
                var pathArr=refUrl.split("@")[0].split("/");
                for(var i=0; i<pathArr.length; i++){
                    if(pathArr[i].charAt(1)==="$"){
                        ref=ref.push();
                        that.omniKey[pathArr[i]]=ref.key();
                    } else {
                        ref=ref.child(pathArr[i]);
                    }
                }
                that.url=ref.toString();
                that.path=that.url.replace(ref.dbUrl,"");
                return ref
            }
        }

        function replaceOmniKey(typeAndTime, omniKey){
            var arr=model.action[typeAndTime]["updateFb"];
            for(var i=0; i<arr.length; i++){
                for(var key in omniKey){
                    var refUrl=arr[i][0];
                    model.action[typeAndTime]["updateFb"][i][0]=refUrl.replace(eval("/"+key+"/g"), omniKey[key]);
                }
            }
        }

        function goOnline_IfAllOffline(refUrl, t){
            var fbObj=new FbObj(refUrl);
            if(model.db[fbObj.dbType].online.length==0){Firebase.goOnline(fbObj.dbUrl)}
            model.db[fbObj.dbType].online.push(t);
        }
        function goOffline_IfLastOnline(refUrl, t){           //TODO: 檢驗是否跟其他的讀寫操作衝突
            var fbObj=new FbObj(refUrl);
            if(model.db[fbObj.dbType].online.length==1) {
                Firebase.goOffline(fbObj.dbUrl);
            }
            setTimeout(function(){
                model.db[fbObj.dbType].online.slice(onlineArr.indexOf(t),1);
            },0);
        }

        function updateLocalFb(refUrl, modelPath, value, key, eventType){
            var fbObj=new FbObj(refUrl),
                fbPathArr=fbObj.path.split("/"),
                modelPathArr=modelPath.split(".");
            switch(eventType){
                case "child_added":
                    snippet.evalAssignment([localFb, fbPathArr.push(key)], [value]);
                    if(modelPath) model.update(modelPathArr.push(key), value);
                    break;
                case "child_removed":
                    snippet.evalAssignment([localFb, fbPathArr.push(key)],[null]);
                    if(modelPath) model.update(modelPathArr.push(key), null);
                    break;
                case "child_changed":
                    snippet.evalAssignment([localFb, fbPathArr.push(key)], [value]);
                    if(modelPath) model.update(modelPathArr.push(key), value);
                    break;
                case "child_moved":
                    break;
                default:
                    snippet.evalAssignment([localFb, fbPathArr], [value]);
                    if(modelPath) model.update(modelPathArr, value);
                    break;
            }
        }

        function load(refUrl, modelPath, rule, extraOnComplete){
            var fbObj=new FbObj(refUrl),
                query=rule["query"],
                isSync=rule["isSync"],
                eventType=rule["eventType"];

            var ref=fbObj.ref(),
                queryRef=eval("ref."+query);

            if((!eventType||eventType!="value")&&!isSync) {
                console.log("invalid to use child_added, child_removed, child_changed of child_moved when isSync==false");
                return
            }
            goOnline_IfAllOffline(refUrl, fbObj.t);

            function onComplete(snap, prevChildName){
                updateLocalFb(refUrl, modelPath, snap.val(), snap.key(), eventType);

                if(extraOnComplete) extraOnComplete(snap, prevChildName);
                if(!isSync) goOffline_IfLastOnline(refUrl, fbObj.t);
            }
            function errorCallback(err){
                console.log("Fail to load "+refUrl+": "+err.code);
                goOffline_IfLastOnline(refUrl, fbObj.t);
            }
            eval("queryRef."+(isSync? "on":"once")+"(eventType||'value', onComplete, errorCallback)");
        }

        function update(refUrl, modelPath, value, onComplete, typeAndTime){
            var fbObj=new FbObj(refUrl), ref=fbObj.ref(), def=$q.defer();

            goOnline_IfAllOffline(refUrl, fbObj.t);

            if(typeAndTime){
                replaceOmniKey(typeAndTime, ref.omniKey);
            }

            ref.update(value, function(error){
                if (error) {
                    console.log("Update failed: "+refUrl);
                } else {
                    if(config.debug){console.log("Update success: "+refUrl)}
                    onComplete.apply(null);
                    updateLocalFb(refUrl, modelPath, value);
                }
                goOffline_IfLastOnline(refUrl, fbObj.t);
                def.resolve();
            });
            return def.promise;
        }

        function set(refUrl, modelPath, value, onComplete){
            var fbObj=new FbObj(refUrl), ref=fbObj.ref();

            goOnline_IfAllOffline(refUrl, fbObj.t);

            ref.set(value, function(error){
                if (error) {
                    console.log("Update failed: "+refUrl);
                } else {
                    if(config.debug){console.log("Update success: "+refUrl)}
                    onComplete();
                    updateLocalFb(refUrl, modelPath, value);
                }
                goOffline_IfLastOnline(refUrl, fbObj.t);
            })
        }
//TODO: Transaction

        return localFb
    });
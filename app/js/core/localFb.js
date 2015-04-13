angular.module('core.localFb', ['firebase', 'myApp.config'])
    .factory('localFb', function (FBURL, config, fbutil, $q, model, snippet) {
        var localFb={
            FbObj:FbObj,
            load:load,
            update:update,
            set:set,
            updateLocalFb:updateLocalFb,
            path:{}
        };

        function FbObj(refUrl){
            var that=this;
            this.dbName=model.db[refUrl.split("@")[1]]||FBURL.split("//")[1].split(".fi")[0];
            this.dbUrl="https://"+this.dbName+".firebaseio.com";
            this.path=refUrl.split("@")[0];
            this.url= this.dbUrl+"/"+this.path;
            this.dbType=refUrl.split("@")[1];
            this.t=(new Date).getTime().toString();
            this.omniKey={};
            this.ref=function(){
                var ref= new Firebase(that.dbUrl);
                var pathArr=that.path.split("/");
                for(var i=0; i<pathArr.length; i++){
                    if(pathArr[i].charAt(0)==="$"){
                        ref=ref.push();
                        that.omniKey[pathArr[i]]=ref.key();
                    } else {
                        ref=ref.child(pathArr[i]);
                    }
                }
                that.url=ref.toString();
                that.path=that.url.split(".com/")[1];
                return ref
            };

            this.goOnline=function(){
                if(model.db.online[that.dbUrl]===undefined){model.db.online[that.dbUrl]=[]}
                if(model.db.online[that.dbUrl].length===0){Firebase.goOnline(that.dbUrl)}
                model.db.online[that.dbUrl].push(that.t);
                console.log(that.dbUrl,"is online", that.t)
            };

            this.goOffline=function(){
                if(model.db.online[that.dbUrl]===undefined){model.db.online[that.dbUrl]=[]}
                if(model.db.online[that.dbUrl].length===1) {
                    Firebase.goOffline(that.dbUrl);
                }
                setTimeout(function(){             //TODO: 檢驗是否跟其他的讀寫操作衝突
                    var tPos=model.db.online[that.dbUrl].indexOf(that.t);
                    if(tPos!=-1){
                        model.db.online[that.dbUrl].splice(tPos,1);
                        console.log(that.dbUrl,"is offline", that.t)
                    }
                },0);
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

        /*function goOnline_IfAllOffline(refUrl, t){
            var fbObj=new FbObj(refUrl);
            if(model.db[fbObj.dbType+"_online"]===undefined){model.db[fbObj.dbType+"_online"]=[]}
            if(model.db[fbObj.dbType+"_online"].length===0){Firebase.goOnline(fbObj.dbUrl)}
            model.db[fbObj.dbType+"_online"].push(t);
        }

        function goOffline_IfLastOnline(refUrl, t){
            var fbObj=new FbObj(refUrl);
            if(model.db[fbObj.dbType+"_online"]===undefined){model.db[fbObj.dbType+"_online"]=[]}
            if(model.db[fbObj.dbType+"_online"].length==1) {
                Firebase.goOffline(fbObj.dbUrl);
            }
            setTimeout(function(){
                var tPos=model.db[fbObj.dbType+"_online"].indexOf(t);
                if(tPos!=-1){model.db[fbObj.dbType+"_online"].splice(tPos,1)}
            },0);
        }*/

        function updateLocalFb(fbObjPath, modelPath, value, key, eventType){
            var fbPathArr=fbObjPath.split("/");
            switch(eventType){
                case "child_added":
                    snippet.evalAssignment([localFb, fbPathArr.push(key)], [value]);
                    if(modelPath) model.update(modelPath+"."+key, value);
                    break;
                case "child_removed":
                    snippet.evalAssignment([localFb, fbPathArr.push(key)],[null]);
                    if(modelPath) model.update(modelPath+"."+key, null);
                    break;
                case "child_changed":
                    snippet.evalAssignment([localFb, fbPathArr.push(key)], [value]);
                    if(modelPath) model.update(modelPath+"."+key, value);
                    break;
                case "child_moved":
                    break;
                default:
                    snippet.evalAssignment([localFb, fbPathArr], [value]);
                    if(modelPath) model.update(modelPath, value);
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
            fbObj.goOnline();

            function onComplete(snap, prevChildName){
                updateLocalFb(fbObj.path, modelPath, snap.val(), snap.key(), eventType);

                if(extraOnComplete) extraOnComplete(snap, prevChildName);
                if(!isSync) fbObj.goOffline();
            }
            function errorCallback(err){
                console.log("Fail to load "+refUrl+": "+err.code);
                fbObj.goOffline();
            }
            eval("queryRef."+(isSync? "on":"once")+"(eventType||'value', onComplete, errorCallback)");
        }

        function update(refUrl, modelPath, value, onComplete, typeAndTime){
            var fbObj=new FbObj(refUrl), ref=fbObj.ref(), def=$q.defer();

            fbObj.goOnline();

            if(typeAndTime){
                replaceOmniKey(typeAndTime, fbObj.omniKey);
            }

            ref.update(value, function(error){
                if (error) {
                    console.log("Update failed: "+refUrl);
                } else {
                    if(config.debug){console.log("Update success: "+refUrl)}
                    onComplete.apply(null);
                    updateLocalFb(fbObj.path, modelPath, value);
                }
                fbObj.goOffline();
                def.resolve();
            });
            return def.promise;
        }

        function set(refUrl, modelPath, value, onComplete){
            var fbObj=new FbObj(refUrl), ref=fbObj.ref();

            fbObj.goOnline();

            ref.set(value, function(error){
                if (error) {
                    console.log("Update failed: "+refUrl);
                } else {
                    if(config.debug){console.log("Update success: "+refUrl)}
                    onComplete();
                    updateLocalFb(refUrl, modelPath, value);
                }
                fbObj.goOffline();
            })
        }
//TODO: Transaction

        return localFb
    });
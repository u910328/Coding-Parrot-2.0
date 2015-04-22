angular.module('core.binder', ['firebase', 'myApp.config'])
    .factory('binder', function (config, $q, localFb, model, ROUTES, $location, snippet, $routeParams) {
        //function bind(scope, modelPath){
        //    var modelPathArr=("model."+modelPath).split("."),
        //        key=modelPathArr[modelPathArr.length-1];
        //    snippet.evalAssignment([scope, key], modelPathArr);
        //}

        function updateModel(modelPath, targetVal, infoVal, extraFn, countdown, extraFnIfLast){
            extraFn.apply(null);
            snippet.evalAssignment([model, modelPath.split('.')], [targetVal]);
            snippet.evalAssignment([model, (modelPath+'_info').split('.')], infoVal);
            if(!countdown) {
                extraFnIfLast.apply(null);
                scope.$digest();
            }
        }

        function getRule(locationPath, params){
            var path=snippet.getRouteKey(locationPath, params);

            if(snippet.checkIfPropertyExist([ROUTES, [path,'bind']])) {
                var ruleString=JSON.stringify(ROUTES[path]['bind']);
            } else {
                return {};
            }

            for(var key in params){
                ruleString=ruleString.replace(eval("/\\"+key+"/g"), params[key])
            }
             return JSON.parse(ruleString);
        }

        function BinderObj(scope, modelPath, fbPath, rule){
            var that=this,
                orderBy=rule.orderBy[0]? "orderBy"+rule.orderBy[0]+"('"+rule.orderBy[1]+"')": "orderByKey()",
                itemPerPage=rule['itemPerPage']||26;
            this.info={
                currentPage:0,
                page:{}
            };

            switch(rule.type){
                case 'simplePagination':
                    that.updater=function(arg){
                        var page=arg||0;
                        if(that.info.page[page]){
                            var lastItem=that.pageInfo[page].lastItem;
                        } else {
                            that.info.page[page]={
                                itemNum:0
                            };
                            that.cache[page]={};
                        }
                        var startAt=that.currentPage===0&&lastItem? "":".startAt("+lastItem+")",
                            query=orderBy+startAt+".limitToFirst("+itemPerPage+")",
                            sPaginationRule={query:query, scope:scope};
                        if(!that.info.page[page].lastItem||page===0){
                            localFb.load(fbPath, modelPath, sPaginationRule, function(snap){
                                that.info.page[page].itemNum++;
                                that.cache[page][snap.key()]=snap.val()
                            }, function(snap){
                                that.info.page[page].lastItem=snap.key();
                                that.info.currentPage=page;
                                var cachePath=modelPath+"_cache."+page;
                                snippet.evalAssignment([model, cachePath.split(".")], [that.cache[page]]);
                                delete that.cache[page];
                                updateModel(modelPath, that.cache[page], that.info);//TODO: 修正此處會把舊資料蓋掉的缺點
                                if(that.info.page[page].itemNum<itemPerPage) that.info.page[page].lastPage=true;
                            });
                        } else {
                            that.info.currentPage=page;
                            updateModel(modelPath, that.cache[page], that.info);
                        }
                    };
                    break;
                case "infiniteScroll":
                    that.updater=function(){
                        var lastItem=that.info.lastItem;
                        var startAt=lastItem? ".startAt("+lastItem+")":"",
                            query=orderBy+startAt+".limitToFirst("+itemPerPage+")",
                            infiniteScrollRule={query:query, eventType:'child_added'};
                        console.log(lastItem, startAt, query);
                        var restItem=rule.itemPerPage;
                        localFb.load(fbPath, modelPath, infiniteScrollRule, function(snap, prevChildName){
                            restItem--;
                            var modelPathArr=(modelPath+"."+snap.key()).split(".");
                            snippet.evalAssignment([model, modelPathArr],[snap.val()]);
                            if(restItem===0){
                                that.lastItem=snap.key();
                                that.currentPage++;
                                scope.$digest();
                            }
                        });
                    };
                    break;
                default:
                    that.updater=function(rule, onComplete){
                        localFb.load(fbPath, modelPath, rule||{}, onComplete);
                    };
                    break;
            }
        }

        function bindScope(scope, customParams){
            var params=snippet.getUnionOfObj([$routeParams,customParams]);
            var rule=getRule($location.path(), params);

            for(var categoryName in rule){
                if(model[categoryName]===undefined) model[categoryName]={};
                scope[categoryName]=model[categoryName];
                for(var itemName in rule[categoryName]){
                    var modelPath=categoryName+"."+itemName,
                        itemRule=rule[categoryName][itemName];
                    model[categoryName][itemName]=itemRule.default;
                    if(itemRule.fb!=undefined){
                        var i=0;
                        for(var fbPath in itemRule.fb){
                            var binderObj=new BinderObj(scope, modelPath, fbPath, itemRule.fb[fbPath]);
                            model[categoryName]["update_"+itemName+(i===0? "":i)]=binderObj.updater;
                            binderObj.updater();//TODO:做個機制使bind過後的資料不會再因CTRL重新產生而在BIND一次
                            i++
                        }
                    }
                }
            }
        }

        return {
            bindScope:bindScope,
            getRule:getRule,
            BinderObj:BinderObj
        };
    });
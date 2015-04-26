angular.module('core.binder', ['firebase', 'myApp.config'])
    .factory('binder', function (config, $q, localFb, model, ROUTES, $location, snippet, $routeParams) {
        //function bind(scope, modelPath){
        //    var modelPathArr=("model."+modelPath).split("."),
        //        key=modelPathArr[modelPathArr.length-1];
        //    snippet.evalAssignment([scope, key], modelPathArr);
        //}

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
                orderBy=rule.orderBy? "orderBy"+rule.orderBy[0]+"('"+rule.orderBy[1]+"')": "orderByKey()";

            switch(rule.type){
                case 'simplePagination':
                    that.updater=function(nextOrPrev){

                        var info=!!nextOrPrev? (new model.ModelObj(modelPath+"_info")).val():{};
                        var currentPage=info.currentPage||1,
                            page=(currentPage+nextOrPrev)||1,
                            isLastPage=info[currentPage]&&info[currentPage].lastPage,
                            isFirstPage=info[currentPage]&&info[currentPage].firstPage;

                        if(nextOrPrev>0&&isLastPage) return;
                        if(nextOrPrev<0&&isFirstPage) return;

                        if(!info[page]) {
                            getPage(page)
                        } else {
                            var cachePageArr=(modelPath+"_cache."+page).split(".");
                            model.update(modelPath, null, [model, cachePageArr]);
                            //snippet.evalAssignment([model, modelPath.split('.')], [model, cachePageArr]);
                            snippet.evalAssignment([model, (modelPath+"_info.currentPage").split('.')], [page]);
                        }
                        function getPage(page){
                            var itemPerPage=rule['itemPerPage']||26;
                            itemPerPage=page!=1? itemPerPage+1:itemPerPage;
                            var startAt=page===1? "":".startAt('"+info[page-1].lastItem+"')",
                                query=orderBy+startAt+".limitToFirst("+itemPerPage+")",
                                sPaginationRule={query:query, scope:scope, eventType:'child_added'},
                                itemNum= 0,
                                cache={};
                            localFb.load(fbPath, null, sPaginationRule, function(snap){
                                itemNum++;
                                if(itemNum!=1||page===1) cache[snap.key()]=snap.val();
                            }, function(snap){

                                var pageInfo={itemNum:itemNum, lastItem:snap.key()};
                                if(itemNum<itemPerPage) pageInfo.lastPage=true;
                                if(page===1) pageInfo.firstPage=true;


                                snippet.evalAssignment([model, (modelPath+"_info."+page).split('.')], [pageInfo]);

                                var cachePath=modelPath+"_cache."+page;

                                snippet.evalAssignment([model, cachePath.split('.')], [cache]);
                                model.update(modelPath, cache);
                                //snippet.evalAssignment([model, modelPath.split('.')], [cache]);
                                snippet.evalAssignment([model, (modelPath+"_info.currentPage").split('.')], [page]);
                            })
                        }
                    };
                    break;
                case 'pagination':
                    that.updater=function(arg){
                        var page=arg||1, lastItem;
                        var info=(new model.ModelObj(modelPath+"_info")).val();
                        if(info[page-1]&&page>1){
                            lastItem=info[page-1].lastItem;
                        }
                        var startAt=lastItem? "":".startAt("+lastItem+")",
                            query=orderBy+startAt+".limitToFirst("+itemPerPage+")",
                            sPaginationRule={query:query, scope:scope, eventType:'child_added'};
                        if(!lastItem){
                            var infoPathArr=modelPath+"_info";
                            localFb.load(fbPath, modelPath, sPaginationRule, function(snap){
                                snippet.evalAssignment([model, infoPathArr.push(page).push('itemNum')], function(val){return val+1});
                                that.cache[page][snap.key()]=snap.val()
                            }, function(snap){
                                snippet.evalAssignment([model, infoPathArr.push(page).push('lastItem')], [snap.key()]);
                                snippet.evalAssignment([model, infoPathArr.push('currentPage')], [page]);
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
                    that.updater=function(ruleInput, onComplete){
                        var rule=ruleInput||{};
                        rule.scope=rule.scope||scope;
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
                    model.update(categoryName+'.'+itemName, itemRule.default);
                    //model[categoryName][itemName]=itemRule.default;
                    if(itemRule.fb!=undefined){
                        var i=0;
                        for(var fbPath in itemRule.fb){
                            var binderObj=new BinderObj(scope, modelPath, fbPath, itemRule.fb[fbPath]);
                            model[categoryName]["update_"+itemName+(i===0? "":i)]=binderObj.updater;
                            binderObj.updater();
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
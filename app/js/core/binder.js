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

        function BinderObj(scope, modelPath, ruleArr){
            var that=this,
                fbPath=ruleArr[0],
                rule=ruleArr[1],
                orderBy=rule.orderBy[0]? "orderBy"+rule.orderBy[0]+"('"+rule.orderBy[1]+"')": "orderByKey()",
                itemPerPage=rule['itemPerPage']||26,
                downloaded={};
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
                            downloaded[page]={};
                        }
                        var startAt=that.currentPage===0&&lastItem? "":".startAt("+lastItem+")",
                            query=orderBy+startAt+".limitToFirst("+itemPerPage+")",
                            sPaginationRule={query:query, eventType:'child_added'};
                        if(!that.info.page[page].lastItem||page===0){
                            var countdown=itemPerPage;
                            localFb.load(fbPath, modelPath, sPaginationRule, function(snap, prevChildName){
                                countdown--;
                                that.info.page[page].itemNum++;
                                downloaded[page][snap.key()]=snap.val();
                                if(countdown===0){
                                    that.info.page[page].lastItem=snap.key();
                                    that.info.currentPage=page;
                                    updateModel(modelPath, downloaded[page], that.info);
                                }
                            });
                        } else{
                            that.info.currentPage=page;
                            updateModel(modelPath, downloaded[page], that.info);
                        }
                    };
                    break;
                case "infiniteScroll":
                    that.updater=function(){
                        var startAt=that.currentPage===0&&lastItem? "":".startAt("+lastItem+")",
                            query=orderBy+startAt+".limitToFirst("+itemPerPage+")",
                            infiniteScrollRule={query:query, eventType:'child_added'};

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
                        localFb.load(fbPath, modelPath, rule, onComplete);
                    };
                    break;
            }
        }

        function bindScope(scope, customParams){
            var params=snippet.getUnionOfObj([$routeParams,customParams]);
            var rule=getRule($location.path(), params);

            for(var categoryName in rule){
                model[categoryName]={};
                scope[categoryName]=model[categoryName];
                for(var itemName in rule[categoryName]){
                    var modelPath=categoryName+"."+itemName,
                        binderObj=new BinderObj(scope, modelPath, rule[categoryName][itemName]);
                    scope[categoryName]["update_"+itemName]=binderObj.updater;
                    scope[categoryName][itemName+"_info"]=binderObj.info;
                    binderObj.updater();
                }
            }
        }

        return {
            bindScope:bindScope,
            getRule:getRule
        };
    });
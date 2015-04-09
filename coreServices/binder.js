angular.module('core', ['firebase', 'myApp.config'])
    .factory('binder', function (config, $q, localFb, model, fbModelMap) {
        function bind(scope, modelPath, rule){
            var modelPathArr=("model."+modelPath).split("."),
                key=modelPathArr[modelPathArr.length-1];
            snippet.evalAssignment(["scope", key], modelPathArr);
        }
//TODO: 設計 updateCurrentPage
        function bindUpdater(scope, modelPath, rule){
            var modelPathArr=("model."+modelPath).split("."),
                key=modelPathArr[modelPathArr.length-1], updater;
            switch(rule.type){
                case "simplePagination":
                    //snippet.evalAsignment(["scope", "updateVar"+key], {currentPage:1});
                    updater=function(page){
                        var orderBy=rule.orderBy[0]? "orderBy"+rule.orderBy[0]+"('"+rule.orderBy[1]+"')": "orderByKey()",
                            currentPage=scope[key+"Var"]["currentPage"]||0,
                            lastItem=scope[key+"Var"]["lastItem"][page]||"",
                            startAt= currentPage===0? "":".startAt("+lastItem+")",
                            query=orderBy+startAt+".limitToFirst("+rule.itemPerPage+")",
                            sPaginationRule={query:query, sync:false, eventType:'child_added'};

                        if(!scope["updateVar"+key]["lastItem"][page]||page===0){
                            var restItem=rule.itemPerPage;
                            localFb.load(rule.fbPath, modelPath, sPaginationRule, function(snap, prevChildName){
                                restItem--;
                                if(restItem===0){
                                    updateCurrentPage(scope, key, modelPath);
                                }
                            });
                        } else{
                            updateCurrentPage(scope, key, modelPath); //將資料處理好存到scope[key]並更新currentPage, lastItem等
                        }
                    };
                    break;
                case "pagination":
                    break;
                case "infiniteScroll":
                    updater=function(){
                        var orderBy="orderBy"+rule.orderBy[0]+"("+rule.orderBy[1]+")",
                            currentPage=scope[key+"Var"]["currentPage"]||0,
                            lastItem=scope[key+"Var"]["lastItem"]||"",
                            startAt= currentPage===0? "":".startAt("+lastItem+")",
                            query=orderBy||"orderByKey()"+startAt+".limitToFirst("+rule.itemPerPage+")",
                            infiniteScrollRule={query:query, sync:false, eventType:'child_added'};

                        var restItem=rule.itemPerPage;
                        localFb.load(rule.fbPath, modelPath, infiniteScrollRule, function(snap, prevChildName){
                            restItem--;
                            if(restItem===0){
                                scope[key+"Var"]["lastItem"]=rule.orderBy[0]=="Child"? snap.val()[rule.orderBy[1]]: snap.key();//註冊最後一項的名字
                                scope[key+"Var"]["currentPage"]++;
                            }
                        });
                    };
                    break;
                default:
                    updater=function(query){
                            localFb.load(rule.fbPath, modelPath, query);
                        };
                    break;
            }
            snippet.evalAsignment(["scope", "update"+key], updater);
        }

        function bindScope(scope, rulePath){
            var rulePathArr=rulePath.split(".");
            var rules=snippet.getRule(fbModelMap, rulePathArr);

            for(var key in rules){
                var modelPath=rulePath+"."+key;
                bind(scope, modelPath, rules[key]);
                bindUpdater(scope, modelPath, rules[key]);
                scope[key]["update"+key](0);
            }
        }

        return {
            bindScope:bindScope,
            bindUpdater:bindUpdater,
            bind:bind
        };
    });
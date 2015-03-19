angular.module('core', ['firebase', 'myApp.config'])
    .factory('binder', function (config, $q, localFb, model, fbModelMap) {
        function bind(scope, modelPath, rule){
            var modelPathArr=("model."+modelPath).split("."),
                key=modelPathArr[modelPathArr.length-1];

            localFb.load(rule.fbPath, modelPath, rule, function(snap, preChildName){
                snippet.evalAsignment(["scope", key], modelPathArr);
            });
        }

        function bindUpdator(scope, modelPath, rule){
            var modelPathArr=("model."+modelPath).split("."),
                key=modelPathArr[modelPathArr.length-1], updater;
            switch(rule.type){
                case "simplePagination":
                    //snippet.evalAsignment(["scope", "updateVar"+key], {currentPage:1});
                    updater=function(page){
                        var orderBy="orderBy"+rule.orderBy[0]+"("+rule.orderBy[1]+")",
                            currentPage=scope[key+"Var"]["currentPage"],
                            query=orderBy||"orderByKey()"+".startAt("+scope[key+"Var"]["lastItem"][currentPage]+").limitToFirst("+rule.itemPerPage+")",
                            sPaginationRule={query:query, sync:false, eventType:'child_added'};
                        if(!scope["updateVar"+key]["lastItem"][page]){
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
                    updater=function(query){
                        localFb.load(rule.fbPath, modelPath, query);
                    };
                    break;
                case "infiniteScroll":
                    updater=function(query){
                        localFb.load(rule.fbPath, modelPath, query);
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
                bindRenewer(scope, modelPath, rules[key]);
            }
        }

        return {
            bindScope:bindScope,
            bindRenewer:bindRenewer,
            bind:bind
        };
    });
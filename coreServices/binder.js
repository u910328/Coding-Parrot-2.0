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
                key=modelPathArr[modelPathArr.length-1], updator;
            switch(rule.type){
                case "simplePagination":
                    //snippet.evalAsignment(["scope", "updateVar"+key], {currentPage:1});
                    updator=function(prevOrNext){
                        var orderBy="orderBy"+rule.orderBy[0]+"("+rule.orderBy[1]+")",
                            currentPage=scope["updateVar"+key]["currentPage"],
                            query=orderBy||"orderByKey()"+".startAt("+scope["updateVar"+key]["lastItem"][currentPage]+").limitToFirst("+rule.itemPerPage+")",
                            sPaginationRule={query:query, sync:false, eventType:'child_added'};
                        localFb.load(rule.fbPath, modelPath, sPaginationRule);
                        if(!scope["updateVar"+key]["lastItem"][Number(prevOrNext)+currentPage]){
                            localFb.load(rule.fbPath, modelPath, sPaginationRule);
                        }
                        genCurrentPage(scope,key, modelPath); //將資料處理好存到scope[key]
                    };
                    break;
                case "pagination":
                    updator=function(query){
                        localFb.load(rule.fbPath, modelPath, query);
                    };
                    break;
                case "infiniteScroll":
                    updator=function(query){
                        localFb.load(rule.fbPath, modelPath, query);
                    };
                    break;
                default:
                    updator=function(query){
                            localFb.load(rule.fbPath, modelPath, query);
                        };
                    break;
            }
            snippet.evalAsignment(["scope", "update"+key], updator);
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
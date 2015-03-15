angular.module('core', ['firebase', 'myApp.config'])
    .factory('binder', function (config, $q, localFb, model, fbModelMap) {
        function bind(scope, modelPath, rule){
            var modelPathArr=("model."+modelPath).split("."),
                key=modelPathArr[modelPathArr.length-1];

            localFb.load(rule.fbPath, modelPath, rule, function(snap, preChildName){
                snippet.evalAsignment(["scope", key], modelPathArr);
            });
        }

        function bindRenewer(scope, modelPath, rule){
            if(!rule.renew) return;
            var modelPathArr=("model."+modelPath).split("."),
                key=modelPathArr[modelPathArr.length-1],
                renewFn=function(){
                    localFb.load(rule.fbPath, modelPath, rule.renew);
                };
            snippet.evalAsignment(["scope", "renew"+key], renewFn);
        }

        function bindModel(scope, rulePath){
            var rulePathArr=rulePath.split(".");
            var rules=snippet.getRule(fbModelMap, rulePathArr);

            for(var key in rules){
                var modelPath=rulePath+"."+key;
                bind(scope, modelPath, rules[key]);
                bindRenewer(scope, modelPath, rules[key]);
            }
        }

        return {
            bindModel:bindModel,
            bind:bind
        };
    });
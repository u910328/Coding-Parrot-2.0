angular.module('core', ['firebase', 'myApp.config'])
    .factory('logic', function (config, fbutil, data) {
        var logics = {
            'A:TB:FC?>3:T':true
            /*邏輯寫在這邊*/
        };
        function getResult(scope) {
            var resultPath = [];
            for (var i=0; i<arguments.length; i++) {
                var arg = arguments[i];
                scope[arg] = eval("data."+arg);
                scope.$watch(arg, function(newValue, oldValue){
                    if (newValue!=oldValue){
                        var result =arg.split("?")[1]? arg : eval(scope[arg]+arg.split("?")[1]);
                        resultPath.push(arguments[i]+":"+result)
                    }
                });
            }
            var key = resultPath.sort().join("");
            scope[key] = logics[key];
        }
        return getResult
    });
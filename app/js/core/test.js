/**
 * Created by ГеЋл on 7/4/2015.
 */
angular.module('core.test', ['firebase', 'myApp.config'])
    .factory('test', function (config, $q){
        console.log("testloaded");
        return {
            msg:"success",
            test1:"test1",
            test2:"test2",
            test:{test1:"test"},
            obj:{obj1:{a:"a"}},
            rule:{$test1:{$test2:{a:"$test1:jkdaskdlfj:;$test2"}}}
        }
    });
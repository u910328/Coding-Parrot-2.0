angular.module('core', ['firebase', 'myApp.config'])
    .factory('model', function (config, fbutil, $q) {
        return {
            value:{},
            db:{
                main:{online:[]},
                A:{online:[]},
                B:{online:[]},
                C:{online:[]},
                D:{online:[]}
            }
        }
    });
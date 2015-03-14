angular.module('core', ['firebase', 'myApp.config'])
    .factory('binder', function (config, $q, data, action, paths, localFb, model) {
        function bindModel($scope){

        }
        var binder={
            bindModel:bindModel
        };
        return binder
    });
angular.module('core', ['firebase', 'myApp.config'])
    .factory('paths', function (config, data) {
        return {
            createPj:{
                main:"pj",
                list:"pjList/$pushKey"
            },
            removePj:{},
            updatePj:{}
        }
    });
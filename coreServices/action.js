angular.module('core', ['firebase', 'myApp.config'])
    .factory('action', function (config, fbutil, $q) {
        return {
            createPj:{
                activity:"newPj|name|genre|language",
                updateFB:{
                    push:"main,db.B,newPj",
                    update:["list,db.C,newPj|name|genre|language|creatorUid|brief"]
                },
                updateData:["visual.pjCreated=true"]
            },
            removePj:{},
            updatePj:{}
        }
    });
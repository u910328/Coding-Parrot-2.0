angular.module('core', ['firebase', 'myApp.config'])
    .factory('action', function (config, fbutil, $q) {
        return {
            createPj:{
                preProcess:{
                    log:{name:"newPj|name", deadline:"newPj|deadline"},
                    modelToFb:[
                        "newPj:set:projects/$pid@B",
                        "newPj|name|genre|lang|creatorUid|brief|dbUrl:set:pjList/$pid@C"
                    ]
                },
                verify:true,
                postProcess:{
                    log:["newPj|name|genre|lang"],
                    updateModel:"visual.projectCreated=true"
                }
            },
            removePj:{},
            updatePj:{}
        }
    });
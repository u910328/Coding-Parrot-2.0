angular.module('core.action', ['firebase', 'myApp.config'])
    .factory('action', function (config, custom) {
        return {
            createPj:{
                preProcess:{
                    log:{name:"newPj|name", deadline:"newPj|deadline"},
                    modelToFb:[
                        "newPj:set:projects/$pid@B",
                        "newPj|name|genre|lang|creatorUid|brief|dbUrl:set:pjList/$pid@C"
                    ]
                },
                verify:false,
                postProcess:{
                    log:["newPj|name|genre|lang"],
                    updateModel:"visual.projectCreated=true"
                }
            },
            removePj:{},
            updatePj:{},
            test:{
                preProcess:{
                    modelToFb:[
                        "driverTest.test__update__driverTest/$pid@B",
                        "driverTest.test|a|b|c__set__driverTest/$pid/sub@C"
                    ],
                    delay:2000,
                    extraFn:""+function(){console.log('extraFn')}
                },
                postProcess:{
                    delay:2000
                }
            }
        }
    });
'use strict';

/* Controllers */

angular.module('myApp.controllers', ['firebase.utils', 'simpleLogin'])
    .controller('HomeCtrl', ['$scope', 'fbutil', 'user', 'FBURL', function($scope, fbutil, user, FBURL) {
        $scope.syncedValue = fbutil.syncObject('syncedValue');
        $scope.user = user;
        $scope.FBURL = FBURL;
    }])
    .controller('TestCtrl', function($scope, fbutil, config, snippet, localFb, model,viewLogic) {
        viewLogic.createIndex();
        $scope.view=model.view;
        $scope.path=model.path;


        $scope.evalAssignmentTest=function(){
            model.test={};
            $scope.test=model.test;
            model.test.test2="test2";
            model.test.test1="test1";
            setTimeout(function(){
                snippet.evalAssignment([model,["test","test2"]],[model,["test","test1"]]);
                $scope.$digest();
            },5000);
        };
        $scope.checkIfPropertyExist=function(){
            console.log(snippet.checkIfPropertyExist([test,"test","test2"]))
        };
        $scope.getRule=function(){
            console.log(JSON.stringify(snippet.getRule(test, ["rule","test1","test2"])));
        };

        $scope.readModel=function(){
            var modelObj= new model.ModelObj("test.test1.test2|a|b|c");
            console.log("readModel");
            console.log(modelObj.pathArr);
            console.log(JSON.stringify(modelObj.val()))
        };
        $scope.getViewLogic=function(){
            console.log(JSON.stringify(config.viewLogic));
            console.log(JSON.stringify(viewLogic.index))
        };
        $scope.updateModel=function(){
            model.update("path.path1", $scope.path.path1);
            model.update("path.path2", $scope.path.path2);
            model.update("path.path3", $scope.path.path3);
            model.update("path.path4", $scope.path.path4);
        };


        $scope.testUpdateLocal=function(){
            localFb.updateLocalFb("path/nonexist1/nonexist2","path.nonexist1.nonexist2", "success");
        };
        $scope.testFbObj=function(){
            var fbObj=new localFb.FbObj("codingParrot2/$test@main");
            console.log("before ref()",fbObj.path);
            fbObj.ref();
            console.log("after ref()",fbObj.path);
            fbObj.goOnline();
            setTimeout(function(){
                fbObj.goOffline();
            },10000)
        };

        $scope.testLocalFbLoad=function(){
            var rule={scope:$scope, eventType:'child_added'};
            localFb.load("serverList/cpsrv1@main","path.loadtest", rule,'',function(snap){
                console.log('last key is ', snap.key())
            })
        };
        $scope.testLocalFbUpdate=function(){
            function onComplete(){
                $scope.$digest();
                console.log("success");
            }
            localFb.update("serverList/test@main","path.loadtest", {value:5}, onComplete)
        }
    })
    .controller('RouteTestCtrl', function($scope, $route, localFb, model, snippet, config, ROUTES, $location) {
        $scope.$route = $route;
        console.log($route.routes);
        for(var key in $route){console.log(key)}
        $scope.getRouteKey=function(){
            console.log($route.current.params);
            $scope.$routeKey=snippet.getRouteKey($location.path(), $route.current.params);
        }
    })
    .controller('BinderTestCtrl', function($scope,viewLogic, localFb, model, snippet, config, binder, $location, $routeParams) {
        viewLogic.createIndex();
        binder.bindScope($scope);
        $scope.getRule=function(){
            $scope.rule=binder.getRule($location.path(), $routeParams);
        };
    })
    .controller('KhtsaoCtrl', function($scope,viewLogic, localFb, model, snippet, config, binder, $location, $routeParams) {
        viewLogic.createIndex();
        $scope.view=model.view;
        $scope.path=model.path;
        $scope.regipage=model.regipage
        binder.bindScope($scope);

        $scope.updateModel=function(){
            model.update("path.path1", $scope.path.path1);
            model.update("path.path2", $scope.path.path2);
            model.update("path.path3", $scope.path.path3);
            model.update("path.path4", $scope.path.path4);
            model.update("regi.user.name", $scope.regi.user.name);
            model.update("regi.user.cate", $scope.regi.user.cate);
            model.update("regi.user.info", $scope.regi.user.info);
        };
    })

    .controller('ChatCtrl', ['$scope', 'messageList', function($scope, messageList) {
        $scope.messages = messageList;
        $scope.addMessage = function(newMessage) {
            if( newMessage ) {
                $scope.messages.$add({text: newMessage});
            }
        };
    }])

    .controller('LoginCtrl', ['$scope', 'simpleLogin', '$location', function($scope, simpleLogin, $location) {
        $scope.email = null;
        $scope.pass = null;
        $scope.confirm = null;
        $scope.createMode = false;

        $scope.login = function(email, pass) {
            $scope.err = null;
            simpleLogin.login(email, pass)
                .then(function(/* user */) {
                    $location.path('/account');
                }, function(err) {
                    $scope.err = errMessage(err);
                });
        };

        $scope.createAccount = function() {
            $scope.err = null;
            if( assertValidAccountProps() ) {
                simpleLogin.createAccount($scope.email, $scope.pass)
                    .then(function(/* user */) {
                        $location.path('/account');
                    }, function(err) {
                        $scope.err = errMessage(err);
                    });
            }
        };

        function assertValidAccountProps() {
            if( !$scope.email ) {
                $scope.err = 'Please enter an email address';
            }
            else if( !$scope.pass || !$scope.confirm ) {
                $scope.err = 'Please enter a password';
            }
            else if( $scope.createMode && $scope.pass !== $scope.confirm ) {
                $scope.err = 'Passwords do not match';
            }
            return !$scope.err;
        }

        function errMessage(err) {
            return angular.isObject(err) && err.code? err.code : err + '';
        }
    }])

    .controller('AccountCtrl', ['$scope', 'simpleLogin', 'fbutil', 'user', '$location',
        function($scope, simpleLogin, fbutil, user, $location) {
            // create a 3-way binding with the user profile object in Firebase
            var profile = fbutil.syncObject(['users', user.uid]);
            profile.$bindTo($scope, 'profile');

            // expose logout function to scope
            $scope.logout = function() {
                profile.$destroy();
                simpleLogin.logout();
                $location.path('/login');
            };

            $scope.changePassword = function(pass, confirm, newPass) {
                resetMessages();
                if( !pass || !confirm || !newPass ) {
                    $scope.err = 'Please fill in all password fields';
                }
                else if( newPass !== confirm ) {
                    $scope.err = 'New pass and confirm do not match';
                }
                else {
                    simpleLogin.changePassword(profile.email, pass, newPass)
                        .then(function() {
                            $scope.msg = 'Password changed';
                        }, function(err) {
                            $scope.err = err;
                        })
                }
            };

            $scope.clear = resetMessages;

            $scope.changeEmail = function(pass, newEmail) {
                resetMessages();
                var oldEmail = profile.email;
                simpleLogin.changeEmail(pass, oldEmail, newEmail)
                    .then(function() {
                        $scope.emailmsg = 'Email changed';
                    }, function(err) {
                        $scope.emailerr = err;
                    });
            };

            function resetMessages() {
                $scope.err = null;
                $scope.msg = null;
                $scope.emailerr = null;
                $scope.emailmsg = null;
            }
        }
    ]);
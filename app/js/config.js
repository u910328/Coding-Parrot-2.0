'use strict';

// Declare app level module which depends on filters, and services
angular.module('myApp.config', [])

    // version of this seed app is compatible with angularFire 0.6
    // see tags for other versions: https://github.com/firebase/angularFire-seed/tags
    .constant('version', '0.9.1')

    // where to redirect users if they need to authenticate (see routeSecurity.js)
    .constant('loginRedirectPath', '/login')

    // your Firebase data URL goes here, no trailing slash
    .constant('FBURL', 'https://cpmain.firebaseio.com')
    .constant('config', {
        //viewLogic:[
        //    ["path.path1","path.path2","path.path3","path.path4","result"],
        //    [">1",">3","==2","==1","view.class1=success1|"],
        //    ["","","","==3", "view.class2=success2|"],
        //    ["","","==2","","view.class3=success3|"],
        //    ["==2","","","","view.class4=success4|"]
        //],
        viewLogic:[
           ["Regi.cate","Result"],
           ["==Coder",[["card.Cate",[
               {heading:'coder name', detail:'coder detail'},
               {heading:'language', detail:'language'}
           ]]]],
            ["==PM",[["card.Cate",model.Regi.pm]]]
        ],

        fbModelMap:{
            pjList:{},
            pjDetail:{}
        }
    })

    // double check that the app has been configured before running it and blowing up space and time
    .run(['FBURL', '$timeout', function (FBURL, $timeout) {
        if (FBURL.match('//INSTANCE.firebaseio.com')) {
            angular.element(document.body).html('<h1>Please configure app/js/config.js before running!</h1>');
            $timeout(function () {
                angular.element(document.body).removeClass('hide');
            }, 250);
        }
    }]);


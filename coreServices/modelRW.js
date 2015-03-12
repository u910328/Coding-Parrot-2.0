angular.module('core', ['firebase', 'myApp.config'])
    .factory('modelRW', function (config, fbutil, $q, modelStructure, model, snippet, viewLogic) {
        function checkRow(i, whichCol){
            var rowI=viewLogic["table"][i],
                rowTitle=viewLogic["table"][0],
                match=true;
            if(!eval("model."+rowTitle[whichCol]+rowI[whichCol])){
                match=false;
                return
            }
            for(var j=0; j<rowTitle.length-2; j++){
                if(rowI[j]&&j!=whichCol){
                    if(!eval("model."+rowTitle[j]+rowI[j])){
                        match=false;
                        break
                    }
                }
            }
            return match;
        }
        return function(path){
            var renew=viewLogic["renew"][path];
            for(var i=1; i<renew.length; i++){
                checkRow(i,renew[0])
            }

        }
    });
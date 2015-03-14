angular.module('core', ['firebase', 'myApp.config'])
    .factory('model', function (config, fbutil, $q, snippet, viewLogic) {
        var model={
            update:update,
            updateView:updateView
        };

        function checkRow(i, whichCol) {
            var rowI = viewLogic["table"][i],
                rowTitle = viewLogic["table"][0],
                match = true;
            if (!eval("model." + rowTitle[whichCol] + rowI[whichCol])) {
                return false;
            }
            for (var j = 0; j < rowTitle.length - 2; j++) {
                if (rowI[j] && j!= whichCol) {
                    if (!eval("model." + rowTitle[j] + rowI[j])) {
                        match = false;
                        break
                    }
                }
            }
            return match;
        }
//TODO: 變成兩部分 1.先計算所有變動 2.將變動套用到view上
        function updateView(path) {
            var renew = viewLogic["renew"][path];
            for (var i = 1; i < renew.length; i++) {
                if(checkRow(i, renew[0])){
                    var renewValue=renew[(renew.length-1)];
                    for(var key in renewValue){
                        eval("model.view"+key+"=renewValue[key]")
                    }
                }
            }
        }

        function update(path, value) {
            var pathArr=(typeof path=="object")? path: path.split(".");
            snippet.checkThenCreate(model, pathArr, value);
            updateView(path)
        }

        return model
    });

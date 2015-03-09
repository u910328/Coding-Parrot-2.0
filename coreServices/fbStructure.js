/**
 * Created by 博彥 on 8/3/2015.
 */
angular.module('core', ['firebase', 'myApp.config'])
    .factory('fbStructure', function (config, fbutil, $q, data, snippet) {
        //config.fbStructure
        var structure={
            update: function(refUrl, snap, eventType){
                var fbObj=new snippet.FbObj(refUrl),
                    pathArr=fbObj.path.split("/"),
                    key=snap.key();
                switch(eventType){
                    case "child_added":
                        snippet.checkThenCreate(structure, pathArr.push(key), snap.val());
                        break;
                    case "child_removed":
                        snippet.checkThenCreate(structure, pahArr.push(key), null);
                        break;
                    case "child_changed":
                        snippet.checkThenCreate(structure, pathArr.push(key), snap.val());
                        break;
                    case "child_moved":
                        break;
                    default:
                        snippet.checkThenCreate(structure, pathArr, snap.val());
                        break;
                }
            }
        };
    });
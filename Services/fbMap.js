/**
 * Created by 博彥 on 21/2/2015.
 */
function inverseMap(map){
    function recurrsion(obj, objPathString){
        for(var key in obj){
            if(key=="fbPath"){
                fbMap[obj["fbPath"]]= fbMap[obj["fbPath"]]? fbMap[obj["fbPath"]].push(objPathString):[objPathString]
            } else {
                if((typeof obj[key])=="object"){
                    recurrsion(obj[key], (objPathString+"."+key))
                }
            }
        }
    }
    recurrsion(map, "fbMap")
}

function createObjProperty(objPath){
    var objPathArr=objPath.split(".");
    var path="";
    for(var i=0; i<objPathArr.length; i++){
        path = path? objPathArr[0]:path+"['"+objPathArr[i]+"']";
        if(eval(path+"==undefined")){
            eval(path+"={}");
        }
    }
}

function regDataPathWithSameFbPath(fbPath, dataPath, updateTime){
    if(!data.allFbPath[fbPath]){
       createObjProperty("data.allFbPath."+fbPath);  //路徑可能不合JS語法 如data.allFbPath.users/$uid@A
    }
    data.allFbPath[fbPath].updateTime = updateTime;
    if(!data.allFbPath[fbPath].allDataPath){
        data.allFbPath[fbPath].allDataPath={};
    }
    data.allFbPath[fbPath].allDataPath[dataPath] = updateTime;
}
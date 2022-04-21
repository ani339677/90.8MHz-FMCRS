(function (global){
    var ajaxUtils={};
    function getRequestObject(){
        if (window.XMLHttpRequest){
            return (new XMLHttpRequest);
        }
        else if (window.ActiveXObject){
            return (new ActiveXObject("Microsoft.XMLHTTP"));
        }
        else {
            global.alert("Ajax is not supported!");
        }
        return (null);
    }
    ajaxUtils.sendGetRequest =
        function(requestUrl,responseHandler,isJson){
            var request=getRequestObject();
            request.onreadystatechange=
                function(){
                    handleGetResponse(request,responseHandler,isJson);
                };
            request.open("GET", requestUrl, true);
            request.send(null);
        };

    function handleGetResponse(request,responseHandler,isJson){
        if (request.readyState==4 && request.status==200){
            if (isJson==undefined){
                isJson=true;
            }
            if (isJson){
                responseHandler(JSON.parse(request.responseText));
            }
            else{
                responseHandler(request.responseText);
            }
        }
    }

    global.$ajaxUtils=ajaxUtils;
})(window);
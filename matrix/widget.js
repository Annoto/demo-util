(function (window) {

    var bootstrapUrl = 'https://cdn.annoto.net/widget/latest/bootstrap.js'; 
 

    var onWindowLoad = function () {
       

    };

    if (['interactive', 'complete'].indexOf(document.readyState) !== -1) {
        onWindowLoad();
    } else {
        if (window.addEventListener) { // Mozilla, Netscape, Firefox
            window.addEventListener('load', onWindowLoad, false);
        } else if (window.attachEvent) { // IE
            window.attachEvent('onload', onWindowLoad);
        }
    }

})(window);

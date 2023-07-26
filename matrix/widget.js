(function (window) {

    var bootstrapUrl = 'https://cdn.annoto.net/widget/latest/bootstrap.js';
    var clientId = 'eyJhbGciOiJIUzI1NiJ9.MWY2YTMxYjMtZGM5ZC00YTcxLTgyMTUtZDliNTBiN2FlODBm.a_XO_gNYScfl0qmvDAtiZ8XKPUArcGmf7gFQ0whM1ag';
    var playerQuery = '#YouTubePlayer';
    var annotoConfig = {
        clientId: clientId,
        /* hooks: {
            ssoAuthRequestHandle: ssoAuthRequestHandle,
            mediaDetails: function (detailsParams) {
                var retVal = detailsParams.details || {};
                if (!retVal.title) {
                    retVal.title = document.title || 'UNKNOWN';
                }
                return retVal;
            },
        }, */
        widgets: [{
            player: {
                type: 'youtube',
                element: playerQuery,
            },
        }],
    };


    function asyncLoadScript(src, onLoadCb) {
        var t = document.createElement('script');
        t.type = 'text/javascript'; t.async = true; t.src = src;
        t.onload = onLoadCb;
        var ft = document.getElementsByTagName('script')[0];
        ft ? ft.parentNode.insertBefore(t, ft) : document.body.appendChild(t);
    }

    var onWindowLoad = function () {
        var playerEl = document.querySelector(playerQuery);
        if (!playerEl.src.includes('enablejsapi')) {
            playerEl.src = playerEl.src + '?enablejsapi=1';
        }
        fetch('https://matrixsb.csod.com/outboundsso.aspx?ou_id=-24350', {
            method: 'GET',
            headers:{
                'Content-Type': 'text/html; charset=utf-8',
            },
            mode: 'no-cors',
        }).then(function (response) {
            return response.text();
        }).then(function (data) {
            var parser = new DOMParser();
            var doc = parser.parseFromString(data, "text/html")
            var SAMLResponse = doc.querySelector('input[name="SAMLResponse"]').value;

            asyncLoadScript(bootstrapUrl, function () {
                Annoto.on('ready', function (api) {
                    api.samlAuth(SAMLResponse);
                });
                Annoto.boot(annotoConfig);
            });
        })
    };

    if (['interactive', 'complete'].indexOf(document.readyState) !== -1) {
        onWindowLoad();
    } else {
        window.addEventListener('load', onWindowLoad, false);
    }
})(window);

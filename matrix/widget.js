(function (window) {
    var scriptSrc = document.currentScript.src;
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

    function getQueryParams(url) {
        var paramArr = url.slice(url.indexOf('?') + 1).split('&');
        var params = {};
        paramArr.map(param => {
            var [key, val] = param.split('=');
            params[key] = decodeURIComponent(val);
        })
        return params;
    }

    function getOutboundUrl() {
        var outboundUrl = getQueryParams(scriptSrc).outbound_url;
        if (!outboundUrl) {
            throw new Error('outboundUrl is not defined');
        }
        return outboundUrl;
    }

    var onWindowLoad = function () {
        var playerEl = document.querySelector(playerQuery);
        if (!playerEl.src.includes('enablejsapi')) {
            playerEl.src = playerEl.src + '?enablejsapi=1';
        }
        fetch(getOutboundUrl(), {
            method: 'GET',
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

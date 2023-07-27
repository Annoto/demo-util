(function (window) {
    var bootstrapUrl = 'https://cdn.annoto.net/widget/latest/bootstrap.js';
    var playerQuery = '#YouTubePlayer';
    var annotoConfig = {
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

    var scriptSrc = document.currentScript.src;
    var paramArr = scriptSrc.slice(scriptSrc.indexOf('?') + 1).split('&');
    var queryParams = {};
    paramArr.forEach(param => {
        var [key, val] = param.split('=');
        queryParams[key] = decodeURIComponent(val);
    })

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

        var ssoUrl = queryParams.sso_url;
        var clientId = queryParams.client_id;
        var region = queryParams.region;

        if (!ssoUrl || !clientId || !region) {
            throw new Error('sso_url, client_id and region must be defined in the url');
        }
        annotoConfig.clientId = clientId;
        annotoConfig.backend = {
            domain: `${region}.annoto.net`,
        }
        fetch(ssoUrl, {
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

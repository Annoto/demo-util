(function (window) {
    var scriptSrc = document.currentScript.src;
    var bootstrapUrl = 'https://cdn.annoto.net/widget/latest/bootstrap.js';
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
        widgets: [],
    };

    var paramArr = scriptSrc.slice(scriptSrc.indexOf('?') + 1).split('&');
    var queryParams = {};
    paramArr.map((param) => {
        var [key, val] = param.split('=');
        queryParams[key] = decodeURIComponent(val);
    });

    var ssoUrl = queryParams.sso_url;
    var clientId = queryParams.client_id;
    var region = queryParams.region;

    // TEST VALUES
    // var ssoUrl = 'https://matrixsb.csod.com/outboundsso.aspx?ou_id=-24350';
    // var clientId =
    //     'eyJhbGciOiJIUzI1NiJ9.MGQ0NjMwN2EtNDVlMi00MWFlLWJhODQtOGMwNWZhZTZhZTVj.zrGJG_FatEsGaU82OoWUa81mv3ljnCUlJ8IW-lst0qk';
    // var region = 'queryParams.region';

    if (!ssoUrl || !clientId || !region) {
        throw new Error('Annoto: sso_url, client_id and region must be defined in the url');
    }
    annotoConfig.clientId = clientId;
    annotoConfig.backend = {
        domain: `${region}.annoto.net`,
    };

    var booted = false;
    var annotoApi;
    var activeAkamaiPlayerId;
    var launchedPlayers = [];

    function launchWidget(player) {
        if (launchedPlayers.indexOf(player.playerId) !== -1) {
            return;
        }
        var widgetConfig = {
            clientId,
            widgets: [
                {
                    timeline: {
                        overlay: true,
                    },
                    player: player,
                },
            ],
        };
        launchedPlayers.push(player.playerId);
        if (!booted) {
            fetch(ssoUrl, {
                method: 'GET',
            })
                .then(function (response) {
                    return response.text();
                })
                .then(function (data) {
                    var parser = new DOMParser();
                    var doc = parser.parseFromString(data, 'text/html');
                    var SAMLResponse = doc.querySelector('input[name="SAMLResponse"]').value;
                    var bootFn = function () {
                        Annoto.on('ready', function (api) {
                            annotoApi = api;
                            api.samlAuth(SAMLResponse);
                        });
                        Annoto.boot(widgetConfig);
                        booted = true;
                    };
                    if (player.type === 'akamai') {
                        player.element.amp.once('play', bootFn);
                        player.element.amp.once('destroy', function () {
                            const index = launchedPlayers.indexOf(player.playerId);
                            if (index > -1) {
                                launchedPlayers.splice(index, 1);
                            }
                        });
                    } else {
                        bootFn();
                    }
                });
        } else {
            if (!annotoApi) {
                console && console.warn('AnnotoPlugin: Cannot Reload, Widget is Booting');
                return;
            }
            var loadFn = function () {
                annotoApi.load(widgetConfig);
            };
            if (player.type === 'akamai') {
                player.element.amp.once('play', loadFn);
                player.element.amp.once('destroy', function () {
                    const index = launchedPlayers.indexOf(player.playerId);
                    if (index > -1) {
                        launchedPlayers.splice(index, 1);
                    }
                });
            } else {
                loadFn();
            }
        }
    }

    function asyncLoadScript(src, onLoadCb) {
        var ft = document.getElementsByTagName('script')[0];
        var t = document.createElement('script');
        t.type = 'text/javascript';
        t.async = true;
        t.src = src;
        t.onload = onLoadCb;
        ft ? ft.parentNode.insertBefore(t, ft) : document.body.appendChild(t);
    }

    var onWindowLoad = function () {
        asyncLoadScript(bootstrapUrl, function () {
            setInterval(function () {
                var youtubeElements = document.querySelectorAll('iframe[src*="youtube.com"]'),
                    akamaiElements = document.querySelectorAll('.akamai-player');
                if (akamaiElements.length + youtubeElements.length === 0) {
                    activeAkamaiPlayerId = null;
                    return;
                }
                for (var i = 0; i < youtubeElements.length; i++) {
                    var youtube = youtubeElements[i];
                    if (!youtube.id || youtube.id === '') {
                        youtube.id =
                            'annoto_player_Y_id_' + Math.random().toString(36).substr(2, 6);
                    }
                    launchWidget({
                        playerId: `#${youtube.id}`,
                        type: 'youtube',
                        element: youtube,
                    });
                }
                for (var j = 0; j < akamaiElements.length; j++) {
                    var akamai = akamaiElements[j];
                    if (!akamai.id || akamai.id === '') {
                        akamai.id = 'annoto_player_A_id_' + Math.random().toString(36).substr(2, 6);
                    }
                    launchWidget({
                        playerId: `#${akamai.id}`,
                        type: 'akamai',
                        element: akamai,
                    });
                }
            }, 200);
        });
    };

    if (['interactive', 'complete'].indexOf(document.readyState) !== -1) {
        onWindowLoad();
    } else {
        if (window.addEventListener) {
            // Mozilla, Netscape, Firefox
            window.addEventListener('load', onWindowLoad, false);
        } else if (window.attachEvent) {
            // IE
            window.attachEvent('onload', onWindowLoad);
        }
    }
})(window);

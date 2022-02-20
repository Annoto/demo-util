(function (window) {

    window.annotoDestroy = function () {
        if (window.Annoto && Annoto.api) {
            Annoto.api.destroy();
        }
    };

    var asyncLoadScript = function (url, callback) {
        window.jQuery.ajax({
            url: url,
            dataType: 'script',
            success: callback,
            async: true
        });
    }


    var setupAnnotoWidget = function (playerId, player) {
        var widgetConfig = {
            clientId: AnnotoData.clientId,
            widgets: [{
                timeline: { overlay: false },
                player: {
                    type: 'vimeo',
                    element: '#' + playerId,
                }
            }],
            group: {
                id: AnnotoData.group.id,
                title: AnnotoData.group.title,
                description: window.AnnotoData.group.description,
            },
            hooks: {
                mediaDetails: function () {
                    return player.getVideoTitle().then(function (title) {
                        return {
                            title: title,
                        }
                    });
                }
            },
        };
        console.log("Annoto Yedion load widget with player id: " + playerId);

        if (window.Annoto.api) {
            return Annoto.api.load(widgetConfig, function (err) {
                if (err) {
                    console.error('Annoto Yedion: Error while reloading Annoto configuration');
                    return;
                }
            });
        }


        Annoto.on('ready', function (api) {
            Annoto.api = api;
            api.auth(AnnotoData.userToken);
        });
        Annoto.boot(widgetConfig);
    };

    var setupVimeoPlayersForAnnoto = function () {
        console.log("Annoto Yedion: setup vimeo players");
        $("iframe").each(function (k, vimeoWrapper) {
            var playerId = $(vimeoWrapper).attr('id');
            if (playerId.indexOf("Vimeo_") !== -1) {
                console.log('Annoto Yedion: setup player ', playerId);
                var vimeoPlayer = new Vimeo.Player(vimeoWrapper);

                vimeoPlayer.on('play', function () {
                    console.log('Annoto Yedion: play: ' + playerId);
                    setupAnnotoWidget(playerId, vimeoPlayer);
                });
            }
        });
    }

    var bootstrapUrl = 'https://cdn.annoto.net/widget/latest/bootstrap.js'; // 'http://localhost:9000/bootstrap.js';
    asyncLoadScript(bootstrapUrl, function () { });


    var onWindowLoad = function () {
        if (!window.AnnotoData
            || !window.AnnotoData.clientId
            || !window.AnnotoData.userToken
            || !window.AnnotoData.group
            || !window.AnnotoData.group.id
            || !window.AnnotoData.group.title
        ) { // There must be data form customer side
            console.log('Annoto Yedion: There is no data about annoto.');
            return;
        }

        setTimeout(setupVimeoPlayersForAnnoto, 0);

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

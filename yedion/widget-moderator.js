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


    var setupAnnotoWidget = function (playerId) {
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
                description: AnnotoData.group.description,
            },
        };
        console.log("Annoto Yedion load widget with player id: " + playerId);

        if (window.Annoto.api) {
            return Annoto.api.load(widgetConfig);
        }


        Annoto.on('ready', function (api) {
            Annoto.api = api;
            api.auth(AnnotoData.userToken);
        });
        Annoto.boot(widgetConfig);
    };

    var activeVimeoPlayerId;
    var setupModeratorsVimeoPlayersForAnnoto = function () {
        console.log("Annoto Yedion: setup show hide");

        var playersSet = new Set();
        $('#course_coursematerials .table td').has('.VimeoShow').find('.Hand').each(function (handIndex, handEl) {
            var itemId = $(handEl).closest('tr').attr('id');

            console.log('Annoto Yedion: setup hand: ', itemId);

            var vimeoPlayer;
            var playerId;
            $(handEl).on('click', function () {
                console.log('Annoto Yedion: hand click handle, ', itemId);
                if (Annoto.api) {
                    Annoto.api.destroy();
                }
                playersSet.forEach(function (p) {
                    p.pause();
                });
                activeVimeoPlayerId = undefined;
                if (vimeoPlayer) {
                    console.log('Annoto Yedion: destroy player, ', playerId);
                    $('.fmsg' + itemId + ' iframe').attr('id', playerId);
                    playersSet.delete(vimeoPlayer);
                    vimeoPlayer.destroy();
                    vimeoPlayer = undefined;
                    playerId = undefined;
                } else {
                    setTimeout(function () {
                        var vimeoWrapper = $('.cfmsg' + itemId + ' iframe');
                        playerId = $(vimeoWrapper).attr('id');
                        if (playerId.indexOf("Vimeo_") !== -1) {
                            console.log('Annoto Yedion: setup player ', playerId);
                            vimeoPlayer = new Vimeo.Player(vimeoWrapper);
                            playersSet.add(vimeoPlayer);

                            $('.fmsg' + itemId + ' iframe').removeAttr('id');

                            if (playerId !== activeVimeoPlayerId) {
                                setupAnnotoWidget(playerId);
                                activeVimeoPlayerId = playerId;
                            }
                            vimeoPlayer.on('play', function () {
                                if (playerId === activeVimeoPlayerId) {
                                    return;
                                }
                                activeVimeoPlayerId = playerId;
                                console.log('Annoto Yedion: play: ' + playerId);
                                setupAnnotoWidget(playerId);
                            });
                        }
                    });
                }
            });
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

        setTimeout(setupModeratorsVimeoPlayersForAnnoto, 0);

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

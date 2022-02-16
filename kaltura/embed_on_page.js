(function (window) {
    var matchMedia = (location.pathname || '').match(/\/(media)\/([^\/]*)\/([^\/,\?]*)/i) || [];
    var mediaFound = matchMedia && matchMedia.length > 2;

    window.KApps = window.KApps || {};
    var appParams = window.KApps.annotoAppParams || {};
    var validClienId = !!(appParams.clientId && typeof appParams.clientId === 'string' && appParams.clientId !== '');

    if (!mediaFound || !validClienId) {
        return;
    }

    console.log("Annoto Embed On Page: Loading");

    var b = 'https://cdn.annoto.net/widget/latest/bootstrap.js'; // 'http://localhost:9000/bootstrap.js';

    var uxParams = appParams.ux || {};
    var siteLoginUrl = window.location.hostname + window.KApps.annotoAppParams.ux.siteLoginUrl;
    var isLoggedIn = uxParams.isLoggedIn;
    var guestUsersAllowed = uxParams.guestUsersAllowed;

    var ssoAuthRequestHandle = function () {
        var getSsoToken = function () {
            if (!validCtx()) {
                return fetchCtxCred().then(function (cred) {
                    return cred.token;
                });
            }
            return Promise.resolve(ctxCred.token);
        }

        if (guestUsersAllowed && !isLoggedIn && siteLoginUrl) {
            window.location.href = siteLoginUrl;
            return;
        }

        return getSsoToken().then(function (token) {
            return annotoApi.auth(token);
        });
    }

    var e = document.createElement('div');
    e.style.width = '100%';
    e.style.height = '560px';
    e.style.borderTop = '1px solid rgba(0,0,0,.1)';
    e.style.padding = '16px 0';
    document.getElementById('entryDataBlock').append(e);

    try {
        var styleEl = document.createElement('style');
        document.head.appendChild(styleEl);
        var styleSheet = styleEl.sheet;
        styleSheet.insertRule('#bottom_tabs { display: none; }');
        styleSheet.insertRule('#wrapper { margin-bottom: 0px !important; }');
        styleSheet.insertRule('.carousel { margin-bottom: 0px !important; }');
        styleSheet.insertRule('.annoto-progress-bar-organ { display: none !important; }');
        styleSheet.insertRule('.annoto-timeline { border-bottom: 1px solid rgba(0,0,0,.1); }');
        styleSheet.insertRule('.annoto-timeline-dock { height: 34px !important; }');

    } catch { }

    var c = {
        clientId: appParams.clientId,
        backend: {
            domain: appParams.deploymentDomain,
        },
        hooks: {
            ssoAuthRequestHandle: ssoAuthRequestHandle,
            mediaDetails: function (detailsParams) {
                var retVal = detailsParams.details || {};
                if (!retVal.title) {
                    retVal.title = document.title || 'UNKNOWN';
                }
                return retVal;
            },
        },
        widgets: [{
            player: {
                type: 'kaltura',
                element: '#kplayer',
            },
            host: e,
        }],
    };
    var ctxCred;
    var annotoApi;
    var applyCtxDone = false;
    var d = document;
    var t = d.createElement('script');
    t.type = 'text/javascript'; t.async = true; t.src = b;
    t.onload = function () {
        Annoto.on('ready', function (api) {
            annotoApi = api;
            applyCtxCredentials();
        });
        Annoto.boot(c);
    }
    var ft = d.getElementsByTagName('script')[0]; ft ? ft.parentNode.insertBefore(t, ft) : d.body.appendChild(t);

    var applyCtxCredentials = function () {
        if (!validCtx()) {
            return;
        }
        if (!annotoApi) {
            return;
        }
        if (applyCtxDone) {
            return;
        }
        applyCtxDone = true;

        annotoApi.auth(ctxCred.token).catch(function () {
            applyCtxDone = false;
        });
    }

    var validCtx = function () {
        return !!ctxCred && ctxCred.success;
    }
    var fetchCtxCred = function () {
        return kmsRequest('get-ctx-credentials', null, null).then(function (data) {
            ctxCred = data;
            if (!validCtx()) {
                throw new Error('invalid credentials');
            }
            return ctxCred;
        }).catch(function (err) {
            ctxCred = undefined;
            throw err;
        });
    }

    var kmsRequest = function (method, params, queryParams) {
        return new Promise(function (resolve, reject) {
            var url = baseUrl + '/annoto/index/' + method;
            params = params || {};
            if (params && typeof params === 'object') {
                for (var param in params) {
                    if (params.hasOwnProperty(param)) {
                        url += '/' + param + '/' + params[param];
                    }
                }
            }
            url += '?format=ajax';
            if (queryParams && typeof queryParams === 'object') {
                for (var q in queryParams) {
                    if (queryParams.hasOwnProperty(q)) {
                        url += '&' + q + '=' + queryParams[q];
                    }
                }
            }

            $.getJSON(url, function (data) {
                return resolve(data);
            }).fail(function (err) {
                return reject(err);
            });
        });
    }

    fetchCtxCred().then(applyCtxCredentials).catch(function (err) {
        jsLog({
            module: 'Annoto',
            err: err,
        });
    });
})(window);
(function (window) {
    var matchMedia = (location.pathname || '').match(/\/(media)\/([^\/]*)\/([^\/,\?]*)/i) || [];
    var mediaFound = matchMedia && matchMedia.length > 0;

    window.KApps = window.KApps || {};
    var appParams = window.KApps.annotoAppParams || {};
    var validClienId = !!(appParams.clientId && typeof appParams.clientId === 'string' && appParams.clientId !== '');

    if (!mediaFound || !validClienId) {
        return;
    }

    console.log("Annoto On Page media: Loading");
    var bootstrapUrl = 'https://cdn.annoto.net/widget/latest/bootstrap.js'; // 'http://localhost:9000/bootstrap.js';

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

    var el = document.createElement('div');
    el.classList.add('span9');
    el.style.width = '65.96%';
    el.style['margin-left'] = 0;
    el.innerHTML = `<div class="wrapper" style="height: 560px;">
                        <div id="demo-media" style="width:100%; height:100%;"></div>
                    </div>`;
    var content = document.getElementById('content');
    content.append(el)
    var e = document.getElementById('demo-media');
    
    var c = {
        clientId: appParams.clientId,
        backend: {
            domain: appParams.deploymentDomain,
        },
        widgets: [{
            player: {
                type: 'page',
                element: e,
                params: { isLive: true },
            },
            host: e,
            ux: {
                tabs: true,
                openOnLoad: true,
                ssoAuthRequestHandle: ssoAuthRequestHandle,
            },
        }],
    };
    var ctxCred;
    var annotoApi;
    var applyCtxDone = false;
    var t = document.createElement('script');
    t.type = 'text/javascript'; t.async = true; t.src = bootstrapUrl;
    t.onload = function () {
        Annoto.on('ready', function (api) {
            console.log('api', api)
            annotoApi = api;
            applyCtxCredentials();
        });
        Annoto.boot(c);
    }
    var ft = document.getElementsByTagName('script')[0]; ft ? ft.parentNode.insertBefore(t, ft) : document.body.appendChild(t);

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

    /**
     *
     * @param {*} method
     * @param {*} params { entryid?: string; categoryid?: string; }
     * @param {*} queryParams
     */
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
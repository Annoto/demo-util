(function (window) {

    var tag_obj = $('.badge');
    var tag_found = false;

    for (var i = 0; i < tag_obj.length; i++) {
        tag_name = tag_obj[i].innerText;
        if (tag_name.includes("collaboration")) {
            tag_found = true;
            console.log("Annoto On Page (Beta): Found Annoto Tag");
        }
    }

    window.KApps = window.KApps || {};
    var appParams = window.KApps.annotoAppParams || {};
    var validClienId = !!(appParams.clientId && typeof appParams.clientId === 'string' && appParams.clientId !== '');

    if ((!tag_found) || (!validClienId)) {
        return;
    }

    console.log("Annoto On Page (Beta): Loading");
    var discussionId = location.href;
    var b = 'https://app.annoto.net/annoto-bootstrap.js';

    var pathMatch = (location.pathname || '').match(/\/(channel|category)\/([^\/]*)\/([^\/,\?]*)/i) || [];
    var groupName = decodeURIComponent(pathMatch[2] || '');
    var groupId = pathMatch[3];

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

    var d = document;
    var e = d.body;
    var c = {
        clientId: appParams.clientId,
        backend: {
            domain: appParams.deploymentDomain,
        },
        align: {
            horizontal: 'screen_edge',
            vertical: 'bottom'
        },
        ux: {
            openOnLoad: false,
            ssoAuthRequestHandle: ssoAuthRequestHandle,
        },
        widgets: [{
            player: {
                type: 'page',
                element: e,
                params: { isLive: true },
                mediaSrc: function () {
                    return discussionId;
                },
                mediaDetails: function (details) {
                    var retVal = details || {};
                    if (!retVal.title) {
                        retVal.title = document.title || 'UNKNOWN';
                    }
                    if (groupId && groupName) {
                        retVal.group = {
                            id: groupId,
                            title: groupName,
                            privateThread: true,
                        };
                    }
                    return retVal;
                }
            }
        }],
    };
    var ctxCred;
    var annotoApi;
    var applyCtxDone = false;
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

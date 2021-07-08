(function (window) {
    var allowedChannels = [
        '112768442',
        '150610591'
    ];
    var x = $('.badge');
    var tag_found=false;
    for (var i=0;i<x.length;i++) {
        tag_name=x[i].innerText;
        if(tag_name.includes("collaboration"))
            tag_found=true;    
    }

    var discussionId = location.href; // Or set a 'custom_discussion_id';
    //var a = 'eyJhbGciOiJIUzI1NiJ9.ZmNkOGNmYWItMzRlZS00MGI1LWI0MDktM2RlZTgwM2NlMDk4.Eg5dDAKT3pKJWelI3JPnpv7xKrWxuZ7Moq6OB8MHTFg';
    var b = 'https://app.annoto.net/annoto-bootstrap.js';
    window.KApps = window.KApps || {};
    var appParams = window.KApps.annotoAppParams || {};
    var validClienId = !!(appParams.clientId && typeof appParams.clientId === 'string' && appParams.clientId !== '');

    var pathMatch = (location.pathname || '').match(/\/(channel|category)\/([^\/]*)\/([^\/,\?]*)/i) || [];
    var groupName = decodeURIComponent(pathMatch[2] || '');
    var groupId = pathMatch[3];

    if ((tag_found) && (!validClienId)) {
        return;
    }

    var ssoAuthRequestHandle = function () {
        var getSsoToken = function() {
            if (!validCtx()) {
                return fetchCtxCred().then(function(cred) {
                    return cred.token;
                });
            } 
            return Promise.resolve(ctxCred.token);
        }
        return getSsoToken().then(function(token) {
            return annotoApi.auth(token);
        });
    }

    var d = document;
    var e = d.body;
    var c = {
        clientId: appParams.clientId,
        backend = {
                    domain: appParams.deploymentDomain,
                };
        align: {
            horizontal: 'screen_edge',
            vertical: 'bottom'
        },
        ux: {
            openOnLoad: true,
            ssoAuthRequestHandle: ssoAuthRequestHandle,
        },
        widgets: [{
            player: {
                type: 'page',
                element: e,
                mediaSrc: function() {
                    return discussionId;
                },
                mediaDetails: function(details) {
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
    t.onload = function() {
        Annoto.on('ready', function(api) {
            annotoApi = api;
            applyCtxCredentials();
        });
        Annoto.boot(c);
    }
    var ft = d.getElementsByTagName('script')[0]; ft ? ft.parentNode.insertBefore(t, ft) : d.body.appendChild(t);

    var applyCtxCredentials = function() {
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

        annotoApi.auth(ctxCred.token).catch(function() {
            applyCtxDone = false;
        });
    }

    var validCtx = function() {
        return !!ctxCred && ctxCred.success;
    }
    var fetchCtxCred = function() {
        return kmsRequest('get-ctx-credentials', null, null).then(function(data) {
            ctxCred = data;
            if (!validCtx()) {
                throw new Error('invalid credentials');
            }
            return ctxCred;
        }).catch(function(err) {
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
    var kmsRequest = function(method, params, queryParams) {
        return new Promise(function(resolve, reject) {
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
            
            $.getJSON(url, function(data) {
                return resolve(data);
            }).fail(function(err) {
                return reject(err);
            });
        });
    }

    fetchCtxCred().then(applyCtxCredentials).catch(function(err) {
        jsLog({
            module: 'Annoto',
            err: err,
        });
    });
})(window);
/* eslint-disable */
(function (window) {
    window.annotoOnPageTagFound = false;
    var annotoOnPageSetupRetryTimer = null;
    function runAnnotoOnPageSetup() {
        var tag_obj = $('.badge');

        for (var i = 0; i < tag_obj.length; i++) {
            tag_name = tag_obj[i].innerText;
            if (tag_name.includes('collaboration')) {
                annotoOnPageTagFound = true;
                console.log('Annoto On Page (Beta): Found Annoto Tag');
            }
        }
        if (!annotoOnPageTagFound) {
            return;
        }
        if (annotoOnPageSetupRetryTimer) {
            clearInterval(annotoOnPageSetupRetryTimer);
            annotoOnPageSetupRetryTimer = null;
        }

        window.KApps = window.KApps || {};
        var appParams = window.KApps.annotoAppParams || {};
        var validClienId = !!(
            appParams.clientId &&
            typeof appParams.clientId === 'string' &&
            appParams.clientId !== ''
        );

        if (!annotoOnPageTagFound || !validClienId) {
            return;
        }
        document.documentElement.style.overflowX = 'hidden';

        console.log('Annoto On Page: Loading');
        var discussionId = location.href;
        var b = 'https://cdn.annoto.net/widget/latest/bootstrap.js'; // 'http://localhost:9000/bootstrap.js';
        var groupPathMatch =
            (location.pathname || '').match(/\/(channel|category)\/([^\/]*)\/([^\/,\?]*)/i) || [];
        var groupName = decodeURIComponent(groupPathMatch[2] || '');
        var groupId = groupPathMatch[3];

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
            };

            if (guestUsersAllowed && !isLoggedIn && siteLoginUrl) {
                window.location.href = siteLoginUrl;
                return;
            }

            return getSsoToken().then(function (token) {
                return annotoApi.auth(token);
            });
        };

        var e = document.body;

        var group =
            groupId && groupName
                ? {
                      id: groupId,
                      title: groupName,
                  }
                : undefined;

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
                    retVal.id = discussionId;
                    return retVal;
                },
            },
            group: group,
            widgets: [
                {
                    player: {
                        type: 'page',
                        element: e,
                    },
                    ux: {
                        layout: 'fixed',
                    },
                },
            ],
        };
        var ctxCred;
        var annotoApi;
        var applyCtxDone = false;
        var d = document;
        var t = d.createElement('script');
        t.type = 'text/javascript';
        t.async = true;
        t.src = b;
        t.onload = function () {
            Annoto.on('ready', function (api) {
                annotoApi = api;
                applyCtxCredentials();
            });
            Annoto.boot(c);
        };
        var ft = d.getElementsByTagName('script')[0];
        ft ? ft.parentNode.insertBefore(t, ft) : d.body.appendChild(t);

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
        };

        var validCtx = function () {
            return !!ctxCred && ctxCred.success;
        };
        var fetchCtxCred = function () {
            return kmsRequest('get-ctx-credentials', null, null)
                .then(function (data) {
                    ctxCred = data;
                    if (!validCtx()) {
                        throw new Error('invalid credentials');
                    }
                    return ctxCred;
                })
                .catch(function (err) {
                    ctxCred = undefined;
                    throw err;
                });
        };

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
        };

        fetchCtxCred()
            .then(applyCtxCredentials)
            .catch(function (err) {
                jsLog({
                    module: 'Annoto',
                    err: err,
                });
            });
    }
    annotoOnPageSetupRetryTimer = setInterval(runAnnotoOnPageSetup, 250);
})(window);

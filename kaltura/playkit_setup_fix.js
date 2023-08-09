/* eslint-disable */
(function (window) {
    window.annotoPlaykigSetupFixDone = false;
    var annotoPlaykigSetupFixRetryTimer = null;
    function runAnnotoPlaykigSetupFix() {
        if (!window.KApps || !KApps.annotoApp || !KApps.annotoAppParams || !KApps.annotoAppParams.clientId) {
            return;
        }
        if (window.annotoOnPageTagFound) {
            return;
        }
        // wait for annotoModuleSetup to be called by the kaf module script to prevent parallel setup
        if (!window.annotoModuleSetupCalled) {
            return;
        }

        if (annotoPlaykigSetupFixDone) {
            if (annotoPlaykigSetupFixRetryTimer) {
                clearInterval(annotoPlaykigSetupFixRetryTimer);
                annotoPlaykigSetupFixRetryTimer = null;
            }
            return;
        }

        if (KApps.annotoApp.playkitService || KApps.annotoApp.kdp) {
            document.documentElement.style.overflowX = 'hidden';
            annotoPlaykigSetupFixDone = true;
            return;
        }
        
        if (typeof window.KalturaPlayer !== 'undefined') {
            KApps.annotoApp.playkitSetupHandle();
        }
    }
    annotoPlaykigSetupFixRetryTimer = setInterval(runAnnotoPlaykigSetupFix, 350);
})(window);

(function (window) {

    var setupAnnotoDashboard = function () {
        console.log('Annoto Yedion: setup dashboard');

        var dashboardUrl = 'https://dashboard.annoto.net'; // 'http://localhost:3333';

        var dashboardContainer = $('.table-responsive div.col-md-10').not('.table-responsive .course_block div.col-md-10');

        var iframeEl = document.createElement('iframe');
        iframeEl.id = 'annoto-dashboard-iframe';
        iframeEl.style.display = 'none';
        iframeEl.style.width = '100%';
        iframeEl.style.height = '100%';
        iframeEl.style.boxSizing = 'border-box';
        iframeEl.style.margin = '0';
        iframeEl.style.padding = '0';
        iframeEl.style.border = '0';
        iframeEl.style.outline = '0';
        iframeEl.style.minHeight = '1024px';
        dashboardContainer.prepend(iframeEl);

        var iframeDoc = iframeEl.contentWindow.document;
        iframeDoc.dir = document.dir;
        iframeDoc.body.style.boxSizing = 'border-box';
        iframeDoc.body.style.margin = '0';
        iframeDoc.body.style.padding = '0';
        iframeDoc.body.style.border = '0';
        iframeDoc.body.style.outline = '0';
        iframeDoc.body.style.fontSize = '1rem';

        var s1 = iframeDoc.createElement('script');
        s1.src = `${dashboardUrl}/build/annotodashboard.esm.js`;
        s1.type = 'module';
        iframeDoc.getElementsByTagName('head')[0].appendChild(s1);

        var s2 = iframeDoc.createElement('script');
        s2.noModule = true;
        s2.src = `${dashboardUrl}/build/annotodashboard.js`;
        s2.type = 'text/javascript';
        iframeDoc.getElementsByTagName('head')[0].appendChild(s2);

        var l1 = iframeDoc.createElement('link');
        l1.rel = 'stylesheet';
        l1.href = `${dashboardUrl}/build/annotodashboard.css`;
        iframeDoc.getElementsByTagName('head')[0].appendChild(l1);

        var sidebarNav2 = document.getElementById('sidebar-nav-2');
        if (sidebarNav2) {
            var navEl = document.createElement(`li`);
            navEl.id = 'yedion-annoto-dashboard';
            navEl.classList = 'list-group-item menu_item';
            navEl.innerHTML = `<i class="fa color-green fa-chart-bar"></i><a href="#" role="button" class="InnerMenuColor">לוח מחוונים</a><span class="flag_ph"></span>`;
            sidebarNav2.appendChild(navEl);

            $('#sidebar-nav-2 li.menu_item').not(navEl).on('click', function (ev) {
                iframeEl.style.display = 'none';
                $(navEl).css({
                    'background-color': 'white',
                });
            });
            $(navEl).on('click', function (ev) {
                ev.preventDefault();
                ev.stopPropagation();
                $('#sidebar-nav-2 li.menu_item').not(navEl).css({
                    'background-color': 'white',
                });
                $('.table-responsive div.col-md-10 .course_block').css({
                    display: 'none',
                });

                if (!iframeDoc.querySelector('nnd-course-root')) {
                    var courseRootEl = iframeDoc.createElement(`nnd-course-root`);
                    
                    courseRootEl.responsive = false;
                    courseRootEl.historyType = 'compose';
                    courseRootEl.composeHistory = false;
                    courseRootEl.composeQueryParam = false;
                    courseRootEl.clientId = AnnotoData.clientId;
                    courseRootEl.courseDetails = {
                        id: AnnotoData.group.id,
                        title: AnnotoData.group.title,
                    };
                    courseRootEl.win = parent.window;
                    courseRootEl.addEventListener('nndReady', function () {
                        console.log('Annoto Yedion: dashboard ready');
                        courseRootEl.authenticateSSO(AnnotoData.userToken);
                    });
                    iframeDoc.body.appendChild(courseRootEl);
                }

                iframeEl.style.display = 'block';
                $(navEl).css({
                    'background-color': 'lightcyan',
                });
            });
        }
    }

    // COMMON

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

        setTimeout(setupAnnotoDashboard, 0);

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
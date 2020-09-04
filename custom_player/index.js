document.cookie = 'same-site-cookie=_ga; SameSite=Lax';
document.cookie = "crossCookie=_ga; SameSite=None; Secure;"
window.onload = function () {

    var controller;
    var showTimeControlbar = 100; //seconds

    document.body.addEventListener('touchmove', function (e) {
        e.preventDefault()
    }, {passive: false})
    var touchpannel = document.getElementById('touchpannel');
    var wrapper = document.getElementById('wrapper');
    var bind_evt = function (id, listener) {
        document.getElementById(id).onclick = listener;
    }


    var touchManager = new Hammer.Manager(touchpannel);
    var singleTap = new Hammer.Tap({event: 'singletap'});
    var doubleTap = new Hammer.Tap({event: 'doubletap', taps: 2});
    var tripleTap = new Hammer.Tap({event: 'tripletap', taps: 3});
    touchManager.add([tripleTap, doubleTap, singleTap]);
    tripleTap.recognizeWith([doubleTap, singleTap]);
    doubleTap.recognizeWith([singleTap]);
    doubleTap.requireFailure(tripleTap);
    singleTap.requireFailure([tripleTap, doubleTap]);

    touchManager.on('singletap', function (ev) {
        ev.preventDefault();
        console.log('SingleTap')
        showControlbar();
        setTimeout(function () {
            hideControlbar();
        }, showTimeControlbar * 1000);
    });
    touchManager.on('doubletap', function (ev) {
        ev.preventDefault();
        console.log('DoubleTap : ' + JSON.stringify(ev.center))
        if (touchpannel.clientWidth / 2 < ev.center.x) {
            controller.ff();
        } else {
            controller.rw();
        }
    });

    var hideAllControlbar = function () {
        document.getElementById('controls').style.display = 'none';
        document.getElementById('touchpannel').style.display = 'none';
        document.getElementById('player').style.zIndex = 3;
    }
    var showControlbar = function () {
        document.getElementById('controls').style.display = 'block';
        document.getElementById('touchpannel').style.display = 'none';
        document.getElementById('player').style.zIndex = -1;
    }
    var hideControlbar = function () {
        document.getElementById('controls').style.display = 'none';
        document.getElementById('touchpannel').style.display = 'block';
        document.getElementById('player').style.zIndex = -1;
    }
    var getTimeString = function (time) {
        var hour = parseInt(time / 3600);
        var mm = time >= 3600 ? parseInt((time - hour * 3600) / 60) : parseInt(time / 60);
        var ss = parseInt(time - hour * 3600 - mm * 60);
        var strHour = hour >= 10 ? '' + hour : '0' + hour;
        var strmm = mm >= 10 ? '' + mm : '0' + mm;
        var strss = ss >= 10 ? '' + ss : ss < 1 ? '00' : '0' + ss;
        if (hour > 0) {
            return strHour + ':' + strmm + ':' + strss;
        } else {
            return strmm + ':' + strss;
        }
    }
    var clickPlayButton = function () {
        if (document.querySelector('#play > i').classList.contains('fa-play-circle') > 0) {
            hideAllControlbar();
            controller.play();
            hideControlbar();
            document.querySelector('#play > i').classList.remove('fa-play-circle');
            document.querySelector('#play > i').classList.add('fa-pause-circle');
        } else if (document.querySelector('#play > i').classList.contains('fa-pause-circle') > 0) {
            hideAllControlbar();
            controller.pause();
            hideControlbar();
            document.querySelector('#play > i').classList.remove('fa-pause-circle')
            document.querySelector('#play > i').classList.add('fa-play-circle')
        }
    }
    var fullscreen = function () {
        if (document.querySelector('#fullscreen > i').classList.contains('fa-expand') > 0) {
            document.getElementById('wrapper').className = 'fullWrapper';
            document.querySelector('#fullscreen > i').classList.remove('fa-expand');
            document.querySelector('#fullscreen > i').classList.add('fa-compress');
        } else if (document.querySelector('#fullscreen > i').classList.contains('fa-compress') > 0) {
            document.getElementById('wrapper').className = 'normalWrapper';
            document.querySelector('#fullscreen > i').classList.remove('fa-compress');
            document.querySelector('#fullscreen > i').classList.add('fa-expand');
        }
    }
    try {
        hideAllControlbar();
        bind_evt("play", clickPlayButton)
        bind_evt("rw", function () {
            controller.rw();
        })
        bind_evt("ff", function () {
            controller.ff();
        })
        bind_evt('fullscreen', fullscreen);
        bind_evt('repeat', function () {
        });


        bind_evt('value_progress', function(evt){
            console.log(evt.clientX);
        });




        controller = new VgControllerClient({
            target_window: document.getElementById('player').contentWindow
        });

        controller.on('ready', function () {
            console.log('ready');
            hideAllControlbar();
            controller.set_control_visibility(false);
            controller.set_controlbar_progress_only(false);
            controller.set_controls_activity(false);
        }).on('loaded', function () {
            console.log('load');
        }).on('disconnected', function () {
            console.log('disconnect');
        });

        controller.on('error', function (error_code) {
            console.log(error_code);
        });
        controller.on('play', function () {
            console.log('play')
            hideControlbar()
            document.querySelector('#play > i').classList.remove('fa-play-circle');
            document.querySelector('#play > i').classList.add('fa-pause-circle');
        });
        controller.on('pause', function () {
            console.log('pause')
            showControlbar()
            document.querySelector('#play > i').classList.remove('fa-pause-circle')
            document.querySelector('#play > i').classList.add('fa-play-circle')
        });
        controller.on('progress', function (percent, position, duration) {

            document.getElementById('duration').innerText = getTimeString(duration);
            document.getElementById('current_time').innerText = getTimeString(position);
            document.getElementById("value_progress").style.width = percent + '%'
            document.getElementById("value_position").style.left = percent + '%'
        });
        controller.on('done', function () {
            console.log('done')
            isPlaying = false
            controller.set_controls_activity(true);
            controller.set_controlbar_progress_only(false);
            overlay.style.display = 'none';
        })
    } catch (e) {
        console.log(e);
    }
}

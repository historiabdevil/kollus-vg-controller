document.cookie = 'same-site-cookie=_ga; SameSite=Lax';
document.cookie = "crossCookie=_ga; SameSite=None; Secure;"
window.onload = function () {

    var controller;
    var showTimeControlbar = 100; //seconds

    document.body.addEventListener('touchmove', function (e) {
        e.preventDefault()
    }, {passive: false})
    var wrapper = document.getElementById('wrapper');
    var touchpannel = document.getElementById('touchpannel');
    var controls = document.getElementById('controls');
    var player = document.getElementById('player');
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

        console.log('SingleTap')
        showControlbar();
        setTimeout(function () {
            hideControlbar();
        }, showTimeControlbar * 1000);
    });
    touchManager.on('doubletap', function (ev) {

        console.log('DoubleTap : ' + JSON.stringify(ev.center))
        if (touchpannel.clientWidth / 2 < ev.center.x) {
            controller.ff();
        } else {
            controller.rw();
        }
    });

    var hideAllControlbar = function () {
        controls.style.display = 'none';
        touchpannel.style.display = 'none';
        player.style.zIndex = 3;
    }
    var showControlbar = function () {
        controls.style.display = 'block';
        touchpannel.style.display = 'none';
        player.style.zIndex = -1;
    }
    var hideControlbar = function () {
        controls.style.display = 'none';
        touchpannel.style.display = 'block';
        player.style.zIndex = -1;
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
            wrapper.className = 'fullWrapper';
            document.querySelector('#fullscreen > i').classList.remove('fa-expand');
            document.querySelector('#fullscreen > i').classList.add('fa-compress');
        } else if (document.querySelector('#fullscreen > i').classList.contains('fa-compress') > 0) {
            wrapper.className = 'normalWrapper';
            document.querySelector('#fullscreen > i').classList.remove('fa-compress');
            document.querySelector('#fullscreen > i').classList.add('fa-expand');
        }
    }
    var setVolumeUI = function (value) {
        document.getElementById("volume_inner").style.width = value + '%'
        document.getElementById("volume_position").style.left = value + '%'
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
        bind_evt('mute', function () {
            controller.mute();
        });
        bind_evt('progress', function (evt) {
            var percent = (evt.clientX / wrapper.clientWidth);
            var position = duration * percent;
            controller.play(parseInt(position));
            console.log('progerss clicked: ' + percent)
        });
        bind_evt('volume_outer', function (evt) {
            var outer_width = document.getElementById('volume_outer').clientWidth;
            var volume = parseInt((evt.clientX / outer_width) * 100);
            console.log('volume clicked: ' + volume)
            controller.set_volume(volume);
        });


        // bind_evt('value_progress', function(evt){
        //     console.log(evt.clientX);
        // });


        controller = new VgControllerClient({
            target_window: document.getElementById('player').contentWindow
        });

        controller.on('ready', function () {
            console.log('ready');
            hideAllControlbar();
            controller.set_control_visibility(false);
            controller.set_controlbar_progress_only(false);
            controller.set_controls_activity(false);
            controller.set_controls_inactive_time(9999999999999999);
            setVolumeUI(controller.get_volume());
        }).on('loaded', function () {
            console.log('load');
        }).on('disconnected', function () {
            console.log('disconnect');
        }).on('error', function (error_code) {
            console.log(error_code);
        }).on('play', function () {
            console.log('play')
            hideControlbar()
            document.querySelector('#play > i').classList.remove('fa-play-circle');
            document.querySelector('#play > i').classList.add('fa-pause-circle');
        }).on('pause', function () {
            console.log('pause')
            showControlbar()
            document.querySelector('#play > i').classList.remove('fa-pause-circle')
            document.querySelector('#play > i').classList.add('fa-play-circle')
        }).on('progress', function (percent, position, duration) {
            document.getElementById('duration').innerText = getTimeString(duration);
            document.getElementById('current_time').innerText = getTimeString(position);
            document.getElementById("value_progress").style.width = percent + '%'
            document.getElementById("value_position").style.left = percent + '%'
        }).on('done', function () {
        }).on('muted', function (isMuted) {
            var mute = document.querySelector('#mute > i');
            if (isMuted) {
                mute.classList.remove('fa-volume-mute');
                mute.classList.add('fa-volume');
            } else {
                mute.classList.add('fa-volume-mute');
                mute.classList.remove('fa-volume');
            }
        }).on('volumechnage', function (volume) {
            setVolumeUI(volume);
        })
    } catch (e) {
        console.log(e);
    }
}

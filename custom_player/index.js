!(function ($, window) {
    // variable initialize
    var controller;
    var showTimeControlbar = 5; //seconds

    var isFullscreen = false;
    var screenOrientation;
    var wrapper = document.getElementById('wrapper');
    var touchpannel = document.getElementById('touchpannel');
    var controls = document.getElementById('controls');
    var player = document.getElementById('player');
    var bind_evt = function (id, listener) {
        document.getElementById(id).onclick = listener;
    }


    /*
    * 브라우저 판별
    * */
    const browser = (function (userAgent) {
        if (userAgent.toLowerCase().indexOf('edge') > -1) {
            return 'edge';
        } else if (userAgent.toLowerCase().indexOf('whale') > -1) {
            return 'whale';
        } else if (userAgent.toLowerCase().indexOf('chrome') > -1) {
            return 'chrome';
        } else if (userAgent.toLowerCase().indexOf('firefox') > -1) {
            return 'fireox';
        } else if (userAgent.toLowerCase().indexOf('safari') > -1) {
            return 'safari'
        } else {
            return 'ie';
        }
    })(window.navigator.userAgent);
    /*디바이스 Orientation Check event
    * window.orientation의 경우 deprecated 되고
    * window.screen 객체를 이용하여 orientation 변경 이벤트를 받아야 하나
    * ios safari의 경우에는 지원하지 않음 따라서 window.orientation을 사용 해야함
    * deviceorientation event를 사용 해야 할경우에는 SSL 이 적용 되어 있는 페이지여야 함.
    * */
    const funOri = function (angle) {
        var ori;
        if (angle == 90 || angle == -90) {
            ori = 'landscape'

        } else {
            ori = 'portrait'
        }
        $(window).trigger('evtOri', [ori]);
        return ori;
    }

    if (typeof window.orientation == 'number' && typeof window.onorientationchange == 'object') {
        funOri(window.orientation);
        console.log('init orientation : ' + screenOrientation);
        $(window).on('resize', function () {
            funOri(window.orientation);
            console.log('event orientation : ' + screenOrientation);
        });
    } else {
        console.log('init orientation : ' + window.screen.orientation.angle);
        funOri(window.screen.orientation.angle);
        $(window.screen.orientation).on('change', function (evt) {
            console.log('event orientation : ' + evt.currentTarget.angle)
            funOri(evt.currentTarget.angle)
        });
    }
    $(window).on('evtOri', function (event, orientaion) {
        screenOrientation = orientaion;
        fullscreen();
    });

    /*
    * 탭 관련 이벤트 정의
    * */
    // document.body.addEventListener('touchmove', function (e) {
    //     e.preventDefault()
    // }, {passive: false})


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
        showControlbar();
        setTimeout(function () {
            hideControlbar();
        }, showTimeControlbar * 1000);
    });
    var drawSeek = function (seek) {
        var direction = seek == 'ff' ? 'right' : 'left'
        var white = 65;
        var timer = setInterval(function () {
            touchpannel.style.background = 'linear-gradient(to ' + direction + ', transparent 65%, white ' + white + '%, transparent 110%)'
            white += 5;
            if (white > 105) {
                touchpannel.style.background = 'url(data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7)';
                clearInterval(timer);
            }
        }, 40);
    }
    var drawSeekRadial = function (seek) {

        var white = 50;
        touchpannel.style.width = '33%';
        if (seek == 'ff') {
            touchpannel.style.left = '67%';
            touchpannel.style.borderBottomLeftRadius = '200%';
            touchpannel.style.borderTopLeftRadius = '200%';
        } else {
            touchpannel.style.left = '0';
            touchpannel.style.borderBottomRightRadius = '200%';
            touchpannel.style.borderTopRightRadius = '200%';
        }
        var timer = setInterval(function () {
            if (seek == 'ff') {
                touchpannel.style.background = 'radial-gradient( circle at 100% 50%, rgba(255, 255,255, 0.5) ' + white + '%, transparent 100%)';
            } else {
                touchpannel.style.background = 'radial-gradient( circle at 0% 50%, rgba(255, 255,255, 0.5) ' + white + '%, transparent 100%)';
            }
            white += 10;
            if (white > 100) {
                touchpannel.style.background = 'url(data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7)';
                touchpannel.style.borderRadius = '0';
                touchpannel.style.width = '100%';
                touchpannel.style.left = '0';
                clearInterval(timer);
            }
        }, 80);
    }
    touchManager.on('doubletap', function (ev) {
        if (touchpannel.clientWidth / 2 < ev.center.x) {
            ff();
            // drawSeek('ff');
            drawSeekRadial('ff');
        } else {
            rw();
            //drawSeek('rw');
            drawSeekRadial('rw');
        }
    });

    /**
     * control UI 관련 함수
     */
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

    var fullscreen = function () {
        if (screenOrientation === 'landscape') {
            wrapper.className = 'fullWrapper';
            document.querySelector('#fullscreen > i').classList.remove('fa-expand');
            document.querySelector('#fullscreen > i').classList.add('fa-compress');
            wrapper.style.height = document.documentElement.clientHeight + 'px';
            wrapper.style.removeProperty('padding-bottom');
            isFullscreen = true;
        } else {
            if (!isFullscreen) {
                wrapper.className = 'fullWrapper';
                document.querySelector('#fullscreen > i').classList.remove('fa-expand');
                document.querySelector('#fullscreen > i').classList.add('fa-compress');
                wrapper.style.height = document.documentElement.clientHeight + 'px';
                wrapper.style.removeProperty('padding-bottom');
                isFullscreen = true;
            } else {
                wrapper.className = 'normalWrapper';
                document.querySelector('#fullscreen > i').classList.remove('fa-compress');
                document.querySelector('#fullscreen > i').classList.add('fa-expand');
                wrapper.style.height = '0px';
                // wrapper.style.removeProperty('padding-bottom');
                isFullscreen = false;
            }
        }
    }

    var playAndPause = function () {
        if (document.querySelector('#play > i').classList.contains('fa-play-circle') > 0) {
            hideAllControlbar();
            controller.play();
            hideControlbar();

        } else if (document.querySelector('#play > i').classList.contains('fa-pause-circle') > 0) {
            controller.pause();
            hideControlbar();
        }
    }
    var rw = function () {
        controller.rw();
    }
    var ff = function () {
        controller.ff();
    }
    var setVolumeUI = function (value) {
        document.getElementById("volume_inner").style.width = value + '%'
        document.getElementById("volume_position").style.left = value + '%'
    }
    var setVolume = function (evt) {
        var outer_width = document.getElementById('volume').offsetWidth;
        var volume = parseInt((evt.offsetX / outer_width) * 100);
        console.log('volume clicked: ' + volume)
        controller.set_volume(volume);
    }
    var setProgressUI = function (percent, position, duration) {
        document.getElementById('duration').innerText = getTimeString(duration);
        document.getElementById('current_time').innerText = getTimeString(position);
        document.getElementById("value_progress").style.width = percent + '%'
        document.getElementById("value_position").style.left = percent + '%'
    }
    var setProgress = function (evt) {
        var percent = (evt.clientX / wrapper.clientWidth);
        var duration = controller.get_progress().duration;
        var position = duration * percent;
        controller.play(parseInt(position));
        console.log('progerss clicked: ' + position)
    }
    var setRepeat = function () {
        var repeat_data = controller.get_repeat();
        if (repeat_data.status == 'cancel') {
            var percent = parseInt(controller.get_progress().percent);
            controller.set_repeat_start()
            document.getElementById("value_repeat").style.left = percent + '%';
            document.getElementById("value_repeat").style.width = '2px';
            document.getElementById('repeatA').style.color = 'red'
        } else if (repeat_data.status == 'start') {
            var percent = parseInt(controller.get_progress().percent);
            var start = document.getElementById("value_repeat").style.left.replace('%', '');
            var width = parseInt(percent - start);
            document.getElementById("value_repeat").style.width = width + '%';
            controller.set_repeat_end()
            document.getElementById('repeatB').style.color = 'red'
        } else if (repeat_data.status == 'end') {
            controller.unset_repeat()
            document.getElementById("value_repeat").style.left = '0%';
            document.getElementById("value_repeat").style.width = '0px';
            document.getElementById('repeatA').style.color = 'white'
            document.getElementById('repeatB').style.color = 'white'
        }
    }
    var mute = function () {
        controller.mute();
    }
    var setMuteUI = function (isMuted) {
        var mute = document.querySelector('#mute > i');
        if (isMuted) {
            mute.classList.remove('fa-volume-mute');
            mute.classList.add('fa-volume-up');
        } else {
            mute.classList.add('fa-volume-mute');
            mute.classList.remove('fa-volume-up');
        }
    }


    var playerInitialize = function () {
        var nscreen_position;
        try {
            var setNscreen = function(){
                var settings = {
                    "url": "https://api.kr.kollus.com/0/media_auth/nscreen/index?access_token=7ge80tfvz51x2606&media_content_key=FuYgfrvk&client_user_id=hdyang",
                    "method": "GET",
                    "timeout": 0,
                };

                $.ajax(settings).done(function (response) {
                    controller.pause();
                    nscreen_position = JSON.parse(response).result['last_position'];
                    if(position > 0){
                        document.getElementById('nscreen_time').innerText = getTimeString(position);
                        document.getElementById('nscreen_popup').style.display = 'block';
                    }
                });
            }
            var writeNscreen = function(){
                var position = controller.get_progress().position;
                var settings = {
                    "url": "https://api.kr.kollus.com/0/media_auth/nscreen/register?access_token=7ge80tfvz51x2606",
                    "method": "POST",
                    "timeout": 0,
                    "headers": {
                        "Content-Type": "application/x-www-form-urlencoded"
                    },
                    "data": {
                        "media_content_key": "FuYgfrvk",
                        "client_user_id": "hdyang",
                        "position": position
                    }
                };

                $.ajax(settings).done(function (response) {
                    console.log(response);
                });
            }
            $(window).on('unload', function (e) {
                e.preventDefault();
                writeNscreen();
            });



            hideAllControlbar();
            bind_evt("setting", function () {
                document.getElementById("setting_menu").style.display = "block";
            })
            bind_evt("setting_close", function () {
                document.getElementById("setting_menu").style.display = "none";
            })
            document.getElementById('sel_speed').addEventListener('change',
                function () {
                    controller.set_speed(this.value);
                });

            document.getElementById('sel_step').addEventListener('change',
                function () {
                    controller.set_jumpstep(this.value);
                });
            bind_evt('nscreen_ok', function(){
                controller.play(nscreen_position);
                document.getElementById('nscreen_popup').style.display = 'none';
            });
            bind_evt('nscreen_cancel', function(){
                controller.play(0);
                document.getElementById('nscreen_popup').style.display = 'none';
            });

            //플레이어 커스텀 버튼 이벤트 연동
            bind_evt("play", playAndPause);
            bind_evt("rw", rw);
            bind_evt("ff", ff);
            bind_evt('fullscreen', fullscreen);
            bind_evt('repeat', setRepeat);
            bind_evt('mute', mute);
            bind_evt('progress', setProgress);
            bind_evt('volume', setVolume);

            controller = new VgControllerClient({
                target_window: document.getElementById('player').contentWindow
            });
            controller.on('loaded', function () {
                console.log('load');
            });
            controller.on('ready', function () {
                console.log('ready');
                controller.set_control_visibility(false);
                controller.set_controlbar_progress_only(false);
                controller.set_controls_activity(false);
                controller.set_controls_inactive_time(9999999999999999);
                setVolumeUI(controller.get_volume());
                setNscreen();
                showControlbar();
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
                writeNscreen();
            });
            controller.on('progress', setProgressUI);
            controller.on('done', function () {
                writeNscreen();
            });
            controller.on('muted', setMuteUI);
            controller.on('volumechange', setVolumeUI);

        } catch (e) {
            console.log(e);
        }

    }

    playerInitialize();

})(jQuery, window);

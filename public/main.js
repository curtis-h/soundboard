// pagemode - false is player, true is controller
var PageMode = location.pathname.indexOf('play') > -1 ? false : true;
var Socket   = io();

var app = angular.module('Soundboard', [])
.controller('soundBoardController', ['$scope', function($scope) {
    $scope.PageMode        = PageMode;
    $scope.focus           = false;
    $scope.categories      = [];
    $scope.newCategoryName = '';
    
    $scope.$watch('PageMode', function(newVal) {
        console.log('page mode', newVal);
        PageMode = newVal;
    });
    
    
    $scope.addCategory = function() {
        if(!!$scope.newCategoryName && $scope.newCategoryName.length) {
            var cat = {
                name: $scope.newCategoryName,
                sounds: []
            };
            
            Socket.emit('save', cat);
        }
    };
    
    $scope.$on('addSound', function(event, data) {
        $scope.focus = event.targetScope.category;
        console.log($scope.focus);
    });
    
    $scope.addSound = function() {
        if(!!$scope.newSound.name && !!$scope.newSound.link) {
            var id = getYoutubeId($scope.newSound.link);
            
            if(id) {
                
                // TODO - check for existence
                $scope.newSound.ident = id;
                $scope.focus.sounds.push($scope.newSound);
                console.log($scope.focus);
                Socket.emit('save', $scope.focus);
                newSound();
            }
        }
    };
    

    Socket.on('categories', function(cats) {
        console.log('categories', cats);
        $scope.$apply(function() {
            $scope.categories = cats;
        });
    });
    
    Socket.on('saved', function(cat) {
        $scope.$apply(function() {
            console.log('saved', cat);
            var found = false;
            
            if($scope.categories.length) {
                angular.forEach($scope.categories, function(category) {
                    if(cat._id == category._id) {
                        category = cat;
                        found = true;
                    }
                });
            }
            
            if(!found) {
                $scope.categories.push(cat);
            }
            
            $scope.newCategoryName = '';
        });
    });
    
    var lut = [];
    for(var i=0; i<256; i++) {
        lut[i] = (i<16?'0':'')+(i).toString(16);
    }
    
    function uuid() {
        var d0 = Math.random()*0xffffffff|0;
        var d1 = Math.random()*0xffffffff|0;
        var d2 = Math.random()*0xffffffff|0;
        var d3 = Math.random()*0xffffffff|0;
        return lut[d0&0xff]+lut[d0>>8&0xff]+lut[d0>>16&0xff]+lut[d0>>24&0xff]+'-'+
            lut[d1&0xff]+lut[d1>>8&0xff]+'-'+lut[d1>>16&0x0f|0x40]+lut[d1>>24&0xff]+'-'+
            lut[d2&0x3f|0x80]+lut[d2>>8&0xff]+'-'+lut[d2>>16&0xff]+lut[d2>>24&0xff]+
            lut[d3&0xff]+lut[d3>>8&0xff]+lut[d3>>16&0xff]+lut[d3>>24&0xff];
    }
    
    function newSound() {
        $scope.newSound = {
            uuid: uuid(),
            name: '',
            link: '',
            ident: ''
        };
    }
    newSound();
    
    function getYoutubeId(text) {
        var regex  = /(?:https:\/\/)?(?:[0-9A-Z-]+\.)?(?:youtu\.be\/|youtube(?:-nocookie)?\.com\S*[^\w\s-])([\w-]{11})(?=[^\w-]|$)(?![?=&+%\w.-]*(?:['"][^<>]*>|<\/a>))[?=&+%\w.-]*/ig;
        var result =  regex.exec(text);

        return (!!result && !!result[1]) ? result[1] : false
    }
}]);


app.directive('category', function() {
    return {
        scope: {
            category: "="
        },
        templateUrl: 'templates/category',
        link: function($scope, element, attrs) {
            $scope.addSound = function() {
                $scope.$emit('addSound');
            }
        }
    };
});

app.directive('youtube', function() {
    return {
        scope: {
            sound: "=youtube"
        },
        templateUrl: 'templates/youtube',
        link: function($scope, element, attrs) {
            var videoId = $scope.sound.ident;
            var player;
            $scope.playing = false;
            $scope.ready   = false;
            
            $scope.toggle = function() {
                if($scope.playing) {
                    pause();
                }
                else {
                    play();
                }
            };
            
            Socket.on('SongStateChange', function(data) {
                $scope.$apply(function() {
                    if(data.uuid == $scope.sound.uuid) {
                        console.log('song state changed', data);
                        /*
                        UNSTARTED: -1
                        ENDED: 0
                        PLAYING: 1
                        PAUSED: 2
                        BUFFERING: 3
                        CUED: 5
                         */
                        switch(data.status) {
                            case YT.PlayerState.PLAYING: play();      break;
                            case YT.PlayerState.PAUSED:  pause();     break;
                            default:                     stop(true);  break;
                        }
                    }
                });
            });
            
            function onYouTubeIframeAPIReady() {
                if(PageMode) { return; }
                var elem = element[0].querySelector('.player');
                
                player = new YT.Player(elem, {
                    height: '0',
                    width: '0',
                    videoId: videoId,
                    events: {
                      'onReady': onPlayerReady,
                      'onStateChange': onPlayerStateChange
                    }
                });
            };

            // 4. The API will call this function when the video player is ready.
            function onPlayerReady(event) {
                console.log(event);
                $scope.ready = true;
            }

            function onPlayerStateChange(event) {
                $scope.$apply(function() {
                    console.log('change', event);
                    
                    if(!PageMode && !!event && typeof(event.data) != 'undefined' && event.data == 0) {
                        stop();
                        Socket.emit('SongStateChange', {uuid: $scope.sound.uuid, status: YT.PlayerState.ENDED});
                    }
                });
            }
            
            function play() {
                $scope.playing = true;
                if(PageMode) {
                    Socket.emit('SongStateChange', {uuid: $scope.sound.uuid, status: YT.PlayerState.PLAYING});
                }
                else {
                    player.playVideo();
                }
            }
            
            function pause() {
                $scope.playing = false;
                if(PageMode) {
                    Socket.emit('SongStateChange', {uuid: $scope.sound.uuid, status: YT.PlayerState.PAUSED});
                }
                else {
                    player.pauseVideo();
                }
            }
            
            function stop(received) {
                $scope.playing = false;
                if(PageMode) {
                    if(!!received)
                        Socket.emit('SongStateChange', {uuid: $scope.sound.uuid, status: YT.PlayerState.ENDED});
                }
                else {
                    player.stopVideo();
                    player.seekTo(0);
                }
            }
            
            onYouTubeIframeAPIReady();
        }
    };
});
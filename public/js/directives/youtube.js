/*
 * youtube player statuses
    UNSTARTED: -1
    ENDED: 0
    PLAYING: 1
    PAUSED: 2
    BUFFERING: 3
    CUED: 5
*/
app.directive('youtube', ['dbService', function(db) {
    return {
        scope: {
            sound: "=youtube",
            position: '=pos'
        },
        templateUrl: 'templates/youtube',
        link: function($scope, element, attrs) {
            var player;
            var videoId  = $scope.sound.ident;
            $scope.ready = false;

            $scope.$on('change', function(event, data) {
                angular.forEach(data.docs, function(doc) {
                    if(doc._id == $scope.sound._id) {
                        db.get($scope.sound._id).then(function(sound) {
                            $scope.$apply(function() {
                                console.log('sound get');
                                console.log(sound);

                                $scope.sound = sound;

                                switch($scope.sound.playing) {
                                    case 2:     play();     break;
                                    case 1:     pause();    break;
                                    case 0:
                                    default:    stop();     break;
                                }

                                if($scope.sound.playing == 2) {
                                    element.addClass('playing');
                                }
                                else {
                                    element.removeClass('playing');
                                }
                            });
                        });
                    }
                });
            });

            $scope.toggle = function() {
                $scope.sound.playing = $scope.sound.playing < 2 ? 2 : 1;
                db.updateSound($scope.sound);
            };

            $scope.stop = function() {
                $scope.sound.playing = 0;
                db.updateSound($scope.sound);
            };

            $scope.loop = function() {
                $scope.sound.loop = !$scope.sound.loop;
                db.updateSound($scope.sound);
            };


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
                    console.log('sound change', event);

                    if(!PageMode && !!event && typeof(event.data) != 'undefined' && event.data == 0) {
                        // reset player to start
                        player.seekTo(0);

                        if($scope.sound.loop) {
                            play();
                        }
                        else {
                            $scope.stop();
                        }
                    }
                });
            }

            function play() {
                if(!PageMode) {
                    player.playVideo();
                }
            }

            function pause() {
                if(!PageMode) {
                    player.pauseVideo();
                }
            }

            function stop(received) {
                if(!PageMode) {
                    player.seekTo(0);
                    player.stopVideo();
                }
            }

            //onYouTubeIframeAPIReady();

            //TODO on destroy events
        }
    };
}]);

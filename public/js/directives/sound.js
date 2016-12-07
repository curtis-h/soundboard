/*
 * abstract sound controls
 */
app.directive('sound', ['dbService', function(db) {
    return {
        scope: {
            sound:    "=",
            position: "=pos"
        },
        templateUrl: 'templates/sound',
        link: function($scope, element, attrs) {
            var videoId = $scope.sound.ident;
            var player;
            
            $scope.playing = 0;

            $scope.$watch('playing', function(newVal, oldVal) {
                console.log('player change', oldVal, newVal);
                console.log(player);
                
                switch(newVal) {
                    case 0:
                        if(!!player) {
                            player.destroy();
                        }
                        break;
                    case 1:
                        player.pauseVideo();
                        break;
                    case 2:
                        if(!!oldVal) {
                            player.playVideo();
                        }
                        else {
                            addPlayer();
                        }
                        break;
                }
            });
            
            $scope.toggle = function() {
                $scope.playing = $scope.playing < 2 ? 2 : 1;
            };

            $scope.stop = function() {
                $scope.playing = 0;
            };

            $scope.loop = function() {
                $scope.sound.loop = !$scope.sound.loop;
                db.updateSound($scope.sound);
            };

            element.attr("draggable", "true");
            element.bind('dragstart', function(event) {
                $scope.$apply(function() {
                    $scope.$root.draggable = $scope.sound;
                });
            });

            element.bind('dragover', function(event) {
                if($scope.$root.draggable._id != $scope.sound._id) {
                    $scope.$emit('sort', $scope.position);
                }
            });
            
            
            function addPlayer() {
                console.log('add player');
                var elem = element[0].querySelector('.player');

                player = new YT.Player(elem, {
                    videoId: videoId,
                    height: '0',
                    width:  '0',
                    events: {
                      'onReady': onPlayerReady,
                      'onStateChange': onPlayerStateChange
                    }
                });
            }
            
            // 4. The API will call this function when the video player is ready.
            function onPlayerReady(event) {
                console.log('ready', event);
                player.playVideo();
            }

            function onPlayerStateChange(event) {
                console.log('sound change', event);

                if(!!event && typeof(event.data) != 'undefined' && event.data == 0) {
                    // reset player to start
                    player.seekTo(0);
                    /*
                    if($scope.sound.loop) {
                        play();
                    }
                    else {
                        $scope.stop();
                    }
                    //*/
                }
            }
            
        }
    };
}]);

var app = angular.module('Soundboard', [])
.controller('soundBoardController', ['$scope', function($scope) {
    $scope.focus = false;
    $scope.categories = [];
    
    
    $scope.addCategory = function() {
        if(!!$scope.newCategoryName && $scope.newCategoryName.length) {
            var cat = {
                name: $scope.newCategoryName,
                sounds: []
            };
            $scope.categories.push(cat);
            $scope.newCategoryName = '';
        }
    };
    
    $scope.addSoundPopup = function(category) {
        
        $scope.focus = category;
        console.log($scope.focus);
    };
    
    $scope.addSound = function() {
        if(!!$scope.newSoundName) {
            $scope.focus.sounds.push($scope.newSoundName);
            console.log($scope.focus);
            $scope.newSoundName = '';
        }
    };
}]);

app.directive('youtube', function() {
    return {
        scope: {
            data: "=youtube"
        },
        template: '<div><h3>Sound {{ $id }}</h3><div class="controls"><button ng-click="toggle()">Play</button></div><div class="player"></div></div>',
        link: function($scope, element, attrs) {
            var player;
            var playing = false;
            
            $scope.ready = false;
            
            $scope.toggle = function() {
                if(playing) {
                    playing = false;
                    player.pauseVideo();
                }
                else {
                    playing = true;
                    player.playVideo();
                }
            };
            
            function onYouTubeIframeAPIReady() {
                var e = element[0].querySelector('.player');
                
              player = new YT.Player(e, {
                height: '0',
                width: '0',
                videoId: 'M7lc1UVf-VE',
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
                console.log('change', event);
            }
            
            function stopVideo() {
                player.stopVideo();
            }
            
            onYouTubeIframeAPIReady();
        }
    };
});
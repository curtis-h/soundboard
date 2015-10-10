var socket = io();

var app = angular.module('Soundboard', [])
.controller('soundBoardController', ['$scope', function($scope) {
    $scope.focus      = false;
    $scope.categories = [];
    
    
    $scope.addCategory = function() {
        if(!!$scope.newCategoryName && $scope.newCategoryName.length) {
            var cat = {
                name: $scope.newCategoryName,
                sounds: []
            };
            
            socket.emit('save', cat);
        }
    };
    
    $scope.addSoundPopup = function(category) {
        
        $scope.focus = category;
        console.log($scope.focus);
    };
    
    $scope.addSound = function() {
        if(!!$scope.newSoundName) {
            var id = getYoutubeId($scope.newSoundName);
            
            if(!!id && !!id[1]) {
                console.log(id);
                id = id[1];
                // TODO - check for existance
                // TODO - save to server
                
            }
            return;
            $scope.focus.sounds.push();
            console.log($scope.focus);
            $scope.newSoundName = '';
        }
    };
    
    socket.on('saved', function(cat) {
        $scope.$apply(function() {
            console.log('saved', cat);
            $scope.categories.push(cat);
            $scope.newCategoryName = '';
        });
    });
    
    
    function getYoutubeId(text) {
        var regex = /https?:\/\/(?:[0-9A-Z-]+\.)?(?:youtu\.be\/|youtube(?:-nocookie)?\.com\S*[^\w\s-])([\w-]{11})(?=[^\w-]|$)(?![?=&+%\w.-]*(?:['"][^<>]*>|<\/a>))[?=&+%\w.-]*/ig;
        return regex.exec(text);
    }
}]);

app.directive('youtube', function() {
    return {
        scope: {
            data: "=youtube"
        },
        template: '<div><h3>Sound {{ $id }}</h3><div class="controls"><button ng-click="toggle()">Play</button></div><div class="player"></div></div>',
        link: function($scope, element, attrs) {
            console.log($scope.data);
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
                var elem = element[0].querySelector('.player');
                var vid  = getVideoId($scope.data);
                
                player = new YT.Player(elem, {
                    height: '0',
                    width: '0',
                    videoId: vid,
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
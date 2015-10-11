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
                $scope.focus.sounds.push(id);
                console.log($scope.focus);
                socket.emit('save', $scope.focus);
                $scope.newSoundName = '';
                
            }
        }
    };
    

    socket.on('categories', function(cats) {
        console.log('categories', cats);
        $scope.$apply(function() {
            console.log($scope.categories);
            $scope.categories = cats;
        });
    });
    
    socket.on('saved', function(cat) {
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
            var videoId = $scope.data;
            var playing = false
            var player;
            
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
                console.log('change', event);
            }
            
            function stopVideo() {
                player.stopVideo();
            }
            
            onYouTubeIframeAPIReady();
        }
    };
});
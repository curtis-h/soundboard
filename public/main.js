var socket = io();

var app = angular.module('Soundboard', [])
.controller('soundBoardController', ['$scope', function($scope) {
    $scope.focus           = false;
    $scope.categories      = [];
    $scope.newCategoryName = '';
    
    
    $scope.addCategory = function() {
        if(!!$scope.newCategoryName && $scope.newCategoryName.length) {
            var cat = {
                name: $scope.newCategoryName,
                sounds: []
            };
            
            socket.emit('save', cat);
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
                socket.emit('save', $scope.focus);
                newSound();
            }
        }
    };
    

    socket.on('categories', function(cats) {
        console.log('categories', cats);
        $scope.$apply(function() {
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
    
    function newSound() {
        $scope.newSound = {
            name: '',
            link: '',
            ident: ''
        };
    }
    
    
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
                $scope.$emit('addSound', 'test');
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
                    $scope.playing = false;
                    player.pauseVideo();
                }
                else {
                    $scope.playing = true;
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
                $scope.$apply(function() {
                    if(!!event && typeof(event.data) != 'undefined' && event.data == 0) {
                        $scope.playing = false;
                    }
                });
            }
            
            function stopVideo() {
                player.stopVideo();
            }
            
            onYouTubeIframeAPIReady();
        }
    };
});
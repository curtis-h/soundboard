/**
 * the primary js file, for initial setup of objects and vars
 */
// unique user id so we can extend to multiple users later
var UID = 1;
//pagemode - false is player, true is controller
var PageMode = location.pathname.indexOf('play') > -1 ? false : true;

var app = angular.module('Soundboard', []);

app.run(['$rootScope', 'dbService', function($rootScope, db) {
    console.log($rootScope);
    db.connect().on('change', function(data) {
        console.log('sync change', data.direction);
        console.log(data);
        $rootScope.$broadcast('change', data.change);
    }).on('error', function (err) {
        // handle error
        console.log('error');
    });
}]);

function getYoutubeId(text) {
    var regex  = /(?:https:\/\/)?(?:[0-9A-Z-]+\.)?(?:youtu\.be\/|youtube(?:-nocookie)?\.com\S*[^\w\s-])([\w-]{11})(?=[^\w-]|$)(?![?=&+%\w.-]*(?:['"][^<>]*>|<\/a>))[?=&+%\w.-]*/ig;
    var result =  regex.exec(text);

    return (!!result && !!result[1]) ? result[1] : false
}

app.controller('SoundboardController', ['$scope', 'dbService', function($scope, db) {
    $scope.PageMode     = PageMode;
    $scope.categoryName = '';

    db.getCategories().then(function(data) {
        $scope.$apply(function() {
            $scope.categories = data;
        });
    });

    $scope.addCategory = function() {
        db.newCategory($scope.categoryName).then(function(success) {
            console.log('new cat', success);
            if(!!success) {
                $scope.$apply(function(){
                    $scope.categoryName = '';
                });
            }
        });
    };

    $scope.$on('addSound', function(event, data) {
        $scope.focus = event.targetScope.category;
    });

    $scope.addSound = function() {
        if(!!$scope.newSound.name && $scope.newSound.link) {
            var ytid = getYoutubeId($scope.newSound.link);
            
            if(!!ytid) {
                db.newSound($scope.focus._id, $scope.newSound, ytid)
                .then(function(success) {
                    console.log('new sound success', success);
                    if(!!success) {
                        $scope.$apply(function() {
                            $scope.newSound.name = '';
                            $scope.newSound.link = '';
                        });
                    }
                });
            }
        }
    };
}]);

// TODO - move to own file
app.directive('category', ['dbService', function(db) {
    return {
        scope: {
            category: "="
        },
        templateUrl: 'templates/category',
        link: function($scope, element, attrs) {
            $scope.addSound = function() {
                $scope.$emit('addSound');
            }

            $scope.playAll = function() {
                console.log('play all');
            };

            db.getSounds($scope.category._id).then(function(data) {
                $scope.$apply(function() {
                    $scope.sounds = data;
                });
            });

            $scope.$on('sort', function(event, position) {
                $scope.$apply(function() {
                    var filtered = $scope.sounds.filter(function(sound) {
                        return sound._id != $scope.$root.draggable._id;
                    });

                    filtered.splice(position, 0, $scope.$root.draggable);
                    $scope.sounds = filtered;
                });
            });
        }
    };
}]);

app.service('dbService', [function() {
    // db setup
    var dbName = 'soundboard';
    var dbUrl  = 'http://couch.curtish.me/';
    var db;
    
    var handleSuccess = function() {
        return true;
    };
    
    this.connect = function() {
        db = new PouchDB(dbName);
    
        // define sync
        return db.sync(dbUrl+dbName, {live: true, retry: true});
    };
    
    this.get = function(id) {
        return db.get(id).then(function(doc) {
            return doc;
        })
        .catch(function(error) {
            console.log('fetch error');
            console.log(error);
        });
    };
    
    this.getCategories = function() {
        return db.allDocs({
            include_docs: true,
            startkey:     'category',
            endkey:       'category\uffff'
        })
        .then(function(results) {
            return results.rows.map(function(row) {
                return row.doc;
            });
        })
        .catch(function(err) {
            console.log('error', error);
            return [];
        });
    };
    
    
    this.getSounds = function(categoryId) {
        return db.allDocs({
            include_docs: true,
            startkey:     'sound',
            endkey:       'sound\uffff'
        })
        .then(function(results) {
            return results.rows.filter(function(row) {
                return row.doc.category == categoryId;
            })
            .map(function(row) {
                return row.doc;
            });
        })
        .catch(function(err) {
            return [];
        });
    };
    
    /**
     * create a new document var for saving
     * @param params - specific data to put in base document model
     */
    this.document = function(params) {
        var type = !!params.type ? params.type : 'null';
        var id   = type + (new Date().toJSON());
        var doc  = angular.extend({
            '_id': id,
            'uid': UID,
            'type': ''
        }, params);
        
        return doc;
    };
    
    /**
     * create a new category document
     * TODO - create notifications helper for success and failure messages
     */
    this.newCategory = function(name) {
        var cat = this.document({
            'type': 'category',
            'name': name
        });
        
        return db.put(cat)
        .then(function(res) {
            console.log(res);
            return true;
        })
        .catch(function(err) {
            console.log('error', err);
            return false;
        });
    };
    
    this.newSound = function(catId, params, ident) {
        var sound = this.document(angular.extend({
            'type':     'sound',
            'category': catId,
            'ident':    ident
        }, params));
        
        console.log(sound);
        
        return db.put(sound)
        .then(function(res) {
            return true;
        })
        .catch(function(err){
            return false;
        });
    };
    
    // TODO - make this a more generic update function
    this.updateSound = function(sound) {
        return db.put(sound)
        .then(function(result) {
            console.log('put sound');
            console.log(result);
            return true;
            if(!!result && result.ok) {
                return result.rev
            }
            return false;
        })
        .catch(function(error) {
            return false;
        });
    };
}]);
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

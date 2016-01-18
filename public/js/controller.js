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
            
            db.getSounds($scope.category._id).then(function(data) {
                $scope.$apply(function() {
                    $scope.sounds = data;
                });
            });
        }
    };
}]);

var app = angular.module('dndSoundboard', [])
.controller('soundBoardController', ['$scope', function($scope) {
    var focus;
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
        console.log('add', category);
        focus = category;
    };
    
    $scope.addSound = function() {
        if(!!$scope.newSoundName) {
            focus.sounds.push($scope.newSoundName);
            $scope.newSoundName = '';
        }
    };
}]);
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
    db.connect()
    .on('change', function(data) {
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
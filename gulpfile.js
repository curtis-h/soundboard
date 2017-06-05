var gulp   = require('gulp');
var concat = require('gulp-concat');
var srcDir = 'public/';
var config = {
    js: {
        src: [
            srcDir + 'js/*.js',
            srcDir + 'js/**/*.js'
        ],
        dest: 'public/',
        name: 'app.js'
    },
    sass: {
        src: srcDir + 'css/*.scss',
        dest: 'static/'
    }
};

gulp.task('js', function() {
    gulp.src(config.js.src)
        .pipe(concat(config.js.name))
        .pipe(gulp.dest(config.js.dest));
});

gulp.task('default', ['js'], function() {
    // run other tasks through dependencies
});

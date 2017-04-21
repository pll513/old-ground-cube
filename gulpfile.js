var gulp = require('gulp');
var less = require('gulp-less');
var minifyCSS = require('gulp-csso');
var concatCSS = require('gulp-concat-css');
var watch = require('gulp-watch');
var plumber = require('gulp-plumber');

gulp.task('less', function () {
  return gulp.src(['common/less/*.less'])
    .pipe(plumber())
    .pipe(less())
    .pipe(gulp.dest('common/css'));
});

gulp.task('css-deploy', ['less'], function () {
  return gulp.src('common/css/*.css')
    .pipe(gulp.dest('public/css'));
});

gulp.task('js-deploy', function () {
  return gulp.src('common/js/*.js')
    .pipe(gulp.dest('public/js'));
});

gulp.task('dev', function () {
  var cssWatcher = gulp.watch(['common/css/*.less'], ['css-deploy']);
  cssWatcher.on('change', function (event) {
    console.log('File ' + event.path + ' was ' + event.type + ', running tasks...');
  });
});

gulp.task('js-init', function () {
  return gulp.src('node_modules/metro-dist/js/metro.min.js')
    .pipe(gulp.dest('public/js'));
});

gulp.task('css-init', function () {
  return gulp.src('node_modules/metro-dist/css/metro.min.css')
    .pipe(gulp.dest('public/css'));
});

gulp.task('default', ['css-init', 'js-init', 'css-deploy', 'js-deploy'], function () {
  
});



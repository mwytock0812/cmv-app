var gulp = require('gulp');
var gutil = require('gulp-util');
var rename = require('gulp-rename');

var jshint = require('gulp-jshint');
var concat = require('gulp-concat');
var sourcemaps = require('gulp-sourcemaps');

var autoprefixer = require('gulp-autoprefixer');
var minifyCss = require('gulp-minify-css');

var gulpConnect = require('gulp-connect');
var connect = require('connect');
var proxypage = require('proxypage');
var bodyParser = require('body-parser');

// var source = require('vinyl-source-stream');
// var browserify = require('gulp-browserify');
var uglify = require('gulp-uglify');

var mocha = require('gulp-mocha');
var nightwatch = require('gulp-nightwatch');

var config = {
  srcCss : 'viewer/css/**/*.css',
  distCss : 'dist/viewer/css',
  srcHtml : 'viewer/*.html',
  distHtml : 'dist/viewer',
  srcJs : 'viewer/js/**/*.js',
  distJs : 'dist/viewer/js/'
};

// Runs jshint, sets up proxy server, runs jshint, and then sets up static server.
gulp.task('default', ['watch', 'jshint', 'proxy'], function() {
  // launch static web server
  gulpConnect.server({
    port: 3000,
    root: 'viewer',
    livereload: true
  });
});

// Runs e2e tests with selenium, then runs unit tests with mocha.
gulp.task('test', ['e2e-tests'], function () {
  return gulp.src('test/unit/*.js', {read: false})
    .pipe(mocha({reporter: 'spec'}));
});

// Copies html, builds javascript and css
gulp.task('build', ['copy-html', 'copy-js', 'build-js', 'build-css']);

gulp.task('proxy', function () {
  var proxy = connect();
  var port = 3002;
  proxy.use(bodyParser.text({ type: 'text/html' }));
  proxy.use(bodyParser.json({ type: 'application/*+json' }));

  proxy.use('/proxy', proxypage.proxy);

  proxy.listen(port, function() {
    console.log('Proxy server listening on port ' + port);
  });
});

gulp.task('copy-html', function () {
  gulp.src(config.srcHtml)
    .pipe(gulp.dest(config.distHtml));
});

gulp.task('copy-js', function () {
  gulp.src(config.srcJs)
    .pipe(gulp.dest(config.distJs));
});

gulp.task('build-css', function () {
  gulp.src(config.srcCss)
    .pipe(autoprefixer())
    // output non-minified CSS file
    .pipe(gulp.dest(config.distCss))
    // output minified CSS file
    .pipe(gutil.env.type == 'production' ? minifyCss() : gutil.noop())
    .pipe(gutil.env.type == 'production' ? rename({ extname: '.min.css' }) : gutil.noop())
    .pipe(gutil.env.type == 'production' ? gulp.dest(config.distCss) : gutil.noop());
});

gulp.task('watch', function() {
  gulp.watch(config.srcJs, ['jshint', 'build-js']);
  gulp.watch(config.srcCss, ['build-css']);
  gulp.watch(config.srcHtml, ['copy-html']);
});

gulp.task('jshint', function() {
  return gulp.src(config.srcJs)
    .pipe(jshint())
    .pipe(jshint.reporter('jshint-stylish'));
});

gulp.task('build-js', function() {
  return gulp.src(config.srcJs)
    .pipe(sourcemaps.init())
    .pipe(concat('bundle.js'))
    // only uglify if gulp is run with '--type production'
    .pipe(gutil.env.type == 'production' ? uglify() : gutil.noop())
    .pipe(sourcemaps.write())
    .pipe(gulp.dest(config.distJs));
});

gulp.task('e2e-tests', ['proxy'], function () {
  // launch static web server
  gulpConnect.server({
    port: 3000,
    root: 'viewer',
    livereload: true
  });

  return gulp.src('')
    .pipe(nightwatch({
      configFile: 'nightwatch.json'
    }))
    .on('error', function(error) {
      gutill.log(error);
      gulpConnect.serverClose();
    })
});

// bundles javascript for browserify -not currently used
gulp.task('bundle-js', function() {
  browserify('./viewer/js/**/*.js')
    .bundle()
    .on('error', function(error) {
      gutil.log(error);
    })
    .pipe(source('bundle.js'))
    .pipe(gulp.dest('./viewer/js/dist'))
});
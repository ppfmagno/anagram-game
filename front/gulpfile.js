const gulp = require('gulp');
const browserSync = require('browser-sync');
const sass = require('gulp-sass');
const autoprefixer = require('gulp-autoprefixer');
const babel = require('gulp-babel');
const uglify = require('gulp-uglify');
const browserify = require('gulp-bro');

const paths = {
  views: {
    src: './src/views/index.html',
    dest: './build'
  },
  styles: {
    src: './src/scss/**/*.scss',
    dest: './build/css'
  },
  scripts: {
    src: './src/js/**/*.js',
    dest: './build/js'
  }
};

function serve() {
  browserSync.init({
    open: false,
    server: {
      baseDir: './build'
    }
  });

  watch();
  gulp.watch('./build/js/*.js').on('change', browserSync.reload);
  gulp.watch('./build/*.html').on('change', browserSync.reload);
}

function views() {
  return gulp.src(paths.views.src)
    .pipe(gulp.dest(paths.views.dest))
    .pipe(browserSync.stream());
}

function styles() {
  return gulp.src(paths.styles.src)
    .pipe(sass().on('error', sass.logError))
    .pipe(autoprefixer())
    .pipe(gulp.dest(paths.styles.dest))
    .pipe(browserSync.stream());
}

function scripts() {
  return gulp.src(paths.scripts.src)
    .pipe(babel({
      presets: ['@babel/env']
    }))
    .pipe(browserify({
      insertGlobals: true,
      debug: false
    }))
    // .pipe(uglify())
    .pipe(gulp.dest(paths.scripts.dest));
}

function watch() {
  gulp.watch(paths.views.src, views);
  gulp.watch(paths.styles.src, styles);
  gulp.watch(paths.scripts.src, scripts);
}

exports.default = serve;
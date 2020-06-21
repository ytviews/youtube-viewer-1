const gulp = require('gulp');
const file = require('gulp-file');
const replace = require('gulp-replace');
const shell = require('gulp-shell');
const argv = require('yargs').option('new-version', { alias: 'nv' })
                             .option('commit', { alias: 'c', boolean: true, default: true })
                             .argv;
const fs = require('fs');
const del = require('del');

/**
 * Arguments
 */
const newVersion = argv.newVersion;
const commit = argv.commit; // use --no-commit to bypass git commit
//console.log(newVersion, commit);

/**
 * Global constants
 */
const outDir = 'public/js/compiled';
const env = getFileContent('.env');
const youtubeApiKey = env.split('=')[1].replace(/(\r\n|\n|\r)/gm, '');
//console.log(youtubeApiKey);

/**
 * Functions
 */
function getFileContent(file, encoding = 'utf8') {
  return fs.readFileSync(file, encoding);
}

function runIf(condition, ...tasks) {
  const task = gulp.series(...tasks);
  return function(cb) {
    if (condition) {
      task(cb);
    } else {
      cb();
    }
  }
}

/**
 * Tasks
 */
gulp.task('transpile-background-script',
  shell.task(`tsc src/scripts/background.ts --target es2017 --moduleResolution node --removeComments --outDir ${outDir}`)
);

gulp.task('cleanup-background-script', function() {
  return file('background.js', getFileContent(`${outDir}/scripts/background.js`), { src: true })
    .pipe(replace(/^\s*import .+;$\s*/gm, ''))
    .pipe(replace(/^\s*export .+;$\s*/gm, ''))
    .pipe(replace(/^\s*export /gm, ''))
    .pipe(gulp.dest(`${outDir}/scripts`));
});

gulp.task('cleanup-browser-helper', function() {
  return file('browser.js', getFileContent(`${outDir}/helpers/browser.js`), { src: true })
    .pipe(replace(/^\s*import .+;$\s*/gm, ''))
    .pipe(replace(/^\s*export .+;$\s*/gm, ''))
    .pipe(replace(/^\s*export /gm, ''))
    .pipe(gulp.dest(`${outDir}/helpers`));
});

gulp.task('cleanup-storage-helper', function() {
  return file('storage.js', getFileContent(`${outDir}/helpers/storage.js`), { src: true })
    .pipe(replace(/^\s*import .+;$\s*/gm, ''))
    .pipe(replace(/^\s*export .+;$\s*/gm, ''))
    .pipe(replace(/^\s*export /gm, ''))
    .pipe(gulp.dest(`${outDir}/helpers`));
});

gulp.task('cleanup-utils-helper', function() {
  return file('utils.js', getFileContent(`${outDir}/helpers/utils.js`), { src: true })
    .pipe(replace(/^\s*import .+;$\s*/gm, ''))
    .pipe(replace(/^\s*export .+;$\s*/gm, ''))
    .pipe(replace(/^\s*export /gm, ''))
    .pipe(gulp.dest(`${outDir}/helpers`));
});

gulp.task('cleanup-youtube-helper', function() {
  return file('youtube.js', getFileContent(`${outDir}/helpers/youtube.js`), { src: true })
    .pipe(replace(/^\s*import .+;$\s*/gm, ''))
    .pipe(replace(/^\s*export .+;$\s*/gm, ''))
    .pipe(replace(/^\s*export /gm, ''))
    .pipe(replace('process.env.REACT_APP_YOUTUBE_API_KEY', `'${youtubeApiKey}'`))
    .pipe(gulp.dest(`${outDir}/helpers`));
});

gulp.task('delete-models', function() {
  return del(`${outDir}/models/**`, { force: true });
});

gulp.task('update-manifest-version', function() {
  return file('manifest.json', getFileContent('public/manifest.json'), { src: true })
    .pipe(replace(/^(\s*"version": ").+(",$\s*)/gm, `$1${newVersion}$2`))
    .pipe(gulp.dest('public'));
});

gulp.task('run-npm-version',
  shell.task(`npm version ${newVersion} --no-git-tag-version --allow-same-version${commit ? ` && git add -A && git commit -a -m "Release v${newVersion}"` : ''}`)
);

// Main tasks
gulp.task('compile:background-scripts', gulp.series(
  'transpile-background-script',
  'cleanup-background-script',
  'cleanup-browser-helper',
  'cleanup-storage-helper',
  'cleanup-utils-helper',
  'cleanup-youtube-helper',
  'delete-models'
));

gulp.task('bump:version', runIf(newVersion !== undefined,
  'update-manifest-version',
  'run-npm-version'
));

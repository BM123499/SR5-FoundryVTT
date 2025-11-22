'use strict';
const fs = require('fs-extra');
const path = require('path');

// Sass
const gulpsass = require('gulp-sass')(require('sass'));

// Gulp
const util = require('util');
const gulp = require('gulp');
var cp = require('child_process');
const esbuild = require('esbuild');
const {typecheckPlugin} = require("@jgoz/esbuild-plugin-typecheck");

// Config
const distName = 'dist';
const destFolder = path.resolve(process.cwd(), distName);
const jsBundle = 'bundle.js';
const entryPoint = "./src/module/main.ts";

/**
 * CLEAN
 * Removes all files from the dist folder
 */
async function cleanDist() {
    if (await fs.pathExists(destFolder))
        await fs.emptyDir(destFolder);
}

/**
 * JS BUILD
 */
async function buildJS() {
    esbuild.build({
        entryPoints: [entryPoint],
        bundle: true,
        keepNames: true, // esbuild doesn't guarantee names of classes, so we need to inject .name with the original cls name
        minify: false, // BEWARE: minify: true will break the system as class names are used as string references
        sourcemap: true,
        format: 'esm',
        outfile: path.resolve(destFolder, jsBundle),
        // Don't typescheck on build. Instead typecheck on PR and push and assume releases to build.
        plugins: [],
    }).catch((err) => { console.error(err); });
}

/**
 * COPY ASSETS
 */
async function copyAssets() {
    gulp.src('public/**/*', {encoding: false}).pipe(gulp.dest(destFolder));
    gulp.src('src/templates/**/*').pipe(gulp.dest(path.resolve(destFolder, 'templates')));
    gulp.src('src/module/tours/jsons/**/*').pipe(gulp.dest(path.resolve(destFolder, 'tours')));
}

/**
 * WATCH
 */
async function watch() {
    function watchCopy(pattern, out) {
        gulp.watch(pattern).on('change', () => gulp.src(pattern).pipe(gulp.dest(path.resolve(destFolder, out))));
    }

    gulp.watch('public/**/*').on('change', () => gulp.src('public/**/*', {encoding: false}).pipe(gulp.dest(destFolder)));
    watchCopy('src/templates/**/*', 'templates');
    watchCopy('src/module/tours/jsons/**/*', 'tours');

    gulp.watch('src/**/*.scss').on('change', async () => await buildSass());
    gulp.watch('packs/_source/**/*.scss').on('change', async () => await buildPacks());

    const context = await esbuild.context({
        entryPoints: [entryPoint],
        bundle: true,
        keepNames: true, // esbuild doesn't guarantee names of classes, so we need to inject .name with the original cls name
        minify: false, // BEWARE: minify: true will break the system as class names are used as string references
        sourcemap: true,
        format: 'esm',
        outfile: path.resolve(destFolder, jsBundle),
        plugins: [typecheckPlugin({watch: true})],
    })

    await context.watch();
}

/**
 * SASS
 */
async function buildSass() {
    return gulp
        .src('src/css/bundle.scss')
        .pipe(gulpsass().on('error', gulpsass.logError))
        .pipe(gulp.dest(destFolder));
}

/**
 * FoundryVTT compendium/packs.
 * Create all needed packs from their source files.
 *
 * Since gulp tasks uses a commonJS file, while pack uses a es6 module, we have to use the node execution of packs.
 *
 * Rebuilding packs.mjs to be commonJS as well, would mean to deviate from the dnd5e source of it, which I avoid to
 * keep future changes on their side easier to merge.
 */
async function buildPacks() {
    try {
        const { stderr } = await util.promisify(cp.exec)('npm run build:db');
        if (stderr) console.error(stderr);
        return Promise.resolve();
    } catch (err) {
        console.error('Error building packs:', err);
        throw err;
    }
}

/**
 * LINK USER DATA
 */
async function linkUserData() {
    const { default: chalk } = await import('chalk');

    const config = fs.readJSONSync('foundryconfig.json');
    const projectConfig = fs.readJSONSync(path.resolve('.', 'system.json'));

    const name = projectConfig.id || projectConfig.name;

    if (!name)
        throw Error("Could not find 'id' or 'name' in system.json");

    try {
        let linkDir;
        if (config.dataPath) {
            if (!fs.existsSync(path.join(config.dataPath, 'Data')))
                throw Error('User Data path invalid, no Data directory found');

            linkDir = path.join(config.dataPath, 'Data', 'systems', name);
        } else {
            throw Error('No User Data path defined in foundryconfig.json');
        }

        if (fs.existsSync(linkDir)) {
            if (!fs.statSync(linkDir).isSymbolicLink())
                throw Error(`${chalk.blueBright(linkDir)} is not a link. Please delete or rename folder then run ${chalk.greenBright('link')} command again`);
        } else {
            console.log(
                chalk.green(`Linking build to ${chalk.blueBright(linkDir)}`)
            );
            await fs.symlink(path.resolve('./'), linkDir);
        }
        return Promise.resolve();
    } catch (err) {
        console.error(chalk.red("Link Error:"), err.message);
        throw err; 
    }
}

exports.clean = cleanDist;
exports.sass = buildSass;
exports.assets = copyAssets;
exports.build = gulp.series(copyAssets, buildSass, buildJS, buildPacks);
exports.watch = gulp.series(copyAssets, buildSass, buildPacks, watch);
exports.rebuild = gulp.series(cleanDist, exports.build);
exports.link = linkUserData;

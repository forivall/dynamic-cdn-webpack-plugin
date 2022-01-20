const path = require('path');
const fs = require('fs-extra');
const t = require('tap');

const DynamicCdnWebpackPlugin = require('../lib').default;

const runWebpack = require('./helpers/run-webpack.js');
const cleanDir = require('./helpers/clean-dir.js');

function getChunkFiles(stats) {
    return Array.from(stats.compilation.chunks).reduce((files, x) => files.concat(Array.from(x.files)), []);
}

t.test('loadScripts', async t => {
    await cleanDir(path.resolve(__dirname, './fixtures/output/loadScripts'));

    const stats = await runWebpack({
        context: path.resolve(__dirname, './fixtures/app'),

        output: {
            publicPath: '',
            path: path.resolve(__dirname, './fixtures/output/loadScripts'),
        },

        entry: {
            app: './single.js',
        },

        plugins: [new DynamicCdnWebpackPlugin({ loadScripts: true })],
    });

    const files = getChunkFiles(stats);
    t.equal(files.length, 2);
    t.ok(files.includes('app.js'));
    t.ok(files.includes('https://unpkg.com/react@15.6.1/dist/react.js'));

    const output = await fs.readFile(path.resolve(__dirname, './fixtures/output/loadScripts/app.js'));

    // NOTE: not inside t.notOk to prevent ava to display whole file in console
    const doesIncludeReact = output.includes('THIS IS REACT!');
    t.notOk(doesIncludeReact);

    const doesRequireReactCheck = output.includes('if(typeof React !== "undefined") return resolve()');
    t.ok(doesRequireReactCheck);
    const doesRequireReactLoad = output.includes('__webpack_require__.l("https://unpkg.com/react@15.6.1/dist/react.js"');
    t.ok(doesRequireReactLoad);
    const doesRequireReactResolve = output.includes('}).then(() => (React))');
    t.ok(doesRequireReactResolve);
});

t.test('loadScripts using production version', async t => {
    await cleanDir(path.resolve(__dirname, './fixtures/output/loadScripts-env-prod'));

    const stats = await runWebpack({
        context: path.resolve(__dirname, './fixtures/app'),

        output: {
            publicPath: '',
            path: path.resolve(__dirname, './fixtures/output/loadScripts-env-prod'),
        },

        entry: {
            app: './single.js',
        },

        plugins: [
            new DynamicCdnWebpackPlugin({
                env: 'production',
                loadScripts: true,
            }),
        ],
    });

    const files = getChunkFiles(stats);
    t.equal(files.length, 2);
    t.ok(files.includes('app.js'));
    t.ok(files.includes('https://unpkg.com/react@15.6.1/dist/react.min.js'));

    const output = await fs.readFile(path.resolve(__dirname, './fixtures/output/loadScripts-node-env-prod/app.js'));

    // NOTE: not inside t.notOk to prevent ava to display whole file in console
    const doesIncludeReact = output.includes('THIS IS REACT!');
    t.notOk(doesIncludeReact);
});

t.test('loadScripts with mode=production', async t => {
    await cleanDir(path.resolve(__dirname, './fixtures/output/loadScripts-node-env-prod'));

    const stats = await runWebpack({
        mode: 'production',

        context: path.resolve(__dirname, './fixtures/app'),

        output: {
            publicPath: '',
            path: path.resolve(__dirname, './fixtures/output/loadScripts-node-env-prod'),
        },

        entry: {
            app: './single.js',
        },

        plugins: [new DynamicCdnWebpackPlugin({ loadScripts: true })],
    });

    const files = getChunkFiles(stats);
    t.equal(files.length, 2);
    t.ok(files.includes('app.js'));
    t.ok(files.includes('https://unpkg.com/react@15.6.1/dist/react.min.js'));

    const output = await fs.readFile(path.resolve(__dirname, './fixtures/output/loadScripts-node-env-prod/app.js'));

    // NOTE: not inside t.notOk to prevent ava to display whole file in console
    const doesIncludeReact = output.includes('THIS IS REACT!');
    t.notOk(doesIncludeReact);
});

t.test('loadScripts with mode=none', async t => {
    await cleanDir(path.resolve(__dirname, './fixtures/output/loadScripts-mode-none'));

    const stats = await runWebpack({
        mode: 'none',

        context: path.resolve(__dirname, './fixtures/app'),

        output: {
            publicPath: '',
            path: path.resolve(__dirname, './fixtures/output/loadScripts-mode-none'),
        },

        entry: {
            app: './single.js',
        },

        plugins: [new DynamicCdnWebpackPlugin({ loadScripts: true })],
    });

    const files = getChunkFiles(stats);
    t.equal(files.length, 2);
    t.ok(files.includes('app.js'));
    t.ok(files.includes('https://unpkg.com/react@15.6.1/dist/react.js'));

    const output = await fs.readFile(path.resolve(__dirname, './fixtures/output/loadScripts-mode-none/app.js'));

    // NOTE: not inside t.notOk to prevent ava to display whole file in console
    const doesIncludeReact = output.includes('THIS IS REACT!');
    t.notOk(doesIncludeReact);
});

t.test('loadScripts load module without export', async t => {
    await cleanDir(path.resolve(__dirname, './fixtures/output/loadScripts-no-export'));

    const stats = await runWebpack({
        context: path.resolve(__dirname, './fixtures/app'),

        output: {
            publicPath: '',
            path: path.resolve(__dirname, './fixtures/output/loadScripts-no-export'),
        },

        entry: {
            app: './no-export.js',
        },

        plugins: [new DynamicCdnWebpackPlugin({ loadScripts: true })],
    });

    const files = getChunkFiles(stats);
    t.equal(files.length, 2);
    t.ok(files.includes('app.js'));
    t.ok(files.includes('https://unpkg.com/babel-polyfill@6.23.0/dist/polyfill.js'));
});

t.test('loadScripts async loading', async t => {
    await cleanDir(path.resolve(__dirname, './fixtures/output/loadScripts-async'));

    const stats = await runWebpack({
        context: path.resolve(__dirname, './fixtures/app'),

        output: {
            publicPath: '',
            path: path.resolve(__dirname, './fixtures/output/loadScripts-async'),
        },

        entry: {
            app: './async.js',
        },

        plugins: [new DynamicCdnWebpackPlugin({ loadScripts: true })],
    });

    const files = getChunkFiles(stats);
    t.ok(files.includes('app.js'));
    t.ok(files.includes('https://unpkg.com/react@15.6.1/dist/react.js'));

    const outputs = await Promise.all(
        files
            .filter(x => !x.startsWith('https://unpkg.com'))
            .map(async file => {
                return fs.readFile(path.resolve(__dirname, `./fixtures/output/loadScripts-async/${file}`));
            })
    );

    // NOTE: not inside t.notOk to prevent ava to display whole file in console
    const doesIncludeReact = outputs.some(output => output.includes('THIS IS REACT!'));
    t.notOk(doesIncludeReact);
});

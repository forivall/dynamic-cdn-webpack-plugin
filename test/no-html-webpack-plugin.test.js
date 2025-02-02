const path = require('path');
const fs = require('fs-extra');
const t = require('tap');

const HtmlWebpackPlugin = require('html-webpack-plugin');
const DynamicCdnWebpackPlugin = require('..').default;

const runWebpack = require('./helpers/run-webpack.js');
const cleanDir = require('./helpers/clean-dir.js');

t.test('no-html-webpack-plugin', async t => {
    await cleanDir(path.resolve(__dirname, './fixtures/output/no-html-webpack-plugin'));

    await runWebpack({
        context: path.resolve(__dirname, './fixtures/app'),

        output: {
            publicPath: '/',
            path: path.resolve(__dirname, './fixtures/output/no-html-webpack-plugin'),
        },

        entry: {
            app: './single.js',
        },

        plugins: [
            // prettier-align
            new HtmlWebpackPlugin(),
            new DynamicCdnWebpackPlugin({}, false),
        ],
    });

    const indexFile = await fs.readFile(path.resolve(__dirname, './fixtures/output/no-html-webpack-plugin/index.html'), {
        encoding: 'utf-8',
    });

    t.ok(indexFile.includes('src="/app.js"'));
    t.ok(!indexFile.includes('src="https://unpkg.com/react@15.6.1/dist/react.js"'));

    const output = await fs.readFile(path.resolve(__dirname, './fixtures/output/no-html-webpack-plugin/app.js'));

    // NOTE: not inside t.notOk to prevent ava to display whole file in console
    const doesIncludeReact = output.includes('PureComponent');
    t.notOk(doesIncludeReact);
});

t.test('no-html-webpack-plugin-options', async t => {
    await cleanDir(path.resolve(__dirname, './fixtures/output/no-html-webpack-plugin-options'));

    await runWebpack({
        context: path.resolve(__dirname, './fixtures/app'),

        output: {
            publicPath: '/',
            path: path.resolve(__dirname, './fixtures/output/no-html-webpack-plugin-options'),
        },

        entry: {
            app: './single.js',
        },

        plugins: [
            // prettier-align
            new HtmlWebpackPlugin(),
            new DynamicCdnWebpackPlugin({ html: false }),
        ],
    });

    const indexFile = await fs.readFile(path.resolve(__dirname, './fixtures/output/no-html-webpack-plugin-options/index.html'), {
        encoding: 'utf-8',
    });

    t.ok(indexFile.includes('src="/app.js"'));
    t.ok(!indexFile.includes('src="https://unpkg.com/react@15.6.1/dist/react.js"'));

    const output = await fs.readFile(path.resolve(__dirname, './fixtures/output/no-html-webpack-plugin-options/app.js'));

    // NOTE: not inside t.notOk to prevent ava to display whole file in console
    const doesIncludeReact = output.includes('PureComponent');
    t.notOk(doesIncludeReact);
});

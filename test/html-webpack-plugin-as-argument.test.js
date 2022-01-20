const path = require('path');
const fs = require('fs-extra');
const t = require('tap');

const HtmlWebpackPlugin = require('html-webpack-plugin');
const DynamicCdnWebpackPlugin = require('..').default;

const runWebpack = require('./helpers/run-webpack.js');
const cleanDir = require('./helpers/clean-dir.js');

t.test('html-webpack-plugin-as-argument', async t => {
    await cleanDir(path.resolve(__dirname, './fixtures/output/html-webpack-plugin-as-argument'));

    await runWebpack({
        context: path.resolve(__dirname, './fixtures/app'),

        output: {
            publicPath: '/',
            path: path.resolve(__dirname, './fixtures/output/html-webpack-plugin-as-argument'),
        },

        entry: {
            app: './single.js',
        },

        plugins: [new HtmlWebpackPlugin(), new DynamicCdnWebpackPlugin({}, HtmlWebpackPlugin)],
    });

    const indexFile = await fs.readFile(path.resolve(__dirname, './fixtures/output/html-webpack-plugin-as-argument/index.html'), {
        encoding: 'utf-8',
    });

    t.ok(indexFile.includes('src="/app.js"'));
    t.ok(indexFile.includes('src="https://unpkg.com/react@15.6.1/dist/react.js"'));

    const output = await fs.readFile(path.resolve(__dirname, './fixtures/output/html-webpack-plugin-as-argument/app.js'));

    // NOTE: not inside t.notOk to prevent ava to display whole file in console
    const doesIncludeReact = output.includes('PureComponent');
    t.notOk(doesIncludeReact);
});

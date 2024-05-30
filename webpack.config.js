const path = require("path");
const CopyWebpackPlugin = require('copy-webpack-plugin')

module.exports = {
    entry: {
        popup: "./popup/urlr.js"
    },
    output: {
        path: path.resolve(__dirname, "addon"),
        filename: "[name]/urlr.js"
    },
    plugins: [
        new CopyWebpackPlugin({
            patterns: [
                {from: 'node_modules/webextension-polyfill/dist/browser-polyfill.js'},
                {from: 'manifests/firefox/manifest.json'} // will generate one warning in Chrome about 'browser_specific_settings' key
            ],
        })
    ],
    mode: 'none',
};
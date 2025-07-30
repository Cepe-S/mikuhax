var path = require('path');
var CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
    entry: './out/game/bot.js',
    output: {
        filename: 'bot_bundle.js',
        path: path.resolve(__dirname, 'out')
    },
    plugins: [
        new CopyWebpackPlugin({
            patterns: [
                {
                    from: 'out/game/resource/*.json',
                    to: 'game/resource/[name][ext]'
                }
            ]
        })
    ]
};
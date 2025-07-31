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
                    from: path.resolve(__dirname, 'game/resource/*.json'),
                    to: path.resolve(__dirname, 'out/game/resource/[name][ext]'),
                    noErrorOnMissing: true
                },
                {
                    from: path.resolve(__dirname, 'react/lib/defaultroomconfig.json'),
                    to: path.resolve(__dirname, 'out/react/lib/[name][ext]'),
                    noErrorOnMissing: true
                }
            ]
        })
    ]
};
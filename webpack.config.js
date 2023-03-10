const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");

module.exports = {
    name: 'tiny-react-webpack-setting',
    entry: "./src/index.tsx",
    output: {
        path: path.join(__dirname, "build"),
        filename: "index.js",
        clean: true,
    },

    module: {
        rules: [
            {
                test: /\.js?/,
                exclude: /.yarn/,
                use: "babel-loader"
            },
            {
                test: /\.tsx?$/,
                exclude: /.yarn/,
                use: {
                    loader: "ts-loader",
                },
            },
        ],
    },
    resolve: {
        extensions: [".ts", ".tsx", ".js", ".jsx"],
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: "./public/index.html",
        }),
    ],
    devServer: {
        static: './build',
        port: 3000,
    },
    mode: "development",
};

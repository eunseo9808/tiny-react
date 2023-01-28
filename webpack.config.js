const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");

module.exports = {
    name: 'tiny-react-webpack-setting',
    entry: "./src/index.ts",
    output: {
        path: path.join(__dirname, "build"),
        filename: "index.js",
        clean: true,
    },
    module: {
        rules: [
            {
                test: /\.js/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: ['@babel/preset-env', '@babel/preset-react', "@babel/preset-typescript"]
                    }
                }
            },
            {
                test: /\.tsx?$/,
                exclude: /node_module/,
                use: {
                    loader: "ts-loader",
                },
            },
        ],
    },
    resolve: {
        modules: [path.join(__dirname, "src"), "node_modules"],
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

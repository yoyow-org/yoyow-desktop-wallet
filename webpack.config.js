var path = require("path");
var webpack = require("webpack");
var ExtractTextPlugin = require("extract-text-webpack-plugin");
var HtmlWebpackPlugin = require('html-webpack-plugin');
var Clean = require("clean-webpack-plugin");
var git = require("git-rev-sync");
require("es6-promise").polyfill();

// APP根目录
var root_dir = path.resolve(__dirname);

module.exports = function (env) {
    if (!env.profile) {
        console.log("env:", env);
    }
    var cssLoaders = [
        {
            loader: "style-loader"
        },
        {
            loader: "css-loader"
        },
        {
            loader: "postcss-loader"
        }
    ];

    var scssLoaders = [
        {
            loader: "style-loader"
        },
        {
            loader: "css-loader"
        },
        {
            loader: "postcss-loader",
            options: {
                plugins: [require("autoprefixer")]
            }
        },
        {
            loader: "sass-loader",
            options: {
                outputStyle: "expanded"
            }
        }
    ];

    // 输出路径
    var outputPath = path.join(root_dir, "assets");

    // 插件
    var plugins = [
        new webpack.optimize.OccurrenceOrderPlugin(),
        new webpack.DefinePlugin({
            APP_VERSION: JSON.stringify(git.tag()),
            __ELECTRON__: !!env.electron,
            __HASH_HISTORY__: !!env.hash,
            __BASE_URL__: JSON.stringify("baseUrl" in env ? env.baseUrl : "/"),
            __TESTNET__: !!env.testnet
        })
    ];

    if (env.prod) {
        // 发布路径
        let outputDir = env.electron ? "electron" : env.hash ? "hash-history" : "dist";
        outputPath = path.join(root_dir, outputDir);
        // 要清除的目录
        var cleanDirectories = [];
        if(outputDir !== 'electron') cleanDirectories = [outputDir];

        // 打包样式文件
        const extractCSS = new ExtractTextPlugin(env.electron ? "[name].css" : "[hash].css");
        cssLoaders = extractCSS.extract({
                fallbackLoader: "style-loader",
                loader: [{loader: "css-loader"}, {
                    loader: "postcss-loader", options: {
                        plugins: [require("autoprefixer")]
                    }
                }]
            }
        );
        scssLoaders = extractCSS.extract({
                fallbackLoader: "style-loader",
                loader: [{loader: "css-loader"}, {
                    loader: "postcss-loader", options: {
                        plugins: [require("autoprefixer")]
                    }
                }, {loader: "sass-loader", options: {outputStyle: "expanded"}}]
            }
        );

        // 生产环境处理插件
        plugins.push(new Clean(cleanDirectories, {root: root_dir}));
        plugins.push(new webpack.DefinePlugin({
            "process.env": {NODE_ENV: JSON.stringify("production"), test: env.test},
            __DEBUG__: false,
            __WS_DEBUG__: false,
            __LIB_DEBUG__: false
        }));
        plugins.push(extractCSS);
        plugins.push(new webpack.LoaderOptionsPlugin({
            minimize: true,
            debug: false
        }));
        if (!env.noUgly) {
            plugins.push(new webpack.optimize.UglifyJsPlugin({
                sourceMap: true,
                compress: {
                    warnings: true
                },
                output: {
                    screw_ie8: true,
                    comments: false
                }
            }));
        }
        plugins.push(new HtmlWebpackPlugin({
            filename: "index.html",
            template: path.resolve(root_dir, env.electron ? "app/assets/index-electron.html" : "app/assets/index.html")
        }));
    } else {
        plugins.push(new webpack.DefinePlugin({
            "process.env": {NODE_ENV: JSON.stringify("development"), test: env.test},
            __DEBUG__: true,
            __WS_DEBUG__: false,//输出yoyowjs-ws的log
            __LIB_DEBUG__: false//输出yoyowjs-lib的log
        }));
        plugins.push(new webpack.HotModuleReplacementPlugin());
        plugins.push(new webpack.NoEmitOnErrorsPlugin());
        plugins.push(new HtmlWebpackPlugin({
            filename: "index.html",
            template: path.resolve(root_dir, "app/assets/index.html")
        }));
    }

    var config = {
        entry: {
            app: env.prod ?
                path.resolve(root_dir, "app/main.js") :
                [
                    "react-hot-loader/patch",
                    "webpack-hot-middleware/client",
                    path.resolve(root_dir, "app/main-dev.js")
                ]
        },
        output: {
            publicPath: env.prod ? "" : "/",
            path: outputPath,
            filename: env.electron ? "[name].js" : "[name]_[hash].js",
            pathinfo: !env.prod,
            sourceMapFilename: env.electron ? "[name].js.map" : "[name]_[hash].js.map"
        },
        devtool: env.prod ? "cheap-module-source-map" : "eval",
        module: {
            rules: [
                {
                    test: /\.jsx$/,
                    include: [path.join(root_dir, "app")],
                    use: [
                        {
                            loader: "babel-loader",
                            options: {
                                cacheDirectory: env.prod ? false : true
                            }
                        }
                    ]
                },
                {
                    test: /\.js$/,
                    exclude: [/node_modules/],
                    loader: "babel-loader",
                    options: {compact: false, cacheDirectory: true}
                },
                {
                    test: /\.json/, loader: "json-loader",
                    exclude: [path.resolve(root_dir, "app/assets/locales")]
                },
                {
                    test: /\.css$/,
                    loader: cssLoaders
                },
                {
                    test: /\.scss$/,
                    loader: scssLoaders
                },
                {
                    test: /\.png$/,
                    exclude: [path.resolve(root_dir, "app/assets/language")],
                    use: [
                        {
                            //loader: env.electron ? "url-loader?name=img/[name].png" : "url-loader",
                            loader: "url-loader",
                            options: {
                                name: "img/[name].png",
                                limit: 100000
                            }
                        }
                    ]
                },
                {
                    test: /\.(woff|otf)$/,
                    use: [
                        {
                            loader: "url-loader",
                            options: {
                                limit: 100000,
                                mimetype: "application/font-woff"
                            }
                        }
                    ]
                },
                {
                    test: /\.md/,
                    use: [
                        {
                            loader: "html-loader",
                            options: {
                                removeAttributeQuotes: false
                            }
                        },
                        {
                            loader: "remarkable-loader",
                            options: {
                                preset: "full",
                                typographer: true
                            }
                        }
                    ]
                }
            ]
        },
        resolve: {
            modules: [
                path.resolve(root_dir, "app"),
                path.resolve(root_dir, "lib"),
                "node_modules"
            ],
            extensions: [".js", ".jsx", ".json"],
        },
        resolveLoader: {
            modules: [path.join(root_dir, "node_modules")]
        },
        plugins: plugins
    };

    return config;
};

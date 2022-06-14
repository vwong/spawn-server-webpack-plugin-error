const path = require("path");
const webpack = require("webpack");
const nodeExternals = require("webpack-node-externals");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const MarkoPlugin = require("@marko/webpack/plugin").default;
const SpawnServerPlugin = require("spawn-server-webpack-plugin");
const CssMinimizerPlugin = require("css-minimizer-webpack-plugin");

const markoPlugin = new MarkoPlugin();
const { NODE_ENV = "development", ANALYZE = "false" } = process.env;
const isDev = NODE_ENV === "development";
const isProd = !isDev;
const filenameTemplate = "[name].[contenthash:8]";
const spawnedServer =
  isDev &&
  new SpawnServerPlugin({
    args: [
      "--enable-source-maps",
      // Allow debugging spawned server with the INSPECT=1 env var.
      process.env.INSPECT && "--inspect",
    ].filter(Boolean),
  });

const environments = ["modern", "legacy"].filter((env) =>
  isProd ? true : env === "modern"
);

module.exports = [
  ...environments.map((env, i) => {
    return compiler({
      env,
      name: `browser:${env}`,
      target: `browserslist:${env}`,
      devtool: isProd ? "source-map" : "eval-cheap-module-source-map",
      output: {
        assetModuleFilename: `${filenameTemplate}[ext][query]`,
        filename: `${filenameTemplate}.js`,
        path: path.join(__dirname, "dist/static"),
        publicPath: "/static/",
      },
      optimization: {
        runtimeChunk: "single",
        splitChunks: {
          chunks: "all",
          maxInitialRequests: 3,
        },
      },
      devServer:
        isDev && i === 0
          ? {
              hot: false,
              port: 15015,
              static: false,
              host: "0.0.0.0",
              allowedHosts: "all",
              headers: {
                "Access-Control-Allow-Origin": "*",
              },
              ...spawnedServer.devServerConfig,
            }
          : undefined,
      module: {
        rules: [
          {
            test: /\.s?css$/,
            use: [
              MiniCssExtractPlugin.loader,
              "css-loader",
              {
                loader: "postcss-loader",
                options: {
                  postcssOptions: {
                    env,
                  },
                },
              },
              "resolve-url-loader",
              {
                loader: "sass-loader",
                options: {
                  sassOptions: {
                    includePaths: [path.join(__dirname, "src", "styles")],
                  },
                },
              },
            ],
          },
          {
            // type: "asset/resource" is not compatible with ARC
            // so we use the deprecated file-loader for now
            test: /\.(jpg|jpeg|gif|png|svg|woff2)$/,
            use: [
              {
                loader: "file-loader",
                options: {
                  name: `${filenameTemplate}.[ext]`,
                },
              },
            ],
          },
        ],
      },
      plugins: [
        markoPlugin.browser,
        new webpack.DefinePlugin({
          "typeof window": "'object'",
        }),
        new MiniCssExtractPlugin({
          filename: `${filenameTemplate}.css`,
          ignoreOrder: true,
        }),
        isProd && new CssMinimizerPlugin(),
      ],
    });
  }),
  compiler({
    name: "server",
    target: "async-node",
    devtool: "inline-nosources-cheap-module-source-map",
    externals: [
      // Exclude node_modules, but ensure non js files are bundled.
      // Eg: `.marko`, `.css`, etc.
      nodeExternals({
        allowlist: [/\.(?!(?:js|json)$)[^.]+$/],
      }),
    ],
    optimization: {
      minimize: false,
    },
    output: {
      assetModuleFilename: `${filenameTemplate}[ext][query]`,
      devtoolModuleFilenameTemplate: "[absolute-resource-path]",
      libraryTarget: "commonjs2",
      path: path.join(__dirname, "dist"),
      publicPath: "/static/",
    },
    module: {
      rules: [
        {
          test: /\.(jpg|jpeg|gif|png|svg|woff2)$/,
          use: [
            {
              loader: "file-loader",
              options: {
                emitFile: false,
                name: `${filenameTemplate}.[ext]`,
              },
            },
          ],
        },
      ],
    },
    plugins: [
      isDev && spawnedServer,
      markoPlugin.server,
      new webpack.IgnorePlugin({
        resourceRegExp: /\.css$/,
      }),
      new webpack.DefinePlugin({
        "typeof window": "'undefined'",
      }),
    ],
  }),
];

// Shared config for both server and client compilers.
function compiler({ env, ...config }) {
  const babelConfig = {
    babelrc: false,
    caller: { env },
    comments: false,
    compact: false,
  };

  return {
    ...config,
    mode: isProd ? "production" : "development",
    stats: isDev && "minimal",
    resolve: {
      alias: {
        "~": path.resolve(__dirname, "./src"),
      },
      extensions: [".ts", ".js", ".json"],
    },
    module: {
      rules: [
        ...config.module.rules,
        {
          test: /\.marko$/,
          loader: "@marko/webpack/loader",
          options: { babelConfig },
        },
        {
          test: /\.ts$/,
          loader: "ts-loader",
        },
        {
          test: /\.js$/,
          loader: "source-map-loader",
        },
        {
          test: /\.js$/,
          loader: "babel-loader",
          exclude: /node_modules/,
          options: {
            cacheDirectory: true,
            ...babelConfig,
          },
        },
      ],
    },
    plugins: config.plugins.filter(Boolean),
  };
}

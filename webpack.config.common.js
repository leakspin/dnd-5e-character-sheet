const glob = require('glob');
const path = require('path');

const CopyWebpackPlugin = require('copy-webpack-plugin');
const HTMLWebpackPlugin = require('html-webpack-plugin');
const WorkboxPlugin = require('workbox-webpack-plugin');

const generateHTMLPlugins = () => glob.sync('./src/**/*.html').map(
  dir => new HTMLWebpackPlugin({
    filename: path.basename(dir), // Output
    template: dir, // Input
  }),
);

module.exports = {
  node: {
    fs: 'empty',
  },
  entry: ['./src/js/app.js', './src/style/main.scss'],
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'app.bundle.js',
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        loader: 'babel-loader',
      },
      {
        test: /\.html$/,
        loader: 'raw-loader',
      },
    ],
  },
  plugins: [
    new CopyWebpackPlugin([
      {
        from: './src/static/',
        to: './static/',
      },
      {
        from: './src/manifest.json',
        to: './',
      },
    ]),
    new WorkboxPlugin.GenerateSW({
      // these options encourage the ServiceWorkers to get in there fast
      // and not allow any straggling "old" SWs to hang around
      clientsClaim: true,
      skipWaiting: true,
    }),
    ...generateHTMLPlugins(),
  ],
  stats: {
    colors: true,
  },
  devtool: 'source-map',
};

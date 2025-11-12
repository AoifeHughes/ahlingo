const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = (env, argv) => {
  const isDevelopment = argv.mode === 'development';

  return {
    target: 'electron-renderer',
    entry: './electron/index.web.js',
    output: {
      path: path.resolve(__dirname, 'electron-build'),
      filename: 'bundle.js',
      publicPath: './'
    },
    resolve: {
      extensions: ['.web.js', '.js', '.web.jsx', '.jsx', '.web.ts', '.ts', '.web.tsx', '.tsx', '.json'],
      alias: {
        'react-native$': 'react-native-web',
        'react-native-vector-icons': 'react-native-vector-icons/dist',
        // Mock native-only modules that won't work in Electron
        'react-native-sqlite-storage': path.resolve(__dirname, 'electron/mocks/sqlite-mock.js'),
        'react-native-tts': path.resolve(__dirname, 'electron/mocks/tts-mock.js'),
        'react-native-fs': path.resolve(__dirname, 'electron/mocks/fs-mock.js'),
        'llama.rn': path.resolve(__dirname, 'electron/mocks/llama-mock.js'),
      }
    },
    module: {
      rules: [
        {
          test: /\.(js|jsx|ts|tsx)$/,
          exclude: /node_modules\/(?!(react-native|@react-native|react-native-vector-icons|react-native-elements|react-navigation)\/).*/,
          use: {
            loader: 'babel-loader',
            options: {
              presets: [
                '@babel/preset-env',
                ['@babel/preset-react', { runtime: 'automatic' }],
                '@babel/preset-typescript'
              ],
              plugins: [
                'react-native-web'
              ]
            }
          }
        },
        {
          test: /\.css$/,
          use: ['style-loader', 'css-loader']
        },
        {
          test: /\.(png|jpe?g|gif|svg)$/i,
          type: 'asset/resource'
        },
        {
          test: /\.(ttf|otf|woff|woff2)$/,
          type: 'asset/resource'
        }
      ]
    },
    plugins: [
      new HtmlWebpackPlugin({
        template: './electron/index.html',
        inject: 'body'
      }),
      new CopyWebpackPlugin({
        patterns: [
          {
            from: 'assets',
            to: 'assets',
            noErrorOnMissing: true
          }
        ]
      })
    ],
    devtool: isDevelopment ? 'source-map' : false,
    mode: argv.mode || 'production'
  };
};

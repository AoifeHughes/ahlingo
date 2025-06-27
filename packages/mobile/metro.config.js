const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');
const path = require('path');

/**
 * Metro configuration
 * https://facebook.github.io/metro/docs/configuration
 */

const config = {
  watchFolders: [
    // Include the core package in the watch folders for monorepo support
    path.resolve(__dirname, '../core'),
    path.resolve(__dirname, '../..'),
  ],
  resolver: {
    alias: {
      '@ahlingo/core': path.resolve(__dirname, '../core/src'),
    },
    nodeModulesPaths: [
      path.resolve(__dirname, '../../node_modules'),
      path.resolve(__dirname, 'node_modules'),
    ],
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
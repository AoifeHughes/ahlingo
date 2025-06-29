module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      // Add fallbacks for Node.js core modules
      webpackConfig.resolve.fallback = {
        ...webpackConfig.resolve.fallback,
        path: false,
        fs: false,
        crypto: false,
        stream: false,
        buffer: false,
        util: false,
        os: false,
      };
      
      // Ignore electron module in the renderer
      webpackConfig.externals = {
        ...webpackConfig.externals,
        electron: 'electron'
      };
      
      return webpackConfig;
    },
  },
};
module.exports = {
  presets: [
    [
      'module:@react-native/babel-preset',
      {
        // Ensure JSX is transformed in TypeScript files
        unstable_transformProfile: 'default',
      },
    ],
  ],
  env: {
    test: {
      // Ensure proper JSX transformation in test environment
      presets: ['module:@react-native/babel-preset'],
      plugins: ['./babel-plugins/transform-dynamic-import-to-require'],
    },
  },
};

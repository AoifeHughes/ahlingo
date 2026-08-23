module.exports = {
  preset: 'react-native',
  globalSetup: '<rootDir>/scripts/buildTestFixtureDb.js',
  setupFilesAfterEnv: ['<rootDir>/src/test-utils/setup.ts'],
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/android/',
    '<rootDir>/ios/',
    '<rootDir>/e2e/',
  ],
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': 'babel-jest',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(jest-)?@?react-native|@react-native-community|@react-navigation)',
  ],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/test-utils/**',
    '!src/types/**',
    '!src/**/index.ts',
  ],
  clearMocks: true,
  restoreMocks: true,
  watchman: false,
};

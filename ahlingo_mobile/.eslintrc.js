module.exports = {
  root: true,
  extends: ['@react-native', '@react-native/eslint-config'],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
    ecmaVersion: 2020,
    sourceType: 'module',
  },
  plugins: ['react', 'react-native', '@typescript-eslint'],
  rules: {
    // React Native specific rules
    'react-native/no-unused-styles': 'warn',
    'react-native/split-platform-components': 'warn',
    'react-native/no-inline-styles': 'warn',
    'react-native/no-color-literals': 'off', // Too pedantic for React Native development
    'react-native/no-raw-text': 'off',

    // General React rules
    'react/jsx-uses-react': 'error',
    'react/jsx-uses-vars': 'error',
    'react/no-unused-prop-types': 'warn',
    'react/prop-types': 'off', // TypeScript handles this
    'react-hooks/exhaustive-deps': 'warn', // Warn instead of error for hook dependencies

    // TypeScript specific rules
    '@typescript-eslint/no-unused-vars': ['warn', {
      argsIgnorePattern: '^_|^navigation$|^index$',
      varsIgnorePattern: '^_|^userLanguage$|^userDifficulty$|^topicName$|^userSettings$|^navigation$|^index$|^settings$|^getSingleRow$|^ScrollView$|^logDatabaseTables$|^getUserStatsByTopic$|^getUserProgressSummary$',
      ignoreRestSiblings: true
    }],
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-explicit-any': ['warn', {
      ignoreRestArgs: true,
      fixToUnknown: false
    }],

    // General code quality
    'no-console': ['warn', { allow: ['warn', 'error', 'log'] }], // Allow console logs for mobile debugging
    'no-debugger': 'error',
    'prefer-const': 'error',
    'no-var': 'error',
  },
  settings: {
    react: {
      version: 'detect',
    },
  },
};

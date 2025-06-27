module.exports = {
  extends: [
    'react-app',
    'react-app/jest'
  ],
  rules: {
    // Disable rules that are causing issues
    '@typescript-eslint/no-unused-vars': 'off',
  }
};
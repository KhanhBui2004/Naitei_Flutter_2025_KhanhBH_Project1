// Simple ESLint Flat Configuration for Testing
module.exports = [
  {
    files: ['**/*.{js,mjs,cjs}'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        console: 'readonly',
        process: 'readonly',
        eval: 'readonly'
      }
    },
    rules: {
      'no-console': ['warn', { allow: ['warn', 'log'] }],
      'no-unused-vars': 'warn',
      'prefer-const': 'warn',
      'no-var': 'error',
      'no-undef': 'warn',
      'no-eval': 'error',
      'eqeqeq': 'error'
    }
  }
];

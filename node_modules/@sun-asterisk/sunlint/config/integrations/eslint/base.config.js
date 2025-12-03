// ESLint Flat Configuration for SunLint (ESLint v9+)
// Following Rule C005: Single responsibility - ESLint configuration
const typescriptParser = require('@typescript-eslint/parser');
const typescriptPlugin = require('@typescript-eslint/eslint-plugin');
const customPlugin = require('./eslint-plugin-custom');

module.exports = [
  {
    files: ['**/*.{js,ts,tsx,jsx}'],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
        project: './tsconfig.json'
      },
      globals: {
        console: 'readonly',
        process: 'readonly',
        eval: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        exports: 'writable',
        module: 'writable',
        require: 'readonly',
        global: 'readonly'
      }
    },
    plugins: {
      'custom': customPlugin,
      '@typescript-eslint': typescriptPlugin
    },
    rules: {
      // Rule C019: No console.error for non-critical errors
      'no-console': ['warn', { allow: ['warn', 'log'] }],
      
      // Code quality rules
      'no-unused-vars': 'warn',
      'prefer-const': 'warn',
      'no-var': 'error',
      'no-undef': 'warn',
      
      // Rule C005: Single responsibility principle
      'max-lines-per-function': ['warn', { max: 50 }],
      'complexity': ['warn', { max: 10 }],
      
      // Rule C014: Avoid direct new instantiation patterns
      'no-new': 'warn',
      
      // Security and best practices
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-new-func': 'error',
      'eqeqeq': 'error',
      'curly': 'error',
      
      // Quality rules (dynamic loading based on category)
      'custom/c002': 'off',
      'custom/c003': 'off',
      'custom/c006': 'off',
      'custom/c010': 'off',
      'custom/c013': 'off',
      'custom/c014': 'off',
      'custom/c017': 'off',
      'custom/c018': 'off',
      'custom/c023': 'off',
      'custom/c027': 'off',
      'custom/c029': 'off',
      'custom/c030': 'off',
      'custom/c034': 'off',
      'custom/c035': 'off',
      'custom/c041': 'off',
      'custom/c042': 'off',
      'custom/c043': 'off',
      'custom/c047': 'off',
      'custom/c048': 'off',
      
      // Security rules (dynamic loading based on category)
      'custom/typescript_s003': 'off',
      'custom/typescript_s005': 'off',
      'custom/typescript_s006': 'off',
      'custom/typescript_s008': 'off',
      'custom/typescript_s009': 'off',
      'custom/typescript_s010': 'off',
      'custom/typescript_s011': 'off',
      'custom/typescript_s012': 'off',
      'custom/typescript_s014': 'off',
      'custom/typescript_s015': 'off',
      'custom/typescript_s016': 'off',
      'custom/typescript_s017': 'off',
      'custom/typescript_s018': 'off',
      'custom/typescript_s019': 'off',
      'custom/typescript_s020': 'off',
      'custom/typescript_s022': 'off',
      'custom/typescript_s023': 'off',
      'custom/typescript_s025': 'off',
      'custom/typescript_s026': 'off',
      'custom/typescript_s027': 'off',
      'custom/typescript_s029': 'off',
      'custom/typescript_s030': 'off',
      'custom/typescript_s033': 'off',
      'custom/typescript_s034': 'off',
      'custom/typescript_s035': 'off',
      'custom/typescript_s036': 'off',
      'custom/typescript_s037': 'off',
      'custom/typescript_s038': 'off',
      'custom/typescript_s039': 'off',
      'custom/typescript_s041': 'off',
      'custom/typescript_s042': 'off',
      'custom/typescript_s043': 'off',
      'custom/typescript_s044': 'off',
      'custom/typescript_s045': 'off',
      'custom/typescript_s046': 'off',
      'custom/typescript_s047': 'off',
      'custom/typescript_s048': 'off',
      'custom/typescript_s050': 'off',
      'custom/typescript_s052': 'off',
      'custom/typescript_s054': 'off',
      'custom/typescript_s055': 'off',
      'custom/typescript_s057': 'off',
      'custom/typescript_s058': 'off'
    }
  }
];

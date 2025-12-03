/**
 * ESLint Configuration for SunLint TypeScript Integration
 * Simple config focusing on existing custom rules
 */

const customRules = require('./custom-rules');

module.exports = [
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
    languageOptions: {
      parser: require('@typescript-eslint/parser'),
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module'
      },
      globals: {
        console: 'readonly',
        process: 'readonly',
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
      '@typescript-eslint': require('@typescript-eslint/eslint-plugin'),
      'custom': customRules
    },
    rules: {
      // Enable all quality rules
      'custom/c002': 'warn',
      'custom/c003': 'warn',
      'custom/c006': 'warn',
      'custom/c010': 'warn',
      'custom/c013': 'warn',
      'custom/c014': 'warn',
      'custom/c017': 'warn',
      'custom/c018': 'warn',
      'custom/c023': 'warn',
      'custom/c027': 'warn',
      'custom/c029': 'warn',
      'custom/c030': 'warn',
      'custom/c034': 'warn',
      'custom/c035': 'warn',
      'custom/c041': 'warn',
      'custom/c042': 'warn',
      'custom/c043': 'warn',
      'custom/c047': 'warn',
      'custom/c048': 'warn',
      'custom/c076': 'warn',
      'custom/t002': 'warn',
      'custom/t003': 'warn',
      'custom/t004': 'warn',
      'custom/t007': 'warn',
      'custom/t011': 'warn',
      'custom/t019': 'warn',
      'custom/t025': 'warn',
      'custom/t026': 'warn',
      
      // Enable all security rules as warnings by default
      'custom/typescript_s001': 'warn',
      'custom/typescript_s002': 'warn',
      'custom/typescript_s003': 'warn',
      'custom/typescript_s005': 'warn',
      'custom/typescript_s006': 'warn',
      'custom/typescript_s007': 'warn',
      'custom/typescript_s008': 'warn',
      'custom/typescript_s009': 'warn',
      'custom/typescript_s010': 'warn',
      'custom/typescript_s011': 'warn',
      'custom/typescript_s012': 'warn',
      'custom/typescript_s013': 'warn',
      'custom/typescript_s014': 'warn',
      'custom/typescript_s015': 'warn',
      'custom/typescript_s016': 'warn',
      'custom/typescript_s017': 'warn',
      'custom/typescript_s018': 'warn',
      'custom/typescript_s019': 'warn',
      'custom/typescript_s020': 'warn',
      'custom/typescript_s022': 'warn',
      'custom/typescript_s023': 'warn',
      'custom/typescript_s025': 'warn',
      'custom/typescript_s026': 'warn',
      'custom/typescript_s027': 'warn',
      'custom/typescript_s029': 'warn',
      'custom/typescript_s030': 'warn',
      'custom/typescript_s033': 'warn',
      'custom/typescript_s034': 'warn',
      'custom/typescript_s035': 'warn',
      'custom/typescript_s036': 'warn',
      'custom/typescript_s037': 'warn',
      'custom/typescript_s038': 'warn',
      'custom/typescript_s039': 'warn',
      'custom/typescript_s041': 'warn',
      'custom/typescript_s042': 'warn',
      'custom/typescript_s043': 'warn',
      'custom/typescript_s044': 'warn',
      'custom/typescript_s045': 'warn',
      'custom/typescript_s046': 'warn',
      'custom/typescript_s047': 'warn',
      'custom/typescript_s048': 'warn',
      'custom/typescript_s050': 'warn',
      'custom/typescript_s052': 'warn',
      'custom/typescript_s054': 'warn',
      'custom/typescript_s055': 'warn',
      'custom/typescript_s057': 'warn',
      'custom/typescript_s058': 'warn'
    }
  }
];

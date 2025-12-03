// ESLint Legacy Configuration for SunLint (ESLint v8.x compatibility)
// Following Rule C005: Single responsibility - ESLint configuration
module.exports = {
  env: {
    es2022: true,
    node: true,
    browser: true
  },
  
  parser: '@typescript-eslint/parser',
  
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    project: '../tsconfig.json'
  },
  
  plugins: [
    'custom',
    '@typescript-eslint'
  ],
  
  globals: {
    console: 'readonly',
    process: 'readonly',
    eval: 'readonly'
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
    
    // Security rules from custom plugin (dynamic loading based on category)
    'custom/typescript_s003': 'off', // Will be enabled dynamically
    'custom/typescript_s005': 'off', // Will be enabled dynamically
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
};

/**
 * ESLint-based TypeScript Parser
 * Uses @typescript-eslint/parser for TypeScript AST analysis
 * Gracefully handles missing peer dependencies
 */

class ESLintTypeScriptParser {
  constructor() {
    this.parser = null;
    this.parserType = null;
    this.initParser();
  }

  initParser() {
    // Try to dynamically load available TypeScript parsers
    const parsers = [
      { name: '@typescript-eslint/parser', type: 'typescript-eslint' },
      { name: '@babel/parser', type: 'babel' }
    ];

    for (const { name, type } of parsers) {
      try {
        this.parser = require(name);
        this.parserType = type;
        break;
      } catch (error) {
        // Continue to next parser
        continue;
      }
    }
  }

  async parse(code, filePath) {
    if (!this.parser) return null;

    try {
      if (this.parserType === 'babel') {
        return this.parser.parse(code, {
          sourceType: 'unambiguous',
          allowImportExportEverywhere: true,
          plugins: ['typescript', 'jsx', 'decorators-legacy']
        });
      } else if (this.parserType === 'typescript-eslint') {
        // First try @babel/parser for better compatibility
        try {
          const babel = require('@babel/parser');
          return babel.parse(code, {
            sourceType: 'unambiguous',
            allowImportExportEverywhere: true,
            plugins: ['typescript', 'jsx', 'decorators-legacy', 'classProperties']
          });
        } catch (babelError) {
          // Fallback to @typescript-eslint/parser if available
          if (this.parser.parseForESLint) {
            const result = this.parser.parseForESLint(code, {
              ecmaVersion: 'latest',
              sourceType: 'module',
              ecmaFeatures: {
                jsx: true
              }
            });
            return result.ast;
          }
        }
      }
    } catch (error) {
      // Parsing failed, return null for fallback
      return null;
    }

    return null;
  }

  async analyzeRule(ruleId, code, filePath) {
    const ast = await this.parse(code, filePath);
    if (!ast) return null;

    // Reuse JavaScript analysis logic
    const jsParser = require('./eslint-js-parser');
    const jsParserInstance = new jsParser();
    
    // Use the same analysis methods
    switch (ruleId) {
      case 'C010':
        return jsParserInstance.analyzeBlockNesting(ast, code);
      case 'C012':
        return jsParserInstance.analyzeCyclomaticComplexity(ast, code);
      case 'C015':
        return jsParserInstance.analyzeFunctionParameters(ast, code);
      case 'C017':
        return jsParserInstance.analyzeConstructorLogic(ast, code);
      default:
        return null;
    }
  }
}

module.exports = ESLintTypeScriptParser;

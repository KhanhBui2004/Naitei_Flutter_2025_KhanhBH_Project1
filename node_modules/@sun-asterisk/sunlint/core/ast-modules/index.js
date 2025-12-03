/**
 * AST Modules Index
 * Uses ESLint's proven AST infrastructure instead of Tree-sitter
 * Rule C005: Single responsibility - AST module management only
 */

/**
 * AST Module Registry
 * Leverages ESLint parsers for reliable AST analysis
 */
class ASTModuleRegistry {
  constructor() {
    this.loadedParsers = new Map();
    this.availableModules = {
      'javascript': './parsers/eslint-js-parser.js',
      'typescript': './parsers/eslint-ts-parser.js'
    };
    // Note: We focus on JS/TS first as these are most common
    // Other languages can be added later with appropriate parsers
  }

  /**
   * Check if AST support is available for language
   */
  isASTSupportAvailable(language) {
    return this.availableModules.hasOwnProperty(language);
  }

  /**
   * Load AST parser for specific language (lazy loading)
   */
  async loadParser(language) {
    if (this.loadedParsers.has(language)) {
      return this.loadedParsers.get(language);
    }

    const modulePath = this.availableModules[language];
    if (!modulePath) {
      throw new Error(`AST parser not available for language: ${language}`);
    }

    try {
      const ParserClass = require(modulePath);
      const parser = new ParserClass();
      this.loadedParsers.set(language, parser);
      return parser;
    } catch (error) {
      // If ESLint parsers are not available, return null silently
      // This allows graceful fallback to regex without noise
      return null;
    }
  }

  /**
   * Get available languages with AST support
   */
  getAvailableLanguages() {
    return Object.keys(this.availableModules);
  }

  /**
   * Parse code using appropriate AST parser
   */
  async parseCode(code, language, filePath) {
    const parser = await this.loadParser(language);
    if (!parser) {
      return null; // Fall back to regex-based analysis
    }

    try {
      return await parser.parse(code, filePath);
    } catch (error) {
      // Silent fallback - no logging noise
      return null;
    }
  }

  /**
   * Analyze specific rule using AST
   */
  async analyzeRule(ruleId, code, language, filePath) {
    const parser = await this.loadParser(language);
    if (!parser) {
      return null; // Fall back to regex-based analysis
    }

    try {
      return await parser.analyzeRule(ruleId, code, filePath);
    } catch (error) {
      // Silent fallback - no logging noise
      return null;
    }
  }
}

// Export singleton instance
module.exports = new ASTModuleRegistry();

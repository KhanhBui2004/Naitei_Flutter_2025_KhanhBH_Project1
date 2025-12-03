/**
 * Symbol-based analyzer for C013 - No Dead Code
 * Uses AST analysis for accurate dead code detection
 */

const fs = require('fs');
const path = require('path');

class C013NoDeadCodeAnalyzer {
  constructor(semanticEngine = null) {
    this.ruleId = 'C013';
    this.ruleName = 'No Dead Code';
    this.semanticEngine = semanticEngine;
    this.symbolBasedAnalyzer = null;
    this.verbose = false;
  }

  initialize(options = {}) {
    this.verbose = options.verbose || false;
    
    try {
      const SymbolBasedAnalyzer = require('./symbol-based-analyzer.js');
      this.symbolBasedAnalyzer = new SymbolBasedAnalyzer(this.semanticEngine);
      this.symbolBasedAnalyzer.initialize(options);
      
      if (this.verbose) {
        console.log(`[DEBUG] 🎯 C013: Symbol-based analyzer loaded`);
      }
    } catch (error) {
      if (this.verbose) {
        console.log(`[DEBUG] ⚠️ C013: Symbol-based analyzer failed to load: ${error.message}`);
      }
      throw error; // Fail fast if symbol-based analyzer can't load
    }
  }

  async analyze(files, language, options = {}) {
    const violations = [];
    
    if (options.verbose) {
      console.log(`🔍 Running C013 dead code analysis on ${files.length} files`);
    }

    // Check language support
    if (!this.supportsLanguage(language)) {
      if (options.verbose) {
        console.log(`[DEBUG] ⚠️ C013: Language ${language} not supported. Skipping analysis.`);
      }
      return violations;
    }

    // Pass semantic engine to symbol-based analyzer if available
    if (this.symbolBasedAnalyzer && options.semanticEngine) {
      this.symbolBasedAnalyzer.semanticEngine = options.semanticEngine;
    }
    
    // Use symbol-based analysis (AST-based, high accuracy)
    if (this.symbolBasedAnalyzer) {
      try {
        if (options.verbose) {
          console.log(`[DEBUG] 🎯 C013: Using symbol-based analysis for ${language}`);
        }
        
        const symbolViolations = await this.symbolBasedAnalyzer.analyze(files, language, options);
        violations.push(...symbolViolations);
        
        if (options.verbose) {
          console.log(`[DEBUG] 🎯 C013: Symbol-based analysis found ${symbolViolations.length} violations`);
        }
        
        return violations;
      } catch (error) {
        if (options.verbose) {
          console.log(`[DEBUG] ⚠️ C013: Symbol-based analysis failed: ${error.message}`);
        }
        throw error; // Don't fallback, fail fast for debugging
      }
    }

    throw new Error('Symbol-based analyzer not available');
  }

  supportsLanguage(language) {
    // Symbol-based analyzer supports TypeScript and JavaScript
    const supportedLanguages = ['typescript', 'javascript', 'ts', 'js'];
    return supportedLanguages.includes(language?.toLowerCase());
  }

  createViolation(filePath, line, column, message, type = 'general') {
    return {
      ruleId: this.ruleId,
      ruleName: this.ruleName,
      severity: 'warning',
      message,
      filePath,
      line,
      column,
      type,
      source: 'symbol-based'
    };
  }
}

module.exports = C013NoDeadCodeAnalyzer;

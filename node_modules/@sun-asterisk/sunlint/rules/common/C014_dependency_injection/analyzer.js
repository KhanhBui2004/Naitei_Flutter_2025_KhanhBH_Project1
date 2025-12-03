const C014SymbolBasedAnalyzer = require('./symbol-based-analyzer.js');

class C014Analyzer {
  constructor(semanticEngine = null) {
    this.ruleId = 'C014';
    this.ruleName = 'Dependency Injection Pattern';
    this.description = 'Use Dependency Injection instead of direct instantiation in business logic';
    this.semanticEngine = semanticEngine;
    this.verbose = false;
    
    // Use symbol-based only for accuracy
    this.symbolAnalyzer = new C014SymbolBasedAnalyzer(semanticEngine);
  }

  async initialize(semanticEngine = null) {
    if (semanticEngine) {
      this.semanticEngine = semanticEngine;
    }
    this.verbose = semanticEngine?.verbose || false;
    await this.symbolAnalyzer.initialize(semanticEngine);
  }

  async analyzeFileBasic(filePath, options = {}) {
    try {
      // Check if symbol engine is ready
      if (!this.semanticEngine?.isSymbolEngineReady?.() || !this.semanticEngine.project) {
        const errorMsg = 'Symbol engine required for C014 analysis - consider enabling semantic analysis';
        if (this.verbose) {
          console.log(`[DEBUG] ❌ C014: ${errorMsg} for ${filePath.split('/').pop()}`);
        }
        throw new Error(errorMsg);
      }

      if (this.verbose) {
        console.log(`[DEBUG] 🎯 C014: Using symbol-based analysis for ${filePath.split('/').pop()}`);
      }

      const violations = await this.symbolAnalyzer.analyzeFileBasic(filePath, options);
      
      if (this.verbose) {
        console.log(`[DEBUG] 🎯 C014: Symbol-based analysis found ${violations.length} violations`);
      }

      return violations;
    } catch (error) {
      if (this.verbose) {
        console.error(`[DEBUG] ❌ C014: Analysis failed: ${error.message}`);
      }
      throw new Error(`C014 analysis failed: ${error.message}`);
    }
  }

  async analyzeFiles(files, options = {}) {
    const allViolations = [];
    for (const filePath of files) {
      try {
        const violations = await this.analyzeFileBasic(filePath, options);
        allViolations.push(...violations);
      } catch (error) {
        console.warn(`C014: Skipping ${filePath}: ${error.message}`);
      }
    }
    return allViolations;
  }

  // Legacy method for backward compatibility
  async analyze(files, language, options = {}) {
    return this.analyzeFiles(files, options);
  }

}

module.exports = C014Analyzer;

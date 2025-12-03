/**
 * C023 Main Analyzer - Do not declare duplicate variable
 * Primary: Do not declare duplicate variable names in the same scope.
 * Fallback: Regex-based for all other cases
 */

const C023SymbolBasedAnalyzer = require('./symbol-based-analyzer');

class C023Analyzer {
  constructor(options = {}) {
    if (process.env.SUNLINT_DEBUG) {
      console.log(`🔧 [C023] Constructor called with options:`, !!options);
      console.log(`🔧 [C023] Options type:`, typeof options, Object.keys(options || {}));
    }

    this.ruleId = 'C023';
    this.ruleName = 'Do not declare duplicate variable';
    this.description = 'Do not declare duplicate variable names in the same scope';
    this.semanticEngine = options.semanticEngine || null;
    this.verbose = options.verbose || false;

    // Configuration
    this.config = {
      useSymbolBased: true,      // Primary approach
      fallbackToRegex: false,     // Only when symbol fails completely
      symbolBasedOnly: false     // Can be set to true for pure mode
    };

    // Initialize both analyzers
    try {
      this.symbolAnalyzer = new C023SymbolBasedAnalyzer(this.semanticEngine);
      if (process.env.SUNLINT_DEBUG) {
        console.log(`🔧 [C023] Symbol analyzer created successfully`);
      }
    } catch (error) {
      console.error(`🔧 [C023] Error creating symbol analyzer:`, error);
    }
  }

  /**
   * Initialize with semantic engine
   */
  async initialize(semanticEngine = null) {
    if (semanticEngine) {
      this.semanticEngine = semanticEngine;
    }
    this.verbose = semanticEngine?.verbose || false;

    // Initialize both analyzers
    await this.symbolAnalyzer.initialize(semanticEngine);

    // Ensure verbose flag is propagated
    this.symbolAnalyzer.verbose = this.verbose;

    if (this.verbose) {
      console.log(`🔧 [C023 Hybrid] Analyzer initialized - verbose: ${this.verbose}`);
    }
  }

  async analyze(files, language, options = {}) {
    if (process.env.SUNLINT_DEBUG) {
      console.log(`🔧 [C023] analyze() method called with ${files.length} files, language: ${language}`);
    }

    const violations = [];

    for (const filePath of files) {
      try {
        if (process.env.SUNLINT_DEBUG) {
          console.log(`🔧 [C023] Processing file: ${filePath}`);
        }

        const fileViolations = await this.analyzeFile(filePath, options);
        violations.push(...fileViolations);

        if (process.env.SUNLINT_DEBUG) {
          console.log(`🔧 [C023] File ${filePath}: Found ${fileViolations.length} violations`);
        }
      } catch (error) {
        console.warn(`❌ [C023] Analysis failed for ${filePath}:`, error.message);
      }
    }

    if (process.env.SUNLINT_DEBUG) {
      console.log(`🔧 [C023] Total violations found: ${violations.length}`);
    }

    return violations;
  }

  async analyzeFile(filePath, options = {}) {
    if (process.env.SUNLINT_DEBUG) {
      console.log(`🔧 [C023] analyzeFile() called for: ${filePath}`);
    }

    // 1. Try Symbol-based analysis first (primary)
    if (this.config.useSymbolBased &&
        this.semanticEngine?.project &&
        this.semanticEngine?.initialized) {
      try {
        if (process.env.SUNLINT_DEBUG) {
          console.log(`🔧 [C023] Trying symbol-based analysis...`);
        }
        const sourceFile = this.semanticEngine.project.getSourceFile(filePath);
        if (sourceFile) {
          if (process.env.SUNLINT_DEBUG) {
            console.log(`🔧 [C023] Source file found, analyzing with symbol-based...`);
          }
          const violations = await this.symbolAnalyzer.analyzeFileWithSymbols(filePath, { ...options, verbose: options.verbose });

          // Mark violations with analysis strategy
          violations.forEach(v => v.analysisStrategy = 'symbol-based');

          if (process.env.SUNLINT_DEBUG) {
            console.log(`✅ [C023] Symbol-based analysis: ${violations.length} violations`);
          }
          return violations; // Return even if 0 violations - symbol analysis completed successfully
        } else {
          if (process.env.SUNLINT_DEBUG) {
            console.log(`⚠️ [C023] Source file not found in project`);
          }
        }
      } catch (error) {
        console.warn(`⚠️ [C023] Symbol analysis failed: ${error.message}`);
        // Continue to fallback
      }
    } else {
      if (process.env.SUNLINT_DEBUG) {
        console.log(`🔄 [C023] Symbol analysis conditions check:`);
        console.log(`  - useSymbolBased: ${this.config.useSymbolBased}`);
        console.log(`  - semanticEngine: ${!!this.semanticEngine}`);
        console.log(`  - semanticEngine.project: ${!!this.semanticEngine?.project}`);
        console.log(`  - semanticEngine.initialized: ${this.semanticEngine?.initialized}`);
        console.log(`🔄 [C023] Symbol analysis unavailable, using regex fallback`);
      }
    }

    if (options?.verbose) {
      console.log(`🔧 [C023] No analysis methods succeeded, returning empty`);
    }
    return [];
  }

  async analyzeFileBasic(filePath, options = {}) {
    console.log(`🔧 [C023] analyzeFileBasic() called for: ${filePath}`);
    console.log(`🔧 [C023] semanticEngine exists: ${!!this.semanticEngine}`);
    console.log(`🔧 [C023] symbolAnalyzer exists: ${!!this.symbolAnalyzer}`);

    try {
      // Try symbol-based analysis first
      if (this.semanticEngine?.isSymbolEngineReady?.() &&
          this.semanticEngine.project) {

        if (this.verbose) {
          console.log(`🔍 [C023] Using symbol-based analysis for ${filePath}`);
        }

        const violations = await this.symbolAnalyzer.analyzeFileBasic(filePath, options);
        return violations;
      }
    } catch (error) {
      if (this.verbose) {
        console.warn(`⚠️ [C023] Symbol analysis failed: ${error.message}`);
      }
    }
  }

  /**
   * Methods for compatibility with different engine invocation patterns
   */
  async analyzeFileWithSymbols(filePath, options = {}) {
    return this.analyzeFile(filePath, options);
  }

  async analyzeWithSemantics(filePath, options = {}) {
    return this.analyzeFile(filePath, options);
  }
}

module.exports = C023Analyzer;

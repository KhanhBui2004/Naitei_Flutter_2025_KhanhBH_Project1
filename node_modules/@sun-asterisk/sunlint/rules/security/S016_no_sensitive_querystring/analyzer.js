/**
 * S016 Main Analyzer - Sensitive Data in URL Query Parameters Detection
 * Primary: Symbol-based analysis (when available)
 * Fallback: Regex-based for all other cases
 * Command: node cli.js --rule=S016 --input=examples/rule-test-fixtures/rules/S016_no_sensitive_querystring --engine=heuristic
 */

const S016SymbolBasedAnalyzer = require("./symbol-based-analyzer.js");
const S016RegexBasedAnalyzer = require("./regex-based-analyzer.js");

class S016Analyzer {
  constructor(options = {}) {
    if (process.env.SUNLINT_DEBUG) {
      console.log(`🔧 [S016] Constructor called with options:`, !!options);
      console.log(
        `🔧 [S016] Options type:`,
        typeof options,
        Object.keys(options || {})
      );
    }

    this.ruleId = "S016";
    this.ruleName = "Sensitive Data in URL Query Parameters";
    this.description =
      "Do not pass sensitive data (e.g. password, token, secret, apiKey, etc.) via query string in URLs. This can lead to exposure in logs, browser history, and network traces";
    this.semanticEngine = options.semanticEngine || null;
    this.verbose = options.verbose || false;

    // Configuration
    this.config = {
      useSymbolBased: true, // Primary approach
      fallbackToRegex: true, // Only when symbol fails completely
      symbolBasedOnly: false, // Can be set to true for pure mode
    };

    // Initialize both analyzers
    try {
      this.symbolAnalyzer = new S016SymbolBasedAnalyzer(this.semanticEngine);
      if (process.env.SUNLINT_DEBUG) {
        console.log(`🔧 [S016] Symbol analyzer created successfully`);
      }
    } catch (error) {
      console.error(`🔧 [S016] Error creating symbol analyzer:`, error);
    }

    try {
      this.regexAnalyzer = new S016RegexBasedAnalyzer(this.semanticEngine);
      if (process.env.SUNLINT_DEBUG) {
        console.log(`🔧 [S016] Regex analyzer created successfully`);
      }
    } catch (error) {
      console.error(`🔧 [S016] Error creating regex analyzer:`, error);
    }

    if (process.env.SUNLINT_DEBUG) {
      console.log(`🔧 [S016] Constructor completed`);
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
    await this.regexAnalyzer.initialize(semanticEngine);

    // Ensure verbose flag is propagated
    this.regexAnalyzer.verbose = this.verbose;
    this.symbolAnalyzer.verbose = this.verbose;

    if (this.verbose) {
      console.log(
        `🔧 [S016 Hybrid] Analyzer initialized - verbose: ${this.verbose}`
      );
    }
  }

  async analyze(files, language, options = {}) {
    if (process.env.SUNLINT_DEBUG) {
      console.log(
        `🔧 [S016] analyze() method called with ${files.length} files, language: ${language}`
      );
    }

    const violations = [];

    for (const filePath of files) {
      try {
        if (process.env.SUNLINT_DEBUG) {
          console.log(`🔧 [S016] Processing file: ${filePath}`);
        }

        const fileViolations = await this.analyzeFile(filePath, options);
        violations.push(...fileViolations);

        if (process.env.SUNLINT_DEBUG) {
          console.log(
            `🔧 [S016] File ${filePath}: Found ${fileViolations.length} violations`
          );
        }
      } catch (error) {
        console.warn(
          `⚠ [S016] Analysis failed for ${filePath}:`,
          error.message
        );
      }
    }

    if (process.env.SUNLINT_DEBUG) {
      console.log(`🔧 [S016] Total violations found: ${violations.length}`);
    }

    return violations;
  }

  async analyzeFile(filePath, options = {}) {
    if (process.env.SUNLINT_DEBUG) {
      console.log(`🔧 [S016] analyzeFile() called for: ${filePath}`);
    }

    // 1. Try Symbol-based analysis first (primary)
    if (
      this.config.useSymbolBased &&
      this.semanticEngine?.project &&
      this.semanticEngine?.initialized
    ) {
      try {
        if (process.env.SUNLINT_DEBUG) {
          console.log(`🔧 [S016] Trying symbol-based analysis...`);
        }
        const sourceFile = this.semanticEngine.project.getSourceFile(filePath);
        if (sourceFile) {
          if (process.env.SUNLINT_DEBUG) {
            console.log(
              `🔧 [S016] Source file found, analyzing with symbol-based...`
            );
          }
          const violations = await this.symbolAnalyzer.analyzeFileWithSymbols(
            filePath,
            { ...options, verbose: options.verbose }
          );

          // Mark violations with analysis strategy
          violations.forEach((v) => (v.analysisStrategy = "symbol-based"));

          if (process.env.SUNLINT_DEBUG) {
            console.log(
              `✅ [S016] Symbol-based analysis: ${violations.length} violations`
            );
          }
          return violations; // Return even if 0 violations - symbol analysis completed successfully
        } else {
          if (process.env.SUNLINT_DEBUG) {
            console.log(`⚠️ [S016] Source file not found in project`);
          }
        }
      } catch (error) {
        console.warn(`⚠️ [S016] Symbol analysis failed: ${error.message}`);
        // Continue to fallback
      }
    } else {
      if (process.env.SUNLINT_DEBUG) {
        console.log(`🔄 [S016] Symbol analysis conditions check:`);
        console.log(`  - useSymbolBased: ${this.config.useSymbolBased}`);
        console.log(`  - semanticEngine: ${!!this.semanticEngine}`);
        console.log(
          `  - semanticEngine.project: ${!!this.semanticEngine?.project}`
        );
        console.log(
          `  - semanticEngine.initialized: ${this.semanticEngine?.initialized}`
        );
        console.log(
          `🔄 [S016] Symbol analysis unavailable, using regex fallback`
        );
      }
    }

    // 2. Fallback to regex-based analysis
    if (this.config.fallbackToRegex) {
      try {
        if (process.env.SUNLINT_DEBUG) {
          console.log(`🔧 [S016] Trying regex-based analysis...`);
        }
        const violations = await this.regexAnalyzer.analyzeFileBasic(
          filePath,
          options
        );

        // Mark violations with analysis strategy
        violations.forEach((v) => (v.analysisStrategy = "regex-fallback"));

        if (process.env.SUNLINT_DEBUG) {
          console.log(
            `🔄 [S016] Regex-based analysis: ${violations.length} violations`
          );
        }
        return violations;
      } catch (error) {
        console.error(`⚠ [S016] Regex analysis failed: ${error.message}`);
      }
    }

    console.log(`🔧 [S016] No analysis methods succeeded, returning empty`);
    return [];
  }

  async analyzeFileBasic(filePath, options = {}) {
    console.log(`🔧 [S016] analyzeFileBasic() called for: ${filePath}`);
    console.log(`🔧 [S016] semanticEngine exists: ${!!this.semanticEngine}`);
    console.log(`🔧 [S016] symbolAnalyzer exists: ${!!this.symbolAnalyzer}`);
    console.log(`🔧 [S016] regexAnalyzer exists: ${!!this.regexAnalyzer}`);

    try {
      // Try symbol-based analysis first
      if (
        this.semanticEngine?.isSymbolEngineReady?.() &&
        this.semanticEngine.project
      ) {
        if (this.verbose) {
          console.log(`🔍 [S016] Using symbol-based analysis for ${filePath}`);
        }

        const violations = await this.symbolAnalyzer.analyzeFileBasic(
          filePath,
          options
        );
        return violations;
      }
    } catch (error) {
      if (this.verbose) {
        console.warn(`⚠️ [S016] Symbol analysis failed: ${error.message}`);
      }
    }

    // Fallback to regex-based analysis
    if (this.verbose) {
      console.log(
        `🔄 [S016] Using regex-based analysis (fallback) for ${filePath}`
      );
    }

    console.log(`🔧 [S016] About to call regexAnalyzer.analyzeFileBasic()`);
    try {
      const result = await this.regexAnalyzer.analyzeFileBasic(
        filePath,
        options
      );
      console.log(
        `🔧 [S016] Regex analyzer returned: ${result.length} violations`
      );
      return result;
    } catch (error) {
      console.error(`🔧 [S016] Error in regex analyzer:`, error);
      return [];
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

module.exports = S016Analyzer;

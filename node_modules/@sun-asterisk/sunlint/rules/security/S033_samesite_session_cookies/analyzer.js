/**
 * S033 Main Analyzer - Set SameSite attribute for Session Cookies
 * Primary: Symbol-based analysis (when available)
 * Fallback: Regex-based for all other cases
 * Command: node cli.js --rule=S033 --input=examples/rule-test-fixtures/rules/S033_samesite_session_cookies --engine=heuristic
 */

const S033SymbolBasedAnalyzer = require("./symbol-based-analyzer.js");
const S033RegexBasedAnalyzer = require("./regex-based-analyzer.js");

class S033Analyzer {
  constructor(options = {}) {
    if (process.env.SUNLINT_DEBUG) {
      console.log(`🔧 [S033] Constructor called with options:`, !!options);
      console.log(
        `🔧 [S033] Options type:`,
        typeof options,
        Object.keys(options || {})
      );
    }

    this.ruleId = "S033";
    this.ruleName = "Set SameSite attribute for Session Cookies";
    this.description =
      "Set SameSite attribute for Session Cookies to reduce CSRF risk. This prevents the browser from sending cookies along with cross-site requests, mitigating CSRF attacks.";
    this.semanticEngine = options.semanticEngine || null;
    this.verbose = options.verbose || false;

    // Configuration
    this.config = {
      useSymbolBased: true, // Primary approach
      fallbackToRegex: true, // Secondary approach
      regexBasedOnly: false, // Can be set to true for pure mode
    };

    // Initialize analyzers
    try {
      this.symbolAnalyzer = new S033SymbolBasedAnalyzer(this.semanticEngine);
      if (process.env.SUNLINT_DEBUG) {
        console.log(`🔧 [S033] Symbol analyzer created successfully`);
      }
    } catch (error) {
      console.error(`🔧 [S033] Error creating symbol analyzer:`, error);
    }

    try {
      this.regexAnalyzer = new S033RegexBasedAnalyzer(this.semanticEngine);
      if (process.env.SUNLINT_DEBUG) {
        console.log(`🔧 [S033] Regex analyzer created successfully`);
      }
    } catch (error) {
      console.error(`🔧 [S033] Error creating regex analyzer:`, error);
    }
  }

  /**
   * Initialize analyzer with semantic engine
   */
  async initialize(semanticEngine) {
    this.semanticEngine = semanticEngine;

    if (process.env.SUNLINT_DEBUG) {
      console.log(`🔧 [S033] Main analyzer initializing...`);
    }

    // Initialize both analyzers
    if (this.symbolAnalyzer) {
      await this.symbolAnalyzer.initialize?.(semanticEngine);
    }
    if (this.regexAnalyzer) {
      await this.regexAnalyzer.initialize?.(semanticEngine);
    }

    // Clean up if needed
    if (this.regexAnalyzer) {
      this.regexAnalyzer.cleanup?.();
    }

    if (process.env.SUNLINT_DEBUG) {
      console.log(`🔧 [S033] Main analyzer initialized successfully`);
    }
  }

  /**
   * Single file analysis method for testing
   */
  analyzeSingle(filePath, options = {}) {
    if (process.env.SUNLINT_DEBUG) {
      console.log(`� [S033] analyzeSingle() called for: ${filePath}`);
    }

    // Return result using same format as analyze method
    return this.analyze([filePath], "typescript", options);
  }

  async analyze(files, language, options = {}) {
    if (process.env.SUNLINT_DEBUG) {
      console.log(
        `🔧 [S033] analyze() method called with ${files.length} files, language: ${language}`
      );
    }

    const violations = [];

    for (const filePath of files) {
      try {
        if (process.env.SUNLINT_DEBUG) {
          console.log(`🔧 [S033] Processing file: ${filePath}`);
        }

        const fileViolations = await this.analyzeFile(filePath, options);
        violations.push(...fileViolations);

        if (process.env.SUNLINT_DEBUG) {
          console.log(
            `🔧 [S033] File ${filePath}: Found ${fileViolations.length} violations`
          );
        }
      } catch (error) {
        console.warn(
          `⚠ [S033] Analysis failed for ${filePath}:`,
          error.message
        );
      }
    }

    if (process.env.SUNLINT_DEBUG) {
      console.log(`🔧 [S033] Total violations found: ${violations.length}`);
    }

    return violations;
  }

  async analyzeFile(filePath, options = {}) {
    if (process.env.SUNLINT_DEBUG) {
      console.log(`🔍 [S033] analyzeFile() called for: ${filePath}`);
    }

    // Create a Map to track unique violations and prevent duplicates
    const violationMap = new Map();

    // 1. Try Symbol-based analysis first (primary)
    if (
      this.config.useSymbolBased &&
      this.semanticEngine?.project &&
      this.semanticEngine?.initialized
    ) {
      try {
        if (process.env.SUNLINT_DEBUG) {
          console.log(`🔧 [S033] Trying symbol-based analysis...`);
        }
        const sourceFile = this.semanticEngine.project.getSourceFile(filePath);
        if (sourceFile) {
          if (process.env.SUNLINT_DEBUG) {
            console.log(`🔧 [S033] Source file found, analyzing...`);
          }
          const symbolViolations = await this.symbolAnalyzer.analyze(
            sourceFile,
            filePath
          );

          // Add to violation map with deduplication
          symbolViolations.forEach((violation) => {
            const key = `${violation.line}:${violation.column}:${violation.message}`;
            if (!violationMap.has(key)) {
              violationMap.set(key, violation);
            }
          });

          if (process.env.SUNLINT_DEBUG) {
            console.log(
              `🔧 [S033] Symbol analysis completed: ${symbolViolations.length} violations`
            );
          }
        } else {
          if (process.env.SUNLINT_DEBUG) {
            console.log(`🔧 [S033] Source file not found, falling back...`);
          }
        }
      } catch (error) {
        console.warn(`⚠ [S033] Symbol analysis failed:`, error.message);
      }
    }

    // 2. Try Regex-based analysis (fallback or additional)
    if (this.config.fallbackToRegex || this.config.regexBasedOnly) {
      try {
        if (process.env.SUNLINT_DEBUG) {
          console.log(`🔧 [S033] Trying regex-based analysis...`);
        }
        const regexViolations = await this.regexAnalyzer.analyze(filePath);

        // Add to violation map with deduplication
        regexViolations.forEach((violation) => {
          const key = `${violation.line}:${violation.column}:${violation.message}`;
          if (!violationMap.has(key)) {
            violationMap.set(key, violation);
          }
        });

        if (process.env.SUNLINT_DEBUG) {
          console.log(
            `🔧 [S033] Regex analysis completed: ${regexViolations.length} violations`
          );
        }
      } catch (error) {
        console.warn(`⚠ [S033] Regex analysis failed:`, error.message);
      }
    }

    // Convert Map values to array and add filePath to each violation
    const finalViolations = Array.from(violationMap.values()).map(
      (violation) => ({
        ...violation,
        filePath: filePath,
        file: filePath, // Also add 'file' for compatibility
      })
    );

    if (process.env.SUNLINT_DEBUG) {
      console.log(
        `🔧 [S033] File analysis completed: ${finalViolations.length} unique violations`
      );
    }

    return finalViolations;
  }

  /**
   * Clean up resources
   */
  cleanup() {
    if (this.symbolAnalyzer?.cleanup) {
      this.symbolAnalyzer.cleanup();
    }
    if (this.regexAnalyzer?.cleanup) {
      this.regexAnalyzer.cleanup();
    }
  }
}

module.exports = S033Analyzer;

/**
 * S025 Main Analyzer - Always validate client-side data on the server
 * Primary: Symbol-based analysis (when available)
 * Fallback: Regex-based for all other cases
 * Command: node cli.js --rule=S025 --input=examples/rule-test-fixtures/rules/S025_server_side_validation --engine=heuristic
 */

const S025SymbolBasedAnalyzer = require("./symbol-based-analyzer.js");
const S025RegexBasedAnalyzer = require("./regex-based-analyzer.js");

class S025Analyzer {
  constructor(options = {}) {
    if (process.env.SUNLINT_DEBUG) {
      console.log(`🔧 [S025] Constructor called with options:`, !!options);
      console.log(
        `🔧 [S025] Options type:`,
        typeof options,
        Object.keys(options || {})
      );
    }

    this.ruleId = "S025";
    this.ruleName = "Always validate client-side data on the server";
    this.description =
      "Ensure all client-side data is validated on the server. Client-side validation is not sufficient for security as it can be bypassed by attackers. Server-side validation is mandatory for data integrity and security.";
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
      this.symbolAnalyzer = new S025SymbolBasedAnalyzer(this.semanticEngine);
      if (process.env.SUNLINT_DEBUG) {
        console.log(`🔧 [S025] Symbol analyzer created successfully`);
      }
    } catch (error) {
      console.error(`🔧 [S025] Error creating symbol analyzer:`, error);
    }

    try {
      this.regexAnalyzer = new S025RegexBasedAnalyzer(this.semanticEngine);
      if (process.env.SUNLINT_DEBUG) {
        console.log(`🔧 [S025] Regex analyzer created successfully`);
      }
    } catch (error) {
      console.error(`🔧 [S025] Error creating regex analyzer:`, error);
    }
  }

  /**
   * Initialize analyzer with semantic engine
   */
  async initialize(semanticEngine) {
    this.semanticEngine = semanticEngine;

    if (process.env.SUNLINT_DEBUG) {
      console.log(`🔧 [S025] Main analyzer initializing...`);
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
      console.log(`🔧 [S025] Main analyzer initialized successfully`);
    }
  }

  /**
   * Single file analysis method for testing
   */
  analyzeSingle(filePath, options = {}) {
    if (process.env.SUNLINT_DEBUG) {
      console.log(`🔧 [S025] analyzeSingle() called for: ${filePath}`);
    }

    // Return result using same format as analyze method
    return this.analyze([filePath], "typescript", options);
  }

  async analyze(files, language, options = {}) {
    if (process.env.SUNLINT_DEBUG) {
      console.log(
        `🔧 [S025] analyze() method called with ${files.length} files, language: ${language}`
      );
    }

    const violations = [];

    for (const filePath of files) {
      try {
        if (process.env.SUNLINT_DEBUG) {
          console.log(`🔧 [S025] Processing file: ${filePath}`);
        }

        const fileViolations = await this.analyzeFile(filePath, options);
        violations.push(...fileViolations);

        if (process.env.SUNLINT_DEBUG) {
          console.log(
            `🔧 [S025] File ${filePath}: Found ${fileViolations.length} violations`
          );
        }
      } catch (error) {
        console.warn(
          `⚠ [S025] Analysis failed for ${filePath}:`,
          error.message
        );
      }
    }

    if (process.env.SUNLINT_DEBUG) {
      console.log(`🔧 [S025] Total violations found: ${violations.length}`);
    }

    return violations;
  }

  async analyzeFile(filePath, options = {}) {
    if (process.env.SUNLINT_DEBUG) {
      console.log(`🔍 [S025] analyzeFile() called for: ${filePath}`);
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
          console.log(`🔧 [S025] Trying symbol-based analysis...`);
        }
        const sourceFile = this.semanticEngine.project.getSourceFile(filePath);
        if (sourceFile) {
          if (process.env.SUNLINT_DEBUG) {
            console.log(`🔧 [S025] Source file found, analyzing...`);
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
              `🔧 [S025] Symbol analysis completed: ${symbolViolations.length} violations`
            );
          }
        } else {
          if (process.env.SUNLINT_DEBUG) {
            console.log(`🔧 [S025] Source file not found, falling back...`);
          }
        }
      } catch (error) {
        console.warn(`⚠ [S025] Symbol analysis failed:`, error.message);
      }
    }

    // 2. Try Regex-based analysis (fallback or additional)
    if (this.config.fallbackToRegex || this.config.regexBasedOnly) {
      try {
        if (process.env.SUNLINT_DEBUG) {
          console.log(`🔧 [S025] Trying regex-based analysis...`);
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
            `🔧 [S025] Regex analysis completed: ${regexViolations.length} violations`
          );
        }
      } catch (error) {
        console.warn(`⚠ [S025] Regex analysis failed:`, error.message);
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
        `🔧 [S025] File analysis completed: ${finalViolations.length} unique violations`
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

module.exports = S025Analyzer;

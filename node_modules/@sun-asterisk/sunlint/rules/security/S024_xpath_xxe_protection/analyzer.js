/**
 * S024 Main Analyzer - Protect against XPath Injection and XML External Entity (XXE)
 * Primary: Symbol-based analysis (when available)
 * Fallback: Regex-based for all other cases
 * Command: node cli.js --rule=S024 --input=examples/rule-test-fixtures/rules/S024_xpath_xxe_protection --engine=heuristic
 */

const S024SymbolBasedAnalyzer = require("./symbol-based-analyzer.js");
const S024RegexBasedAnalyzer = require("./regex-based-analyzer.js");

class S024Analyzer {
  constructor(options = {}) {
    if (process.env.SUNLINT_DEBUG) {
      console.log(`🔧 [S024] Constructor called with options:`, !!options);
      console.log(
        `🔧 [S024] Options type:`,
        typeof options,
        Object.keys(options || {})
      );
    }

    this.ruleId = "S024";
    this.ruleName = "Protect against XPath Injection and XML External Entity (XXE)";
    this.description =
      "Protect against XPath Injection and XML External Entity (XXE) attacks. XPath injection occurs when user input is used to construct XPath queries without proper sanitization. XXE attacks exploit XML parsers that process external entities, potentially leading to data disclosure, server-side request forgery, or denial of service.";
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
      this.symbolAnalyzer = new S024SymbolBasedAnalyzer(this.semanticEngine);
      if (process.env.SUNLINT_DEBUG) {
        console.log(`🔧 [S024] Symbol analyzer created successfully`);
      }
    } catch (error) {
      console.error(`🔧 [S024] Error creating symbol analyzer:`, error);
    }

    try {
      this.regexAnalyzer = new S024RegexBasedAnalyzer(this.semanticEngine);
      if (process.env.SUNLINT_DEBUG) {
        console.log(`🔧 [S024] Regex analyzer created successfully`);
      }
    } catch (error) {
      console.error(`🔧 [S024] Error creating regex analyzer:`, error);
    }
  }

  /**
   * Initialize analyzer with semantic engine
   */
  async initialize(semanticEngine) {
    this.semanticEngine = semanticEngine;

    if (process.env.SUNLINT_DEBUG) {
      console.log(`🔧 [S024] Main analyzer initializing...`);
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
      console.log(`🔧 [S024] Main analyzer initialized successfully`);
    }
  }

  /**
   * Single file analysis method for testing
   */
  analyzeSingle(filePath, options = {}) {
    if (process.env.SUNLINT_DEBUG) {
      console.log(`📊 [S024] analyzeSingle() called for: ${filePath}`);
    }

    // Return result using same format as analyze method
    return this.analyze([filePath], "typescript", options);
  }

  async analyze(files, language, options = {}) {
    if (process.env.SUNLINT_DEBUG) {
      console.log(
        `🔧 [S024] analyze() method called with ${files.length} files, language: ${language}`
      );
    }

    const violations = [];

    for (const filePath of files) {
      try {
        if (process.env.SUNLINT_DEBUG) {
          console.log(`🔧 [S024] Processing file: ${filePath}`);
        }

        const fileViolations = await this.analyzeFile(filePath, options);
        violations.push(...fileViolations);

        if (process.env.SUNLINT_DEBUG) {
          console.log(
            `🔧 [S024] File ${filePath}: Found ${fileViolations.length} violations`
          );
        }
      } catch (error) {
        console.warn(
          `⚠ [S024] Analysis failed for ${filePath}:`,
          error.message
        );
      }
    }

    if (process.env.SUNLINT_DEBUG) {
      console.log(`🔧 [S024] Total violations found: ${violations.length}`);
    }

    return violations;
  }

  async analyzeFile(filePath, options = {}) {
    if (process.env.SUNLINT_DEBUG) {
      console.log(`🔍 [S024] analyzeFile() called for: ${filePath}`);
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
          console.log(`🔧 [S024] Trying symbol-based analysis...`);
        }
        const sourceFile = this.semanticEngine.project.getSourceFile(filePath);
        if (sourceFile) {
          if (process.env.SUNLINT_DEBUG) {
            console.log(`🔧 [S024] Source file found, analyzing...`);
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
              `🔧 [S024] Symbol analysis completed: ${symbolViolations.length} violations`
            );
          }
        } else {
          if (process.env.SUNLINT_DEBUG) {
            console.log(`🔧 [S024] Source file not found, falling back...`);
          }
        }
      } catch (error) {
        console.warn(`⚠ [S024] Symbol analysis failed:`, error.message);
      }
    }

    // 2. Try Regex-based analysis (fallback or additional)
    if (this.config.fallbackToRegex || this.config.regexBasedOnly) {
      try {
        if (process.env.SUNLINT_DEBUG) {
          console.log(`🔧 [S024] Trying regex-based analysis...`);
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
            `🔧 [S024] Regex analysis completed: ${regexViolations.length} violations`
          );
        }
      } catch (error) {
        console.warn(`⚠ [S024] Regex analysis failed:`, error.message);
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
        `🔧 [S024] File analysis completed: ${finalViolations.length} unique violations`
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

module.exports = S024Analyzer;

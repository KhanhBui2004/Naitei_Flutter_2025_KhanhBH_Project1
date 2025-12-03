/**
 * S034 Main Analyzer - Use __Host- prefix for Session Cookies
 * Primary: Symbol-based analysis (when available)
 * Fallback: Regex-based for all other cases
 * Command: node cli.js --rule=S034 --input=examples/rule-test-fixtures/rules/S034_host_prefix_session_cookies --engine=heuristic
 */

const S034SymbolBasedAnalyzer = require("./symbol-based-analyzer.js");
const S034RegexBasedAnalyzer = require("./regex-based-analyzer.js");

class S034Analyzer {
  constructor(options = {}) {
    if (process.env.SUNLINT_DEBUG) {
      console.log(`🔧 [S034] Constructor called with options:`, !!options);
      console.log(
        `🔧 [S034] Options type:`,
        typeof options,
        Object.keys(options || {})
      );
    }

    this.ruleId = "S034";
    this.ruleName = "Use __Host- prefix for Session Cookies";
    this.description =
      "Use __Host- prefix for Session Cookies to prevent subdomain sharing. The __Host- prefix ensures cookies are only sent to the exact domain that set them, preventing subdomain cookie sharing attacks.";
    this.semanticEngine = options.semanticEngine || null;
    this.verbose = options.verbose || false;

    // Configuration - Use symbol-based as primary, regex for additional coverage
    this.config = {
      useSymbolBased: true, // Primary approach
      fallbackToRegex: true, // Additional coverage
      regexBasedOnly: false, // Can be set to true for pure mode
    };

    // Initialize analyzers
    try {
      this.symbolAnalyzer = new S034SymbolBasedAnalyzer(this.semanticEngine);
      if (process.env.SUNLINT_DEBUG) {
        console.log(`🔧 [S034] Symbol analyzer created successfully`);
      }
    } catch (error) {
      console.error(`🔧 [S034] Error creating symbol analyzer:`, error);
    }

    try {
      this.regexAnalyzer = new S034RegexBasedAnalyzer(this.semanticEngine);
      if (process.env.SUNLINT_DEBUG) {
        console.log(`🔧 [S034] Regex analyzer created successfully`);
      }
    } catch (error) {
      console.error(`🔧 [S034] Error creating regex analyzer:`, error);
    }
  }

  /**
   * Initialize analyzer with semantic engine
   */
  async initialize(semanticEngine) {
    this.semanticEngine = semanticEngine;

    if (process.env.SUNLINT_DEBUG) {
      console.log(`🔧 [S034] Main analyzer initializing...`);
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
      console.log(`🔧 [S034] Main analyzer initialized successfully`);
    }
  }

  /**
   * Single file analysis method for testing
   */
  analyzeSingle(filePath, options = {}) {
    if (process.env.SUNLINT_DEBUG) {
      console.log(`🔍 [S034] analyzeSingle() called for: ${filePath}`);
    }

    // Return result using same format as analyze method
    return this.analyze([filePath], "typescript", options);
  }

  async analyze(files, language, options = {}) {
    if (process.env.SUNLINT_DEBUG) {
      console.log(
        `🔧 [S034] analyze() method called with ${files.length} files, language: ${language}`
      );
    }

    const violations = [];

    for (const filePath of files) {
      try {
        if (process.env.SUNLINT_DEBUG) {
          console.log(`🔧 [S034] Processing file: ${filePath}`);
        }

        const fileViolations = await this.analyzeFile(filePath, options);
        violations.push(...fileViolations);

        if (process.env.SUNLINT_DEBUG) {
          console.log(
            `🔧 [S034] File ${filePath}: Found ${fileViolations.length} violations`
          );
        }
      } catch (error) {
        console.warn(
          `⚠ [S034] Analysis failed for ${filePath}:`,
          error.message
        );
      }
    }

    if (process.env.SUNLINT_DEBUG) {
      console.log(`🔧 [S034] Total violations found: ${violations.length}`);
    }

    return violations;
  }

  async analyzeFile(filePath, options = {}) {
    if (process.env.SUNLINT_DEBUG) {
      console.log(`🔍 [S034] analyzeFile() called for: ${filePath}`);
    }

    // Create a Map to track unique violations and prevent duplicates
    const violationMap = new Map();
    const lineToViolationMap = new Map(); // Track which lines already have violations

    // 1. Try Symbol-based analysis first (primary)
    if (
      this.config.useSymbolBased &&
      this.semanticEngine?.project &&
      this.semanticEngine?.initialized
    ) {
      try {
        if (process.env.SUNLINT_DEBUG) {
          console.log(`🔧 [S034] Trying symbol-based analysis...`);
        }
        const sourceFile = this.semanticEngine.project.getSourceFile(filePath);
        if (sourceFile) {
          if (process.env.SUNLINT_DEBUG) {
            console.log(`🔧 [S034] Source file found, analyzing...`);
          }
          const symbolViolations = await this.symbolAnalyzer.analyze(
            sourceFile,
            filePath
          );

          // Add symbol violations first (higher priority)
          symbolViolations.forEach((violation) => {
            // Extract cookie name from message for better deduplication
            const cookieNameMatch =
              violation.message.match(
                /(?:Session (?:cookie|middleware cookie name)|Set-Cookie.*?|NextAuth.*?) "([^"]+)"/
              ) ||
              violation.message.match(
                /Insecure session cookie:.*?(?:Session cookie|NextAuth.*?) "([^"]+)"/
              );
            const cookieName = cookieNameMatch ? cookieNameMatch[1] : "unknown";

            // Use specific key including column for exact match
            const specificKey = `${violation.line}:${
              violation.column || 1
            }:${cookieName}`;
            const lineKey = `${violation.line}:${cookieName}`;

            if (!violationMap.has(specificKey)) {
              violationMap.set(specificKey, {
                ...violation,
                source: "symbol", // Track source for debugging
              });

              // Also track by line for regex deduplication
              lineToViolationMap.set(lineKey, specificKey);
            }
          });

          if (process.env.SUNLINT_DEBUG) {
            console.log(
              `🔧 [S034] Symbol analysis completed: ${symbolViolations.length} violations`
            );
          }
        } else {
          if (process.env.SUNLINT_DEBUG) {
            console.log(`🔧 [S034] Source file not found, falling back...`);
          }
        }
      } catch (error) {
        console.warn(`⚠ [S034] Symbol analysis failed:`, error.message);
      }
    }

    // 2. Try Regex-based analysis (fallback or additional)
    if (this.config.fallbackToRegex || this.config.regexBasedOnly) {
      try {
        if (process.env.SUNLINT_DEBUG) {
          console.log(`🔧 [S034] Trying regex-based analysis...`);
        }
        const regexViolations = await this.regexAnalyzer.analyze(filePath);

        // Add regex violations only if not already covered by symbol analysis
        regexViolations.forEach((violation) => {
          // Extract cookie name from message for better deduplication
          const cookieNameMatch =
            violation.message.match(
              /(?:Session (?:cookie|middleware cookie name)|Set-Cookie.*?|NextAuth.*?) "([^"]+)"/
            ) ||
            violation.message.match(
              /Insecure session cookie:.*?(?:Session cookie|NextAuth.*?) "([^"]+)"/
            );
          const cookieName = cookieNameMatch ? cookieNameMatch[1] : "unknown";

          // Check if this line+cookie already has a violation from symbol analyzer
          const lineKey = `${violation.line}:${cookieName}`;

          if (!lineToViolationMap.has(lineKey)) {
            // No symbol violation for this line+cookie, add regex violation
            const specificKey = `${violation.line}:${
              violation.column || 1
            }:${cookieName}:regex`;

            if (!violationMap.has(specificKey)) {
              violationMap.set(specificKey, {
                ...violation,
                source: "regex", // Track source for debugging
              });
            }
          } else if (process.env.SUNLINT_DEBUG) {
            console.log(
              `🔧 [S034] Skipping duplicate regex violation at ${lineKey} (already covered by symbol)`
            );
          }
        });

        if (process.env.SUNLINT_DEBUG) {
          console.log(
            `🔧 [S034] Regex analysis completed: ${regexViolations.length} violations`
          );
        }
      } catch (error) {
        console.warn(`⚠ [S034] Regex analysis failed:`, error.message);
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
        `🔧 [S034] File analysis completed: ${finalViolations.length} unique violations`
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

module.exports = S034Analyzer;
